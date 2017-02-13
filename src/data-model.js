import {Utils} from './utils'
import * as model from './model/index'
import *  as _ from 'lodash'
import {ExpressionEngine} from './expression-engine'
import * as log from "./log"
/*
 * Data model manager
 * */
export class DataModel {

    nodes = [];
    edges = [];

    texts = []; //floating texts

    expressionScope = {}; //global expression scope
    code = "";//global expression code
    $codeError = null; //code evaluation errors
    $codeDirty = false; // is code changed without reevaluation?

    // undo / redo
    maxStackSize = 20;
    undoStack = [];
    redoStack = [];
    undoRedoStateChangedCallback = null;
    nodeAddedCallback = null;
    nodeRemovedCallback = null;

    textAddedCallback = null;
    textRemovedCallback = null;

    callbacksDisabled = false;

    constructor() {

    }

    setTreeValidator(treeValidator) {
        this.treeValidator = treeValidator;
    }

    setExpressionEngine(expressionEngine) {
        this.expressionEngine = expressionEngine;
    }

    /*Loads serialized data*/
    load(roots, texts, code, expressionScope) {
        var callbacksDisabled = this.callbacksDisabled;
        this.callbacksDisabled = true;

        roots.forEach(nodeData=> {
            var node = this.createNodeFromData(nodeData);
        });

        if (texts) {
            texts.forEach(textData=> {
                var location = new model.Point(textData.location.x, textData.location.y);
                var text = new model.Text(location, textData.value);
                this.texts.push(text);
            })
        }

        this.clearExpressionScope();
        this.code = code || '';

        if (expressionScope) {
            Utils.extend(this.expressionScope, expressionScope);
        }
        this.callbacksDisabled = callbacksDisabled;
    }

    /*create node from serialized data*/
    createNodeFromData(data, parent) {
        var node;
        var location = new model.Point(data.location.x, data.location.y);
        if (model.DecisionNode.$TYPE == data.type) {
            node = new model.DecisionNode(location);
        } else if (model.ChanceNode.$TYPE == data.type) {
            node = new model.ChanceNode(location);
        } else if (model.TerminalNode.$TYPE == data.type) {
            node = new model.TerminalNode(location);
        }
        node.name = data.name;

        if(data.code){
            node.code = data.code;
        }
        if (data.expressionScope) {
            node.expressionScope = data.expressionScope
        }

        var edgeOrNode = this.addNode(node, parent);
        data.childEdges.forEach(ed=> {
            var edge = this.createNodeFromData(ed.childNode, node);
            edge.payoff = ed.payoff;
            edge.probability = ed.probability;
            edge.name = ed.name;
        });

        return edgeOrNode;
    }

    /*returns node or edge from parent to this node*/
    addNode(node, parent) {
        var self = this;
        self.nodes.push(node);
        if (parent) {
            var edge = self._addChild(parent, node);
            this._fireNodeAddedCallback(node);
            return edge;
        }

        this._fireNodeAddedCallback(node);
        return node;
    }

    /*injects given node into given edge*/
    injectNode(node, edge) {
        var parent = edge.parentNode;
        var child = edge.childNode;
        this.nodes.push(node);
        node.$parent = parent;
        edge.childNode = node;
        this._addChild(node, child);
        this._fireNodeAddedCallback(node);
    }

    _addChild(parent, child) {
        var self = this;
        var edge = new model.Edge(parent, child);
        self._setEdgeInitialProbability(edge);
        self.edges.push(edge);

        parent.childEdges.push(edge);
        child.$parent = parent;
        return edge;
    }

    _setEdgeInitialProbability(edge) {
        if (edge.parentNode instanceof model.ChanceNode) {
            edge.probability = '#';
        } else {
            edge.probability = undefined;
        }

    }

    /*removes given node and its subtree*/
    removeNode(node, $l = 0) {

        var self = this;
        node.childEdges.forEach(e=>self.removeNode(e.childNode, $l + 1));

        self._removeNode(node);
        var parent = node.$parent;
        if (parent) {
            var parentEdge = _.find(parent.childEdges, (e, i)=> e.childNode === node);
            if ($l == 0) {
                self.removeEdge(parentEdge);
            } else {
                self._removeEdge(parentEdge);
            }
        }
        this._fireNodeRemovedCallback(node);
    }

    /*removes given nodes and their subtrees*/
    removeNodes(nodes) {

        var roots = this.findSubtreeRoots(nodes);
        roots.forEach(n=>this.removeNode(n, 0), this);
    }

    convertNode(node, typeToConvertTo){
        var newNode;
        if(!node.childEdges.length && node.$parent){
            newNode = this.createNodeByType(typeToConvertTo, node.location);
        }else{
            if(node instanceof model.DecisionNode && typeToConvertTo==model.ChanceNode.$TYPE){
                newNode = this.createNodeByType(typeToConvertTo, node.location);
            }else if(typeToConvertTo==model.DecisionNode.$TYPE){
                newNode = this.createNodeByType(typeToConvertTo, node.location);
            }
        }

        if(newNode){
            newNode.name=node.name;
            this.replaceNode(newNode, node);
            newNode.childEdges.forEach(e=>this._setEdgeInitialProbability(e));
            this._fireNodeAddedCallback(newNode);
        }

    }

    createNodeByType(type, location){
        if(type==model.DecisionNode.$TYPE){
            return new model.DecisionNode(location)
        }else if(type==model.ChanceNode.$TYPE){
            return new model.ChanceNode(location)
        }else if(type==model.TerminalNode.$TYPE){
            return new model.TerminalNode(location)
        }
    }

    replaceNode(newNode, oldNode){
        var parent = oldNode.$parent;
        newNode.$parent = parent;

        if(parent){
            var parentEdge = _.find(newNode.$parent.childEdges, e=>e.childNode===oldNode);
            parentEdge.childNode = newNode;
        }

        newNode.childEdges = oldNode.childEdges;
        newNode.childEdges.forEach(e=>e.parentNode=newNode);

        var index = this.nodes.indexOf(oldNode);
        if(~index){
            this.nodes[index]=newNode;
        }
    }

    getRoots() {
        return this.nodes.filter(n=>!n.$parent);
    }

    findSubtreeRoots(nodes) {
        return nodes.filter(n=>!n.$parent || nodes.indexOf(n.$parent) === -1);
    }

    /*creates detached clone of given node*/
    cloneSubtree(nodeToCopy, cloneComputedValues) {
        var self = this;
        var clone = this.cloneNode(nodeToCopy);

        nodeToCopy.childEdges.forEach(e=> {
            var childClone = self.cloneSubtree(e.childNode, cloneComputedValues);
            childClone.$parent = clone;
            var edge = new model.Edge(clone, childClone, e.name, e.payoff, e.probability);
            if (cloneComputedValues) {
                edge.computed = _.cloneDeep(e.computed)
                childClone.computed = _.cloneDeep(e.childNode.computed)
            }
            clone.childEdges.push(edge);
        });
        if (cloneComputedValues) {
            clone.computed = _.cloneDeep(nodeToCopy.computed)
        }
        return clone;
    }

    /*attaches detached subtree to given parent*/
    attachSubtree(nodeToAttach, parent) {
        var self = this;
        var nodeOrEdge = self.addNode(nodeToAttach, parent);

        var childEdges = self.getAllDescendantEdges(nodeToAttach);
        childEdges.forEach(e=> {
            self.edges.push(e);
            self.nodes.push(e.childNode);
        });

        return nodeOrEdge;
    }

    cloneNodes(nodes) {
        var roots = []
        //TODO
    }

    /*shallow clone without parent and children*/
    cloneNode(node) {
        var clone = _.clone(node)
        clone.$id = Utils.guid();
        clone.location = _.clone(node.location);
        clone.computed = _.clone(node.computed);
        clone.$parent = null;
        clone.childEdges = [];
        return clone;
    }

    findNodeById(id) {
        return _.find(this.nodes, n=>n.$id == id);
    }

    findEdgeById(id) {
        return _.find(this.edges, e=>e.$id == id);
    }

    findById(id) {
        var node = this.findNodeById(id);
        if (node) {
            return node;
        }
        return this.findEdgeById(id);
    }

    _removeNode(node) {// simply removes node from node list
        var index = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
        }
    }

    removeEdge(edge) {
        var index = edge.parentNode.childEdges.indexOf(edge);
        if (index > -1) {
            edge.parentNode.childEdges.splice(index, 1);
        }
        this._removeEdge(edge);
    }

    _removeEdge(edge) { //removes edge from edge list without removing connected nodes
        var index = this.edges.indexOf(edge);
        if (index > -1) {
            this.edges.splice(index, 1);
        }
    }

    _removeNodes(nodesToRemove) {
        this.nodes = this.nodes.filter(n=>nodesToRemove.indexOf(n) === -1);
    }

    _removeEdges(edgesToRemove) {
        this.edges = this.edges.filter(e=>edgesToRemove.indexOf(e) === -1);
    }

    getAllDescendantEdges(node) {
        var self = this;
        var result = [];

        node.childEdges.forEach(e=> {
            result.push(e);
            if (e.childNode) {
                result.push(...self.getAllDescendantEdges(e.childNode));
            }
        });

        return result;
    }

    getAllDescendantNodes(node) {
        var self = this;
        var result = [];

        node.childEdges.forEach(e=> {
            if (e.childNode) {
                result.push(e.childNode);
                result.push(...self.getAllDescendantNodes(e.childNode));
            }
        });

        return result;
    }

    getAllNodesInSubtree(node) {
        var descendants = this.getAllDescendantNodes(node);
        descendants.unshift(node);
        return descendants;
    }

    isUndoAvailable() {
        return !!this.undoStack.length
    }

    isRedoAvailable() {
        return !!this.redoStack.length
    }

    createStateSnapshot(revertConf){
        return {
            revertConf: revertConf,
            nodes: _.cloneDeep(this.nodes),
            edges: _.cloneDeep(this.edges),
            texts: _.cloneDeep(this.texts),
            expressionScope: _.cloneDeep(this.expressionScope),
            code: this.code,
            $codeError: this.$codeError
        }
    }


    saveStateFromSnapshot(state){
        this.redoStack.length = 0;

        this._pushToStack(this.undoStack, state);

        this._fireUndoRedoCallback();

        return this;
    }

    saveState(revertConf) {
        this.saveStateFromSnapshot(this.createStateSnapshot(revertConf));
        return this;
    }

    undo() {
        var self = this;
        var newState = this.undoStack.pop();
        if (!newState) {
            return;
        }

        this._pushToStack(this.redoStack, {
            revertConf: newState.revertConf,
            nodes: self.nodes,
            edges: self.edges,
            texts: self.texts,
            expressionScope: self.expressionScope,
            code: self.code,
            $codeError: self.$codeError

        });

        this._setNewState(newState);

        this._fireUndoRedoCallback();

        return this;
    }

    redo() {
        var self = this;
        var newState = this.redoStack.pop();
        if (!newState) {
            return;
        }

        this._pushToStack(this.undoStack, {
            revertConf: newState.revertConf,
            nodes: self.nodes,
            edges: self.edges,
            texts: self.texts,
            expressionScope: self.expressionScope,
            code: self.code,
            $codeError: self.$codeError
        });

        this._setNewState(newState, true);

        this._fireUndoRedoCallback();

        return this;
    }

    clear() {
        this.nodes.length = 0;
        this.edges.length = 0;
        this.undoStack.length = 0;
        this.redoStack.length = 0;
        this.texts.length = 0;
        this.clearExpressionScope();
        this.code = '';
        this.$codeError = null;
        this.$codeDirty = false;
    }

    addText(text) {
        this.texts.push(text);

        this._fireTextAddedCallback(text);
    }

    removeTexts(texts) {
        texts.forEach(t=>this.removeText(t));
    }

    removeText(text) {
        var index = this.texts.indexOf(text);
        if (index > -1) {
            this.texts.splice(index, 1);
            this._fireTextRemovedCallback(text);
        }
    }

    canFlipSubTree(node) {
        if (!(node instanceof model.ChanceNode)) {
            return false;
        }

        if (!this.treeValidator.validate(this.getAllNodesInSubtree(node)).isValid()) { //check if the whole subtree is proper
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

    flipSubTree(root) {

        var rootClone = this.cloneSubtree(root, true);
        var oldChildrenNumber = root.childEdges.length;
        var oldGrandChildrenNumber = root.childEdges[0].childNode.childEdges.length;

        var childrenNumber = oldGrandChildrenNumber;
        var grandChildrenNumber = oldChildrenNumber;

        var callbacksDisabled = this.callbacksDisabled;
        this.callbacksDisabled = true;


        var childX = root.childEdges[0].childNode.location.x;
        var topY = root.childEdges[0].childNode.childEdges[0].childNode.location.y;
        var bottomY = root.childEdges[oldChildrenNumber - 1].childNode.childEdges[oldGrandChildrenNumber - 1].childNode.location.y;

        var extentY = bottomY - topY;
        var stepY = extentY / (childrenNumber + 1);

        root.childEdges.slice().forEach(e=> this.removeNode(e.childNode));


        for (var i = 0; i < childrenNumber; i++) {
            var child = new model.ChanceNode(new model.Point(childX, topY + (i + 1) * stepY));
            var edge = this.addNode(child, root);
            edge.name = rootClone.childEdges[0].childNode.childEdges[i].name;

            edge.probability = 0;

            for (var j = 0; j < grandChildrenNumber; j++) {
                var grandChild = rootClone.childEdges[j].childNode.childEdges[i].childNode;


                var grandChildEdge = this.attachSubtree(grandChild, child);
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


        this.callbacksDisabled = callbacksDisabled;
        this._fireNodeAddedCallback();
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

    clearExpressionScope() {
        _.forOwn(this.expressionScope, (value, key)=> {
            delete this.expressionScope[key];
        });
    }

    _setNewState(newState, redo) {
        var nodeById = Utils.getObjectByIdMap(newState.nodes);
        var edgeById = Utils.getObjectByIdMap(newState.edges);
        this.nodes = newState.nodes;
        this.edges = newState.edges;
        this.texts = newState.texts;
        this.expressionScope = newState.expressionScope;
        this.expressionEngine.setScope(this.expressionScope);
        this.code = newState.code;
        this.$codeError  = newState.$codeError

        this.nodes.forEach(n=> {
            for (var i = 0; i < n.childEdges.length; i++) {
                var edge = edgeById[n.childEdges[i].$id];
                n.childEdges[i] = edge;
                edge.parentNode = n;
                edge.childNode = nodeById[edge.childNode.$id];
            }

        });

        if (newState.revertConf) {
            if (!redo && newState.revertConf.onUndo) {
                newState.revertConf.onUndo(newState.revertConf.data);
            }
            if (redo && newState.revertConf.onRedo) {
                newState.revertConf.onRedo(newState.revertConf.data);
            }


        }
        this.revertConf = newState.revertConf;
    }


    _pushToStack(stack, obj) {
        if (stack.length >= this.maxStackSize) {
            stack.shift();
        }
        stack.push(obj);
    }

    _fireUndoRedoCallback() {
        if (!this.callbacksDisabled && this.undoRedoStateChangedCallback) {
            this.undoRedoStateChangedCallback();
        }
    }

    _fireNodeAddedCallback(node) {
        if (!this.callbacksDisabled && this.nodeAddedCallback) {
            this.nodeAddedCallback(node);
        }
    }

    _fireNodeRemovedCallback(node) {
        if (!this.callbacksDisabled && this.nodeRemovedCallback) {
            this.nodeRemovedCallback(node);
        }
    }

    _fireTextAddedCallback(text) {
        if (!this.callbacksDisabled && this.textAddedCallback) {
            this.textAddedCallback(text);
        }
    }

    _fireTextRemovedCallback(text) {
        if (!this.callbacksDisabled && this.textRemovedCallback) {
            this.textRemovedCallback(text);
        }
    }
}
