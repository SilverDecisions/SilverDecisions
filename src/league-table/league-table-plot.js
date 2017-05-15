import {ScatterPlot, ScatterPlotConfig} from "odc-d3/src/scatterplot";
import {Utils} from "sd-utils";
import * as d3 from "../d3";

export class LeagueTablePlotConfig extends ScatterPlotConfig {
    maxWidth = undefined;
    minimumWTP = 0;
    maximumWTP = Infinity;
    showLegend = true;
    legend = {
        width: 100,
    };

    // d3ColorCategory = false;

    guides = true;
    dotRadius = 4;

    constructor(custom) {
        super();

        if (custom) {
            Utils.deepExtend(this, custom);
        }

    }
}

export class LeagueTablePlot extends ScatterPlot {

    constructor(placeholderSelector, data, config) {
        super(placeholderSelector, data, new LeagueTablePlotConfig(config));
    }

    setConfig(config) {
        return super.setConfig(new LeagueTablePlotConfig(config));
    }

    initPlot() {
        d3.select(this.baseContainer).style('max-width', this.config.maxWidth);
        super.initPlot();
    }

    update(newData) {
        super.update(newData);
        this.updateIcerLines();
        this.updateDotLabels();

    };

    updateIcerLines() {
        let self = this;
        var linesContainerClass = this.prefixClass("lines-container");
        var linesContainerSelector = "g." + linesContainerClass;
        var linesContainer = self.svgG.selectOrInsert(linesContainerSelector, "." + self.dotsContainerClass);

        var clipPathId = self.prefixClass("clip-" + Utils.guid());
        var linesContainerClip = linesContainer.selectOrAppend("clipPath").attr("id", clipPathId);

        linesContainerClip.selectOrAppend('rect')

            .attr('width', self.plot.width)
            .attr('height', self.plot.height)
            .attr('x', 0)
            .attr('y', 0);

        linesContainer.attr("clip-path", (d, i) => "url(#" + clipPathId + ")");

        var line = d3.line()
            .x(this.plot.x.map)
            .y(this.plot.y.map);


        let linePoints = this.plot.data.filter(d=>d.ICER !== null).sort(this.plot.x.map);
        let highlightedPoints = this.plot.data.filter(d=>this.plot.groupValue(d) === 'highlighted').sort((a, b) => this.plot.x.map(a) - this.plot.x.map(b));

        linesContainer.selectOrAppend("path." + this.prefixClass('middle-icer'))
            .attr("shape-rendering", "optimizeQuality")
            .attr("fill", "none")
            .attr("stroke-width", 1)
            .attr("stroke", 'black')
            .attr("d", line(highlightedPoints));


        if (!highlightedPoints.length) {
            return;
        }

        let minPoint = highlightedPoints[0];
        let maxPoint = highlightedPoints[highlightedPoints.length - 1];

        let lowPoint;
        let highPoint;

        let xAxisExtent = [this.plot.x.scale.invert(0), this.plot.x.scale.invert(this.plot.width)];
        let yAxisExtent = [this.plot.y.scale.invert(this.plot.height), this.plot.y.scale.invert(0)];


        if (this.config.minimumWTP === Infinity) {
            lowPoint = [this.plot.x.map(minPoint), this.plot.height];
        } else {
            lowPoint = [this.plot.x.scale(xAxisExtent[0]), this.plot.y.scale(-this.config.minimumWTP * (this.plot.x.value(minPoint) - xAxisExtent[0]) + this.plot.y.value(minPoint))];
        }

        if (this.config.maximumWTP === Infinity) {
            highPoint = [this.plot.x.map(maxPoint), 0]
        } else {
            highPoint = [this.plot.x.scale(xAxisExtent[1]), this.plot.y.scale(this.config.maximumWTP * (xAxisExtent[1] - this.plot.x.value(maxPoint)) + this.plot.y.value(maxPoint))];
        }


        linesContainer.selectOrAppend("path." + this.prefixClass('low-icer'))
            .attr("shape-rendering", "optimizeQuality")
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("stroke", 'black')
            .attr("d", d3.line()([lowPoint, [this.plot.x.map(minPoint), this.plot.y.map(minPoint)]]))

        linesContainer.selectOrAppend("path." + this.prefixClass('high-icer'))
            .attr("shape-rendering", "optimizeQuality")
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("stroke", 'black')
            .attr("d", d3.line()([highPoint, [this.plot.x.map(maxPoint), this.plot.y.map(maxPoint)]]))

    }

    updateDotLabels() {
        var self = this;
        var labelsContainerClass = this.prefixClass("dot-labels-container");
        var labelsContainerSelector = "g." + labelsContainerClass;
        var labelsContainer = self.svgG.selectOrAppend(labelsContainerSelector, "." + self.dotsContainerClass);

        var labels = labelsContainer.selectAll("text." + this.prefixClass("dot-label")).data(this.plot.data);
        labels.exit().remove();
        labels.enter().append('text')
            .attr('class', this.prefixClass("dot-label"))
            .merge(labels)
            .attr('x', this.plot.x.map)
            .attr('y', this.plot.y.map)
            .attr('text-anchor', 'end')
            .attr("dy", "-5px")
            .attr("dx", "-5px")
            .text(d=>d.id)
    }
}
