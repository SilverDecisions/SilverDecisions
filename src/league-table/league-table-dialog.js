import {Dialog} from "../dialog";
import {Utils, log} from "sd-utils";
import {Templates} from "../templates";
import {i18n} from "../i18n/i18n";
import {AppUtils} from "../app-utils";
import {LoadingIndicator} from "../loading-indicator";
import {Exporter} from "../exporter";
import {LeagueTable} from "./league-table";
import {Policy} from "sd-computations/src/policies/policy";

export class LeagueTableDialog extends Dialog {
    computationsManager;
    jobInstanceManager;

    constructor(app) {
        super(app.container.select('.sd-league-table-dialog'), app);
        this.computationsManager = this.app.computationsManager;
        this.progressBarContainer = this.container.select(".sd-job-progress-bar-container");
        this.progressBar = this.progressBarContainer.select(".sd-progress-bar");
        this.jobResultsContainer = this.container.select(".sd-league-table-job-results");
        this.initButtons();

        this.job = this.computationsManager.getJobByName("league-table");
    }

    onOpen() {
        this.clear();
        this.runJob();
    }

    onClosed() {
        this.clear();
        if (!this.jobInstanceManager) {
            return;
        }
        this.jobInstanceManager.terminate();
    }

    clearWarnings() {
        this.container.select(".sd-league-table-warnings").selectAll("*").remove();
    }

    addWarning(warnConf) {
        let msg = i18n.t("job." + this.job.name + ".warnings." + warnConf.name, warnConf.data);

        var msgHTML = Templates.get("warningMessage", {
            message: msg
        });
        this.container.select(".sd-league-table-warnings").appendSelector("div.sd-league-table-warning").html(msgHTML);
    }

    initResultTable(result) {
        let config = {
            onRowSelected: (row, i)=> this.onResultRowSelected(row, i),
        };

        if (this.resultTable) {
            this.resultTable.clear();
            this.resultTable.hide();
        }


        this.resultTable = new LeagueTable(this.jobResultsContainer.select(".sd-job-result-table-container"), config);
        this.resultTable.setData(result, this.app.dataModel);
        this.resultTable.show();
    }

    disableActionButtonsAndShowLoadingIndicator(disable = true) {
        if (disable) {
            LoadingIndicator.show();
        } else {
            LoadingIndicator.hide();
        }
        this.container.select('.sd-league-table-action-buttons').selectAll('button').attr('disabled', disable ? 'disabled' : undefined)
    }

    runJob() {

        this.disableActionButtonsAndShowLoadingIndicator();

        this.jobParameters = this.job.createJobParameters({
            ruleName: this.computationsManager.getCurrentRule().name
        });
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
    }

    initButtons() {

        this.downloadCsvButtons = this.container.select(".sd-download-csv-button ").on('click', ()=> {
            this.downloadCSV();
        });

        this.clearButton = this.container.select(".sd-clear-button ").on('click', ()=> {
            this.clear(true);
        });
    }

    clear() {
        this.clearResults();
        this.clearWarnings();
        this.setProgress(0);
        this.markAsError(false);

        AppUtils.hide(this.progressBarContainer);
        AppUtils.hide(this.downloadCsvButtons);
        AppUtils.hide(this.jobResultsContainer);
        this.disableActionButtonsAndShowLoadingIndicator(false);
    }

    clearResults() {
        if (this.resultTable) {
            this.resultTable.clear();
            this.resultTable.hide();

        }

    }

    onJobStarted() {
        AppUtils.hide(this.downloadCsvButtons);

        AppUtils.show(this.progressBarContainer);

        this.disableActionButtonsAndShowLoadingIndicator(false);
        this.onProgress(this.jobInstanceManager ? this.jobInstanceManager.progress : null);

    }


    onJobCompleted(result) {
        AppUtils.show(this.jobResultsContainer);
        AppUtils.show(this.downloadCsvButtons);

        AppUtils.hide(this.progressBarContainer);
        this.disableActionButtonsAndShowLoadingIndicator(false);
        this.displayResult(result)
    }

    displayResult(result) {
        log.debug(result);
        this.result = result;
        this.initResultTable(result);

    }

    terminateJob() {
        this.disableActionButtonsAndShowLoadingIndicator();
        this.jobInstanceManager.terminate();
    }

    onJobFailed(errors) {
        AppUtils.hide(this.downloadCsvButtons);
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


    onResultRowSelected(row, index) {
        let title = Policy.toPolicyString(row.policy, false);
        this.app.showPolicyPreview(title, row.policy, ()=> {
            this.resultTable.clearSelection();
        });
    }

    downloadCSV() {
        Exporter.saveAsCSV(this.getRows(), 'leaguetable')
    }

    getRows() {
        var params = Utils.cloneDeep(this.jobParameters.values);
        params.extendedPolicyDescription = false;
        return this.job.jobResultToCsvRows(this.result, this.job.createJobParameters(params));
    }
}
