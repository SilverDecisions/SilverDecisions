import * as d3 from './d3'

import {Utils} from './utils'
import * as model from './model/index'
import {Exporter} from './exporter'

export class Toolbar{

    app;
    container;

    constructor(container, app){
        this.app = app;
        this.container = container;
        this.initExportToPngButton();
        this.initExportSvgButton();
        this.initAutoLayoutButtons();
        this.initUndoRedoButtons();
    }

    initExportToPngButton() {
        var svg = this.app.treeDesigner.svg;
        this.container.select('#saveButton').on('click', function () {
            var svgString = Exporter.getSVGString(svg.node());
            Exporter.svgString2Image(svgString, 2 * 800, 2 * 800, 'png', save); // passes Blob and filesize String to the callback

            function save(dataBlob, filesize) {
                Exporter.saveAs(dataBlob, 'export.png');
            }
        });
    }

    initExportSvgButton() {
        var svg = this.app.treeDesigner.svg;
        this.container.select('#saveButtonSvg').on('click', function () {
            var svgString = Exporter.getSVGString(svg.node());
            var blob = new Blob([svgString], {type: "image/svg+xml"});
            Exporter.saveAs(blob, 'export.svg');
        });
    }

    initAutoLayoutButtons() {
        var self = this;
        this.container.select('#treeAutoLayoutButton').on('click', function () {
            self.app.treeDesigner.autoLayout('tree');
        });
        this.container.select('#clusterAutoLayoutButton').on('click', function () {
            self.app.treeDesigner.autoLayout('cluster');
        });
    }

    initUndoRedoButtons() {
        var self = this;
        self.app.dataModel.undoRedoStateChangedCallback = ()=>this.onUndoRedoChanged();
        this.undoButton = this.container.select('#undoButton').on('click', function () {
            self.app.undo();
        });
        this.redoButton = this.container.select('#redoButton').on('click', function () {
            self.app.redo();
        });
    }

    onUndoRedoChanged() {
        console.log('onUndoRedoChanged');
        this.undoButton.attr("disabled", this.app.dataModel.isUndoAvailable() ? null : 'disabled');
        this.redoButton.attr("disabled", this.app.dataModel.isRedoAvailable() ? null : 'disabled');
    }
}
