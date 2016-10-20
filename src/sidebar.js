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
    }

    initLayoutOptions(){
        var self = this;
        this.layoutOptionsContainer = this.container.select('#layout-options');
        this.autoLayoutOptionsGroup = this.layoutOptionsContainer.select('#auto-layout-options');
        this.gridWidth = this.layoutOptionsContainer.select('input#grid-width').on('change', function(){
            self.app.treeDesigner.layout.setGridWidth(this.value);

        });

        this.gridHeight = this.layoutOptionsContainer.select('input#grid-height').on('change', function(){
            self.app.treeDesigner.layout.setGridHeight(this.value);
        });

        this.edgeSlantWidthMax = this.layoutOptionsContainer.select('input#edge-slant-width-max').on('change', function(){
            self.app.treeDesigner.layout.setEdgeSlantWidthMax(this.value);
        });

        self.app.treeDesigner.layout.onAutoLayoutChanged.push((layout)=>self.updateLayoutOptions());

        this.updateLayoutOptions();
    }

    updateLayoutOptions(){
        this.edgeSlantWidthMax.node().value = this.app.treeDesigner.config.layout.edgeSlantWidthMax;

        this.gridWidth.node().value = this.app.treeDesigner.config.layout.gridWidth;
        this.gridHeight.node().value = this.app.treeDesigner.config.layout.gridHeight;
        this.autoLayoutOptionsGroup.classed('visible', !this.app.treeDesigner.layout.isManualLayout());
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


        var childPropsSelector = this.objectProps.select('.content .children-properties');

        childPropsSelector.classed('visible', childObjects.length);
        childPropsSelector.select('.children-properties-header').text('Connections');
        var childrenContent = childPropsSelector.select('.children-properties-content');
        var children = childrenContent.selectAll('div.child-object').data(childObjects, (d,i)=> d.$id || i);
        var childrenEnter = children.enter().appendSelector('div.child-object');
        var childrenMerge = childrenEnter.merge(children);

        childrenMerge.each(updateChildObjectProperties);

        children.exit().remove();

        function updateChildObjectProperties(child, i){
            var container = d3.select(this);
            container.selectOrAppend('div.child-header').text('Edge #'+(i+1));

            var fieldList = self.getFieldListForObject(child);
            self.updateObjectFields(child, fieldList, container.selectOrAppend('div.field-list'))
        }
    }


    static getHeaderTextForObject(object) {
        if(object instanceof model.Node){
            return Utils.capitalizeFirstLetter(object.type)+' Node';
        }
        if(object instanceof model.Edge){
            return 'Edge';
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
                type: 'text'
            }]
        }
        if(object instanceof model.Edge){
            var list = [
                {
                    name: 'name',
                    type: 'text'
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

        return [];
    }



    updateObjectFields(object, fieldList, container) {
        var self = this;
        var objectType = object instanceof model.Node ? 'node' : 'edge';

        var fields = container.selectAll('div.object-field').data(fieldList);
        var temp={};
        var fieldsEnter = fields.enter().appendSelector('div.object-field');

        fieldsEnter.append('input');
        // fieldsEnter.appendSelector('span.highlight');
        fieldsEnter.appendSelector('span.bar');
        fieldsEnter.append('label');

        fieldsEnter.classed('input-group', true);

        var getFieldId = d=>'object-'+object.$id+'-field-'+d.name;

        var fieldsMerge = fieldsEnter.merge(fields);
        fieldsMerge.select('label')
            .attr('for', getFieldId)
            .html(d=>i18n.t(objectType+'.'+d.name));
        fieldsMerge.select('input')
            .attr('type', d=>d.type)
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
                d3.select(this).classed('empty', this.value!==0 && !this.value);
                self.app.onObjectUpdated(object)

            })
            .each(function(d, i){
                this.value = object[d.name];
                temp[i]={};
                temp[i].pristineVal = this.value;
                if(d.validator && !d.validator.validate(this.value)){
                    d3.select(this).classed('invalid', true);
                }
                d3.select(this).classed('empty', this.value!==0 && !this.value);
            });

        fields.exit().remove();
    }

}
