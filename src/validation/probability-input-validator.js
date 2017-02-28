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

        if(this.expressionEngine.constructor.isHash(value)){
            return true;
        }

        if(this.expressionEngine.constructor.hasAssignmentExpression(value)) {
            return false;
        }
        var scope = edge.parentNode.expressionScope;
        return this.expressionEngine.validate(value, scope);
    }

}
