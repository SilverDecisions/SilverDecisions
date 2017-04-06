import * as d3 from './d3'
import {i18n} from './i18n/i18n'

import {Utils} from 'sd-utils'
import {Templates} from "./templates";

export class LoadingIndicator{
    static show(message=''){
        var html = Templates.get('loadingIndicator');

        var g = d3.select('body').selectOrAppend('div.sd-loading-indicator-container').html(html).select('.sd-loading-indicator').classed('visible', true).style('display', 'block')
    }

    static hide(){
        let select = d3.select('.sd-loading-indicator');
        select.classed('visible', false);
        setTimeout(function(){
            select.style('display', 'none')
        }, 500)

    }
}
