import * as d3 from './d3'
import {i18n} from './i18n/i18n'

import {Utils} from './utils'

export class Tooltip {
    static show(html, xOffset = 5, yOffset = 28) {
        var container = d3.select("body").selectOrAppend('div.sd-tooltip')
            .style("opacity", 0);
        container.transition()
            .duration(200)
            .style("opacity", .98);
        container.html(html);
        Tooltip.updatePosition(xOffset, yOffset);
    }

    static updatePosition(xOffset = 5, yOffset = 28) {
        d3.select("body").selectOrAppend('div.sd-tooltip')
            .style("left", (d3.event.pageX + xOffset) + "px")
            .style("top", (d3.event.pageY - yOffset) + "px");
    }

    static hide() {
        d3.select('div.sd-tooltip').transition()
            .duration(500)
            .style("opacity", 0);
    }

    static attach(target, htmlOrFn, xOffset, yOffset) {
        target.on('mouseover', function (d) {
            var html = null;
            if (Utils.isFunction(htmlOrFn)) {
                html = htmlOrFn(d);
            } else {
                html = htmlOrFn;
            }
            if (html !== null && html !== undefined) {
                Tooltip.show(html, xOffset, yOffset);
            }

        }).on('mousemove', function (d) {
            Tooltip.updatePosition(xOffset, yOffset);
        }).on("mouseout", function (d) {
            Tooltip.hide();
        });
    }
}
