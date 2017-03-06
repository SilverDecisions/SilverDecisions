import {ExpressionEngine} from 'sd-expression-engine'
import {Utils} from "sd-utils";

/*Computed base value validator*/
export class PayoffValueValidator{
    expressionEngine;
    constructor(expressionEngine){
        this.expressionEngine=expressionEngine;
    }

    validate(value){
        if(value===null || value === undefined){
            return false;
        }
        var value = ExpressionEngine.toNumber(value);
        return value.compare(Number.MIN_SAFE_INTEGER) >= 0 && value.compare(Number.MAX_SAFE_INTEGER) <= 0;
    }

}
