export class InputField{
    name;
    type;
    validator;
    valueAccessor;

    id;
    label;
    valueUpdateCallback;

    constructor(id, name, type, label, valueAccessor, validator, options, parser){
        this.name = name;
        this.type = type;
        this.valueAccessor = valueAccessor;
        this.validator = validator;
        this.id=id;
        this.label = label;
        this.options = options;
        this.parser = parser;
    }

    getValue(){
        return this.valueAccessor.get();
    }

    setValue(val){
        return this.valueAccessor.set(val);
    }

    parse(val){
        if(this.parser){
            return this.parser(val)
        }
        return val;
    }
}
