import {Utils} from 'sd-utils';
import {i18n} from "./i18n/i18n";
var jQuery = require('jquery');
Utils.getGlobalObject().jQuery = jQuery; //FIXME
require('jquery-ui/ui/data');
require('jquery-ui/ui/scroll-parent');
require('jquery-ui/ui/widget');
require('jquery-ui/ui/widgets/mouse');
require('jquery-ui/ui/widgets/sortable');
require('pivottable');
require('pivottable/dist/pivot.it');
require('pivottable/dist/pivot.de');
require('pivottable/dist/pivot.fr');
// require('pivottable/dist/pivot.pl');



export class PivotTable{

    container;


    constructor(container, options, data){
        this.container =container;
        this.options = options;
        this.data=data;
        if(data){
            this.update(data, options);
        }
    }

    update(data, options){
        this.data = data;
        this.options = options;
        jQuery(this.container.node()).pivotUI(data, options, true, i18n.language)
    }

    getAggregatorName(name){
        return i18n.t("jobResultTable.pivot.aggregators."+name.toLowerCase());
    }

    getRendererName(name){
        return i18n.t("jobResultTable.pivot.renderers."+name.toLowerCase());
    }
}
