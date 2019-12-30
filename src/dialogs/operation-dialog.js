import {Dialog} from "./dialog";
import {JobParametersBuilder} from "../jobs/job-parameters-builder";
import {Utils, log} from "sd-utils";
import {Templates} from "../templates";
import {i18n} from "../i18n/i18n";
import {AppUtils} from "../app-utils";
import {LoadingIndicator} from "../loading-indicator";

export class OperationDialog extends Dialog {
    computationsManager;
    jobConfigurationContainer;

    jobConfigurations = [];
    jobInstanceManager;
    jobNameToParamValues = {};

    constructor(app) {
        super(app.container.select('.sd-operation-dialog'), app);
        this.computationsManager = this.app.computationsManager;

        this.jobConfigurationContainer = this.container.select(".sd-operation-job-configuration");
        this.parameterBuilderContainer = this.jobConfigurationContainer.select(".sd-job-parameters-builder");
        this.jobParametersBuilder = new JobParametersBuilder(this.parameterBuilderContainer, 'job', () => this.onJobParametersChanged());
        this.progressBarContainer = this.container.select(".sd-job-progress-bar-container");
        this.progressBar = this.progressBarContainer.select(".sd-progress-bar");
        this.dialogTitle = this.container.select(".sd-modal-header-title");

        this.debouncedCheckWarnings = Utils.debounce(()=>this.checkWarnings(), 200);
        this.initButtons();

    }

    openWith(object, operation){
        const self = this;

        this.object = object;
        this.operation = operation;
        this.dialogTitle.text(i18n.t('job.payoffs-transformation.name'))

        return new Promise((resolve, reject) => {
            self.resolve = resolve;
            self.open();
        });
    }

    onOpen() {
        this.job = this.computationsManager.getJobByName(this.operation.jobName);
        this.setJobParamsValues({});
    }

    onClosed() {
        const r = this.resolve;
        this.clear();
        r();
    }

    setJobParamsValues(jobParamsValues, deleteId = true) {
        if(!this.job){
            return;
        }

        if(deleteId){
            delete jobParamsValues.id;
        }

        this.jobParameters = this.job.createJobParameters(jobParamsValues);


        this.jobParametersBuilder.setJobParameters(this.job.name, this.jobParameters,  {
            'id': {
                hidden: true
            },
            'objectId': {
                value: this.object.id,
                hidden: true
            }
        });
    }


    clearWarnings() {
        this.container.select(".sd-operation-warnings").selectAll("*").remove();
    }

    addWarning(warnConf) {
        let msg = i18n.t("job." + this.job.name + ".warnings." + warnConf.name, warnConf.data);

        var msgHTML = Templates.get("warningMessage", {
            message: msg
        });
        this.container.select(".sd-operation-warnings").appendSelector("div.sd-operation-warning").html(msgHTML);
    }

    disableActionButtonsAndShowLoadingIndicator(disable = true) {
        if (disable) {
            LoadingIndicator.show();
        } else {
            LoadingIndicator.hide();
        }
        this.container.select('.sd-operation-action-buttons').selectAll('button').attr('disabled', disable ? 'disabled' : undefined)
    }

    initButtons() {
        this.runJobButton = this.container.select(".sd-run-job-button").on('click', this.runOperation.bind(this));

    }

    runOperation(){
        if (!this.jobParametersBuilder.validate()) {
            return;
        }
        this.disableActionButtonsAndShowLoadingIndicator();

        this.onJobStarted();
        this.computationsManager.performOperation(this.object, this.operation.name, this.jobParameters.values).catch(e=> {
            log.error(e);
            this.onJobFailed(e);
        }).then(()=> {
            this.disableActionButtonsAndShowLoadingIndicator(false);
            let promise = this.app.checkValidityAndRecomputeObjective(false, true);
            this.close();
            return promise;
        });
    }


    onJobParametersChanged() {

    }

    clear(clearParams = false) {
        this.resolve = null;
        this.clearWarnings();
        this.markAsError(false);


        if (this.job) {
            if (clearParams) {
                this.setJobParamsValues({});
            } else {
                this.setJobParamsValues(this.jobParameters.values);
            }
        }


        AppUtils.show(this.jobConfigurationContainer);
        AppUtils.show(this.runJobButton);

        this.disableActionButtonsAndShowLoadingIndicator(false);
    }

    onJobStarted() {
        AppUtils.hide(this.jobConfigurationContainer);
        AppUtils.hide(this.runJobButton);
        this.disableActionButtonsAndShowLoadingIndicator(false);
    }



    onJobFailed(errors) {
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




}
