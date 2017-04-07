import {Templates} from "../templates";
import {PARAMETER_TYPE} from "sd-computations/src/jobs/engine/job-parameter-definition";
import {log} from 'sd-utils'
import * as d3 from "../d3";
import {Utils} from "sd-utils";
import {i18n} from "../i18n/i18n";
import {AppUtils} from "../app-utils";

export class JobParametersBuilder{


    jobParameters;
    hiddenParams;
    constructor(container, i18nPrefix=''){
        this.container=container;
        this.i18nPrefix = i18nPrefix;
        this.paramTypeToInputType ={};
        this.paramTypeToInputType[PARAMETER_TYPE.BOOLEAN] = 'checkbox';
        this.paramTypeToInputType[PARAMETER_TYPE.DATE] = 'date';
        this.paramTypeToInputType[PARAMETER_TYPE.INTEGER] = 'number';
        this.paramTypeToInputType[PARAMETER_TYPE.NUMBER] = 'number';
        this.paramTypeToInputType[PARAMETER_TYPE.STRING] = 'text';
    }


    setJobParameters(jobName, jobParameters, customParamsConfig={}){
        this.jobName=jobName;
        this.jobParameters = jobParameters;
        this.customParamsConfig = customParamsConfig;
        this.clean();
        this.build(this.container, this.jobParameters.definitions, this.jobParameters.values);
    }
    clean() {
        this.container.html('');
        this.container.classed('sd-strict-validation', false)
    }

    validate(){
        this.container.classed('sd-strict-validation', true)
        return this.jobParameters.validate();
    }

    build(container, jobParameterDefinitions, parentValueObject,  parentPath='', onChange=()=>{}){
        container.html('');
        var self = this;
        var params = container.selectAll(".sd-job-parameter").data(jobParameterDefinitions);
        var paramsEnter = params.enter().appendSelector('div.sd-job-parameter');

        paramsEnter.html(d=>Templates.get('jobParameter', d));

        var paramsMerge = paramsEnter.merge(params);
        paramsMerge.each(function(d,i){
            var paramSelection = d3.select(this);
            var path = parentPath;

            if(path){
                path+='.';

            }
            path += d.name;
            paramSelection.classed('sd-hidden', Utils.get(self.customParamsConfig, path+'.hidden'));

            var value = parentValueObject[d.name];
            var repeating = d.maxOccurs>1;
            if(value==undefined){
                if(repeating){
                    value = [];
                    for(var vi=0; vi<d.minOccurs; vi++){
                        value.push(self.getEmptyValue(d.type))
                    }

                }else{
                    value=Utils.get(self.customParamsConfig, path+'.value', self.getEmptyValue(d.type))
                }

                parentValueObject[d.name]=value;
            }

            if(!repeating) {
                self.buildParameterSingleValue(paramSelection, d, {
                    get: ()=> parentValueObject[d.name],
                    set: (v)=> parentValueObject[d.name]=v
                }, path,onChange)
            }else{
                paramSelection.appendSelector("div.sd-job-parameter-name").html(self.getParamNameI18n(path+'.'));

                var valuesContainer = paramSelection.appendSelector("div.sd-job-parameter-values");
                var actionButtons = paramSelection.appendSelector("div.sd-action-buttons");
                var addButton = actionButtons.appendSelector('button.sd-add-job-parameter-value-button.icon-button');
                addButton.appendSelector("i.material-icons").html('add')


                paramSelection.classed('invalid', !d.validate(value));
                var callbacks = {};
                callbacks.onValueRemoved = function(v,i){
                    value.splice(i, 1);
                    self.buildParameterValues(valuesContainer, d, value, path,callbacks)
                    addButton.classed('sd-hidden', value.length>=d.maxOccurs)
                    callbacks.onChange();
                };
                callbacks.onChange = () =>{
                    paramSelection.classed('invalid', !d.validate(value));
                    onChange();
                };


                addButton
                    .attr('title', i18n.t('jobParametersBuilder.buttons.addParameterValue'))
                    .classed('sd-hidden', value.length>=d.maxOccurs)
                    .on('click', ()=>{
                        value.push(self.getEmptyValue(d.type));
                        self.buildParameterValues(valuesContainer, d, value, path, callbacks);
                        addButton.classed('sd-hidden', value.length>=d.maxOccurs)
                        callbacks.onChange();
                    });

                self.buildParameterValues(valuesContainer, d, value, path,callbacks);

            }

        });

    }

    buildParameterValues(container, paramDefinition, values, path, callbacks){
        var self = this;
        container.html("");

        var paramValues = container.selectAll(".sd-job-parameter-value").data(values);

        var paramValuesEnter = paramValues.enter().appendSelector('div.sd-job-parameter-value');

        var paramValuesMerge = paramValuesEnter.merge(paramValues);

        paramValuesEnter.each(function (value, i) {

            var selection = d3.select(this);


            if (PARAMETER_TYPE.COMPOSITE == paramDefinition.type) {
                var nestedParameters = selection.selectOrAppend("div.sd-nested-parameters");
                var onChange = ()=>{
                    selection.classed('invalid', !paramDefinition.validateSingleValue(value));
                    if(callbacks.onChange){
                        callbacks.onChange();
                    }
                };
                self.build(nestedParameters, paramDefinition.nestedParameters, value, path, onChange)
                selection.classed('invalid', !paramDefinition.validateSingleValue(value));
            }else{
                self.buildParameterSingleValue(selection, paramDefinition, {
                    get: ()=> values[i],
                    set: (v)=> values[i]=v
                }, path, callbacks.onChange)
            }

            var actionButtons = selection.appendSelector("div.sd-action-buttons");
            var removeButton = actionButtons.appendSelector('button.sd-remove-job-parameter-value-button.icon-button');
            removeButton.appendSelector("i.material-icons").html('remove')
            removeButton
                .attr('title', i18n.t('jobParametersBuilder.buttons.removeParameterValue'))
                .classed('sd-hidden', values.length<=paramDefinition.minOccurs)
                .on('click', (d)=>callbacks.onValueRemoved(d,i))

        });

        paramValuesMerge.each(function (value, i) {

        });
    }



    buildParameterSingleValue(container, paramDefinition, valueAccessor, path,onChange){
        var self = this;
        var temp = {};
        var inputType = this.paramTypeToInputType[paramDefinition.type];
        var inputId = Utils.guid();
        var selection = container.appendSelector('div.input-group')
        var input = selection.append('input')
            .attr('id', inputId)
            .attr('type', inputType);
        input.classed('sd-input', true);
        input.on('input change', function(d, i){
            var value = self.parseInput(this.value, paramDefinition.type);
            if(inputType=='checkbox'){
                value = this.checked
            }
            if(!paramDefinition.validateSingleValue(value)){
                d3.select(this).classed('invalid', true);
            }else{
                d3.select(this).classed('invalid', false);
            }
            valueAccessor.set(value);
            if (d3.event.type == 'change') {
                if (onChange) {
                    onChange();
                }
            }

            AppUtils.updateInputClass(d3.select(this));
        }).each(function(d, i){
            var value = valueAccessor.get();
            if(inputType=='checkbox'){
                this.checked = value
            }else{
                this.value = value;
            }
            temp[i]={};
            temp[i].pristineVal = value;
            d3.select(this).classed('invalid', !paramDefinition.validateSingleValue(value));
            AppUtils.updateInputClass(d3.select(this));
        });

        selection.appendSelector('span.bar');
        selection.append('label')
            .attr('for', inputId)
            .html(d=>this.getParamNameI18n(path));
        input.node().value = valueAccessor.get();
    }

    value(path, value){
        return this.jobParameters.value(path, value);
    }

    parseInput(value, parameterType){
        if(parameterType===PARAMETER_TYPE.DATE){
            return new Date(value)
        }
        if(parameterType===PARAMETER_TYPE.INTEGER){
            return parseInt(value);
        }
        if(parameterType===PARAMETER_TYPE.NUMBER){
            return parseFloat(value);
        }
        return value;
    }

    getEmptyValue(parameterType){
        if(parameterType===PARAMETER_TYPE.COMPOSITE){
            return {}
        }

        return null;
    }

    getParamNameI18n(path){
        return i18n.t(this.i18nPrefix+'.'+this.jobName+'.param.'+path)
    }
}
