import * as d3 from "./d3";
import {i18n} from "./i18n/i18n";
import {Utils} from "sd-utils";
import {AppUtils} from "./app-utils";
import {domain as model} from "sd-model";
import {PayoffInputValidator} from "./validation/payoff-input-validator";
import {ProbabilityInputValidator} from "./validation/probability-input-validator";
import {Templates} from "./templates";
import {Tooltip} from "sd-tree-designer";
import {InputField} from "./form/input-field";
import {PathValueAccessor} from "./form/path-value-accessor";
import {NumberInputValidator} from "./validation/number-input-validator";
import {RequiredInputValidator} from "./validation/required-input-validator";
import {McdmWeightValueValidator} from "sd-computations/src/validation/mcdm-weight-value-validator";

export class Sidebar {

    app;
    container;
    dispatch = d3.dispatch("recomputed", "object-updated", "multi-criteria-updated");


    constructor(container, app) {
        this.app = app;
        this.container = container;

        this.initLayoutOptions();
        this.initDiagramDetails();
        this.initDefinitions();
        this.initMultipleCriteria();
        var self = this;

        document.addEventListener('SilverDecisionsRecomputedEvent', function (data) {
            if (data.detail === app) {
                self.dispatch.call("recomputed");
            }
        });

        self.dispatch.on("object-updated", Utils.debounce((object, fieldName)=> self.app.onObjectUpdated(object, fieldName), 350));
        self.dispatch.on("multi-criteria-updated", Utils.debounce((fieldName)=> self.app.onMultiCriteriaUpdated(fieldName), 350));

    }

    initLayoutOptions() {
        var self = this;
        this.layoutOptionsContainer = this.container.select('#layout-options');
        this.autoLayoutOptionsGroup = this.layoutOptionsContainer.select('#auto-layout-options');
        this.gridWidth = this.layoutOptionsContainer.select('input#grid-width').on('change', function () {
            self.app.treeDesigner.layout.setGridWidth(parseInt(this.value));

        });

        this.gridHeight = this.layoutOptionsContainer.select('input#grid-height').on('change', function () {
            self.app.treeDesigner.layout.setGridHeight(parseInt(this.value));
        });

        this.nodeSize = this.layoutOptionsContainer.select('input#node-size').on('change', function () {
            self.app.treeDesigner.layout.setNodeSize(parseInt(this.value));
        });

        this.edgeSlantWidthMax = this.layoutOptionsContainer.select('input#edge-slant-width-max').on('change', function () {
            self.app.treeDesigner.layout.setEdgeSlantWidthMax(parseInt(this.value));
        });

        this.marginHorizontal = this.layoutOptionsContainer.select('input#margin-horizontal').on('change', function () {
            var m = {};
            m.left = m.right = parseInt(this.value);
            self.app.treeDesigner.setMargin(m);
        });
        this.marginVertical = this.layoutOptionsContainer.select('input#margin-vertical').on('change', function () {
            var m = {};
            m.top = m.bottom = parseInt(this.value);
            self.app.treeDesigner.setMargin(m);
        });

        self.app.treeDesigner.layout.onAutoLayoutChanged.push((layout)=>self.updateLayoutOptions());

        this.layoutOptionsContainer.select('.toggle-button').on('click', () => {
            this.layoutOptionsContainer.classed('sd-extended', !this.layoutOptionsContainer.classed('sd-extended'));
        });

        this.updateLayoutOptions();
    }

    updateLayoutOptions() {
        this.nodeSize.node().value = this.app.treeDesigner.config.layout.nodeSize;
        this.edgeSlantWidthMax.node().value = this.app.treeDesigner.config.layout.edgeSlantWidthMax;
        this.marginHorizontal.node().value = this.app.treeDesigner.config.margin.left;
        this.marginVertical.node().value = this.app.treeDesigner.config.margin.top;
        this.gridWidth.node().value = this.app.treeDesigner.config.layout.gridWidth;
        this.gridHeight.node().value = this.app.treeDesigner.config.layout.gridHeight;
        this.autoLayoutOptionsGroup.classed('visible', !this.app.treeDesigner.layout.isManualLayout());
    }

    initDiagramDetails() {
        var self = this;
        this.diagramDetailsContainer = this.container.select('#diagram-details-box');
        this.diagramDetailsContainer.classed('sd-hidden', !this.app.config.showDetails);

        this.diagramDetailsContainer.select('.toggle-button').on('click', () => {
            this.diagramDetailsContainer.classed('sd-extended', !this.diagramDetailsContainer.classed('sd-extended'));
            this.updateDiagramDetails();
        });

        this.diagramTitle = this.diagramDetailsContainer.select('input#diagram-title').on('change', function () {
            self.app.setDiagramTitle(this.value);
            AppUtils.updateInputClass(d3.select(this));
        });

        this.diagramDescription = this.diagramDetailsContainer.select('textarea#diagram-description').on('change', function () {
            self.app.setDiagramDescription(this.value);
            AppUtils.updateInputClass(d3.select(this));
        });
        AppUtils.elasticTextarea(this.diagramDescription);

        this.updateDiagramDetails();
    }

    initDefinitions() {
        var self = this;
        this.definitionsContainer = this.container.select('#sd-sidebar-definitions');
        this.definitionsContainer.classed('sd-hidden', !this.app.config.showDefinitions);
        this.onDefinitionsCodeChanged = null;
        this.definitionsContainer.select('.toggle-button').on('click', () => {
            this.definitionsContainer.classed('sd-extended', !this.definitionsContainer.classed('sd-extended'));
            AppUtils.updateInputClass(this.definitionsCode);
            AppUtils.autoResizeTextarea(this.definitionsCode.node())
        });

        this.definitionsScopeLabel = this.definitionsContainer.select('.sd-variables-scope-value');

        this.definitionsCode = this.definitionsContainer.select('textarea#sd-sidebar-definitions-code').on('change', function () {
            if (self.onDefinitionsCodeChanged) {
                self.onDefinitionsCodeChanged(this.value)
            }
            AppUtils.updateInputClass(d3.select(this));
        });
        Tooltip.attach(this.definitionsCode, (d)=>{
            return self.definitionsCode.attr('data-error-msg');

        }, 15, 50);


        this.definitionsEvaluatedValuesContainer = this.container.select("#sd-sidebar-definitions-evaluated-values");

        this.definitionsContainer.select('#sd-sidebar-definitions-open-dialog-button').on('click', () => {
            this.app.openDefinitionsDialog();
        });

        this.definitionsContainer.select('#sd-sidebar-definitions-recalculate-button').on('click', () => {
            this.app.recompute();
        });

        AppUtils.elasticTextarea(this.definitionsCode);
    }

    initMultipleCriteria() {
        var self = this;
        this.multipleCriteriaContainer = this.container.select('#sd-multiple-criteria');
        this.multipleCriteriaContainer.classed('sd-hidden', !this.app.isMultipleCriteria());

        this.multipleCriteriaContainer.select('.toggle-button').on('click', () => {
            this.multipleCriteriaContainer.classed('sd-extended', !this.multipleCriteriaContainer.classed('sd-extended'));
        });


        this.showLeagueTableButton = this.multipleCriteriaContainer.select('#sd-show-league-table-button').on('click', () => {
            this.app.showLeagueTable();
        });

        this.flipCriteriaButton = this.multipleCriteriaContainer.select('#sd-flip-criteria-button').on('click', () => {
            this.app.flipCriteria();
        });

         let weightParser = (w) => {
             return parseFloat(w) === Infinity ? Infinity : w;
        };



        this.multipleCriteriaFields = [];
        this.multipleCriteriaFields.push(new InputField('sd-multiple-criteria-nameOfCriterion1', 'nameOfCriterion1', 'text', i18n.t('multipleCriteria.nameOfCriterion1'), new PathValueAccessor(self.app.dataModel, 'payoffNames[0]'), new RequiredInputValidator()));
        this.multipleCriteriaFields.push(new InputField('sd-multiple-criteria-nameOfCriterion2', 'nameOfCriterion2', 'text', i18n.t('multipleCriteria.nameOfCriterion2'), new PathValueAccessor(self.app.dataModel, 'payoffNames[1]'), new RequiredInputValidator()));
        let lowerBoundValueAccessor = new PathValueAccessor(self.app.dataModel, 'weightLowerBound');
        let upperBoundValueAccessor = new PathValueAccessor(self.app.dataModel, 'weightUpperBound');
        let weightValueValidator = new McdmWeightValueValidator();
        var ee = this.app.expressionEngine.constructor;

        this.multipleCriteriaFields.push(new InputField('sd-multiple-criteria-weightLowerBound', 'weightLowerBound', 'text', i18n.t('multipleCriteria.weightLowerBound'), lowerBoundValueAccessor,
            new McdmWeightValueValidator(v => {
                let upper = upperBoundValueAccessor.get();
                return weightValueValidator.validate(upper) ? ee.compare(v, upper) <= 0 : true
            }), null, weightParser));

        this.multipleCriteriaFields.push(new InputField('sd-multiple-criteria-defaultCriterion1Weight', 'defaultCriterion1Weight', 'text', i18n.t('multipleCriteria.defaultCriterion1Weight'),
            new PathValueAccessor(self.app.dataModel, 'defaultCriterion1Weight'),
            new McdmWeightValueValidator(v => {
                let upper = upperBoundValueAccessor.get();
                let lower = lowerBoundValueAccessor.get();
                return (weightValueValidator.validate(lower) ? ee.compare(v, lower) >= 0 : true) && (weightValueValidator.validate(upper) ? ee.compare(v, upper) <= 0 : true)
            }), null, weightParser));

        this.multipleCriteriaFields.push(new InputField('sd-multiple-criteria-weightUpperBound', 'weightUpperBound', 'text', i18n.t('multipleCriteria.weightUpperBound'), upperBoundValueAccessor,
            new McdmWeightValueValidator(v => {
                let lower = lowerBoundValueAccessor.get();
                return weightValueValidator.validate(lower) ? ee.compare(v, lower) >= 0 : true
            }), null, weightParser));

        this.updateMultipleCriteria();
    }


    updateMultipleCriteria(updateInputs = true){ //TODO refactor
        var ee = this.app.expressionEngine;

        var self = this;
        var temp = {};
        this.multipleCriteriaContainer.classed('sd-hidden', !this.app.isMultipleCriteria());

        let leagueTableAvailable = this.app.isLeagueTableAvailable();
        this.showLeagueTableButton.attr("disabled", leagueTableAvailable ? undefined : "disabled");
        this.flipCriteriaButton.attr("disabled", leagueTableAvailable ? undefined : "disabled");
        this.multipleCriteriaContainer.classed('sd-invalid-league-table-params', !leagueTableAvailable);

        if(!updateInputs){
            return;
        }

        var inputGroups = this.multipleCriteriaContainer.select(".sd-multiple-criteria-properties").selectAll('div.input-group').data(this.multipleCriteriaFields);
        inputGroups.exit().remove();
        var inputGroupsEnter = inputGroups.enter().appendSelector('div.input-group').html(d=>d.type=='select'? Templates.get('selectInputGroup', d):Templates.get('inputGroup', d));
        inputGroupsEnter.merge(inputGroups).select('.sd-input').on('change input', function (d, i) {
            var prevValue = d.getValue();

            var isValid = !d.validator || d.validator.validate(this.value);

            let selection = d3.select(this);
            selection.classed('invalid', !isValid);
            if(d.styleClass){
                selection.classed(d.styleClass, true);
            }

            if (d3.event.type == 'change' && temp[i].pristineVal != this.value) {
                self.app.dataModel.saveStateFromSnapshot(temp[i].pristineStateSnapshot);
                if (d.onChange) {
                    d.onChange(object, this.value, temp[i].pristineVal);
                }
            }

            if((prevValue+"")==this.value){
                return;
            }

            AppUtils.updateInputClass(selection);
            d.setValue(d.parse(this.value));
            self.dispatch.call("multi-criteria-updated", self, d.name);

        })
            .on('focus', function(d,i){
                temp[i].pristineVal = this.value;

                temp[i].pristineStateSnapshot = self.app.dataModel.createStateSnapshot();
            })
            .each(function (d, i) {
                let value = d.getValue();

                this.value = value;
                temp[i] = {};
                d3.select(this).classed('invalid', d.validator && !d.validator.validate(this.value));

                AppUtils.updateInputClass(d3.select(this));
                if (d.type == 'textarea') {
                    AppUtils.elasticTextarea(d3.select(this));
                    AppUtils.autoResizeTextarea(d3.select(this).node())
                }

            });
    }

    updateDefinitions(definitionsSourceObject, readOnly, changeCallback) {
        this.definitionsContainer.classed('sd-read-only', readOnly);
        this.onDefinitionsCodeChanged = changeCallback;


        let scopeType = 'global';
        if (definitionsSourceObject instanceof model.Node) {
            scopeType = 'node'
        }

        this.definitionsScopeLabel.text(i18n.t("sidebarDefinitions.scope."+scopeType));

        this.definitionsCode.node().value = definitionsSourceObject.code;
        this.definitionsCode.classed('invalid', !!definitionsSourceObject.$codeError);
        this.definitionsCode.attr('data-error-msg', definitionsSourceObject.$codeError);
        var html = Templates.get('evaluatedVariables', {scopeVariables: Utils.getVariablesAsList(definitionsSourceObject.expressionScope)});
        this.definitionsEvaluatedValuesContainer.html(html);
        AppUtils.updateInputClass(this.definitionsCode);
        AppUtils.autoResizeTextarea(this.definitionsCode.node())
    }

    updateDiagramDetails() {
        this.diagramTitle.node().value = this.app.config.title;
        AppUtils.updateInputClass(this.diagramTitle);
        this.diagramDescription.node().value = this.app.config.description;
        AppUtils.updateInputClass(this.diagramDescription);
        AppUtils.autoResizeTextarea(this.diagramDescription.node())
    }

    displayObjectProperties(object) {
        this.updateObjectPropertiesView(object);
    }

    hideObjectProperties() {

        this.container.select('#object-properties').classed('visible', false);
        this.container.selectAll('div.child-object').remove();

    }

    updateObjectPropertiesView(object) {
        this.dispatch.on(".recomputed", null); //remove all callbacks for recomputed event
        if (!object) {
            this.hideObjectProperties();
            return;
        }

        var objectProps = this.objectProps = this.container.select('#object-properties').classed('visible', true);
        var headerText = Sidebar.getHeaderTextForObject(object);
        objectProps.select('.header').html(headerText);

        var fieldList = this.getFieldListForObject(object);
        this.updateObjectFields(object, fieldList, objectProps.select('.content .main-properties'));


        this.updateObjectChildrenProperties(object);

    }

    updateObjectChildrenProperties(object) {
        var self = this;
        var childObjects = this.getChildObjectList(object);
        var objectType = Sidebar.getObjectType(object);

        var childPropsSelector = this.objectProps.select('.content .children-properties');

        childPropsSelector.classed('visible', childObjects.length);

        childPropsSelector.select('.children-properties-header').text(i18n.t('objectProperties.childrenProperties.' + objectType + '.header'));
        var childrenContent = childPropsSelector.select('.children-properties-content');
        var children = childrenContent.selectAll('div.child-object').data(childObjects, (d, i)=> d.$id || i);
        var childrenEnter = children.enter().appendSelector('div.child-object');
        var childrenMerge = childrenEnter.merge(children);

        childrenMerge.each(updateChildObjectProperties);

        children.exit().remove();

        function updateChildObjectProperties(child, i) {
            var container = d3.select(this);
            container.selectOrAppend('div.child-header').text(i18n.t('objectProperties.childrenProperties.' + objectType + '.child.header', {number: i + 1}));

            var fieldList = self.getFieldListForObject(child);
            self.updateObjectFields(child, fieldList, container.selectOrAppend('div.field-list'))
        }
    }

    static getObjectType(object) {
        if (object instanceof model.Node) {
            return 'node';
        }
        if (object instanceof model.Edge) {
            return 'edge';
        }
        if (object instanceof model.Text) {
            return 'text';
        }
        return '';
    }

    static getHeaderTextForObject(object) {
        if (object instanceof model.Node) {
            return i18n.t('objectProperties.header.node.' + object.type);
        }
        if (object instanceof model.Edge) {
            return i18n.t('objectProperties.header.edge');
        }
        if (object instanceof model.Text) {
            return i18n.t('objectProperties.header.text');
        }
        return '';
    }

    getChildObjectList(object) {
        if (object instanceof model.Node) {
            return object.childEdges.sort((a, b)=>a.childNode.location.y - b.childNode.location.y);
        }
        if (object instanceof model.Edge) {
            return [];
        }
        return [];
    }

    getFieldListForObject(object) {
        var self = this;

        if (object instanceof model.Node) {
            return [
                new ObjectInputField(object, {
                    name: 'name',
                    type: 'textarea'
                })
            ]
        }
        if (object instanceof model.Edge) {
            let multipleCriteria = this.app.isMultipleCriteria();
            var list = [
                new ObjectInputField(object, {
                    name: 'name',
                    type: 'textarea'
                }),
                new ObjectInputField(object, {
                    name: 'payoff',
                    path: 'payoff[' + (self.app.currentViewMode.payoffIndex || 0) + ']',
                    label: multipleCriteria ? self.app.dataModel.payoffNames[0] : undefined,
                    type: 'text',
                    validator: new PayoffInputValidator(self.app.expressionEngine)
                })


            ];

            if(multipleCriteria) {
                list.push(new ObjectInputField(object, {
                    name: 'payoff2',
                    path: 'payoff[1]',
                    label: self.app.dataModel.payoffNames[1],
                    type: 'text',
                    validator: new PayoffInputValidator(self.app.expressionEngine)
                }));
            }

            if (object.parentNode instanceof model.ChanceNode) {
                list.push(new ObjectInputField(object, {
                    name: 'probability',
                    type: 'text',
                    validator: new ProbabilityInputValidator(self.app.expressionEngine)
                }))
            }
            return list;

        }
        if (object instanceof model.Text) {
            return [new ObjectInputField(object, {
                name: 'value',
                type: 'textarea'
            })]
        }

        return [];
    }

    updateObjectFields(object, fieldList, container) {
        var self = this;

        var fields = container.selectAll('div.object-field').data(fieldList);
        var temp = {};
        var fieldsEnter = fields.enter().appendSelector('div.object-field');
        var fieldsMerge = fieldsEnter.merge(fields);

        fieldsMerge.each(function (d, i) {
            var fieldSelection = d3.select(this);
            fieldSelection.html("");

            var input;
            if (d.type == 'textarea') {
                input = fieldSelection.append('textarea').attr('rows', 1);
            } else {
                input = fieldSelection.append('input');
            }
            input.classed('sd-input', true);

            fieldSelection.appendSelector('span.bar');
            fieldSelection.append('label');
            fieldSelection.classed('input-group', true);
        });

        fieldsMerge.select('label')
            .attr('for', d=>d.id)
            .html(d=>d.label);
        fieldsMerge.select('.sd-input')
            .attr('type', d=>d.type == 'textarea' ? undefined : d.type)
            .attr('name', d=>d.name)
            .attr('id', d=>d.id)
            .on('change keyup', function (d, i) {
                var prevValue = d.getValue();
                var isValid = !d.validator || d.validator.validate(this.value, object, d.path);
                object.setSyntaxValidity(d.path, isValid);

                d3.select(this).classed('invalid', !object.isFieldValid(d.path));

                if (d3.event.type == 'change' && temp[i].pristineVal != this.value) {
                    self.app.dataModel.saveStateFromSnapshot(temp[i].pristineStateSnapshot);
                    if (d.onChange) {
                        d.onChange(object, this.value, temp[i].pristineVal);
                    }
                }

                if((prevValue+"")==this.value){
                    return;
                }

                AppUtils.updateInputClass(d3.select(this));
                if (d.customOnInput) {
                    d.customOnInput(object, this.value, temp[i].pristineVal)
                } else {
                    d.setValue(this.value);
                    self.dispatch.call("object-updated", self, object, d.path);
                }
            })
            .on('focus', function(d,i){
                temp[i].pristineVal = this.value;
                temp[i].pristineStateSnapshot = self.app.dataModel.createStateSnapshot();
            })
            .each(function (d, i) {
                this.value = d.getValue();
                temp[i] = {};
                if (d.validator && !d.validator.validate(this.value, object, d.path)) {
                    d3.select(this).classed('invalid', true);
                    object.setSyntaxValidity(d.path, false);
                }else{
                    object.setSyntaxValidity(d.path, true);
                }

                var _this = this;
                var checkFieldStatus = () => {
                    d3.select(_this).classed('invalid', !object.isFieldValid(d.path));
                };
                checkFieldStatus();

                self.dispatch.on("recomputed."+object.$id+"."+d.path, checkFieldStatus);

                AppUtils.updateInputClass(d3.select(this));
                if (d.type == 'textarea') {
                    AppUtils.elasticTextarea(d3.select(this));
                    AppUtils.autoResizeTextarea(d3.select(this).node())
                }

            });

        fields.exit().remove();
    }
}

class ObjectInputField extends InputField{
    //config object with fields: name, path, type, validator, options
    constructor(object, config) {
        super('object-' + object.$id + '-field-' + config.name, config.name, config.type, config.label ? config.label : i18n.t(Sidebar.getObjectType(object) + '.' + config.name),
            new PathValueAccessor(object, config.path || config.name), config.validator, config.options);
        this.path = config.path || config.name;
        this.onChange = config.onChange;
    }
}

