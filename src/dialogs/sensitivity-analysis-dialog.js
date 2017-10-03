import {Dialog} from "./dialog";
import {JobParametersBuilder} from "../jobs/job-parameters-builder";
import {Utils, log} from "sd-utils";
import {Templates} from "../templates";
import {i18n} from "../i18n/i18n";
import {AppUtils} from "../app-utils";
import {Tooltip} from "sd-tree-designer";
import {LoadingIndicator} from "../loading-indicator";
import {Exporter} from "../exporter";
import {SensitivityAnalysisJobResultTable} from "../jobs/sensitivity-analysis-result-table";
import {ProbabilisticSensitivityAnalysisJobResultTable} from "../jobs/probabilistic-sensitivity-analysis-result-table";
import {Policy} from "sd-computations/src/policies/policy";
import {TornadoDiagramPlot} from "../jobs/tornado-diagram-plot";
import {SpiderPlot} from "../jobs/spider-plot";

export class SensitivityAnalysisDialog extends Dialog {
    computationsManager;
    jobConfigurationContainer;

    jobConfigurations = [];
    jobInstanceManager;
    jobNameToParamValues = {};

    constructor(app) {
        super(app.container.select('.sd-sensitivity-analysis-dialog'), app);
        this.computationsManager = this.app.computationsManager;
        // this.initJobConfigurations();

        this.jobConfigurationContainer = this.container.select(".sd-sensitivity-analysis-job-configuration");
        this.parameterBuilderContainer = this.jobConfigurationContainer.select(".sd-job-parameters-builder");
        this.jobParametersBuilder = new JobParametersBuilder(this.parameterBuilderContainer, 'job', () => this.onJobParametersChanged());
        this.progressBarContainer = this.container.select(".sd-job-progress-bar-container");
        this.progressBar = this.progressBarContainer.select(".sd-progress-bar");
        this.jobResultsContainer = this.container.select(".sd-sensitivity-analysis-job-results");
        this.jobResultPlotContainer = this.jobResultsContainer.select(".sd-job-result-plot-container");

        this.debouncedCheckWarnings = Utils.debounce(()=>this.checkWarnings(), 200);

        this.initButtons();
        let self = this;
        document.addEventListener('SilverDecisionsRecomputedEvent', function (data) {
            if (data.detail === app && self.isVisible()) {
                self.onOpen();
            }
        });
    }

    onOpen() {

        this.initJobConfigurations();
        if (!this.jobSelect) {
            this.initJobSelect();
        }

        let payoffConf = Utils.cloneDeep(this.app.config.format.payoff1);
        payoffConf.style = 'decimal';
        payoffConf.useGrouping = false;
        this.payoffNumberFormat = new Intl.NumberFormat('en', payoffConf);
        // this.payoffNumberFormat = {
        //     format: v => this.app.computationsManager.expressionEngine.constructor.toFloat(v, payoffConf.maximumFractionDigits)
        // }

        this.clear();
    }

    onClosed() {
        this.clear();
        if (!this.jobInstanceManager) {
            return;
        }
        this.jobInstanceManager.terminate();
    }



    onJobSelected(jobConfig) {

        this.clearWarnings();
        this.selectedJobConfig = jobConfig;
        if (!jobConfig) {
            return;
        }
        this.jobSelect.node().value = jobConfig.jobName;
        let jobName = this.selectedJobConfig.jobName;
        this.job = this.computationsManager.getJobByName(jobName);

        var jobParamsValues = this.jobNameToParamValues[jobName] || {};

        this.setJobParamsValues(jobParamsValues)
    }

    refreshSelectedJobConfig() {
        if (this.selectedJobConfig) {
            this.selectedJobConfig = Utils.find(this.jobConfigurations, (c)=>c.jobName === this.selectedJobConfig.jobName);
        }
    }

    setJobParamsValues(jobParamsValues, deleteId = true) {
        if(!this.job){
            return;
        }
        this.refreshSelectedJobConfig();

        if(deleteId){
            delete jobParamsValues.id;
        }
        this.jobParameters = this.job.createJobParameters(jobParamsValues);

        this.jobNameToParamValues[this.job.name] = this.jobParameters.values;

        this.jobParametersBuilder.setJobParameters(this.job.name, this.jobParameters, this.selectedJobConfig.customParamsConfig);
    }

    onJobParametersChanged() {
        this.debouncedCheckWarnings();

    }

    getGlobalVariableNames() {
        return this.app.dataModel.getGlobalVariableNames(true);
    }

    initJobConfigurations() {
        let self = this;
        this.jobConfigurations.length = 0;
        let ExpressionEngine = this.app.expressionEngine.constructor;
        let customVariablesValidator = values => {
            var isValidArray = [];

            var names = [];
            values.forEach((v, i)=>{
                let isVariableInGlobalScope = self.app.dataModel.expressionScope.hasOwnProperty(v.name);
                var valid = names.indexOf(v.name)<0 && isVariableInGlobalScope;
                names.push(v.name);
                isValidArray.push(valid);
            });

            return isValidArray;
        };

        let largeScenariosNumberWarning = {
            name: 'largeScenariosNumber',
            data: {
                number: 10000,
                numberFormatted: "10,000"
            },
            check: function (jobParameters) { // called with this set to warning config object
                let combinations = jobParameters.values.variables.map(v => v.length).reduce((a, b) => a * (b || 1), 1);
                return combinations > this.data.number
            }
        };
        this.jobConfigurations.push({
            jobName: 'sensitivity-analysis',
            customParamsConfig: {
                'id': {
                    // value: undefined, //leave default,
                    hidden: true
                },
                'failOnInvalidTree': {
                    value: true,
                    hidden: true
                },
                'ruleName': {
                    value: this.computationsManager.getCurrentRule().name,
                    hidden: true
                },
                variables: {
                    name: {
                        options: this.getGlobalVariableNames()
                    },
                    _derivedValues:[
                        {
                            name: "step",
                            value: (variable) => {
                                if (variable.max === undefined || variable.max === null) {
                                    return "";
                                }
                                if (variable.min === undefined || variable.min === null) {
                                    return "";
                                }
                                if (variable.length === undefined || variable.length === null || variable.length < 2) {
                                    return "";
                                }
                                if (variable.min > variable.max) {
                                    return ""
                                }

                                try {
                                    return ExpressionEngine.toFloat(ExpressionEngine.divide(ExpressionEngine.subtract(variable.max, variable.min), variable.length-1))
                                }catch(e){
                                    return "";
                                }
                            }
                        }

                    ],
                    customValidator: customVariablesValidator

                }
            },
            warnings: [
                largeScenariosNumberWarning,
                {
                    name: 'largeParametersNumber',
                    data: {
                        number: 2,
                    },
                    check: function (jobParameters) { // called with this set to warning config object
                        return jobParameters.values.variables.length > this.data.number
                    }
                }
            ]
        });


        this.jobConfigurations.push({
            jobName: 'tornado-diagram',
            customParamsConfig: {
                'id': {
                    // value: undefined, //leave default,
                    hidden: true
                },
                'failOnInvalidTree': {
                    value: true,
                    hidden: true
                },
                'ruleName': {
                    value: this.computationsManager.getCurrentRule().name,
                    hidden: true
                },
                variables: {
                    name: {
                        options: this.getGlobalVariableNames()
                    },
                    _derivedValues:[
                        {
                            name: "defaultValue",
                            value: (variable)=>{
                                if(!variable.name) {
                                    return "";
                                }

                                try{
                                    return ExpressionEngine.toFloat(this.app.dataModel.expressionScope[variable.name])
                                }catch(e){
                                    return "";
                                }
                            }
                        },
                        {
                            name: "step",
                            value: (variable) => {
                                if (variable.max === undefined || variable.max === null) {
                                    return "";
                                }
                                if (variable.min === undefined || variable.min === null) {
                                    return "";
                                }
                                if (variable.length === undefined || variable.length === null || variable.length < 2) {
                                    return "";
                                }
                                if (variable.min > variable.max) {
                                    return ""
                                }

                                try{
                                    return ExpressionEngine.toFloat(ExpressionEngine.divide(ExpressionEngine.subtract(variable.max, variable.min), variable.length-1))
                                }catch(e){
                                    return "";
                                }
                            }
                        }

                    ],
                    customValidator: (values)=>{
                        let isValidNameArray = customVariablesValidator(values);

                        return values.map((v, i)=>{
                            if(!isValidNameArray[i]){
                                return false;
                            }

                            if (!v.name || v.min === undefined || v.min === null || v.max === undefined || v.max === null) {
                                return false;
                            }

                            let defVal = self.app.dataModel.expressionScope[v.name];
                            return v.min < defVal && v.max >  defVal;
                        });
                    }

                }
            },
            warnings: [{
                name: 'largeScenariosNumber',
                data: {
                    number: 10000,
                    numberFormatted: "10,000"
                },
                check: function (jobParameters) { // called with this set to warning config object
                    let combinations = jobParameters.values.variables.map(v => v.length).reduce((a, b) => a + b, 0);
                    return combinations > this.data.number
                }
            }]
        });

        this.jobConfigurations.push({
            jobName: 'probabilistic-sensitivity-analysis',
            customParamsConfig: {
                'id': {
                    hidden: true
                },
                'failOnInvalidTree': {
                    value: true,
                    hidden: true
                },
                'ruleName': {
                    value: this.computationsManager.getCurrentRule().name,
                    hidden: true
                },
                variables: {
                    name: {
                        options: this.getGlobalVariableNames()
                    },
                    formula:{
                        options: ExpressionEngine.randomMenuList,
                        optionsAutocomplete: true
                    },
                    customValidator: customVariablesValidator
                }
            },
            warnings: [largeScenariosNumberWarning]
        });

        this.jobConfigurations.push({
            jobName: 'spider-plot',
            customParamsConfig: {
                'id': {
                    // value: undefined, //leave default,
                    hidden: true
                },
                'failOnInvalidTree': {
                    value: true,
                    hidden: true
                },
                'ruleName': {
                    value: this.computationsManager.getCurrentRule().name,
                    hidden: true
                },
                variables: {
                    name: {
                        options: this.getGlobalVariableNames()
                    },
                    _derivedValues:[
                        {
                            name: "defaultValue",
                            value: (variable)=>{
                                if(!variable.name) {
                                    return "";
                                }

                                try{
                                    return ExpressionEngine.toFloat(this.app.dataModel.expressionScope[variable.name])
                                }catch(e){
                                    return "";
                                }
                            }
                        }

                    ],
                    customValidator: customVariablesValidator
                }
            },
            warnings: [{
                name: 'largeScenariosNumber',
                data: {
                    number: 10000,
                    numberFormatted: "10,000"
                },
                check: function (jobParameters) { // called with this set to warning config object
                    let combinations = jobParameters.values.length * jobParameters.values.variables.length;
                    return combinations > this.data.number
                }
            }]
        });

    }


    checkWarnings() {
        this.clearWarnings();
        if (!this.selectedJobConfig.warnings) {
            return;
        }

        this.selectedJobConfig.warnings.forEach(warnConf=> {
            if (warnConf.check.call(warnConf, this.jobParameters)) {
                this.addWarning(warnConf);
            }
        })
    }

    clearWarnings() {
        this.container.select(".sd-sensitivity-analysis-warnings").selectAll("*").remove();
    }

    addWarning(warnConf) {
        let msg = i18n.t("job." + this.job.name + ".warnings." + warnConf.name, warnConf.data);

        var msgHTML = Templates.get("warningMessage", {
            message: msg
        });
        this.container.select(".sd-sensitivity-analysis-warnings").appendSelector("div.sd-sensitivity-analysis-warning").html(msgHTML);
    }

    initJobSelect() {
        var self = this;
        this.jobSelect = this.container.select(".sd-job-select-input-group").html(Templates.get("selectInputGroup", {
            id: Utils.guid(),
            label: null,
            name: "sd-job-select",
            options: this.jobConfigurations.map(c=>({
                label: i18n.t("job." + c.jobName + ".name"),
                value: c.jobName
            }))
        })).select("select").on('change input', function (d) {
            self.onJobSelected(Utils.find(self.jobConfigurations, c=>c.jobName === this.value))
        });
    }

    initResultTable(result) {
        let config = {
            onRowSelected: (rows, indexes, e)=> this.onResultRowSelected(rows, indexes, e),
            className: "sd-" + this.job.name
        };
        if (this.resultTable) {
            this.resultTable.clear();
            this.resultTable.setClassName("sd-" + this.job.name);
            this.resultTable.hide();
        }

        if (this.job.name == "sensitivity-analysis") {
            this.resultTable = new SensitivityAnalysisJobResultTable(this.jobResultsContainer.select(".sd-job-result-table-container"), config);
            this.resultTable.setData(result, this.jobParameters, this.job);
            this.resultTable.show();
        } else if (this.job.name == "probabilistic-sensitivity-analysis") {
            this.resultTable = new ProbabilisticSensitivityAnalysisJobResultTable(this.jobResultsContainer.select(".sd-job-result-table-container"), config, (v) => this.payoffNumberFormat.format(v), (v) => this.app.probabilityNumberFormat.format(v));
            this.resultTable.setData(result, this.jobParameters, this.job);
            this.resultTable.show();

        }


    }

    disableActionButtonsAndShowLoadingIndicator(disable = true) {
        if (disable) {
            LoadingIndicator.show();
        } else {
            LoadingIndicator.hide();
        }
        this.container.select('.sd-sensitivity-analysis-action-buttons').selectAll('button').attr('disabled', disable ? 'disabled' : undefined)
    }

    initButtons() {
        this.runJobButton = this.container.select(".sd-run-job-button").on('click', ()=> {
            if (!this.jobParametersBuilder.validate()) {
                return;
            }
            this.disableActionButtonsAndShowLoadingIndicator();
            this.checkWarnings();

            this.computationsManager.runJobWithInstanceManager(this.job.name, this.jobParameters.values, {
                onJobStarted: this.onJobStarted,
                onJobCompleted: this.onJobCompleted,
                onJobFailed: this.onJobFailed,
                onJobStopped: this.onJobStopped,
                onJobTerminated: this.onJobTerminated,
                onProgress: this.onProgress,
                callbacksThisArg: this
            }).then(jobInstanceManager=> {
                this.jobInstanceManager = jobInstanceManager;
            }).catch(e=> {
                log.error(e);
            }).then(()=> {
                this.disableActionButtonsAndShowLoadingIndicator(false);
            })

        });

        this.resumeJobButton = this.container.select(".sd-resume-job-button").on('click', ()=> {
            if (!this.jobInstanceManager) {
                return;
            }
            this.disableActionButtonsAndShowLoadingIndicator();
            this.jobInstanceManager.resume();
        });

        this.stopJobButton = this.container.select(".sd-stop-job-button").on('click', ()=> {
            if (!this.jobInstanceManager) {
                return;
            }
            this.disableActionButtonsAndShowLoadingIndicator();
            this.jobInstanceManager.stop();
        });

        this.terminateJobButton = this.container.select(".sd-terminate-job-button").on('click', ()=> {
            if (!this.jobInstanceManager) {
                return;
            }
            this.terminateJob();
        });

        this.backButton = this.container.select(".sd-back-button ").on('click', ()=> {
            if (this.jobInstanceManager) {
                this.jobInstanceManager.terminate();
            }

        });

        this.downloadCsvButtons = this.container.select(".sd-download-csv-button ").on('click', ()=> {
            this.downloadCSV();
        });

        this.clearButton = this.container.select(".sd-clear-button ").on('click', ()=> {
            this.clear(true);
        });
    }

    loadSavedParamValues(jobNameToParamValues){
        this.jobNameToParamValues = jobNameToParamValues;
        this.selectedJobConfig = null;
        this.jobParameters = null;
    }


    clear(clearParams = false, clearAllParams = false) {
        this.clearResults();
        this.clearWarnings();
        this.setProgress(0);
        this.markAsError(false);

        if (!this.selectedJobConfig) {
            this.onJobSelected(this.jobConfigurations[0]);
        }

        if(clearAllParams){
            Utils.forOwn(this.jobNameToParamValues, (value, key)=> this.jobNameToParamValues[key] = {})
        }

        let globalVariableNames = this.getGlobalVariableNames();
        Utils.forOwn(this.jobNameToParamValues, (value, key)=> {
            let paramValues = value;
            if(clearAllParams){
                paramValues = {}
            }else if(paramValues.variables){
                paramValues.variables = paramValues.variables.filter(v=>globalVariableNames.indexOf(v.name)!==-1);
                if(!paramValues.variables.length){
                    paramValues.variables.push({})
                }
            }

            this.jobNameToParamValues[key] = paramValues;
        });

        if (this.job) {
            if (clearParams) {
                this.jobNameToParamValues[this.job.name] = {};
                this.setJobParamsValues({});
            } else {
                this.jobParameters.values.ruleName = this.computationsManager.getCurrentRule().name;
                this.setJobParamsValues(this.jobParameters.values);
            }
        }


        AppUtils.show(this.jobConfigurationContainer);
        AppUtils.show(this.runJobButton);
        AppUtils.show(this.clearButton);

        AppUtils.hide(this.resumeJobButton);
        AppUtils.hide(this.progressBarContainer);
        AppUtils.hide(this.stopJobButton);
        AppUtils.hide(this.downloadCsvButtons);
        AppUtils.hide(this.terminateJobButton);
        AppUtils.hide(this.jobResultsContainer);
        AppUtils.hide(this.backButton);
        this.disableActionButtonsAndShowLoadingIndicator(false);
    }

    clearResults() {
        if (this.resultTable) {
            this.resultTable.clear();
            this.resultTable.hide();

        }
        if(this.resultPlots){
            this.resultPlots.forEach(p=>p.destroy())
            this.jobResultPlotContainer.selectAll("*").remove();
        }
    }

    onJobStarted() {
        AppUtils.hide(this.jobConfigurationContainer);
        AppUtils.hide(this.runJobButton);
        AppUtils.hide(this.resumeJobButton);
        AppUtils.hide(this.backButton);
        AppUtils.hide(this.clearButton);
        AppUtils.hide(this.downloadCsvButtons);

        AppUtils.show(this.progressBarContainer);
        AppUtils.show(this.stopJobButton);
        AppUtils.show(this.terminateJobButton);

        this.disableActionButtonsAndShowLoadingIndicator(false);
        this.onProgress(this.jobInstanceManager ? this.jobInstanceManager.progress : null);

    }


    onJobCompleted(result) {
        AppUtils.show(this.jobResultsContainer);
        AppUtils.show(this.backButton);
        AppUtils.show(this.downloadCsvButtons);

        AppUtils.hide(this.progressBarContainer);
        AppUtils.hide(this.stopJobButton);
        AppUtils.hide(this.terminateJobButton);
        AppUtils.hide(this.clearButton);

        this.disableActionButtonsAndShowLoadingIndicator(false);
        this.displayResult(result)
    }

    displayResult(result) {
        log.debug(result);
        this.result = result;
        this.initResultTable(result);

        this.initResultPlots(result);



    }

    initResultPlots(result) {


        if (this.job.name === "tornado-diagram") {
            this.initTornadoResultPlots(result);
        } else if (this.job.name === "spider-plot") {
            this.initSpiderResultPlots(result);
        }



    }

    initTornadoResultPlots(result) {
        let self = this;
        this.resultPlots = [];

        result.policies.forEach((policy, index) => {

            let container = this.jobResultPlotContainer.selectOrAppend("div.sd-result-plot-container-"+index);
            let config = {
                policyIndex: index,
                maxWidth: self.app.config.leagueTable.plot.maxWidth,
            };

            let resultPlot = new TornadoDiagramPlot(container.node(), result, config);
            this.resultPlots.push(resultPlot);

            setTimeout(function () {
                resultPlot.init()
            }, 100)
        });

    }

    initSpiderResultPlots(result) {
        let self = this;
        this.resultPlots = [];

        result.policies.forEach((policy, index) => {

            let container = this.jobResultPlotContainer.selectOrAppend("div.sd-result-plot-container-"+index);
            let config = {
                policyIndex: index,
                maxWidth: self.app.config.leagueTable.plot.maxWidth,
            };

            let resultPlot = new SpiderPlot(container.node(), result, config);
            this.resultPlots.push(resultPlot);

            setTimeout(function () {
                resultPlot.init()
            }, 100)
        });

    }

    onResized() {
        if (this.resultPlots) {
            this.resultPlots.forEach(p=>p.init());

        }
    }

    terminateJob() {
        this.disableActionButtonsAndShowLoadingIndicator();
        this.jobInstanceManager.terminate();
    }

    onJobFailed(errors) {
        AppUtils.hide(this.stopJobButton);
        AppUtils.hide(this.backButton);
        AppUtils.hide(this.downloadCsvButtons);
        AppUtils.hide(this.clearButton);
        this.disableActionButtonsAndShowLoadingIndicator(false);
        this.markAsError();
        var self = this;
        setTimeout(function () {
            var errorMessage = "";
            errors.forEach((e, i)=> {
                if (i) {
                    errorMessage += "\n\n";
                }

                let msgKeyBase = "job." + self.job.name + ".errors.";
                let msgKey = msgKeyBase + e.message;
                let msg = i18n.t(msgKey, e.data);
                if (msg === msgKey) {
                    msg = i18n.t("job.errors.generic", e);
                }

                errorMessage += msg;
                if (e.data && e.data.variables) {
                    Utils.forOwn(e.data.variables, (value, key)=> {
                        errorMessage += "\n";
                        errorMessage += key + " = " + value;
                    })
                }
            });

            alert(errorMessage);
            self.terminateJob();
        }, 10);

    }

    markAsError(error = true) {
        this.container.classed('sd-job-error', error);
    }

    onJobStopped() {
        AppUtils.hide(this.stopJobButton);
        AppUtils.show(this.resumeJobButton);
        this.disableActionButtonsAndShowLoadingIndicator(false);

    }

    onJobTerminated() {
        this.clear();
    }

    onProgress(progress) {
        this.setProgress(progress)
    }

    setProgress(progress) {
        var percents = 0;
        var value = "0%";
        if (progress) {
            value = progress.current + " / " + progress.total;
            percents = progress.current * 100 / progress.total;
        }

        this.progressBar.style("width", percents + "%");
        this.progressBar.html(value)
    }


    onResultRowSelected(rows, indexes, event) {

        if (!rows.length) {
            return;
        }

        let policyIndexes = rows.map(r=>r.policyIndex).filter((value, index, self)=>self.indexOf(value) === index);

        if (policyIndexes.length > 1) {
            Tooltip.show(i18n.t('jobResultTable.tooltip.multiplePoliciesInCell', {number: policyIndexes.length}), 5, 28, event, 2000);
            return;
        }


        let policy = this.result.policies[policyIndexes[0]];
        let title = Policy.toPolicyString(policy, false);

        if(rows.length==1){

            let row = rows[0];
            if(row.variables){
                title = '';
                this.result.variableNames.forEach((v, i)=>{
                    if(i){
                        title += "; "
                    }
                    title += v + " = " + row.variables[i];
                });
            }
        }

        this.app.showPolicyPreview(title, policy, ()=> {
            this.resultTable.clearSelection();
        });

    }

    downloadCSV() {
        Exporter.saveAsCSV(this.getRows())
    }

    getRows() {
        var params = Utils.cloneDeep(this.jobParameters.values);
        params.extendedPolicyDescription = false;
        return this.job.jobResultToCsvRows(this.result, this.job.createJobParameters(params));
    }


}
