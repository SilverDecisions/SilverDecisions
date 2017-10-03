import {DivergingStackedBarChartConfig, DivergingStackedBarChart} from "odc-d3/src/diverging-stacked-bar-chart";
import {Utils} from "sd-utils";
import * as d3 from "../d3";
import {Tooltip} from "sd-tree-designer";
import {i18n} from "../i18n/i18n";
import {Policy} from "sd-computations/src/policies/policy";

export class TornadoDiagramPlotConfig extends DivergingStackedBarChartConfig {
    maxWidth = undefined;
    margin={
        left: 150,
        top: 70
    };

    showLegend = true;
    forceLegend = true;

    categoryNames = [i18n.t("job.tornado-diagram.plot.legend.low"), i18n.t("job.tornado-diagram.plot.legend.high")];
    colorRange = ["#4f81bd", "#9bbb59"];
    policyIndex = 0;

    guides = true;
    middleValue = 1000;
    showBarValues = false;

    x={// X axis config
        title: i18n.t('job.tornado-diagram.plot.xAxisTitle'), // axis label
    };

    constructor(custom) {
        super();

        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}

export class TornadoDiagramPlot extends DivergingStackedBarChart {

    constructor(placeholderSelector, data, config) {
        super(placeholderSelector, data, new TornadoDiagramPlotConfig(config));
    }

    setConfig(config) {
        return super.setConfig(new TornadoDiagramPlotConfig(config));
    }

    init(){
        super.init();
        this.svg.classed('sd-tornado-diagram-plot', true);
    }

    setData(data){
        this.config.middleValue = data.defaultPayoff;
        this.config.title = Policy.toPolicyString(data.policies[this.config.policyIndex]);
        return super.setData(data.rows.map((r)=>{
            let varExtent = data.variableExtents[data.variableNames.indexOf(r.variableName)];
            return {
                key: r.variableName+' ['+varExtent[0]+'; '+varExtent[1]+']',
                values: [
                    Math.max(0, data.defaultPayoff - r.extents[this.config.policyIndex][0]),
                    Math.max(0, r.extents[this.config.policyIndex][1] - data.defaultPayoff)
                ],
                categories: r.extentVariableValues[this.config.policyIndex][0] <= r.extentVariableValues[this.config.policyIndex][1] ? [0, 1] : [1, 0]
            }
        }))
    }

    initPlot() {
        d3.select(this.baseContainer).style('max-width', this.config.maxWidth);
        super.initPlot();
    }

}
