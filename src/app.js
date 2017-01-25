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
import * as _ from "lodash";
import {Exporter} from "./exporter";
import {DefinitionsDialog} from "./definitions-dialog";

export class AppConfig {
    readOnly = false;
    buttons = {
        new: true,
        save: true,
        open: true,
        exportToPng: true,
        exportToSvg: true,
        exportToPdf: true
    };
    exports = {
        show: true,
        serverUrl: 'http://export.highcharts.com', //url of the export server
        pdf: {
            mode: 'server', // available options: 'client', 'server', 'fallback',
        },
        png: {
            mode: 'fallback', // available options: 'client', 'server', 'fallback',
        }
    };
    showDetails = true;
    showDefinitions = true;
    jsonFileDownload = true;
    width = undefined;
    height = undefined;
    rule = ExpectedValueMaximizationRule.NAME;
    lng = 'en';
    format = {// NumberFormat  options
        locales: 'en',
        payoff: {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'symbol',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            // minimumSignificantDigits: 1,
            useGrouping: true
        },
        probability: { // NumberFormat  options
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 3,
            useGrouping: true
        }
    };
    title = '';
    description = '';
    treeDesigner = {};

    //https://github.com/d3/d3-format/blob/master/README.md#format

    constructor(custom) {
        if (custom) {
            Utils.deepExtend(this, custom);
        }
    }
}

export class App {
    static version = ''; // version is set from package.json
    static utils = Utils;
    static d3 = d3;

    config;
    container;
    dataModel; //Data model manager
    expressionEngine;
    objectiveRulesManager;
    treeDesigner;
    toolbar;
    sidebar;

    constructor(containerIdOrElem, config, diagramData) {
        this.setConfig(config);
        this.initI18n();
        this.initContainer(containerIdOrElem);

        this.initDataModel();
        this.initExpressionEngine();
        this.initTreeValidator();
        this.initObjectiveRulesManager();
        this.initProbabilityNumberFormat();
        this.initPayoffNumberFormat();
        this.initTreeDesigner();
        this.initSidebar();
        this.initSettingsDialog();
        this.initAboutDialog();
        this.initDefinitionsDialog();
        this.initToolbar();
        this.initOnBeforeUnload();
        this.initKeyCodes();

        if (diagramData) {
            this.openDiagram(diagramData);
        }

        this.updateView();

    }

    setConfig(config) {
        if (!config) {
            this.config = new AppConfig();
        } else {
            this.config = new AppConfig(config);
        }
        return this;
    }

    initContainer(containerIdOrElem) {

        if (Utils.isString(containerIdOrElem)) {
            var selector = containerIdOrElem.trim();

            if (!_.startsWith(selector, '#') && !_.startsWith(selector, '.')) {
                selector = '#' + selector;
            }
            this.container = d3.select(selector);
        } else {
            this.container = d3.select(containerIdOrElem);
        }
        var self = this;
        this.container.html(Templates.get('main', {version: App.version, 'lng': self.config.lng}));
        this.container.select('#silver-decisions').classed('sd-read-only', this.config.readOnly);
    }

    initI18n() {
        i18n.init(this.config.lng);
    }

    initDataModel() {
        var self = this;
        this.dataModel = new DataModel();
        // this.dataModel.nodeAddedCallback = this.dataModel.nodeRemovedCallback = ()=>self.onNodeAddedOrRemoved();
        this.dataModel.nodeAddedCallback = this.dataModel.nodeRemovedCallback = (node)=> Utils.waitForFinalEvent(()=>this.onNodeAddedOrRemoved(), 'onNodeAddedOrRemoved');

        this.dataModel.textAddedCallback = (text)=> Utils.waitForFinalEvent(()=>this.onTextAdded(text), 'onTextAdded');
        this.dataModel.textRemovedCallback = (text)=> Utils.waitForFinalEvent(()=>this.onTextRemoved(text), 'onTextAdded');
    }


    initExpressionEngine() {
        this.expressionEngine = new ExpressionEngine(this.dataModel.expressionScope);
        this.dataModel.setExpressionEngine(this.expressionEngine);
    }

    initTreeValidator() {
        this.treeValidator = new TreeValidator(this.expressionEngine);
        this.dataModel.setTreeValidator(this.treeValidator);
    }

    initObjectiveRulesManager() {
        this.objectiveRulesManager = new ObjectiveRulesManager(this.config.rule, this.dataModel, this.expressionEngine);
        this.checkValidityAndRecomputeObjective(false, false, false);

    }

    initSidebar() {
        this.sidebar = new Sidebar(this.container.select('#sd-sidebar'), this);

    }

    initSettingsDialog() {
        this.settingsDialog = new SettingsDialog(this);
    }

    initAboutDialog() {
        this.aboutDialog = new AboutDialog(this);
    }

    initDefinitionsDialog() {
        this.definitionsDialog = new DefinitionsDialog(this);
        this.definitionsDialog.onClosed = ()=> this.recompute(true, true);

    }

    initToolbar() {
        this.toolbar = new Toolbar(this.container.select('#sd-toolbar'), this);

    }

    initPayoffNumberFormat() {

        this.payoffNumberFormat = new Intl.NumberFormat(this.config.format.locales, this.config.format.payoff);
    }

    initProbabilityNumberFormat() {
        this.probabilityNumberFormat = new Intl.NumberFormat(this.config.format.locales, this.config.format.probability);
    }

    initTreeDesigner() {
        var self = this;
        var config = this.getTreeDesignerInitialConfig();
        this.treeDesigner = new TreeDesigner(this.container.select('#tree-designer-container'), this.dataModel, config);
    }

    getTreeDesignerInitialConfig() {
        var self = this;
        return Utils.deepExtend({
            $readOnly: self.config.readOnly,
            $rule: self.config.rule,
            onNodeSelected: function (node) {
                self.onObjectSelected(node);
            },
            onEdgeSelected: function (edge) {
                self.onObjectSelected(edge);
            },
            onTextSelected: function (text) {
                self.onObjectSelected(text);
            },
            onSelectionCleared: function () {
                self.onSelectionCleared();
            },
            payoffNumberFormatter: (v) => self.payoffNumberFormat.format(v),
            probabilityNumberFormatter: (v) => self.probabilityNumberFormat.format(v)
        }, self.config.treeDesigner);
    }

    onObjectSelected(object) {
        var self = this;
        if (this.selectedObject === object) {
            return;
        }
        this.selectedObject = object;
        setTimeout(function () {
            self.sidebar.updateObjectPropertiesView(self.selectedObject);
            self.updateVariableDefinitions();
            self.treeDesigner.updatePlottingRegionSize();
        }, 10)
    }

    onSelectionCleared() {
        var self = this;
        this.selectedObject = null;
        this.sidebar.hideObjectProperties();
        setTimeout(function () {
            self.updateVariableDefinitions();
            self.treeDesigner.updatePlottingRegionSize();
        }, 10);
        // console.log();
    }

    getCurrentVariableDefinitionsSourceObject() {
        if (this.selectedObject) {
            if (this.selectedObject instanceof model.Edge) {
                return this.selectedObject.parentNode;
            }
            return this.selectedObject;
        }
        return this.dataModel;
    }

    updateVariableDefinitions() {
        var self = this;
        var definitionsSourceObject = self.getCurrentVariableDefinitionsSourceObject();
        var readOnly = (this.selectedObject instanceof model.Edge) || (this.selectedObject instanceof model.TerminalNode);
        self.sidebar.updateDefinitions(definitionsSourceObject, readOnly, (code)=> {
            self.dataModel.saveState();
            definitionsSourceObject.code = code;
            self.recompute(true, true)
        });

    }

    openDefinitionsDialog() {
        // this.recompute(true, true);
        var definitionsSourceObject = this.getCurrentVariableDefinitionsSourceObject();
        this.definitionsDialog.open(definitionsSourceObject, (code)=> {
            this.dataModel.saveState();
            definitionsSourceObject.code = code;
            this.recompute(true, true);
        });
    }

    updateView() {
        // console.log('_updateView');
        this.treeDesigner.redraw(true);
        this.sidebar.updateObjectPropertiesView(this.selectedObject);
        this.updateVariableDefinitions();
        this.toolbar.update();
        this.sidebar.updateLayoutOptions();
        this.sidebar.updateDiagramDetails();
    }

    undo() {
        var self = this;
        self.dataModel.undo();
        if (self.selectedObject) {
            self.selectedObject = self.dataModel.findById(self.selectedObject.$id);
        }
        this.checkValidityAndRecomputeObjective(false, false, false);
        self.updateView();
    }

    redo() {
        var self = this;
        self.dataModel.redo();
        if (self.selectedObject) {
            self.selectedObject = self.dataModel.findById(self.selectedObject.$id);
        }
        this.checkValidityAndRecomputeObjective(false, false, false);
        self.updateView();
    }

    onNodeAddedOrRemoved() {
        this.checkValidityAndRecomputeObjective();
        this.updateView();
    }

    onTextAdded(text) {
        console.log('onTextAdded');
        this.onObjectSelected(text);
    }

    onTextRemoved(text) {
        console.log('onTextRemoved');
        this.updateView();
    }

    onObjectUpdated() {
        var self = this;
        this.checkValidityAndRecomputeObjective();
        // this.sidebar.updateObjectPropertiesView(this.selectedObject);
        setTimeout(function () {
            self.treeDesigner.redraw(true);
        },1);


    }

    setObjectiveRule(ruleName) {
        this.treeDesigner.setRuleName(ruleName);
        this.objectiveRulesManager.setCurrentRuleByName(ruleName);
        this.checkValidityAndRecomputeObjective(false, false, false);
        this.updateView(true);
    }



    recompute(updateView = true, debounce = false) {
        if(debounce){
            if(!this.debouncedRecompute){
                this.debouncedRecompute = _.debounce((updateView)=>this.recompute(updateView, false), 200);
            }
            this.debouncedRecompute(updateView);
            return;
        }

        this.checkValidityAndRecomputeObjective(false, true);
        if (updateView) {
            this.updateView();
        }
    }

    checkValidityAndRecomputeObjective(allRules, evalCode=false, evalNumeric=true) {
        this.validationResults = [];

        if(evalCode||evalNumeric){
            this.objectiveRulesManager.evalExpressions(evalCode, evalNumeric);
        }


        this.dataModel.getRoots().forEach(root=> {
            var vr = this.treeValidator.validate(this.dataModel.getAllNodesInSubtree(root));
            this.validationResults.push(vr);
            if (vr.isValid()) {
                this.objectiveRulesManager.recomputeTree(root, allRules);
            } else {
                this.objectiveRulesManager.setProbabilitiesToDisplay();
            }
        });
        this.updateValidationMessages();
        Utils.dispatchEvent('SilverDecisionsRecomputedEvent', this);
    }

    updateValidationMessages() {
        var self = this;
        setTimeout(function () {
            self.treeDesigner.updateValidationMessages(self.validationResults);
        }, 1);
    }

    newDiagram() {
        this.clear();
        this.updateView();
    }

    clear() {
        this.dataModel.clear();
        this.setDiagramTitle('', true);
        this.setDiagramDescription('', true);
        this.treeDesigner.setConfig(Utils.deepExtend(this.getTreeDesignerInitialConfig()));
        this.onSelectionCleared();
    }

    openDiagram(diagramData) {
        var self = this;
        this.clear();
        if (!diagramData.SilverDecisions) {
            alert(i18n.t('error.notSilverDecisionsFile'));
            return;
        }
        try {
            if (diagramData.lng) {
                this.config.lng = diagramData.lng;
            }
            if (diagramData.rule) {
                if (this.objectiveRulesManager.isRuleName(diagramData.rule)) {
                    this.config.rule = diagramData.rule;
                } else {
                    delete this.config.rule;
                }
            }
            if (diagramData.format) {
                this.config.format = diagramData.format;
            }

            this.setConfig(this.config);

            this.dataModel.load(diagramData.trees, diagramData.texts, diagramData.code, diagramData.expressionScope);

            if (diagramData.treeDesigner) {
                this.treeDesigner.setConfig(Utils.deepExtend(self.getTreeDesignerInitialConfig(), diagramData.treeDesigner));
            }

            this.setDiagramTitle(diagramData.title || '', true);
            this.setDiagramDescription(diagramData.description || '', true);

        } catch (e) {
            alert(i18n.t('error.malformedData'));

            console.log(e);
        }
        try {
            this.updateNumberFormats();
        } catch (e) {
            console.log(e);
            alert(i18n.t('error.incorrectNumberFormatOptions'));
            delete this.config.format;
            this.setConfig(this.config);
            this.updateNumberFormats();
        }

        this.setObjectiveRule(this.config.rule);
        // this.checkValidityAndRecomputeObjective();
        // this.updateView();

    }

    serialize(filterLocation, filterComputed) {
        var self = this;
        self.checkValidityAndRecomputeObjective(true, false, false);

        var obj = {
            SilverDecisions: App.version,
            savetime: d3.isoFormat(new Date()),
            lng: self.config.lng,
            rule: self.objectiveRulesManager.currentRule.name,
            title: self.config.title,
            description: self.config.description,
            format: self.config.format,
            treeDesigner: self.treeDesigner.config,
            trees: self.dataModel.getRoots(),
            texts: self.dataModel.texts,
            expressionScope: self.dataModel.expressionScope,
            code: self.dataModel.code
        };

        var cache = [];
        return JSON.stringify(obj, function (k, v) {
            if (typeof v === 'object' && v !== null) {
                if (cache.indexOf(v) !== -1) {
                    // Circular reference found, discard key
                    return;
                }
                cache.push(v);
            }
            if (_.startsWith(k, '$') || k == 'parentNode') {
                return undefined;
            }
            if (filterLocation && k == 'location') {
                return undefined;
            }
            if (filterComputed && k == 'computed') {
                return undefined;
            }

            if (v !== null && v !== undefined && v.mathjs) {
                try{
                    return self.expressionEngine.serialize(v);
                }catch (e){
                    return v;
                }

            }
            return v;
        }, 2);
    }

    updateNumberFormats() {
        this.initPayoffNumberFormat();
        this.initProbabilityNumberFormat();
        this.updateView();
    }

    updatePayoffNumberFormat() {
        this.initPayoffNumberFormat();
        this.updateView();
    }

    updateProbabilityNumberFormat() {
        this.initProbabilityNumberFormat();
        this.updateView();
    }

    initOnBeforeUnload() {
        var self = this;
        window.addEventListener("beforeunload", function (e) {
            if (!(self.dataModel.isUndoAvailable() || self.dataModel.isRedoAvailable())) {
                return;
            }

            var dialogText = i18n.t('confirm.beforeunload');
            e.returnValue = dialogText;
            return dialogText;
        });
    }

    setConfigParam(path, value, withoutStateSaving, callback) {
        var self = this;
        var prevValue = _.get(this.config, path);

        if (prevValue == value) {
            return;
        }
        if (!withoutStateSaving) {
            this.dataModel.saveState({
                data: {
                    prevValue: prevValue
                },
                onUndo: (data)=> {
                    self.setConfigParam(path, data.prevValue, true, callback);
                },
                onRedo: (data)=> {
                    self.setConfigParam(path, value, true, callback);
                }
            });
        }
        _.set(this.config, path, value);
        if (callback) {
            callback(value);
        }
    }


    setDiagramTitle(title, withoutStateSaving) {
        this.setConfigParam('title', title, withoutStateSaving, (v) => this.treeDesigner.updateDiagramTitle(v));
    }

    setDiagramDescription(description, withoutStateSaving) {
        this.setConfigParam('description', description, withoutStateSaving, (v) => this.treeDesigner.updateDiagramDescription(v));
    }

    initKeyCodes() {

        this.container.on("keyup", (d)=> {
            if (d3.event.srcElement && ['INPUT', 'TEXTAREA'].indexOf(d3.event.srcElement.nodeName.toUpperCase()) > -1) { //ignore events from input and textarea elements
                return;
            }

            var key = d3.event.keyCode;
            if (key == 46) {//delete
                this.treeDesigner.removeSelectedNodes();
                this.treeDesigner.removeSelectedTexts();
                return;
            }
            if (!d3.event.ctrlKey) {
                return;
            }


            if (d3.event.altKey) {
                if (this.selectedObject instanceof model.Node) {
                    let selectedNode = this.selectedObject;
                    if (selectedNode instanceof model.TerminalNode) {
                        return;
                    }
                    if (key == 68) { // ctrl + alt + d
                        this.treeDesigner.addDecisionNode(selectedNode);
                    } else if (key == 67) { // ctrl + alt + c
                        this.treeDesigner.addChanceNode(selectedNode);
                    } else if (key == 84) { // ctrl + alt + t
                        this.treeDesigner.addTerminalNode(selectedNode);
                    }
                    return;
                } else if (this.selectedObject instanceof model.Edge) {
                    if (key == 68) { // ctrl + alt + d
                        this.treeDesigner.injectDecisionNode(this.selectedObject);
                    } else if (key == 67) { // ctrl + alt + c
                        this.treeDesigner.injectChanceNode(this.selectedObject);
                    }
                }

            }


            if (key == 90) {//ctrl + z
                this.undo();
                return;
            }
            if (key == 89) {//ctrl + y
                this.redo();
                return;
            }

            /*if(key==65){//ctrl + a
             if(selectedNodes.length==1){
             this.treeDesigner.selectSubTree(selectedNodes[0])
             }else{
             this.treeDesigner.selectAllNodes();
             }
             // d3.event.preventDefault()
             return;
             }*/
            var selectedNodes = this.treeDesigner.getSelectedNodes();
            if (key == 86) {//ctrl + v
                if (selectedNodes.length == 1) {
                    let selectedNode = selectedNodes[0];
                    if (selectedNode instanceof model.TerminalNode) {
                        return;
                    }
                    this.treeDesigner.pasteToNode(selectedNode)
                } else if (selectedNodes.length == 0) {

                }
                return;
            }

            if (!selectedNodes.length) {
                return;
            }

            if (key == 88) {//ctrl + x
                this.treeDesigner.cutSelectedNodes();

            } else if (key == 67) {//ctrl + c
                this.treeDesigner.copySelectedNodes();

            }

        });
    }
}
