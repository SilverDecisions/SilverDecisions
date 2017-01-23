import {Utils} from '../utils'
import * as model from '../model/index'
import {ValidationResult} from './validation-result'
import {ExpressionEngine} from '../expression-engine'
import {ProbabilityValidator} from "./probability-validator";
import {PayoffValidator} from "./payoff-validator";

export class TreeValidator {

    expressionEngine;

    constructor(expressionEngine) {
        this.expressionEngine = expressionEngine;
        this.probabilityValidator = new ProbabilityValidator(expressionEngine);
    }

    validate(nodes) {

        var validationResult = new ValidationResult();

        nodes.forEach(n=> {
            this.validateNode(n, validationResult);
        });

        return validationResult;
    }

    validateNode(node, validationResult = new ValidationResult()) {

        if (node instanceof model.TerminalNode) {
            return;
        }
        if (!node.childEdges.length) {
            validationResult.addError('incompletePath', node)
        }

        var probabilitySum = ExpressionEngine.toNumber(0);
        var withHash = false;
        node.childEdges.forEach((e, i)=> {

            if (node instanceof model.ChanceNode) {
                var valid = true;
                var probability = e.computedValue(null, 'probability');

                if (probability === null && !ExpressionEngine.isHash(e.probability)) {
                    validationResult.addError({name: 'invalidProbability', data: {'number': i + 1}}, node);
                    console.log('invalidProbability', e);
                } else {
                    if (ExpressionEngine.isHash(e.probability)) {
                        withHash = true;
                    } else {
                        probabilitySum = ExpressionEngine.add(probabilitySum, probability);
                    }
                }
            }
            var payoff = e.computedValue(null, 'payoff');
            if (payoff === null || payoff == undefined) {
                validationResult.addError({name: 'invalidPayoff', data: {'number': i + 1}}, node);
                console.log('invalidPayoff', e);
            }


        });
        if (node instanceof model.ChanceNode) {
            if (isNaN(probabilitySum) || !(probabilitySum.equals(1) || withHash && ExpressionEngine.compare(probabilitySum, 1) <= 0)) {
                validationResult.addError('probabilityDoNotSumUpTo1', node);
            }
        }


        return validationResult;
    }
}
