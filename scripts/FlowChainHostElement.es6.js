'use strict';

class FlowChainHostElement extends HTMLDivElement {

    initializeElementBuilder() {
        let managerName = this.getAttribute('fc-builder') || '';

        if (managerName.length === 0) {
            this.elementBuilder = null;
        }
        else {
            if (managerName.indexOf('ElementBuilder') === -1) {
                managerName += 'ElementBuilder';
            }

            this.elementBuilder = eval('new ' + managerName + '({ host: this })');
        }

        this.elementBuilder.initialize();
    }

    initializeLayoutManager() {
        let managerName = this.getAttribute('fc-layout') || '';

        if (managerName.length === 0) {
            this.layoutManager = null;
        }
        else {
            if (managerName.indexOf('LayoutManager') === -1) {
                managerName += 'LayoutManager';
            }

            this.layoutManager = eval('new ' + managerName + '({ host: this })');
        }

        this.layoutManager.initialize();
    }

    initializeLinkRenderer() {
        let managerName = this.getAttribute('fc-renderer') || '';

        if (managerName.length === 0) {
            this.linkRenderer = null;
        }
        else {
            if (managerName.indexOf('LinkRenderer') === -1) {
                managerName += 'LinkRenderer';
            }

            this.linkRenderer = eval('new ' + managerName + '({ host: this })');
        }

        this.linkRenderer.initialize();
    }

    initializeInteractionManager() {
        let managerName = this.getAttribute('fc-interaction') || '';

        if (managerName.length === 0) {
            this.interactionManager = null;
        }
        else {
            if (managerName.indexOf('InteractionManager') === -1) {
                managerName += 'InteractionManager';
            }

            this.interactionManager = eval('new ' + managerName + '({ host: this })');
        }

        this.interactionManager.initialize();
    }

    initializeStorageManager() {
        let managerName = this.getAttribute('fc-storage') || '';

        if (managerName.length === 0) {
            this.storageManager = null;
        }
        else {
            if (managerName.indexOf('StorageManager') === -1) {
                managerName += 'StorageManager';
            }

            this.storageManager = eval('new ' + managerName + '({ host: this })');
        }

        this.storageManager.initialize();
    }

    initialize() {
        this.beginInitialize();

        // initialize common event handlers
        let self = this;
        this._interactionStartProxy = function interactionStartProxy(what) { if (!self.isInitializing) self.linkRenderer.startWire(what); };
        this._interactionStopProxy = function interactionStopProxy() { if (!self.isInitializing) self.linkRenderer.stopWire(); };
        this._handleElementAttachedProxy = function handleElementAttachedProxy() { self.handleElementAttached.apply(self, [...arguments]); };
        this._handleElementDetachedProxy = function handleElementDetachedProxy() { self.handleElementDetached.apply(self, [...arguments]); };
        this._mutationProxy = function mutationProxy(mutations) {
            mutations.forEach(function mutationForEach(mutation) {
                if (mutation.type === 'attributes') {
                    switch (mutation.attributeName) {
                        case 'fc-builder':
                            self.initializeElementBuilder();
                            break;

                        case 'fc-layout':
                            self.initializeLayoutManager();
                            break;

                        case 'fc-renderer':
                            self.initializeLinkRenderer();
                            break;

                        case 'fc-interaction':
                            self.initializeInteractionManager();
                            break;

                        case 'fc-storage':
                            self.initializeStorageManager();
                            break;

                        case 'fc-name':
                            self.name = self.getAttribute('fc-name');
                            break;

                        case 'fc-mode':
                            self.mode = self.getAttribute('fc-mode');
                            break;

                        case 'fc-unique-identifier':
                            self.uid = self.getAttribute('fc-unique-identifier');
                            break;
                    }

                    self.layoutManager.attributeChangedCallback(mutation.attributeName);
                    self.linkRenderer.attributeChangedCallback(mutation.attributeName);
                    self.interactionManager.attributeChangedCallback(mutation.attributeName);
                    self.storageManager.attributeChangedCallback(mutation.attributeName);
                }
                else if (mutation.type === 'childList') {
                    Array.from(mutation.addedNodes).forEach(function mutationAddForEach(e) {
                        self.handleElementAttached({ srcElement: e });
                    });

                    Array.from(mutation.removedNodes).forEach(function mutationRemForEach(e) {
                        self.handleElementDetached({ srcElement: e });
                    });
                }
            });
        };

        // create the root group
        let root = document.createElement('fc-group');
        root.isDraggable = false;
        root.isLinkable = false;
        root.linkConstraints = 'none';
        root.isSizable = false;
        root.name = 'root';
        root.classList.add('root');
        this.insertBefore(root, this.firstElementChild);
        this.register(root);

        // manager(s)
        this.initializeElementBuilder();
        this.initializeLayoutManager();
        this.initializeLinkRenderer();
        this.initializeInteractionManager();
        this.initializeStorageManager();

        // check if there are elements placed inside the host 
        //let existingElements = Array.from(this.querySelectorAll('fc-element,fc-group:not([name="root"])')); //:scope > 
        Array.from(this.querySelectorAll('*')).forEach(function initializeForEach(child) {
            if (child === root) return;

            if (child.parentElement === this) root.appendChild(child);

            child.addEventListener('attached', this._handleElementAttachedProxy); // NOTE: possible leak on unsupported elements
        }, this);

        this.initializeFromAttributes();

        this.endInitialize();
    }

    initializeFromAttributes() {
        this.uid = this.getAttribute('fc-unique-identifier');
        this.mode = this.getAttribute('fc-mode') || "design";
        this.name = this.getAttribute('fc-name') || "flow_chain";
        //this.zoom = this.getAttribute('fc-zoom') != null ? parseFloat(this.getAttribute('fc-zoom')) : 100;
    }

    get isInitializing() {
        return (this._initializing = (this._initializing || false));
    }

    get uid() {
        if (this._uid === undefined || this._uid === 'undefined' || this._uid === null || this._uid === 'null' || this._uid === '') {
            this._uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8; return v.toString(16); });
        }

        return this._uid;
    }

    set uid(value) {
        if (this._uid === value) return;

        this._uid = value;
        this.setAttribute('fc-unique-identifier', this.uid);
    }

    get mode() {
        if (this._mode === undefined) this._mode = 'design';

        return this._mode;
    }

    set mode(value) {
        if (this._mode === value) return;

        this._mode = value || 'design';
        this.setAttribute('fc-mode', this._mode);
    }

    get name() {
        if (this._name === undefined) this._name = 'flow_chain';

        return this._name;
    }

    set name(value) {
        if (this._name === value) return;

        this._name = value || 'flow_chain';
        this.storageManager.setDownloadFileName(this._name);
    }

    /*
    get zoom() {
        return (this._zoom = (this._zoom || 100));
    }

    set zoom(value) {
        if (this._zoom === value) return;

        this._zoom = value;
        this.setAttribute('fc-zoom', this.zoom);

        let cssZoom = (this.zoom / 100);
    }
    */

    get elements() {
        return (this._elements = (this._elements || new Set()));
    }

    get elementBuilder() {
        return (this._elementBuilder = (this._elementBuilder || new FlowChainElementBuilder({ host: this })));
    }

    set elementBuilder(value) {
        if (value === this._elementBuilder || value === null) return;

        if (this._elementBuilder) this._elementBuilder.destroy();

        this._elementBuilder = value;
    }

    get layoutManager() {
        if (!this._layoutManager) {
            this._layoutManager = new FlowChainHostLayoutManager({ host: this });
            this._layoutManager.initialize();
        }

        return this._layoutManager;
    }

    set layoutManager(value) {
        if (value === this._layoutManager || value === null) return;
        //if(value === null && this._layoutManager && this._layoutManager.constructor.name === 'FlowChainHostLayoutManager') return;

        if (this._layoutManager) this._layoutManager.destroy();

        this._layoutManager = value;

        this.layoutManager.layout();
    }

    get linkRenderer() {
        if (!this._linkRenderer) {
            this._linkRenderer = new FlowChainHostLinkRenderer({ host: this });
            this._linkRenderer.initialize();
        }

        return this._linkRenderer;
    }

    set linkRenderer(value) {
        if (value === this._linkRenderer || value === null) return;
        //if(value === null && this._linkRenderer && this._linkRenderer.constructor.name === 'FlowChainHostLinkRenderer') return;        

        if (this._linkRenderer) this._linkRenderer.destroy();

        this._linkRenderer = value;

        this.linkRenderer.render();
    }

    get interactionManager() {
        if (!this._interactionManager) {
            this._interactionManager = new FlowChainHostInteractionManager({ host: this });
            this._interactionManager.initialize();

            this.addStartStopListenerTo(this._interactionManager, this._interactionStartProxy, this._interactionStopProxy);
        }

        return this._interactionManager;
    }

    set interactionManager(value) {
        if (value === this._interactionManager || value === null) return;
        //if(value === null && this._interactionManager && this._interactionManager.constructor.name === 'FlowChainHostInteractionManager') return;

        this.removeStartStopListenerFrom(this._interactionManager, this._interactionStartProxy, this._interactionStopProxy);
        this.unregisterElementsFrom(this._interactionManager);
        if (this._interactionManager) this._interactionManager.destroy();

        this._interactionManager = value;

        this.addStartStopListenerTo(this._interactionManager, this._interactionStartProxy, this._interactionStopProxy);
        this.registerElementsIn(this._interactionManager);
    }

    get storageManager() {
        if (!this._storageManager) {
            this._storageManager = new FlowChainHostStorageManager({ host: this });
            this._storageManager.initialize();
        }

        return this._storageManager;
    }

    set storageManager(value) {
        if (value === this._storageManager || value === null) return;

        this.unregisterElementsFrom(this._storageManager);
        if (this._storageManager) this._storageManager.destroy();

        this._storageManager = value;

        this.registerElementsIn(this._storageManager);
    }

    createdCallback() {
        this.initialize();
    }

    attachedCallback() {
        // create an observer to get DOM changes
        if (this._observer === undefined) {
            this._observer = new MutationObserver(this._mutationProxy);
            this._observer.observe(this, { attributes: true, childList: true, subtree: true });
        }

        // perform (default) layout and rendering
        this.update();
    }

    detachedCallback() {
        this._observer.disconnect();
    }

    handleElementAttached(evt) {
        let element = (evt.srcElement instanceof FlowChainElement)
            ? evt.srcElement
            : (evt instanceof FlowChainElement)
                ? evt
                : undefined;

        if (element !== undefined) {
            this._elementsFoundDuringInit -= (evt.srcElement) ? 1 : 0;

            element.removeEventListener('attached', this._handleElementAttachedProxy);
            element.addEventListener('detached', this._handleElementDetachedProxy);

            this.register(element);

            this.update();
        }
    }

    handleElementDetached(evt) {
        let element = (evt.srcElement instanceof FlowChainElement)
            ? evt.srcElement
            : (evt instanceof FlowChainElement)
                ? evt
                : undefined;

        if (element !== undefined && element.parentElement == null) {
            element.removeEventListener('detached', this._handleElementDetachedProxy);
            element.addEventListener('attached', this._handleElementAttachedProxy);

            this.unregister(element);

            this.update();
        }
    }

    register(element) {
        if (this.elements.has(element)) return;

        if (!element.classList.contains('root')) {
            this.elementBuilder.build(element);
            this.layoutManager.register(element);
            this.linkRenderer.register(element);
            this.interactionManager.register(element);
        }

        this.storageManager.register(element);

        this.elements.add(element);
    }

    unregister(element) {
        if (!this.elements.has(element)) return;

        if (!element.classList.contains('root')) {
            this.elements.delete(element);

            this.storageManager.unregister(element);
            this.interactionManager.unregister(element);
            this.linkRenderer.unregister(element);
            this.layoutManager.unregister(element);
        }
    }

    addStartStopListenerTo(manager, startCallback, stopCallback) {
        if (!manager || !(manager instanceof FlowChainHostManager) || !startCallback || !stopCallback) return;

        manager.generatedEvents.forEach(function (eventName) {
            if (eventName.indexOf('start') != -1) {
                manager.addEventListener(eventName, startCallback);
            }
            else if (eventName.indexOf('stop') != -1) {
                manager.addEventListener(eventName, stopCallback);
            }
        });
    }

    removeStartStopListenerFrom(manager, startCallback, stopCallback) {
        if (!manager || !(manager instanceof FlowChainHostManager) || !startCallback || !stopCallback) return;

        manager.generatedEvents.forEach(function (eventName) {
            if (eventName.indexOf('start') != -1) {
                manager.removeEventListener(eventName, startCallback);
            }
            else if (eventName.indexOf('stop') != -1) {
                manager.removeEventListener(eventName, stopCallback);
            }
        });
    }

    registerElementsIn(manager) {
        if (!manager || !(manager instanceof FlowChainHostManager)) return;

        Array.from(this.elements).forEach(function registerElementsInForEach(el) { manager.register(el); });
    }

    unregisterElementsFrom(manager) {
        if (!manager || !(manager instanceof FlowChainHostManager)) return;

        Array.from(this.elements).forEach(function unregisterElementsFromForEach(el) { manager.unregister(el); });
    }

    beginInitialize() {
        if (!this.isInitializing) {
            this.setAttribute('action', 'initializing');

            this._elementsFoundDuringInit = 0;
            this._initializing = true;
        }
    }

    endInitialize() {
        if (this.isInitializing) {
            this.removeAttribute('action');

            this._elementsFoundDuringInit = this.querySelectorAll('fc-element,fc-group:not([name="root"])').length;
            this._initializing = false;

            this.update();
        }
    }

    suspend() {
        if (!this.isInitializing) {
            this.setAttribute('action', 'initializing');
            this._initializing = true;
        }
    }

    resume() {
        if (this.isInitializing) {
            this.removeAttribute('action');

            this._initializing = false;
            this.update();
        }
    }

    update() {
        if (this._elementsFoundDuringInit <= 0 && !this.isInitializing) {
            this.layoutManager.layout();
            this.linkRenderer.render();
        }
    }

    save() {
        if (!this.isInitializing) {
            this.storageManager.save();
        }
    }

    removeElement(element) {
        if (!this._elements.has(element) || element.classList.contains('root')) return;

        // unregister handlers before removing the node
        this.unregister(element);

        // remove all link references
        element.removeLinks();

        // remove references to the removed node
        Array.from(this._elements)
            .filter(function removeElementFilter(el) { return el.isLinkedTo(element); })
            .forEach(function (el) { el.removeLink(element); });

        // then safely remove it from the DOM
        element.parentNode.removeChild(element);
    }

    clear() {
        this.beginInitialize();

        Array.from(this.elements).forEach(this.removeElement, this);

        this.endInitialize();
    }

    toJSON() {
        let output = [];
        let root = this.firstElementChild;

        for (let e of Array.from(this.elements).slice(1)) {
            if (e.parentElement === root) output.push(e);
        }

        return {
            uid: this.uid,
            name: this.getAttribute('fc-name') ? this.getAttribute('fc-name') : null,
            /*zoom: this.zoom,*/
            elements: this.elements.size > 1 ? output : null
        };
    }

    *[Symbol.iterator]() {
        yield* this.elements;
    }
}

document.registerElement("fc-host", FlowChainHostElement);