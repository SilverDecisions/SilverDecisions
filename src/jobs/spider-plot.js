import {LineChartConfig, LineChart} from "odc-d3/src/line-chart";
import {Utils} from "sd-utils";
import * as d3 from "../d3";
import {Tooltip} from "sd-tree-designer";
import {i18n} from "../i18n/i18n";
import {Policy} from "sd-computations/src/policies/policy";

export class SpiderPlotConfig extends LineChartConfig {
    maxWidth = undefined;

    showLegend = true;
    policyIndex = 0;
    guides = true;
    margin={
        left: 100
    };
    x={// X axis config
        title: i18n.t('job.spider-plot.plot.xAxisTitle'), // axis label
        key: 0,
        domainMargin: 0
    };
    y={// Y axis config
        title: i18n.t('job.spider-plot.plot.yAxisTitle'), // axis label,
        key: 1,
        domainMargin: 0.1
    };
    series = true;
    dotRadius = 3;

    constructor(custom) {
        super();

        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}

export class SpiderPlot extends LineChart {

    constructor(placeholderSelector, data, config) {
        super(placeholderSelector, data, new SpiderPlotConfig(config));
    }

    setConfig(config) {
        return super.setConfig(new SpiderPlotConfig(config));
    }

    init(){
        super.init();
        this.svg.classed('sd-spider-plot', true);
    }

    setData(data){
        this.config.title = Policy.toPolicyString(data.policies[this.config.policyIndex]);
        return super.setData(data.rows.map(r=>{
            return {
                key: r.variableName,
                values: data.percentageRangeValues.map((rangeVal, index)=>[
                    data.percentageRangeValues[index],
                    r.payoffs[this.config.policyIndex][index]
                ])
            }
        }))
    }

    initPlot() {
        d3.select(this.baseContainer).style('max-width', this.config.maxWidth);
        super.initPlot();
    }

}
