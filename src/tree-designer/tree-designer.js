import * as d3 from "../d3";
import {Utils} from "sd-utils";
import {AppUtils} from "../app-utils";
import {domain as model} from "sd-model";
import {ContextMenu} from "./context-menu";
import {MainContextMenu} from "./main-context-menu";
import {NodeContextMenu} from "./node-context-menu";
import {Layout} from "./layout";
import {NodeDragHandler} from "./node-drag-handler";
import {Tooltip} from "../tooltip";
import {Templates} from "../templates";
import {TextDragHandler} from "./text-drag-handler";
import {TextContextMenu} from "./text-context-menu";
import {EdgeContextMenu} from "./edge-context-menu";
import * as Hammer from "hammerjs";
import {i18n} from "../i18n/i18n";

export class TreeDesignerConfig {
    width = undefined;
    height = undefined;
    margin = {
        left: 25,
        right: 25,
        top: 25,
        bottom: 25
    };
    layout= {
        type: 'tree',
        nodeSize: 40,
        limitNodePositioning: true,
        gridHeight: 75,
        gridWidth: 150,
        edgeSlantWidthMax: 20
    };
    fontFamily = 'sans-serif';
    fontSize = '12px';
    fontWeight = 'normal';
    fontStyle = 'normal';
    node = {
        strokeWidth: '1px',
        optimal: {
            stroke: '#006f00',
            strokeWidth: '1.5px',
        },
        label: {
            fontSize: '1em',
            color: 'black'
        },
        payoff: {
            fontSize: '1em',
            color: 'black',
            negativeColor: '#b60000'
        },
        decision: {
            fill: '#ff7777',
            stroke: '#660000',

            selected: {
                fill: '#aa3333',
                // stroke: '#666600'
            }
        },
        chance: {
            fill: '#ffff44',
            stroke: '#666600',

            selected: {
                fill: '#aaaa00',
                // stroke: '#666600'
            }
        },
        terminal:{
            fill: '#44ff44',
            stroke: 'black',
            selected: {
                fill: '#00aa00',
                // stroke: 'black'
            },
            payoff: {
                fontSize: '1em',
                color: 'black',
                negativeColor: '#b60000'
            },
        }
    };
    edge={
        stroke: '#424242',
        strokeWidth: '1.5',
        optimal:{
            stroke: '#006f00',
            strokeWidth: '2.4',
        },
        selected:{
            stroke: '#045ad1',
            strokeWidth: '3.5',
        },
        label: {
            fontSize: '1em',
            color: 'back'
        },
        payoff:{
            fontSize: '1em',
            color: 'black',
            negativeColor: '#b60000'
        }

    };
    probability = {
        fontSize: '1em',
        color: '#0000d7'
    };
    title = {
        fontSize: '16px',
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#000000',
        margin:{
            top: 15,
            bottom: 10
        }
    };
    description = {
        show: true,
        fontSize: '12px',
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#000000',
        margin:{
            top: 5,
            bottom: 10
        }
    };

    $readOnly= false;
    disableAnimations=false;
    forceFullEdgeRedraw=false;
    hideLabels=false;
    hidePayoffs=false;
    hideProbabilities=false;
    raw=false;


    payoffNumberFormatter = (v)=> v;
    probabilityNumberFormatter  = (v)=> v;

    onNodeSelected = (node) => {};
    onEdgeSelected = (edge) => {};
    onTextSelected = (text) => {};
    onSelectionCleared = () => {};

    operationsForObject = (o) => [];

    payoffNames = [null, null];
    maxPayoffsToDisplay = 1;

    constructor(custom) {
        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}


export class TreeDesigner {

    config;
    container;
    data; //data model manager
    svg;

    constructor(container, dataModel, config){
        this.setConfig(config);
        this.data = dataModel;
        this.initContainer(container);
        this.init();
    }

    setConfig(config) {
        this.config = new TreeDesignerConfig(config);
        if(this.layout){
            this.layout.config=this.config.layout;
        }
        this.updateCustomStyles();
        return this;
    }

    init(){

        this.initSvg();
        this.initLayout();

        this.initBrush();
        this.initEdgeMarkers();

        this.updateCustomStyles();
        if(!this.config.$readOnly){
            this.initMainContextMenu();
            this.initNodeContextMenu();
            this.initEdgeContextMenu();
            this.initNodeDragHandler();
            this.initTextDragHandler();
            this.initTextContextMenu();
        }
        this.redraw();
    }

    updateCustomStyles(){
        d3.select('head').selectOrAppend('style#sd-tree-designer-style').html(Templates.get('treeDesignerStyles', this.config));
        return this;
    }

    initLayout(){
        this.layout = new Layout(this, this.data, this.config.layout);
    }

    initNodeDragHandler(){
        this.nodeDragHandler = new NodeDragHandler(this, this.data);
    }

    initTextDragHandler(){
        this.textDragHandler = new TextDragHandler(this, this.data);
    }

    redraw(withTransitions=false){

        var self = this;
        withTransitions = !self.config.disableAnimations && withTransitions;
        this.redrawDiagramTitle();
        this.redrawDiagramDescription();
        this.updateMargin(withTransitions);
        if(withTransitions){
            self.transitionPrev = self.transition;
            self.transition = true;
        }
        this.redrawNodes();
        this.redrawEdges();
        this.redrawFloatingTexts();
        this.updateValidationMessages();
        if(withTransitions){
            self.transition =  self.transitionPrev;
        }
        setTimeout(function(){
            self.updatePlottingRegionSize();
        },10);

        return this;
    }

    computeAvailableSpace(){
        this.availableHeight = AppUtils.sanitizeHeight(this.config.height, this.container, this.config.margin);
        this.availableWidth = AppUtils.sanitizeWidth(this.config.width, this.container, this.config.margin);
    }

    initSvg() {
        var c = this;
        var self = this;
        this.computeAvailableSpace();
        this.svg = this.container.selectOrAppend('svg.tree-designer');
        this.svg.attr('width', this.availableWidth).attr('height', this.availableHeight);

        this.mainGroup = this.svg.selectOrAppend('g.main-group');
        this.updateMargin();


        if (!this.config.width) {
            d3.select(window)
                .on("resize.tree-designer", function () {
                    self.updatePlottingRegionSize();
                    self.redrawDiagramTitle();
                });
        }

        var mc = new Hammer.Manager(this.svg.node(), {touchAction : 'auto'});
        mc.add(new Hammer.Press({
            pointerType: 'touch'
        }));

        mc.add(new Hammer.Pinch({
            pointerType: 'touch'
        }));

        var cancel;
        mc.on('pinchstart', function(){
            self.disableBrush();
        })
        mc.on('pinch', function(){
            cancel = Utils.waitForFinalEvent(()=>self.enableBrush(), 'pinchend', 5000)
        })
    }

    updateMargin(withTransitions){
        var self = this;
        var margin = this.config.margin;
        var group = this.mainGroup;
        if(withTransitions){
            group = group.transition();
        }

        this.topMargin = margin.top;
        if(this.diagramTitle||this.diagramDescription){
            this.topMargin = parseInt(this.diagramTitle ? this.config.title.margin.top : 0) + this.getTitleGroupHeight()
                +  Math.max(this.topMargin, parseInt(this.config.title.margin.bottom));
        }

        group.attr("transform", "translate(" + margin.left + "," + this.topMargin + ")").on("end", ()=> self.updatePlottingRegionSize());
    }

    setMargin(margin, withoutStateSaving){
        var self=this;
        if(!withoutStateSaving){
            this.data.saveState({
                data:{
                    margin: Utils.clone(self.config.margin)
                },
                onUndo: (data)=> {
                    self.setMargin(data.margin, true);
                },
                onRedo: (data)=> {
                    self.setMargin(margin, true);
                }
            });
        }
        Utils.deepExtend(this.config.margin, margin);
        this.redrawDiagramTitle();
        this.updateMargin(true);
    }

    initContainer(container) {
        this.container = container;
    }

    updatePlottingRegionSize() {
        var changed = false;
        this.computeAvailableSpace();
        var margin = this.config.margin;
        var svgWidth = this.svg.attr('width');
        var svgHeight = this.svg.attr('height');
        var mainGroupBox = this.mainGroup.node().getBBox();
        var newSvgWidth = mainGroupBox.width+mainGroupBox.x+margin.left+margin.right;
        this.container.classed('with-overflow-x', newSvgWidth>=this.availableWidth);
        newSvgWidth = Math.max(newSvgWidth, this.availableWidth);
        if(svgWidth!=newSvgWidth){
            changed = true;
            this.svg.attr('width', newSvgWidth);
        }
        var newSvgHeight = mainGroupBox.height+mainGroupBox.y+this.topMargin+margin.bottom;

        this.container.classed('with-overflow-y', newSvgHeight>=this.availableHeight);
        newSvgHeight = Math.max(newSvgHeight, this.availableHeight);
        if(svgHeight!=newSvgHeight){
            changed=true;
            this.svg.attr('height', newSvgHeight);
        }
        if(changed){
            this.updateBrushExtent()
        }


    }

    redrawNodes() {
        var self = this;


        var nodesContainer = this.mainGroup.selectOrAppend('g.nodes');
        var nodes = nodesContainer.selectAll('.node').data(this.data.nodes, (d,i)=> d.$id);
        nodes.exit().remove();
        var nodesEnter = nodes.enter().append('g')
            .attr('id', d=>'node-'+d.$id)
            .attr('class', d=>d.type+'-node node')
            .attr('transform', d=>'translate(' + d.location.x + '  ' + d.location.y + ')');
        nodesEnter.append('path');

        var labelEnter = nodesEnter.append('text').attr('class', 'label');
        var payoffEnter = nodesEnter.append('text').attr('class', 'payoff computed');
        var indicatorEnter = nodesEnter.append('text').attr('class', 'error-indicator').text('!!');
        var aggregatedPayoffEnter = nodesEnter.append('text').attr('class', 'aggregated-payoff');
        var probabilityToEnterEnter = nodesEnter.append('text').attr('class', 'probability-to-enter');

        var nodesMerge = nodesEnter.merge(nodes);
        nodesMerge.classed('optimal', (d)=>self.isOptimal(d));

        var nodesMergeT = nodesMerge;
        if(this.transition){
            nodesMergeT = nodesMerge.transition();
            nodesMergeT.on('end', ()=> self.updatePlottingRegionSize())
        }
        nodesMergeT
            .attr('transform', d=>'translate(' + d.location.x + '  ' + d.location.y + ')')

        var path = nodesMerge.select('path');
        this.layout.drawNodeSymbol(path,this.transition);

        /*path
            .style('fill', d=> {
                // if(self.isNodeSelected(d)){
                //     return self.config.node[d.type].selected.fill
                // }
                return self.config.node[d.type].fill
            })
            .style('stroke', d=> self.config.node[d.type].stroke)
            .style('stroke-width', d=> {
                if(self.config.node[d.type].strokeWidth!==undefined){
                    return self.config.node[d.type].strokeWidth;
                }
                return self.config.node.strokeWidth;
            });
        */
        this.layout.nodeLabelPosition(labelEnter);
        var labelMerge = nodesMerge.select('text.label');
        labelMerge.classed('sd-hidden', this.config.hideLabels);
        var labelMergeT = nodesMergeT.select('text.label');
        labelMergeT.each(this.updateTextLines);
        this.layout.nodeLabelPosition(labelMergeT)
            .attr('text-anchor', 'middle')

        var payoff = nodesMerge.select('text.payoff');

        var payoffTspans = payoff.selectAll('tspan').data(d=>{
            let item = d.displayValue('childrenPayoff');
            return Utils.isArray(item) ? item : [item]
        });
        payoffTspans.exit().remove();

        var payoffTspansM = payoffTspans.enter().append('tspan').merge(payoffTspans);
        payoffTspansM
            // .attr('dominant-baseline', 'hanging')
            .attr('dy', (d,i)=>i>0 ? '1.1em': undefined)
            .attr('x', '0')
            .classed('negative', d=> {
                return d!==null && d<0;
            })
            .classed('sd-hidden', this.config.hidePayoffs || this.config.raw)
            .text(d=> {
                var val = d

                return val!==null ? (isNaN(val) ? val : self.config.payoffNumberFormatter(val)): ''
            });
        this.attachPayoffTooltip(payoffTspansM);


        var payoffT = payoff;
        if(this.transition){
            payoffT = payoff.transition();
        }

        this.layout.nodePayoffPosition(payoffEnter);
        this.layout.nodePayoffPosition(payoffT);

        var aggregatedPayoff = nodesMerge.select('text.aggregated-payoff');
        var aggregatedPayoffTspans = aggregatedPayoff.selectAll('tspan').data(d=>{
            let item = d.displayValue('aggregatedPayoff');
            return Utils.isArray(item) ? item : [item]
        });
        aggregatedPayoffTspans.exit().remove();
        var aggregatedPayoffTspansM = aggregatedPayoffTspans.enter().append('tspan').merge(aggregatedPayoffTspans)
            .attr('dy', (d,i)=>i>0 ? '0.95em': undefined)
            .classed('negative', d=> {
                return d!==null && d<0;
            })
            .classed('sd-hidden', this.config.hidePayoffs || this.config.raw)
            .text(val=> {
                return val!==null ? (isNaN(val) ? val : self.config.payoffNumberFormatter(val)): ''
            });

        this.attachPayoffTooltip(aggregatedPayoffTspansM, 'aggregatedPayoff');

        var aggregatedPayoffT = aggregatedPayoff;
        if(this.transition){
            aggregatedPayoffT = aggregatedPayoff.transition();
        }

        this.layout.nodeAggregatedPayoffPosition(aggregatedPayoffEnter);
        this.layout.nodeAggregatedPayoffPosition(aggregatedPayoffT);

        var probabilityToEnter = nodesMerge.select('text.probability-to-enter')
            .text(d=>{
                var val = d.displayValue('probabilityToEnter');
                return val!==null ? (isNaN(val) ? val : self.config.probabilityNumberFormatter(val)): ''
            })
            .classed('sd-hidden', this.config.hideProbabilities || this.config.raw);
        Tooltip.attach(probabilityToEnter, i18n.t('tooltip.node.probabilityToEnter'));


        var probabilityToEnterT = probabilityToEnter;
        if(this.transition){
            probabilityToEnterT = probabilityToEnter.transition();
        }
        this.layout.nodeProbabilityToEnterPosition(probabilityToEnterEnter);
        this.layout.nodeProbabilityToEnterPosition(probabilityToEnterT);


        var indicator = nodesMerge.select('text.error-indicator');
        indicator.classed('sd-hidden', this.config.raw)
        this.layout.nodeIndicatorPosition(indicatorEnter);
        this.layout.nodeIndicatorPosition(indicator);

        if(this.nodeDragHandler){
            nodesMerge.call(this.nodeDragHandler.drag);
        }

        nodesMerge.on('contextmenu', this.nodeContextMenu);
        nodesMerge.on('dblclick', this.nodeContextMenu)
        nodesMerge.each(function(d, i){
            var nodeElem = this;
            var mc = new Hammer.Manager(nodeElem);
            mc.add(new Hammer.Press({
                pointerType: 'touch'
            }));
            mc.on('press', function(e){
                if(e.pointerType=='touch'){
                    self.nodeDragHandler.cancelDrag();
                }
            })
        })
    }

    attachPayoffTooltip(selection, payoffFiledName = 'payoff', object='node'){
        var self = this;
        Tooltip.attach(selection, (d, i)=>{
            if(self.config.payoffNames.length>i && self.config.payoffNames[i] !== null){
                return i18n.t('tooltip.'+object+'.'+payoffFiledName+'.named',{value: d.payoff, number: i+1, name: self.config.payoffNames[i]})
            }
            return i18n.t('tooltip.'+object+'.'+payoffFiledName+'.default',{value: d.payoff, number: self.config.maxPayoffsToDisplay < 2 ? '' : i+1})
        });
    }

    updateTextLines(d){ //helper method for splitting text to tspans
        var lines = d.name ? d.name.split('\n') : [];
        lines.reverse();
        var tspans = d3.select(this).selectAll('tspan').data(lines);
        tspans.enter().append('tspan')
            .merge(tspans)
            .text(l=>l)
            .attr('dy', (d,i)=>i>0 ? '-1.1em': undefined)
            .attr('x', '0');

        tspans.exit().remove();
    }

    isOptimal(d){
        return d.displayValue('optimal');
    }

    redrawEdges() {
        var self = this;
        var edgesContainer = this.mainGroup.selectOrAppend('g.edges');
        if(self.config.forceFullEdgeRedraw){
            edgesContainer.selectAll("*").remove();
        }

        var edges = edgesContainer.selectAll('.edge').data(this.data.edges, (d,i)=> d.$id);
        edges.exit().remove();
        var edgesEnter = edges.enter().append('g')
            .attr('id', d=>'edge-'+d.$id)
            .attr('class', 'edge');


        edgesEnter.append('path');
        var labelEnter = edgesEnter.appendSelector('g.label-group');
        labelEnter.append('text').attr('class', 'label');
        var payoffEnter = edgesEnter.append('text').attr('class', 'payoff');
        var probabilityEnter = edgesEnter.append('text').attr('class', 'probability');


        var edgesMerge = edgesEnter.merge(edges);


        var optimalClassName = 'optimal';
        edgesMerge.classed(optimalClassName, (d)=>self.isOptimal(d));

        var edgesMergeT = edgesMerge;
        if(this.transition){
            edgesMergeT = edgesMerge.transition();
        }

        edgesMergeT.select('path')
            .attr('d', d=> this.layout.edgeLineD(d))
            // .attr("stroke", "black")
            // .attr("stroke-width", 2)
            .attr("fill", "none")
            .attr("marker-end", function(d) {
                var suffix = d3.select(this.parentNode).classed('selected') ? '-selected' : (self.isOptimal(d)?'-optimal':'');
                return "url(#arrow"+ suffix+")"
            });
            // .attr("shape-rendering", "optimizeQuality")


        edgesMerge.on('click', d=>{
            self.selectEdge(d, true)
        });

        this.layout.edgeLabelPosition(labelEnter);
        edgesMergeT.select('text.label').each(this.updateTextLines);
        var labelMerge = edgesMerge.select('g.label-group');
        labelMerge.classed('sd-hidden', this.config.hideLabels);
        var labelMergeT = edgesMergeT.select('g.label-group');
        this.layout.edgeLabelPosition(labelMergeT);
            // .text(d=>d.name);

        var payoff = edgesMerge.select('text.payoff');

        var payoffTspans = payoff.selectAll('tspan').data(d => {
            let item = d.displayValue('payoff');
            return Utils.isArray(item) ? item.slice(0, Math.min(item.length, self.config.maxPayoffsToDisplay)).map(_=>d) : [d];
        });
        payoffTspans.exit().remove();

        var payoffTspansM = payoffTspans.enter().append('tspan').merge(payoffTspans);
        payoffTspansM
        // .attr('dominant-baseline', 'hanging')
            .attr('dy', (d,i)=>i>0 ? '1.1em': undefined)
            // .attr('x', '0')

            // .attr('dominant-baseline', 'hanging')
            .classed('negative', (d, i)=> {
                var val = d.displayPayoff(undefined, i);
                return val!==null && val<0;
            })
            .classed('sd-hidden', this.config.hidePayoffs)
            // .text(d=> isNaN(d.payoff) ? d.payoff : self.config.payoffNumberFormatter(d.payoff))
            .text((d, i)=>{
                if(this.config.raw){
                    return d.payoff[i];
                }

                let item = d.displayValue('payoff');
                let items = Utils.isArray(item) ? item : [item];

                let val = items[i];
                if (val !== null) {
                    if (!isNaN(val)) {
                        return self.config.payoffNumberFormatter(val);
                    }
                    if (Utils.isString(val)) {
                        return val;
                    }
                }

                if (d.payoff[i] !== null && !isNaN(d.payoff[i]))
                    return self.config.payoffNumberFormatter(d.payoff[i]);

                return d.payoff[i];

            });

        Tooltip.attach(payoffTspansM, (d, i)=>{
            if(self.config.payoffNames.length>i && self.config.payoffNames[i] !== null){
                return i18n.t('tooltip.edge.payoff.named',{value: d.payoff[i], number: i+1, name: self.config.payoffNames[i]})
            }
            return i18n.t('tooltip.edge.payoff.default',{value: d.payoff[i], number: self.config.maxPayoffsToDisplay < 2 ? '' : i+1})
        });

        var payoffTextT = payoff;
        if(this.transition){
            payoffTextT = payoff.transition();
        }
        this.layout.edgePayoffPosition(payoffEnter);
        this.layout.edgePayoffPosition(payoffTextT);

        Tooltip.attach(edgesMerge.select('text.probability'), d=>i18n.t('tooltip.edge.probability',{value: d.probability=== undefined ? d.displayProbability() : d.probability}));

        edgesMerge.select('text.probability')
            .classed('sd-hidden', this.config.hideProbabilities);
        var probabilityMerge = edgesMerge.select('text.probability');
        probabilityMerge
            .attr('text-anchor', 'end')
            .text(d=>{
                if(this.config.raw){
                    return d.probability;
                }
                var val = d.displayProbability();

                if(val!==null){
                    if(!isNaN(val)){
                        return self.config.probabilityNumberFormatter(val);
                    }
                    if(Utils.isString(val)){
                        return val;
                    }
                }

                if(d.probability!==null && !isNaN(d.probability))
                    return self.config.probabilityNumberFormatter(d.probability);

                return d.probability;
            });
        var probabilityMergeT = probabilityMerge;
        if(this.transition){
            probabilityMergeT = probabilityMerge.transition();
        }

        this.layout.edgeProbabilityPosition(probabilityEnter);
        this.layout.edgeProbabilityPosition(probabilityMergeT);


        edgesContainer.selectAll('.edge.'+optimalClassName).raise();

        edgesMerge.on('contextmenu', this.edgeContextMenu);
        edgesMerge.on('dblclick', this.edgeContextMenu);
        edgesMerge.each(function(d, i){
            var elem = this;
            var mc = new Hammer.Manager(elem);
            mc.add(new Hammer.Press({
                pointerType: Hammer.POINTER_TOUCH
            }));
        })
    }

    redrawFloatingTexts() {
        var self = this;


        var textsContainer = this.mainGroup.selectOrAppend('g.floating-texts');
        var texts = textsContainer.selectAll('.floating-text').data(this.data.texts, (d,i)=> d.$id);
        texts.exit().remove();
        var textsEnter = texts.enter().appendSelector('g.floating-text')
            .attr('id', d=>'text-'+d.$id);


        var rectWidth = 40;
        var rectHeight = 20;

        textsEnter.append('rect').attr('x', -5).attr('y', -16).attr('fill-opacity', 0);
        textsEnter.append('text');

        var textsMerge = textsEnter.merge(texts);
        var textsMergeT = textsMerge;
        if(this.transition){
            textsMergeT = textsMerge.transition();
        }

        textsMergeT.attr('transform', d=>'translate(' + d.location.x + '  ' + d.location.y + ')');

        var tspans = textsMerge.select('text').selectAll('tspan').data(d=>d.value ? d.value.split('\n') : []);

        tspans.enter().append('tspan')
            .merge(tspans)
            .html(l=>AppUtils.replaceUrls(AppUtils.escapeHtml(l)))
            .attr('dy', (d,i)=>i>0 ? '1.1em': undefined)
            .attr('x', '0');

        tspans.exit().remove();
        textsMerge.classed('sd-empty', d=>!d.value || !d.value.trim());
        textsMerge.select('rect').attr('width', rectWidth).attr('height', rectHeight);

        textsMerge.each(function(d){
            if(!d.value){
                return;
            }
            var bb = d3.select(this).select('text').node().getBBox();
           d3.select(this).select('rect')
               .attr('y', bb.y-5)
               .attr('width', Math.max(bb.width+10, rectWidth))
               .attr('height', Math.max(bb.height+10, rectHeight))
        });

        if(this.textDragHandler){
            textsMerge.call(this.textDragHandler.drag);
        }
        textsMerge.on('contextmenu', this.textContextMenu);
        textsMerge.on('dblclick', this.textContextMenu);
        textsMerge.each(function(d, i){
            var elem = this;
            var mc = new Hammer.Manager(elem);
            mc.add(new Hammer.Press({
                pointerType: 'touch'
            }));
        })

    }

    updateValidationMessages() {
        var nodes = this.mainGroup.selectAll('.node');
        nodes.classed('error', false);

        this.data.validationResults.forEach(validationResult=>{
            if(validationResult.isValid()){
                return;
            }

            Object.getOwnPropertyNames(validationResult.objectIdToError).forEach(id=>{
                var errors = validationResult.objectIdToError[id];
                var nodeSelection = this.getNodeD3SelectionById(id);
                nodeSelection.classed('error', true);
                var tooltipHtml = '';
                errors.forEach(e=>{
                    if(tooltipHtml){
                        tooltipHtml+='<br/>'
                    }
                    tooltipHtml+=AppUtils.getValidationMessage(e);
                });

                Tooltip.attach(nodeSelection.select('.error-indicator'), tooltipHtml);


            })
        });
    }


    initEdgeMarkers() {
        var defs = this.svg.append("svg:defs");

        this.initArrowMarker("arrow");
        this.initArrowMarker("arrow-optimal");
        this.initArrowMarker("arrow-selected");
    }

    initArrowMarker(id) {

        var defs = this.svg.select("defs");
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

    updateBrushExtent() {
        var self =this;
        this.brush.extent([[0, 0], [self.svg.attr('width'), self.svg.attr('height')]]);
        this.brushContainer.call(this.brush);
    }
    initBrush() {
        var self = this;

        var brushContainer = self.brushContainer = this.brushContainer= this.svg.selectOrInsert("g.brush", ":first-child")
            .attr("class", "brush");

        var brush = this.brush = d3.brush()
            .on("start", brushstart)
            .on("brush", brushmove)
            .on("end", brushend);



        this.updateBrushExtent();

        brushContainer.select('.overlay').on("mousemove.edgeSelection", mousemoved);
        function mousemoved() {
            var m = d3.mouse(this);
            var mgt = self.getMainGroupTranslation();
            var margin = 10;

            var closest = [null, 999999999];
            var closeEdges = [];
            self.mainGroup.selectAll('.edge').each(function(d){
                var selection = d3.select(this);
                selection.classed('sd-hover', false);
                var pathNode = selection.select('path').node();
                var b = pathNode.getBBox();
                if(b.x+mgt[0] <=m[0] && b.x+b.width+mgt[0] >= m[0] &&
                   b.y+mgt[1]-margin <=m[1] && b.y+b.height+mgt[1]+margin >= m[1]){

                    var cp = AppUtils.closestPoint(pathNode, [m[0]-mgt[0], m[1]-mgt[1]]);
                    if(cp.distance < margin && cp.distance<closest[1]){
                        closest = [selection, cp.distance];
                    }
                }

            });

            self.hoveredEdge = null;
            if(closest[0]){
                closest[0].classed('sd-hover', true);
                self.hoveredEdge = closest[0];
            }

        }

        function brushstart() {
            if (!d3.event.selection) return;
            if(self.hoveredEdge){
                self.selectEdge(self.hoveredEdge.datum(), true)
            }else{
                self.clearSelection();
            }
            ContextMenu.hide();
        }

        // Highlight the selected nodes.
        function brushmove() {
            var s = d3.event.selection;
            if(!s)return;

            self.mainGroup.selectAll(".node").classed('selected', function (d) {
                var mainGroupTranslation = self.getMainGroupTranslation();
                var x = d.location.x+mainGroupTranslation[0];
                var y = d.location.y+mainGroupTranslation[1];
                var nodeSize = self.config.layout.nodeSize;
                var offset = nodeSize*0.25;
                return s[0][0] <= x+offset && x-offset <= s[1][0]
                    && s[0][1] <= y+offset && y-offset <= s[1][1];
            });
        }
        // If the brush is empty, select all circles.
        function brushend() {
            if (!d3.event.selection) return;
            brush.move(brushContainer, null);

            var selectedNodes = self.getSelectedNodes();
            if(selectedNodes && selectedNodes.length === 1){
                self.selectNode(selectedNodes[0]);
            }
            // if (!d3.event.selection) self.mainGroup.selectAll(".selected").classed('selected', false);
        }
    }

    disableBrush(){
        if(!this.brushDisabled){
            Utils.growl(i18n.t('growl.brushDisabled'), 'info', 'left')
        }
        this.brushDisabled = true;
        this.brushContainer.remove();
    }

    enableBrush(){
        if(this.brushDisabled){
            Utils.growl(i18n.t('growl.brushEnabled'), 'info', 'left')
            this.initBrush();
            this.brushDisabled = false;
        }


    }

    getMainGroupTranslation(invert) {
        var translation = AppUtils.getTranslation(this.mainGroup.attr("transform"));
        if(invert){
            translation[0] = -translation[0];
            translation[1] = -translation[1]
        }
        return translation;
    }

    initNodeContextMenu() {
        this.nodeContextMenu = new NodeContextMenu(this, this.config.operationsForObject);
    }

    initEdgeContextMenu() {
        this.edgeContextMenu = new EdgeContextMenu(this);
    }

    initTextContextMenu() {
        this.textContextMenu = new TextContextMenu(this);
    }



    initMainContextMenu() {
        this.mainContextMenu = new MainContextMenu(this);
        this.svg.on('contextmenu',this.mainContextMenu);
        this.svg.on('dblclick',this.mainContextMenu);
    }

    addText(text){
        this.data.saveState();
        this.data.addText(text);
        this.redraw();
        this.selectText(text);
    }

    addNode(node, parent, redraw=false){
        this.data.saveState();
        this.data.addNode(node, parent);
        this.redraw(true);
        this.layout.update(node);
        return node;
    }

    addDecisionNode(parent){
        var newNode = new model.DecisionNode(this.layout.getNewChildLocation(parent));
        this.addNode(newNode, parent)
    }
    addChanceNode(parent){
        var newNode = new model.ChanceNode(this.layout.getNewChildLocation(parent));
        this.addNode(newNode, parent)
    }
    addTerminalNode(parent){
        var newNode = new model.TerminalNode(this.layout.getNewChildLocation(parent));
        this.addNode(newNode, parent)
    }

    injectNode(node, edge){
        this.data.saveState();
        this.data.injectNode(node, edge);
        this.redraw();
        this.layout.update(node);
        return node;
    }

    injectDecisionNode(edge){
        var newNode = new model.DecisionNode(this.layout.getInjectedNodeLocation(edge));
        this.injectNode(newNode, edge);

    }

    injectChanceNode(edge){
        var newNode = new model.ChanceNode(this.layout.getInjectedNodeLocation(edge));
        this.injectNode(newNode, edge);
    }

    removeNode(node) {
        this.data.saveState();
        this.data.removeNode(node);


        if(!this.layout.isManualLayout()){
            this.layout.update();
        }else{
            this.redraw();
        }
    }

    removeSelectedNodes() {
        var selectedNodes = this.getSelectedNodes();
        if(!selectedNodes.length){
            return;
        }
        this.data.saveState();
        this.data.removeNodes(selectedNodes);
        this.clearSelection();
        this.redraw();
        this.layout.update();
    }

    removeSelectedTexts(){
        var selectedTexts = this.getSelectedTexts();

        if(!selectedTexts.length){
            return;
        }
        this.data.saveState();
        this.data.removeTexts(selectedTexts);
        this.clearSelection();
        this.redraw();
    }

    copyNode(d, notClearPrevSelection) {
        var clone = this.data.cloneSubtree(d);
        if(notClearPrevSelection){
            if(!this.copiedNodes){
                this.copiedNodes=[];
            }
            this.copiedNodes.push(clone);
        }else{
            this.copiedNodes = [clone];
        }

    }

    cutNode(d) {
        this.copyNode(d);
        this.removeNode(d);
    }

    cutSelectedNodes(){
        var selectedNodes = this.getSelectedNodes();
        var selectedRoots = this.data.findSubtreeRoots(selectedNodes);
        this.copyNodes(selectedRoots);
        this.removeSelectedNodes();
    }

    copySelectedNodes() {
        var self;
        var selectedNodes = this.getSelectedNodes();

        var selectedRoots = this.data.findSubtreeRoots(selectedNodes);
        this.copyNodes(selectedRoots);


    }

    copyNodes(nodes){
        this.copiedNodes = nodes.map(d=>this.data.cloneSubtree(d));
    }



    pasteToNode(node) {
        if(!this.copiedNodes || !this.copiedNodes.length){
            return;
        }
        this.data.saveState();
        var self = this;
        self.clearSelection();
        var nodesToAttach = this.copiedNodes;
        self.copyNodes(this.copiedNodes);
        nodesToAttach.forEach(toAttach=>{
            var attached = this.data.attachSubtree(toAttach, node).childNode;
            var location = self.layout.getNewChildLocation(node);
            attached.moveTo(location.x, location.y, true);
            self.layout.moveNodeToEmptyPlace(attached, false);
            self.layout.fitNodesInPlottingRegion(this.data.getAllDescendantNodes(attached));

            self.selectSubTree(attached, false, nodesToAttach.length>1);
        });
        setTimeout(function(){
            self.redraw();
            self.layout.update();
        },10)

    }

    pasteToNewLocation(point) {
        this.data.saveState();
        var self = this;
        self.clearSelection();
        var nodesToAttach = this.copiedNodes;
        self.copyNodes(this.copiedNodes);
        nodesToAttach.forEach(toAttach=> {
            var attached = this.data.attachSubtree(toAttach);

            attached.moveTo(point.x, point.y, true);
            self.layout.moveNodeToEmptyPlace(attached, false);
            self.layout.fitNodesInPlottingRegion(this.data.getAllDescendantNodes(attached));

            self.selectSubTree(attached, false, nodesToAttach.length>1);
        });

        setTimeout(function(){
            self.redraw();
            self.layout.update();
        },10)

    }

    convertNode(node, typeToConvertTo){
        var self = this;
        this.data.saveState();
        this.data.convertNode(node, typeToConvertTo);
        setTimeout(function(){
            self.redraw(true);
        },10)
    }

    performOperation(object, operation){
        var self = this;
        this.data.saveState();
        operation.perform(object);
        setTimeout(function(){
            self.redraw();
            self.layout.update();
        },10)
    }


    moveNodeTo(x,y){

    }

    updateNodePosition(node) {
        this.getNodeD3Selection(node).raise().attr('transform', 'translate('+node.location.x+' '+node.location.y+')');
    }

    updateTextPosition(text) {
        this.getTextD3Selection(text).raise().attr('transform', 'translate('+text.location.x+' '+text.location.y+')');
    }

    getNodeD3Selection(node){
        return this.getNodeD3SelectionById(node.$id);
    }

    getNodeD3SelectionById(id){
        return this.mainGroup.select('#node-'+id);
    }
    getTextD3Selection(text){
        return this.getTextD3SelectionById(text.$id);
    }
    getTextD3SelectionById(id){
        return this.mainGroup.select('#text-'+id);
    }

    getSelectedNodes() {
        return this.mainGroup.selectAll(".node.selected").data();
    }

    getSelectedTexts(){
        return this.mainGroup.selectAll(".floating-text.selected").data();
    }

    clearSelection(){
        this.mainGroup.selectAll(".edge.selected").select('path').attr("marker-end", d => "url(#arrow"+(this.isOptimal(d)?'-optimal':'')+")")
        this.mainGroup.selectAll(".selected").classed('selected', false);
        this.config.onSelectionCleared();
    }

    selectEdge(edge, clearSelectionBeforeSelect){
        if(clearSelectionBeforeSelect){
            this.clearSelection();
        }
        this.config.onEdgeSelected(edge);
        this.mainGroup.select('#edge-'+edge.$id)
            .classed('selected', true)
            .select('path')
            .attr("marker-end", d => "url(#arrow-selected)")
    }

    isNodeSelected(node){
        return this.getNodeD3Selection(node).classed('selected');
    }

    selectNode(node, clearSelectionBeforeSelect, skipCallback){
        if(clearSelectionBeforeSelect){
            this.clearSelection();
        }

        if(!skipCallback){
            this.config.onNodeSelected(node);
        }

        this.getNodeD3SelectionById(node.$id).classed('selected', true);
    }

    selectText(text, clearSelectionBeforeSelect, skipCallback){
        if(clearSelectionBeforeSelect){
            this.clearSelection();
        }

        if(!skipCallback){
            this.config.onTextSelected(text)
        }

        this.getTextD3SelectionById(text.$id).classed('selected', true);
    }

    selectSubTree(node, clearSelectionBeforeSelect,skipCallback) {
        if(clearSelectionBeforeSelect){
            this.clearSelection();
        }
        this.selectNode(node, false, skipCallback);
        node.childEdges.forEach(e=>this.selectSubTree(e.childNode, false, true));
    }

    selectAllNodes() {
        this.mainGroup.selectAll(".node").classed('selected', true);
    }

    autoLayout(type, withoutStateSaving){
        this.layout.autoLayout(type, withoutStateSaving);
    }

    updateDiagramTitle(titleValue){
        if(!titleValue){
            titleValue = '';
        }
        this.diagramTitle = titleValue;
        this.redrawDiagramTitle();
        this.redrawDiagramDescription();
        this.updateMargin(true);
    }

    redrawDiagramTitle(){
        var svgWidth = this.svg.attr('width');
        var svgHeight = this.svg.attr('height');
        this.titleContainer = this.svg.selectOrAppend('g.sd-title-container');

        var title = this.titleContainer.selectOrAppend('text.sd-title');
        title.text(this.diagramTitle);
        Layout.setHangingPosition(title);

        var marginTop = parseInt(this.config.title.margin.top);
        this.titleContainer.attr('transform', 'translate('+(svgWidth/2)+','+( marginTop)+')');
    }
    redrawDiagramDescription(){
        var svgWidth = this.svg.attr('width');
        var svgHeight = this.svg.attr('height');
        this.titleContainer = this.svg.selectOrAppend('g.sd-title-container');

        var desc = this.titleContainer.selectOrAppend('text.sd-description');

        if(!this.config.description.show){
            desc.remove();
            return;
        }

        var lines = this.diagramDescription ? this.diagramDescription.split('\n') : [];
        var tspans = desc.selectAll('tspan').data(lines);
        tspans.enter().append('tspan')
            .merge(tspans)
            .html(l=>AppUtils.replaceUrls(AppUtils.escapeHtml(l)))
            .attr('dy', (d,i)=>i>0 ? '1.1em': undefined)
            .attr('x', '0');

        tspans.exit().remove();
        Layout.setHangingPosition(desc);

        var title = this.titleContainer.selectOrAppend('text.sd-title');

        var marginTop = 0;
        if(this.diagramTitle){
            marginTop += title.node().getBBox().height;
            marginTop+= Math.max(parseInt(this.config.description.margin.top), 0);
        }


        desc.attr('transform', 'translate(0,'+( marginTop)+')');
    }

    updateDiagramDescription(descriptionValue){
        if(!descriptionValue){
            descriptionValue = '';
        }
        this.diagramDescription = descriptionValue;
        this.redrawDiagramTitle();
        this.redrawDiagramDescription();
        this.updateMargin(true);
    }


    getTitleGroupHeight(withMargins){
        if(!this.titleContainer){
            return 0;
        }
        var h = this.titleContainer.node().getBBox().height;
        if(withMargins){
            h+= parseInt(this.config.title.margin.bottom);
            h+= parseInt(this.config.title.margin.top);
        }
        return h;
    }

}
