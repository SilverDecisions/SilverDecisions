import {MaxRule} from './max-rule'


export class ObjectiveRulesManager{
    expressionEngine;
    currentRule;
    ruleByName={};

    constructor(currentRuleName, data, expressionEngine){
        this.data = data;
        this.expressionEngine=expressionEngine;
        var max = new MaxRule(expressionEngine);
        this.ruleByName[max.name]=max;
        this.currentRule = this.ruleByName[currentRuleName];
    }

    recompute(){
        console.log('recompute');
        this.data.getRoots().forEach(n=>{
            this.currentRule.computePayoff(n);
            this.currentRule.computeOptimal(n);
        });

        return this;
    }
}
