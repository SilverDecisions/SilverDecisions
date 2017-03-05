import {ContextMenu} from './context-menu'
import {Utils} from 'sd-utils'
import * as d3 from '../d3'
import {i18n} from "../i18n/i18n";

export class EdgeContextMenu extends ContextMenu {
    treeDesigner;

    constructor(treeDesigner) {
        var menu = function (d) {

            var menu = [];

            menu.push({
                title: i18n.t('contextMenu.edge.injectDecisionNode'),
                action: function (elm, d, i) {
                    treeDesigner.injectDecisionNode(d)
                }
            });
            menu.push({
                title: i18n.t('contextMenu.edge.injectChanceNode'),
                action: function (elm, d, i) {
                    treeDesigner.injectChanceNode(d)
                }
            });


            return menu;
        };

        super(menu);
        this.treeDesigner = treeDesigner;
    }
}
