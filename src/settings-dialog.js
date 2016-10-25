import * as d3 from './d3'
import {Dialog} from './dialog'
import *  as _ from 'lodash'
import {i18n} from "./i18n/i18n";
import {Templates} from "./templates";

export class SettingsDialog extends Dialog{

    formGroups=[];

    constructor(app){
        super(app.container.select('#sd-settings-dialog'), app);

        var group = new FormGroup('general', ()=> {
            app.treeDesigner.updateSvgStyles();
            app.updateNumberFormats();
        });
        group
            .addField('fontFamily', 'text', app.treeDesigner, 'config.fontFamily')
            .addField('fontSize', 'text', app.treeDesigner, 'config.fontSize')
            .addField('numberFormatLocale', 'text', app, 'config.format.locales', {validate: (v)=>{try{new Intl.NumberFormat(v); return true;}catch (e){return false}}});
        this.formGroups.push(group);


        var payoffGroup = new FormGroup('payoff', ()=>app.updatePayoffNumberFormat());
        payoffGroup
            .addSelectField('style', app, 'config.format.payoff.style', ['currency', 'decimal'])
            .addField('currency', 'text', app, 'config.format.payoff.currency', {validate: (v)=>{try{new Intl.NumberFormat([], {currency:v}); return true;}catch (e){return false}}})
            .addField('minimumFractionDigits', 'number', app, 'config.format.payoff.minimumFractionDigits' , {validate: (v)=>{try{new Intl.NumberFormat([], {minimumFractionDigits:v, maximumFractionDigits:app.config.format.payoff.maximumFractionDigits}); return true;}catch (e){return false}}})
            .addField('maximumFractionDigits', 'number', app, 'config.format.payoff.maximumFractionDigits', {validate: (v)=>{try{new Intl.NumberFormat([], {minimumFractionDigits:app.config.format.payoff.minimumFractionDigits, maximumFractionDigits:v}); return true;}catch (e){return false}}})
        this.formGroups.push(payoffGroup);

        group = new FormGroup('probability', ()=>app.updateProbabilityNumberFormat());
        group
            .addSelectField('style', app, 'config.format.probability.style', ['decimal', 'percent'])
            .addField('minimumFractionDigits', 'number', app, 'config.format.probability.minimumFractionDigits', {validate: (v)=>{try{new Intl.NumberFormat([], {minimumFractionDigits:v, maximumFractionDigits:app.config.format.probability.maximumFractionDigits}); return true;}catch (e){return false}}})
            .addField('maximumFractionDigits', 'number', app, 'config.format.probability.maximumFractionDigits', {validate: (v)=>{try{new Intl.NumberFormat([], {minimumFractionDigits:app.config.format.probability.minimumFractionDigits, maximumFractionDigits:v}); return true;}catch (e){return false}}})
        this.formGroups.push(group);

        this.initView();

    }

    initView() {
        var temp = {};


        var formGroups = this.container.select('form#sd-settings-form').selectAll('div.sd-form-group').data(this.formGroups);
        var formGroupsEnter = formGroups.enter().appendSelector('div.sd-form-group').html(d=>Templates.get('settingsDialogFormGroup', d));

        var inputGroups = formGroupsEnter.merge(formGroups).selectAll('div.input-group').data(d=>d.fields);

        var inputGroupsEnter = inputGroups.enter().appendSelector('div.input-group').html(d=>d.type=='select'? Templates.get('selectInputGroup', d):Templates.get('inputGroup', d));


        inputGroupsEnter.merge(inputGroups).select('input, select').on('change input', function(d,i){
            if(d.validator && !d.validator.validate(this.value)){
                d3.select(this).classed('invalid', true);
                if(d3.event.type=='change'){
                    this.value = d.valueAccessor.get();
                }
                return;
            }
            d3.select(this).classed('invalid', false);
            d.valueAccessor.set(this.value);
            if(d.valueUpdateCallback){
                d.valueUpdateCallback();
            }
            d3.select(this).classed('empty', this.value!==0 && !this.value);


        }).each(function(d, i){
            this.value = d.valueAccessor.get();
            temp[i]={};
            temp[i].pristineVal = this.value;
            if(d.validator && !d.validator.validate(this.value)){
                d3.select(this).classed('invalid', true);
            }else{
                d3.select(this).classed('invalid', false);
            }
            d3.select(this).classed('empty', this.value!==0 && !this.value);

        });

    }

    onOpen(){
        this.initView();
    }

}

export class FormGroup{
    name;
    fields=[];
    valueUpdateCallback;

    constructor(name, valueUpdateCallback){
        this.name = name;
        this.valueUpdateCallback = valueUpdateCallback;
    }

    addSelectField(name, config, path, options) {
        this.addField(name, 'select', config, path, null, options);
        return this;
    }


    addField(name, type, config, path, validator, options){
        var fieldId = this.name+"-"+name;
        var label = i18n.t("settingsDialog."+this.name+"."+name);
        var configInputField = new ConfigInputField(fieldId,fieldId, type,label, config, path, validator, options);
        configInputField.valueUpdateCallback = this.valueUpdateCallback;
        this.fields.push(configInputField);
        return this;
    }
}

class PathValueAccessor {
    sourceObject;
    path;
    constructor(sourceObject, path){
        this.sourceObject=sourceObject;
        this.path = path;
    }

    get(){
        return _.get(this.sourceObject, this.path);
    }

    set(v){
        return _.set(this.sourceObject, this.path, v);
    }
}

class InputField{
    name;
    type;
    validator;
    valueAccessor;

    id;
    label;
    valueUpdateCallback;

    constructor(id, name, type, label, valueAccessor, validator, options){
        this.name = name;
        this.type = type;
        this.valueAccessor = valueAccessor;
        this.validator = validator;
        this.id=id;
        this.label = label;
        this.options = options;
    }

}


class ConfigInputField extends InputField{
    constructor(id, name, type, label, sourceObject, path, validator, options){
        super(id, name, type, label, new PathValueAccessor(sourceObject, path), validator, options);
    }
}

