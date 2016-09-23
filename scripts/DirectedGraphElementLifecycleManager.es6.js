'use strict';

class DirectedGraphElementLifecycleManager extends FlowChainHostElementLifecycleManager {

    constructor(options) {
        super(Object.assign({ host: null }, options));

        this._doubleClickProxy = function(evt) {
            if(!(evt.srcElement instanceof FlowChainGroup)) return;
           
            let newNode = document.createElement('fc-element');
            newNode.id = ('node' + (document.querySelectorAll('fc-element').length + 1));
            evt.srcElement.appendChild(newNode);
            
            newNode.x = evt.offsetX - newNode.offsetWidth/2;
            newNode.y = evt.offsetY - newNode.offsetHeight/2;
        };

        this.options.host.addEventListener('dblclick', this._doubleClickProxy);
    }
    
    destroy() {
        super.destroy();
     
        this.options.host.removeEventListener('dblclick', this._doubleClickProxy);
    }
    
    appendDeleteButton(element) {
        super.appendDeleteButton(null);
    }
    
    removeDeleteButton(element) {
        super.removeDeleteButton(null);
    }
}