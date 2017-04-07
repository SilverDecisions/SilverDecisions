import {AppUtils} from '../app-utils'
import * as d3 from '../d3'
import {ContextMenu} from './context-menu'

export class TextDragHandler{

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
                    x: t.attr("x") + AppUtils.getTranslation(t.attr("transform"))[0],
                    y: t.attr("y") + AppUtils.getTranslation(t.attr("transform"))[1]
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
        // self.treeDesigner.layout.disableAutoLayout();
        ContextMenu.hide();
        var text = d3.select(this);
        if(!text.classed("selected")){
            self.treeDesigner.clearSelection();
        }

        self.treeDesigner.selectText(d);
        text.classed("selected dragging", true);
        self.selectedNodes = self.treeDesigner.getSelectedNodes();
        self.prevDragEvent = d3.event;
        self.dragEventCount = 0;
    }

    onDrag(draggedText, self){
        if(self.dragEventCount==2){
            self.data.saveState();
        }
        self.dragEventCount++;

        var dx = d3.event.x - self.prevDragEvent.x;
        var dy = d3.event.y- self.prevDragEvent.y;

        draggedText.location.move(dx, dy);
        self.treeDesigner.updateTextPosition(draggedText);

        self.prevDragEvent = d3.event;
        self.treeDesigner.updatePlottingRegionSize();
    }

    dragEnded(draggedNode, self){
         d3.select(this).classed("dragging", false);
    }

}


