'use strict';

class EtlCsvExporterElement extends FlowChainElement {
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
    get useHeader() {
        return this._useHeader || (this._useHeader = false);
    }    
    /**
    * Set a value indicating if the header is present in the file.
    * @param {Boolean} value.
    */
    set useHeader(value) {
        if(this._useHeader === value) return;
        
        this._useHeader = value;
        this.raisePropertyChange('useHeader', value);
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
    * Gets the data on which the processing is supposed to occur.
    */
    get source() {
        return this._source || (this._source = null);
    }
    
    set source(value){
        this._source = value;
    }
    
    /**
    * Process what is in the source and save the result in a dedicated file.
    */
    process() {
        this.classList.add('processing');
        
        this.classList.add('processing-done');
    }
}

document.registerElement('etl-csv-exporter', EtlCsvExporterElement);