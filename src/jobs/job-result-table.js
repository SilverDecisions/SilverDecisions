import {Utils} from "sd-utils";

export class JobResultTableConfig {
    onRowSelected = (row) => {};

    constructor(custom) {
        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}

export class JobResultTable{

    constructor(container, config, data){
        this.container = container;
        this.config = new JobResultTableConfig(config);
        this.init();
        if(data){
            this.setData(data);
        }

    }

    init(){
        this.resultTable = this.container.selectOrAppend("table.sd-job-result-table");
        this.resultTableHead = this.resultTable.selectOrAppend("thead");
        this.resultTableBody = this.resultTable.selectOrAppend("tbody");
        this.resultTableFoot = this.resultTable.selectOrAppend("tfoot");
    }

    setData(data){
        this.drawHeaders(data.headers);
        this.drawRows(data.rows)
    }

    drawHeaders(headerData) {
        var headers = this.resultTableHead.selectOrAppend("tr").selectAll("th").data(headerData);
        var headersEnter = headers.enter().append("th");
        var headersMerge = headersEnter.merge(headers);
        headers.exit().remove();

        headersMerge.text(d=>d);
    }

    drawRows(rowsData) {
        var rows = this.resultTableBody.selectAll("tr").data(rowsData);
        var rowsEnter = rows.enter().append("tr");
        var rowsMerge = rowsEnter.merge(rows);
        rows.exit().remove();

        var cells = rowsMerge.selectAll("td").data(d=>d)
        var cellsEnter = cells.enter().append("td");
        var cellsMerge = cellsEnter.merge(cells);
        cellsMerge.text(d=>d);
        cells.exit().remove();
    }
}
