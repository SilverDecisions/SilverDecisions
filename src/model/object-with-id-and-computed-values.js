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
                valid: true
            }
        }
        return this.$fieldStatus[fieldName];
    }

    markAsInvalid(fieldName){
        this.getFieldStatus(fieldName).valid = false;
    }

    markAsValid(fieldName){
        this.getFieldStatus(fieldName).valid = true;
    }

    isFieldValid(fieldName){
        return this.getFieldStatus(fieldName).valid;
    }
}
