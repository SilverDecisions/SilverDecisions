import {domain as model} from 'sd-model'
import {ObjectiveRule} from './objective-rule'

/*expected value minimization rule*/
export class ExpectedValueMinimizationRule extends ObjectiveRule{

    static NAME = 'expected-value-minimization';

    constructor(expressionEngine){
        super(ExpectedValueMinimizationRule.NAME, expressionEngine);
    }

    // payoff - parent edge payoff, aggregatedPayoff - aggregated payoff along path
    computePayoff(node, payoff=0, aggregatedPayoff=0){
        var childrenPayoff = 0;
        if (node.childEdges.length) {
            if(node instanceof model.DecisionNode) {
                var worstchild = Infinity;
                node.childEdges.forEach(e=>{
                    var childPayoff = this.computePayoff(e.childNode, this.basePayoff(e), this.add(this.basePayoff(e), aggregatedPayoff));
                    worstchild = Math.min(worstchild, childPayoff);
                });
                node.childEdges.forEach(e=>{
                    this.clearComputedValues(e);
                    this.cValue(e, 'probability', this.cValue(e.childNode, 'payoff') > worstchild ? 0.0 : 1.0);
                });
            }else{
                node.childEdges.forEach(e=>{
                    this.computePayoff(e.childNode, this.basePayoff(e), this.add(this.basePayoff(e), aggregatedPayoff));
                    this.clearComputedValues(e);
                    this.cValue(e, 'probability', this.baseProbability(e));
                });
            }

            var sumweight = 0 ;
            node.childEdges.forEach(e=>{
                sumweight=this.add(sumweight, this.cValue(e, 'probability'));
            });

            // console.log(payoff,node.childEdges,'sumweight',sumweight);

            node.childEdges.forEach(e=>{
                childrenPayoff= this.add(childrenPayoff, this.multiply(this.cValue(e, 'probability'),this.cValue(e.childNode, 'payoff')).div(sumweight));
            });

        }

        payoff=this.add(payoff, childrenPayoff);
        this.clearComputedValues(node);

        if(node instanceof model.TerminalNode){
            this.cValue(node, 'aggregatedPayoff', aggregatedPayoff);
            this.cValue(node, 'probabilityToEnter', 0); //initial value
        }else{
            this.cValue(node, 'childrenPayoff', childrenPayoff);
        }

        return this.cValue(node, 'payoff', payoff);
    }

    //  payoff - parent edge payoff
    computeOptimal(node, payoff=0, probabilityToEnter=1){
        this.cValue(node, 'optimal', true);
        if(node instanceof model.TerminalNode){
            this.cValue(node, 'probabilityToEnter', probabilityToEnter);
        }

        node.childEdges.forEach(e=>{
            if ( this.subtract(this.cValue(node,'payoff'),payoff).equals(this.cValue(e.childNode, 'payoff')) || !(node instanceof model.DecisionNode) ) {
                this.cValue(e, 'optimal', true);
                this.computeOptimal(e.childNode, this.basePayoff(e), this.multiply(probabilityToEnter, this.cValue(e,'probability')));
            }else{
                this.cValue(e, 'optimal', false);
            }
        })
    }

}
