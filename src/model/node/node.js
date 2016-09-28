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

    moveTo(x,y, withChildren){ //move to location
        if(withChildren){
            var dx = x-this.location.x;
            var dy = y-this.location.y;
            this.childEdges.forEach(e=>e.childNode.move(dx, dy, true))
        }

        this.location.x=x;
        this.location.y=y;
    }

    move(dx, dy, withChildren){ //move by vector
        if(withChildren){
            this.childEdges.forEach(e=>e.childNode.move(dx, dy, true))
        }

        this.location.x+=dx;
        this.location.y+=dy;
    }
}