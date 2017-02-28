import {Point} from '../point'
import {ObjectWithComputedValues} from '../object-with-computed-values'

export class Node extends ObjectWithComputedValues{

    type;
    childEdges=[];
    name='';

    location; //Point

    code='';
    $codeDirty = false; // is code changed without reevaluation?
    $codeError = null; //code evaluation errors

    expressionScope=null;

    $DISPLAY_VALUE_NAMES = ['childrenPayoff', 'aggregatedPayoff', 'probabilityToEnter', 'optimal']

    constructor(type, location){
        super();
        this.location=location;
        if(!location){
            this.location = new Point(0,0);
        }
        this.type=type;
    }

    setName(name){
        this.name = name;
        return this;
    }

    moveTo(x,y, withChildren){ //move to new location
        if(withChildren){
            var dx = x-this.location.x;
            var dy = y-this.location.y;
            this.childEdges.forEach(e=>e.childNode.move(dx, dy, true))
        }

        this.location.moveTo(x,y);
        return this;
    }

    move(dx, dy, withChildren){ //move by vector
        if(withChildren){
            this.childEdges.forEach(e=>e.childNode.move(dx, dy, true))
        }
        this.location.move(dx, dy);
        return this;
    }
}
