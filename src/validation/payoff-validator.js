import {ExpressionEngine} from '../expression-engine'
import {Utils} from "../utils";

export class PayoffValidator{
    expressionEngine;
    constructor(expressionEngine){
        this.expressionEngine=expressionEngine;
    }

    validate(value, edge){
        if(value===null || value === undefined){
            return false;
        }
        if(ExpressionEngine.hasAssignmentExpression(value)) {
            return false;
        }
        return this.expressionEngine.validate(value, edge.parentNode.expressionScope);
    }

}
