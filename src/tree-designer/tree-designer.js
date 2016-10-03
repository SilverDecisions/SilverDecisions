import * as d3 from '../d3'

import {Utils} from '../utils'
import * as model from '../model/index'
import {ContextMenu} from '../context-menu'
import {MainContextMenu} from './main-context-menu'
import {NodeContextMenu} from './node-context-menu'

export class TreeDesignerConfig {
    width = undefined;
    height = undefined;
    margin = {
        left: 25,
        right: 25,
        top: 25,
        bottom: 25
    };
    layout={
        limitNodePositioning:true
    };

    symbolSize= 40;
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
        if (!config) {
            this.config = new TreeDesignerConfig();
        } else {
            this.config = config;
        }
        return this;
    }

    init(){
        this.minMarginBetweenNodes = this.config.symbolSize + 30;
        this.initSvg();
        this.initMainContextMenu();
        this.initBrush();
        this.initEdgeMarker();
        this.initNodeContextMenu();
        this.redraw();
    }

    redraw(){
        var self = this;
        this.redrawNodes();
        this.redrawEdges();
        setTimeout(function(){
            self.updatePlottingRegionSize();
        },10)

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

        var margin = this.config.margin;
        this.mainGroup = this.svg.selectOrAppend('g.main-group');
        this.mainGroup.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        if (!this.config.width) {
            d3.select(window)
                .on("resize.tree-designer", function () {
                    self.updatePlottingRegionSize();
                });
        }
    }

    initContainer(container) {
        this.container = container;
    }

    updatePlottingRegionSize() {
        this.computeAvailableSpace();
        var margin = this.config.margin;
        var svgWidth = this.svg.attr('width');
        var svgHeight = this.svg.attr('height');
        var mainGroupBox = this.mainGroup.node().getBBox();
        var newSvgWidth = mainGroupBox.width+mainGroupBox.x+margin.left+margin.right;
        newSvgWidth = Math.max(newSvgWidth, this.availableWidth);
        if(svgWidth!=newSvgWidth){
            this.svg.attr('width', newSvgWidth);
        }
        var newSvgHeight = mainGroupBox.height+mainGroupBox.y+margin.top+margin.bottom;
        newSvgHeight = Math.max(newSvgHeight, this.availableHeight);
        if(svgHeight!=newSvgHeight){
            this.svg.attr('height', newSvgHeight);
        }

        this.updateBrushExtent()
    }

    redrawNodes() {
        var self = this;
        var symbolSize = this.config.symbolSize;
        var symbol = d3.symbol().type(d=> d.$symbol)
            .size(d=>64);

        var nodesContainer = this.mainGroup.selectOrAppend('g.nodes');
        var nodes = nodesContainer.selectAll('.node').data(this.data.nodes, (d,i)=> d.$id);
        nodes.exit().remove();
        var nodesEnter = nodes.enter().append('g')
            .attr('id', d=>'node-'+d.$id)
            .attr('class', d=>d.type+'-node node');
        nodesEnter.append('path');

        nodesEnter.append('text').attr('class', 'label');
        nodesEnter.append('text').attr('class', 'payoff computed');

        var nodesMerge = nodesEnter.merge(nodes);

        var nodesMergeT = nodesMerge;
        if(this.transition){
            nodesMergeT = nodesMerge.transition();
            nodesMergeT.on('end', ()=> self.updatePlottingRegionSize())
        }
        nodesMergeT.attr('transform', d=>'translate(' + d.location.x + '  ' + d.location.y + ')');
        nodesMerge.select('path')
            .attr('transform', 'rotate(-90)')
            .attr('d', symbol)
            .each(function (d) {
                var path = d3.select(this);
                var box = path.node().getBBox();
                var error = Math.min(symbolSize / box.width, symbolSize / box.height);
                path.attr("d", symbol.size(error * error * 64));
            });



        nodesMergeT.select('text.label')
            .attr('x', 0)
            .attr('y', -symbolSize/2 - 7)
            .attr('text-anchor', 'middle')
            .text(d=>d.name);


        var payoff = nodesMerge.select('text.payoff')
            .attr('dominant-baseline', 'hanging')
            .classed('negative', d=>d.computed.payoff<0)
            .text(d=> d.computed.payoff!==null ? '$ '+d.computed.payoff : '');

        var payoffT = payoff;
        if(this.transition){
            payoffT = payoff.transition();
        }
        payoffT
            .attr('x', 0)
            .attr('y', symbolSize/2 + 7)
            .attr('text-anchor', 'middle')



        var self = this;

        var drag = d3.drag()
            .subject(function(d) {
                if(d==null){
                    return  {x: event.x, y: event.y};
                }
                var t = d3.select(this);
                return {x: t.attr("x") + Utils.getTranslation(t.attr("transform"))[0],
                    y: t.attr("y") + Utils.getTranslation(t.attr("transform"))[1]};
            })
            .on("start", function(d){
                self.dragStarted.call(this,d, self)
            })
            .on("drag", function (d) {
                self.drag.call(this, d, self);
            })
            .on("end", this.dragEnded);

        nodesMerge.call(drag);
        nodesMerge.on('contextmenu', this.nodeContextMenu);
        nodesMerge.on('dblclick', d=>self.selectSubTree(d, true))
    }

    getNodeMinX(d){
        var self = this;
        if(d && d.parent){// && !self.isNodeSelected(d.parent)
            return d.parent.location.x + self.minMarginBetweenNodes;
        }
        return self.config.symbolSize/2;
    }

    getNodeMinY(d){
        return this.config.symbolSize/2;
    }

    getNodeMaxX(d){
        var self = this;
        if(d && d.childEdges.length){
            return d3.min(d.childEdges, e=>e.childNode.location.x)-self.minMarginBetweenNodes;
        }
        return 9999999;
    }

    dragStarted(d,self) {
        self.currentAutoLayout = null;
        ContextMenu.hide();
        var node = d3.select(this);
        if(!node.classed("selected")){
            self.clearSelection();
        }

        node.classed("selected dragging", true);
        self.selectedNodes = self.getSelectedNodes();
        self.prevDragEvent = d3.event;
    }

    drag(draggedNode, self){
        var dx = d3.event.x - self.prevDragEvent.x;
        var limit = self.config.layout.limitNodePositioning;
        if(limit){
            if(dx<0){
                self.selectedNodes.sort((a,b)=>a.location.x-b.location.x);
            }else{
                self.selectedNodes.sort((a,b)=>b.location.x-a.location.x);
            }

            self.selectedNodes.forEach(TreeDesigner.backupNodeLocation);
        }

        var dy = d3.event.y-self.prevDragEvent.y;
        var minY = d3.min(self.selectedNodes, d=>d.location.y);
        if(minY + dy < self.getNodeMinY()){
            dy = self.getNodeMinY() - minY;
        }

        self.selectedNodes.forEach(d=>{
            if(limit){
                var minX = self.getNodeMinX(d);
                var maxX = self.getNodeMaxX(d);

                d.location.x = Math.min(Math.max(d.location.x+dx, minX), maxX);
                d.location.y += dy;
            }else{
                d.location.x +=dx;
                d.location.y += dy;
            }

        });

        var revertX = limit && (draggedNode.location.x == draggedNode.$location.x);

        self.selectedNodes.forEach(d=>{
            if(revertX){
                d.location.x = d.$location.x;
            }
            self.getNodeD3Selection(d).raise().attr('transform', 'translate('+d.location.x+' '+d.location.y+')');
        });

        self.prevDragEvent = d3.event;
        self.redrawEdges();
        self.updatePlottingRegionSize();
    }

    dragEnded(){
        var node = d3.select(this).classed("dragging", false);
    }

    static backupNodeLocation(node) {
        node.$location = new model.Point(node.location);
    }

    edgeLineD(edge){
        var line = d3.line()
            .x(d=> d[0])
            .y(d=> d[1])
            // .curve(d3.curveCatmullRom.alpha(0.5));


        var parentNode = edge.parentNode;
        var childNode = edge.childNode;

        var dX = childNode.location.x - parentNode.location.x;
        var dY = childNode.location.y - parentNode.location.y;

        var sign = dX>=0 ? 1 : -1;

        var slantStartXOffset = Math.min(dX/2, 30);
        var slantWidth = Math.min(20, Math.max(dX/2 - slantStartXOffset, 0));

        var point1 = [parentNode.location.x +this.config.symbolSize/2 + 1, parentNode.location.y];
        var point2 = [parentNode.location.x+slantStartXOffset, parentNode.location.y];
        var point3 = [parentNode.location.x+slantStartXOffset+slantWidth, childNode.location.y];
        var point4 = [childNode.location.x - (sign*(Math.max(0, Math.min(this.config.symbolSize/2+8, dX/2)))), childNode.location.y];
        // var point2 = [parentNode.location.x+dX/2-slantWidth/2, parentNode.location.y];
        // var point3 = [childNode.location.x-(dX/2-slantWidth/2), childNode.location.y];

        edge.$linePoints = [point1, point2, point3, point4];
        return line(edge.$linePoints);
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
        edgesEnter.append('text').attr('class', 'label');
        edgesEnter.append('text').attr('class', 'payoff');
        edgesEnter.append('text').attr('class', 'probability');

        var edgesMerge = edgesEnter.merge(edges);

        var edgesMergeT = edgesMerge;
        if(this.transition){
            edgesMergeT = edgesMerge.transition();
        }
        edgesMergeT.select('path')
            .attr('d', d=> this.edgeLineD(d))
            .attr("stroke", "black")
            // .attr("stroke-width", 2)
            .attr("fill", "none")
            .attr("marker-end", "url(#arrow)")
            .attr("shape-rendering", "optimizeQuality")

        edgesMerge.on('click', d=>{
            self.selectEdge(d, true)
        });


        edgesMergeT.select('text.label')
            .attr('x', d=>d.$linePoints[2][0]+2)
            .attr('y', d=>d.$linePoints[2][1]-7)
            .text(d=>d.name);

        var payoffText = edgesMerge.select('text.payoff')
            .attr('dominant-baseline', 'hanging')
            .classed('negative', d=>d.payoff<0)
            .text(d=>'$ '+d.payoff);

        var payoffTextT = payoffText;
        if(this.transition){
            payoffTextT = payoffText.transition();
        }
        payoffTextT
            .attr('x', d=>d.$linePoints[2][0]+2)
            .attr('y', d=>d.$linePoints[2][1]+7)


        edgesMergeT.select('text.probability')
            .attr('dominant-baseline', 'hanging') //TODO not working in IE
            .attr('text-anchor', 'end')
            .attr('x', function(d){
                var len = d3.select(this).node().getComputedTextLength();
                var min = d.$linePoints[2][0]+2+d3.select(this.previousSibling).node().getBBox().width+7+len;
                return Math.max(min,d.$linePoints[3][0]-8);
            })
            .attr('y', d=>d.$linePoints[2][1]+7)
            .text(d=>d.probability ? d.probability: '')
    }

    initEdgeMarker() {
        console.log(this.svg);
        var defs = this.svg.append("svg:defs");

        defs.append("marker")
            .attr("id","arrow")
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


        var mainGroupTranslation = this.getMainGroupTranslation();
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

                var x = d.location.x+mainGroupTranslation[0];
                var y = d.location.y+mainGroupTranslation[1];
                return s[0][0] <= x && x <= s[1][0]
                    && s[0][1] <= y && y <= s[1][1];
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
        this.data.addNode(node, parent);
        this.redraw();
        if(this.currentAutoLayout){
            this.autoLayout(this.currentAutoLayout);
        }
        return node;
    }
    
    removeNode(node) {
        this.data.removeNode(node);

        if(this.currentAutoLayout){
            this.autoLayout(this.currentAutoLayout);
        }else{
            this.redraw();
        }
    }

    removeSelectedNodes() {
        var selectedNodes = this.getSelectedNodes();
        this.data.removeNodes(selectedNodes);
        this.clearSelection();
        this.redraw();
        if(this.currentAutoLayout){
            this.autoLayout(this.currentAutoLayout);
        }
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

    fitNodesInPlottingRegion(nodes){
        var self = this;
        var topY = d3.min(nodes, n=>n.location.y);
        var minY = self.getNodeMinY();
        var dy = topY - minY;
        if(dy<0){
            nodes.forEach(n=>n.move(0, -dy));
        }
    }

    pasteToNode(node) {
        var self = this;
        var toAttach = this.copiedNode;
        self.copyNode(toAttach);
        var attached = this.data.attachSubtree(toAttach, node);

        attached.moveTo(node.location.x+120, node.location.y, true);
        self.fitNodesInPlottingRegion(this.data.getAllDescendantNodes(attached));

        this.redraw();
        if(this.currentAutoLayout){
            this.autoLayout(this.currentAutoLayout);
        }

        self.selectSubTree(attached, true);
    }

    pasteToNewLocation(point) {
        var self = this;
        var toAttach = this.copiedNode;
        self.copyNode(toAttach);
        var attached = this.data.attachSubtree(toAttach);

        attached.moveTo(point.x, point.y, true);
        self.fitNodesInPlottingRegion(this.data.getAllDescendantNodes(attached));

        this.redraw();
        if(this.currentAutoLayout){
            this.autoLayout(this.currentAutoLayout);
        }

        self.selectSubTree(attached, true);
    }

    moveNodeTo(x,y){

    }

    getNodeD3Selection(node){
        return this.mainGroup.select('#node-'+node.$id);
    }

    getSelectedNodes() {
        return this.mainGroup.selectAll(".node.selected").data();
    }

    clearSelection(){
        this.mainGroup.selectAll(".selected").classed('selected', false);
    }

    selectEdge(edge, clearSelectionBeforeSelect){
        if(clearSelectionBeforeSelect){
            this.clearSelection();
        }
        this.mainGroup.select('#edge-'+edge.$id).classed('selected', true);
    }

    isNodeSelected(node){
        return this.getNodeD3Selection(node).classed('selected');
    }

    selectNode(node, clearSelectionBeforeSelect){
        if(clearSelectionBeforeSelect){
            this.clearSelection();
        }
        this.mainGroup.select('#node-'+node.$id).classed('selected', true);
    }

    selectSubTree(node, clearSelectionBeforeSelect) {
        if(clearSelectionBeforeSelect){
            this.clearSelection();
        }
        this.selectNode(node);
        node.childEdges.forEach(e=>this.selectSubTree(e.childNode));
    }

    selectAllNodes() {
        this.mainGroup.selectAll(".node").classed('selected', true);
    }

    autoLayout(type){
        var self=this;
        if(!this.data.nodes.length){
            return;
        }

        var nodeTypeOrder = {
            'decision' : 0,
            'chance': 0,
            'terminal': 1
        };

        var treeMargin = 50;

        var prevTreeMaxY = self.getNodeMinY();
        this.data.getRoots().forEach(r=>{
            var root = d3.hierarchy(r, d=>{
                return d.childEdges.map(e=>e.childNode);
            });



            root.sort((a,b)=>nodeTypeOrder[a.data.type]-nodeTypeOrder[b.data.type]);

            var height = 65, width=150;

            var layout;
            if(type=='cluster'){
                height  =65;
                layout = d3.cluster();
            }else{
                layout = d3.tree();
            }
            layout.nodeSize([height, width]);

            layout(root);
            var topNode = root;
            while(topNode.children && topNode.children.length){
                topNode = topNode.children[0];
            }

            var dy = root.x - topNode.x + prevTreeMaxY;
            var dx = self.getNodeMinX();
            var maxY=0;
            root.each(d=>{
                d.data.location.x = d.y + dx;
                d.data.location.y = d.x + dy;

                maxY = Math.max(maxY, d.data.location.y);
            });

            prevTreeMaxY = maxY + self.config.symbolSize+treeMargin;
        });


        this.transition = true;
        this.redraw();
        this.transition = false;

        this.currentAutoLayout = type;
        return this;
    }
}
