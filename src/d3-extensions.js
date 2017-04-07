import * as d3 from './d3'

export class D3Extensions {

    static extend() {

        d3.selection.prototype.enter.prototype.insertSelector =
            d3.selection.prototype.insertSelector = function (selector, before) {
                return D3Extensions.insertSelector(this, selector, before);
            };


        d3.selection.prototype.enter.prototype.appendSelector =
            d3.selection.prototype.appendSelector = function (selector) {
                return D3Extensions.appendSelector(this, selector);
            };

        d3.selection.prototype.enter.prototype.selectOrAppend =
            d3.selection.prototype.selectOrAppend = function (selector) {
                return D3Extensions.selectOrAppend(this, selector);
            };

        d3.selection.prototype.enter.prototype.selectOrInsert =
            d3.selection.prototype.selectOrInsert = function (selector, before) {
                return D3Extensions.selectOrInsert(this, selector, before);
            };


    }

    static insertOrAppendSelector(parent, selector, operation, before) {

        var selectorParts = selector.split(/([\.\#])/);
        var element = parent[operation](selectorParts.shift(), before);//":first-child"

        while (selectorParts.length > 1) {
            var selectorModifier = selectorParts.shift();
            var selectorItem = selectorParts.shift();
            if (selectorModifier === ".") {
                element = element.classed(selectorItem, true);
            } else if (selectorModifier === "#") {
                element = element.attr('id', selectorItem);
            }
        }
        return element;
    }

    static insertSelector(parent, selector, before) {
        return D3Extensions.insertOrAppendSelector(parent, selector, "insert", before);
    }

    static appendSelector(parent, selector) {
        return D3Extensions.insertOrAppendSelector(parent, selector, "append");
    }

    static selectOrAppend(parent, selector, element) {
        var selection = parent.select(selector);
        if (selection.empty()) {
            if (element) {
                return parent.append(element);
            }
            return D3Extensions.appendSelector(parent, selector);

        }
        return selection;
    };

    static selectOrInsert(parent, selector, before) {
        var selection = parent.select(selector);
        if (selection.empty()) {
            return D3Extensions.insertSelector(parent, selector, before);
        }
        return selection;
    };
}
