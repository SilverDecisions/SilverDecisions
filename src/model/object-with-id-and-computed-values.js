import {Utils} from '../utils'
import *  as _ from 'lodash'

export class ObjectWithIdAndComputedValues {


    computed={}; //computed values

    $id = Utils.guid(); //internal id


    /*get or set computed value*/
    computedValue(ruleName, fieldName, value){
        if(value===undefined){
            return  _.get(this, 'computed.'+ruleName+'.'+fieldName, null);
        }
        _.set(this, 'computed.'+ruleName+'.'+fieldName, value);
        return value;
    }

    clearComputedValues(ruleName){
        this.computed[ruleName]={};
    }
}
