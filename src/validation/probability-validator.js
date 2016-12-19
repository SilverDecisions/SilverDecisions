import {ExpressionEngine} from '../expression-engine'

export class ProbabilityValidator{
    expressionEngine;
    constructor(expressionEngine){
        this.expressionEngine=expressionEngine;
    }

    validate(value){
        if(ExpressionEngine.isHash(value)){
            return true;
        }

        if(!this.expressionEngine.validate(value)){
            return false;
        }
        var evaluatedVal = this.expressionEngine.eval(value);
        if(isNaN(evaluatedVal)){
            return false;
        }
        evaluatedVal = ExpressionEngine.toNumber(evaluatedVal);
        return evaluatedVal.compare(0) >= 0 && evaluatedVal.compare(1) <= 0;
    }

}
