import * as d3 from './d3'
import {i18n} from './i18n/i18n'

import {Utils} from './utils'
import * as model from './model/index'

import {ObjectiveRulesManager} from './objective/objective-rules-manager'

import {TreeDesigner, TreeDesignerConfig} from './tree-designer/tree-designer'
import {DataModel} from './data-model'
import {Templates} from './templates'
import {Sidebar} from './sidebar'
import {Toolbar} from './toolbar'
import {ExpressionEngine} from './expression-engine'
import {Tooltip} from './tooltip'

export class AppConfig {
    width = undefined;
    height = undefined;
    rule = 'max';
    lng = 'en';


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
        this.initI18n();
        this.initContainer(containerId);

        this.initDataModel();
        this.initExpressionEngine();
        this.initObjectiveRulesManager();

        this.initTreeDesigner();
        this.initSidebar();
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
        this.container.html(Templates.get('main'));
    }

    initI18n() {
        i18n.init(this.config.lng);
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
        this.checkValidityAndRecomputeObjective();

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
        this.checkValidityAndRecomputeObjective();
        self.updateView();
    }

    redo(){
        var self = this;
        self.dataModel.redo();
        if(self.selectedObject){
            self.selectedObject = self.dataModel.findById(self.selectedObject.$id);
        }
        this.checkValidityAndRecomputeObjective();
        self.updateView();
    }

    onNodeAddedOrRemoved() {
        console.log('onNodeAddedOrRemoved');
        this.checkValidityAndRecomputeObjective();
        this.updateView();
    }

    onObjectUpdated(object){
        this.checkValidityAndRecomputeObjective();
        this.treeDesigner.redraw(true);
    }


    checkValidityAndRecomputeObjective(){
        this.validationResults = [];
        this.dataModel.getRoots().forEach(root=> {
            var vr = this.dataModel.validate(root);
            this.validationResults.push(vr);
            if(vr.isValid()){
                this.objectiveRulesManager.recomputeTree(root);
            }else{
                this.objectiveRulesManager.clearTree(root);
            }
        });
        this.updateValidationMessages();
    }

    updateValidationMessages() {
        var self = this;
        if(!this.treeDesigner){
            setTimeout(function(){
                self.treeDesigner.updateValidationMessages(self.validationResults);
            },1);
        }else{
            self.treeDesigner.updateValidationMessages(self.validationResults);
        }
    }
}
