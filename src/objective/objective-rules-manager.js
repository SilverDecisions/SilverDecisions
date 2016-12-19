import {ExpectedValueMaximizationRule} from './expected-value-maximization-rule'
import {MaxiMinRule} from "./maxi-min-rule";
import * as model from '../model/index'
import * as _ from "lodash";
import {MaxiMaxRule} from "./maxi-max-rule";


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

    recompute(allRules){

        var startTime = new Date().getTime();
        if(this.$debug){
            console.log('recomputing rules ...')
        }


        this.evalExpressions();
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

    recomputeTree(root, allRules){
        if(this.$debug) {
            console.log('recomputing rules for tree ...', root)
        }
        var startTime = new Date().getTime();

        this.evalExpressions();

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
        this.data.edges.forEach(e=>{
            if(e.parentNode instanceof model.DecisionNode){
                rule.cValue(e, '$probability', rule.cValue(e, 'probability'));
            }else if(e.parentNode instanceof model.ChanceNode){
                rule.cValue(e, '$probability', e.computedValue(null ,'probability'));
            }
        })
    }

    evalExpressions() {
        this.data.edges.forEach(e=>{
            var probability;
            if(e.parentNode instanceof model.ChanceNode){
                e.computedValue(null, 'probability', this.expressionEngine.evalProbability(e));
            }
            e.computedValue(null, 'payoff', this.expressionEngine.eval(e.payoff))
        })
    }
}
