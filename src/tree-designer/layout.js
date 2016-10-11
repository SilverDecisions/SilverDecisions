import {Utils} from '../utils'
import * as model from '../model/index'
import * as d3 from '../d3'

/*Tree layout manager*/
export class Layout{

    treeDesigner;
    data;
    config;

    currentAutoLayout=null;

    onAutoLayoutChanged=[];

    nodeTypeOrder = {
        'decision' : 0,
        'chance': 0,
        'terminal': 1
    };


    constructor(treeDesigner, data, config){
        this.treeDesigner = treeDesigner;
        this.data = data;
        this.config = config;
        this.minMarginBetweenNodes = this.config.nodeSize + 30;

    }

    update(){
        if(this.currentAutoLayout){
            this.autoLayout(this.currentAutoLayout, true);
        }
    }
    disableAutoLayout(){
        this.currentAutoLayout = false;
        this._fireOnAutoLayoutChangedCallbacks();
    }


    drawNodeSymbol(path){
        var self = this;
        this.nodeSymbol = d3.symbol().type(d=> d.$symbol)
            .size(d=>64);
        var nodeSize = this.config.nodeSize;
        path.attr('transform', 'rotate(-90)')
            .attr('d', self.nodeSymbol)
            .each(function (d) {
                var path = d3.select(this);
                var box = path.node().getBBox();
                var error = Math.min(nodeSize / box.width, nodeSize / box.height);
                path.attr("d", self.nodeSymbol.size(error * error * 64));
            });
    }

    nodeLabelPosition(selection) {
        return selection
            .attr('x', 0)
            .attr('y', -this.config.nodeSize / 2 - 7)
    }

    nodePayoffPosition(selection) {
        return selection
            .attr('x', 0)
            .attr('y', this.config.nodeSize / 2 + 7)
            .attr('text-anchor', 'middle')
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

        var slantStartXOffset = Math.min(dX/2, 30);
        var slantWidth = Math.min(20, Math.max(dX/2 - slantStartXOffset, 0));

        var point1 = [parentNode.location.x +this.config.nodeSize/2 + 1, parentNode.location.y];
        var point2 = [parentNode.location.x+slantStartXOffset, parentNode.location.y];
        var point3 = [parentNode.location.x+slantStartXOffset+slantWidth, childNode.location.y];
        var point4 = [childNode.location.x - (sign*(Math.max(0, Math.min(this.config.nodeSize/2+8, dX/2)))), childNode.location.y];
        // var point2 = [parentNode.location.x+dX/2-slantWidth/2, parentNode.location.y];
        // var point3 = [childNode.location.x-(dX/2-slantWidth/2), childNode.location.y];

        edge.$linePoints = [point1, point2, point3, point4];
        return line(edge.$linePoints);
    }

    edgePayoffPosition(selection) {
        return selection
            .attr('x', d=>d.$linePoints[2][0] + 2)
            .attr('y', d=>d.$linePoints[2][1] + 7)
    }

    edgeLabelPosition(selection) {
        return selection
            .attr('x', d=>d.$linePoints[2][0] + 2)
            .attr('y', d=>d.$linePoints[2][1] - 7)

    }

    edgeProbabilityPosition(selection) {
        return selection
            .attr('x', function (d) {
                var len = d3.select(this).node().getComputedTextLength();
                var min = d.$linePoints[2][0] + 2 + d3.select(this.previousSibling).node().getBBox().width + 7 + len;
                return Math.max(min, d.$linePoints[3][0] - 8);
            })
            .attr('y', d=>d.$linePoints[2][1] + 7)

    }



    getNodeMinX(d){
        var self = this;
        if(d && d.$parent){// && !self.isNodeSelected(d.$parent)
            return d.$parent.location.x + self.minMarginBetweenNodes;
        }
        return self.config.nodeSize/2;
    }

    getNodeMinY(d){
        return this.config.nodeSize/2;
    }

    getNodeMaxX(d){
        var self = this;
        if(d && d.childEdges.length){
            return d3.min(d.childEdges, e=>e.childNode.location.x)-self.minMarginBetweenNodes;
        }
        return 9999999;
    }

    autoLayout(type, withoutStateSaving){
        var self=this;

        if(self.currentAutoLayout==type){
            return;
        }

        if(!this.data.nodes.length){
            this._fireOnAutoLayoutChangedCallbacks();
            return;
        }
        if(!withoutStateSaving){
            this.data.saveState({
                data:{
                    currentAutoLayout: self.currentAutoLayout
                },
                onRevert: (data)=> {
                    self.currentAutoLayout = data.currentAutoLayout;
                    self._fireOnAutoLayoutChangedCallbacks();
                }
            });
        }

        var treeMargin = 50;

        var prevTreeMaxY = self.getNodeMinY();
        this.data.getRoots().forEach(r=>{
            var root = d3.hierarchy(r, d=>{
                return d.childEdges.map(e=>e.childNode);
            });

            root.sort((a,b)=>self.nodeTypeOrder[a.data.type]-self.nodeTypeOrder[b.data.type]);

            var height = 75, width=150;

            var layout;
            if(type=='cluster'){
                layout = d3.cluster();
            }else{
                layout = d3.tree();
            }
            layout.nodeSize([height, width]);

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

            prevTreeMaxY = maxY + self.config.nodeSize+treeMargin;
        });


        // this.transition = true;
        this.treeDesigner.redraw(true);
        // this.transition = false;

        this.currentAutoLayout = type;
        this._fireOnAutoLayoutChangedCallbacks();
        return this;
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
        this.onAutoLayoutChanged.forEach(c=>c(this.currentAutoLayout));
    }

}


