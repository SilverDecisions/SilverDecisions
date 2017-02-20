import {Utils} from '../utils'
import * as model from './index'
import *  as _ from 'lodash'
import * as log from "../log"
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

    validationResults = [];

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

    getJsonReplacer(filterLocation=false, filterComputed=false, replacer){
        return function (k, v) {
            if (_.startsWith(k, '$') || k == 'parentNode') {
                return undefined;
            }
            if (filterLocation && k == 'location') {
                return undefined;
            }
            if (filterComputed && k == 'computed') {
                return undefined;
            }

            if (replacer){
                return replacer(k, v);
            }

            return v;
        }
    }

    serialize(stringify=true, filterLocation=false, filterComputed=false, replacer){
        var data =  {
            code: this.code,
            expressionScope: this.expressionScope,
            trees: this.getRoots(),
            texts: this.texts
        };

        if(!stringify){
            return data;
        }

        return Utils.stringify(data, this.getJsonReplacer(filterLocation, filterComputed, replacer));
    }

    /*Loads serialized data*/
    load(data) {
        //roots, texts, code, expressionScope
        var callbacksDisabled = this.callbacksDisabled;
        this.callbacksDisabled = true;

        data.trees.forEach(nodeData=> {
            var node = this.createNodeFromData(nodeData);
        });

        if (data.texts) {
            data.texts.forEach(textData=> {
                var location = new model.Point(textData.location.x, textData.location.y);
                var text = new model.Text(location, textData.value);
                this.texts.push(text);
            })
        }

        this.clearExpressionScope();
        this.code = data.code || '';

        if (data.expressionScope) {
            Utils.extend(this.expressionScope, data.expressionScope);
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
