import {ExpectedValueMaximizationRule} from './expected-value-maximization-rule'
import {MaxiMinRule} from "./maxi-min-rule";
import * as model from '../model/index'
import * as _ from "lodash";
import {MaxiMaxRule} from "./maxi-max-rule";


export class ObjectiveRulesManager{
    expressionEngine;
    currentRule;
    ruleByName={};

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

        console.log('recompute');
        this.data.getRoots().forEach(n=>{
            this.recomputeTree(n, allRules);
        });

        return this;
    }

    recomputeTree(root, allRules){
        var rules  = [this.currentRule];
        if(allRules){
            rules = this.rules;
        }

        rules.forEach(rule=> {
            rule.computePayoff(root);
            rule.computeOptimal(root);
            this.setProbabilitiesToDisplay(rule);
        });

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
                rule.cValue(e, '$probability', rule.eval(e.probability));
            }
        })
    }
}
