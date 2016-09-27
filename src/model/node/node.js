import {Utils} from '../../utils'
import {Point} from '../point'

export class Node {
    
    type;
    childEdges=[];
    name='';

    computed={
        payoff: null
    };
    location; //Point

    $id = Utils.guid();
    $symbol;
    
    constructor(type, symbol, location){
        this.location=location;
        if(!location){
            this.location = new Point(0,0);
        }
        this.type=type;
        this.$symbol=symbol;
    }


}