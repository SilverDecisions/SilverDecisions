import {ExpressionEngine} from 'sd-expression-engine'
import {Utils} from "sd-utils";

/*Computed base value validator*/
export class ProbabilityValueValidator{
    expressionEngine;
    constructor(expressionEngine){
        this.expressionEngine=expressionEngine;
    }

    validate(value, edge){
        if(value===null || value === undefined){
            return false;
        }

        var value = ExpressionEngine.toNumber(value);
        return value.compare(0) >= 0 && value.compare(1) <= 0;
    }

}
