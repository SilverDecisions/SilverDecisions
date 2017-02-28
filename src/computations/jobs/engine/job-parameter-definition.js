import {Utils} from "../../../utils";
export const PARAMETER_TYPE = {
    STRING: 'STRING',
    DATE: 'DATE',
    INTEGER: 'INTEGER',
    NUMBER: 'FLOAT',
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

    constructor(name, typeOrNestedParametersDefinitions, minOccurs = 1, maxOccurs=1,identifying=false, validator=null) {
        this.name = name;
        if(Utils.isArray(typeOrNestedParametersDefinitions)){
            this.type = PARAMETER_TYPE.COMPOSITE;
            this.nestedParameters = typeOrNestedParametersDefinitions;
        }else{
            this.type = typeOrNestedParametersDefinitions;
        }
        this.validator = validator;
        this.identifying = identifying;
        this.minOccurs = minOccurs;
        this.maxOccurs = maxOccurs;
    }

    set(key, val){
        this[key] = val;
        return this;
    }

    validate(value){
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
            if(!Utils.isArray(value) || value.length !== this.nestedParameters.length){
                return false;
            }

            return this.nestedParameters.every((nestedDef, i)=>nestedDef.validate(value[i]))
        }

        if(this.validator){
            return this.validator.validate(value);
        }

        return true;
    }
}
