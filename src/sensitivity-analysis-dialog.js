import {Dialog} from "./dialog";
import {JobParametersBuilder} from "./jobs/job-parameters-builder";
import {Utils, log} from "sd-utils";
import {Templates} from "./templates";
import {i18n} from "./i18n/i18n";
import {AppUtils} from "./app-utils";
import {Tooltip} from "./tooltip";
import {LoadingIndicator} from "./loading-indicator";
import {Exporter} from "./exporter";
import {SensitivityAnalysisJobResultTable} from "./jobs/sensitivity-analysis-result-table";
import {ProbabilisticSensitivityAnalysisJobResultTable} from "./jobs/probabilistic-sensitivity-analysis-result-table";

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



        this.initButtons();
    }

    onOpen() {
        this.initJobConfigurations();

        let payoffConf = Utils.cloneDeep(this.app.config.format.payoff);
        payoffConf.style = 'decimal';
        this.payoffNumberFormat = new Intl.NumberFormat(this.app.config.format.locales, payoffConf);

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
        this.selectedJobConfig = jobConfig;
        this.jobSelect.node().value = jobConfig.jobName;
        this.job = this.computationsManager.getJobByName(this.selectedJobConfig.jobName);
        var jobParamsValues = {
           /* numberOfRuns: 100,

            variables: [
                {name: 'pr', min: 0, max: 1, length: 11, formula: "random(0,1)"},
                {name: 'sens', min: 0, max: 1, length: 11, formula: "random(0,1)"}
            ]*/
        };
        this.setJobParamsValues(jobParamsValues)
    }

    setJobParamsValues(jobParamsValues) {
        this.jobParameters = this.job.createJobParameters(jobParamsValues);
        this.jobParametersBuilder.setJobParameters(this.job.name, this.jobParameters, this.selectedJobConfig.customParamsConfig);
    }

    initJobConfigurations() {
        this.jobConfigurations.length = 0;
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
        /*this.jobConfigurations.push({
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
        });*/

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
            self.onJobSelected(Utils.find(self.jobConfigurations, c=>c.jobName === this.value))
        });
    }

    initResultTable(result) {
        let config = {
            onRowSelected: (rows, indexes, e)=> this.onResultRowSelected(rows, indexes, e)
        };
        if (this.resultTable) {
            this.resultTable.clear();
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
            this.disableActionButtonsAndShowLoadingIndicator();
            this.jobInstanceManager.terminate();
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

    clear(clearParams = false) {
        this.clearResults();
        this.setProgress(0);
        this.markAsError(false);
        if (clearParams || !this.selectedJobConfig) {
            this.onJobSelected(this.jobConfigurations[0]);
        } else if (this.jobParameters) {
            delete this.jobParameters.values.id;
            this.jobParameters.values.ruleName = this.computationsManager.getCurrentRule().name;
            this.setJobParamsValues(this.jobParameters.values);
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

    }

    onJobFailed(errors) {
        AppUtils.hide(this.stopJobButton);
        AppUtils.hide(this.backButton);
        AppUtils.hide(this.downloadCsvButtons);
        AppUtils.hide(this.clearButton);
        this.disableActionButtonsAndShowLoadingIndicator(false);
        this.markAsError();
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


        this.app.showPolicyPreview(this.result.policies[policyIndexes[0]], ()=> {
            this.resultTable.clearSelection();
        });

    }

    downloadCSV() {
        Exporter.saveAsCSV(this.getRows())
    }

    getRows() {
        var params = Utils.cloneDeep(this.jobParameters.values);
        params.extendedPolicyDescription=false;
        return this.job.jobResultToCsvRows(this.result, this.job.createJobParameters(params));
    }
}
