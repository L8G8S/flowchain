'use strict';

class FlowChainHostInteractionManager extends FlowChainHostManager {

    constructor(options){
        super(Object.assign({
            host: null,
            linkHandle: null,
            dragHandle: '::shadow .drag-handle',
            gridSize : [10, 10],
            snapToGrid: true,
            moveSmallChange: 10,
            moveLargeChange: 30
        }, options));
       
        this.initializeFromAttributes();
        this.initializeManagers();
        this.initializeEvents();
    }

    initializeFromAttributes() {
        // get user-defined values
        this.attributeChangedCallback('fc-grid-size');
    }
    
    attributeChangedCallback(attrName) {
        super.attributeChangedCallback(attrName);
        
        let attributeValue = this.options.host.getAttribute(attrName);
        
        switch(attrName) {
            case 'fc-grid-size':
                this.options.gridSize = !attributeValue ? [10,10] : attributeValue.split(',').map(function(item) { return parseInt(item, 10); });
                break;
        }
        
        if(this._lifecycleManager) this._lifecycleManager.attributeChangedCallback(attrName);
        if(this._dragManager) this._dragManager.attributeChangedCallback(attrName);
        if(this._linkManager) this._linkManager.attributeChangedCallback(attrName);
        if(this._resizeManager) this._resizeManager.attributeChangedCallback(attrName);
        if(this._selectionManager) this._selectionManager.attributeChangedCallback(attrName);
    }
    
    initializeManagers() {
        let self = this;
                
        // lifecycle
        this._lifecycleManager = new FlowChainHostElementLifecycleManager(this.options);
        
        // DnD
        this._dragManager = new FlowChainHostDraggableManager(this.options);
        this._dragManager.generatedEvents.forEach(function (ge) {
            self._dragManager.addEventListener(ge, function () {
                self.dispatchEvent(ge, [...arguments]); 
            });
        });
        
        // linking
        this._linkManager = new FlowChainHostLinkableManager(this.options);
        this._linkManager.generatedEvents.forEach(function (ge) {
            self._linkManager.addEventListener(ge, function () {
                self.dispatchEvent(ge, [...arguments]); 
            });
        });

        // resize
        this._resizeManager = new FlowChainHostSizableManager(this.options);
        this._resizeManager.generatedEvents.forEach(function (ge) {
            self._resizeManager.addEventListener(ge, function () {
                self.dispatchEvent(ge, [...arguments]); 
            });
        });
        
        // selection
        this._selectionManager = new FlowChainHostSelectionManager(this.options);
    }
    
    initializeEvents() {
        
    }
    
    destroy() {
        super.destroy();
        
        this._lifecycleManager.destroy();
        this._dragManager.destroy();
        this._linkManager.destroy();
        this._resizeManager.destroy();
    }
    
    get generatedEvents () {
        if(this._generatedEvents === null || this._generatedEvents === undefined) {
            this._generatedEvents = super.generatedEvents.concat(this._resizeManager.generatedEvents, this._dragManager.generatedEvents, this._linkManager.generatedEvents);;
        }
        
        return this._generatedEvents;
    }
    
    register(element){
        this._lifecycleManager.register(element);
        this._dragManager.register(element);
        this._linkManager.register(element);
        this._resizeManager.register(element);
        this._selectionManager.register(element);
    }
    
    unregister(element) {
        this._lifecycleManager.unregister(element);
        this._dragManager.unregister(element);
        this._linkManager.unregister(element);
        this._resizeManager.unregister(element);
        this._selectionManager.unregister(element);
    }
}