'use strict';

// IDs
// http://www.html5rocks.com/en/tutorials/dnd/basics/?redirect_from_locale=fr
// http://www.html5rocks.com/en/tutorials/file/dndfiles/#toc-selecting-files-dnd
    
class FlowChainHostManager {   
    
    get options() {
        return this._options;
    }
    
    get generatedEvents() {
        return [];    
    }
    
    constructor(options){
        this._options = Object.assign({
            host: null
        }, options);
        
        if (!this._options.host) {
            throw new DOMException("no host defined");
        }
        
        this._eventMap = new Map();
    }
            
    initialize() {}
    
    destroy() {}
    
    register(element) {}
    
    unregister(element) {}
    
    attributeChangedCallback(attrName) {}
    
    addEventListener(eventName, callback){
        if(!callback) return;
        
        if(!this._eventMap.has(eventName)){
            this._eventMap.set(eventName, new Set());
        }
        
        if(!this._eventMap.get(eventName).has(callback)){
            this._eventMap.get(eventName).add(callback);
        }
    }
    
    removeEventListener(eventName, callback){
        if(!this._eventMap.has(eventName)) return;

        if(this._eventMap.get(eventName).has(callback)){
            this._eventMap.get(eventName).delete(callback);
        }
        else{
            this._eventMap.delete(eventName);
        }        
    }
    
    dispatchEvent(eventName, args){
        if(!this._eventMap.has(eventName)) return;

        let callbacks = this._eventMap.get(eventName);
        for(var callback of callbacks) {
            callback.call(this, args);
        }
    }

    toString() {
        return '[object ' + this.constructor.name + ']';
    }

    toJSON() {
        return {
            type: this.constructor.name
        };
    }
}