'use strict';

class EtlElementBuilder extends FlowChainElementBuilder {
    constructor(options) {
        super(options);
    }

    build(element) {
        super.build(element);
               
        // common behavior
        element.setAttribute('fc-sizable', 'false');
        element.setAttribute('fc-link-constraints', 'directed');
                
        let shadow = this.getShadowRoot(element);
        if(shadow.querySelector('.drag-handle') === null) {
            let h = document.createElement('span');
                h.classList.add('drag-handle');
                h.innerHTML = (element.name || '&nbsp;');   
            
            shadow.appendChild(h);
        }

        // specific behavior
        switch(element.tagName.toLowerCase()) {
            case 'etl-csv-importer':
                element.setAttribute('fc-linkable', 'false');
                break;
                
            case 'etl-csv-exporter':
                element.setAttribute('fc-link-constraints', 'none');
                break;
                
            case 'etl-filter':
                break;
                
            case 'etl-mapper':
                break;
                
            case 'etl-script':
                break;
        }
    }
}