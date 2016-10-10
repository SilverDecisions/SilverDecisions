import * as d3 from './d3'

import {Utils} from './utils'
import * as model from './model/index'

import {ObjectiveRulesManager} from './objective/objective-rules-manager'

import {TreeDesigner, TreeDesignerConfig} from './tree-designer/tree-designer'
import {DataModel} from './data-model'
import {Templates} from './templates'
import {Sidebar} from './sidebar'
import {Toolbar} from './toolbar'
import {ExpressionEngine} from './expression-engine'

export class AppConfig {
    width = undefined;
    height = undefined;
    rule = 'max';

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
    expressionEngine;
    objectiveRulesManager;
    treeDesigner;
    toolbar;
    sidebar;

    constructor(containerId, config) {
        this.setConfig(config);
        this.initContainer(containerId);
        this.initDataModel();
        this.initExpressionEngine();
        this.initObjectiveRulesManager();
        this.initSidebar();
        this.initTreeDesigner();
        this.initToolbar();

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
        var self = this;
        this.dataModel = new DataModel();
        // this.dataModel.nodeAddedCallback = this.dataModel.nodeRemovedCallback = ()=>self.onNodeAddedOrRemoved();
        this.dataModel.nodeAddedCallback = this.dataModel.nodeRemovedCallback = (node)=> Utils.waitForFinalEvent(()=>this.onNodeAddedOrRemoved(), 'onNodeAddedOrRemoved');
    }
    initExpressionEngine() {
        this.expressionEngine =  new ExpressionEngine(this.dataModel.expressionScope);
    }

    initObjectiveRulesManager(){
        this.objectiveRulesManager = new ObjectiveRulesManager(this.config.rule, this.dataModel, this.expressionEngine);
        this.objectiveRulesManager.recompute();

    }

    initSidebar(){
        this.sidebar = new Sidebar(this.container.select('#sidebar'), this);

    }

    initToolbar(){
        this.toolbar = new Toolbar(this.container.select('#toolbar'), this);

    }

    initTreeDesigner() {
        var self=this;
        var config = {
            rule: self.config.rule,
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
            self.sidebar.updateObjectPropertiesView(self.selectedObject);
        },10)

    }

    onSelectionCleared(){
        this.selectedObject=null;
        this.sidebar.hideObjectProperties();
        // console.log();
    }

    updateView(){

        this.treeDesigner.redraw(true);
        this.sidebar.updateObjectPropertiesView(this.selectedObject);
    }

    undo(){
        var self = this;
        self.dataModel.undo();
        if(self.selectedObject){
            self.selectedObject = self.dataModel.findById(self.selectedObject.$id);
        }
        this.objectiveRulesManager.recompute();
        self.updateView();
    }

    redo(){
        var self = this;
        self.dataModel.redo();
        if(self.selectedObject){
            self.selectedObject = self.dataModel.findById(self.selectedObject.$id);
        }
        this.objectiveRulesManager.recompute();
        self.updateView();
    }

    onNodeAddedOrRemoved() {
        console.log('onNodeAddedOrRemoved');
        this.objectiveRulesManager.recompute();
        this.updateView();
    }

    onObjectUpdated(object){
        this.objectiveRulesManager.recompute();
        this.treeDesigner.redraw(true);
    }
}
