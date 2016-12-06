import {ContextMenu} from '../context-menu'
import {Utils} from '../utils'
import * as model from '../model/index'
import * as d3 from '../d3'

export class EdgeContextMenu extends ContextMenu {
    treeDesigner;

    constructor(treeDesigner) {
        var menu = function (d) {

            var menu = [];

            menu.push({
                title: 'Inject Decision Node',
                action: function (elm, d, i) {
                    treeDesigner.injectDecisionNode(d)
                }
            });
            menu.push({
                title: 'Inject Chance Node',
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
