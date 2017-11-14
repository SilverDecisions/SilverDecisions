import {Templates} from "../templates";
import {PARAMETER_TYPE} from "sd-computations/src/jobs/engine/job-parameter-definition";
import {log} from 'sd-utils'
import * as d3 from "../d3";
import {Utils} from "sd-utils";
import {i18n} from "../i18n/i18n";
import {AppUtils} from "../app-utils";
import {Tooltip} from "sd-tree-designer";
import {Autocomplete} from "../autocomplete"

export class JobParametersBuilder{


    jobParameters;
    hiddenParams;
    constructor(container, i18nPrefix='', onChange=()=>{}){
        this.container=container;
        this.i18nPrefix = i18nPrefix;
        this.paramTypeToInputType ={};
        this.paramTypeToInputAttrs = {};

        this.paramTypeToInputType[PARAMETER_TYPE.BOOLEAN] = 'checkbox';
        this.paramTypeToInputType[PARAMETER_TYPE.DATE] = 'date';
        this.paramTypeToInputType[PARAMETER_TYPE.INTEGER] = 'number';
        this.paramTypeToInputAttrs[PARAMETER_TYPE.INTEGER] = [{
            name: "step",
            value: "1"
        }];
        this.paramTypeToInputType[PARAMETER_TYPE.NUMBER] = 'number';
        this.paramTypeToInputAttrs[PARAMETER_TYPE.NUMBER] = [{
            name: "step",
            value: "any"
        }];
        this.paramTypeToInputType[PARAMETER_TYPE.STRING] = 'text';

        this.onChange = onChange;
    }


    setJobParameters(jobName, jobParameters, customParamsConfig={}){
        this.jobName=jobName;
        this.jobParameters = jobParameters;
        this.customParamsConfig = customParamsConfig;
        this.clean();
        this.build(this.container, this.jobParameters.definitions, this.jobParameters.values, '', this.onChange);
    }

    clean() {
        this.container.html('');
        this.pristine = {};
        this.customValidators = {};
        this.strictValidation(false);
    }

    validate(strictValidation = true){
        this.strictValidation(strictValidation);
        this.pristine = {};
        this.container.selectAll('.sd-pristine').classed('sd-pristine', false);
        return this.checkCustomValidators() && this.jobParameters.validate();
    }

    checkCustomValidators(){
        let valid = true;
        Utils.forOwn(this.customValidators, (val, key)=>{
            valid = valid && val();
        });
        return valid;
    }

    strictValidation(enabled=true){
        this.container.classed('sd-strict-validation', enabled);
    }


    build(container, jobParameterDefinitions, parentValueObject,  parentPath='', onChange=()=>{}, onInput=()=>{}){
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
                }, path,onChange, onInput)
            }else{
                paramSelection.appendSelector("div.sd-job-parameter-name").html(self.getParamNameI18n(path));

                var valuesContainer = paramSelection.appendSelector("div.sd-job-parameter-values");
                var actionButtons = paramSelection.appendSelector("div.sd-action-buttons");
                var addButton = actionButtons.appendSelector('button.sd-add-job-parameter-value-button.icon-button');
                addButton.appendSelector("i.material-icons").html('add');


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
                callbacks.onInput = () =>{
                    paramSelection.classed('invalid', !d.validate(value));
                    onInput();
                };

                addButton
                    .attr('title', i18n.t('jobParametersBuilder.buttons.addParameterValue'))
                    .classed('sd-hidden', value.length>=d.maxOccurs)
                    .on('click', ()=>{
                        value.push(self.getEmptyValue(d.type));
                        Utils.set(self.pristine, path+"["+(value.length-1)+"]", true);
                        self.buildParameterValues(valuesContainer, d, value, path, callbacks);
                        addButton.classed('sd-hidden', value.length>=d.maxOccurs);
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

        paramValues.exit().remove();
        var paramValuesEnter = paramValues.enter().appendSelector('div.sd-job-parameter-value');

        var paramValuesMerge = paramValuesEnter.merge(paramValues);

        var indexToSelection = {};

        var customValidator = Utils.get(self.customParamsConfig, path+'.customValidator');

        function checkCustomValidator(){
            let allValid = true;
            if(customValidator){
                customValidator(values).forEach((isValid, i)=>{
                    var selection = indexToSelection[i];
                    let valid = paramDefinition.validateSingleValue(values[i]) && isValid;
                    selection.classed('invalid', !valid);
                    allValid = allValid && valid;
                })
            }

            return allValid;
        }

        self.customValidators[path] = checkCustomValidator;

        paramValuesEnter.each(function (value, i) {
            var derivedValueUpdaters = [];

            function updateDerivedValues(){
                derivedValueUpdaters.forEach(updater=>updater(values[i]))
            }

            var selection = d3.select(this);
            indexToSelection[i] = selection;


            if (PARAMETER_TYPE.COMPOSITE == paramDefinition.type) {
                var nestedParameters = selection.selectOrAppend("div.sd-nested-parameters");
                var onChange = ()=>{
                    selection.classed('invalid', !paramDefinition.validateSingleValue(value));
                    checkCustomValidator();
                    updateDerivedValues();
                    if(callbacks.onChange){
                        callbacks.onChange();
                    }
                };
                var onInput = ()=>{
                    updateDerivedValues();
                    selection.classed('invalid', !paramDefinition.validateSingleValue(value));
                    checkCustomValidator();
                    if(callbacks.onInput){
                        callbacks.onInput();
                    }
                };

                self.build(nestedParameters, paramDefinition.nestedParameters, value, path, onChange, onInput);
                selection.classed('invalid', !paramDefinition.validateSingleValue(value));
                selection.classed('sd-pristine', Utils.get(self.pristine, path+"["+i+"]", false));
            }else{
                self.buildParameterSingleValue(selection, paramDefinition, {
                    get: ()=> values[i],
                    set: (v)=> values[i]=v
                }, path, ()=>{
                    updateDerivedValues();
                    checkCustomValidator();
                    if(callbacks.onChange){
                        callbacks.onChange();
                    }
                },()=>{
                    updateDerivedValues();
                    checkCustomValidator();
                    if(callbacks.onInput){
                        callbacks.onInput();
                    }
                })

            }


            var derivedValuesConfigs = Utils.get(self.customParamsConfig, path+'._derivedValues');
            if(derivedValuesConfigs){
                derivedValuesConfigs.forEach(derivedValueConfig =>{
                    let updater = self.buildDerivedValue(selection, derivedValueConfig, path);
                    updater(value);
                    derivedValueUpdaters.push(updater);
                });
            }


            var actionButtons = selection.appendSelector("div.sd-action-buttons");
            var removeButton = actionButtons.appendSelector('button.sd-remove-job-parameter-value-button.icon-button');
            removeButton.appendSelector("i.material-icons").html('remove')
            removeButton
                .attr('title', i18n.t('jobParametersBuilder.buttons.removeParameterValue'))
                .classed('sd-hidden', values.length<=paramDefinition.minOccurs)
                .on('click', (d)=>callbacks.onValueRemoved(d,i))

        });

        checkCustomValidator();

        paramValuesMerge.each(function (value, i) {

        });


    }

    buildDerivedValue(container, derivedValueConfig, path){
        var self = this;

        var inputId = Utils.guid();
        var selection = container.appendSelector('div.input-group.sd-derived-value');
        var name = this.getParamNameI18n(path+'.'+derivedValueConfig.name);
        var input = selection.append('input').attr('type', 'text').attr("disabled", "disabled");

        selection.appendSelector('span.bar');
        var label = selection.append('label')
            .attr('for', inputId)
            .html(name);

        return (paramValue) => {
            input.node().value = derivedValueConfig.value(paramValue);
            AppUtils.updateInputClass(input);
        }

    }

    buildParameterSingleValue(container, paramDefinition, valueAccessor, path, onChange, onInput){
        var self = this;
        var temp = {};

        var inputId = Utils.guid();
        var selection = container.appendSelector('div.input-group');
        selection.classed('sd-parameter-'+paramDefinition.name, true);
        var help = this.getParamHelpI18n(path);
        if(help) {
            let helpContainer = container.appendSelector('div.sd-help-icon');
            helpContainer.html('<i class="material-icons">info_outline</i>');
            Tooltip.attach(helpContainer, (d)=>{
                return help;
            }, 5, 15);
        }

        var options = Utils.get(self.customParamsConfig, path+'.options', null);

        var inputType = this.paramTypeToInputType[paramDefinition.type];
        var additionalInputAttrs = this.paramTypeToInputAttrs[paramDefinition.type];
        var input;
        if(options && options.length){
            inputType = 'select';
            input = selection.append('select');
            var optionsSel = input.selectAll("option").data([null].concat(options));
            optionsSel.enter().append("option").attr("value", d=>d).text(d=>d);

            if(Utils.get(self.customParamsConfig, path+'.optionsAutocomplete', null)){
                let autocomplete = new Autocomplete(input);
                input = autocomplete.getInput();
            }
        }else{
            input = selection.append('input').attr('type', inputType);

            if(additionalInputAttrs){
                additionalInputAttrs.forEach(attr=>input.attr(attr.name, attr.value))

            }
        }

        input.attr('id', inputId);

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

            if (d3.event.type == 'input') {
                if (onInput) {
                    onInput();
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
        var label = selection.append('label')
            .attr('for', inputId)
            .html(d=>{
                let label = this.getParamNameI18n(path);
                return label;
            });
        input.node().value = valueAccessor.get();
    }

    value(path, value){
        return this.jobParameters.value(path, value);
    }

    parseInput(value, parameterType){
        if(parameterType===PARAMETER_TYPE.DATE){
            return new Date(value)
        }
        if(parameterType===PARAMETER_TYPE.NUMBER || parameterType===PARAMETER_TYPE.INTEGER){
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
        return i18n.t(this.i18nPrefix+'.'+this.jobName+'.param.'+path+'.label')
    }

    getParamHelpI18n(path){
        let key = this.i18nPrefix+'.'+this.jobName+'.param.'+path+'.help';
        let help = i18n.t(key);
        return help === key ? null : help;
    }
}
