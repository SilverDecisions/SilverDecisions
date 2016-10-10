import {MaxRule} from './max-rule'


export class ObjectiveRulesManager{

    currentRule;
    ruleByName={};

    constructor(currentRuleName, data){
        this.data = data;
        var max = new MaxRule();
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
