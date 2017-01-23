import {ExpressionEngine} from '../expression-engine'
import {Utils} from "../utils";

export class ProbabilityValidator{
    expressionEngine;
    constructor(expressionEngine){
        this.expressionEngine=expressionEngine;
    }

    validate(value, edge){
        if(value===null || value === undefined){
            return false;
        }
        if(ExpressionEngine.isHash(value)){
            return true;
        }

        if(ExpressionEngine.hasAssignmentExpression(value)) {
            return false;
        }
        var scope = edge.parentNode.expressionScope;
        if(!this.expressionEngine.validate(value, scope)){
            return false;
        }
        var evaluatedVal = this.expressionEngine.eval(value, true, scope);
        return evaluatedVal.compare(0) >= 0 && evaluatedVal.compare(1) <= 0;
    }

}
