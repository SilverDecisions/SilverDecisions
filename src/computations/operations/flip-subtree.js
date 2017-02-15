import * as model from '../../model/'
import {ExpressionEngine} from '../../expression-engine'
import * as log from "../../log"
import {Operation} from "./operation";
import {TreeValidator} from "../validation/tree-validator";

/*Subtree flipping operation*/
export class FlipSubtree extends Operation{

    static $NAME = 'flipSubtree';
    data;
    expressionEngine;

    constructor(data, expressionEngine) {
        super(FlipSubtree.$NAME);
        this.data = data;
        this.expressionEngine = expressionEngine;
        this.treeValidator = new TreeValidator(expressionEngine);
    }

    isApplicable(object){
        return object instanceof model.ChanceNode
    }

    canPerform(node) {
        if (!this.isApplicable(node)) {
            return false;
        }

        if (!this.treeValidator.validate(this.data.getAllNodesInSubtree(node)).isValid()) { //check if the whole subtree is proper
            return false;
        }

        if (node.childEdges.length < 1) {
            return false;
        }


        var grandchildrenNumber = null;
        var grandchildrenEdgeLabels = [];
        var childrenEdgeLabelsSet = new Set();
        var grandchildrenEdgeLabelsSet;
        if (!node.childEdges.every(e=> {

                var child = e.childNode;
                if (!(child instanceof model.ChanceNode)) {
                    return false;
                }

                if (childrenEdgeLabelsSet.has(e.name.trim())) { // edge labels should be unique
                    return false;
                }
                childrenEdgeLabelsSet.add(e.name.trim());

                if (grandchildrenNumber === null) {
                    grandchildrenNumber = child.childEdges.length;
                    if (grandchildrenNumber < 1) {
                        return false;
                    }
                    child.childEdges.forEach(ge=> {
                        grandchildrenEdgeLabels.push(ge.name.trim());
                    });

                    grandchildrenEdgeLabelsSet = new Set(grandchildrenEdgeLabels);

                    if (grandchildrenEdgeLabelsSet.size !== grandchildrenEdgeLabels.length) { //grandchildren edge labels should be unique
                        return false;
                    }

                    return true;
                }

                if (child.childEdges.length != grandchildrenNumber) {
                    return false;
                }

                if (!child.childEdges.every((ge, i)=>grandchildrenEdgeLabels[i] === ge.name.trim())) {
                    return false;
                }

                return true;

            })) {

            return false;
        }

        return true;
    }

    perform(root) {

        var rootClone = this.data.cloneSubtree(root, true);
        var oldChildrenNumber = root.childEdges.length;
        var oldGrandChildrenNumber = root.childEdges[0].childNode.childEdges.length;

        var childrenNumber = oldGrandChildrenNumber;
        var grandChildrenNumber = oldChildrenNumber;

        var callbacksDisabled = this.data.callbacksDisabled;
        this.data.callbacksDisabled = true;


        var childX = root.childEdges[0].childNode.location.x;
        var topY = root.childEdges[0].childNode.childEdges[0].childNode.location.y;
        var bottomY = root.childEdges[oldChildrenNumber - 1].childNode.childEdges[oldGrandChildrenNumber - 1].childNode.location.y;

        var extentY = bottomY - topY;
        var stepY = extentY / (childrenNumber + 1);

        root.childEdges.slice().forEach(e=> this.data.removeNode(e.childNode));


        for (var i = 0; i < childrenNumber; i++) {
            var child = new model.ChanceNode(new model.Point(childX, topY + (i + 1) * stepY));
            var edge = this.data.addNode(child, root);
            edge.name = rootClone.childEdges[0].childNode.childEdges[i].name;

            edge.probability = 0;

            for (var j = 0; j < grandChildrenNumber; j++) {
                var grandChild = rootClone.childEdges[j].childNode.childEdges[i].childNode;


                var grandChildEdge = this.data.attachSubtree(grandChild, child);
                grandChildEdge.name = rootClone.childEdges[j].name;
                grandChildEdge.payoff = ExpressionEngine.add(rootClone.childEdges[j].computedBasePayoff(), rootClone.childEdges[j].childNode.childEdges[i].computedBasePayoff());

                grandChildEdge.probability = ExpressionEngine.multiply(rootClone.childEdges[j].computedBaseProbability(), rootClone.childEdges[j].childNode.childEdges[i].computedBaseProbability());
                edge.probability = ExpressionEngine.add(edge.probability, grandChildEdge.probability);
            }

            var divideGrandChildEdgeProbability = p => ExpressionEngine.divide(p, edge.probability);
            if (edge.probability.equals(0)) {
                var prob = ExpressionEngine.divide(1, grandChildrenNumber);
                divideGrandChildEdgeProbability = p => prob;
            }

            var probabilitySum = 0.0;
            child.childEdges.forEach(grandChildEdge=> {
                grandChildEdge.probability = divideGrandChildEdgeProbability(grandChildEdge.probability);
                probabilitySum = ExpressionEngine.add(probabilitySum, grandChildEdge.probability);
                grandChildEdge.probability = this.expressionEngine.serialize(grandChildEdge.probability)
            });

            this._normalizeProbabilitiesAfterFlip(child.childEdges, probabilitySum);
            edge.probability = this.expressionEngine.serialize(edge.probability)
        }
        this._normalizeProbabilitiesAfterFlip(root.childEdges);


        this.data.callbacksDisabled = callbacksDisabled;
        this.data._fireNodeAddedCallback();
    }

    _normalizeProbabilitiesAfterFlip(childEdges, probabilitySum){
        if(!probabilitySum){
            probabilitySum = 0.0;
            childEdges.forEach(e=> {
                probabilitySum = ExpressionEngine.add(probabilitySum, e.probability);
            });
        }
        if (!probabilitySum.equals(1)) {
            log.info('Sum of the probabilities in child nodes is not equal to 1 : ', probabilitySum);
            var newProbabilitySum = 0.0;
            var cf = 1000000000000; //10^12
            var prec = 12;
            childEdges.forEach(e=> {
                e.probability = parseInt(ExpressionEngine.round(e.probability, prec) * cf);
                newProbabilitySum = newProbabilitySum + e.probability;
            });
            var rest = cf - newProbabilitySum;
            log.info('Normalizing with rounding to precision: ' + prec, rest);
            childEdges[0].probability = ExpressionEngine.add(rest, childEdges[0].probability);
            newProbabilitySum = 0.0;
            childEdges.forEach(e=> {
                e.probability = this.expressionEngine.serialize(ExpressionEngine.divide(parseInt(e.probability), cf))
            })
        }
    }
}
