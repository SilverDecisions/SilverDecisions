import {ContextMenu} from '../context-menu'
import {Utils} from '../utils'
import * as model from '../model/index'
import * as d3 from '../d3'
import {i18n} from "../i18n/i18n";

export class NodeContextMenu extends ContextMenu {
    treeDesigner;

    constructor(treeDesigner) {
        var menu = function (d) {

            var copyMenuItem = {
                title: i18n.t('contextMenu.node.copy'),
                action: function (elm, d, i) {
                    treeDesigner.selectNode(d, !treeDesigner.isNodeSelected(d));
                    treeDesigner.copySelectedNodes();
                }
            };
            var cutMenuItem = {
                title: i18n.t('contextMenu.node.cut'),
                action: function (elm, d, i) {
                    treeDesigner.selectNode(d, !treeDesigner.isNodeSelected(d));
                    treeDesigner.cutSelectedNodes();
                }
            };
            var pasteMenuItem = {
                title: i18n.t('contextMenu.node.paste'),
                action: function (elm, d, i) {
                    treeDesigner.pasteToNode(d);
                },
                disabled: !treeDesigner.copiedNodes || !treeDesigner.copiedNodes.length

            };
            var deleteMenuItem = {
                title: i18n.t('contextMenu.node.delete'),
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
                title: i18n.t('contextMenu.node.addDecisionNode'),
                action: function (elm, d, i) {
                    treeDesigner.addDecisionNode(d)
                }
            });
            menu.push({
                title: i18n.t('contextMenu.node.addChanceNode'),
                action: function (elm, d, i) {
                    treeDesigner.addChanceNode(d)
                }
            });
            menu.push({
                title: i18n.t('contextMenu.node.addTerminalNode'),
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
                title: i18n.t('contextMenu.node.selectSubtree'),
                action: function (elm, d, i) {
                    treeDesigner.selectSubTree(d, true);
                }
            });

            if(d instanceof model.ChanceNode){
                menu.push({divider: true});
                menu.push({
                    title: i18n.t('contextMenu.node.flipSubtree'),
                    action: function (elm, d, i) {
                        treeDesigner.flipSubTree(d);
                    },
                    disabled: !treeDesigner.canFlipSubTree(d)
                });
            }

            return menu;
        };

        super(menu);
        this.treeDesigner = treeDesigner;
    }
}
