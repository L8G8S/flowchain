'use strict';

class FlowChainElement extends HTMLDivElement {

    raisePropertyChangeAsync(propertyName, detail, namedEvent) {
        let self = this;
        setTimeout(function raisePropertyChangeTimer () {
            self.raisePropertyChange(propertyName, detail, namedEvent);
        }, 0);
    }

    raisePropertyChange(propertyName, detail, namedEvent) {
        namedEvent = namedEvent || this.isAttached;
        
        if (namedEvent === true) {
            this.dispatchEvent(new CustomEvent(propertyName, { bubbles: true, cancelable: false, detail: detail }));
        }

        this.dispatchEvent(new CustomEvent("property", { bubbles: true, cancelable: false, detail: { name: propertyName, value: detail } }));
    }

    get isAttached() {
        return (this._isAttached = (this._isAttached || false));
    }
        
    get name() {
        return this._name;
    }

    set name(value) {
        if (this.name === value) return;

        this._name = value;

        this.setAttribute('name', value);
        this.raisePropertyChange('name', null);
    }
    
    get x() {
        return (this._x = (this._x || 0));
    }

    set x(value) {
        if (this._x === value) return;

        this._x = value;
        this.raisePropertyChange('x', value);
    }

    get y() {
        return (this._y = (this._y || 0));
    }

    set y(value) {
        if (this._y === value) return;

        this._y = value;
        this.raisePropertyChange('y', value);
    }

    get width() {
        return this._width;
    }

    set width(value) {
        if (value === this._width) return;
        
        this._width = value;
        this.raisePropertyChange('width', value);
    }

    get height() {
        return this._height;
    }

    set height(value) {
        if (value === this._height) return;

        this._height = value;
        this.raisePropertyChange('height', value);
    }
    
    get isSizable() {
        return this._sizable;
    }

    set isSizable(value) {
        if (this._sizable === value) return;

        this._sizable = value;
        this.raisePropertyChange('sizable', value);
    }
    
    get isDraggable() {
        return this._draggable;
    }

    set isDraggable(value) {
        if (this._draggable === value) return;

        this._draggable = value;
        this.raisePropertyChange('draggable', value);   
    }
    
    get isLinkable() {
        return this._linkable;
    }

    set isLinkable(value) {
        if (this._linkable === value) return;

        this._linkable = value;
        this.raisePropertyChange('linkable', value);
    }
    
    get linkConstraints() {
        return this._linkConstraints.join(',');
    }

    set linkConstraints(value) {
        this._linkConstraints = (value || 'all').split(',');
        this.raisePropertyChange('linkConstraints', value);
    }
    
    get isDeletable() {
        return this._deletable;
    }

    set isDeletable(value) {
        if (this._deletable === value) return;

        this._deletable = value;
        this.raisePropertyChange('deletable', value);   
    }

    get links() {
        return this._links.values();
    }
    
    get hasLink() {
        return this._links.size > 0;
    }
     
    initializeFromAttributes() {
        this.width = 0;
        this.height = 0;
        
        this._name = this.getAttribute('name');
        this.x = parseFloat(this.getAttribute('fc-pos-x') || this.x);
        this.y = parseFloat(this.getAttribute('fc-pos-y') || this.y);
        
        this.isSizable = (this.getAttribute('fc-sizable') === null || this.getAttribute('fc-sizable') === 'true');
        this.isLinkable = (this.getAttribute('fc-linkable') === null || this.getAttribute('fc-linkable') === 'true');
        this.linkConstraints = this.getAttribute('fc-link-constraints') || 'all';
        this.isDraggable = (this.getAttribute('fc-draggable') === null || this.getAttribute('fc-draggable') === 'true');
        this.isDeletable = (this.getAttribute('fc-deletable') === null || this.getAttribute('fc-deletable') === 'true');
    }
      
    createdCallback() {
        this._links = new Map();
        this._linkConstraints = new Array();
        this._updatingDOM = false;
        
        this.initializeFromAttributes();

        this.raisePropertyChange('created');
                
        // Chrome > need to set default location to enable CSS transition (if speficied in css)
        this.style.top = "0";
        this.style.left = "0";
    }

    attachedCallback() {
        this.width = this.offsetWidth;
        this.height = this.offsetHeight;

        (this.getAttribute('fc-links') || '').split(',').forEach(function (l) {
            l = l.trim();
            
            if (l.length > 0) {
                this.addLink(document.getElementById(l));
            }
        }, this);

        this._isAttached = true;
        this.raisePropertyChange(this.isAttached ? 'attached' : 'detached', true, true);
    }

    detachedCallback() {
        this._isAttached = false;
        this.raisePropertyChange(this.isAttached ? 'attached' : 'detached', false, true);
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        if(this._updatingDOM === true) return;
        
        switch(attrName) {
            case 'name':
                this.name = newVal;
                break;
            case 'fc-pos-x':
                this.x = parseInt(newVal || 0);
                break;
            case 'fc-pos-y':
                this.y = parseInt(newVal || 0);
                break;
            case 'fc-sizable':
                this.isSizable = (newVal != null && newVal != undefined) ? (newVal==='true') : false;
                break;
            case 'fc-linkable':
                this.isLinkable = (newVal != null && newVal != undefined) ? (newVal === 'true') : false;
                break;
            case 'fc-link-constraints':
               this.linkConstraints = newVal || 'all';
               break;
            case 'fc-draggable':
                this.isDraggable = (newVal != null && newVal != undefined) ? (newVal === 'true') : false;
                break;
            case 'fc-deletable':
                this.isDeletable = (newVal != null && newVal != undefined) ? (newVal === 'true') : false;
                break;
            case 'fc-links':
                (newVal || '').split(',').forEach(function (ld) {
                ld = ld.trim();

                if (ld.length > 0) {
                    this.addLink(document.getElementById(ld));
                }
            }, this);
                break;
        }
    }
    
    canLinkTo(element) {
        if(element === null || element === undefined) return false;
        
        if(this._linkConstraints.indexOf('none') !== -1) return false;
        
        if(this._linkConstraints.indexOf('all') !== -1) return true;
        
        if(this._linkConstraints.indexOf('directed') !== -1) return element.isLinkedTo === undefined || !element.isLinkedTo(this);
                
        return (this._linkConstraints.indexOf(element.tagName.toLocaleLowerCase()) !== -1);
    }
    
    isLinkedTo(element) {
        return this._links.has(element);
    }
    
    /**
    * Add a link to element(s) matching the given selector.
    * @param  {String} selector Selector to the element(s) to link to.
    */
    addLinkTo(selector) {
        if (selector === null || selector === undefined) return;

        Array.from(document.querySelectorAll(selector)).forEach(function linkToForEach (target) {
            this.addLink(target);
        }, this);
    }

    /**
    * Add a link to the given FlowChainElement.
    * @param  {FlowChainElement} element Element to link to.
    */
    addLink(element) {
        if(!this.canLinkTo(element)) return null;
        
        let link = new FlowChainElementLink(this, element);
                        
        this._links.set(element, link);
        
        this.raisePropertyChange('linkAdded', link);
        
        this.syncDOM();
        
        return link;
    }

    /**
    * Remove link to element(s) matching the given selector.
    * @param  {String} selector Selector to the element(s) to remove the link to.
    */
    removeLinkTo(selector){
        if (!selector) return;

        Array.from(document.querySelectorAll(selector)).forEach(function linkToForEach (target) {
            this.removeLink(target);
        }, this);
    }
    
    /**
    * Remove a link to the given FlowChainElement.
    * @param  {FlowChainElement} element Element to remove the link to.
    */
    removeLink(element) {
        let link = null;        
        if(element && this.isLinkedTo(element)) {
            link = this._links.get(element);
            
            this._links.delete(element);
            
            this.raisePropertyChange('linkRemoved', link);
            
            link.destroy();
            
            this.syncDOM();
        }        
        return link;
    }
    
    /**
    * Remove all links from the element.
    */
    removeLinks() {
        Array.from(this._links.values()).forEach(function removeLinksForEach(l) {
            this._links.delete(l.toElement);
            l.destroy();            
        }, this);

        this.syncDOM();
    }
       
    syncDOM() {
        this._updatingDOM = true;
        
        this.setAttribute("fc-pos-y", this.y);
        this.setAttribute("fc-pos-x", this.x);
       
        this.setAttribute('fc-linkable', this.isLinkable === true ? 'true' : 'false');
        this.setAttribute('fc-link-constraints', this.linkConstraints);
                
        if (this.isDraggable) this.removeAttribute('fc-draggable');
        else this.setAttribute('fc-draggable', 'false');

        if (this.isSizable) this.removeAttribute('fc-sizable');
        else this.setAttribute('fc-sizable', 'false');
        
        if (this.isDeletable) this.removeAttribute('fc-deletable');
        else this.setAttribute('fc-deletable', 'false');
        
        this.setAttribute("fc-links", Array.from(this.links).map(function syncDOMLinkSerialize (l) { return l.toElement.id; }).join(','));
        
        this._updatingDOM = false;
    }

    toJSON() {
        return {
            type: this.tagName.toLocaleLowerCase(),
            id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            sizable: this.isSizable,
            draggable: this.isDraggable,
            linkable: this.isLinkable,
            linkConstraints: this.linkConstraints,
            deletable: this.isDeletable,
            links: this.hasLink ? Array.from(this.links).map(function (l) { return l.toElement.id; }) : null
        };
    }
}

document.registerElement('fc-element', FlowChainElement);

/**
 * Define a link beteween two FlowChainElements.
 */
class FlowChainElementLink  {
    constructor(from, to, text) {
        if(!from){
            throw new DOMException('from element is mandatory')
        }
        
        if(!to){
            throw new DOMException('to element is mandatory')
        }
        
        this._fromElement = from;
        this._toElement = to;
        this._text = text || null;
    }
    
    destroy() {
        this._fromElement = null;
        this._toElement = null;
    }
    
    get fromElement() {
        return this._fromElement;
    }
    
    get toElement() {
        return this._toElement;
    }
    
    get text() {
        return this._text;
    }
    
    set text(value) {
        if(this._text === value) return;
        
        this._text = value;
    }

    toJSON() {
        return {
           from: this.fromElement,
           to: this.toElement,
           text: this.text
        };
    }
}