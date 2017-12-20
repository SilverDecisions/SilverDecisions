import {Utils, log} from 'sd-utils';
import {i18n} from "./i18n/i18n";
var jQuery = require('jquery');
var global$ = Utils.getGlobalObject().jQuery;
Utils.getGlobalObject().jQuery = jQuery;
require('jquery-ui/ui/data');
require('jquery-ui/ui/scroll-parent');
require('jquery-ui/ui/widget');
require('jquery-ui/ui/widgets/mouse');
require('jquery-ui/ui/widgets/sortable');
require('pivottable');


// pivot show zero hack start
var numberFormat = jQuery.pivotUtilities.numberFormat;
try{
    jQuery.pivotUtilities.numberFormat = function(opts){
        if(!opts){
            opts = {};
        }
        opts.showZero = true;
        return numberFormat(opts);
    };
}catch (e){
    log.error('Error when performing pivottable "show zero" hack, reverting');

    try{
        jQuery.pivotUtilities.numberFormat = numberFormat;
    }catch (e){

    }
}

require('pivottable/dist/pivot.it');
require('pivottable/dist/pivot.de');
require('pivottable/dist/pivot.fr');
require('pivottable/dist/pivot.pl');

Utils.getGlobalObject().jQuery = global$;

// pivot show zero hack continuation
try{
    var origAggregators = {};
    Utils.forOwn(jQuery.pivotUtilities.locales.en.aggregators, (value, key, object)=>{
        origAggregators[key] = value;
        object[key] = function(){
            var args1 = arguments;
            try{
                let res1 = value.apply(this, args1);
                return function(){
                    var res = res1(...arguments);
                    var format_ = res.format;
                    res.format = function(x){
                        var origX = x;
                        if(x===0){
                            x =  "0";
                        }
                        try{
                            return format_(x);
                        }catch (e){
                            log.error('Error when performing pivottable "show zero" hack (format func call), reverting', e);
                            if(format_){
                                return format_(origX);
                            }
                            revertAggregators();
                        }
                    };
                    return res;
                };
            }catch(e){
                log.error('Error when performing pivottable "show zero" hack, reverting', e);
                revertAggregators();
                return origAggregators[key](...args1)
            }
        }
    });
}catch (e){
    log.error('Error when performing pivottable "show zero" hack, reverting', e);
    revertAggregators();
}

function revertAggregators(){
    try {
        Utils.forOwn(jQuery.pivotUtilities.locales.en.aggregators, (value, key, object)=>{
            let origAggregator = origAggregators[key];
            if(origAggregator){
                object[key] = origAggregator
            }

        });
    }catch(e){
        log.error('Error when reverting aggregators', e)
    }
}

///////////////////// hack end

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

    clear(){
        jQuery(this.container.node()).pivotUI([], null, true)
    }



    getAggregatorName(name){
        return i18n.t("jobResultTable.pivot.aggregators."+name.toLowerCase());
    }

    getRendererName(name){
        return i18n.t("jobResultTable.pivot.renderers."+name.toLowerCase());
    }
}
