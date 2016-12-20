import {dataURLtoBlob} from 'blueimp-canvas-to-blob'
import {saveAs} from 'file-saver'
import * as d3 from './d3'
import {i18n} from "./i18n/i18n";
import {Utils} from "./utils";
import * as _ from "lodash";

export class Exporter {
    static saveAs = saveAs;
    static dataURLtoBlob = dataURLtoBlob;
    static exportedStyles = ['font', 'color', 'display', 'opacity'];
    static svgProperties = ['stroke', 'fill', 'text'];

// Below are the function that handle actual exporting:
// getSVGString (svgNode ) and svgString2Image( svgString, width, height, format, callback )
    static getSVGString(svgNode) {
        // svgNode = svgNode.cloneNode(true);

        var svgClone = svgNode.cloneNode(true);
        appendInlineStyles(svgNode, svgClone);

        function appendInlineStyles(source, target){
            if(!source){
                console.log('Exporter.appendInlineStyles - undefined source!');
                return false;
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
                return true;
            }
            if(cs.display === 'none'){
                return false;
            }


            for (let i= 0; i<cs.length; i++){
                var styleName = cs.item(i);
                if(_.startsWith(styleName, '-')){
                    continue;
                }

                if(Exporter.exportedStyles.some(s=>styleName.indexOf(s)>-1)){
                    cssStyleText+='; '+styleName+': '+ cs.getPropertyValue(styleName);
                }else if(Exporter.svgProperties.some(s=>styleName.indexOf(s)>-1)){
                    target.setAttribute(styleName, cs.getPropertyValue(styleName));
                }

            }

            target.setAttribute("style", cssStyleText);
            var toRemove = [];
            for (let i = 0; i < children.length; i++) {
                var node = children[i];
                if(!appendInlineStyles(node, targetChildren[i])){
                    toRemove.push(targetChildren[i]);
                }
            }
            toRemove.forEach(n=>{
                target.removeChild(n)
            });
            return true;
        }


        svgClone.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
        var serializer = new XMLSerializer();

        var svgString = serializer.serializeToString(svgClone);
        // svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink=') // Fix root xlink without namespace
        // svgString = svgString.replace(/NS\d+:href/g, 'xlink:href') // Safari NS namespace fix
        svgString = Exporter.sanitizeSVG(svgString);

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

    static saveAsPdf(svg){
        if (!Exporter.isPdfExportAvailable()) {
            alert(i18n.t('error.jsPDFisNotIncluded'));
            return;
        }
        var margin= 20;
        var svgElement = svg.node();
        var width = svgElement.width.baseVal.value + 2 * margin,
            height = svgElement.height.baseVal.value + 2 * margin;
        try{
            var doc = new jsPDF('l', 'pt', [width, height]);
            // svgString = '<svg width="200" height="200"><rect height="100" width="100" fill="black" x="20" y="20"></rect></svg>'
            var svgString = Exporter.getSVGString(svg.node());
            var dummy = document.createElement('svg');
            dummy.innerHTML = svgString;
            var textElements = dummy.getElementsByTagName('text'),
                titleElements,
                svgData,
                svgElementStyle = dummy.getElementsByTagName('svg')[0].style;
            console.log(textElements)

            _.each(textElements, function (el) {
                // Workaround for the text styling. making sure it does pick up the root element
                _.each(['font-family', 'font-size'], function (property) {
                    if (!el.style[property] && svgElementStyle[property]) {
                        el.style[property] = svgElementStyle[property];
                    }
                });
                el.style['font-family'] = el.style['font-family'] && el.style['font-family'].split(' ').splice(-1);
            });
            svg2pdf(dummy.firstChild, doc, {
                xOffset: 0,
                yOffset: 0,
                scale: 1
            });
            doc.save(Exporter.getExportFileName('pdf'));
        }catch (e){
            console.log(e);
            alert(i18n.t('error.pdfExportNotSupported'));
        }

    }

    static isPdfExportAvailable(){
        return typeof jsPDF !== 'undefined' && typeof svg2pdf !== 'undefined'
    }


    static sanitizeSVG(svg) {
        return svg
            .replace(/zIndex="[^"]+"/g, '')
            .replace(/isShadow="[^"]+"/g, '')
            .replace(/symbolName="[^"]+"/g, '')
            .replace(/jQuery[0-9]+="[^"]+"/g, '')
            .replace(/url\(("|&quot;)(\S+)("|&quot;)\)/g, 'url($2)')
            .replace(/url\([^#]+#/g, 'url(#')
            .replace(/<svg /, '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ')
            .replace(/ (NS[0-9]+\:)?href=/g, ' xlink:href=')
            .replace(/\n/, ' ')
            .replace(/<\/svg>.*?$/, '</svg>')
            .replace(/(fill|stroke)="rgba\(([ 0-9]+,[ 0-9]+,[ 0-9]+),([ 0-9\.]+)\)"/g, '$1="rgb($2)" $1-opacity="$3"')
            .replace(/&nbsp;/g, '\u00A0')
            .replace(/&shy;/g, '\u00AD');

    }
}
