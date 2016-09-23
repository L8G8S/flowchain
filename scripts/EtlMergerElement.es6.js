'use strict';

class EtlMergerElement extends FlowChainElement {
    /**
    * Gets the data on which the processing is supposed to occur.
    */
    get sources() {
        return this._sources || (this._sources = new Set());
    }
    
    set sources(value){
        this._sources = value;
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

document.registerElement('etl-merger', EtlMergerElement);