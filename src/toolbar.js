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
        this.initLayoutButtons();
        this.initUndoRedoButtons();
        this.initSettingsButton();
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
        var svgWidth = svg.attr('width');
        var svgHeight = svg.attr('height');
        this.container.select('#saveButton').on('click', function () {
            var svgString = Exporter.getSVGString(svg.node());
            Exporter.svgString2Image(svgString,  4*svgWidth, 4*svgHeight, 'png', save); // passes Blob and filesize String to the callback

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

    initLayoutButtons() {
        var self = this;
        self.app.treeDesigner.layout.onAutoLayoutChanged.push((layout)=>self.onLayoutChanged(layout));
        this.layoutButtons={};
        this.layoutButtons['manual'] = this.container.select('#manualLayoutButton').on('click', function () {
            if(self.app.treeDesigner.layout.currentLayout=='manual'){
                return;
            }
            self.app.treeDesigner.layout.disableAutoLayout();
        });
        this.layoutButtons['tree'] = this.container.select('#treeAutoLayoutButton').on('click', function () {
            if(self.app.treeDesigner.layout.currentLayout=='tree'){
                return;
            }
            self.app.treeDesigner.autoLayout('tree');
        });
        this.layoutButtons['cluster'] = this.container.select('#clusterAutoLayoutButton').on('click', function () {
            if(self.app.treeDesigner.layout.currentLayout=='cluster'){
                return;
            }
            self.app.treeDesigner.autoLayout('cluster');
        });

        this.onLayoutChanged(self.app.treeDesigner.layout.currentLayout)
    }

    initSettingsButton(){
        this.settingsButton = this.container.select('#settings-button').on('click', ()=>{
            this.app.settingsDialog.open();
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
        this.updateUndoRedoButtons();
    }
    updateUndoRedoButtons(){
        this.undoButton.attr("disabled", this.app.dataModel.isUndoAvailable() ? null : 'disabled');
        this.redoButton.attr("disabled", this.app.dataModel.isRedoAvailable() ? null : 'disabled');
    }

    update(){
        this.updateUndoRedoButtons();
    }
}
