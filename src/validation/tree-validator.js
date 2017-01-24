import {Utils} from '../utils'
import * as model from '../model/index'
import {ValidationResult} from './validation-result'
import {ExpressionEngine} from '../expression-engine'
import {ProbabilityValueValidator} from "./probability-value-validator";
import {PayoffValueValidator} from "./payoff-value-validator";

export class TreeValidator {

    expressionEngine;

    constructor(expressionEngine) {
        this.expressionEngine = expressionEngine;
        this.probabilityValidator = new ProbabilityValueValidator(expressionEngine);
        this.payoffValidator = new PayoffValueValidator(expressionEngine);
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
            e.markAsValid('probability');
            e.markAsValid('payoff');

            if (node instanceof model.ChanceNode) {
                var probability = e.computedBaseProbability();
                if (!this.probabilityValidator.validate(probability)) {
                    if(!ExpressionEngine.isHash(e.probability)){
                        validationResult.addError({name: 'invalidProbability', data: {'number': i + 1}}, node);
                        // console.log('invalidProbability', e);
                        e.markAsInvalid('probability');
                    }

                } else {
                    probabilitySum = ExpressionEngine.add(probabilitySum, probability);
                }
            }
            var payoff = e.computedBasePayoff();
            if (!this.payoffValidator.validate(payoff)) {
                validationResult.addError({name: 'invalidPayoff', data: {'number': i + 1}}, node);
                // console.log('invalidPayoff', e);
                e.markAsInvalid('payoff');
            }


        });
        if (node instanceof model.ChanceNode) {
            if (isNaN(probabilitySum) || !probabilitySum.equals(1)) {
                validationResult.addError('probabilityDoNotSumUpTo1', node);
            }
        }


        return validationResult;
    }
}
