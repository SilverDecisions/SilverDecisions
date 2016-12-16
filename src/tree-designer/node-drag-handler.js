import {Utils} from '../utils'
import * as model from '../model/index'
import * as d3 from '../d3'
import {ContextMenu} from '../context-menu'

export class NodeDragHandler{

    treeDesigner;
    data;
    config;

    drag;


    constructor(treeDesigner, data){
        this.treeDesigner = treeDesigner;
        this.data = data;

        var self = this;
        this.drag = d3.drag()
            .subject(function(d) {
                if(d==null){
                    return  {
                        x: event.x,
                        y: event.y
                    };
                }
                var t = d3.select(this);
                return {
                    x: t.attr("x") + Utils.getTranslation(t.attr("transform"))[0],
                    y: t.attr("y") + Utils.getTranslation(t.attr("transform"))[1]
                };
            })
            .on("start", function(d){
                self.dragStarted.call(this,d, self)
            })
            .on("drag", function (d) {
                self.onDrag.call(this, d, self);
            })
            .on("end", function (d) {
                self.dragEnded.call(this, d, self);
            })
    }


    dragStarted(d,self) {
        if(self.ignoreDrag){
            self.ignoreDrag=false;
            self.ignoredDrag=true;
            return;
        }
        self.ignoredDrag=false;

        // self.treeDesigner.layout.disableAutoLayout();
        ContextMenu.hide();
        var node = d3.select(this);
        if(!node.classed("selected")){
            self.treeDesigner.clearSelection();
        }
        // console.log('drag started');
        self.treeDesigner.selectNode(d);
        node.classed("selected dragging", true);
        self.selectedNodes = self.treeDesigner.getSelectedNodes();
        self.prevDragEvent = d3.event;
        self.dragEventCount = 0;
    }

    onDrag(draggedNode, self){
        if(self.ignoredDrag){
            return;
        }

        if(self.dragEventCount==2){
            self.data.saveState();
        }
        self.dragEventCount++;
        if(self.selectedNodes.length>5 && self.dragEventCount%2!=1){
            return;
        }

        var dx = d3.event.x - self.prevDragEvent.x;
        var dy = d3.event.y- self.prevDragEvent.y;
        self.treeDesigner.layout.moveNodes(self.selectedNodes, dx, dy, draggedNode);


        self.prevDragEvent = d3.event;
        self.treeDesigner.redrawEdges();
        self.treeDesigner.updatePlottingRegionSize();
    }

    dragEnded(draggedNode, self){
        var node = d3.select(this).classed("dragging", false);
        if(self.ignoredDrag){
            return;
        }
        self.treeDesigner.layout.update(draggedNode)
    }

    cancelDrag(){
        this.ignoreDrag = true;
    }

}


