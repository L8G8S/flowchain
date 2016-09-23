'use strict';

class FlowChainHostSelectionManager extends FlowChainHostManager {
    get root() {
        return this.options.host.querySelector('.root');
    }
    
    constructor(options) {
        super(Object.assign({
            host: null
        }, options));
        
        this.initializeFromAttributes();
        this.initializeEvents();
        this.initializeDOM();
    }

    destroy() {
        this.root.removeEventListener('mousedown', this._mouseDownProxy);
    }
    
    initializeFromAttributes() {
       
    }
        
    initializeEvents() {
        let self = this;
        
        this._mouseDownProxy = function mouseDownProxy () { self.handleMouseDown.apply(self, [...arguments]); };
        this._mouseMoveProxy = function mouseMoveProxy () { self.handleMouseMove.apply(self, [...arguments]); };
        this._mouseUpProxy = function mouseUpProxy () { self.handleMouseUp.apply(self, [...arguments]); };
        
        this.root.addEventListener('mousedown', this._mouseDownProxy);
    }
    
    initializeDOM() {
        let shadow = this.options.host.shadowRoot == null ? this.options.host.createShadowRoot() : this.options.host.shadowRoot;
        let content = shadow.querySelector('content');
        
        if(content === null) {
            content = document.createElement('content');
            content.select = '*';
            
            shadow.appendChild(content);
        }
        
        // append a simple element used to display a selection area
        let selector = document.createElement('div');
        selector.classList.add('selector');
        shadow.appendChild(selector);
    }
    
    handleMouseDown(evt) {
        if((evt.which && evt.which !== 1) || (evt.button && evt.button !== 0)) return;
        
        this.options.host.setAttribute('action', 'selecting');

        let root = this.root;
        root.removeEventListener('mousedown', this._mouseDownProxy);
        window.addEventListener('mousemove', this._mouseMoveProxy);
        window.addEventListener('mouseup', this._mouseUpProxy);
        
        Array.from(root.querySelectorAll('.selected')).forEach(function(element) {
            element.classList.remove('selected');
        });
        
        let rect = root.rect || (root.rect = root.getBoundingClientRect());
        let selector = this.options.host.shadowRoot.querySelector('.selector');
        selector.startX = evt.pageX - rect.left + this.options.host.scrollLeft;
        selector.startY = evt.pageY - rect.top + this.options.host.scrollTop;
        
        selector.style.left = selector.startX  + 'px';
        selector.style.top = selector.startY + 'px';
    }
    
    handleMouseMove(evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        
        let root = this.root;
        let rect = root.rect || (root.rect = root.getBoundingClientRect());
        let selector = this.options.host.shadowRoot.querySelector('.selector');
     
        let expectedWidth = (evt.pageX - rect.left + this.options.host.scrollLeft - selector.startX);
        let expectedHeight = (evt.pageY - rect.top + this.options.host.scrollTop - selector.startY);
     
        if(expectedHeight < 0) {
            let newY = selector.startY+expectedHeight;
            selector.style.top = newY + 'px';
        }
        else if(selector.style.top !== selector.startY + 'px') {
            selector.style.top = selector.startY + 'px';
        }
        
        if(expectedWidth < 0) {
            let newX = selector.startX + expectedWidth;
            selector.style.left = newX + 'px';
        }
        else if(selector.style.left !== selector.startX + 'px') {
            selector.style.left = selector.startX + 'px';
        }
        
        selector.style.width = Math.abs(expectedWidth)  + 'px';
        selector.style.height = Math.abs(expectedHeight) + 'px';
    }
    
    handleMouseUp(evt) {
        this.options.host.removeAttribute('action');
        
        let root = this.root;
        root.addEventListener('mousedown', this._mouseDownProxy);
        window.removeEventListener('mousemove', this._mouseMoveProxy);
        window.removeEventListener('mouseup', this._mouseUpProxy);
        
        let selector = this.options.host.shadowRoot.querySelector('.selector');
        let selectionRect = {
            x: parseInt(selector.style.left),
            y: parseInt(selector.style.top),
            width: parseInt(selector.style.width),
            height: parseInt(selector.style.height)
        }
        
        this.options.host.suspend();
        Array.from(this.getElementsInSelection(selectionRect)).forEach(function(e){
            e.classList.add('selected');
        }, this);
        this.options.host.resume();
        
        selector.style.width = selector.style.height = '0';
    }

    * getElementsInSelection(rect) {
        for(let element of this.options.host.elements) {
            if(element.x >= rect.x && element.x <= (rect.x + rect.width) 
            && element.y >= rect.y && element.y <= (rect.y + rect.height)) {
                yield element;
            }
        }
    }
}