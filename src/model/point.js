export class Point {
    x;
    y;
    constructor(x,y){
        if(x instanceof Point){
            y=x.y;
            x=x.x
        }else if(Array.isArray(x)){
            y=x[1];
            x=x[0];
        }
        this.x=x;
        this.y=y;
    }

    moveTo(x,y){
        if(Array.isArray(x)){
            y=x[1];
            x=x[0];
        }
        this.x=x;
        this.y=y;
        return this;
    }

    move(dx,dy){ //move by vector
        if(Array.isArray(dx)){
            dy=dx[1];
            dx=dx[0];
        }
        this.x+=dx;
        this.y+=dy;
        return this;
    }

}
