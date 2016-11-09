import * as d3 from '../d3'

import {Utils} from '../utils'
import * as model from '../model/index'
import {ContextMenu} from '../context-menu'
import {MainContextMenu} from './main-context-menu'
import {NodeContextMenu} from './node-context-menu'
import {Layout} from './layout'
import {NodeDragHandler} from './node-drag-handler'
import {Tooltip} from '../tooltip'
import {ValidationResult} from '../validation/validation-result'
import * as _ from "lodash";
import {Templates} from "../templates";

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
            color: 'back'
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
        fontSize: '16px',
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#000000',
        margin:{
            top: 5,
            bottom: 10
        }
    };

    $readOnly= false;

    payoffNumberFormatter = (v)=> v;
    probabilityNumberFormatter  = (v)=> v;

    onNodeSelected = (node) => {};
    onEdgeSelected = (edge) => {};
    onSelectionCleared = () => {};

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
            this.initNodeDragHandler();
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

    redraw(withTransitions){
        var self = this;
        this.updateMargin(withTransitions);
        if(withTransitions){
            self.transitionPrev = self.transition;
            self.transition = true;
        }
        this.redrawNodes();
        this.redrawEdges();
        this.redrawDiagramTitle();
        if(withTransitions){
            self.transition =  self.transitionPrev;
        }
        setTimeout(function(){
            self.updatePlottingRegionSize();
        },10);

        return this;
    }

    computeAvailableSpace(){
        this.availableHeight = Utils.sanitizeHeight(this.config.height, this.container, this.config.margin);
        this.availableWidth = Utils.sanitizeWidth(this.config.width, this.container, this.config.margin);
    }



    initSvg() {
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
    }

    updateMargin(withTransitions){
        var self = this;
        var margin = this.config.margin;
        var group = this.mainGroup;
        if(withTransitions){
            group = group.transition();
        }

        var topMargin = margin.top;
        if(this.diagramTitle||this.diagramDescription){
            topMargin = parseInt(this.diagramTitle ? this.config.title.margin.top : 0) + this.getTitleGroupHeight()
                +  Math.max(topMargin, parseInt(this.config.title.margin.bottom));
        }

        group.attr("transform", "translate(" + margin.left + "," + topMargin + ")").on("end", ()=> self.updatePlottingRegionSize());
    }

    setMargin(margin, withoutStateSaving){
        var self=this;
        if(!withoutStateSaving){
            this.data.saveState({
                data:{
                    margin: _.clone(self.config.margin)
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
        var newSvgHeight = mainGroupBox.height+mainGroupBox.y+margin.top+margin.bottom;

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
        this.layout.nodeLabelPosition(nodesMergeT.select('text.label'))

            .attr('text-anchor', 'middle')
            .text(d=>d.name);

        var ruleName = this.config.$rule;
        var payoff = nodesMerge.select('text.payoff')
            // .attr('dominant-baseline', 'hanging')
            .classed('negative', d=> {
                var val = d.computedValue(ruleName, 'childrenPayoff');
                return val!==null && val<0;
            })
            .text(d=> {
                var val = d.computedValue(ruleName, 'childrenPayoff');
                return val!==null && !isNaN(val) ? self.config.payoffNumberFormatter(val): ''
            });

        var payoffT = payoff;
        if(this.transition){
            payoffT = payoff.transition();
        }

        this.layout.nodePayoffPosition(payoffEnter);
        this.layout.nodePayoffPosition(payoffT);

        var aggregatedPayoff = nodesMerge.select('text.aggregated-payoff')
            .classed('negative', d=> {
                var val = d.computedValue(ruleName, 'aggregatedPayoff');
                return val!==null && val<0;
            })
            .text(d=> {
                var val = d.computedValue(ruleName, 'aggregatedPayoff');
                return val!==null && !isNaN(val) ? self.config.payoffNumberFormatter(val): ''
            });

        var aggregatedPayoffT = aggregatedPayoff;
        if(this.transition){
            aggregatedPayoffT = aggregatedPayoff.transition();
        }

        this.layout.nodeAggregatedPayoffPosition(aggregatedPayoffEnter);
        this.layout.nodeAggregatedPayoffPosition(aggregatedPayoffT);

        var probabilityToEnter = nodesMerge.select('text.probability-to-enter')
            .text(d=>{
                var val = d.computedValue(ruleName, 'probabilityToEnter');
                return val!==null && !isNaN(val) ? self.config.probabilityNumberFormatter(val): ''
            });

        var probabilityToEnterT = probabilityToEnter;
        if(this.transition){
            probabilityToEnterT = probabilityToEnter.transition();
        }
        this.layout.nodeProbabilityToEnterPosition(probabilityToEnterEnter);
        this.layout.nodeProbabilityToEnterPosition(probabilityToEnterT);


        var indicator = nodesMerge.select('text.error-indicator');
        this.layout.nodeIndicatorPosition(indicatorEnter);
        this.layout.nodeIndicatorPosition(indicator);

        if(this.nodeDragHandler){
            nodesMerge.call(this.nodeDragHandler.drag);
        }

        nodesMerge.on('contextmenu', this.nodeContextMenu);
        nodesMerge.on('dblclick', d=>self.selectSubTree(d, true))
    }

    isOptimal(d){
        var ruleName = this.config.$rule;
        return d.computedValue(ruleName, 'optimal');
    }

    redrawEdges() {
        var self = this;
        var edgesContainer = this.mainGroup.selectOrAppend('g.edges');
        var edges = edgesContainer.selectAll('.edge').data(this.data.edges, (d,i)=> d.$id);
        edges.exit().remove();
        var edgesEnter = edges.enter().append('g')
            .attr('id', d=>'edge-'+d.$id)
            .attr('class', 'edge');


        edgesEnter.append('path');
        var labelEnter = edgesEnter.append('text').attr('class', 'label');
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
            .attr("marker-end", d => "url(#arrow"+(self.isOptimal(d)?'-optimal':'')+")")
            .attr("shape-rendering", "optimizeQuality")


        edgesMerge.on('click', d=>{
            self.selectEdge(d, true)
        });

        this.layout.edgeLabelPosition(labelEnter);
        this.layout.edgeLabelPosition(edgesMergeT.select('text.label'))
            .text(d=>d.name);

        var payoffText = edgesMerge.select('text.payoff')
            // .attr('dominant-baseline', 'hanging')
            .classed('negative', d=>d.payoff<0)
            .text(d=> isNaN(d.payoff) ? d.payoff : self.config.payoffNumberFormatter(d.payoff));

        var payoffTextT = payoffText;
        if(this.transition){
            payoffTextT = payoffText.transition();
        }
        this.layout.edgePayoffPosition(payoffEnter);
        this.layout.edgePayoffPosition(payoffTextT);
        var ruleName = this.config.$rule;

        var probabilityMerge = edgesMergeT.select('text.probability');
        probabilityMerge
            // .attr('dominant-baseline', 'hanging') //TODO not working in IE
            .attr('text-anchor', 'end')
            .text(d=>{
                var val = d.computedValue(ruleName, 'probability');
                return val!==null && !isNaN(val) ? self.config.probabilityNumberFormatter(val): d.probability
            });

        this.layout.edgeProbabilityPosition(probabilityMerge);
        this.layout.edgeProbabilityPosition(probabilityEnter);

        edgesContainer.selectAll('.edge.'+optimalClassName).raise();
    }
    updateValidationMessages(validationResults) {
        var nodes = this.mainGroup.selectAll('.node');
        nodes.classed('error', false);

        validationResults.forEach(validationResult=>{
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
                    tooltipHtml+=ValidationResult.getMessage(e);
                });

                nodeSelection.select('.error-indicator').on('mouseover', function (d) {
                    Tooltip.show(tooltipHtml);
                }).on("mouseout", function (d) {
                    Tooltip.hide();
                });

            })
        });
    }


    initEdgeMarkers() {
        console.log(this.svg);
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
        var brushContainer = this.brushContainer= this.svg.selectOrInsert("g.brush", ":first-child")
            .attr("class", "brush");

        var brush = this.brush = d3.brush()
            .on("start", brushstart)
            .on("brush", brushmove)
            .on("end", brushend);



        this.updateBrushExtent();


        function brushstart() {
            if (!d3.event.selection) return;
            self.clearSelection();
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

            // if (!d3.event.selection) self.mainGroup.selectAll(".selected").classed('selected', false);
        }
    }

    getMainGroupTranslation(invert) {
        var translation = Utils.getTranslation(this.mainGroup.attr("transform"));
        if(invert){
            translation[0] = -translation[0];
            translation[1] = -translation[1]
        }
        return translation;
    }

    initNodeContextMenu() {
        this.nodeContextMenu = new NodeContextMenu(this);
    }

    initMainContextMenu() {
        this.mainContextMenu = new MainContextMenu(this);
        this.svg.on('contextmenu',this.mainContextMenu);
    }

    addNode(node, parent){
        this.data.saveState();
        this.data.addNode(node, parent);

        this.redraw();
        this.layout.update(node);
        return node;
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
        this.data.saveState();
        var selectedNodes = this.getSelectedNodes();
        this.data.removeNodes(selectedNodes);
        this.clearSelection();
        this.redraw();
        this.layout.update();
    }

    copyNode(d) {
        this.copiedNode = this.data.cloneSubtree(d);
    }

    cutNode(d) {
        this.copyNode(d);
        this.removeNode(d);
    }

    copySelectedNodes() {
        var self;
        var selectedNodes = this.getSelectedNodes();

        var selectedRoots = this.data.findSubtreeRoots(selectedNodes);
        this.copiedNodes = selectedRoots.map(d=>this.data.cloneSubtree(d));
        //TODO

    }



    pasteToNode(node) {
        this.data.saveState();
        var self = this;
        var toAttach = this.copiedNode;
        self.copyNode(toAttach);
        var attached = this.data.attachSubtree(toAttach, node);

        var location = self.layout.getNewChildLocation(node);
        attached.moveTo(location.x, location.y, true);
        self.layout.moveNodeToEmptyPlace(attached);
        self.layout.fitNodesInPlottingRegion(this.data.getAllDescendantNodes(attached));

        this.redraw();
        self.layout.update();

        self.selectSubTree(attached, true);
    }

    pasteToNewLocation(point) {
        this.data.saveState();
        var self = this;
        var toAttach = this.copiedNode;
        self.copyNode(toAttach);
        var attached = this.data.attachSubtree(toAttach);

        attached.moveTo(point.x, point.y, true);
        self.layout.fitNodesInPlottingRegion(this.data.getAllDescendantNodes(attached));

        this.redraw();
        self.layout.update();

        self.selectSubTree(attached, true);
    }

    moveNodeTo(x,y){

    }

    updateNodePosition(node) {
        this.getNodeD3Selection(node).raise().attr('transform', 'translate('+node.location.x+' '+node.location.y+')');
    }

    getNodeD3Selection(node){
        return this.getNodeD3SelectionById(node.$id);
    }

    getNodeD3SelectionById(id){
        return this.mainGroup.select('#node-'+id);
    }

    getSelectedNodes() {
        return this.mainGroup.selectAll(".node.selected").data();
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
        desc.text(this.diagramDescription);
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
