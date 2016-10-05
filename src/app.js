import * as d3 from './d3'

import {Utils} from './utils'
import * as model from './model/index'
import {Exporter} from './exporter'
import {TreeDesigner, TreeDesignerConfig} from './tree-designer/tree-designer'
import {DataModel} from './data-model'
import {Templates} from './templates'

export class AppConfig {
    width = undefined;
    height = undefined;

    constructor(custom) {
        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}

export class App {
    config;
    container;
    dataModel; //Data model manager
    treeDesigner;

    constructor(containerId, config) {
        this.setConfig(config);
        this.initContainer(containerId);
        this.initDataModel();
        this.initSidebar();
        this.initTreeDesigner();
        this.initExportToPngButton();
        this.initExportSvgButton();
        this.initAutoLayoutButtons();
        this.initUndoRedoButtons();
    }

    setConfig(config) {
        if (!config) {
            this.config = new AppConfig();
        } else {
            this.config = config;
        }
        return this;
    }

    initContainer(containerId) {
        this.container = d3.select('#' + containerId);
        this.container.html(Templates.main);
    }

    initDataModel() {
        this.dataModel = new DataModel();
    }

    initSidebar(){
        this.sidebar = this.container.select('#sidebar');

    }

    initTreeDesigner() {
        var self=this;
        var config = {
            onNodeSelected: function(node){
                self.onObjectSelected(node);
            },
            onEdgeSelected: function(edge){
                self.onObjectSelected(edge);
            },
            onSelectionCleared: function(){
                self.onSelectionCleared();
            }
        };
        this.treeDesigner = new TreeDesigner(this.container.select('#tree-designer-container'), this.dataModel,config);
    }
    onObjectSelected(object){
        var self = this;
        if(this.selectedObject===object){
            return;
        }
        this.selectedObject = object;
        setTimeout(function(){
            self.updateObjectPropertiesView();
        },10)

    }

    updateObjectPropertiesView(){
        if(!this.selectedObject){
            return;
        }

        var objectProps = this.sidebar.select('#object-properties').classed('visible', true);
        var headerText = this.getHeaderTextForObject(this.selectedObject);
        objectProps.select('.header').html(headerText);

        var fieldList = this.getFieldListForObject(this.selectedObject);
        this.updateObjectFields(this.selectedObject, fieldList);
    }

    getHeaderTextForObject(object) {
        if(object instanceof model.Node){
            return Utils.capitalizeFirstLetter(object.type)+' Node';
        }
        if(object instanceof model.Edge){
            return 'Edge';
        }
        return '';
    }

    getFieldListForObject(object) {
        if(object instanceof model.Node){
            return [{
                name: 'name',
                label: 'Label',
                type: 'text'
            }]
        }
        if(object instanceof model.Edge){
            var list = [
                {
                    name: 'name',
                    label: 'Label',
                    type: 'text'
                },
                {
                    name: 'payoff',
                    label: 'Payoff',
                    type: 'number'
                }
            ];
            if(object.parentNode instanceof model.ChanceNode){
                list.push( {
                    name: 'probability',
                    label: 'Probability',
                    type: 'number'
                })
            }
            return list;

        }

        return [];
    }

    onSelectionCleared(){
        this.selectedObject=null;
        this.sidebar.select('#object-properties').classed('visible', false);
        // console.log();
    }

    updateObjectFields(object, fieldList) {
        var self = this;
        var objectProps = this.sidebar.select('#object-properties');
        var content = objectProps.select('.content');
        var fields = content.selectAll('div.object-field').data(fieldList);
        var temp={};
        var fieldsEnter = fields.enter().appendSelector('div.object-field');
        fieldsEnter.append('label');
        fieldsEnter.append('input');
        var fieldsMerge = fieldsEnter.merge(fields);
        fieldsMerge.select('label')
            .attr('for', d=>'object-field-'+d.name)
            .html(d=>d.label);
        fieldsMerge.select('input')
            .attr('type', d=>d.type)
            .attr('name', d=>d.name)
            .attr('id', d=>'object-field-'+d.name)
            .on('change keyup', function(d, i){
                if(d3.event.type=='change' && temp[i].pristineVal!=this.value){
                    object[d.name] = temp[i].pristineVal;
                    self.dataModel.saveState();
                }
                object[d.name] = this.value;
                self.treeDesigner.redraw();

            })
            .each(function(d, i){
                this.value = object[d.name];
                temp[i]={};
                temp[i].pristineVal = this.value;
            });

        fields.exit().remove();
    }

    initExportToPngButton() {
        var svg = this.treeDesigner.svg;
        this.container.select('#saveButton').on('click', function () {
            var svgString = Exporter.getSVGString(svg.node());
            Exporter.svgString2Image(svgString, 2 * 800, 2 * 800, 'png', save); // passes Blob and filesize String to the callback

            function save(dataBlob, filesize) {
                Exporter.saveAs(dataBlob, 'export.png');
            }
        });
    }

    initExportSvgButton() {
        var svg = this.treeDesigner.svg;
        this.container.select('#saveButtonSvg').on('click', function () {
            var svgString = Exporter.getSVGString(svg.node());
            var blob = new Blob([svgString], {type: "image/svg+xml"});
            Exporter.saveAs(blob, 'export.svg');
        });
    }

    initAutoLayoutButtons() {
        var self = this;
        this.container.select('#treeAutoLayoutButton').on('click', function () {
            self.treeDesigner.autoLayout('tree');
        });
        this.container.select('#clusterAutoLayoutButton').on('click', function () {
            self.treeDesigner.autoLayout('cluster');
        });
    }

    initUndoRedoButtons() {
        var self = this;
        self.dataModel.undoRedoStateChangedCallback = ()=>this.onUndoRedoChanged();
        this.undoButton = this.container.select('#undoButton').on('click', function () {
            self.dataModel.undo();
            if(self.selectedObject){
                self.selectedObject = self.dataModel.findById(self.selectedObject.$id);
            }

            self.updateView();
        });
        this.redoButton = this.container.select('#redoButton').on('click', function () {
            self.dataModel.redo();
            if(self.selectedObject){
                self.selectedObject = self.dataModel.findById(self.selectedObject.$id);
            }
            self.updateView();
        });
    }

    updateView(){
        this.treeDesigner.redraw(true);
        this.updateObjectPropertiesView();
    }

    onUndoRedoChanged() {
        console.log('onUndoRedoChanged');
        this.undoButton.attr("disabled", this.dataModel.isUndoAvailable() ? null : 'disabled');
        this.redoButton.attr("disabled", this.dataModel.isRedoAvailable() ? null : 'disabled');
    }



}
