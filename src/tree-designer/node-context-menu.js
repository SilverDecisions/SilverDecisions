import {ContextMenu} from '../context-menu'
import {Utils} from '../utils'
import * as model from '../model/index'
import * as d3 from '../d3'

export class NodeContextMenu extends ContextMenu {
    treeDesigner;

    constructor(treeDesigner) {
        var menu = function (d) {

            var copyMenuItem = {
                title: 'Copy',
                action: function (elm, d, i) {
                    treeDesigner.copyNode(d);
                }
            };
            var cutMenuItem = {
                title: 'Cut',
                action: function (elm, d, i) {
                    treeDesigner.cutNode(d);
                }
            };
            var pasteMenuItem = {
                title: 'Paste',
                action: function (elm, d, i) {
                    treeDesigner.pasteToNode(d);
                },
                disabled: !treeDesigner.copiedNode

            };
            var deleteMenuItem = {
                title: 'Delete',
                action: function (elm, d, i) {

                    treeDesigner.selectNode(d, !treeDesigner.isNodeSelected(d));
                    treeDesigner.removeSelectedNodes();

                }
            };
            var menu = [];
            if (d.type == 'terminal') {
                return [copyMenuItem, cutMenuItem, deleteMenuItem];
            }
            menu.push({
                title: 'Add Decision Node',
                action: function (elm, d, i) {
                    var newNode = new model.DecisionNode(new model.Point(d.location.x + 120, d.location.y));
                    treeDesigner.addNode(newNode, d)
                }
            });
            menu.push({
                title: 'Add Chance Node',
                action: function (elm, d, i) {
                    var newNode = new model.ChanceNode(new model.Point(d.location.x + 120, d.location.y));
                    treeDesigner.addNode(newNode, d)
                }
            });
            menu.push({
                title: 'Add Terminal Node',
                action: function (elm, d, i) {
                    var newNode = new model.TerminalNode(new model.Point(d.location.x + 120, d.location.y));
                    treeDesigner.addNode(newNode, d)
                }
            });
            menu.push({divider: true});
            menu.push(copyMenuItem);
            menu.push(cutMenuItem);
            menu.push(pasteMenuItem);
            menu.push(deleteMenuItem);
            menu.push({divider: true});
            menu.push({
                title: 'Select subtree',
                action: function (elm, d, i) {
                    treeDesigner.selectSubTree(d, true);
                }
            });

            return menu;
        };

        super(menu);
        this.treeDesigner = treeDesigner;
    }
}
