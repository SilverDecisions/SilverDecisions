import {ScatterPlot, ScatterPlotConfig} from "odc-d3/src/scatterplot";
import {Utils} from "sd-utils";
import * as d3 from "../d3";
import {Tooltip} from "sd-tree-designer";
import {i18n} from "../i18n/i18n";

export class LeagueTablePlotConfig extends ScatterPlotConfig {
    maxWidth = undefined;
    weightLowerBound = 0;
    weightUpperBound = Infinity;
    gradientArrowLength = 30;
    gradientArrowOffset = 10;
    payoffCoeffs = [1, 1];
    payoffNames = [];

    showLegend = true;
    forceLegend = true;

    legend = {
        width: 125,
    };

    // d3ColorCategory = false;

    guides = true;
    dotRadius = 5;
    emphasizedDotRadius = 8;

    dotId = (d, i) => 'sd-league-table-dot-'+d.id;

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

    init(){
        super.init();
        this.svg.classed('sd-league-table-plot', true);
        this.initArrowMarker("triangle");
    }

    initArrowMarker(id) {

        var defs = this.svg.selectOrAppend("defs");
        defs.append("marker")
            .attr("id",id)
            .attr("viewBox","0 -5 10 10")
            .attr("refX",5)
            .attr("refY",0)
            .attr("markerWidth",4)
            .attr("markerHeight",4)
            .attr("orient","auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("class","arrowHead");
    }

    initPlot() {
        d3.select(this.baseContainer).style('max-width', this.config.maxWidth);
        this.checkOrdering();
        super.initPlot();
    }

    checkOrdering(){
        if(this.config.groupOrdering){
            let getOrdering  = d => {
                let g = this.config.groups.value(d);
                return this.config.groupOrdering[g] === undefined ? 999 : this.config.groupOrdering[g];
            };
            this.data.sort((a, b)=>getOrdering(a) - getOrdering(b));
        }
    }

    update(newData) {
        this.checkOrdering();
        super.update(newData);

        this.updateIcerLines();
        this.updateDominatedRegion();
        this.updateGradientArrows();
        this.updateDotLabels();


    };

    updateIcerLines() {
        let self = this;
        var linesContainerClass = this.linesContainerClass = this.prefixClass("lines-container");
        var linesContainerSelector = "g." + linesContainerClass;
        var linesContainer = this.linesContainer= self.svgG.selectOrInsert(linesContainerSelector, "." + self.dotsContainerClass);

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




        let linePoints = this.plot.data.filter(d=>d.incratio !== null).sort(this.plot.x.map);
        let highlightedPoints = this.plot.data.filter(d=>["highlighted", "highlighted-default"].indexOf(this.plot.groupValue(d)) !== -1).sort((a, b) => this.plot.x.map(a) - this.plot.x.map(b));
        let highlightedDefaultPoints = highlightedPoints.filter(d=>["highlighted-default"].indexOf(this.plot.groupValue(d)) !== -1);

        this.dominatedRegionPoints = highlightedPoints.map(d=>[this.plot.x.map(d), this.plot.y.map(d)]);

        if (!highlightedPoints.length) {
            linesContainer.selectAll("*").remove();
            return;
        }

        linesContainer.selectOrAppend("path." + this.prefixClass('middle-incratio'))
            .attr("shape-rendering", "optimizeQuality")
            .attr("fill", "none")
            .attr("stroke-width", 1)
            .attr("stroke", 'black')
            .attr("d", line(highlightedPoints));

        highlightedPoints.sort((a, b) =>a.incratio - b.incratio || (this.config.payoffCoeffs[0] * (this.plot.x.map(a) - this.plot.x.map(b))));

        let minPoint = highlightedPoints[0];
        let maxPoint = highlightedPoints[highlightedPoints.length - 1];

        let lowPoint;
        let highPoint;

        let xAxisExtent = [this.plot.x.scale.invert(0), this.plot.x.scale.invert(this.plot.width)];
        let yAxisExtent = [this.plot.y.scale.invert(this.plot.height), this.plot.y.scale.invert(0)];

        let sign = (this.config.payoffCoeffs[0] * this.config.payoffCoeffs[1]) > 0 ? 1 : -1;

        let infLowY = this.config.payoffCoeffs[0] > 0 ? this.plot.height: 0;
        if(sign > 0){
            infLowY = this.config.payoffCoeffs[0] < 0 ? this.plot.height: 0;
        }
        let infLowPoint = [this.plot.x.map(minPoint), infLowY];

        if (this.config.weightLowerBound == Infinity) {
            lowPoint = infLowPoint
        } else {
            let x = this.config.payoffCoeffs[0] > 0 ? xAxisExtent[0] : xAxisExtent[1];
            lowPoint = [this.plot.x.scale(x), this.plot.y.scale(sign * this.config.weightLowerBound * (this.plot.x.value(minPoint) - x) + this.plot.y.value(minPoint))];
            if(Math.abs(lowPoint[1]) > 1000000){
                lowPoint = infLowPoint
            }
        }

        let infHighPoint =  [this.plot.x.map(maxPoint), this.config.payoffCoeffs[1] > 0 ? this.plot.height: 0];
        if (this.config.weightUpperBound == Infinity) {
            highPoint = infHighPoint
        } else {

            let x = this.config.payoffCoeffs[1] > 0 ? xAxisExtent[0] : xAxisExtent[1];

            if(sign > 0){
                x = this.config.payoffCoeffs[1] < 0 ? xAxisExtent[0] : xAxisExtent[1];
            }

            highPoint = [this.plot.x.scale(x), this.plot.y.scale(-sign * this.config.weightUpperBound * (x - this.plot.x.value(maxPoint)) + this.plot.y.value(maxPoint))];
            // highPoint = [this.plot.x.scale(x), this.plot.y.scale(EE.toFloat(EE.multiply(-sign, EE.multiply(this.config.weightUpperBound, (x - this.plot.x.value(maxPoint))))) + this.plot.y.value(maxPoint))];
            if(Math.abs(highPoint[1]) > 1000000){
                highPoint = infHighPoint
            }
        }

        if(highlightedDefaultPoints.length){
            let defaultPoint = highlightedDefaultPoints[0];
            let defLowPoint = infLowPoint;
            let defHighPoint = infHighPoint;
            if (this.config.defaultWeight !== Infinity) {
                let x = this.config.payoffCoeffs[0] > 0 ? xAxisExtent[0] : xAxisExtent[1];
                defLowPoint = [this.plot.x.scale(x), this.plot.y.scale(sign * this.config.defaultWeight * (this.plot.x.value(defaultPoint) - x) + this.plot.y.value(defaultPoint))];
                x = this.config.payoffCoeffs[1] > 0 ? xAxisExtent[0] : xAxisExtent[1];
                if(sign > 0){
                    x = this.config.payoffCoeffs[1] < 0 ? xAxisExtent[0] : xAxisExtent[1];
                }
                defHighPoint = [this.plot.x.scale(x), this.plot.y.scale(-sign * this.config.defaultWeight * (x - this.plot.x.value(defaultPoint)) + this.plot.y.value(defaultPoint))];
            }
            linesContainer.selectOrAppend("path." + this.prefixClass('default-incratio'))
                .attr("shape-rendering", "optimizeQuality")
                .attr("fill", "none")
                .attr("stroke-width", 2)
                .attr("stroke", 'black')
                .attr("d", d3.line()([defLowPoint, defHighPoint]))
        } else{
            linesContainer.select("path." + this.prefixClass('default-incratio')).remove()
        }


        this.dominatedRegionPoints.unshift(lowPoint);
        this.dominatedRegionPoints.push(highPoint);


        linesContainer.selectOrAppend("path." + this.prefixClass('low-incratio'))
            .attr("shape-rendering", "optimizeQuality")
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("stroke", 'black')
            .attr("d", d3.line()([lowPoint, [this.plot.x.map(minPoint), this.plot.y.map(minPoint)]]))

        linesContainer.selectOrAppend("path." + this.prefixClass('high-incratio'))
            .attr("shape-rendering", "optimizeQuality")
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("stroke", 'black')
            .attr("d", d3.line()([highPoint, [this.plot.x.map(maxPoint), this.plot.y.map(maxPoint)]]))




    }

    updateDominatedRegion(){
        let self = this;
        var dominatedRegionContainerClass = this.prefixClass("dominated-region-container");
        var dominatedRegionContainerSelector = "g." + dominatedRegionContainerClass;
        var dominatedRegionContainer = self.svgG.selectOrInsert(dominatedRegionContainerSelector, "."+this.linesContainerClass);

        var clipPathId = self.prefixClass("clip-" + Utils.guid());
        var dominatedRegionContainerClip = dominatedRegionContainer.selectOrAppend("clipPath").attr("id", clipPathId);

        dominatedRegionContainerClip.selectOrAppend('rect')

            .attr('width', self.plot.width)
            .attr('height', self.plot.height)
            .attr('x', 0)
            .attr('y', 0);

        dominatedRegionContainer.attr("clip-path", (d, i) => "url(#" + clipPathId + ")");

        //draw dominated region

        let worstPoint = [
            this.config.payoffCoeffs[0] < 0 ? self.plot.width : 0,
            this.config.payoffCoeffs[1] < 0 ? 0 : self.plot.height
        ];

        this.dominatedRegionPoints.push(worstPoint);

        if(this.dominatedRegionPoints.some(p=>worstPoint[1] ? p[1] <=0 : p[1] >= self.plot.height)){
            this.dominatedRegionPoints.push([worstPoint[0], worstPoint[1] ? 0 : self.plot.height]);
        }

        this.dominatedRegionPoints.sort((a, b)=> (a[0] - b[0]));
        this.dominatedRegionPoints = this.dominatedRegionPoints.reduce((prev, curr)=>{
            if(!prev.length){
                return [curr]
            }
            var prevPoint = prev[prev.length-1];
            if(prevPoint[0] !== curr[0]){
                prev.push(curr)
            }
            if(Math.abs(worstPoint[1] - curr[1]) > Math.abs(worstPoint[1] - prev[prev.length-1][1])){
                prev[prev.length-1] = curr;
            }
            return prev;

        }, []);

        let area = d3.area();
        area.y0(worstPoint[1])
        dominatedRegionContainer.selectOrInsert("path." + this.prefixClass('dominated-region'))
            .attr("shape-rendering", "optimizeQuality")
            .attr("fill", "gray")
            .attr("stroke-width", 0)
            .attr("d", area(this.dominatedRegionPoints));

        Tooltip.attach(dominatedRegionContainer, i18n.t('leagueTable.plot.tooltip.dominatedRegion'));
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

    updateGradientArrows() {

        var data = this.config.payoffCoeffs.map((coeff, i)=>{

            let l = this.config.gradientArrowLength * coeff;
            let offset = this.config.gradientArrowOffset * coeff;

            let d = {
                x1: this.plot.width/2,
                y1: this.plot.height/2,
            };

            if(i==0){
                d.x1 += offset;
                d.x2 = d.x1 + l;
                d.y2 = d.y1
            }else{
                d.y1 -= offset;
                d.x2 = d.x1;
                d.y2 = d.y1 - l
            }

            return d
        });

        let self = this;
        var arrowsContainerClass = this.prefixClass("gradient-arrows-container");
        var arrowsContainerSelector = "g." + arrowsContainerClass;
        var arrowsContainer = self.svgG.selectOrInsert(arrowsContainerSelector, "." + self.dotsContainerClass);

        let arrowClass = this.prefixClass("gradient-arrow");
        var arrows = arrowsContainer.selectAll("."+arrowClass).data(data);
        arrows.exit().remove();
        var arrowsEnter = arrows.enter().append('g')
            .attr('class', arrowClass);

        arrowsEnter.append("line").attr("marker-end", "url(#triangle)");
        var arrowsMerge =arrowsEnter.merge(arrows);

        arrowsMerge.select("line")
            .attr("x1", d=>d.x1)
            .attr("y1", d=>d.y1)
            .attr("x2", d=>d.x2)
            .attr("y2", d=>d.y2);

        Tooltip.attach(arrowsMerge, (d, i)=>{
            return i18n.t('leagueTable.plot.tooltip.gradientArrow' + (i + 1), { name: this.config.payoffNames[i]});
        });
    }

    emphasize(row, emphasize=true){
        this.emphasizeDot(this.svg.selectAll('#'+this.config.dotId(row)), emphasize);
    }

    emphasizeDot(selection, emphasize){
        selection
            .classed('sd-emphasized', emphasize)
            .transition()
            .attr('r', emphasize ? this.config.emphasizedDotRadius : this.config.dotRadius)
    }
    updateDots(){
        var self = this;
        super.updateDots();
        var dotsContainer = this.svgG.select("g." + this.dotsContainerClass);
        dotsContainer.selectAll('.' + this.dotClass)
            .on("mouseover.emphasize", function(d){ self.emphasizeDot(d3.select(this), true) })
            .on("mouseout.emphasize", function(d){ self.emphasizeDot(d3.select(this), false) })
    }

    updateLegend() {
        super.updateLegend();
        var plot = this.plot;

        let container = plot.legend.container.selectOrAppend("g.sd-additional-items")
        let legendCells = plot.legend.container.select(".legendCells");
        let margin = 20;

        let texts = [
            i18n.t("leagueTable.plot.legend.dominatedRegion"),
            i18n.t("leagueTable.plot.legend.gradientArrows")
        ];

        container.attr("transform", "translate(0, "+(legendCells.node().getBBox().height+margin)+")");

        container.selectAll("text").data(texts)
            .enter().append("text")
            .text(d=>d)
            .attr('dy', "0")
            .attr('x', "0");

        container.selectAll("text").call(wrap, d=>d, this.config.legend.width);

        function wrap(text, getTextData, width) {
            text.each(function(d) {

                var text = d3.select(this),
                    words = getTextData(d).split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr('y'),
                    dy = parseFloat(text.attr('dy')),
                    tspan = text.text(null).append('tspan')
                        .attr('x', 0).attr('y', y).attr('dy', dy + 'em');

                if(this.previousSibling){
                    text.attr('y', this.previousSibling.getBBox().height+10)
                }

                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(' '));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(' '));
                        line = [word];
                        tspan = text.append('tspan')
                            .attr('x', 0).attr('y', y)
                            .attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
                    }
                }
            });
        }
    }


}
