'use strict';

class FlowChainElementBuilder extends FlowChainHostManager {
    constructor(options) {
        super(options);
    }

    getShadowRoot(element) {
        if(!element) return null;
        
        let shadow = element.shadowRoot == null ? element.createShadowRoot() : element.shadowRoot;
        let content = shadow.querySelector('content');

        if(content === null) {
            content = document.createElement('content');
            content.select = '*';
            
            shadow.appendChild(content);
        }
        
        return shadow;
    }
    
    build(element) {
        if (!(element instanceof FlowChainElement)) return;

        element.x = parseInt(element.getAttribute('fc-pos-x') || element.x);
        element.y = parseInt(element.getAttribute('fc-pos-y') || element.y);

        // apply tabindex so users can focus and use TAB
        if (!element.getAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }
    }
}