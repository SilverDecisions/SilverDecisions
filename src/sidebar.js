import * as d3 from './d3'
import {i18n} from './i18n/i18n'

import {Utils} from './utils'
import * as model from './model/index'
import {PayoffInputValidator} from './validation/payoff-input-validator'
import {ProbabilityInputValidator} from './validation/probability-input-validator'
import {ExpressionEngine} from './expression-engine'
import {Templates} from "./templates";
import {Tooltip} from "./tooltip";
import * as _ from "lodash";


export class Sidebar {

    app;
    container;
    dispatch = d3.dispatch("recomputed", "object-updated");


    constructor(container, app) {
        this.app = app;
        this.container = container;

        this.initLayoutOptions();
        this.initDiagramDetails();
        this.initDefinitions();
        var self = this;

        document.addEventListener('SilverDecisionsRecomputedEvent', function (data) {
            if (data.detail === app) {
                self.dispatch.call("recomputed");
            }
        });

        self.dispatch.on("object-updated", _.debounce((object, fieldName)=> self.app.onObjectUpdated(object, fieldName), 350));

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
            Utils.updateInputClass(d3.select(this));
        });

        this.diagramDescription = this.diagramDetailsContainer.select('textarea#diagram-description').on('change', function () {
            self.app.setDiagramDescription(this.value);
            Utils.updateInputClass(d3.select(this));
        });
        Utils.elasticTextarea(this.diagramDescription);

        this.updateDiagramDetails();
    }

    initDefinitions() {
        var self = this;
        this.definitionsContainer = this.container.select('#sd-sidebar-definitions');
        this.definitionsContainer.classed('sd-hidden', !this.app.config.showDefinitions);
        this.onDefinitionsCodeChanged = null;
        this.definitionsContainer.select('.toggle-button').on('click', () => {
            this.definitionsContainer.classed('sd-extended', !this.definitionsContainer.classed('sd-extended'));
            Utils.updateInputClass(this.definitionsCode);
            Utils.autoResizeTextarea(this.definitionsCode.node())
        });

        this.definitionsCode = this.definitionsContainer.select('textarea#sd-sidebar-definitions-code').on('change', function () {
            if (self.onDefinitionsCodeChanged) {
                self.onDefinitionsCodeChanged(this.value)
            }
            Utils.updateInputClass(d3.select(this));
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

        Utils.elasticTextarea(this.definitionsCode);
    }

    updateDefinitions(definitionsSourceObject, readOnly, changeCallback) {
        this.definitionsContainer.classed('sd-read-only', readOnly);
        this.onDefinitionsCodeChanged = changeCallback;
        this.definitionsCode.node().value = definitionsSourceObject.code;
        this.definitionsCode.classed('invalid', !!definitionsSourceObject.$codeError);
        this.definitionsCode.attr('data-error-msg', definitionsSourceObject.$codeError);
        var html = Templates.get('evaluatedVariables', {scopeVariables: Utils.getVariablesAsList(definitionsSourceObject.expressionScope)});
        this.definitionsEvaluatedValuesContainer.html(html);
        Utils.updateInputClass(this.definitionsCode);
        Utils.autoResizeTextarea(this.definitionsCode.node())
    }

    updateDiagramDetails() {
        this.diagramTitle.node().value = this.app.config.title;
        Utils.updateInputClass(this.diagramTitle);
        this.diagramDescription.node().value = this.app.config.description;
        Utils.updateInputClass(this.diagramDescription);
        Utils.autoResizeTextarea(this.diagramDescription.node())
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
            return [{
                name: 'name',
                type: 'textarea'
            },
                /* {
                 name: 'code',
                 type: 'textarea',
                 onChange: (object, newVal, oldVal)=> object.$codeDirty = true,
                 customOnInput: (object, newVal, oldVal)=> object.code = newVal
                 }*/
            ]
        }
        if (object instanceof model.Edge) {
            var list = [
                {
                    name: 'name',
                    type: 'textarea'
                },
                {
                    name: 'payoff',
                    type: 'text',
                    validator: new PayoffInputValidator(self.app.expressionEngine)
                }
            ];
            if (object.parentNode instanceof model.ChanceNode) {
                list.push({
                    name: 'probability',
                    type: 'text',
                    validator: new ProbabilityInputValidator(self.app.expressionEngine)
                })
            }
            return list;

        }
        if (object instanceof model.Text) {
            return [{
                name: 'value',
                type: 'textarea'
            }]
        }

        return [];
    }

    updateObjectFields(object, fieldList, container) {
        var self = this;


        var objectType = object instanceof model.Node ? 'node' : object instanceof model.Edge ? 'edge' : 'text';
        var getFieldId = d=>'object-' + object.$id + '-field-' + d.name;

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
            .attr('for', getFieldId)
            .html(d=>i18n.t(objectType + '.' + d.name));
        fieldsMerge.select('.sd-input')
            .attr('type', d=>d.type == 'textarea' ? undefined : d.type)
            .attr('name', d=>d.name)
            .attr('id', getFieldId)
            .on('change keyup', function (d, i) {
                var prevValue = object[d.name];
                var isValid = !d.validator || d.validator.validate(this.value, object, d.name);
                // console.log(d.name, this.value, isValid);
                object.setSyntaxValidity(d.name, isValid);

                d3.select(this).classed('invalid', !object.isFieldValid(d.name));

                if (d3.event.type == 'change' && temp[i].pristineVal != this.value) {
                    // object[d.name] = temp[i].pristineVal;
                    self.app.dataModel.saveStateFromSnapshot(temp[i].pristineStateSnapshot);
                    if (d.onChange) {
                        d.onChange(object, this.value, temp[i].pristineVal);
                    }
                }

                if((prevValue+"")==this.value){
                    return;
                }

                Utils.updateInputClass(d3.select(this));
                if (d.customOnInput) {
                    d.customOnInput(object, this.value, temp[i].pristineVal)
                } else {
                    object[d.name] = this.value;
                    self.dispatch.call("object-updated", self, object, d.name);
                }
            })
            .on('focus', function(d,i){
                temp[i].pristineVal = this.value;
                temp[i].pristineStateSnapshot = self.app.dataModel.createStateSnapshot();
            })
            .each(function (d, i) {
                this.value = object[d.name];
                temp[i] = {};
                if (d.validator && !d.validator.validate(this.value, object, d.name)) {
                    d3.select(this).classed('invalid', true);
                    object.setSyntaxValidity(d.name, false);
                }else{
                    object.setSyntaxValidity(d.name, true);
                }

                var _this = this;
                var checkFieldStatus = () => {
                    d3.select(_this).classed('invalid', !object.isFieldValid(d.name));
                };
                checkFieldStatus();

                self.dispatch.on("recomputed."+object.$id+"."+d.name, checkFieldStatus);

                Utils.updateInputClass(d3.select(this));
                if (d.type == 'textarea') {
                    Utils.elasticTextarea(d3.select(this));
                    Utils.autoResizeTextarea(d3.select(this).node())
                }

            });

        fields.exit().remove();
    }
}
