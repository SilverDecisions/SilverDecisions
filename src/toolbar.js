import * as d3 from './d3'
import {i18n} from './i18n/i18n'
import {Utils} from './utils'
import * as model from './model/index'
import {Exporter} from './exporter'
import {FileLoader} from './file-loader'

export class Toolbar{

    app;
    container;

    constructor(container, app){
        this.app = app;
        this.container = container;
        this.initDiagramButtons();
        this.initExportToPngButton();
        this.initExportSvgButton();
        this.initAutoLayoutButtons();
        this.initUndoRedoButtons();
    }

    initDiagramButtons(){

        this.newDiagramButton = this.container.select('#new-diagram-button').on('click', ()=>{
            if(!confirm(i18n.t('confirm.newDiagram'))){
                return;
            }
            this.app.newDiagram();
        });
        this.openDiagramButton = this.container.select('#open-diagram-button').on('click', ()=>{
            if(!confirm(i18n.t('confirm.openDiagram'))){
                return;
            }
            FileLoader.openFile(model=>{
                this.app.openDiagram(model);
            });


        });
        this.saveDiagramButton = this.container.select('#save-diagram-button').on('click', ()=>{
            var json = this.app.serialize();
            var blob = new Blob([json], {type: "application/json"});
            Exporter.saveAs(blob, 'diagram.json');
        });
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
        self.app.treeDesigner.layout.onAutoLayoutChanged.push((layout)=>self.onLayoutChanged(layout));
        this.layoutButtons={};
        this.layoutButtons['tree'] = this.container.select('#treeAutoLayoutButton').on('click', function () {
            self.app.treeDesigner.autoLayout('tree');
        });
        this.layoutButtons['cluster'] = this.container.select('#clusterAutoLayoutButton').on('click', function () {
            self.app.treeDesigner.autoLayout('cluster');
        });
    }

    onLayoutChanged(layout){
        Object.getOwnPropertyNames(this.layoutButtons).forEach(l=>{
            this.layoutButtons[l].classed('active', false);
        });
        var button = this.layoutButtons[layout];
        if(button){
            button.classed('active', true);
        }
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
        this.initAutoLayoutButtons();
    }
}
