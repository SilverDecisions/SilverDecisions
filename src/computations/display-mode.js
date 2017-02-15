/*base class for display mode managers*/
export class DisplayMode{

    modeName;

    constructor(modeName){
        this.modeName = modeName;
    }


    getNodeDisplayValue(node, name) {
        throw 'getNodeDisplayValue function not implemented for mode: '+this.modeName
    }

    getEdgeDisplayValue(edge, name){
        throw 'getEdgeDisplayValue function not implemented for mode: '+this.modeName
    }

}
