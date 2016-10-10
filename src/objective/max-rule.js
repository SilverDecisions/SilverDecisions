import {Utils} from '../utils'
import * as model from '../model/index'
import {ObjectiveRule} from './objective-rule'

export class MaxRule extends ObjectiveRule{

    constructor(){
        super('max');
    }

    // payoff - parent edge payoff
    computePayoff(node, payoff=0){
        payoff=parseFloat(payoff);
        var childrenPayoff = 0;
        if (node.childEdges.length) {
            if(node instanceof model.DecisionNode) {
                var bestchild = -99999999999;
                node.childEdges.forEach(e=>{
                    var childPayoff = this.computePayoff(e.childNode, e.payoff);
                    bestchild = Math.max(bestchild, childPayoff);
                });
                node.childEdges.forEach(e=>{
                    e.probability = parseFloat(e.probability);
                    let computedValues = e.computed[this.name]={}
                    computedValues.probability = e.childNode.computed[this.name].payoff < bestchild ? 0.0 : 1.0;
                });
            }else{
                node.childEdges.forEach(e=>{
                    this.computePayoff(e.childNode, e.payoff);
                    let computedValues = e.computed[this.name] = {};
                    computedValues.probability =  parseFloat(e.probability);
                });
            }

            var sumweight = 0 ;
            node.childEdges.forEach(e=>{
                sumweight+=e.computed[this.name].probability;
            });

            // console.log(payoff,node.childEdges,'sumweight',sumweight);

            node.childEdges.forEach(e=>{
                childrenPayoff+= e.computed[this.name].probability * e.childNode.computed[this.name].payoff / sumweight;
            });

        }

        payoff+=childrenPayoff;

        let computedValues = node.computed[this.name] = {};
        computedValues.childrenPayoff = childrenPayoff;

        return computedValues.payoff = Math.round(100000*payoff)/100000;
    }

    //  payoff - parent edge payoff
    computeOptimal(node, payoff=0){

            node.childEdges.forEach(e=>{

                if ((Math.round((node.computed[this.name].payoff - payoff)*100000)/100000 == e.childNode.computed[this.name].payoff) || !(node instanceof model.DecisionNode) ) {
                    e.computed[this.name].optimal = true;
                    this.computeOptimal(e.childNode);
                }else{
                    e.computed[this.name].optimal = false;
                }
            })


    }

}
