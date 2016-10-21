import *  as _ from 'lodash'
import {ExpressionEngine} from '../expression-engine'

export class ObjectiveRule{
    name;
    expressionEngine;

    constructor(name, expressionEngine){
        this.name = name;
        this.expressionEngine = expressionEngine;
    }

    // oblicza skumulowany payoff
    computePayoff(node, payoff=0){
        throw 'computePayoff function not implemented for rule: '+this.name
    }

    // koloruje optymalne ścieżki
    computeOptimal(node){
        throw 'computeOptimal function not implemented for rule: '+this.name
    }

    /*Get or set object's computed value for current rule*/
    cValue(object, fieldName, value){
        return  object.computedValue(this.name, fieldName, value);
    }

    clearComputedValues(object){
        object.clearComputedValues(this.name);
    }

    eval(expression){
        return this.expressionEngine.eval(expression)
    }

    add(a,b){
        return ExpressionEngine.add(this.expressionEngine.eval(a),this.expressionEngine.eval(b))
    }
    subtract(a,b){
        return ExpressionEngine.subtract(this.expressionEngine.eval(a),this.expressionEngine.eval(b))
    }
    divide(a,b){
        return ExpressionEngine.divide(this.expressionEngine.eval(a),this.expressionEngine.eval(b))
    }

    multiply(a,b){
        return ExpressionEngine.multiply(this.expressionEngine.eval(a),this.expressionEngine.eval(b))
    }


}
