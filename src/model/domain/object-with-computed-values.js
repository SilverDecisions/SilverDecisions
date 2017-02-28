import {Utils} from '../../utils'
import *  as _ from 'lodash'
import {ObjectWithIdAndEditableFields} from "./object-with-id-and-editable-fields";

export class ObjectWithComputedValues extends ObjectWithIdAndEditableFields{

    computed={}; //computed values

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

    displayValue(fieldName, value){
        return this.computedValue(null, '$displayValues.'+fieldName, value);
    }
}
