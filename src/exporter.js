import {dataURLtoBlob} from 'blueimp-canvas-to-blob'
import {saveAs} from 'file-saver'

export class Exporter {
    static saveAs = saveAs;
    static dataURLtoBlob = dataURLtoBlob;
// Below are the function that handle actual exporting:
// getSVGString (svgNode ) and svgString2Image( svgString, width, height, format, callback )
    static getSVGString(svgNode) {
        svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
        var cssStyleText = getCSSStyles(svgNode);
        appendCSS(cssStyleText, svgNode)

        var serializer = new XMLSerializer();
        var svgString = serializer.serializeToString(svgNode);
        svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink=') // Fix root xlink without namespace
        svgString = svgString.replace(/NS\d+:href/g, 'xlink:href') // Safari NS namespace fix

        return svgString;

        function getCSSStyles(parentElement) {
            var selectorTextArr = getSelectors(parentElement, [], []);


            // Extract CSS Rules
            var extractedCSSText = "";
            for (var i = 0; i < document.styleSheets.length; i++) {
                var cssRules = document.styleSheets[i].cssRules;
                for (var r = 0; r < cssRules.length; r++) {
                    if (contains(cssRules[r].selectorText, selectorTextArr))
                        extractedCSSText += cssRules[r].cssText;
                }
            }
            console.log(selectorTextArr);
            return extractedCSSText;

            function contains(str, arr) {
                return arr.indexOf(str) !== -1;
            }

            function getSelectors(element, parentSelectors, selectorTextArr){
                // Add Parent element Id and Classes to the list
                if(!element.tagName){
                      return  selectorTextArr;
                }

                if (!contains(element.tagName, selectorTextArr))
                    selectorTextArr.push(element.tagName);

                if (element.id && !contains('#' + element.id, selectorTextArr))
                    selectorTextArr.push('#' + element.id);
                if (element.id && !contains(element.tagName+'#' + element.id, selectorTextArr))
                    selectorTextArr.push(element.tagName+'#' + element.id);


                var allClasses ='';
                for (var c = 0; c < element.classList.length; c++){
                    var className = element.classList[c];
                    allClasses+='.'+className;
                    if (!contains('.' + className, selectorTextArr))
                        selectorTextArr.push('.' + className);
                    if (!contains(element.tagName+'.' + className, selectorTextArr))
                        selectorTextArr.push(element.tagName+'.' + className);
                }
                if(allClasses){
                    if (!contains(allClasses, selectorTextArr))
                        selectorTextArr.push(allClasses);
                    if (!contains(element.tagName+allClasses, selectorTextArr))
                        selectorTextArr.push(element.tagName+allClasses);
                }

                // Add Children element Ids and Classes to the list
                var nodes = element.childNodes;

                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    getSelectors(node, [], selectorTextArr)
                }

                return selectorTextArr;
            }
        }

        function appendCSS(cssText, element) {
            var styleElement = document.createElement("style");
            styleElement.setAttribute("type", "text/css");
            styleElement.innerHTML = cssText;
            var refNode = element.hasChildNodes() ? element.children[0] : null;
            element.insertBefore(styleElement, refNode);
        }
    }


    static svgString2Image(svgString, width, height, format, callback) {
        var format = format ? format : 'png';

        var imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))); // Convert SVG string to dataurl

        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;

        var image = new Image;
        image.onload = function () {
            context.clearRect(0, 0, width, height);
            context.drawImage(image, 0, 0, width, height);

            canvas.toBlob(function (blob) {
                var filesize = Math.round(blob.length / 1024) + ' KB';
                if (callback) callback(blob, filesize);
            });


        };

        image.src = imgsrc;
    }

}