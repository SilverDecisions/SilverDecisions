import * as math from 'mathjs'
import {Utils} from './utils'

export class ExpressionEngine{

    constructor(scope){
        this.parser = math.parser();
        this.parser.scope = scope;

    }

    eval(expr){
        return this.parser.eval(expr+"");
    }

    static add(a, b){
        return math.add(math.fraction(a), math.fraction(b));
    }

    static subtract(a, b){
        return math.subtract(math.fraction(a), math.fraction(b));
    }

    static divide(a, b){
        return math.divide(math.fraction(a), math.fraction(b));
    }

    static multiply(a,b){
        return math.multiply(math.fraction(a), math.fraction(b));
    }


    validate(expr){
        if(expr===null || expr===undefined){
            return false;
        }

        try{
            var c = math.compile(expr);
            var e = c.eval(this.parser.scope);
            return Utils.isNumeric(e);
        }catch (e){
            return false;
        }
    }
}
