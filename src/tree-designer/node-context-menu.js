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
                    treeDesigner.selectNode(d, !treeDesigner.isNodeSelected(d));
                    treeDesigner.copySelectedNodes();
                }
            };
            var cutMenuItem = {
                title: 'Cut',
                action: function (elm, d, i) {
                    treeDesigner.selectNode(d, !treeDesigner.isNodeSelected(d));
                    treeDesigner.cutSelectedNodes();
                }
            };
            var pasteMenuItem = {
                title: 'Paste',
                action: function (elm, d, i) {
                    treeDesigner.pasteToNode(d);
                },
                disabled: !treeDesigner.copiedNodes || !treeDesigner.copiedNodes.length

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
                    treeDesigner.addDecisionNode(d)
                }
            });
            menu.push({
                title: 'Add Chance Node',
                action: function (elm, d, i) {
                    treeDesigner.addChanceNode(d)
                }
            });
            menu.push({
                title: 'Add Terminal Node',
                action: function (elm, d, i) {
                    treeDesigner.addTerminalNode(d)
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
