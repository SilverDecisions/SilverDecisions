import {Utils} from 'sd-utils';
var jQuery = require('jquery');
Utils.getGlobalObject().jQuery = jQuery; //FIXME
require('jquery-ui/ui/data');
require('jquery-ui/ui/scroll-parent');
require('jquery-ui/ui/widget');
require('jquery-ui/ui/widgets/mouse');
require('jquery-ui/ui/widgets/sortable');
import 'pivottable';




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
        jQuery(this.container.node()).pivotUI(data, options, true)
    }


}
