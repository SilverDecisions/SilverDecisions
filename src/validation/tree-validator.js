import {Utils} from '../utils'
import * as model from '../model/index'
import {ValidationResult} from './validation-result'
import {ExpressionEngine} from '../expression-engine'

export class TreeValidator{

    expressionEngine;
    constructor(expressionEngine){
        this.expressionEngine=expressionEngine;
    }

    validate(nodes){

        var validationResult = new ValidationResult();

        nodes.forEach(n=>{
            this.validateNode(n, validationResult);
        });

        return validationResult;
    }

    validateNode(node, validationResult = new ValidationResult()){

            if(node instanceof model.TerminalNode){
                return;
            }
            if(!node.childEdges.length){
                validationResult.addError('incompletePath', node)
            }
            if(node instanceof model.ChanceNode){
                var probabilitySum = 0;
                node.childEdges.forEach(e=>{
                    probabilitySum = ExpressionEngine.add(probabilitySum, this.expressionEngine.eval(e.probability));
                });

                if(!probabilitySum || !probabilitySum.equals(1)){
                    validationResult.addError('probabilityDoNotSumUpTo1', node);
                }
            }

        return validationResult;
    }
}
