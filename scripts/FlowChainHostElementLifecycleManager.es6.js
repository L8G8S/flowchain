'use strict';

class FlowChainHostElementLifecycleManager extends FlowChainHostManager {

    constructor(options) {
        super(Object.assign({ host: null }, options));

        this._trackedElements = new Set();

        this.initializeEvents();
    }
    
    initializeEvents() {
        let self = this;
        
        this._handleDeletableChangedProxy = function handleDeletableChangedProxy () { self.handleDeletableChanged.apply(self, [...arguments]); };
        this._handleDeleteClickProxy = function handleDeleteClickProxy () { self.handleDeleteClick.apply(self, [...arguments]); };
        this._handleKeyUpProxy = function handleKeyUpProxy () { self.handleKeyUp.apply(self, [...arguments]); };
        this._handleHostKeyUpProxy = function handleKeyUpProxy () { self.handleHostKeyUp.apply(self, [...arguments]); };
        
        document.documentElement.addEventListener('keyup', this._handleHostKeyUpProxy);
    }

    destroy() {
        super.destroy();
        
        Array.from(this._trackedElements).forEach(function(e) {
            e.removeEventListener('deletable', this._handleDeletableChangedProxy);
        }, this);
        this._trackedElements.clear();
        
        document.documentElement.removeEventListener('keyup', this._handleHostKeyUpProxy);
    }
    
    handleDeletableChanged(evt) {
        let element = evt.srcElement;

        if (element.isDeletable === true) {
            this.register(element);
        }
        else {
            this.unregister(element);
        }
    }
    
    handleDeleteClick(evt) {
        if(evt.which !== 1) return;
        
        let button = evt.srcElement;
        let element = button.deleteParent;
        
        this.options.host.removeElement(element);
    }
    
    handleKeyUp(evt) {
        if((event.which || event.keyCode) === 46){
            this.options.host.removeElement(evt.srcElement);
        }
    }
    
    handleHostKeyUp(evt) {
        if((evt.which || evt.keyCode) === 46) {
            this.options.host.suspend();
            
            Array.from(this.options.host.querySelector('.root').querySelectorAll('.deletable.selected')).forEach(function handleHostKeyUpForEach (element) {
                this.options.host.removeElement(element);
            }, this);
            
            this.options.host.resume();
        }
    }

    appendDeleteButton(element) {
        if(!element) return;
        
        let shadow = element.shadowRoot === null ? element.createShadowRoot() : element.shadowRoot;
        let content = shadow.querySelector('content');
        
        if(content === null) {
            content = document.createElement('content');
            content.select = '*';
            
            shadow.appendChild(content);
        }
        
        let button = shadow.querySelector('.delete-button');
        if(button === null) {
             button = document.createElement('div');
             button.setAttribute('title', 'Delete');
             button.classList.add('delete-button');
             button.deleteParent = element;
             shadow.appendChild(button);
        }
        
        button.addEventListener('mouseup', this._handleDeleteClickProxy, false);
    } 
    
    removeDeleteButton(element) {
        if(!element) return;
        
        let shadow = element.shadowRoot == null ? element.createShadowRoot() : element.shadowRoot;
        let content = shadow.querySelector('content');
        let button = content.querySelector('.delete-button');
        
        if(button !== null) {
            button.deleteParent = undefined;
            button.removeEventListener('mouseup', this._handleDeleteClickProxy, false);
            shadow.removeChild(button);
        }
    } 
    
    register(element) {
        if (!(element instanceof HTMLElement)) return;
        
        if(!this._trackedElements.has(element)) {
            this._trackedElements.add(element);
            element.addEventListener('deletable', this._handleDeletableChangedProxy);
        }
                
        if (!element.isDeletable || element.classList.contains('deletable') || element.classList.contains('root')) return;
                        
        element.addEventListener('keyup', this._handleKeyUpProxy, false);
        element.classList.add('deletable');
        
        this.appendDeleteButton(element);
    }

    unregister(element, callback) {
        if (!(element instanceof HTMLElement) || !element.classList.contains('deletable')) return;

        element.removeEventListener('keyup', this._handleKeyUpProxy, false);
        element.classList.remove('deletable');
        
        this.removeDeleteButton(element);
    }
}