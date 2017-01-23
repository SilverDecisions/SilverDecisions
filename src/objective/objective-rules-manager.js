import {ExpectedValueMaximizationRule} from './expected-value-maximization-rule'
import {MaxiMinRule} from "./maxi-min-rule";
import * as model from '../model/index'
import * as _ from "lodash";
import {MaxiMaxRule} from "./maxi-max-rule";
import {ExpressionEngine} from "../expression-engine";


export class ObjectiveRulesManager{
    expressionEngine;
    currentRule;
    ruleByName={};

    $debug = false;

    constructor(currentRuleName, data, expressionEngine){
        this.data = data;
        this.expressionEngine=expressionEngine;
        var max = new ExpectedValueMaximizationRule(expressionEngine);
        var maxiMin = new MaxiMinRule(expressionEngine);
        var maxiMax = new MaxiMaxRule(expressionEngine);
        this.ruleByName[max.name]=max;
        this.ruleByName[maxiMin.name]=maxiMin;
        this.ruleByName[maxiMax.name]=maxiMax;
        this.rules = [max, maxiMin, maxiMax];
        this.currentRule = this.ruleByName[currentRuleName];
    }

    isRuleName(ruleName){
         return !!this.ruleByName[ruleName]
    }

    setCurrentRuleByName(ruleName){
        this.currentRule = this.ruleByName[ruleName];
    }

    recompute(allRules, reevaluateExpressions=false){

        var startTime = new Date().getTime();
        if(this.$debug){
            console.log('recomputing rules ...')
        }


        if(reevaluateExpressions){
            this.evalNumericExpressions();
        }

        this.data.getRoots().forEach(n=>{
            this.recomputeTree(n, allRules);
        });

        if(this.$debug){
            var time  = new Date().getTime() - startTime;
            time = time/1000
            console.log('recomputation took '+time+'s');
        }

        return this;
    }

    recomputeTree(root, allRules, reevaluateExpressions=false){
        if(this.$debug) {
            console.log('recomputing rules for tree ...', root)
        }
        var startTime = new Date().getTime();

        if(reevaluateExpressions){
            this.evalNumericExpressions();
        }

        var rules  = [this.currentRule];
        if(allRules){
            rules = this.rules;
        }

        rules.forEach(rule=> {
            rule.computePayoff(root);
            rule.computeOptimal(root);
            this.setProbabilitiesToDisplay(rule);
        });
        if(this.$debug){
            var time  = new Date().getTime() - startTime;
            time = time/1000;
            console.log('recomputation took '+time+'s');
        }
        return this;
    }

    clearTree(root){
        this.data.getAllNodesInSubtree(root).forEach(n=>{
            n.clearComputedValues();
            n.childEdges.forEach(e=>{
                e.clearComputedValues();
            })
        })
    }

    setProbabilitiesToDisplay(rule) {
        if(!rule){
            rule = this.currentRule
        }
        this.data.edges.forEach(e=>{
            if(e.parentNode instanceof model.DecisionNode){
                rule.cValue(e, '$probability', rule.cValue(e, 'probability'));
            }else if(e.parentNode instanceof model.ChanceNode){
                rule.cValue(e, '$probability', e.computedValue(null ,'probability'));
            }
        })
    }

    /*Evaluates probability and payoff expressions*/
    evalNumericExpressions(initScopes=false) {
        // console.log("evalNumericExpressions");
        this.data.getRoots().forEach(n=>{
            this.clearTree(n);
            this.evalNumericExpressionsForNode(n, initScopes);
        });
    }

    /*Evaluates code expressions*/
    evalCodeExpressions() {
        this.data.clearExpressionScope();
        this.data.$codeDirty = false;
        try{
            this.data.$codeError = null;
            this.expressionEngine.eval(this.data.code, false, this.data.expressionScope);
        }catch (e){
            this.data.$codeError = e;
            // console.log(e);
        }
        this.data.getRoots().forEach(n=>{
            this.evalCodeExpressionsForNode(n);
        });

    }

    evalCodeExpressionsForNode(node) {
        this.initScopeForNode(node);
        node.$codeDirty = false;
        if(node.code){
            try{
                node.$codeError = null;
                this.expressionEngine.eval(node.code, false, node.expressionScope);
            }catch (e){
                node.$codeError = e;
                console.log(e);
            }
        }

        node.childEdges.forEach(e=>{
            this.evalCodeExpressionsForNode(e.childNode);
        })
    }

    initScopeForNode(node){
        var parent = node.$parent;
        var parentScope = parent?parent.expressionScope : this.data.expressionScope;
        node.expressionScope = _.cloneDeep(parentScope);
    }

    evalNumericExpressionsForNode(node, initScope=false) {
        if(!node.expressionScope || initScope){
            this.initScopeForNode(node);
        }
        var scope = node.expressionScope;
        if(node instanceof model.ChanceNode){

            var probabilitySum=ExpressionEngine.toNumber(0);
            var hashEdges= [];
            var invalid = false;
            node.childEdges.forEach(e=>{
                if(ExpressionEngine.isHash(e.probability)){
                    hashEdges.push(e);
                    return;
                }

                if(ExpressionEngine.hasAssignmentExpression(e.probability)){ //It should not occur here!
                    console.log("hasAssignmentExpression!!!!");
                    return null;
                }

                try{
                    var prob = this.expressionEngine.eval(e.probability, true, scope);
                    e.computedValue(null, 'probability', prob);
                    probabilitySum = ExpressionEngine.add(probabilitySum, prob);
                }catch (e){
                    invalid = true;
                }

            });

            if(!invalid && hashEdges.length) {
                var hash = ExpressionEngine.divide(ExpressionEngine.subtract(1, probabilitySum), hashEdges.length);
                // console.log(probabilitySum.toString(), hash.toString());
                hashEdges.forEach(e=> {
                    e.computedValue(null, 'probability', hash);
                });
            }

        }

        node.childEdges.forEach(e=>{
            try{
                e.computedValue(null, 'payoff', this.expressionEngine.evalPayoff(e))
            }catch (e){
                // console.log("evalNumericExpressionsForNode payoff",e);
            }

            this.evalNumericExpressionsForNode(e.childNode, initScope);
        })
    }
}
