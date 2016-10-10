import *  as _ from 'lodash'
import * as math from 'mathjs'

export class ObjectiveRule{
    name;
    expressionEngine;

    constructor(name, expressionEngine){
        this.name = name;
        this.expressionEngine = expressionEngine;
        math.config({
            number: 'Fraction'
        });
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
        return this.expressionEngine.add(a,b)
    }
    subtract(a,b){
        return this.expressionEngine.subtract(a,b)
    }
    divide(a,b){
        return this.expressionEngine.divide(a,b)
    }

    multiply(a,b){
        return this.expressionEngine.multiply(a,b)
    }


}
