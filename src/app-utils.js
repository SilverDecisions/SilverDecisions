import * as d3 from "./d3";
import * as autosize from "autosize";
import {Templates} from "./templates";
import {i18n} from "./i18n/i18n";
import {Utils} from "sd-utils";

export class AppUtils {

    static sanitizeHeight = function (height, container) {
        return (height || parseInt(container.style('height'), 10) || 400);
    };

    static sanitizeWidth = function (width, container) {
        return (width || parseInt(container.style('width'), 10) || 960);
    };

    static availableHeight = function (height, container, margin) {
        return Math.max(0, AppUtils.sanitizeHeight(height, container) - margin.top - margin.bottom);
    };

    static availableWidth = function (width, container, margin) {
        return Math.max(0, AppUtils.sanitizeWidth(width, container) - margin.left - margin.right);
    };

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
        var ellipsisPlaced = AppUtils.placeTextWithEllipsis(textD3Obj, textString, width);
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
        form = AppUtils.createElement('form', AppUtils.mergeDeep({
            method: 'post',
            action: url,
            enctype: 'multipart/form-data'
        }), document.body);

        for (name in data) {
            if(data.hasOwnProperty(name)){
                AppUtils.createElement('input', {
                    type: 'hidden',
                    name: name,
                    value: data[name]
                }, form);
            }
        }

        form.submit();

        AppUtils.removeElement(form);
    };

    static createElement(tag, attribs, parent) {
        var el = document.createElement(tag);

        if (attribs) {
            AppUtils.deepExtend(el, attribs);
        }
        if (parent) {
            parent.appendChild(el);
        }
        return el;
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


    static dispatchEvent(name, data){
        var event;
        try{
            event = new  CustomEvent(name,{ 'detail': data });
        }catch (e){ //IE
            event = document.createEvent('CustomEvent');
            event.initCustomEvent(name, false, false, data);
        }
        document.dispatchEvent(event);
    }

    static getValidationMessage(error){
        if(Utils.isString(error)){
            error = {name: error};
        }
        var key = 'validation.' + error.name;
        return i18n.t(key, error.data);
    }

    static hide(selection){
        selection.classed('sd-hidden', true);
    }

    static show(selection, show=true){
        selection.classed('sd-hidden', !show);
    }

    static showFullScreenPopup(html, closeCallback){
        var popup = d3.select("body").selectOrAppend("div.sd-full-screen-popup-container").html(Templates.get('fullscreenPopup', {body:html}));
        popup.select('.sd-close-popup').on('click', ()=>{
            popup.remove();
            if(closeCallback) {
                closeCallback()
            }
        })

    }

    static getJSON(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('get', url, true);
        xhr.responseType = 'json';
        xhr.onload = function () {
            var status = xhr.status;
            if (status == 200) {
                callback(xhr.response, null);
            } else {
                callback(null, status);
            }
        };
        xhr.send();
    }
}
