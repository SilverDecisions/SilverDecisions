import {Utils} from "sd-utils";
import * as d3 from "../d3";
import {Policy} from "sd-computations/src/policies/policy";
import {i18n} from "../i18n/i18n";

export class LeagueTableConfig {
    onRowSelected = (row) => {
    };
    extendedPolicyDescription = true;
    onRowHover = (d, i) => {};
    onRowHoverOut = (d, i) => {};

    constructor(custom) {
        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}

export class LeagueTable {

    constructor(container, config, dataModel) {
        this.container = container;
        this.config = new LeagueTableConfig(config);
        this.dataModel = dataModel;
        this.init();
    }

    init() {
        this.resultTable = this.container.selectOrAppend("table.sd-league-table");
        this.resultTableHead = this.resultTable.selectOrAppend("thead");
        this.resultTableBody = this.resultTable.selectOrAppend("tbody");
        this.resultTableFoot = this.resultTable.selectOrAppend("tfoot");
    }

    setData(jobResult, dataModel) {
        this.jobResult = jobResult;
        this.dataModel = dataModel;
        this.drawHeaders([
            i18n.t('leagueTable.headers.policyNo'),
            i18n.t('leagueTable.headers.policy'),
            dataModel.payoffNames[0],
            dataModel.payoffNames[1],
            i18n.t('leagueTable.headers.comment')
        ]);
        this.drawRows(jobResult.rows)
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

        let data = rowsData.reduce((prev, d)=> {
            let r = prev;
            d.policies.forEach((policy, i)=> {
                if (!i) {
                    r.push({
                        row: d,
                        policy: policy,
                        cells: [
                            {
                                data: d.id,
                                rowspan: d.policies.length
                            },
                            {
                                data: Policy.toPolicyString(policy, this.config.extendedPolicyDescription),
                                rowspan: 1
                            },
                            {
                                data: d.payoffs[0],
                                rowspan: d.policies.length
                            },
                            {
                                data: d.payoffs[1],
                                rowspan: d.policies.length
                            },
                            {
                                data: this.getRowComment(d),
                                rowspan: d.policies.length
                            },
                        ]
                    });
                    return;
                }

                r.push({
                    row: d,
                    policy: policy,
                    cells: [{
                        data: Policy.toPolicyString(policy, this.config.extendedPolicyDescription),
                        rowspan: 1
                    }]
                });

            });

            return r;
        }, []);

        var rows = this.resultTableBody.selectAll("tr").data(data);

        var rowsEnter = rows.enter().append("tr");
        var rowsMerge = rowsEnter.merge(rows);
        rowsMerge
            .on('click', function (d, i) {
                // d3.select(this).classed('sd-selected', true);
                self.config.onRowSelected(d, i)
            })
            .classed('sd-highlighted', d=>d.row.optimal)
            .classed('sd-highlighted-default', d=>d.row.optimalForDefaultWeight)
            .attr('id', d => 'sd-league-table-row-'+d.row.id);

        rowsMerge.on("mouseover.onRowHover", this.config.onRowHover);
        rowsMerge.on("mouseout.onRowHoverOut", this.config.onRowHoverOut);

        rows.exit().remove();

        var cells = rowsMerge.selectAll("td").data(d=>d.cells);
        var cellsEnter = cells.enter().append("td");
        var cellsMerge = cellsEnter.merge(cells);
        cellsMerge.text(d=>d.data);
        cellsMerge.attr('rowspan', d=>d.rowspan);
        cells.exit().remove();

    }

    clear() {
        this.clearSelection();
    }

    show(show = true) {
        this.container.classed('sd-hidden', !show);
    }

    hide() {
        this.show(false);
    }

    clearSelection() {
        this.resultTable.selectAll('.sd-selected').classed('sd-selected', false);
    }

    getRowComment(row) {
        if(row.incratio !== null){
            return i18n.t('leagueTable.comment.incratio', {incratio: row.incratio});
        }
        if(row.dominatedBy !== null){
            return i18n.t('leagueTable.comment.dominatedBy', {policy: row.dominatedBy});
        }
        if(row.extendedDominatedBy !== null){
            return i18n.t('leagueTable.comment.extendedDominatedBy', {policy1: row.extendedDominatedBy[0], policy2: row.extendedDominatedBy[1]});
        }
        return '';
    }


    emphasize(row, emphasize=true){
        this.resultTableBody.selectAll('#sd-league-table-row-'+row.id).classed('sd-emphasized', emphasize);
    }
}
