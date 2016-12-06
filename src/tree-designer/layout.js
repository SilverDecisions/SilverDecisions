import {Utils} from '../utils'
import * as model from '../model/index'
import * as d3 from '../d3'
import * as _ from "lodash";

/*Tree layout manager*/
export class Layout{

    treeDesigner;
    data;
    config;

    static MANUAL_LAYOUT_NAME = 'manual';


    onAutoLayoutChanged=[];

    nodeTypeOrder = {
        'decision' : 0,
        'chance': 0,
        'terminal': 1
    };

    treeMargin = 50;
    targetSymbolSize={};
    nodeSeparation = (a, b) => a.parent == b.parent ? 1 : 1.2

    constructor(treeDesigner, data, config){
        this.treeDesigner = treeDesigner;
        this.data = data;
        this.config = config;

    }

    update(node){
        if(!this.isManualLayout()){
            return this.autoLayout(this.config.type, true);
        }
        if(node){
            this.moveNodeToEmptyPlace(node);
        }
    }

    isManualLayout(){
        return this.config.type == Layout.MANUAL_LAYOUT_NAME;
    }

    getNewChildLocation(parent){
        var x = parent.location.x + this.config.gridWidth;
        var y = parent.location.y;
        if(parent.childEdges.length){
            y = parent.childEdges[parent.childEdges.length-1].childNode.location.y+1;
        }

        return new model.Point(x, y)
    }

    getInjectedNodeLocation(edge){

        var p = edge.$linePoints[2];

        return new model.Point(p[0], p[1])
    }

    moveNodeToEmptyPlace(node){
        var positionMap = {};
        var self = this;
        node.location.x = Math.max(this.getNodeMinX(node), node.location.x);
        node.location.y = Math.max(this.getNodeMinY(node), node.location.y);


        this.nodesSortedByX = this.data.nodes.slice();
        this.nodesSortedByX.sort((a,b)=>a.location.x - b.location.x);

        function findCollidingNode(node, location){
            return _.find(self.nodesSortedByX, n=>{
                if(node == n){
                    return false;
                }

                var margin = self.config.nodeSize/3;
                var x = n.location.x;
                var y = n.location.y;

                return (location.x - margin <= x && location.x + margin >= x
                    && location.y - margin <= y && location.y + margin >= y)
            });
        }

        var stepX = this.config.nodeSize/2;
        var stepY = this.config.nodeSize+10;
        var stepXsameParent = 0;
        var stepYsameParent = 75;
        var changed = false;
        var colidingNode;
        var newLocation = new model.Point(node.location);
        while(colidingNode = findCollidingNode(node, newLocation)){
            changed=true;
            var sameParent = node.$parent && colidingNode.$parent && node.$parent==colidingNode.$parent;
            if(sameParent){
                newLocation.move(stepXsameParent, stepYsameParent);
            }else{
                newLocation.move(stepX, stepY);
            }
        }
        if(changed){
            node.moveTo(newLocation.x,newLocation.y, true);
            this.treeDesigner.redraw(true);
        }
    }

    disableAutoLayout(){
        this.config.type = Layout.MANUAL_LAYOUT_NAME;
        this._fireOnAutoLayoutChangedCallbacks();
    }


    drawNodeSymbol(path, transition){
        var self = this;
        var nodeSize = this.config.nodeSize;
        this.nodeSymbol = d3.symbol().type(d=> d.$symbol)
            .size(d=>d.$symolSize ? _.get(self.targetSymbolSize, d.type+"['"+self.config.nodeSize+"']", 64) : 64);

        path.attr('transform', 'rotate(-90)')
            .each(function (d) {
                var path = d3.select(this);
                var prev = path.attr("d");
                if(!prev){
                    path.attr("d", self.nodeSymbol);
                }
                var size = _.get(self.targetSymbolSize, d.type+"['"+self.config.nodeSize+"']");
                if(!size){
                    var box = path.node().getBBox();
                    var error = Math.min(nodeSize / box.width, nodeSize / box.height);
                    size = error * error * (d.$symolSize||64);
                    _.set(self.targetSymbolSize, d.type+"['"+self.config.nodeSize+"']", size);
                }
                if(transition){
                    path =  path.transition();
                }
                path.attr("d", self.nodeSymbol);

                d.$symolSize = size;

            });
    }

    nodeLabelPosition(selection) {
        return selection
            .attr('x', 0)
            .attr('y', -this.config.nodeSize / 2 - 7)
    }

    nodePayoffPosition(selection) {
        return Layout.setHangingPosition(selection)
            .attr('x', 0)
            .attr('y', this.config.nodeSize / 2 + 7)
            .attr('text-anchor', 'middle')
    }

    nodeAggregatedPayoffPosition(selection) {
        var fontSize = 12;
        return Layout.setHangingPosition(selection)
            .attr('x', this.config.nodeSize / 2 + 7)
            .attr('y', -Math.max(fontSize+ 5, this.config.nodeSize / 2)+ 5)

            // .attr('text-anchor', 'middle')
            // .attr('dominant-baseline', 'hanging')
    }

    nodeProbabilityToEnterPosition(selection) {
        var fontSize = 12;
        return selection
            .attr('x', this.config.nodeSize / 2 + 7)
            .attr('y', Math.max(fontSize+ 5, this.config.nodeSize / 2) -5)
            // .attr('text-anchor', 'middle')
            // .attr('dominant-baseline', 'central')
    }

    nodeIndicatorPosition(selection) {
        return selection
            .attr('x', this.config.nodeSize / 2 + 8)
            .attr('y', - this.config.nodeSize/2)
            .attr('dominant-baseline', 'central')
            .attr('text-anchor', 'middle')
    }

    edgeLineD(edge){
        var line = d3.line()
            .x(d=> d[0])
            .y(d=> d[1]);
        // .curve(d3.curveCatmullRom.alpha(0.5));


        var parentNode = edge.parentNode;
        var childNode = edge.childNode;

        var dX = childNode.location.x - parentNode.location.x;
        var dY = childNode.location.y - parentNode.location.y;

        var sign = dX>=0 ? 1 : -1;

        var slantStartXOffset = Math.min(dX/2, this.config.nodeSize/2+10);
        var slantWidth = Math.min(this.config.edgeSlantWidthMax, Math.max(dX/2 - slantStartXOffset, 0));

        var point1 = [parentNode.location.x +this.config.nodeSize/2 + 1, parentNode.location.y];
        var point2 = [Math.max(parentNode.location.x+slantStartXOffset, point1[0]), parentNode.location.y];
        var point3 = [parentNode.location.x+slantStartXOffset+slantWidth, childNode.location.y];
        var point4 = [childNode.location.x - (sign*(Math.max(0, Math.min(this.config.nodeSize/2+8, dX/2)))), childNode.location.y];
        // var point2 = [parentNode.location.x+dX/2-slantWidth/2, parentNode.location.y];
        // var point3 = [childNode.location.x-(dX/2-slantWidth/2), childNode.location.y];

        edge.$linePoints = [point1, point2, point3, point4];
        return line(edge.$linePoints);
    }

    edgePayoffPosition(selection) {
        return Layout.setHangingPosition(selection)
            .attr('x', d=>d.$linePoints[2][0] + 2)
            .attr('y', d=>d.$linePoints[2][1] + 7)

    }

    edgeLabelPosition(selection) {
        return selection
            .attr('transform', d=>'translate('+(d.$linePoints[2][0] + 2)+','+(d.$linePoints[2][1] - 7)+')')
            // .attr('x', d=>d.$linePoints[2][0] + 2)
            // .attr('y', d=>d.$linePoints[2][1] - 7)

    }

    edgeProbabilityPosition(selection) {
        return Layout.setHangingPosition(selection)
            .attr('x', function (d) {
                var len = d3.select(this).node().getComputedTextLength();
                var min = d.$linePoints[2][0] + 2 + d3.select(this.previousSibling).node().getBBox().width + 7 + len;
                return Math.max(min, d.$linePoints[3][0] - 8);
            })
            .attr('y', d=>d.$linePoints[2][1] + 7)


    }

    getMinMarginBetweenNodes(){
      return this.config.nodeSize + 30;
    }


    getNodeMinX(d){
        var self = this;
        if(d && d.$parent){// && !self.isNodeSelected(d.$parent)
            return d.$parent.location.x + self.getMinMarginBetweenNodes();
        }
        return self.config.nodeSize/2;
    }

    getNodeMinY(d){
        return this.config.nodeSize/2;
    }

    getNodeMaxX(d){
        var self = this;
        if(d && d.childEdges.length){
            return d3.min(d.childEdges, e=>e.childNode.location.x)-self.getMinMarginBetweenNodes();
        }
        return 9999999;
    }

    setGridWidth(width, withoutStateSaving){
        var self=this;
        if(this.config.gridWidth==width){
            return;
        }
        if(!withoutStateSaving){
            this.data.saveState({
                data:{
                    gridWidth: self.config.gridWidth
                },
                onUndo: (data)=> {
                    self.setGridWidth(data.gridWidth, true);
                },
                onRedo: (data)=> {
                    self.setGridWidth(width, true);
                }
            });
        }

        this.config.gridWidth=width;
        this.update();
    }

    setGridHeight(gridHeight, withoutStateSaving){
        var self=this;
        if(this.config.gridHeight==gridHeight){
            return;
        }
        if(!withoutStateSaving){
            this.data.saveState({
                data:{
                    gridHeight: self.config.gridHeight
                },
                onUndo: (data)=> {
                    self.setGridHeight(data.gridHeight, true);
                },
                onRedo: (data)=> {
                    self.setGridHeight(gridHeight, true);
                }
            });
        }

        this.config.gridHeight=gridHeight;
        this.update();
    }

    setNodeSize(nodeSize, withoutStateSaving){
        var self=this;
        if(this.config.nodeSize==nodeSize){
            return;
        }
        if(!withoutStateSaving){
            this.data.saveState({
                data:{
                    nodeSize: self.config.nodeSize
                },
                onUndo: (data)=> {
                    self.setNodeSize(data.nodeSize, true);
                },
                onRedo: (data)=> {
                    self.setNodeSize(nodeSize, true);
                }
            });
        }

        this.config.nodeSize=nodeSize;
        this.update();
        if(this.isManualLayout()){
            this.fitNodesInPlottingRegion(self.data.getRoots());
            this.treeDesigner.redraw(true);
        }
    }

    setEdgeSlantWidthMax(width, withoutStateSaving){
        var self=this;
        if(this.config.edgeSlantWidthMax==width){
            return;
        }
        if(!withoutStateSaving){
            this.data.saveState({
                data:{
                    edgeSlantWidthMax: self.config.edgeSlantWidthMax
                },
                onUndo: (data)=> {
                    self.setEdgeSlantWidthMax(data.edgeSlantWidthMax, true);
                },
                onRedo: (data)=> {
                    self.setEdgeSlantWidthMax(width, true);
                }
            });
        }

        this.config.edgeSlantWidthMax=width;
        this.treeDesigner.redraw(true);
    }

    autoLayout(type, withoutStateSaving){
        var self=this;



        if(!withoutStateSaving){
            this.data.saveState({
                data:{
                    newLayout: type,
                    currentLayout: self.config.type
                },
                onUndo: (data)=> {
                    self.config.type = data.currentLayout;
                    self._fireOnAutoLayoutChangedCallbacks();
                },
                onRedo: (data)=> {
                    self.autoLayout(data.newLayout, true);
                }
            });
        }
        this.config.type = type;
        if(!this.data.nodes.length){
            this._fireOnAutoLayoutChangedCallbacks();
            return;
        }

        var prevTreeMaxY = self.getNodeMinY();
        this.data.getRoots().forEach(r=>{
            var root = d3.hierarchy(r, d=>{
                return d.childEdges.map(e=>e.childNode);
            });

            // root.sort((a,b)=>self.nodeTypeOrder[a.data.type]-self.nodeTypeOrder[b.data.type]);
            root.sort((a,b)=>a.data.location.y - b.data.location.y);


            var layout;
            if(type=='cluster'){
                layout = d3.cluster();
            }else{
                layout = d3.tree();
            }
            layout.nodeSize([self.config.gridHeight, self.config.gridWidth]);
            layout.separation(self.nodeSeparation);

            layout(root);
            var minY = 999999999;
            root.each(d=>{
                minY = Math.min(minY, d.x);
            });

            var dy = root.x - minY + prevTreeMaxY;
            var dx = self.getNodeMinX();
            var maxY=0;
            root.each(d=>{
                d.data.location.x = d.y + dx;
                d.data.location.y = d.x + dy;

                maxY = Math.max(maxY, d.data.location.y);
            });

            prevTreeMaxY = maxY + self.config.nodeSize+self.treeMargin;
        });


        // this.transition = true;
        this.treeDesigner.redraw(true);
        // this.transition = false;

        this._fireOnAutoLayoutChangedCallbacks();
        return this;
    }

    fitNodesInPlottingRegion(nodes){
        var self = this;
        var topY = d3.min(nodes, n=>n.location.y);
        var minY = self.getNodeMinY();
        var dy = topY - minY;

        var minX = d3.min(nodes, n=>n.location.x);
        var dx = minX - self.getNodeMinX();

        if(dy<0 ||  dx<0){
            nodes.forEach(n=>n.move(-dx, -dy));
        }
    }

    moveNodes(nodes, dx, dy, pivot){
        var self = this;
        var limit = self.config.limitNodePositioning;
        if(limit){
            if(dx<0){
                nodes.sort((a,b)=>a.location.x-b.location.x);
            }else{
                nodes.sort((a,b)=>b.location.x-a.location.x);
            }
        }


        var minY = d3.min(nodes, d=>d.location.y);
        if(minY + dy < self.getNodeMinY()){
            dy = self.getNodeMinY() - minY;
        }

        nodes.forEach(d=>{
            if(limit){
                Layout.backupNodeLocation(d);
                var minX = self.getNodeMinX(d);
                var maxX = self.getNodeMaxX(d);

                d.location.x = Math.min(Math.max(d.location.x+dx, minX), maxX);
                d.location.y += dy;
            }else{
                d.location.x +=dx;
                d.location.y += dy;
            }

        });


        var revertX = pivot && self.config.limitNodePositioning && (pivot.location.x == pivot.$location.x);

        nodes.forEach(d=>{
            if(revertX){
                d.location.x = d.$location.x;
            }
            self.treeDesigner.updateNodePosition(d);
        });


    }

    static backupNodeLocation(node) {
        node.$location = new model.Point(node.location);
    }

    _fireOnAutoLayoutChangedCallbacks(){
        this.onAutoLayoutChanged.forEach(c=>c(this.config.type));
    }

    static setHangingPosition(selection){
        // window.setTimeout(function(){
        //     selection.each(function(){
        //         var h =  this.getBBox().height;
        //         d3.select(this).attr('dy', h);
        //     });
        // },0);
        selection.each(function(){
            var h =  this.getBBox().height;
            d3.select(this).attr('dy', '0.75em');
        });

        return selection;
    }

}


