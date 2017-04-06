import {Utils} from "sd-utils";
import {i18n} from "../i18n/i18n";
import * as d3 from "../d3";
import {PivotTable} from "../pivot-table";
import {JobResultTable} from "./job-result-table";
import {Policy} from "sd-computations/src/policies/policy";
var jQuery = require('jquery');


export class SensitivityAnalysisJobResultTable extends JobResultTable{

    setData(jobResult, jobParameters, job) {
        this.jobResult = jobResult;
        var csvDAta = job.jobResultToCsvRows(jobResult, jobParameters);

        if(csvDAta.length) {
            csvDAta[0][0] = 'policy\nnumber'
        }

        var data = {rows: ['policy', jobResult.variableNames[0]], cols: [], vals:['payoff'], data: csvDAta};

        super.setData(data)
    }

    clickCallback(e, value, filters, pivotData) {
        var self=this;
        var selectedIndexes = [];
        var selectedRows = []
        pivotData.forEachMatchingRecord(filters, record=> {
            selectedIndexes.push(record['$rowIndex'])
            selectedRows.push(self.jobResult.rows[record['$rowIndex']]);
        });
        self.config.onRowSelected(selectedRows, selectedIndexes, e)

    }
}
