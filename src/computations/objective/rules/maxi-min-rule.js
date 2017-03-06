import {domain as model} from 'sd-model'
import {ObjectiveRule} from './objective-rule'
import * as _ from "lodash";

/*maxi-min rule*/
export class MaxiMinRule extends ObjectiveRule{

    static NAME = 'maxi-min';

    constructor(expressionEngine){
        super(MaxiMinRule.NAME, expressionEngine);
    }

    // payoff - parent edge payoff, aggregatedPayoff - aggregated payoff along path
    computePayoff(node, payoff=0, aggregatedPayoff=0){
        var childrenPayoff = 0;
        if (node.childEdges.length) {
            if(node instanceof model.DecisionNode) {
                var bestchild = -Infinity;
                node.childEdges.forEach(e=>{
                    var childPayoff = this.computePayoff(e.childNode, this.basePayoff(e), this.add(this.basePayoff(e), aggregatedPayoff));
                    bestchild = Math.max(bestchild, childPayoff);
                });
                node.childEdges.forEach(e=>{
                    this.clearComputedValues(e);
                    this.cValue(e, 'probability', this.cValue(e.childNode, 'payoff') < bestchild ? 0.0 : 1.0);
                });
            }else{
                var worstchild = Infinity;
                var worstCount = 1;
                node.childEdges.forEach(e=>{
                    var childPayoff = this.computePayoff(e.childNode, this.basePayoff(e), this.add(this.basePayoff(e), aggregatedPayoff));
                    if(childPayoff < worstchild){
                        worstchild = childPayoff;
                        worstCount=1;
                    }else if(childPayoff.equals(worstchild)){
                        worstCount++
                    }
                });

                node.childEdges.forEach(e=>{
                    this.clearComputedValues(e);
                    this.cValue(e, 'probability', this.cValue(e.childNode, 'payoff')>worstchild ? 0.0 : (1.0/worstCount));
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
    computeOptimal(node, payoff = 0, probabilityToEnter = 1) {
        this.cValue(node, 'optimal', true);
        if (node instanceof model.TerminalNode) {
            this.cValue(node, 'probabilityToEnter', probabilityToEnter);
        }

        var optimalEdge = null;
        if (node instanceof model.ChanceNode) {
            optimalEdge = _.minBy(node.childEdges, e=>this.cValue(e.childNode, 'payoff'));
        }

        node.childEdges.forEach(e=> {
            var isOptimal = false;
            if (optimalEdge) {
                isOptimal = this.cValue(optimalEdge.childNode, 'payoff').equals(this.cValue(e.childNode, 'payoff'));
            } else isOptimal = !!(this.subtract(this.cValue(node, 'payoff'), payoff).equals(this.cValue(e.childNode, 'payoff')) || !(node instanceof model.DecisionNode));

            if (isOptimal) {
                this.cValue(e, 'optimal', true);
                this.computeOptimal(e.childNode, this.basePayoff(e), this.multiply(probabilityToEnter, this.cValue(e, 'probability')));
            } else {
                this.cValue(e, 'optimal', false);
            }
        })
    }

}
