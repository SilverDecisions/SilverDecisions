import {Utils} from "sd-utils";
export const PARAMETER_TYPE = {
    STRING: 'STRING',
    DATE: 'DATE',
    INTEGER: 'INTEGER',
    NUMBER: 'FLOAT',
    BOOLEAN: 'BOOLEAN',
    NUMBER_EXPRESSION: 'NUMBER_EXPRESSION',
    COMPOSITE: 'COMPOSITE' //composite parameter with nested subparameters
};

export class JobParameterDefinition{
    name;
    type;
    nestedParameters=[];
    minOccurs;
    maxOccurs;

    identifying;
    validator;
    singleValueValidator;

    constructor(name, typeOrNestedParametersDefinitions, minOccurs = 1, maxOccurs=1,identifying=false,singleValueValidator=null, validator=null) {
        this.name = name;
        if(Utils.isArray(typeOrNestedParametersDefinitions)){
            this.type = PARAMETER_TYPE.COMPOSITE;
            this.nestedParameters = typeOrNestedParametersDefinitions;
        }else{
            this.type = typeOrNestedParametersDefinitions;
        }
        this.validator = validator;
        this.singleValueValidator = singleValueValidator;
        this.identifying = identifying;
        this.minOccurs = minOccurs;
        this.maxOccurs = maxOccurs;
    }

    set(key, val){
        this[key] = val;
        return this;
    }

    validate(value){
        var isArray = Utils.isArray(value);

        if(this.maxOccurs>1 && !isArray){
            return false;
        }

        if(!isArray){
            return this.validateSingleValue(value)
        }

        if(value.length<this.minOccurs || value.length>this.maxOccurs) {
            return false;
        }

        if(!value.every(this.validateSingleValue, this)){
            return false;
        }

        if(this.validator){
            return this.validator(value);
        }

        return true;
    }

    validateSingleValue(value){
        if((value===null || value === undefined) && this.minOccurs>0){
            return false
        }
        if(PARAMETER_TYPE.STRING === this.type && !Utils.isString(value)){
            return false;
        }
        if(PARAMETER_TYPE.DATE === this.type && !Utils.isDate(value)){
            return false;
        }
        if(PARAMETER_TYPE.INTEGER === this.type && !Utils.isInt(value)){
            return false;
        }
        if(PARAMETER_TYPE.NUMBER === this.type && !Utils.isNumber(value)){
            return false;
        }

        if(PARAMETER_TYPE.COMPOSITE === this.type){
            if(!Utils.isObject(value)){
                return false;
            }
            if(!this.nestedParameters.every((nestedDef, i)=>nestedDef.validate(value[nestedDef.name]))){
                return false;
            }
        }

        if(this.singleValueValidator){
            return this.singleValueValidator(value);
        }

        return true;
    }
}
