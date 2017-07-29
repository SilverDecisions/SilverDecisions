import {Utils} from "sd-utils";
import {i18n} from "../i18n/i18n";
import * as d3 from "../d3";
import {PivotTable} from "../pivot-table";
var jQuery = require('jquery');

export class JobResultTableConfig {
    onRowSelected = (rows, indexes, event) => {};
    className = '';

    pivotTable;

    constructor(custom) {
        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}

export class JobResultTable {

    constructor(container, config) {
        this.container = container;
        this.config = new JobResultTableConfig(config);
        this.init();
    }

    init() {
        this.pivotTable = new PivotTable(this.container.selectOrAppend("div.sd-job-result-table").classed(this.config.className, true));
    }

    clickCallback(e, value, filters, pivotData) {
        var self=this;
        var selectedIndexes = [];
        var selectedRows = []
        pivotData.forEachMatchingRecord(filters, record=> {
            selectedIndexes.push(record['$rowIndex']);
            selectedRows.push(data.data[record['$rowIndex']]);
        });
        self.config.onRowSelected(selectedRows, selectedIndexes, e)

    }

    setClassName(className){
        if(this.config.className){
            this.container.selectOrAppend("div.sd-job-result-table").classed(this.config.className, false);
            this.config.className = className;
        }
        this.container.selectOrAppend("div.sd-job-result-table").classed(this.config.className, true)
    }

    setData(data, jobParameters, job, config) {
        var self = this;
        var derivers = jQuery.pivotUtilities.derivers;
        var pivotOptions = {
            rows: data.rows,
            vals: data.vals,
            cols: data.cols,
            hiddenAttributes: ['$rowIndex'],
            aggregatorName: this.pivotTable.getAggregatorName("maximum"),
            rendererOptions: {
                table: {
                    clickCallback: function (e, value, filters, pivotData) {
                        self.clickCallback(e, value, filters, pivotData);
                    }
                },
                heatmap: {
                    colorScaleGenerator: function (values) {
                        let extent = d3.extent(values);

                    return d3.scaleLinear()
                        .domain([extent[0], (extent[0]+extent[1])/2,extent[1]])
                        .range(["#4b53ff", "#FFF", "#FF0000"])
                    }
                }
            },
            rendererName: this.pivotTable.getRendererName("heatmap")
            /*
             rendererName: 'custom',
             renderers: {
             'custom': function(pivotData, options){
             console.log(pivotData)
             }
             }*/

        };

        if(config){
            if(config.aggregatorName){
                pivotOptions.aggregatorName = config.aggregatorName;
            }
            if(config.aggregators){
                pivotOptions.aggregators = config.aggregators;
            }
        }

        this.pivotTable.update(data.data.map((r, i)=>r.concat(i ?  i-1 : '$rowIndex')), pivotOptions);

        // this.drawHeaders(data.headers);
        // this.drawRows(data.rows)
    }

    clear() {
        this.clearSelection();
        this.pivotTable.clear();
    }

    show(show=true){
        this.container.classed('sd-hidden', !show);
    }

    hide(){
        this.show(false);
    }

    clearSelection() {
        // this.resultTable.selectAll('.sd-selected').classed('sd-selected', false);
    }

}
