'use strict';

class EtlScriptElement extends FlowChainElement {    
    /**
    * Get the script text to be executed against the data in source.
    * @return {String} ',' (comma) by default.
    */
    get scriptText() {
        return this._scriptText || (this._scriptText = '');
    }    
    /**
    * Set the script text to be executed against the data in source.
    * @param {String} value The script text.
    */
    set scriptText(value) {
        if(this._scriptText === value) return;
        
        this._scriptText = value || ',';
        this.raisePropertyChange('scriptText', value);
    }
    
    /**
    * Gets the data on which the processing is supposed to occur.
    */
    get source() {
        return this._source || (this._source = null);
    }
    
    set source(value){
        this._source = value;
    }
    
    /**
    * Gets the result of processing the data in sources.
    */
    get result() {
        return {};
    }
    
    /**
    * Process what is in the specified file located at filePath, and expose the result.
    */
    process() {
        this.classList.add('processing');
        
        // do the stuff
        let output = {};
        
        // put the result in the next task(s) 
        Array.from(this.links).forEach(function processForEach(link) {
            if(!link.toElement) return;
            
            if(link.toElement['source'] !== undefined) link.toElement.source = output;
            else if(link.toElement['sources'] !== undefined) link.toElement.sources.add(output);
        });
        
        this.classList.add('processing-done');
    }
}

document.registerElement('etl-script', EtlScriptElement);