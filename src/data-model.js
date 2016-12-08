import {Utils} from './utils'
import * as model from './model/index'
import *  as _ from 'lodash'
import {ExpressionEngine} from './expression-engine'

/*
* Data model manager
* */
export class DataModel {

    nodes = [];
    edges = [];

    texts = []; //floating texts

    expressionScope={};

    // undo / redo
    maxStackSize = 15;
    undoStack = [];
    redoStack =[];
    undoRedoStateChangedCallback = null;
    nodeAddedCallback = null;
    nodeRemovedCallback = null;

    textAddedCallback=null;
    textRemovedCallback = null;

    callbacksDisabled=false;

    constructor() {

        // var n1 = this.addNode(new model.DecisionNode(new model.Point(100,150))).setName('dilemma');
        // var n2 = this.addNode(new model.ChanceNode(new model.Point(250,100)), n1).setName('play').setPayoff(-1).childNode;
        // var n3 = this.addNode(new model.TerminalNode(new model.Point(250,200)), n1).setName('leave game').setPayoff(0).childNode;
        // var n4 = this.addNode(new model.TerminalNode(new model.Point(400,50)), n2).setName('win').setPayoff(20).setProbability(0.1).childNode;
        // var n5 = this.addNode(new model.TerminalNode(new model.Point(400,150)), n2).setName('lose').setPayoff(0).setProbability(0.9).childNode;
    }

    setTreeValidator(treeValidator){
        this.treeValidator = treeValidator;
    }

    setExpressionEngine(expressionEngine){
        this.expressionEngine = expressionEngine;
    }

    /*Loads serialized data*/
    load(roots, texts){
        roots.forEach(nodeData=>{
            var node = this.createNodeFromData(nodeData);
        });

        if(texts){
            texts.forEach(textData=>{
                var location = new model.Point(textData.location.x,textData.location.y);
                var text = new model.Text(location, textData.value);
                this.texts.push(text);
            })
        }
    }

    /*create node from serialized data*/
    createNodeFromData(data, parent){
        var node;
        var location = new model.Point(data.location.x,data.location.y);
        if(model.DecisionNode.$TYPE == data.type){
            node = new model.DecisionNode(location);
        }else if(model.ChanceNode.$TYPE == data.type){
            node = new model.ChanceNode(location);
        }else if(model.TerminalNode.$TYPE == data.type){
            node = new model.TerminalNode(location);
        }
        node.name = data.name;
        var edgeOrNode = this.addNode(node, parent);
        data.childEdges.forEach(ed=>{
            var edge = this.createNodeFromData(ed.childNode, node);
            edge.payoff = ed.payoff;
            edge.probability = ed.probability;
            edge.name = ed.name;
        });
        return edgeOrNode;
    }

    /*returns node or edge from parent to this node*/
    addNode(node, parent){
        var self = this;
        self.nodes.push(node);
        if(parent){
            var edge = self._addChild(parent, node);
            this._fireNodeAddedCallback(node);
            return edge;
        }

        this._fireNodeAddedCallback(node);
        return node;
    }

    /*injects given node into given edge*/
    injectNode(node, edge){
        var parent = edge.parentNode;
        var child = edge.childNode;
        this.nodes.push(node);
        node.$parent = parent;
        edge.childNode=node;
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

    _setEdgeInitialProbability(edge){
        if(edge.parentNode instanceof model.ChanceNode){
            if(edge.parentNode.childEdges.length==0){ //if node is first child set edge probability to 1
                edge.probability=1.0;
            }else{
                edge.probability=0.0;
            }
        }else{
            edge.probability=undefined;
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
    removeNodes(nodes){

        var roots = this.findSubtreeRoots(nodes);
        roots.forEach(n=>this.removeNode(n,0), this);
    }

    getRoots(){
        return this.nodes.filter(n=>!n.$parent);
    }

    findSubtreeRoots(nodes) {
        return nodes.filter(n=>!n.$parent || nodes.indexOf(n.$parent)===-1);
    }

    /*creates detached clone of given node*/
    cloneSubtree(nodeToCopy){
        var self = this;
        var clone = this.cloneNode(nodeToCopy);

        nodeToCopy.childEdges.forEach(e=>{
            var childClone = self.cloneSubtree(e.childNode);
            childClone.$parent = clone;
            var edge = new model.Edge(clone, childClone, e.name, e.payoff, e.probability);
            clone.childEdges.push(edge);
        });
        return clone;
    }

    /*attaches detached subtree to given parent*/
    attachSubtree(nodeToAttach, parent){
        var self = this;
        var nodeOrEdge = self.addNode(nodeToAttach, parent);

        var childEdges = self.getAllDescendantEdges(nodeToAttach);
        childEdges.forEach(e=>{
            self.edges.push(e);
            self.nodes.push(e.childNode);
        });

        return nodeOrEdge;
    }

    cloneNodes(nodes){
        var roots = []
        //TODO
    }

    /*shallow clone without parent and children*/
    cloneNode(node){
        var clone = _.clone(node)
        clone.$id = Utils.guid();
        clone.location = _.clone(node.location);
        clone.computed = _.clone(node.computed);
        clone.$parent=null;
        clone.childEdges = [];
        return clone;
    }

    findNodeById(id){
        return _.find(this.nodes, n=>n.$id == id);
    }

    findEdgeById(id){
        return _.find(this.edges, e=>e.$id == id);
    }

    findById(id){
        var node = this.findNodeById(id);
        if(node) {
            return node;
        }
        return this.findEdgeById(id);
    }

    _removeNode(node){// simply removes node from node list
        var index  = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
        }
    }

    removeEdge(edge){
        var index  = edge.parentNode.childEdges.indexOf(edge);
        if (index > -1) {
            edge.parentNode.childEdges.splice(index, 1);
        }
        this._removeEdge(edge);
    }

    _removeEdge(edge){ //removes edge from edge list without removing connected nodes
        var index  = this.edges.indexOf(edge);
        if (index > -1) {
            this.edges.splice(index, 1);
        }
    }

    _removeNodes(nodesToRemove) {
        this.nodes = this.nodes.filter(n=>nodesToRemove.indexOf(n)===-1);
    }
    _removeEdges(edgesToRemove) {
        this.edges = this.edges.filter(e=>edgesToRemove.indexOf(e)===-1);
    }

    getAllDescendantEdges(node) {
        var self = this;
        var result = [];

        node.childEdges.forEach(e=>{
            result.push(e);
            if(e.childNode){
                result.push(...self.getAllDescendantEdges(e.childNode));
            }
        });

        return result;
    }

    getAllDescendantNodes(node) {
        var self = this;
        var result = [];

        node.childEdges.forEach(e=>{
            if(e.childNode){
                result.push(e.childNode);
                result.push(...self.getAllDescendantNodes(e.childNode));
            }
        });

        return result;
    }

    getAllNodesInSubtree(node){
        var descendants = this.getAllDescendantNodes(node);
        descendants.unshift(node);
        return descendants;
    }

    isUndoAvailable(){
        return !!this.undoStack.length
    }

    isRedoAvailable(){
        return !!this.redoStack.length
    }


    saveState(revertConf){
        this.redoStack.length = 0;

        this._pushToStack(this.undoStack,{
            revertConf: revertConf,
            nodes: _.cloneDeep(this.nodes),
            edges: _.cloneDeep(this.edges),
            texts: _.cloneDeep(this.texts)
        });

        this._fireUndoRedoCallback();

        return this;
    }

    undo(){
        var self = this;
        var newState = this.undoStack.pop();
        if(!newState){
            return;
        }

        this._pushToStack(this.redoStack, {
            revertConf: newState.revertConf,
            nodes: self.nodes,
            edges: self.edges,
            texts: self.texts
        });

        this._setNewState(newState);

        this._fireUndoRedoCallback();

        return this;
    }

    redo(){
        var self = this;
        var newState = this.redoStack.pop();
        if(!newState){
            return;
        }

        this._pushToStack(this.undoStack, {
            revertConf: newState.revertConf,
            nodes: self.nodes,
            edges: self.edges,
            texts: self.texts
        });

        this._setNewState(newState, true);

        this._fireUndoRedoCallback();

        return this;
    }

    clear(){
        this.nodes.length=0;
        this.edges.length=0;
        this.undoStack.length=0;
        this.redoStack.length=0;
        this.texts.length=0;
    }

    addText(text){
        this.texts.push(text);

        this._fireTextAddedCallback(text);
    }

    removeTexts(texts){
       texts.forEach(t=>this.removeText(t));
    }

    removeText(text){
        var index  = this.texts.indexOf(text);
        if (index > -1) {
            this.texts.splice(index, 1);
            this._fireTextRemovedCallback(text);
        }
    }

    canFlipSubTree(node){
        if(!(node instanceof model.ChanceNode)) {
            return false;
        }

        if(!this.treeValidator.validate(this.getAllNodesInSubtree(node)).isValid()){ //check if the whole subtree is proper
            return false;
        }

        if(node.childEdges.length<1){
            return false;
        }


        var grandchildrenNumber = null;
        var grandchildrenEdgeLabels=[];
        var childrenEdgeLabelsSet=new Set();
        var grandchildrenEdgeLabelsSet;
        if(!node.childEdges.every(e=>{

                var child = e.childNode;
                if(!(child instanceof model.ChanceNode)){
                    return false;
                }

                if(childrenEdgeLabelsSet.has(e.name.trim())){ // edge labels should be unique
                    return false;
                }
                childrenEdgeLabelsSet.add(e.name.trim());

                if(grandchildrenNumber===null){
                    grandchildrenNumber = child.childEdges.length;
                    if(grandchildrenNumber<1){
                        return false;
                    }
                    child.childEdges.forEach(ge=>{
                        grandchildrenEdgeLabels.push(ge.name.trim());
                    });

                    grandchildrenEdgeLabelsSet = new Set(grandchildrenEdgeLabels);

                    if(grandchildrenEdgeLabelsSet.size !== grandchildrenEdgeLabels.length){ //grandchildren edge labels should be unique
                        return false;
                    }

                    return true;
                }

                if(child.childEdges.length!=grandchildrenNumber){
                    return false;
                }
                console.log(grandchildrenEdgeLabelsSet);

                if(!child.childEdges.every((ge, i)=>grandchildrenEdgeLabels[i] === ge.name.trim())){
                    return false;
                }


                return true;

            })){

            return false;
        }

        return true;
    }

    flipSubTree(root){

        var rootClone = this.cloneSubtree(root);
        var oldChildrenNumber = root.childEdges.length;
        var oldGrandChildrenNumber = root.childEdges[0].childNode.childEdges.length;

        var childrenNumber = oldGrandChildrenNumber;
        var grandChildrenNumber = oldChildrenNumber;
        console.log(childrenNumber, grandChildrenNumber);

        var callbacksDisabled = this.callbacksDisabled;
        this.callbacksDisabled =true;


        var childX = root.childEdges[0].childNode.location.x;
        var topY = root.childEdges[0].childNode.childEdges[0].childNode.location.y;
        var bottomY = root.childEdges[oldChildrenNumber-1].childNode.childEdges[oldGrandChildrenNumber-1].childNode.location.y;

        var extentY = bottomY - topY;
        var stepY  = extentY/(childrenNumber+1);

        root.childEdges.slice().forEach(e=> this.removeNode(e.childNode));


        for(var i=0; i< childrenNumber; i++){
            var child = new model.ChanceNode(new model.Point(childX, topY+(i+1)*stepY));
            var edge = this.addNode(child, root);
            edge.name = rootClone.childEdges[0].childNode.childEdges[i].name;

            edge.probability =0;

            // console.log(child);
            for(var j=0; j< grandChildrenNumber; j++){
                var grandChild = rootClone.childEdges[j].childNode.childEdges[i].childNode;


                var grandChildEdge = this.attachSubtree(grandChild, child);
                grandChildEdge.name = rootClone.childEdges[j].name;
                grandChildEdge.payoff = this.expressionEngine.evalAndAdd(rootClone.childEdges[j].payoff, rootClone.childEdges[j].childNode.childEdges[i].payoff);

                grandChildEdge.probability = this.expressionEngine.evalAndMultiply(rootClone.childEdges[j].probability, rootClone.childEdges[j].childNode.childEdges[i].probability);
                edge.probability = this.expressionEngine.evalAndAdd(edge.probability,grandChildEdge.probability);
            }
            var divider = edge.probability;
            if(edge.probability.equals(0)){
                divider = 1/childrenNumber;
            }

            var probabilitySum = 0.0;
            child.childEdges.forEach(grandChildEdge=> {
                grandChildEdge.probability = ExpressionEngine.divide(grandChildEdge.probability, divider);
                probabilitySum = ExpressionEngine.add(probabilitySum, grandChildEdge.probability);
            });


            if(!probabilitySum.equals(1)){
                console.log('Sum of the probabilities is not equal to 1 : ',probabilitySum);
                var normalizationFactor =  ExpressionEngine.divide(1, probabilitySum);
                child.childEdges.forEach(grandChildEdge=> {
                    grandChildEdge.probability = ExpressionEngine.multiply(grandChildEdge.probability, normalizationFactor);
                });
                console.log("Probabilities normalized with normalizationFactor: "+normalizationFactor);
            }

        }



        this.callbacksDisabled =callbacksDisabled;
        this._fireNodeAddedCallback();
    }



    _setNewState(newState, redo) {
        var nodeById = Utils.getObjectByIdMap(newState.nodes);
        var edgeById = Utils.getObjectByIdMap(newState.edges);
        this.nodes = newState.nodes;
        this.edges = newState.edges;
        this.texts= newState.texts;
        this.nodes.forEach(n=> {
            for(var i=0; i<n.childEdges.length; i++){
                var edge = edgeById[n.childEdges[i].$id];
                n.childEdges[i] = edge;
                edge.parentNode = n;
                edge.childNode = nodeById[edge.childNode.$id];
            }

        });

        if(newState.revertConf){
            if(!redo && newState.revertConf.onUndo){
                // console.log('onUndo');
                newState.revertConf.onUndo(newState.revertConf.data);
            }
            if(redo && newState.revertConf.onRedo){
                // console.log('onRedo');
                newState.revertConf.onRedo(newState.revertConf.data);
            }


        }
        this.revertConf = newState.revertConf;
    }

    _pushToStack(stack, obj){
        if(stack.length>=this.maxStackSize){
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
        if (!this.callbacksDisabled &&this.nodeRemovedCallback) {
            this.nodeRemovedCallback(node);
        }
    }

    _fireTextAddedCallback(text) {
        if (!this.callbacksDisabled &&this.textAddedCallback) {
            this.textAddedCallback(text);
        }
    }

    _fireTextRemovedCallback(text) {
        if (!this.callbacksDisabled && this.textRemovedCallback) {
            this.textRemovedCallback(text);
        }
    }
}
