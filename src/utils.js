export class Utils {
    static SQRT_2 = 1.41421356237;
    // usage example deepExtend({}, objA, objB); => should work similar to $.extend(true, {}, objA, objB);
    static deepExtend(out) {

        var utils = this;
        var emptyOut = {};


        if (!out && arguments.length > 1 && Array.isArray(arguments[1])) {
            out = [];
        }
        out = out || {};

        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            if (!source)
                continue;

            for (var key in source) {
                if (!source.hasOwnProperty(key)) {
                    continue;
                }
                var isArray = Array.isArray(out[key]);
                var isObject = utils.isObject(out[key]);
                var srcObj = utils.isObject(source[key]);

                if (isObject && !isArray && srcObj) {
                    utils.deepExtend(out[key], source[key]);
                } else {
                    out[key] = source[key];
                }
            }
        }

        return out;
    };

    static mergeDeep(target, source) {
        let output = Object.assign({}, target);
        if (Utils.isObjectNotArray(target) && Utils.isObjectNotArray(source)) {
            Object.keys(source).forEach(key => {
                if (Utils.isObjectNotArray(source[key])) {
                    if (!(key in target))
                        Object.assign(output, {[key]: source[key]});
                    else
                        output[key] = Utils.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(output, {[key]: source[key]});
                }
            });
        }
        return output;
    }

    static cross(a, b) {
        var c = [], n = a.length, m = b.length, i, j;
        for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
        return c;
    };

    static isObjectNotArray(item) {
        return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
    };

    static isArray(item) {
        return Array.isArray(item);
    };

    static isObject(a) {
        return a !== null && typeof a === 'object';
    };

    static isNumber(a) {
        return !isNaN(a) && typeof a === 'number';
    };

    static isFunction(a) {
        return typeof a === 'function';
    };

    static isDate(a){
        return Object.prototype.toString.call(a) === '[object Date]'
    }

    static isString(a){
        return typeof a === 'string' || a instanceof String
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
        return Utils.insertOrAppendSelector(parent, selector, "insert", before);
    }

    static appendSelector(parent, selector) {
        return Utils.insertOrAppendSelector(parent, selector, "append");
    }

    static selectOrAppend(parent, selector, element) {
        var selection = parent.select(selector);
        if (selection.empty()) {
            if (element) {
                return parent.append(element);
            }
            return Utils.appendSelector(parent, selector);

        }
        return selection;
    };

    static selectOrInsert(parent, selector, before) {
        var selection = parent.select(selector);
        if (selection.empty()) {
            return Utils.insertSelector(parent, selector, before);
        }
        return selection;
    };
    
    static sanitizeHeight = function (height, container) {
        return (height || parseInt(container.style('height'), 10) || 400);
    };

    static sanitizeWidth = function (width, container) {
        return (width || parseInt(container.style('width'), 10) || 960);
    };

    static availableHeight = function (height, container, margin) {
        return Math.max(0, Utils.sanitizeHeight(height, container) - margin.top - margin.bottom);
    };

    static availableWidth = function (width, container, margin) {
        return Math.max(0, Utils.sanitizeWidth(width, container) - margin.left - margin.right);
    };

    static guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    //places textString in textObj, adds an ellipsis if text can't fit in width
    static placeTextWithEllipsis(textD3Obj, textString, width){
        var textObj = textD3Obj.node();
        textObj.textContent=textString;

        var margin = 0;
        var ellipsisLength = 9;
        //ellipsis is needed
        if (textObj.getComputedTextLength()>width+margin){
            for (var x=textString.length-3;x>0;x-=1){
                if (textObj.getSubStringLength(0,x)+ellipsisLength<=width+margin){
                    textObj.textContent=textString.substring(0,x)+"...";
                    return true;
                }
            }
            textObj.textContent="..."; //can't place at all
            return true;
        }
        return false;
    }

    static placeTextWithEllipsisAndTooltip(textD3Obj, textString, width, tooltip){
        var ellipsisPlaced = Utils.placeTextWithEllipsis(textD3Obj, textString, width);
        if(ellipsisPlaced && tooltip){
            textD3Obj.on("mouseover", function (d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(textString)
                    .style("left", (d3.event.pageX + 5) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            });

            textD3Obj.on("mouseout", function (d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        }

    }

    static getFontSize(element){
        return window.getComputedStyle(element, null).getPropertyValue("font-size");
    }

    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}
