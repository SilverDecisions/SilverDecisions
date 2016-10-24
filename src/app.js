import * as d3 from './d3'
import {i18n} from './i18n/i18n'

import {Utils} from './utils'
import * as model from './model/index'

import {ObjectiveRulesManager} from './objective/objective-rules-manager'
import  {TreeValidator} from './validation/tree-validator'

import {TreeDesigner, TreeDesignerConfig} from './tree-designer/tree-designer'
import {DataModel} from './data-model'
import {Templates} from './templates'
import {Sidebar} from './sidebar'
import {Toolbar} from './toolbar'
import {ExpressionEngine} from './expression-engine'
import {SettingsDialog} from './settings-dialog'
import {ExpectedValueMaximizationRule} from './objective/expected-value-maximization-rule'
import {AboutDialog} from "./about-dialog";

export class AppConfig {
    width = undefined;
    height = undefined;
    rule = ExpectedValueMaximizationRule.NAME;
    lng = 'en';
    format={// NumberFormat  options
        payoff:{
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            // minimumSignificantDigits: 1,
            useGrouping: true,
        },
        probability:{ // NumberFormat  options
            minimumFractionDigits: 2,
            maximumFractionDigits: 3,
        }
    };

    //https://github.com/d3/d3-format/blob/master/README.md#format

    constructor(custom) {
        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}

export class App {
    static version = ''; // version is set from package.json

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
        this.initTreeValidator();
        this.initObjectiveRulesManager();

        this.initPayoffNumberFormat();
        this.initTreeDesigner();
        this.initSidebar();
        this.initSettingsDialog();
        this.initAboutDialog();
        this.initToolbar();
        this.initOnBeforeUnload();

    }

    setConfig(config) {
        if (!config) {
            this.config = new AppConfig();
        } else {
            this.config = new AppConfig(config);
        }
        return this;
    }

    initContainer(containerId) {
        this.container = d3.select('#' + containerId);
        this.container.html(Templates.get('main', {version: App.version}));
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
    initTreeValidator(){
        this.treeValidator = new TreeValidator(this.expressionEngine);
    }

    initObjectiveRulesManager(){
        this.objectiveRulesManager = new ObjectiveRulesManager(this.config.rule, this.dataModel, this.expressionEngine);
        this.checkValidityAndRecomputeObjective();

    }

    initSidebar(){
        this.sidebar = new Sidebar(this.container.select('#sidebar'), this);

    }

    initSettingsDialog(){
        this.settingsDialog = new SettingsDialog(this);
    }

    initAboutDialog(){
        this.aboutDialog = new AboutDialog(this);
    }

    initToolbar(){
        this.toolbar = new Toolbar(this.container.select('#toolbar'), this);

    }

    initPayoffNumberFormat(){
        this.payoffNumberFormat = new Intl.NumberFormat([],this.config.format.payoff);
    }

    initTreeDesigner() {
        var self=this;
        var config = this.getTreeDesignerInitialConfig();
        this.treeDesigner = new TreeDesigner(this.container.select('#tree-designer-container'), this.dataModel,config);
    }

    getTreeDesignerInitialConfig() {
        var self = this;
        return {
            $rule: self.config.rule,
            onNodeSelected: function (node) {
                self.onObjectSelected(node);
            },
            onEdgeSelected: function (edge) {
                self.onObjectSelected(edge);
            },
            onSelectionCleared: function () {
                self.onSelectionCleared();
            },
            payoffNumberFormatter: (v) => self.payoffNumberFormat.format(v)
        };
    }

    onObjectSelected(object){
        var self = this;
        if(this.selectedObject===object){
            return;
        }
        this.selectedObject = object;
        setTimeout(function(){
            self.sidebar.updateObjectPropertiesView(self.selectedObject);
            self.treeDesigner.updatePlottingRegionSize();
        },10)
    }

    onSelectionCleared(){
        var self=this;
        this.selectedObject=null;
        this.sidebar.hideObjectProperties();
        setTimeout(function(){
            self.treeDesigner.updatePlottingRegionSize();
        },10);
        // console.log();
    }

    updateView(){

        this.treeDesigner.redraw(true);
        this.sidebar.updateObjectPropertiesView(this.selectedObject);
        this.toolbar.update();
        this.sidebar.updateLayoutOptions();
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
            var vr = this.treeValidator.validate(this.dataModel.getAllNodesInSubtree(root));
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

    newDiagram(){
        this.dataModel.clear();
        this.updateView();
    }

    openDiagram(diagramData){
        var self = this;
        if(diagramData.lng){
            this.config.lng = diagramData.lng;
        }
        if(diagramData.rule){
            this.config.rule = diagramData.rule;
        }
        if(diagramData.format){
            this.config.format = diagramData.format;
        }
        this.setConfig(this.config);
        this.dataModel.clear();
        this.dataModel.load(diagramData.trees);

        if(diagramData.treeDesigner){
            this.treeDesigner.setConfig(Utils.deepExtend(self.getTreeDesignerInitialConfig(), diagramData.treeDesigner));
        }
        this.updatePayoffNumberFormat();
        this.updateView();

    }

    serialize(filterLocation, filterComputed){
        var self = this;
        var obj={
            SilverDecisions: App.version,
            lng: self.config.lng,
            rule: self.objectiveRulesManager.currentRule.name,
            format: self.config.format,
            treeDesigner: self.treeDesigner.config,
            trees: self.dataModel.getRoots()
        };


        return JSON.stringify(obj, function(k, v) {
            if(k.startsWith('$') || k=='parentNode'){
                return undefined;
            }
            if(filterLocation && k=='location'){
                return undefined;
            }
            if(filterComputed && k=='computed'){
                return undefined;
            }

            if(v!==null && v!==undefined && v.mathjs){
                return self.expressionEngine.serialize(v);
            }
            return v;
        }, 2);
    }

    updatePayoffNumberFormat(){
        this.initPayoffNumberFormat();
        this.updateView();
    }

    initOnBeforeUnload() {
        var self = this;
        window.addEventListener("beforeunload", function (e) {
            if(!(self.dataModel.isUndoAvailable()||self.dataModel.isRedoAvailable())){
                return;
            }

            var dialogText = i18n.t('confirm.beforeunload');
            e.returnValue = dialogText;
            return dialogText;
        });
    }
}
