import {ExpectedValueMaximizationRule} from './expected-value-maximization-rule'
import {MaxiMinRule} from "./maxi-min-rule";
import {MaxiMaxRule} from "./maxi-max-rule";
import {ExpectedValueMinimizationRule} from './expected-value-minimization-rule'
import {MiniMinRule} from "./mini-min-rule";
import {MiniMaxRule} from "./mini-max-rule";
import * as model from '../model/index'
import * as _ from "lodash";
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
        var min = new ExpectedValueMinimizationRule(expressionEngine);
        var miniMin = new MiniMinRule(expressionEngine);
        var miniMax = new MiniMaxRule(expressionEngine);
        this.ruleByName[max.name]=max;
        this.ruleByName[maxiMin.name]=maxiMin;
        this.ruleByName[maxiMax.name]=maxiMax;
        this.ruleByName[min.name]=min;
        this.ruleByName[miniMin.name]=miniMin;
        this.ruleByName[miniMax.name]=miniMax;
        this.rules = [max, min, maxiMin, maxiMax, miniMin, miniMax];
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
            this.evalExpressions();
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
            this.evalExpressions();
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


    evalExpressions(evalCode=true, evalNumeric=true, initScopes=false){
        console.log('evalExpressions evalCode:'+evalCode+' evalNumeric:'+evalNumeric);
        if(evalCode){
            this.data.clearExpressionScope();
            this.data.$codeDirty = false;
            try{
                this.data.$codeError = null;
                this.expressionEngine.eval(this.data.code, false, this.data.expressionScope);
            }catch (e){
                this.data.$codeError = e;
                // console.log(e);
            }
        }

        this.data.getRoots().forEach(n=>{
            this.clearTree(n);
            this.evalExpressionsForNode(n, evalCode, evalNumeric,initScopes);
        });

    }

    evalExpressionsForNode(node, evalCode=true, evalNumeric=true, initScope=false) {
        if(!node.expressionScope || initScope || evalCode){
            this.initScopeForNode(node);
        }
        if(evalCode){
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
        }

        if(evalNumeric){
            var scope = node.expressionScope;
            var probabilitySum=ExpressionEngine.toNumber(0);
            var hashEdges= [];
            var invalidProb = false;

            node.childEdges.forEach(e=>{
                try{
                    e.computedValue(null, 'payoff', this.expressionEngine.evalPayoff(e))
                }catch (e){

                }

                if(node instanceof model.ChanceNode){
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
                        invalidProb = true;
                    }
                }

            });


            if(node instanceof model.ChanceNode){
                var computeHash = hashEdges.length && !invalidProb && (probabilitySum.compare(0) >= 0 && probabilitySum.compare(1) <= 0);

                if(computeHash) {
                    var hash = ExpressionEngine.divide(ExpressionEngine.subtract(1, probabilitySum), hashEdges.length);
                    // console.log(probabilitySum.toString(), hash.toString());
                    hashEdges.forEach(e=> {
                        e.computedValue(null, 'probability', hash);
                    });
                }
            }

            node.childEdges.forEach(e=>{
                this.evalExpressionsForNode(e.childNode, evalCode, evalNumeric, initScope);
            });
        }
    }

    initScopeForNode(node){
        var parent = node.$parent;
        var parentScope = parent?parent.expressionScope : this.data.expressionScope;
        node.expressionScope = _.cloneDeep(parentScope);
    }
}
