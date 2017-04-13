import {JobResultTable} from "./job-result-table";
import {Policy} from "sd-computations/src/policies/policy";
import {log} from "sd-utils";
import {i18n} from "../i18n/i18n";
var jQuery = require('jquery');


export class ProbabilisticSensitivityAnalysisJobResultTable extends JobResultTable {

    constructor(container, config, payoffNumberFormatter, probabilityNumberFormatter){
        super(container, config);
        this.payoffNumberFormatter = payoffNumberFormatter;
        this.probabilityNumberFormatter = probabilityNumberFormatter;
    }

    setData(jobResult, jobParameters, job) {
        this.jobResult = jobResult;
        var data = {rows: ['policy', 'expected value', 'median', 'standard deviation', 'best probability'], cols: [], vals: ['expected value'], data: []};


        data.data.push(['policy', 'expected value', 'median', 'standard deviation', 'best probability']);
        jobResult.policies.forEach((policy, i)=> {
            var row = [
                Policy.toPolicyString(policy, jobParameters.values.extendedPolicyDescription),
                this.payoffNumberFormatter(jobResult.expectedValues[i]),
                this.payoffNumberFormatter(jobResult.medians[i]),
                this.payoffNumberFormatter(jobResult.standardDeviations[i]),
                this.probabilityNumberFormatter(jobResult.policyIsBestProbabilities[i])
            ];
            data.data.push(row);
        });

        log.trace(data);
        super.setData(data, jobParameters, job,{
            aggregatorName: "empty",
            aggregators:{
                empty: (attributeArray)=>(data, rowKey, colKey)=>{
                    return {
                        push: function(record) {
                        },
                        value: function() { return 0; },
                        format: function(x) { return i18n.t('jobResultTable.policyPreview'); },
                        numInputs: 1
                    };
                }
            }
        })
    }

    clickCallback(e, value, filters, pivotData) {
        var self=this;
        var selectedIndexes = [];
        var selectedRows = [];
        pivotData.forEachMatchingRecord(filters, record=> {
            selectedIndexes.push(record['$rowIndex']);
            selectedRows.push({policyIndex: record['$rowIndex']});
        });
        self.config.onRowSelected(selectedRows, selectedIndexes, e)

    }
}
