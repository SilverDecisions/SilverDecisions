import {ContextMenu} from './context-menu'
import {Utils} from '../utils'
import * as d3 from '../d3'
import {i18n} from "../i18n/i18n";

export class TextContextMenu extends ContextMenu {
    treeDesigner;

    constructor(treeDesigner) {
        var menu = function (d) {


            var deleteMenuItem = {
                title: i18n.t('contextMenu.text.delete'),
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
