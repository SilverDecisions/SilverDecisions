import {FlipSubtree} from "./flip-subtree";


export class OperationsManager {

    operations = [];
    operationByName = {};

    constructor(data, expressionEngine){
        this.data = data;
        this.expressionEngine = expressionEngine;
        this.registerOperation(new FlipSubtree(data, expressionEngine));
    }

    registerOperation(operation){
        this.operations.push(operation);
        this.operationByName[operation.name] = operation;
    }


    getOperationByName(name){
        return this.operationByName[name];
    }

    operationsForObject(object){
        return this.operations.filter(op=>op.isApplicable(object))
    }

}
