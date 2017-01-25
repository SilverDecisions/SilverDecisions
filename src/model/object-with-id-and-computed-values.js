import {Utils} from '../utils'
import *  as _ from 'lodash'

export class ObjectWithIdAndComputedValues {


    computed={}; //computed values

    $id = Utils.guid(); //internal id

    $fieldStatus={};

    /*get or set computed value*/
    computedValue(ruleName, fieldName, value){
        var path = 'computed.';
        if(ruleName){
            path+=ruleName+'.';
        }
        path+=fieldName;
        if(value===undefined){
            return  _.get(this, path, null);
        }
        _.set(this, path, value);
        return value;
    }

    clearComputedValues(ruleName){
        if(ruleName==undefined){
            this.computed={};
            return;
        }
        if(Utils.isArray(ruleName)){
            ruleName.forEach(n=>{
                this.computed[n]={};
            });
            return;
        }
        this.computed[ruleName]={};
    }

    getFieldStatus(fieldName){
        if(!this.$fieldStatus[fieldName]){
            this.$fieldStatus[fieldName] = {
                valid: {
                    syntax: true,
                    value: true
                }
            }
        }
        return this.$fieldStatus[fieldName];
    }

    setSyntaxValidity(fieldName, valid){
        var fieldStatus = this.getFieldStatus(fieldName);
        fieldStatus.valid.syntax = valid;
    }

    setValueValidity(fieldName, valid){
        var fieldStatus = this.getFieldStatus(fieldName);
        fieldStatus.valid.value = valid;
    }

    isFieldValid(fieldName, syntax=true, value=true){
        var fieldStatus = this.getFieldStatus(fieldName);
        if(syntax && value) {
            return fieldStatus.valid.syntax && fieldStatus.valid.value;
        }
        if(syntax) {
            return fieldStatus.valid.syntax
        }
        return fieldStatus.valid.value;
    }
}
