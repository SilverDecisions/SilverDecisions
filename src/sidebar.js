import * as d3 from './d3'

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

        var fieldList = Sidebar.getFieldListForObject(object);
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

    static getFieldListForObject(object) {
        if(object instanceof model.Node){
            return [{
                name: 'name',
                label: 'Label',
                type: 'text'
            }]
        }
        if(object instanceof model.Edge){
            var list = [
                {
                    name: 'name',
                    label: 'Label',
                    type: 'text'
                },
                {
                    name: 'payoff',
                    label: 'Payoff',
                    type: 'text',
                    validator: v=> Utils.isNumeric(v)
                }
            ];
            if(object.parentNode instanceof model.ChanceNode){
                list.push( {
                    name: 'probability',
                    label: 'Probability',
                    type: 'text',
                    validator: v=> Utils.isNumeric(v) && v>=0.0 && v <=1.0
                })
            }
            return list;

        }

        return [];
    }



    updateObjectFields(object, fieldList) {
        var self = this;
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
            .html(d=>d.label);
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
