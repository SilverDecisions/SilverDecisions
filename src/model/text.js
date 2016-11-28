import {Point} from "./point";
import {Utils} from "../utils";

export class Text{

    value='';
    location; //Point
    $id = Utils.guid(); //internal id

    constructor(location, value){

        this.location=location;
        if(!location){
            this.location = new Point(0,0);
        }

        if(value) {
            this.value = value;
        }
    }

    moveTo(x,y){ //move to new location
        this.location.moveTo(x,y);
        return this;
    }

    move(dx, dy){ //move by vector
        this.location.move(dx, dy);
        return this;
    }
}
