import {Utils} from './utils'
import * as model from './model/index'

/*
* Data model manager
* */
export class DataModel {

    nodes = [];
    edges = [];

    constructor() {
        var n1 = this.addNode(new model.DecisionNode(new model.Point(100,150)));
        var n2 = this.addNode(new model.ChanceNode(new model.Point(250,100)), n1);
        var n3 = this.addNode(new model.TerminalNode(new model.Point(250,200)), n1);
        var n4 = this.addNode(new model.DecisionNode(new model.Point(400,50)), n2);
        var n5 = this.addNode(new model.TerminalNode(new model.Point(400,150)), n2);
    }

    addNode(node, parent){
        var self = this;
        self.nodes.push(node);
        if(parent){
            var edge = new model.Edge(parent, node);
            self.edges.push(edge);
            parent.childEdges.push(edge);
            node.parent = parent;
        }
        return node;
    }

    removeNode(node) {
        var self = this;

        self._removeNode(node);

        var parent = node.parent;
        if(parent){
            var parentEdge = parent.childEdges.find((e,i)=> e.childNode===node);
            self._removeEdge(parentEdge);
        }

        node.parent=null;
        node.childEdges.forEach(e=>self.removeNode(e.childNode));
    }

    _removeNode(node){// simply removes node from node list
        var index  = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
        }
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
}