import {Utils} from './utils'
import * as model from './model/index'
import *  as _ from 'lodash'

/*
* Data model manager
* */
export class DataModel {

    nodes = [];
    edges = [];

    constructor() {
        var n1 = this.addNode(new model.DecisionNode(new model.Point(100,150))).setName('dilemma');
        var n2 = this.addNode(new model.ChanceNode(new model.Point(250,100)), n1).setName('play').setPayoff(-1).childNode;
        var n3 = this.addNode(new model.TerminalNode(new model.Point(250,200)), n1).setName('leave game').setPayoff(0).childNode;
        var n4 = this.addNode(new model.DecisionNode(new model.Point(400,50)), n2).setName('win').setPayoff(20).setProbability(0.1).childNode;
        var n5 = this.addNode(new model.TerminalNode(new model.Point(400,150)), n2).setName('lose').setPayoff(0).setProbability(0.9).childNode;
    }

    /*returns node or edge from parent to this node*/
    addNode(node, parent){
        var self = this;
        self.nodes.push(node);
        if(parent){
            return self._addChild(parent, node);
        }
        return node;
    }

    _addChild(parent, child) {
        var self = this;
        var edge = new model.Edge(parent, child);
        self.edges.push(edge);
        parent.childEdges.push(edge);
        child.parent = parent;
        return edge;
    }

    /*removes given node and its subtree*/
    removeNode(node, $l = 0) {
        var self = this;
        node.childEdges.forEach(e=>self.removeNode(e.childNode, $l + 1));

        self._removeNode(node);
        var parent = node.parent;
        if (parent) {
            var parentEdge = parent.childEdges.find((e, i)=> e.childNode === node);
            if ($l == 0) {
                self.removeEdge(parentEdge);
            } else {
                self._removeEdge(parentEdge);
            }
        }
    }

    /*removes given nodes and their subtrees*/
    removeNodes(nodes){
        var roots = this.findSubtreeRoots(nodes);
        roots.forEach(n=>this.removeNode(n,0), this);
    }

    getRoots(){
        return this.nodes.filter(n=>!n.parent);
    }

    findSubtreeRoots(nodes) {
        return nodes.filter(n=>!n.parent || nodes.indexOf(n.parent)===-1);
    }

    /*creates detached clone of given node*/
    cloneSubtree(nodeToCopy){
        var self = this;
        var clone = this.cloneNode(nodeToCopy);

        nodeToCopy.childEdges.forEach(e=>{
            var childClone = self.cloneSubtree(e.childNode);
            childClone.parent = clone;
            var edge = new model.Edge(clone, childClone, e.name, e.payoff, e.probability);
            clone.childEdges.push(edge);
        });
        return clone;
    }

    /*attaches detached subtree to given parent*/
    attachSubtree(nodeToAttach, parent){
        var self = this;
        self.addNode(nodeToAttach, parent);

        var childEdges = self.getAllDescendantEdges(nodeToAttach);
        childEdges.forEach(e=>{
            self.edges.push(e);
            self.nodes.push(e.childNode);
        });

        return nodeToAttach;
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
        clone.parent=null;
        clone.childEdges = [];
        return clone;
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
}