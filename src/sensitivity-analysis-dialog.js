import {Dialog} from "./dialog";
import {JobParametersBuilder} from "./jobs/job-parameters-builder";
import {Utils, log} from 'sd-utils'
import {Templates} from "./templates";
import {i18n} from "./i18n/i18n";
import {AppUtils} from "./app-utils";
import {JobResultTable} from "./jobs/job-result-table";
import {Tooltip} from "./tooltip";

export class SensitivityAnalysisDialog extends Dialog {
    computationsManager;
    jobConfigurationContainer;

    jobConfigurations = [];
    jobInstanceManager;

    constructor(app) {
        super(app.container.select('.sd-sensitivity-analysis-dialog'), app);
        this.computationsManager = this.app.computationsManager;
        this.initJobConfigurations();
        this.initJobSelect();

        this.jobConfigurationContainer = this.container.select(".sd-sensitivity-analysis-job-configuration");
        this.parameterBuilderContainer = this.jobConfigurationContainer.select(".sd-job-parameters-builder");
        this.jobParametersBuilder = new JobParametersBuilder(this.parameterBuilderContainer, 'job');
        this.progressBarContainer = this.container.select(".sd-job-progress-bar-container");
        this.progressBar = this.progressBarContainer.select(".sd-progress-bar");
        this.jobResultsContainer = this.container.select(".sd-sensitivity-analysis-job-results");
        this.initResultTable();
        this.initButtons();
    }

    clear(clearParams=true){
        this.resultTable.clear();
        this.setProgress(0);
        this.markAsError(false);
        if(clearParams || !this.selectedJobConfig){
            this.onJobSelected(this.jobConfigurations[0]);
        }else if(this.jobParameters){
            delete this.jobParameters.values.id;
            this.jobParameters = this.job.createJobParameters(this.jobParameters.values);
        }

        AppUtils.show(this.jobConfigurationContainer);
        AppUtils.show(this.runJobButton);
        AppUtils.show(this.clearButton);

        AppUtils.hide(this.resumeJobButton);
        AppUtils.hide(this.progressBarContainer);
        AppUtils.hide(this.stopJobButton);
        AppUtils.hide(this.terminateJobButton);
        AppUtils.hide(this.jobResultsContainer);
        AppUtils.hide(this.backButton);
    }

    onOpen() {
        this.initJobConfigurations();
        this.clear();
    }

    onClosed() {
        this.clear();
        if(!this.jobInstanceManager){
            return;
        }
        this.jobInstanceManager.terminate();
    }

    onJobSelected(jobConfig){
        this.selectedJobConfig = jobConfig;
        this.jobSelect.node().value = jobConfig.jobName;
        this.job  =  this.computationsManager.getJobByName(this.selectedJobConfig.jobName);
        var jobParamsValues = {
           /* numberOfRuns: 100,
            variables: [
                {name: 'p', min: 0, max: 1, length: 11, formula: "random(0,1)"},
                {name: 'a', min: 1, max: 10, length: 10,  formula: "random(-10,10)"}
            ]*/
        };
        this.jobParameters = this.job.createJobParameters(jobParamsValues);
        this.jobParametersBuilder.setJobParameters(this.job.name, this.jobParameters, this.selectedJobConfig.customParamsConfig);
    }

    initJobConfigurations() {
        this.jobConfigurations.length=0;
        this.jobConfigurations.push({
            jobName: 'sensitivity-analysis',
            customParamsConfig: {
                'id': {
                    // value: undefined, //leave default,
                    hidden: true
                },
                'ruleName': {
                    value: this.computationsManager.getCurrentRule().name,
                    hidden: true
                }
            }
        });
        this.jobConfigurations.push({
            jobName: 'tornado-diagram',
            customParamsConfig: {
                'id': {
                    hidden: true
                },
                'ruleName': {
                    value: this.computationsManager.getCurrentRule().name,
                    hidden: true
                }
            }
        });

        this.jobConfigurations.push({
            jobName: 'probabilistic-sensitivity-analysis',
            customParamsConfig: {
                'id': {
                    hidden: true
                },
                'ruleName': {
                    value: this.computationsManager.getCurrentRule().name,
                    hidden: true
                }
            }
        });

    }

    initJobSelect() {
        var self = this;
        this.jobSelect = this.container.select(".sd-job-select-input-group").html(Templates.get("selectInputGroup", {
            id: Utils.guid(),
            label: i18n.t("sensitivityAnalysisDialog.jobSelect"),
            name: "sd-job-select",
            options: this.jobConfigurations.map(c=>({
                label: i18n.t("job." + c.jobName + ".name"),
                value: c.jobName
            }))
        })).select("select").on('change input', function (d) {
            self.onJobSelected(Utils.find(self.jobConfigurations, c=>c.jobName===this.value))
        });
    }

    initResultTable() {
        this.resultTable = new JobResultTable(this.jobResultsContainer.select(".sd-job-result-table-container"), {
            onRowSelected: (rows, indexes, e)=> this.onResultRowSelected(rows, indexes, e)
        });
    }

    initButtons() {
        this.runJobButton = this.container.select(".sd-run-job-button").on('click', ()=>{
            if(!this.jobParametersBuilder.validate()){
                return;
            }

            this.computationsManager.runJobWithInstanceManager(this.job.name, this.jobParameters.values, {
                onJobStarted: this.onJobStarted,
                onJobCompleted: this.onJobCompleted,
                onJobFailed: this.onJobFailed,
                onJobStopped: this.onJobStopped,
                onJobTerminated: this.onJobTerminated,
                onProgress: this.onProgress,
                callbacksThisArg: this
            }).then(jobInstanceManager=>{
                this.jobInstanceManager = jobInstanceManager;
            }).catch(e=>{
                log.error(e);
            })
        });

        this.resumeJobButton = this.container.select(".sd-resume-job-button").on('click', ()=>{
            if(!this.jobInstanceManager){
                return;
            }
            this.jobInstanceManager.resume();
        });

        this.stopJobButton = this.container.select(".sd-stop-job-button").on('click', ()=>{
            if(!this.jobInstanceManager){
                return;
            }
            this.jobInstanceManager.stop();
        });

        this.terminateJobButton = this.container.select(".sd-terminate-job-button").on('click', ()=>{
            if(!this.jobInstanceManager){
                return;
            }
            this.jobInstanceManager.terminate();
        });

        this.backButton = this.container.select(".sd-back-button ").on('click', ()=>{
            if(this.jobInstanceManager){
                this.jobInstanceManager.terminate();
            }

        });

        this.clearButton = this.container.select(".sd-clear-button ").on('click', ()=>{
            this.clear(true);
        });
    }

    onJobStarted(){
        AppUtils.hide(this.jobConfigurationContainer);
        AppUtils.hide(this.runJobButton);
        AppUtils.hide(this.resumeJobButton);
        AppUtils.hide(this.backButton);
        AppUtils.hide(this.clearButton);

        AppUtils.show(this.progressBarContainer);
        AppUtils.show(this.stopJobButton);
        AppUtils.show(this.terminateJobButton);

        this.onProgress(this.jobInstanceManager ? this.jobInstanceManager.progress : null);

    }


    onJobCompleted(result){
        AppUtils.show(this.jobResultsContainer);
        AppUtils.show(this.backButton);

        AppUtils.hide(this.progressBarContainer);
        AppUtils.hide(this.stopJobButton);
        AppUtils.hide(this.terminateJobButton);
        AppUtils.hide(this.clearButton);

        this.displayResult(result)
    }

    displayResult(result){
        log.debug(result);
        this.resultTable.setData(result);
    }

    onJobFailed(errors){
        AppUtils.hide(this.stopJobButton);
        AppUtils.hide(this.backButton);
        AppUtils.hide(this.clearButton);
        this.markAsError();
    }

    markAsError(error=true){
        this.container.classed('sd-job-error', error);
    }

    onJobStopped(){
        AppUtils.hide(this.stopJobButton);
        AppUtils.show(this.resumeJobButton);

    }

    onJobTerminated(){
        this.clear();
    }

    onProgress(progress){
       this.setProgress(progress)
    }

    setProgress(progress){
        var percents = 0;
        var value="0%";
        if(progress){
            value = progress.current+" / "+progress.total;
            percents = progress.current * 100 /progress.total;
        }

        this.progressBar.style("width", percents+"%");
        this.progressBar.html(value)
    }


    onResultRowSelected(rows, indexes, event) {
        if(rows.length===1) {
            this.app.showTreePreview(rows[0].data, ()=>{
                this.resultTable.clearSelection();
            });
            return;
        }

        Tooltip.show(rows.length + ' rows', 5, 28, event, 2000);

    }
}
