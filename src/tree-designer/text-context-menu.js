import {ContextMenu} from '../context-menu'
import {Utils} from '../utils'
import * as model from '../model/index'
import * as d3 from '../d3'

export class TextContextMenu extends ContextMenu {
    treeDesigner;

    constructor(treeDesigner) {
        var menu = function (d) {


            var deleteMenuItem = {
                title: 'Delete',
                action: function (elm, d, i) {

                    treeDesigner.selectText(d, true, true);
                    treeDesigner.removeSelectedTexts()

                }
            };
            var menu = [];
            menu.push(deleteMenuItem);
            return menu;
        };

        super(menu);
        this.treeDesigner = treeDesigner;
    }
}
