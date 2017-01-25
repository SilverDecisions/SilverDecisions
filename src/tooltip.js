import * as d3 from './d3'
import {i18n} from './i18n/i18n'

import {Utils} from './utils'

export class Tooltip {
    static getContainer(){
        return d3.select("body").selectOrAppend('div.sd-tooltip');
    }

    static show(html, xOffset = 5, yOffset = 28) {
        var container = Tooltip.getContainer()
            .style("opacity", 0);
        container.transition()
            .duration(200)
            .style("opacity", .98);
        container.html(html);
        Tooltip.updatePosition(xOffset, yOffset);
    }

    static updatePosition(xOffset = 5, yOffset = 28) {
        Tooltip.getContainer()
            .style("left", (d3.event.pageX + xOffset) + "px")
            .style("top", (d3.event.pageY - yOffset) + "px");
    }

    static hide(duration = 500) {
        var t = Tooltip.getContainer();
        if(duration){
            t = t.transition().duration(duration)
        }
        t.style("opacity", 0);
    }

    static attach(target, htmlOrFn, xOffset, yOffset) {
        target.on('mouseover', function (d) {
            var html = null;
            if (Utils.isFunction(htmlOrFn)) {
                html = htmlOrFn(d);
            } else {
                html = htmlOrFn;
            }

            if (html !== null && html !== undefined && html !== '') {
                Tooltip.show(html, xOffset, yOffset);
            }else{
                Tooltip.hide(0);
            }

        }).on('mousemove', function (d) {
            Tooltip.updatePosition(xOffset, yOffset);
        }).on("mouseout", function (d) {
            Tooltip.hide();
        });
    }
}
