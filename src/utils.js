import * as d3 from './d3'
import * as autosize from 'autosize'
import {Templates} from './templates'

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

    static  isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    static isFunction(a) {
        return typeof a === 'function';
    };

    static isDate(a) {
        return Object.prototype.toString.call(a) === '[object Date]'
    }

    static isString(a) {
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
    static placeTextWithEllipsis(textD3Obj, textString, width) {
        var textObj = textD3Obj.node();
        textObj.textContent = textString;

        var margin = 0;
        var ellipsisLength = 9;
        //ellipsis is needed
        if (textObj.getComputedTextLength() > width + margin) {
            for (var x = textString.length - 3; x > 0; x -= 1) {
                if (textObj.getSubStringLength(0, x) + ellipsisLength <= width + margin) {
                    textObj.textContent = textString.substring(0, x) + "...";
                    return true;
                }
            }
            textObj.textContent = "..."; //can't place at all
            return true;
        }
        return false;
    }

    static placeTextWithEllipsisAndTooltip(textD3Obj, textString, width, tooltip) {
        var ellipsisPlaced = Utils.placeTextWithEllipsis(textD3Obj, textString, width);
        if (ellipsisPlaced && tooltip) {
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

    static getFontSize(element) {
        return window.getComputedStyle(element, null).getPropertyValue("font-size");
    }

    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    static getTranslation(transform) {
        // Create a dummy g for calculation purposes only. This will never
        // be appended to the DOM and will be discarded once this function
        // returns.
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

        // Set the transform attribute to the provided string value.
        g.setAttributeNS(null, "transform", transform);

        // consolidate the SVGTransformList containing all transformations
        // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
        // its SVGMatrix.
        var matrix = g.transform.baseVal.consolidate().matrix;

        // As per definition values e and f are the ones for the translation.
        return [matrix.e, matrix.f];
    }

    static getObjectByIdMap(objectList, mappingFn) {
        var objectById = {};
        if (!objectList) {
            return objectById;
        }
        objectList.forEach(function (obj) {
            var val = obj;
            if (mappingFn) {
                val = mappingFn(obj);
            }
            objectById[obj.$id] = val;
        });
        return objectById;
    };


    static timers = {};
    static waitForFinalEvent(callback, uniqueId, ms=50) {
        if (!uniqueId) {
            uniqueId = "Don't call this twice without a uniqueId";
        }
        if (Utils.timers[uniqueId]) {
            clearTimeout (Utils.timers[uniqueId]);
        }
        Utils.timers[uniqueId] = setTimeout(callback, ms);

        return () => clearTimeout (Utils.timers[uniqueId]);
    };

    static updateInputClass(selection){
        var value = selection.node().value;
        selection.classed('empty', value!==0 && !value);
        return selection;
    }

    static autoResizeTextarea(element){
        setTimeout(function(){
            element.style.width = "";
            var width = element.getBoundingClientRect().width;
            if(width){
                element.style.width = width+'px';
            }
            autosize.update(element);
        }, 10);
    }

    static elasticTextarea(selection){
        setTimeout(function(){
            selection.style('width',undefined);
            var width = selection.node().getBoundingClientRect().width;
            if(width){
                selection.style('width', width+'px')
            }
            autosize.default(selection.node());
        },10)
    }

    static closestPoint(pathNode, point) {
        var pathLength = pathNode.getTotalLength(),
            precision = 8,
            best,
            bestLength,
            bestDistance = Infinity;

        // linear scan for coarse approximation
        for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
            if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
                best = scan, bestLength = scanLength, bestDistance = scanDistance;
            }
        }

        // binary search for precise estimate
        precision /= 2;
        while (precision > 0.5) {
            var before,
                after,
                beforeLength,
                afterLength,
                beforeDistance,
                afterDistance;
            if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
                best = before, bestLength = beforeLength, bestDistance = beforeDistance;
            } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
                best = after, bestLength = afterLength, bestDistance = afterDistance;
            } else {
                precision /= 2;
            }
        }

        best = [best.x, best.y];
        best.distance = Math.sqrt(bestDistance);
        return best;

        function distance2(p) {
            var dx = p.x - point[0],
                dy = p.y - point[1];
            return dx * dx + dy * dy;
        }
    }

    /**
     * detect IE
     * returns version of IE or false, if browser is not Internet Explorer
     */
    static detectIE() {
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf('MSIE ');
        if (msie > 0) {
            // IE 10 or older => return version number
            return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        }

        var trident = ua.indexOf('Trident/');
        if (trident > 0) {
            // IE 11 => return version number
            var rv = ua.indexOf('rv:');
            return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
        }

        /*var edge = ua.indexOf('Edge/');
        if (edge > 0) {
            // Edge (IE 12+) => return version number
            return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
        }*/

        // other browser
        return false;
    }

    static growl(message, type='info', position='right', time = 2000){
        var html = Templates.get('growl', {message:message, type:type})

        var g = d3.select('body').selectOrAppend('div.sd-growl-list.'+position).append('div').html(html);
        setTimeout(function(){
            g.remove();
        }, time)
    }

    static postByForm(url, data) {
        var name,
            form;

        // create the form
        form = Utils.createElement('form', Utils.mergeDeep({
            method: 'post',
            action: url,
            enctype: 'multipart/form-data'
        }), document.body);

        for (name in data) {
            if(data.hasOwnProperty(name)){
                Utils.createElement('input', {
                    type: 'hidden',
                    name: name,
                    value: data[name]
                }, form);
            }
        }

        form.submit();

        Utils.removeElement(form);
    };

    static createElement(tag, attribs, parent) {
        var el = document.createElement(tag);

        if (attribs) {
            Utils.deepExtend(el, attribs);
        }
        if (parent) {
            parent.appendChild(el);
        }
        return el;
    };

    static extend (a, b) {
        var n;
        if (!a) {
            a = {};
        }
        for (n in b) {
            a[n] = b[n];
        }
        return a;
    };

    static removeElement(element) {
        element.parentNode.removeChild(element);
    }

    static replaceUrls(text){
        if(!text){
            return text;
        }
        var urlRegexp = /((ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?)/

        return text.replace(urlRegexp, '<a href="$1" target="_blank">$1</a>');
    }

    static escapeHtml(html)
    {
        var text = document.createTextNode(html);
        var div = document.createElement('div');
        div.appendChild(text);
        return div.innerHTML;
    }
}
