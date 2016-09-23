'use strict';

class FlowChainGroup extends FlowChainElement {
        
    get isDropTarget() {
        return this._dropTarget || (this._dropTarget = true);
    }

    set isDropTarget(value) {
        if (this._dropTarget === value) return;

        this._dropTarget = value;
        this.raisePropertyChange('allowDrop', this.isAttached);
    }
    
    createdCallback() {
        super.createdCallback();
      
        this.allowDrop = (this.getAttribute('fc-drop-target') === null || this.getAttribute('fc-drop-target') === 'true');
    }
    
    attributeChangedCallback(attrName, oldVal, newVal) {
        super.attributeChangedCallback(attrName, oldVal, newVal);

        if (attrName == 'fc-drop-target') {
            this.isDropTarget = (newVal != null && newVal != undefined) ? (newVal==='true') : false;
        }
    }
          
    syncDOM() {
        super.syncDOM();
        
        if(this.isDropTarget) this.removeAttribute('fc-drop-target');
        else this.setAttribute('fc-drop-target', 'false');
    }

    toJSON() {
        return Object.assign(super.toJSON(), 
        {
            type: 'group',
            dropTarget: this.isDropTarget,
            elements: this.hasChildNodes() ? Array.from(this.children) : null
        });
    }
}

document.registerElement("fc-group", FlowChainGroup);