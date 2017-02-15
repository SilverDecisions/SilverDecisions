
/*Base class for complex operations on tree structure*/
export class Operation{

    name;

    constructor(name){
        this.name = name;
    }

    //check if operation is potentially applicable for object
    isApplicable(){
        throw 'isApplicable function not implemented for operation: '+this.name
    }

    //check if can perform operation for applicable object
    canPerform(object){
        throw 'canPerform function not implemented for operation: '+this.name
    }

    perform(object){
        throw 'perform function not implemented for operation: '+this.name
    }


}
