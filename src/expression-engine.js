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

    add(a, b){
        return math.add(math.bignumber(a), math.bignumber(b));
    }

    subtract(a, b){
        return math.subtract(math.bignumber(a), math.bignumber(b));
    }

    divide(a, b){
        return math.divide(math.bignumber(a), math.bignumber(b));
    }

    multiply(a,b){
        return math.multiply(math.bignumber(a), math.bignumber(b));
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
