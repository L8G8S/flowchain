'use strict';

class DirectedGraphElementBuilder extends FlowChainElementBuilder {
    
    constructor(options) {
        super(options);
    }

    build(element) {
        super.build(element);

        if(!(element instanceof FlowChainGroup)) {
            element.setAttribute('fc-sizable', 'false');
        }
        
        let shadow = element.shadowRoot == null ? element.createShadowRoot() : element.shadowRoot;
        let content = shadow.querySelector('content');

        if(content === null) {
            content = document.createElement('content');
            content.select = '*';
            
            shadow.appendChild(content);
        }

        if(shadow.querySelector('.drag-handle') === null) {
            var h = document.createElement('span');
                h.classList.add('drag-handle');
                h.innerHTML = (element.name || '&nbsp;');   
            
            shadow.appendChild(h);
        }
    }
}