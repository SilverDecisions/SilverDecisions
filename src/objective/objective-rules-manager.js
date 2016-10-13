import {ExpectedValueMaximizationRule} from './expected-value-maximization-rule'


export class ObjectiveRulesManager{
    expressionEngine;
    currentRule;
    ruleByName={};

    constructor(currentRuleName, data, expressionEngine){
        this.data = data;
        this.expressionEngine=expressionEngine;
        var max = new ExpectedValueMaximizationRule(expressionEngine);
        this.ruleByName[max.name]=max;
        this.currentRule = this.ruleByName[currentRuleName];
    }

    recompute(){

        console.log('recompute');
        this.data.getRoots().forEach(n=>{
            this.recomputeTree(n);
        });

        return this;
    }

    recomputeTree(root){
        this.currentRule.computePayoff(root);
        this.currentRule.computeOptimal(root);

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
}
