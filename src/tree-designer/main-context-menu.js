import {ContextMenu} from './context-menu'
import {Utils} from 'sd-utils'
import {domain as model} from 'sd-model'
import * as d3 from '../d3'
import {i18n} from "../i18n/i18n";

export class MainContextMenu extends ContextMenu {
    treeDesigner;

    constructor(treeDesigner) {
        var mousePosition = null;
        var menu = function (d) {

            var menu = [];
            menu.push({
                title: i18n.t('contextMenu.main.addDecisionNode'),
                action: function (elm, d, i) {
                    var newNode = new model.DecisionNode(mousePosition);
                    treeDesigner.addNode(newNode)
                }
            });
            menu.push({
                title: i18n.t('contextMenu.main.addChanceNode'),
                action: function (elm, d, i) {
                    var newNode = new model.ChanceNode(mousePosition);
                    treeDesigner.addNode(newNode)
                }
            });
            menu.push({divider: true});
            menu.push({
                title: i18n.t('contextMenu.main.addText'),
                action: function (elm, d, i) {
                    var newText = new model.Text(mousePosition);
                    treeDesigner.addText(newText);
                },

            });
            menu.push({divider: true});
            menu.push({
                title: i18n.t('contextMenu.main.paste'),
                action: function (elm, d, i) {
                    treeDesigner.pasteToNewLocation(mousePosition);
                },
                disabled: !treeDesigner.copiedNodes || !treeDesigner.copiedNodes.length

            });
            menu.push({divider: true});

            menu.push({
                title: i18n.t('contextMenu.main.selectAllNodes'),
                action: function (elm, d, i) {
                    treeDesigner.selectAllNodes();
                }
            });
            return menu;
        };

        super(menu, {onOpen: () => {
            treeDesigner.clearSelection();
            mousePosition = new model.Point(d3.mouse(treeDesigner.svg.node())).move(treeDesigner.getMainGroupTranslation(true));

        }});
        this.treeDesigner = treeDesigner;
    }
}
