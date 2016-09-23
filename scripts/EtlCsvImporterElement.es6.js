'use strict';

class EtlCsvImporterElement extends FlowChainElement {
    /**
    * Get the path to the file that shall be imported.
    * @return {String}  The path to the file.
    */
    get filePath() {
        return this._filePath || (this._filePath = '');
    }    
    /**
    * Set the path to the file that shall be imported.
    * @param {String} value The path to the file.
    */
    set filePath(value) {
        if(this._filePath === value) return;
        
        this._filePath = value;
        this.raisePropertyChange('filePath', value);
    }
    
    /**
    * Get a value indicating if the header is present in the file.
    * @return {Boolean} true by default.
    */
    get hasHeader() {
        return this._hasHeader;
    }    
    /**
    * Set a value indicating if the header is present in the file.
    * @param {Boolean} value.
    */
    set hasHeader(value) {
        if(this._hasHeader === value) return;
        
        this._hasHeader = value;
        this.raisePropertyChange('hasHeader', value);
    }
    
    /**
    * Get the separator used to identify fields in the file.
    * @return {String} ',' (comma) by default.
    */
    get fieldSeparator() {
        return this._fieldSeparator || (this._fieldSeparator = ',');
    }    
    /**
    * Set the separator used to identify fields in the file.
    * @param {String} value The separator.
    */
    set fieldSeparator(value) {
        if(this._fieldSeparator === value) return;
        
        this._fieldSeparator = value || ',';
        this.raisePropertyChange('fieldSeparator', value);
    }
     
    /**
     * Gets the result of processing the data in the file.
     */   
    get result() {
        return {};
    }
       
    createdCallback() {
        this._filePath = null;
        this._hasHeader = true;
        this._fieldSeparator = ',';
        
        super.createdCallback();
    }
    
    initializeFromAttributes() {
        super.initializeFromAttributes();
        
        this.hasHeader = (this.getAttribute('csv-has-header') === null || this.getAttribute('csv-has-header') === 'true');
        this.fieldSeparator = this.getAttribute('csv-field-separator') || ',';
    }
    
    attributeChangedCallback(attrName, oldVal, newVal) {
        super.attributeChangedCallback(attrName, oldVal, newVal);
        
        switch(attrName) {
            case 'csv-field-separator':
                this.fieldSeparator = newVal;
                break;
            case 'csv-has-header':
                this.isSizable = (newVal != null && newVal != undefined) ? (newVal==='true') : false;
                break;
        }
    }
    
    syncDOM() {
        super.syncDOM();
        
        if (this.hasHeader) this.removeAttribute('csv-has-header');
        else this.setAttribute('csv-has-header', 'false');
        
        if (this.fieldSeparator === ',') this.removeAttribute('csv-field-separator');
        else this.setAttribute('csv-field-separator', this.fieldSeparator);
    }
    
    toJSON() {
        return Object.assign(super.toJSON(), 
        {
            filePath: this.filePath,
            hasHeader: this.hasHeader,
            fieldSeparator: this.fieldSeparator
        });
    }
    
    /**
     * Try to guess what is in the specified file located at filePath, and expose the structure in fileHeader.
     */
    guess() {
        
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

document.registerElement('etl-csv-importer', EtlCsvImporterElement);