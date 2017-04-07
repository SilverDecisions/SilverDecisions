import {JobResultTable} from "./job-result-table";
var jQuery = require('jquery');


export class SensitivityAnalysisJobResultTable extends JobResultTable {

    setData(jobResult, jobParameters, job) {
        this.jobResult = jobResult;
        var csvDAta = job.jobResultToCsvRows(jobResult, jobParameters);

        if (csvDAta.length) {
            csvDAta[0][0] = 'policy\nnumber'
        }

        var data = {rows: ['policy'], cols: jobResult.variableNames.slice(), vals: ['payoff'], data: csvDAta};
        super.setData(data)
    }

    clickCallback(e, value, filters, pivotData) {
        var self = this;
        var selectedIndexes = [];
        var selectedRows = [];
        pivotData.forEachMatchingRecord(filters, record=> {
            selectedIndexes.push(record['$rowIndex']);
            selectedRows.push(self.jobResult.rows[record['$rowIndex']]);
        });
        self.config.onRowSelected(selectedRows, selectedIndexes, e)

    }
}
