import {Dialog} from "./dialog";
import {JobParametersBuilder} from "./jobs/job-parameters-builder";
import {Utils, log} from 'sd-utils'
import {Templates} from "./templates";
import {i18n} from "./i18n/i18n";
import {AppUtils} from "./app-utils";
import {JobResultTable} from "./jobs/job-result-table";

export class SensitivityAnalysisDialog extends Dialog {
    computationsManager;
    jobConfigurationContainer;

    jobConfigurations = [];
    jobInstanceManager;

    treePreviewMode = false;

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

    clear(){
        this.treePreviewMode = false;
        this.setProgress(0);
        this.onJobSelected(this.jobConfigurations[0]);
        AppUtils.show(this.jobConfigurationContainer);
        AppUtils.show(this.runJobButton);

        AppUtils.hide(this.resumeJobButton);
        AppUtils.hide(this.progressBarContainer);
        AppUtils.hide(this.stopJobButton);
        AppUtils.hide(this.terminateJobButton);
        AppUtils.hide(this.jobResultsContainer);
    }

    onOpen() {
        if(this.treePreviewMode){
            this.treePreviewMode=false;
            this.app.exitTreePreview();
            return;
        }
        this.clear();
    }

    onClosed() {
        if(this.treePreviewMode){
            return;
        }
        this.clear();
        if(!this.jobInstanceManager){
            return;
        }
        this.jobInstanceManager.terminate();
    }

    onJobSelected(jobConfig){
        this.selectedJobConfig = jobConfig;
        this.job  =  this.computationsManager.getJobByName(this.selectedJobConfig.jobName);
        var jobParamsValues = {
           /* variables: [
                {name: 'p', min: 0, max: 1, length: 11},
                {name: 'a', min: 1, max: 10, length: 10}
            ]*/
        };
        this.jobParameters = this.job.createJobParameters(jobParamsValues);
        this.jobParametersBuilder.setJobParameters(this.job.name, this.jobParameters, this.selectedJobConfig.customParamsConfig);
    }

    initJobConfigurations() {

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
        this.container.select(".sd-job-select-input-group").html(Templates.get("selectInputGroup", {
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
            onRowSelected: (row, index)=> this.onResultRowSelected(row, index)
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
    }

    onJobStarted(){
        AppUtils.hide(this.jobConfigurationContainer);
        AppUtils.hide(this.runJobButton);
        AppUtils.hide(this.resumeJobButton);

        AppUtils.show(this.progressBarContainer);
        AppUtils.show(this.stopJobButton);
        AppUtils.show(this.terminateJobButton);

        this.onProgress(this.jobInstanceManager ? this.jobInstanceManager.progress : 0);

    }


    onJobCompleted(result){
        AppUtils.show(this.jobResultsContainer);
        AppUtils.hide(this.progressBarContainer);
        AppUtils.hide(this.stopJobButton);
        AppUtils.hide(this.terminateJobButton);

        this.displayResult(result)
    }

    displayResult(result){
        log.debug(result);
        this.resultTable.setData(result);
    }

    onJobFailed(errors){
        AppUtils.hide(this.stopJobButton);
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
        var value = progress+"%";
        this.progressBar.style("width", value)
        this.progressBar.html(value)
    }


    onResultRowSelected(row, index) {
        this.treePreviewMode = true;
        this.app.showTreePreview(row.data);
        this.close();
    }
}
