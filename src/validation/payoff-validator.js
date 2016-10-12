import {ExpressionEngine} from '../expression-engine'

export class PayoffValidator{
    expressionEngine;
    constructor(expressionEngine){
        this.expressionEngine=expressionEngine;
    }

    validate(value){

        return this.expressionEngine.validate(value);
    }

}
