import {ExpressionEngine} from '../expression-engine'
import {Utils} from "../utils";

export class ProbabilityInputValidator{
    expressionEngine;
    constructor(expressionEngine){
        this.expressionEngine=expressionEngine;
    }

    validate(value, edge){
        if(value===null || value === undefined){
            return false;
        }

        value += "";
        if(!value.trim()){
            return false;
        }

        if(ExpressionEngine.isHash(value)){
            return true;
        }

        if(ExpressionEngine.hasAssignmentExpression(value)) {
            return false;
        }
        var scope = edge.parentNode.expressionScope;
        return this.expressionEngine.validate(value, scope);
    }

}
