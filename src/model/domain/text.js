import {Point} from "./point";
import {Utils} from "sd-utils";
import {ObjectWithIdAndEditableFields} from "./object-with-id-and-editable-fields";

export class Text extends ObjectWithIdAndEditableFields{

    value='';
    location; //Point

    constructor(location, value){
        super();
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
