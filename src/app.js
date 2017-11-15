import * as d3 from "./d3";
import {i18n} from "./i18n/i18n";
import {Utils, log} from "sd-utils";
import {AppUtils} from "./app-utils";
import * as model from "sd-model";
import {TreeDesigner} from "sd-tree-designer";
import {Templates} from "./templates";
import {Sidebar} from "./sidebar";
import {Toolbar} from "./toolbar";
import {SettingsDialog} from "./dialogs/settings-dialog";
import {AboutDialog} from "./dialogs/about-dialog";
import {Exporter} from "./exporter";
import {DefinitionsDialog} from "./dialogs/definitions-dialog";
import {ComputationsManager} from "sd-computations";
import {SensitivityAnalysisDialog} from "./dialogs/sensitivity-analysis-dialog";
import {LoadingIndicator} from "./loading-indicator";
import {LeagueTableDialog} from "./league-table/league-table-dialog";

var buildConfig = require('../tmp/build-config.js');

export class AppConfig {
    readOnly = false;
    logLevel = 'warn';
    workerUrl = null;
    jobRepositoryType = 'idb';
    clearRepository = false;
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
    rule = "expected-value-maximization";
    lng = 'en';
    format = {// NumberFormat  options
        locales: 'en',
        payoff1: {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'symbol',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            // minimumSignificantDigits: 1,
            useGrouping: true
        },
        payoff2: {
            style: 'decimal',
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
    leagueTable = {
        plot: {
            maxWidth: "800px",
            groups: {
                'highlighted': {
                    color: '#008000'
                },
                'highlighted-default': {
                    color: '#00bd00'
                },
                'extended-dominated': {
                    color: '#ffa500'
                },
                'dominated': {
                    color: '#ff0000'
                },
                'default': {
                    color: '#000000'
                }
            }
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
    static buildTimestamp = buildConfig.buildTimestamp;
    static utils = Utils;
    static appUtils = AppUtils;
    static d3 = d3;

    config;
    container;
    dataModel; //Data model manager
    expressionEngine;
    computationsManager;
    treeDesigner;
    toolbar;
    sidebar;
    viewModes = [];
    currentViewMode;

    payoffsMaximization=[true, false];

    constructor(containerIdOrElem, config, diagramData) {
        var p = Promise.resolve();
        this.setConfig(config);
        this.initI18n();
        this.initContainer(containerIdOrElem);
        this.initViewModes();
        this.initDataModel();
        p = this.initComputationsManager();
        this.initProbabilityNumberFormat();
        this.initPayoffNumberFormat();
        this.initTreeDesigner();
        this.initSidebar();
        this.initSettingsDialog();
        this.initAboutDialog();
        this.initDefinitionsDialog();
        this.initSensitivityAnalysisDialog();
        this.initLeagueTableDialog();
        this.initOnBeforeUnload();
        this.initKeyCodes();
        p.then(()=> {
            this.initToolbar();
            if (diagramData) {
                this.openDiagram(diagramData);
            } else {
                this.updateView();
            }
        }).catch(e=> {
            log.error(e);
        });
    }

    setConfig(config) {
        if (!config) {
            this.config = new AppConfig();
        } else {
            this.config = new AppConfig(config);
        }
        this.setLogLevel(this.config.logLevel);
        return this;
    }

    static growl() {
        return AppUtils.growl(arguments)
    }

    setLogLevel(level) {
        log.setLevel(level)
    }

    initContainer(containerIdOrElem) {

        if (Utils.isString(containerIdOrElem)) {
            var selector = containerIdOrElem.trim();

            if (!Utils.startsWith(selector, '#') && !Utils.startsWith(selector, '.')) {
                selector = '#' + selector;
            }
            this.container = d3.select(selector);
        } else {
            this.container = d3.select(containerIdOrElem);
        }
        var self = this;

        let html = Templates.get('main', {
            version: App.version,
            buildTimestamp: App.buildTimestamp,
            'lng': self.config.lng
        });
        this.container.html(html);

        this.container.select('#silver-decisions').classed('sd-read-only', this.config.readOnly);
    }

    initI18n() {
        i18n.init(this.config.lng);
    }

    initDataModel() {
        var self = this;
        this.dataModel = new model.DataModel();
        // this.dataModel.nodeAddedCallback = this.dataModel.nodeRemovedCallback = ()=>self.onNodeAddedOrRemoved();
        this.dataModel.nodeAddedCallback = this.dataModel.nodeRemovedCallback = (node)=> Utils.waitForFinalEvent(()=>this.onNodeAddedOrRemoved(), 'onNodeAddedOrRemoved', 5);

        this.dataModel.textAddedCallback = (text)=> Utils.waitForFinalEvent(()=>this.onTextAdded(text), 'onTextAdded');
        this.dataModel.textRemovedCallback = (text)=> Utils.waitForFinalEvent(()=>this.onTextRemoved(text), 'onTextAdded');
    }

    initComputationsManager() {
        this.computationsManager = new ComputationsManager({
            ruleName: this.config.ruleName,
            worker: {
                url: this.config.workerUrl,
            },
            jobRepositoryType: this.config.jobRepositoryType,
            clearRepository: this.config.clearRepository
        }, this.dataModel);
        this.expressionEngine = this.computationsManager.expressionEngine;
        return this.checkValidityAndRecomputeObjective(false, false, false, true);

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

    initLeagueTableDialog() {
        this.leagueTableDialog = new LeagueTableDialog(this);
    }

    isLeagueTableAvailable() {
        return this.isMultipleCriteria() && this.dataModel.getRoots().length === 1 && this.computationsManager.isValid() && this.leagueTableDialog.validateParams();
    }

    initSensitivityAnalysisDialog() {
        this.sensitivityAnalysisDialog = new SensitivityAnalysisDialog(this);

    }

    isSensitivityAnalysisAvailable() {
        return !this.isMultipleCriteria() && this.dataModel.getRoots().length === 1 && this.computationsManager.isValid() && this.dataModel.getGlobalVariableNames(true).length;
    }

    initToolbar() {
        this.toolbar = new Toolbar(this.container.select('#sd-toolbar'), this);

    }

    initPayoffNumberFormat() {

        this.payoffNumberFormat = [
            new Intl.NumberFormat(this.config.format.locales, this.config.format.payoff1),
            new Intl.NumberFormat(this.config.format.locales, this.config.format.payoff2)
        ]

    }

    initProbabilityNumberFormat() {
        this.probabilityNumberFormat = new Intl.NumberFormat(this.config.format.locales, this.config.format.probability);
    }

    initTreeDesigner() {
        var self = this;
        var config = this.getTreeDesignerInitialConfig();
        let container2 = this.container.select('#tree-designer-container');

        this.treeDesigner = new TreeDesigner(container2, this.dataModel, config);
    }

    getTreeDesignerInitialConfig() {
        var self = this;

        return Utils.deepExtend({
            lng: self.config.lng,
            readOnly: self.config.readOnly,
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
            payoffNumberFormatter: (v, i) => {
                let prefix = '';
                if(self.currentViewMode.multiCriteria){
                    prefix =  self.dataModel.payoffNames[i].charAt(0) + ': ';
                }

                return prefix + self.payoffNumberFormat[i || self.currentViewMode.payoffIndex || 0].format(v)
            },
            probabilityNumberFormatter: (v) => self.probabilityNumberFormat.format(v),
            operationsForObject: (o) => self.computationsManager.operationsForObject(o)
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
            if (this.selectedObject instanceof model.domain.Node) {
                return this.selectedObject;
            }
            if (this.selectedObject instanceof model.domain.Edge) {
                return this.selectedObject.parentNode;
            }
        }
        return this.dataModel;
    }

    updateVariableDefinitions() {
        var self = this;
        var definitionsSourceObject = self.getCurrentVariableDefinitionsSourceObject();
        var readOnly = (this.selectedObject instanceof model.domain.Edge) || (this.selectedObject instanceof model.domain.TerminalNode);
        self.sidebar.updateDefinitions(definitionsSourceObject, readOnly, (code)=> {
            self.dataModel.saveState();
            definitionsSourceObject.code = code;
            self.recompute(true, true)
        });

    }

    openDefinitionsDialog() {
        var definitionsSourceObject = this.getCurrentVariableDefinitionsSourceObject();
        this.definitionsDialog.open(definitionsSourceObject, (code)=> {
            this.dataModel.saveState();
            definitionsSourceObject.code = code;
            this.recompute(true, true);
        });
    }

    updateView(withTransitions = true) {
        // console.log('_updateView');
        this.treeDesigner.redraw(withTransitions);
        this.sidebar.updateObjectPropertiesView(this.selectedObject);
        this.updateVariableDefinitions();
        this.toolbar.update();
        this.sidebar.updateLayoutOptions();
        this.sidebar.updateDiagramDetails();
        this.sidebar.updateMultipleCriteria();
    }

    undo() {
        var self = this;
        self.dataModel.undo();
        if (self.selectedObject) {
            self.selectedObject = self.dataModel.findById(self.selectedObject.$id);
        }
        return this.checkValidityAndRecomputeObjective(false, false, false).then(()=> {
            self.updateView();
        })

    }

    redo() {
        var self = this;
        self.dataModel.redo();
        if (self.selectedObject) {
            self.selectedObject = self.dataModel.findById(self.selectedObject.$id);
        }

        return this.checkValidityAndRecomputeObjective(false, false, false).then(()=> {
            self.updateView();
        })
    }

    onNodeAddedOrRemoved() {
        var self = this;
        return this.checkValidityAndRecomputeObjective().then(()=> {
            self.updateView();
        });

    }

    onTextAdded(text) {
        return this.onObjectSelected(text);
    }

    onTextRemoved(text) {
        this.updateView();
    }

    onObjectUpdated(object, fieldName) {
        var self = this;
        var p = Promise.resolve();
        if (!(object instanceof model.domain.Text) && fieldName !== 'name') {
            p = p.then(()=>this.checkValidityAndRecomputeObjective());
        }
        // this.sidebar.updateObjectPropertiesView(this.selectedObject);
        return p.then(()=> {
            setTimeout(function () {
                self.treeDesigner.redraw(true);
            }, 1);
        });
    }

    onMultiCriteriaUpdated(fieldName) {
        var self = this;
        var p = Promise.resolve();
        if (fieldName === 'defaultCriterion1Weight') {
            p = p.then(()=>this.checkValidityAndRecomputeObjective());
        }
        this.sidebar.updateMultipleCriteria();

        return p.then(()=> {
            setTimeout(function () {
                self.treeDesigner.redraw(true);
                self.sidebar.updateObjectPropertiesView(self.selectedObject);
            }, 1);
        });
    }

    setObjectiveRule(ruleName, evalCode = false, evalNumeric = false, updateView = true, recompute = true) {
        let prevRule = this.computationsManager.getCurrentRule();
        this.computationsManager.setCurrentRuleByName(ruleName);
        let currentRule = this.computationsManager.getCurrentRule();
        let multiCriteria = currentRule.multiCriteria;
        this.treeDesigner.config.maxPayoffsToDisplay = multiCriteria ? 2 : 1;

        if (multiCriteria) {
            this.payoffsMaximization = currentRule.payoffCoeffs.map(c=>c>0);

            if (!this.dataModel.payoffNames.length) {
                this.dataModel.payoffNames.push(null, null);
                this.dataModel.payoffNames[0] = i18n.t('multipleCriteria.defaultMinimizedCriterionName');
                this.dataModel.payoffNames[1] = i18n.t('multipleCriteria.defaultMaximizedCriterionName');
            }
            this.treeDesigner.config.payoffNames = this.dataModel.payoffNames;
        } else {
            this.payoffsMaximization[this.currentViewMode.payoffIndex] = currentRule.maximization;
            this.treeDesigner.config.payoffNames = [null, null];
        }
        if (!recompute) {
            return Promise.resolve();
        }

        return this.checkValidityAndRecomputeObjective(false, evalCode, evalNumeric).then(()=> {
            if (updateView) {
                this.updateView(false);
            }
        });

    }

    isMultipleCriteria() {
        return this.computationsManager.getCurrentRule().multiCriteria;
    }

    flipCriteria() {
        let tmp = this.config.format.payoff1;
        this.config.format.payoff1 = this.config.format.payoff2;
        this.config.format.payoff2 = tmp;
        this.initPayoffNumberFormat();

        this.computationsManager.flipCriteria().then(()=> {
            this.updateView(false);
        }).catch(e=> {
            log.error(e);
        })
    }


    getCurrentObjectiveRule() {
        return this.computationsManager.getCurrentRule();
    }

    getObjectiveRules() {
        return this.computationsManager.getObjectiveRules().filter(rule=>rule.multiCriteria === this.currentViewMode.multiCriteria);
    }


    initViewModes() {
        this.viewModes.push({
            name: "criterion1",
            multiCriteria: false,
            payoffIndex: 0,
        });

        this.viewModes.push({
            name: "criterion2",
            multiCriteria: false,
            payoffIndex: 1,
        });

        this.viewModes.push({
            name: "twoCriteria",
            multiCriteria: true,
            payoffIndex: null,
        });
        this.currentViewMode = this.viewModes[0];
    }

    getCurrentViewMode() {
        return this.currentViewMode;
    }

    setViewModeByName(name, recompute = true, updateView = true) {
        return this.setViewMode(Utils.find(this.viewModes, mode=>mode.name === name), recompute, updateView)
    }

    setViewMode(mode, recompute = true, updateView = true) {
        let prevMode = this.currentViewMode;
        this.currentViewMode = mode;

        this.computationsManager.objectiveRulesManager.setPayoffIndex(this.currentViewMode.payoffIndex);


        if (!recompute) {
            return Promise.resolve();
        }
        let rules = this.getObjectiveRules();
        let prevRule = this.computationsManager.getCurrentRule();
        let newRule = rules[0];


        if(this.currentViewMode.payoffIndex !== null){
            newRule = Utils.find(rules, r => r.maximization == this.payoffsMaximization[this.currentViewMode.payoffIndex])
        }else{
            newRule = Utils.find(rules, r => r.payoffCoeffs.map(c=>c>0).every((max, i)=> this.payoffsMaximization[i] === max))
        }

        this.setObjectiveRule(newRule.name, false, false, updateView, recompute)
    }

    setDefaultViewModeForRule(rule, recompute = true, updateView = true) {
        return this.setViewMode(Utils.find(this.viewModes, mode=>mode.multiCriteria === rule.multiCriteria), recompute, updateView)
    }

    getViewModes() {
        return this.viewModes;
    }

    showLeagueTable() {
        this.leagueTableDialog.open();
    }

    openSensitivityAnalysis() {
        let self = this;
        setTimeout(function(){
            if(!self.isSensitivityAnalysisAvailable()){
                return;
            }
            self.sensitivityAnalysisDialog.open();
        }, 200);

    }

    showTreePreview(dataDTO, closeCallback, autoLayout = true) {
        var self = this;
        this.originalDataModelSnapshot = this.dataModel.createStateSnapshot();
        this.dataModel.loadFromDTO(dataDTO, this.computationsManager.expressionEngine.getJsonReviver());
        this.computationsManager.updateDisplayValues(this.dataModel);
        this.updateView(false);
        setTimeout(function () {
            self.updateView(false);
            setTimeout(function () {
                var svgString = Exporter.getSVGString(self.treeDesigner.svg.node());
                AppUtils.showFullScreenPopup('', svgString, ()=> {
                    if (closeCallback) {
                        self.dataModel._setNewState(self.originalDataModelSnapshot);
                        self.updateView(false);

                        closeCallback();
                        setTimeout(function () {
                            self.updateView(false);
                        }, 1)
                    }
                });
            }, 300);
        }, 1)

    }

    showPolicyPreview(title, policy, closeCallback) {
        var self = this;
        this.originalDataModelSnapshot = this.dataModel.createStateSnapshot();
        this.computationsManager.displayPolicy(policy);
        this.updateView(false);
        AppUtils.showFullScreenPopup(title, '');
        LoadingIndicator.show();
        setTimeout(function () {
            self.updateView(false);
            setTimeout(function () {
                var svgString = Exporter.getSVGString(self.treeDesigner.svg.node(), true);
                LoadingIndicator.hide();
                AppUtils.showFullScreenPopup(title, svgString, ()=> {

                    self.dataModel._setNewState(self.originalDataModelSnapshot);

                    // self.computationsManager.updateDisplayValues(self.dataModel);
                    self.updateView(false);
                    if (closeCallback) {
                        closeCallback();
                    }
                    setTimeout(function () {
                        self.updateView(false);
                    }, 1)
                });
            }, 500);
        }, 1)
    }


    recompute(updateView = true, debounce = false, forceWhenAutoIsDisabled=true) {
        if (debounce) {
            if (!this.debouncedRecompute) {
                this.debouncedRecompute = Utils.debounce((updateView)=>this.recompute(updateView, false), 200);
            }
            this.debouncedRecompute(updateView);
            return;
        }

        return this.checkValidityAndRecomputeObjective(false, true, true, forceWhenAutoIsDisabled).then(()=> {
            if (updateView) {
                this.updateView();
            }
        });

    }

    onRawOptionChanged(){
        if(this.isAutoRecalculationEnabled()){
            return this.checkValidityAndRecomputeObjective(false, false).then(()=> {
                this.updateView();
            })
        }
    }

    isAutoRecalculationEnabled(){
        return !this.treeDesigner.config.raw;
    }

    checkValidityAndRecomputeObjective(allRules, evalCode = false, evalNumeric = true, forceWhenAutoIsDisabled=false) {
        if(!forceWhenAutoIsDisabled && !this.isAutoRecalculationEnabled()){
            return Promise.resolve();
        }

        return this.computationsManager.checkValidityAndRecomputeObjective(allRules, evalCode, evalNumeric).then(()=> {
            this.updateValidationMessages();
            AppUtils.dispatchEvent('SilverDecisionsRecomputedEvent', this);
        }).catch(e=> {
            log.error(e);
        });

    }

    updateValidationMessages() {
        var self = this;
        setTimeout(function () {
            self.treeDesigner.updateValidationMessages();
        }, 1);
    }

    newDiagram() {
        this.clear();
        this.updateView();
    }

    clear() {
        this.dataModel.clear();
        this.currentViewMode = this.viewModes[0];
        this.computationsManager.setCurrentRuleByName(this.computationsManager.getObjectiveRules()[0].name);
        this.setDiagramTitle('', true);
        this.setDiagramDescription('', true);
        this.treeDesigner.setConfig(Utils.deepExtend(this.getTreeDesignerInitialConfig()));
        this.onSelectionCleared();
        this.sensitivityAnalysisDialog.clear(true, true)

    }

    openDiagram(diagramData) {

        var self = this;
        var errors = [];

        if (Utils.isString(diagramData)) {
            try {
                diagramData = JSON.parse(diagramData, self.computationsManager.expressionEngine.getJsonReviver());
            } catch (e) {
                errors.push('error.jsonParse');
                alert(i18n.t('error.jsonParse'));
                log.error(e);
                return Promise.resolve(errors);
            }
        }

        var dataModelObject = diagramData.data;

        this.clear();
        if (!diagramData.SilverDecisions) {
            errors.push('error.notSilverDecisionsFile');
            alert(i18n.t('error.notSilverDecisionsFile'));
            return Promise.resolve(errors);
        }

        if (!Utils.isValidVersionString(diagramData.SilverDecisions)) {
            errors.push('error.incorrectVersionFormat');
            alert(i18n.t('error.incorrectVersionFormat'));
        } else {
            //Check if version in file is newer than version of application
            if (Utils.compareVersionNumbers(diagramData.SilverDecisions, App.version) > 0) {
                errors.push('error.fileVersionNewerThanApplicationVersion');
                alert(i18n.t('error.fileVersionNewerThanApplicationVersion'));
            }

            if (Utils.compareVersionNumbers(diagramData.SilverDecisions, "0.7.0") < 0) {
                dataModelObject = {
                    code: diagramData.code,
                    expressionScope: diagramData.expressionScope,
                    trees: diagramData.trees,
                    texts: diagramData.texts
                }
            }
        }

        try {
            if (diagramData.lng) {
                this.config.lng = diagramData.lng;
            }

            if (diagramData.rule) {
                if (this.computationsManager.isRuleName(diagramData.rule)) {
                    this.config.rule = diagramData.rule;
                } else {
                    delete this.config.rule;
                }
            }

            if (diagramData.viewMode) {
                this.setViewModeByName(diagramData.viewMode)
            } else {
                this.setDefaultViewModeForRule(this.computationsManager.getObjectiveRuleByName(this.config.rule), false, false);
            }

            if (diagramData.format) {
                this.config.format = diagramData.format;
            }

            this.setConfig(this.config);
            this.dataModel.load(dataModelObject);

            if (diagramData.treeDesigner) {
                this.treeDesigner.setConfig(Utils.deepExtend(self.getTreeDesignerInitialConfig(), diagramData.treeDesigner));
            }
            this.treeDesigner.updateVisibility();

            this.setDiagramTitle(diagramData.title || '', true);
            this.setDiagramDescription(diagramData.description || '', true);

            if (diagramData.sensitivityAnalysis) {
                this.sensitivityAnalysisDialog.loadSavedParamValues(diagramData.sensitivityAnalysis);
            }

        } catch (e) {
            errors.push('error.malformedData');
            alert(i18n.t('error.malformedData'));
            this.clear();
            log.error('malformedData', e);
            return Promise.resolve(errors);

        }
        try {
            this.updateNumberFormats(false);
        } catch (e) {
            log.error('incorrectNumberFormatOptions', e);
            errors.push('error.incorrectNumberFormatOptions');
            alert(i18n.t('error.incorrectNumberFormatOptions'));
            delete this.config.format;
            this.setConfig(this.config);
            this.updateNumberFormats(false);
        }
        return this.setObjectiveRule(this.config.rule, false, true, false).catch(e=> {
            log.error('diagramDrawingFailure', e);
            errors.push('error.diagramDrawingFailure');
            alert(i18n.t('error.diagramDrawingFailure'));
            this.clear();
            return errors
        }).then(()=> {
            this.updateView(false);
            return errors;
        }).catch(e=> {
            log.error('diagramDrawingFailure', e);
            errors.push('error.diagramDrawingFailure');
            alert(i18n.t('error.diagramDrawingFailure'));
            this.clear();
            this.updateView(false);
            return errors
        });
    }

    serialize(filterLocation = false, filterComputed = false, filterPrivate = true) {
        var self = this;
        return self.checkValidityAndRecomputeObjective(true, false, false, true).then(()=> {
            var obj = {
                SilverDecisions: App.version,
                buildTimestamp: App.buildTimestamp,
                savetime: d3.isoFormat(new Date()),
                lng: self.config.lng,
                viewMode: self.currentViewMode.name,
                rule: self.computationsManager.getCurrentRule().name,
                title: self.config.title,
                description: self.config.description,
                format: self.config.format,
                treeDesigner: self.treeDesigner.config,
                data: self.dataModel.serialize(false),
                sensitivityAnalysis: this.sensitivityAnalysisDialog.jobNameToParamValues
            };

            return Utils.stringify(obj, self.dataModel.getJsonReplacer(filterLocation, filterComputed, self.computationsManager.expressionEngine.getJsonReplacer(), filterPrivate), filterPrivate ? ['$'] : []);
        });
    }

    saveToFile(filterLocation = false, filterComputed = false, filterPrivate = true){
        this.serialize(filterLocation, filterComputed, filterPrivate).then((json)=>{
            AppUtils.dispatchEvent('SilverDecisionsSaveEvent', json);
            if(this.config.jsonFileDownload){
                var blob = new Blob([json], {type: "application/json"});
                Exporter.saveAs(blob, Exporter.getExportFileName('json'));
            }
        });
    }

    updateNumberFormats(updateView = true) {
        this.initPayoffNumberFormat();
        this.initProbabilityNumberFormat();
        if (updateView) {
            this.updateView();
        }
    }

    updatePayoffNumberFormat(updateView = true) {
        this.initPayoffNumberFormat();
        if (updateView) {
            this.updateView();
        }

    }

    updateProbabilityNumberFormat(updateView = true) {
        this.initProbabilityNumberFormat();
        if (updateView) {
            this.updateView();
        }
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
        var prevValue = Utils.get(this.config, path);

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
        Utils.set(this.config, path, value);
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
            let srcElement = d3.event.target || d3.event.srcElement;

            if (srcElement && ['INPUT', 'TEXTAREA'].indexOf(srcElement.nodeName.toUpperCase()) > -1) { //ignore events from input and textarea elements
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
                if (this.selectedObject instanceof model.domain.Node) {
                    let selectedNode = this.selectedObject;
                    if (selectedNode instanceof model.domain.TerminalNode) {
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
                } else if (this.selectedObject instanceof model.domain.Edge) {
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
                    if (selectedNode instanceof model.domain.TerminalNode) {
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
