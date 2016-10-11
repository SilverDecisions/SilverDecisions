import * as d3 from './d3'
import {i18n} from './i18n/i18n'

import {Utils} from './utils'
import * as model from './model/index'

export class Sidebar{

    app;
    container;

    constructor(container, app){
        this.app = app;
        this.container = container;
    }

    displayObjectProperties(object){
        this.updateObjectPropertiesView(object);
    }
    hideObjectProperties(){
        this.container.select('#object-properties').classed('visible', false);
    }

    updateObjectPropertiesView(object){
        if(!object){
            this.hideObjectProperties();
            return;
        }

        var objectProps = this.container.select('#object-properties').classed('visible', true);
        var headerText = Sidebar.getHeaderTextForObject(object);
        objectProps.select('.header').html(headerText);

        var fieldList = this.getFieldListForObject(object);
        this.updateObjectFields(object, fieldList);
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
                    validator: v=> {
                        return self.app.expressionEngine.validate(v)
                    }
                }
            ];
            if(object.parentNode instanceof model.ChanceNode){
                list.push( {
                    name: 'probability',
                    type: 'text',
                    validator: v=> self.app.expressionEngine.validate(v)
                })
            }
            return list;

        }

        return [];
    }



    updateObjectFields(object, fieldList) {
        var self = this;
        var objectType = object instanceof model.Node ? 'node' : 'edge';

        var objectProps = this.container.select('#object-properties');
        var content = objectProps.select('.content');
        var fields = content.selectAll('div.object-field').data(fieldList);
        var temp={};
        var fieldsEnter = fields.enter().appendSelector('div.object-field');
        fieldsEnter.append('label');
        fieldsEnter.append('input');
        var fieldsMerge = fieldsEnter.merge(fields);
        fieldsMerge.select('label')
            .attr('for', d=>'object-field-'+d.name)
            .html(d=>i18n.t(objectType+'.'+d.name));
        fieldsMerge.select('input')
            .attr('type', d=>d.type)
            .attr('name', d=>d.name)
            .attr('id', d=>'object-field-'+d.name)
            .on('change keyup', function(d, i){
                if(d.validator && !d.validator(this.value)){
                    d3.select(this).classed('invalid', true);
                    return;
                }
                d3.select(this).classed('invalid', false);
                if(d3.event.type=='change' && temp[i].pristineVal!=this.value){
                    object[d.name] = temp[i].pristineVal;
                    self.app.dataModel.saveState();
                }
                object[d.name] = this.value;
                self.app.onObjectUpdated(object)

            })
            .each(function(d, i){
                this.value = object[d.name];
                temp[i]={};
                temp[i].pristineVal = this.value;
                if(d.validator && !d.validator(this.value)){
                    d3.select(this).classed('invalid', true);
                }
            });

        fields.exit().remove();
    }
}
