import {dataURLtoBlob} from 'blueimp-canvas-to-blob'
import {saveAs} from 'file-saver'
import * as d3 from './d3'

export class Exporter {
    static saveAs = saveAs;
    static dataURLtoBlob = dataURLtoBlob;
// Below are the function that handle actual exporting:
// getSVGString (svgNode ) and svgString2Image( svgString, width, height, format, callback )
    static getSVGString(svgNode) {
        // svgNode = svgNode.cloneNode(true);

        var svgClone = svgNode.cloneNode(true);
        appendInlineStyles(svgNode, svgClone);

        function appendInlineStyles(source, target){
            var cssStyleText = '';
            var cs = getComputedStyle(source);
            for (var i= 0; i<cs.length; i++){
                cssStyleText+='; '+cs.item(i)+': '+ cs.getPropertyValue(cs.item(i));
            }


            target.setAttribute("style", cssStyleText);

            for (var i = 0; i < source.children.length; i++) {
                var node = source.children[i];
                appendInlineStyles(node, target.children[i]);
            }
        }

        svgClone.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
        var serializer = new XMLSerializer();

        var svgString = serializer.serializeToString(svgClone);
        svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink=') // Fix root xlink without namespace
        svgString = svgString.replace(/NS\d+:href/g, 'xlink:href') // Safari NS namespace fix

        return svgString;
    }


    static svgString2Image(svgString, width, height, format, callback) {
        var format = format ? format : 'png';

        var imgsrc = 'data:image/svg+xml,' + (encodeURIComponent(svgString)); // Convert SVG string to dataurl

        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;

        var image = new Image;
        image.width=width;
        image.height=height;
        var target = new Image;
        target.width=width;
        target.height=height;

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

    //decisiontree@yyyy.mm.dd_hh.mm.ss
    static getExportFileName(ext){
        var name = 'decisiontree';
        var format = d3.timeFormat("%Y.%m.%d._%H.%M.%S");
        var date = new Date();
        return name+'@'+format(date)+'.'+ext;
    }
}
