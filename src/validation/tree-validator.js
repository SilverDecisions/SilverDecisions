import {Utils} from '../utils'
import * as model from '../model/index'
import {ValidationResult} from './validation-result'
import {ExpressionEngine} from '../expression-engine'

export class TreeValidator{

    static validate(nodes){

        var validationResult = new ValidationResult();

        nodes.forEach(n=>{
            TreeValidator.validateNode(n, validationResult);
        });

        return validationResult;
    }

    static validateNode(node, validationResult = new ValidationResult()){

            if(node instanceof model.TerminalNode){
                return;
            }
            if(!node.childEdges.length){
                validationResult.addError('incompletePath', node)
            }
            if(node instanceof model.ChanceNode){
                var probabilitySum = 0;
                node.childEdges.forEach(e=>{
                    probabilitySum = ExpressionEngine.add(probabilitySum, e.probability);
                });

                if(!probabilitySum || !probabilitySum.equals(1)){
                    validationResult.addError('probabilityDoNotSumUpTo1', node);
                }
            }

        return validationResult;
    }
}
