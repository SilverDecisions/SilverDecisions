import {Utils} from "sd-utils";
import {i18n} from "../i18n/i18n";
import * as d3 from "../d3";
import {PivotTable} from "../pivot-table";
var jQuery = require('jquery');

export class JobResultTableConfig {
    onRowSelected = (rows, indexes, event) => {
    };

    pivotTable;

    constructor(custom) {
        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}

export class JobResultTable {

    constructor(container, config, data) {
        this.container = container;
        this.config = new JobResultTableConfig(config);
        this.init();
        if (data) {
            this.setData(data);
        }
    }

    init() {
        this.pivotTable = new PivotTable(this.container.selectOrAppend("div.sd-job-result-table"));
        // this.resultTable = this.container.selectOrAppend("table.sd-job-result-table");
        // this.resultTableHead = this.resultTable.selectOrAppend("thead");
        // this.resultTableBody = this.resultTable.selectOrAppend("tbody");
        // this.resultTableFoot = this.resultTable.selectOrAppend("tfoot");
    }

    setData(data) {
        var self = this;
        var derivers = jQuery.pivotUtilities.derivers;
        var pivotOptions = {
            rows: data.headers.slice(0, 2),
            vals: [data.headers[data.headers.length - 1]],
            hiddenAttributes: ['$rowIndex'],
            aggregatorName: this.pivotTable.getAggregatorName("maximum"),
            rendererOptions: {
                table: {
                    clickCallback: function (e, value, filters, pivotData) {
                        var selectedIndexes = [];
                        var selectedRows = []
                        pivotData.forEachMatchingRecord(filters, record=> {
                            selectedIndexes.push(record['$rowIndex'])
                            selectedRows.push(data.rows[record['$rowIndex']]);
                        });
                        self.config.onRowSelected(selectedRows, selectedIndexes, e)

                    }
                },
                heatmap: {
                    colorScaleGenerator: function (values) {
                        var extent = d3.extent(values)
                        var domain = [];
                        var min = Math.min(0, extent[0] || 0);
                        var max = Math.max(0, extent[1] || 0);

                        return d3.scaleLinear()
                            .domain([min, 0, max])
                            .range(["#4b53ff", "#FFF", "#FF0000"])
                    }
                }
            },
            derivedAttributes: {
                "policy\nid": (record)=> {
                    return data.policies[data.rows[record.$rowIndex].policyIndex].id
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

        }



        this.pivotTable.update([data.headers.concat(['$rowIndex'])].concat(data.rows.map((r, i)=>r.cells.concat(i))), pivotOptions);

        // this.drawHeaders(data.headers);
        // this.drawRows(data.rows)
    }

    drawHeaders(headerData) {
        var headers = this.resultTableHead.selectOrAppend("tr").selectAll("th").data(headerData);
        var headersEnter = headers.enter().append("th");
        var headersMerge = headersEnter.merge(headers);
        headers.exit().remove();

        headersMerge.text(d=>d);
    }

    drawRows(rowsData) {
        var self = this;
        var rows = this.resultTableBody.selectAll("tr").data(rowsData);
        var rowsEnter = rows.enter().append("tr");
        var rowsMerge = rowsEnter.merge(rows);
        rowsMerge.on('click', function (d, i) {
            d3.select(this).classed('sd-selected', true);
            self.config.onRowSelected(d, i)
        });
        rows.exit().remove();

        var cells = rowsMerge.selectAll("td").data(d=>d.cells)
        var cellsEnter = cells.enter().append("td");
        var cellsMerge = cellsEnter.merge(cells);
        cellsMerge.text(d=>d);
        cells.exit().remove();

    }

    clear() {
        this.clearSelection();
        this.setData({headers: [], rows: []});
    }

    clearSelection() {
        // this.resultTable.selectAll('.sd-selected').classed('sd-selected', false);
    }

}
