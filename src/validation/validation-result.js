import *  as _ from 'lodash'
import {i18n} from '../i18n/i18n'
export class ValidationResult{


    errors = {};
    warnings = {};
    objectIdToError={};

    addError(name, obj){
        var e = this.errors[name];
        if(!e){
            e=[];
            this.errors[name]=e;
        }
        var objE = this.objectIdToError[obj.$id];
        if(!objE){
            objE=[];
            this.objectIdToError[obj.$id]= objE;
        }
        e.push(obj);
        objE.push(name);
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

    static getMessage(name){
        var key = 'validation.' + name;
        return i18n.t(key);
    }

}
