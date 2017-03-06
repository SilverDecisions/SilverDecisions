import {ExpressionEngine} from "sd-expression-engine";
import {domain as model} from '../model'
import * as _ from "lodash";
import * as log from "../log"

/*Evaluates code and expressions in trees*/
export class ExpressionsEvaluator {
    expressionEngine;
    constructor(expressionEngine){
        this.expressionEngine = expressionEngine;
    }

    clearTree(data, root){
        data.getAllNodesInSubtree(root).forEach(n=>{
            n.clearComputedValues();
            n.childEdges.forEach(e=>{
                e.clearComputedValues();
            })
        })
    }

    evalExpressions(data, evalCode=true, evalNumeric=true, initScopes=false){
        log.debug('evalExpressions evalCode:'+evalCode+' evalNumeric:'+evalNumeric);
        if(evalCode){
            this.evalGlobalCode(data);
        }

        data.getRoots().forEach(n=>{
            this.clearTree(data, n);
            this.evalExpressionsForNode(data, n, evalCode, evalNumeric,initScopes);
        });

    }

    evalGlobalCode(data){
        data.clearExpressionScope();
        data.$codeDirty = false;
        try{
            data.$codeError = null;
            this.expressionEngine.eval(data.code, false, data.expressionScope);
        }catch (e){
            data.$codeError = e;
        }
    }

    evalExpressionsForNode(data, node, evalCode=true, evalNumeric=true, initScope=false) {
        if(!node.expressionScope || initScope || evalCode){
            this.initScopeForNode(data, node);
        }
        if(evalCode){
            node.$codeDirty = false;
            if(node.code){
                try{
                    node.$codeError = null;
                    this.expressionEngine.eval(node.code, false, node.expressionScope);
                }catch (e){
                    node.$codeError = e;
                    log.debug(e);
                }
            }
        }

        if(evalNumeric){
            var scope = node.expressionScope;
            var probabilitySum=ExpressionEngine.toNumber(0);
            var hashEdges= [];
            var invalidProb = false;

            node.childEdges.forEach(e=>{
                if(e.isFieldValid('payoff', true, false)){
                    try{
                        e.computedValue(null, 'payoff', this.expressionEngine.evalPayoff(e))
                    }catch (err){
                        //   Left empty intentionally
                    }
                }

                if(node instanceof model.ChanceNode){
                    if(ExpressionEngine.isHash(e.probability)){
                        hashEdges.push(e);
                        return;
                    }

                    if(ExpressionEngine.hasAssignmentExpression(e.probability)){ //It should not occur here!
                        log.warn("evalExpressionsForNode hasAssignmentExpression!", e);
                        return null;
                    }

                    if(e.isFieldValid('probability', true, false)){
                        try{
                            var prob = this.expressionEngine.eval(e.probability, true, scope);
                            e.computedValue(null, 'probability', prob);
                            probabilitySum = ExpressionEngine.add(probabilitySum, prob);
                        }catch (err){
                            invalidProb = true;
                        }
                    }else{
                        invalidProb = true;
                    }
                }

            });


            if(node instanceof model.ChanceNode){
                var computeHash = hashEdges.length && !invalidProb && (probabilitySum.compare(0) >= 0 && probabilitySum.compare(1) <= 0);

                if(computeHash) {
                    var hash = ExpressionEngine.divide(ExpressionEngine.subtract(1, probabilitySum), hashEdges.length);
                    hashEdges.forEach(e=> {
                        e.computedValue(null, 'probability', hash);
                    });
                }
            }

            node.childEdges.forEach(e=>{
                this.evalExpressionsForNode(data, e.childNode, evalCode, evalNumeric, initScope);
            });
        }
    }

    initScopeForNode(data, node){
        var parent = node.$parent;
        var parentScope = parent?parent.expressionScope : data.expressionScope;
        node.expressionScope = _.cloneDeep(parentScope);
    }
}
