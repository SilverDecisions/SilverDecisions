import {ContextMenu} from '../context-menu'
import {Utils} from '../utils'
import * as model from '../model/index'
import * as d3 from '../d3'

export class MainContextMenu extends ContextMenu{
    treeDesigner;
    constructor(treeDesigner){
        var menu = function(d){

            var menu = [];
            menu.push({
                title: 'Add Decision Node',
                action: function(elm, d, i) {
                    var newNode = new model.DecisionNode(new model.Point(d3.mouse(treeDesigner.svg.node())).move(treeDesigner.getMainGroupTranslation(true)));
                    treeDesigner.addNode(newNode)
                }
            });
            menu.push({
                title: 'Add Chance Node',
                action: function(elm, d, i) {
                    var newNode = new model.ChanceNode(new model.Point(d3.mouse(treeDesigner.svg.node())).move(treeDesigner.getMainGroupTranslation(true)));
                    treeDesigner.addNode(newNode)
                }
            });
            menu.push({divider:true});
            menu.push({
                title: 'Paste',
                action: function(elm, d, i) {
                    treeDesigner.pasteToNewLocation(new model.Point(d3.mouse(treeDesigner.svg.node())).move(treeDesigner.getMainGroupTranslation(true)));
                },
                disabled: !treeDesigner.copiedNode

            });
            menu.push({divider:true});

            menu.push({
                title: 'Select all nodes',
                action: function(elm, d, i) {
                    treeDesigner.selectAllNodes();
                }
            });
            return menu;
        };

        super (menu, {onOpen: () => treeDesigner.clearSelection()});
        this.treeDesigner = treeDesigner;
    }
}