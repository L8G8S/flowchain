'use strict';

class FlowChainHostLinkableManager extends FlowChainHostManager {

    constructor(options) {
        super(Object.assign({
            host: null
        }, options));

        this._trackedElements = new Set();
        this._linkPool = new Set();

        this.initializeEvents();
    }

    initializeEvents() {
        let self = this;

        this._linkPropertyChangeProxy = function linkPropertyChangeProxy () { self.linkPropertyChange.apply(self, [...arguments]); };
        this._linkStartProxy = function linkStartProxy () { self.linkStart.apply(self, [...arguments]); };
        this._linkMoveProxy = function linkMoveProxy () { self.linkMove.apply(self, [...arguments]); };
        this._linkStopProxy = function linkStopProxy () { self.linkStop.apply(self, [...arguments]); };
        this._linkElementHitProxy = function linkElementHitProxy () { self.linkElementHit.apply(self, [...arguments]); };
        this._linkElementLostProxy = function linkElementLostProxy () { self.linkElementLost.apply(self, [...arguments]); };
        
        this._handleLinkAddedProxy = function handleLinkAddedProxy () { self.handleLinkAdded.apply(self, [...arguments]); };
        this._handleLinkRemovedProxy = function handleLinkRemovedProxy () { self.handleLinkRemoved.apply(self, [...arguments]); };
        this._handleLinkDeleteClickProxy = function handleLinkDeleteClickProxy () { self.handleLinkDeleteClick.apply(self, [...arguments]); };
        
        this._linkHostBounds = undefined;
        this._linkHostScroll = undefined;        
    }
    
    destroy() {
        super.destroy();

        Array.from(this._trackedElements).forEach(function(e) {
            e.removeEventListener('linkable', this._linkPropertyChangeProxy);
            e.removeEventListener('linkConstraints', this._linkPropertyChangeProxy);
        }, this);
        this._trackedElements.clear();
        
        window.removeEventListener('mousemove', this._linkMoveProxy);
        window.removeEventListener('mouseup', this._linkStopProxy);
    }
    
    get generatedEvents() {
        return ['linkstart', 'linkstop'];
    }

    linkPropertyChange(evt) {
        let element = evt.srcElement;

        if (element.linkConstraints.indexOf('none') === -1) {
            this.register(element);
        }
        else {
            this.unregister(element);
        }
    }
    
    linkStart(evt) {
        if((evt.which && evt.which !== 1) || (evt.button && evt.button !== 0)) return;
        
        evt.preventDefault();
        evt.stopImmediatePropagation();

        let h = evt.srcElement;
        if (h.linkParent && !this._linkPool.has(h.linkParent) && evt.offsetX < h.linkParent.width  && evt.offsetY < h.linkParent.height) {

            h.linkParent.classList.add('linking');
            h.linkParent.focus();

            // create a fake element so we can ask for a connector rendering
            this._linkHostBounds = this._options.host.getBoundingClientRect();
            this._linkHostScroll = { scrollTop : this._options.host.scrollTop, scrollLeft : this._options.host.scrollLeft};

            let linkNode = document.createElement('div');
            linkNode.classList.add('link-pointer');
            this._options.host.firstElementChild.appendChild(linkNode);

            linkNode.width = linkNode.offsetWidth;
            linkNode.height = linkNode.offsetHeight;
            linkNode.x = (evt.pageX + this._linkHostScroll.scrollLeft - this._linkHostBounds.left - linkNode.width / 2);
            linkNode.y = (evt.pageY + this._linkHostScroll.scrollTop - this._linkHostBounds.top - linkNode.height / 2);
            linkNode.style.left = linkNode.x + 'px';
            linkNode.style.top = linkNode.y + 'px';

            h.linkParent.addLink(linkNode);

            this._linkPool.add(h.linkParent);

            if (this._linkPool.size === 1) {
                this._options.host.setAttribute('action', 'linking');
                window.addEventListener('mousemove', this._linkMoveProxy, false);
                window.addEventListener('mouseup', this._linkStopProxy, false);

                Array.from(this._options.host.elements).forEach(function linkStartElementForEach (d) {
                    if (!d.isLinkable || !h.linkParent.canLinkTo(d)){
                        d.classList.add('not-allowed');
                        return;
                    }
                                        
                    if (h.linkParent._links.has(d)) {
                        d.classList.add('already-linked');
                        return;
                    }

                    d.addEventListener('mouseenter', this._linkElementHitProxy, false);
                    d.addEventListener('mouseleave', this._linkElementLostProxy, false);
                }, this);

                this.dispatchEvent('linkstart', h.linkParent);
            }
        }
    }

    linkElementHit(evt) {
        evt.srcElement.classList.add('linked');

        for(let e of this._linkPool) {
            let linkNode = Array.from(e._links.keys()).find(l => l.classList.contains('link-pointer'));
            if (!linkNode) continue;
            
            e.removeLink(linkNode);
            
            e.addLink(evt.srcElement);
        }
    }

    linkElementLost(evt) {
        evt.srcElement.classList.remove('linked');

        let linkNode = this._options.host.querySelector('.link-pointer');
        if (!linkNode) return;

        for(let e of this._linkPool) {
            if (!e._links.has(evt.srcElement)) continue;
            
            e.removeLink(evt.srcElement);
            
            e.addLink(linkNode);
        }
    }

    linkMove(evt) {
        Array.from(this._linkPool).forEach(function linkMovePoolForEach (e) {
            let linkNode = Array.from(e._links.keys()).find(l => l.classList.contains('link-pointer'));
            if (!linkNode) return;

            linkNode.x = (evt.pageX + this._linkHostScroll.scrollLeft - this._linkHostBounds.left - linkNode.width / 2);
            linkNode.y = (evt.pageY + this._linkHostScroll.scrollTop - this._linkHostBounds.top - linkNode.height / 2);

            linkNode.style.left = linkNode.x + 'px';
            linkNode.style.top = linkNode.y + 'px';
        }, this);
    }

    linkStop(evt) {
        Array.from(this._linkPool).forEach(function linkStopPoolForEach (e) {
            e.classList.remove('linking');
                        
            let linkNode = null;
            for(let l of e._links.keys()) {
                if (l.classList.contains('link-pointer')) linkNode = l;
                if (l.classList.contains('linked')) l.classList.remove('linked');
            }
            
            if (linkNode !== null) e.removeLink(linkNode);
            else e.raisePropertyChange('links');
            
            e.syncDOM();
        });
         
        let linkNode = this._options.host.firstElementChild.querySelector('.link-pointer');
        if (linkNode !== null) this._options.host.firstElementChild.removeChild(linkNode);

        this._linkPool.clear();

        // clean up event listeners
        Array.from(this._options.host.elements).forEach(function linkStopElementForEach (d) {
            d.classList.remove('not-allowed');
            d.classList.remove('already-linked');
            
            d.removeEventListener('mouseenter', this._linkElementHitProxy);
            d.removeEventListener('mouseleave', this._linkElementLostProxy);
        }, this);

        this._options.host.removeAttribute('action');
        window.removeEventListener('mousemove', this._linkMoveProxy);
        window.removeEventListener('mouseup', this._linkStopProxy);

        // fire the linkstop event
        this.dispatchEvent('linkstop');
    }

    addDeleteLinkButton(link) {
        if(!link) return;
        
        if(link.toElement instanceof FlowChainElement) {
            // check and append if necessary a delete button for each links
            let toElementId = link.toElement.id; 
            if(toElementId !== undefined && toElementId !== '') {
                let shadow = link.fromElement.shadowRoot == null ? link.fromElement.createShadowRoot() : link.fromElement.shadowRoot;
                let button = shadow.querySelector('.delete-link[to="' + toElementId + '"]');
                
                if(button === null) {
                    button = document.createElement('div');
                    button.setAttribute('title', 'Delete link');
                    button.setAttribute('to', toElementId);
                    button.classList.add('delete-link');
                    
                    shadow.appendChild(button);
                    
                    button.addEventListener('click', this._handleLinkDeleteClickProxy, false);
                    
                    button.width = button.offsetWidth;
                    button.height = button.offsetHeight;
                    
                    // be careful about this settings
                    button.link = link;
                }
            }
        }
    }
    
    removeDeleteLinkButton(link) {
        if(!link) return;
        
        if(link.toElement instanceof FlowChainElement) {
            let shadow = link.fromElement.shadowRoot;
            let toElementId = link.toElement.id;
            
            let button = shadow.querySelector('.delete-link[to="' + toElementId + '"]')
            if(button !== null) {
                button.link = null; // important to prevent any leak
                button.removeEventListener('click', this._handleLinkDeleteClickProxy, false);
                shadow.removeChild(button);
            }
        }
    }
    
    handleLinkAdded(evt) {
        return this.addDeleteLinkButton(evt.detail);
    }
    
    handleLinkRemoved(evt) {
        return this.removeDeleteLinkButton(evt.detail);
    }
    
    handleLinkDeleteClick(evt) {
        if(evt.which !== 1) return;
        
        let button = evt.srcElement;
        let fromElement = button.link.fromElement;
        let toElement = button.link.toElement;
        
        fromElement.removeLink(toElement);
    }
   
    register(element) {
        if (!(element instanceof HTMLElement)) return;
        
        if(!this._trackedElements.has(element)) {
            this._trackedElements.add(element);
            element.addEventListener('linkable', this._linkPropertyChangeProxy);
            element.addEventListener('linkConstraints', this._linkPropertyChangeProxy);
        }
        
        if (element.linkConstraints.indexOf('none') !==-1 ) return;

        element.addEventListener('linkAdded', this._handleLinkAddedProxy);
        element.addEventListener('linkRemoved', this._handleLinkRemovedProxy);
        element.classList.add('linkable');
        
        // no need to parse links before setting event handlers : if there are few existing no add/remove event should be fired during init
        Array.from(element.links).forEach(function(link) { this.addDeleteLinkButton(link); }, this);

        let wh = element;
        if (this._options.linkHandle) {
            wh = element.querySelector(this._options.linkHandle);
        }

        if (wh) {
            wh.linkParent = element;
            wh.classList.add('link-handle');
            wh.addEventListener('mousedown', this._linkStartProxy, false);
        };
    }

    unregister(element) {
        if (!(element instanceof HTMLElement)) return;

        element.removeEventListener('linkAdded', this._handleLinkAddedProxy);
        element.removeEventListener('linkRemoved', this._handleLinkRemovedProxy);
        element.classList.remove('linkable');

        // NOTE: removal done after all handlers are closed
        Array.from(element.links).forEach(function unregisterRemoveDeleteLinkForEach (link) { this.removeDeleteLinkButton(link); }, this);

        let wh = element;
        if (this._options.linkHandle) {
            wh = element.querySelector(this._options.linkHandle);
        }

        if (wh) {
            wh.removeEventListener('mousedown', this._linkStartProxy, false);
            wh.linkParent = undefined;
            wh.classList.remove('link-handle');
        }
    }
}