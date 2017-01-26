import {Utils} from '../utils'
import *  as _ from 'lodash'

export class ObjectWithIdAndEditableFields {

    $id = Utils.guid(); //internal id
    $fieldStatus={};
    
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
