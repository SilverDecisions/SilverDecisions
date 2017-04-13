import {JobResultTable} from "./job-result-table";
import {Utils} from "sd-utils"


export class SensitivityAnalysisJobResultTable extends JobResultTable {

    setData(jobResult, jobParameters, job) {
        this.jobResult = jobResult;

        jobParameters =job.createJobParameters(Utils.cloneDeep(jobParameters.values));
        jobParameters.values.roundVariables = true;
        var csvDAta = job.jobResultToCsvRows(jobResult, jobParameters);

        if (csvDAta.length) {
            csvDAta[0][0] = 'policy\nnumber'
        }

        let cols = [];
        let totalInColNum = 1;

        jobParameters.values.variables.forEach(v=>{
            let _totalInColNum = v.length * totalInColNum;
            if((_totalInColNum>1000)){
                return;
            }
            totalInColNum=_totalInColNum;
            cols.push(v.name);
        });

        var data = {rows: ['policy'], cols: cols, vals: ['payoff'], data: csvDAta};
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
