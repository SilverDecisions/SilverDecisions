import * as d3 from './d3'
import {i18n} from './i18n/i18n'
import {AppUtils} from './app-utils'
import {Exporter} from './exporter'
import {FileLoader} from './file-loader'

export class Toolbar{

    app;
    container;
    hiddenClass = 'sd-hidden';
    constructor(container, app){
        this.app = app;
        this.container = container;
        this.initDiagramButtons();
        this.initExportToolbarGroup();
        this.initLayoutButtons();
        this.initUndoRedoButtons();
        this.initSettingsButton();
        this.initAboutButton();
        this.initRecomputeButton();
        this.initObjectiveRuleToolbarGroup();
    }

    initDiagramButtons(){


        this.newDiagramButton = this.container.select('#new-diagram-button').on('click', ()=>{
            if(!confirm(i18n.t('confirm.newDiagram'))){
                return;
            }
            this.app.newDiagram();
        });
        this.newDiagramButton.classed(this.hiddenClass, !this.app.config.buttons.new);
        this.openDiagramButton = this.container.select('#open-diagram-button').on('click', ()=>{
            if(!confirm(i18n.t('confirm.openDiagram'))){
                return;
            }
            FileLoader.openFile(model=>{
                this.app.openDiagram(model);
            });


        });
        this.openDiagramButton.classed(this.hiddenClass, !this.app.config.buttons.open);
        this.saveDiagramButton = this.container.select('#save-diagram-button').on('click', ()=>{
            this.app.serialize().then((json)=>{
                AppUtils.dispatchEvent('SilverDecisionsSaveEvent', json);
                if(this.app.config.jsonFileDownload){
                    var blob = new Blob([json], {type: "application/json"});
                    Exporter.saveAs(blob, Exporter.getExportFileName('json'));
                }
            });



        });
        this.saveDiagramButton.classed(this.hiddenClass, !this.app.config.buttons.save);
    }



    initLayoutButtons() {
        var self = this;
        self.app.treeDesigner.layout.onAutoLayoutChanged.push((layout)=>self.onLayoutChanged(layout));
        this.layoutButtons={};
        this.layoutButtons['manual'] = this.container.select('#manualLayoutButton').on('click', function () {
            if(self.app.treeDesigner.config.layout.type=='manual'){
                return;
            }
            self.app.treeDesigner.layout.disableAutoLayout();
        });
        this.layoutButtons['tree'] = this.container.select('#treeAutoLayoutButton').on('click', function () {
            if(self.app.treeDesigner.config.layout.type=='tree'){
                return;
            }
            self.app.treeDesigner.autoLayout('tree');
        });
        this.layoutButtons['cluster'] = this.container.select('#clusterAutoLayoutButton').on('click', function () {
            if(self.app.treeDesigner.config.layout.type=='cluster'){
                return;
            }
            self.app.treeDesigner.autoLayout('cluster');
        });

        this.updateLayoutButtons();
    }

    updateLayoutButtons() {
        this.onLayoutChanged(this.app.treeDesigner.config.layout.type)
    }

    initSettingsButton(){
        this.settingsButton = this.container.select('#settings-button').on('click', ()=>{
            this.app.settingsDialog.open();
        });
    }

    initAboutButton(){
        this.aboutButton = this.container.select('#about-button').on('click', ()=>{
            this.app.aboutDialog.open();
        });
    }

    initRecomputeButton(){
        this.recomputeButton = this.container.select('#recompute-button').on('click', ()=>{
            this.app.recompute();
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
        this.updateUndoRedoButtons();
    }
    updateUndoRedoButtons(){
        this.undoButton.attr("disabled", this.app.dataModel.isUndoAvailable() ? null : 'disabled');
        this.redoButton.attr("disabled", this.app.dataModel.isRedoAvailable() ? null : 'disabled');
    }

    update(){
        this.updateUndoRedoButtons();
        this.updateLayoutButtons();
        this.updateObjectiveRuleValue();
    }

    initExportToolbarGroup() {
        this.container.select('#export-toolbar-group').classed(this.hiddenClass, !this.app.config.exports.show);
        if(!this.app.config.exports.show){
            return;
        }
        this.initExportToPngButton();
        this.initExportSvgButton();
        this.initExportPdfButton();

    }
    initExportToPngButton() {
        var svg = this.app.treeDesigner.svg;
        this.container.select('#saveButton')
            .on('click', () => Exporter.saveAsPng(svg, this.app.config.exports))
            .classed(this.hiddenClass, !this.app.config.buttons.exportToPng)
    }

    initExportSvgButton() {
        var svg = this.app.treeDesigner.svg;
        this.container.select('#saveButtonSvg')
            .on('click', () => Exporter.saveAsSvg(svg))
            .classed(this.hiddenClass, !this.app.config.buttons.exportToSvg)
    }

    initExportPdfButton() {
        var svg = this.app.treeDesigner.svg;
        this.container.select('#saveButtonPdf')
            .on('click', () => Exporter.saveAsPdf(svg, this.app.config.exports))
            .classed(this.hiddenClass, !this.app.config.buttons.exportToPdf)
    }

    initObjectiveRuleToolbarGroup() {
        var self = this;
        this.objectiveRuleSelect = this.container.select('#objective-rule-select');
        var rules = this.app.getObjectiveRules();
        var options = this.objectiveRuleSelect.selectAll('option').data(rules);
        options.enter()
            .append('option')
            .merge(options)
            .attr('value', d=>d.name)
            .text(d=>i18n.t('toolbar.objectiveRule.options.'+d.name));

        this.updateObjectiveRuleValue();

        this.objectiveRuleSelect.on('change', function(){
            self.app.setObjectiveRule(this.value);
        })
    }

    updateObjectiveRuleValue(){
        this.objectiveRuleSelect.node().value = this.app.getCurrentObjectiveRule().name;
    }
}
