import {dataURLtoBlob} from 'blueimp-canvas-to-blob'
import {saveAs} from 'file-saver'
import * as d3 from './d3'
import {i18n} from "./i18n/i18n";
import {Utils} from "./utils";

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
            if(!source){
                console.log('Exporter.appendInlineStyles - undefined source!');
                return;
            }
            var children = source.children;
            var targetChildren = target.children;
            if(!source.children){
                children = source.childNodes;
                targetChildren = target.childNodes;
            }

            var cssStyleText = '';
            var cs = getComputedStyle(source);
            if(!cs){
                return;
            }
            for (let i= 0; i<cs.length; i++){
                cssStyleText+='; '+cs.item(i)+': '+ cs.getPropertyValue(cs.item(i));
            }


            target.setAttribute("style", cssStyleText);

            for (let i = 0; i < children.length; i++) {
                var node = children[i];
                appendInlineStyles(node, targetChildren[i]);
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

        // var canvas = document.createElement("canvas");
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
            // context.clearRect(0, 0, width, height);
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
        var format = d3.timeFormat("%Y.%m.%d_%H.%M.%S");
        var date = new Date();
        return name+'@'+format(date)+'.'+ext;
    }

    static saveAsPng(svg) {
        if(Utils.detectIE()){
            alert(i18n.t('error.pngExportNotSupportedIE'));
            return;
        }
        try{
            var svgString = Exporter.getSVGString(svg.node());
            var svgWidth = svg.attr('width');
            var svgHeight = svg.attr('height');

            var pngWidth = 4*svgWidth;
            var pngHeight = 4*svgHeight;
            Exporter.svgString2Image(svgString,  pngWidth, pngHeight, 'png', save); // passes Blob and filesize String to the callback

            function save(dataBlob, filesize) {
                try{
                    Exporter.saveAs(dataBlob, Exporter.getExportFileName('png'));
                }catch (e){
                    alert(i18n.t('error.pngExportNotSupported'));
                    console.log(e);
                }
            }
        }catch (e){
            alert(i18n.t('error.pngExportNotSupported'));
            console.log(e);
        }
    }

    static saveAsSvg(svg) {
        try{
            var svgString = Exporter.getSVGString(svg.node());
            var blob = new Blob([svgString], {type: "image/svg+xml"});
            Exporter.saveAs(blob, Exporter.getExportFileName('svg'));
        }catch (e){
            alert(i18n.t('error.svgExportNotSupported'));
            console.log(e);
        }
    }
}
