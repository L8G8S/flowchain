'use strict';

class Reflection {

    static isRawObject(object) {
        return Reflection.getPrototypeChain(object).length === 1;
    }
    
    static getTypeName(object) {
        if(object === null || object === undefined) return null;
        
        let proto = Object.getPrototypeOf(object);
        
        return proto ? proto.constructor.name : typeof(proto);
    }
    
    static getPrototypeChain(object) {
        let chain = [];

        if(object) {
            let proto = Object.getPrototypeOf(object);  
                        
            while(proto != null && proto !== undefined)
            {
                chain.push(proto);
                proto = Object.getPrototypeOf(proto)
            }            
        } 
        
        return chain;
    }
    
    static getPropertyDescriptors(object) {
        if(!object) return [];
        
        let descriptors = [];
        
        let propertyNameMap = new Set();
        let chain = Reflection.getPrototypeChain(object);
        chain.forEach(function(proto) {
            if(!proto) return;
            
            let protoName = proto.constructor.name;
            let properties = Object.getOwnPropertyNames(proto).sort();
            
            properties = properties
                .map(function(p) {
                    if(p === '__proto__' || propertyNameMap.has(p)) {
                        return null;   
                    }

                    propertyNameMap.add(p);
                    
                    try {
                        let d = Object.getOwnPropertyDescriptor(proto, p);
                        let v = object[p];
                        
                        return Object.assign(d, {
                            typeName: protoName, 
                            propertyName : p, 
                            propertyTypeName : v !== null ? Reflection.getTypeName(v) : p.indexOf('on') === 0 ? 'Function' : 'String',
                            isReadonly: (d.set === undefined) 
                        });
                    }
                    catch(ex) {
                        return null;
                    } 
                })
                .filter(function(d) { 
                    return d !== null && d.propertyTypeName !== 'Function'; 
                });
                
            descriptors = descriptors.concat(properties);    
        });
        
        propertyNameMap.clear();
        
        return descriptors;
    }
    
    static getPropertyNames(object) {
        return Reflection.getPropertyDescriptors(object).map(function(d) { return d.name; });
    }
    
    static getFieldDescriptors(object) {
        if(!object) return [];
        
        let fields = Object.getOwnPropertyNames(object).sort();
        
        return fields
                .map(function(f) { 
                    let d = Object.getOwnPropertyDescriptor(object, f);
                    let v = object[f];
                    
                    return Object.assign(d, { 
                        propertyName : f, 
                        propertyTypeName : v !== null ?  Reflection.getTypeName(v) : 'String',
                        isReadonly: false 
                    }); 
                })
                .filter(function(d) { 
                    return d.propertyTypeName !== 'function'; 
                });
    }
    
    static getFieldNames(object) {
        return Reflection.getFieldDescriptors(object).map(function(d) { return d.name; });
    }
}