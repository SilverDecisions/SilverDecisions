export class InputField{
    name;
    type;
    validator;
    valueAccessor;

    id;
    label;
    valueUpdateCallback;

    constructor(id, name, type, label, valueAccessor, validator, options){
        this.name = name;
        this.type = type;
        this.valueAccessor = valueAccessor;
        this.validator = validator;
        this.id=id;
        this.label = label;
        this.options = options;
    }

    getValue(){
        return this.valueAccessor.get();
    }

    setValue(val){
        return this.valueAccessor.set(val);
    }
}
