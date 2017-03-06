import {ExpectedValueMaximizationRule, ExpectedValueMinimizationRule, MaxiMinRule, MaxiMaxRule, MiniMinRule, MiniMaxRule} from "./rules";
import {log} from "sd-utils"
import * as model from "sd-model";

export class ObjectiveRulesManager{

    expressionEngine;
    currentRule;
    ruleByName={};

    constructor(data, expressionEngine, currentRuleName){
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
        if(currentRuleName){
            this.currentRule = this.ruleByName[currentRuleName];
        }else{
            this.currentRule = this.rules[0];
        }

    }

    isRuleName(ruleName){
         return !!this.ruleByName[ruleName]
    }

    setCurrentRuleByName(ruleName){
        this.currentRule = this.ruleByName[ruleName];
    }

    recompute(allRules){

        var startTime = new Date().getTime();
        log.trace('recomputing rules, all: '+allRules);

        this.data.getRoots().forEach(n=>{
            this.recomputeTree(n, allRules);
        });

        var time  = (new Date().getTime() - startTime/1000);
        log.trace('recomputation took '+time+'s');

        return this;
    }

    recomputeTree(root, allRules){
        log.trace('recomputing rules for tree ...', root);

        var startTime = new Date().getTime();

        var rules  = [this.currentRule];
        if(allRules){
            rules = this.rules;
        }

        rules.forEach(rule=> {
            rule.computePayoff(root);
            rule.computeOptimal(root);
        });

        var time  = (new Date().getTime() - startTime)/1000;
        log.trace('recomputation took '+time+'s');

        return this;
    }


    getNodeDisplayValue(node, name) {
        return node.computedValue(this.currentRule.name, name)

    }

    getEdgeDisplayValue(e, name){
        if(name==='probability'){
            if(e.parentNode instanceof model.domain.DecisionNode){
                return e.computedValue(this.currentRule.name, 'probability');
            }
            if(e.parentNode instanceof model.domain.ChanceNode){
                return e.computedBaseProbability();
            }
            return null;
        }
        if(name==='payoff'){
            return e.computedBasePayoff();
        }
        if(name==='optimal'){
            return e.computedValue(this.currentRule.name, 'optimal')
        }
    }
}
