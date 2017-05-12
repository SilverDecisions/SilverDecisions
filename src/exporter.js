import {dataURLtoBlob} from "blueimp-canvas-to-blob";
import {saveAs} from "file-saver";
import * as d3 from "./d3";
import {i18n} from "./i18n/i18n";
import {Utils, log} from "sd-utils";
import {LoadingIndicator} from "./loading-indicator";

export class Exporter {
    static saveAs = saveAs;
    static dataURLtoBlob = dataURLtoBlob;
    static exportedStyles = [/^font/, /^color/, /^opacity$/];
    static svgProperties = [/^stroke/, /^fill/, /^text/];

// Below are the function that handle actual exporting:
// getSVGString (svgNode ) and svgString2Image( svgString, width, height, format, callback )
    static getSvgCloneWithInlineStyles(svgNode) {
        var svgClone = svgNode.cloneNode(true);
        appendInlineStyles(svgNode, svgClone);

        function appendInlineStyles(source, target, parentCs) {
            if (!source) {
                log.error('Exporter.appendInlineStyles - undefined source!');
                return false;
            }
            var children = source.children;
            var targetChildren = target.children;
            if (!source.children) {
                children = source.childNodes;
                targetChildren = target.childNodes;
            }

            if (source.tagName === 'text') {
                /*
                 var bBox = source.getBBox();
                 console.log(source, bBox);
                 target.setAttribute('y', bBox.y)*/
            }


            var cssStyleText = '';
            var cs = getComputedStyle(source);
            if (!cs) {
                return true;
            }
            if (cs.display === 'none') {
                return false;
            }


            for (let i = 0; i < cs.length; i++) {
                var styleName = cs.item(i);
                if (Utils.startsWith(styleName, '-')) {
                    continue;
                }

                var propertyValue = cs.getPropertyValue(styleName);
                if (parentCs) {
                    if (propertyValue === parentCs.getPropertyValue(styleName)) {
                        continue;
                    }
                }

                if (Exporter.exportedStyles.some(s=>s.test(styleName))) {
                    cssStyleText += '; ' + styleName + ': ' + propertyValue;
                } else if (Exporter.svgProperties.some(s=>s.test(styleName))) {
                    target.setAttribute(styleName, propertyValue);
                }

            }
            if (cssStyleText.length) {
                target.setAttribute("style", cssStyleText);
            } else {
                target.removeAttribute("style")
            }


            var toRemove = [];
            for (let i = 0; i < children.length; i++) {
                var node = children[i];
                if (!appendInlineStyles(node, targetChildren[i], cs)) {
                    toRemove.push(targetChildren[i]);
                }
            }
            toRemove.forEach(n=> {
                target.removeChild(n)
            });
            return true;
        }

        /*var textElements = svgNode.getElementsByTagName('text')
         _.each(textElements, function (el) {


         var textBBox = el.getBBox();
         console.log(el,textBBox, el.getBoundingClientRect());
         _.each(el.getElementsByTagName('tspan'), tspan=>{
         var tspanBBox = tspan.getBBox();
         console.log(tspan,tspanBBox, tspan.getBoundingClientRect());
         })

         // el.style['font-family'] = el.style['font-family'] && el.style['font-family'].split(' ').splice(-1);
         });*/


        svgClone.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
        return svgClone;
    }


    static getSVGString(svgNode, removeIds=false) {
        // svgNode = svgNode.cloneNode(true);
        var svgClone = Exporter.getSvgCloneWithInlineStyles(svgNode);

        var svgString = Exporter.serializeSvgNode(svgClone);
        // svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink=') // Fix root xlink without namespace
        // svgString = svgString.replace(/NS\d+:href/g, 'xlink:href') // Safari NS namespace fix
        svgString = Exporter.sanitizeSVG(svgString, removeIds);

        return svgString;
    }

    static serializeSvgNode(svgNode) {
        var serializer = new XMLSerializer();
        return serializer.serializeToString(svgNode);
    }

    static validateSvgNode(svgNode) {
        var svgString = Exporter.serializeSvgNode(svgNode);
        var oParser = new DOMParser();
        var doc = oParser.parseFromString(svgString, 'image/svg+xml');
        return doc.documentElement.nodeName.indexOf('parsererror') === -1;
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
        image.width = width;
        image.height = height;
        var target = new Image;
        target.width = width;
        target.height = height;


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
    static getExportFileName(ext, name='decisiontree') {
        var format = d3.timeFormat("%Y.%m.%d_%H.%M.%S");
        var date = new Date();
        name += '@' + format(date);
        if (ext) {
            name += '.' + ext
        }
        return name;
    }

    static saveAsPng(svg, options) {

        var clientSide = options.png.mode === 'client';
        var fallback = options.png.mode === 'fallback';
        var serverSide = options.png.mode === 'server';
        if (Utils.detectIE()) {
            if (clientSide) {
                alert(i18n.t('error.pngExportNotSupportedIE'));
                return;
            }

            if (fallback) {
                fallback = false;
                serverSide = true;
            }
        }
        LoadingIndicator.show();

        try {
            var svgString = Exporter.getSVGString(svg.node());
            var svgWidth = svg.attr('width');
            var svgHeight = svg.attr('height');

            var pngWidth = 4 * svgWidth;
            var pngHeight = 4 * svgHeight;
            if (clientSide || fallback) {
                Exporter.svgString2Image(svgString, pngWidth, pngHeight, 'png', save); // passes Blob and filesize String to the callback

                function save(dataBlob, filesize) {
                    try {
                        Exporter.saveAs(dataBlob, Exporter.getExportFileName('png'));
                        LoadingIndicator.hide();
                    } catch (e) {
                        log.warn('client side png rendering failed!');
                        if (fallback) {
                            log.info('performing server side fallback.');
                            Exporter.exportPngServerSide(svgString, options.serverUrl, pngWidth, pngHeight);
                        } else {
                            throw e;
                        }
                    }

                }
            } else if (serverSide) {
                Exporter.exportPngServerSide(svgString, options.serverUrl, pngWidth, pngHeight);
            }


        } catch (e) {
            alert(i18n.t('error.pngExportNotSupported'));
            LoadingIndicator.hide();
            log.error('pngExportNotSupported', e);
        }
    }


    static saveAsSvg(svg) {
        try {
            var svgString = Exporter.getSVGString(svg.node());

            var blob = new Blob([svgString], {type: "image/svg+xml"});
            Exporter.saveAs(blob, Exporter.getExportFileName('svg'));
        } catch (e) {
            alert(i18n.t('error.svgExportNotSupported'));
            log.error('svgExportNotSupported', e);
        }
    }

    static exportPdfClientSide(svgString, width, height) {
        var doc = new jsPDF('l', 'pt', [width, height]);
        var dummy = document.createElement('svg');
        dummy.innerHTML = svgString;
        svg2pdf(dummy.firstChild, doc, {
            xOffset: 0,
            yOffset: 0,
            scale: 1
        });
        doc.save(Exporter.getExportFileName('pdf'));
        LoadingIndicator.hide();

    }

    static postAndSave(url, data, filename, successCallback, failCallback) {
        var xhr = new XMLHttpRequest();
        xhr.open('post', url, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.responseType = 'arraybuffer';
        xhr.onload = function () {
            var status = xhr.status;
            log.debug(status);
            var type = xhr.getResponseHeader('Content-Type');
            if (status == 200) {
                var blob = new Blob([this.response], {type: type});
                Exporter.saveAs(blob, filename);
                if (successCallback) {
                    successCallback();
                }
            } else {
                if (failCallback) {
                    failCallback();
                }
            }
        };
        xhr.onreadystatechange = function (oEvent) {
            if (xhr.readyState === 4) {
                if (xhr.status !== 200) {
                    failCallback();
                }
            }
        };


        xhr.send(JSON.stringify(data));
    }

    static exportPdfServerSide(svgString, url) {
        var filename = Exporter.getExportFileName('pdf');
        var data = {svg: svgString, type: 'pdf', noDownload: true};
        Exporter.postAndSave(url, data, filename, LoadingIndicator.hide, ()=> {
            LoadingIndicator.hide();
            alert(i18n.t('error.serverSideExportRequestFailure'));
            throw new Error('Server side export failure');
        });

        // Utils.postByForm(url, {
        //     filename: filename,
        //     type: 'pdf',
        //     // width: options.width || 0, // IE8 fails to post undefined correctly, so use 0
        //     // scale: options.scale,
        //     svg: svgString
        // });

    }

    static exportPngServerSide(svgString, url, pngWidth, pngHeight) {
        var filename = Exporter.getExportFileName('png');
        var data = {svg: svgString, type: 'png', noDownload: true, width: pngWidth};
        Exporter.postAndSave(url, data, filename, LoadingIndicator.hide, ()=> {
            LoadingIndicator.hide();
            alert(i18n.t('error.serverSideExportRequestFailure'));
            throw new Error('Server side export failure');
        });

        /*Utils.postByForm(url, {
         filename: filename,
         type: 'pdf',
         // width: options.width || 0, // IE8 fails to post undefined correctly, so use 0
         // scale: options.scale,
         svg: svgString
         });*/

    }

    static saveAsPdf(svg, options) {
        var clientSidePdfExportAvailable = Exporter.isClientSidePdfExportAvailable();
        if (options.pdf.mode === 'client') {
            if (!clientSidePdfExportAvailable) {
                alert(i18n.t('error.jsPDFisNotIncluded'));
                return;
            }
        }
        LoadingIndicator.show();
        var margin = 20;
        var svgElement = svg.node();
        var width = svgElement.width.baseVal.value + 2 * margin,
            height = svgElement.height.baseVal.value + 2 * margin;
        try {
            var svgString = Exporter.getSVGString(svgElement);

            var fallback = options.pdf.mode === 'fallback';
            if (options.pdf.mode === 'client' || fallback) {
                try {
                    Exporter.exportPdfClientSide(svgString, width, height);
                } catch (e) {
                    log.error('client side pdf rendering failed!');
                    if (fallback) {
                        log.info('performing server side fallback.');
                        Exporter.exportPdfServerSide(svgString, options.serverUrl);
                    } else {
                        throw e;
                    }
                }
            } else if (options.pdf.mode === 'server') {
                Exporter.exportPdfServerSide(svgString, options.serverUrl);
            }
        } catch (e) {
            log.error('pdfExportNotSupported', e);
            LoadingIndicator.hide();
            alert(i18n.t('error.pdfExportNotSupported'));

        }

    }

    static isClientSidePdfExportAvailable() {
        return typeof jsPDF !== 'undefined' && typeof svg2pdf !== 'undefined'
    }


    static sanitizeSVG(svg, removeIds=false) {
        let sanitized = svg
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

        if(removeIds){
            return sanitized.replace(/id="[^"]+"/g, '')
        }

        return sanitized;

    }

    static saveAsCSV(rows, name='decisiontree') {
        var csvRows = [];
        rows.forEach(row => {
            csvRows.push(row.map(r=>Exporter.escapeCsvField(r)).join(','))
        });
        var csvString = csvRows.join("\r\n");

        var blob = new Blob([csvString], {type: "text/csv"});
        Exporter.saveAs(blob, Exporter.getExportFileName('csv', name));

    }

    static escapeCsvField(field){
        if(Utils.isString(field)){
            return '"'+field.replace(/"/g, '""')+'"'
        }
        return field;
    }
}
