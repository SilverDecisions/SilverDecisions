import * as d3 from './d3'
import {i18n} from './i18n/i18n'

import {Utils} from './utils'

export class Tooltip{
    static show(html){
        var container = d3.select("body").selectOrAppend('div.sd-tooltip')
            .style("opacity", 0);
        container.transition()
            .duration(200)
            .style("opacity", .98);
        container.html(html)
            .style("left", (d3.event.pageX + 5) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    }

    static hide(){
        d3.select('div.sd-tooltip').transition()
            .duration(500)
            .style("opacity", 0);
    }
}
