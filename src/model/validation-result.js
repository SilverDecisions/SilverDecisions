import *  as _ from 'lodash'
import {i18n} from '../i18n/i18n'
import {Utils} from "sd-utils";
export class ValidationResult{


    errors = {};
    warnings = {};
    objectIdToError={};

    addError(error, obj){
        if(Utils.isString(error)){
            error = {name: error};
        }
        var name = error.name;
        var errorsByName = this.errors[name];
        if(!errorsByName){
            errorsByName=[];
            this.errors[name]=errorsByName;
        }
        var objE = this.objectIdToError[obj.$id];
        if(!objE){
            objE=[];
            this.objectIdToError[obj.$id]= objE;
        }
        errorsByName.push(obj);
        objE.push(error);
    }

    addWarning(name, obj){
        var e = this.warnings[name];
        if(!e){
            e=[];
            this.warnings[name]=e;
        }
        e.push(obj)
    }

    isValid(){
        return Object.getOwnPropertyNames(this.errors).length === 0
    }

    static getMessage(error){
        if(Utils.isString(error)){
            error = {name: error};
        }
        var key = 'validation.' + error.name;
        return i18n.t(key, error.data);
    }

    static createFromDTO(dto){
        var v = new ValidationResult();
        v.errors = dto.errors;
        v.warnings = dto.warnings;
        v.objectIdToError = dto.objectIdToError;
        return v;
    }
}
