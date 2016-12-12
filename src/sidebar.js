import * as d3 from './d3'
import {i18n} from './i18n/i18n'

import {Utils} from './utils'
import * as model from './model/index'
import {PayoffValidator} from './validation/payoff-validator'
import {ProbabilityValidator} from './validation/probability-validator'

export class Sidebar{

    app;
    container;

    constructor(container, app){
        this.app = app;
        this.container = container;

        this.initLayoutOptions();
        this.initDiagramDetails();
    }

    initLayoutOptions(){
        var self = this;
        this.layoutOptionsContainer = this.container.select('#layout-options');
        this.autoLayoutOptionsGroup = this.layoutOptionsContainer.select('#auto-layout-options');
        this.gridWidth = this.layoutOptionsContainer.select('input#grid-width').on('change', function(){
            self.app.treeDesigner.layout.setGridWidth(parseInt(this.value));

        });

        this.gridHeight = this.layoutOptionsContainer.select('input#grid-height').on('change', function(){
            self.app.treeDesigner.layout.setGridHeight(parseInt(this.value));
        });

        this.nodeSize = this.layoutOptionsContainer.select('input#node-size').on('change', function(){
            self.app.treeDesigner.layout.setNodeSize(parseInt(this.value));
        });

        this.edgeSlantWidthMax = this.layoutOptionsContainer.select('input#edge-slant-width-max').on('change', function(){
            self.app.treeDesigner.layout.setEdgeSlantWidthMax(parseInt(this.value));
        });

        this.marginHorizontal = this.layoutOptionsContainer.select('input#margin-horizontal').on('change', function(){
            var m = {};
            m.left=m.right = parseInt(this.value);
            self.app.treeDesigner.setMargin(m);
        });
        this.marginVertical = this.layoutOptionsContainer.select('input#margin-vertical').on('change', function(){
            var m = {};
            m.top=m.bottom = parseInt(this.value);
            self.app.treeDesigner.setMargin(m);
        });

        self.app.treeDesigner.layout.onAutoLayoutChanged.push((layout)=>self.updateLayoutOptions());

        this.layoutOptionsContainer.select('.toggle-button').on('click', () => {
            this.layoutOptionsContainer.classed('sd-extended', !this.layoutOptionsContainer.classed('sd-extended'));
        });

        this.updateLayoutOptions();
    }

    updateLayoutOptions(){
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

        this.diagramTitle = this.diagramDetailsContainer.select('input#diagram-title').on('change', function(){
            self.app.setDiagramTitle(this.value);
            Utils.updateInputClass(d3.select(this));
        });

        this.diagramDescription = this.diagramDetailsContainer.select('textarea#diagram-description').on('change', function(){
            self.app.setDiagramDescription(this.value);
            Utils.updateInputClass(d3.select(this));
        });
        Utils.elasticTextarea(this.diagramDescription);

        this.updateDiagramDetails();
    }

    updateDiagramDetails(){
        this.diagramTitle.node().value = this.app.config.title;
        Utils.updateInputClass(this.diagramTitle);
        this.diagramDescription.node().value = this.app.config.description;
        Utils.updateInputClass(this.diagramDescription);
        Utils.autoResizeTextarea(this.diagramDescription.node())
    }

    displayObjectProperties(object){
        this.updateObjectPropertiesView(object);
    }
    hideObjectProperties(){

        this.container.select('#object-properties').classed('visible', false);
        this.container.selectAll('div.child-object').remove();

    }

    updateObjectPropertiesView(object){
        if(!object){
            this.hideObjectProperties();
            return;
        }

        var objectProps= this.objectProps = this.container.select('#object-properties').classed('visible', true);
        var headerText = Sidebar.getHeaderTextForObject(object);
        objectProps.select('.header').html(headerText);

        var fieldList = this.getFieldListForObject(object);
        this.updateObjectFields(object, fieldList, objectProps.select('.content .main-properties'));


        this.updateObjectChildrenProperties(object);

    }

    updateObjectChildrenProperties(object){
        var self = this;
        var childObjects = this.getChildObjectList(object);
        var objectType = Sidebar.getObjectType(object);

        var childPropsSelector = this.objectProps.select('.content .children-properties');

        childPropsSelector.classed('visible', childObjects.length);

        childPropsSelector.select('.children-properties-header').text(i18n.t('objectProperties.childrenProperties.'+ objectType+'.header'));
        var childrenContent = childPropsSelector.select('.children-properties-content');
        var children = childrenContent.selectAll('div.child-object').data(childObjects, (d,i)=> d.$id || i);
        var childrenEnter = children.enter().appendSelector('div.child-object');
        var childrenMerge = childrenEnter.merge(children);

        childrenMerge.each(updateChildObjectProperties);

        children.exit().remove();

        function updateChildObjectProperties(child, i){
            var container = d3.select(this);
            container.selectOrAppend('div.child-header').text(i18n.t('objectProperties.childrenProperties.'+ objectType+'.child.header', {number: i+1}));

            var fieldList = self.getFieldListForObject(child);
            self.updateObjectFields(child, fieldList, container.selectOrAppend('div.field-list'))
        }
    }

    static getObjectType(object){
        if(object instanceof model.Node){
            return 'node';
        }
        if(object instanceof model.Edge){
            return 'edge';
        }
        if(object instanceof model.Text){
            return 'text';
        }
        return '';
    }

    static getHeaderTextForObject(object) {
        if(object instanceof model.Node){
            return i18n.t('objectProperties.header.node.'+object.type);
        }
        if(object instanceof model.Edge){
            return i18n.t('objectProperties.header.edge');
        }
        if(object instanceof model.Text){
            return i18n.t('objectProperties.header.text');
        }
        return '';
    }

    getChildObjectList(object) {
        if(object instanceof model.Node){
            return object.childEdges.sort((a,b)=>a.childNode.location.y - b.childNode.location.y);
        }
        if(object instanceof model.Edge){
            return [];
        }
        return [];
    }


    getFieldListForObject(object) {
        var self = this;
        if(object instanceof model.Node){
            return [{
                name: 'name',
                type: 'textarea'
            }]
        }
        if(object instanceof model.Edge){
            var list = [
                {
                    name: 'name',
                    type: 'textarea'
                },
                {
                    name: 'payoff',
                    type: 'text',
                    validator: new PayoffValidator(self.app.expressionEngine)
                }
            ];
            if(object.parentNode instanceof model.ChanceNode){
                list.push( {
                    name: 'probability',
                    type: 'text',
                    validator: new ProbabilityValidator(self.app.expressionEngine)
                })
            }
            return list;

        }
        if(object instanceof model.Text){
            return [{
                name: 'value',
                type: 'textarea'
            }]
        }

        return [];
    }

    updateObjectFields(object, fieldList, container) {
        var self = this;


        var objectType = object instanceof model.Node ? 'node' :  object instanceof model.Edge ? 'edge' : 'text';
        var getFieldId = d=>'object-'+object.$id+'-field-'+d.name;

        var fields = container.selectAll('div.object-field').data(fieldList);
        var temp={};
        var fieldsEnter = fields.enter().appendSelector('div.object-field');
        var fieldsMerge = fieldsEnter.merge(fields);

        fieldsMerge.each(function(d, i){
            var fieldSelection = d3.select(this);
            fieldSelection.html("");

            var input;
            if(d.type == 'textarea'){
                input = fieldSelection.append('textarea').attr('rows', 1);
            }else{
                input = fieldSelection.append('input');
            }
            input.classed('sd-input', true);

            fieldSelection.appendSelector('span.bar');
            fieldSelection.append('label');
            fieldSelection.classed('input-group', true);
        });

        fieldsMerge.select('label')
            .attr('for', getFieldId)
            .html(d=>i18n.t(objectType+'.'+d.name));
        fieldsMerge.select('.sd-input')
            .attr('type', d=>d.type == 'textarea'? undefined : d.type)
            .attr('name', d=>d.name)
            .attr('id', getFieldId)
            .on('change keyup', function(d, i){
                if(d.validator && !d.validator.validate(this.value)){
                    d3.select(this).classed('invalid', true);
                    return;
                }
                d3.select(this).classed('invalid', false);
                if(d3.event.type=='change' && temp[i].pristineVal!=this.value){
                    object[d.name] = temp[i].pristineVal;
                    self.app.dataModel.saveState();
                }
                object[d.name] = this.value;
                Utils.updateInputClass(d3.select(this));
                self.app.onObjectUpdated(object)

            })
            .each(function(d, i){
                this.value = object[d.name];
                temp[i]={};
                temp[i].pristineVal = this.value;
                if(d.validator && !d.validator.validate(this.value)){
                    d3.select(this).classed('invalid', true);
                }
                Utils.updateInputClass(d3.select(this));
                if(d.type == 'textarea'){
                    Utils.elasticTextarea(d3.select(this));
                    Utils.autoResizeTextarea(d3.select(this).node())
                }

            });

        fields.exit().remove();
    }
}
