'use strict';

class FlowChainHostSizableManager extends FlowChainHostManager {

    constructor(options) {
        super(Object.assign({
            host: null,
            gridSize: [10, 10],
            snapToGrid: true
        }, options));

        this._trackedElements = new Set();
        this._sizePool = new Set();
        this._handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

        this.initializeEvents();       
    }

    initializeEvents() {
        let self = this;
        
        this._handleSizableChangedProxy = function handleSizableChangedProxy () { self.handleSizableChanged.apply(self, [...arguments]); };
        this._handleSizeStartProxy = function handleSizeStartProxy () { self.handleSizeStart.apply(self, [...arguments]); };
        this._handleSizeMoveProxy = function handleSizeMoveProxy () { self.handleSizeMove.apply(self, [...arguments]); };
        this._handleSizeStopProxy = function handleSizeStopProxy () { self.handleSizeStop.apply(self, [...arguments]); };
    }
    
    destroy() {
        super.destroy();
        
        Array.from(this._trackedElements).forEach(function(e) {
            e.addEventListener('sizable', this._handleSizableChangedProxy);
        }, this);
        this._trackedElements.clear();
    }
    
    get generatedEvents() {
        return ['handleSizeStart', 'handleSizeStop'];
    }

    handleSizableChanged(evt) {
        let element = evt.srcElement;

        if (element.isSizable === true) {
            this.register(element);
        }
        else {
            this.unregister(element);
        }
    }

    createResizeHandle(type) {
        let handle = document.createElement('div');
        handle.classList.add('size-handle');
        handle.classList.add(type);

        return handle;
    }

    handleSizeStart(evt) {
        evt.stopImmediatePropagation();

        let h = evt.srcElement,
            e = h.sizeParent;
        
        if (!e.isSizable) return;

        let style = window.getComputedStyle(e);

        e.sizeInfo = {
            x: e.x,
            y: e.y,
            minWidth: (style.minWidth != 'none') ? parseFloat(style.minWidth) : 0,
            minHeight: (style.minHeight != 'none') ? parseFloat(style.minHeight) : 0,
            maxWidth: (style.maxWidth != 'none') ? parseFloat(style.maxWidth) : Number.POSITIVE_INFINITY,
            maxHeight: (style.maxHeight != 'none') ? parseFloat(style.maxHeight) : Number.POSITIVE_INFINITY,
            width: parseFloat(style.width),
            height: parseFloat(style.height)
        };

        if (e.sizeInfo.height > e.sizeInfo.minHeight) e.sizeInfo.y += (e.sizeInfo.height - e.sizeInfo.minHeight);
        if (e.sizeInfo.width > e.sizeInfo.minWidth) e.sizeInfo.x += (e.sizeInfo.width - e.sizeInfo.minWidth);

        e.classList.add('sizing');

        this._sizePool.add(h);

        if (this._sizePool.size === 1) {

            let actionValue = 'sizing ';
            if (h.classList.contains('n')) actionValue += 'n';
            else if (h.classList.contains('ne')) actionValue += 'ne';
            else if (h.classList.contains('nw')) actionValue += 'nw';
            else if (h.classList.contains('s')) actionValue += 's';
            else if (h.classList.contains('se')) actionValue += 'se';
            else if (h.classList.contains('sw')) actionValue += 'sw';
            else if (h.classList.contains('e')) actionValue += 'e';
            else if (h.classList.contains('w')) actionValue += 'w';

            this._options.host.setAttribute('action', actionValue);

            window.addEventListener('mousemove', this._handleSizeMoveProxy);
            window.addEventListener('mouseup', this._handleSizeStopProxy);

            this.dispatchEvent('handleSizeStart', h.sizeParent);
        }
    }

    handleSizeMoveCheckHeight(ci) {
        let baseY = ci.mouseY - ci.pBoudingRect.top;
        let expectedY = baseY;
        if (this._options.snapToGrid) {
            let fy = Math.round(expectedY / this._options.gridSize[1]);
            expectedY = fy * this._options.gridSize[1];
        }

        let diff = expectedY - baseY;

        let expectedHeight = ci.eBoundingRect.height + (ci.eBoundingRect.top - ci.mouseY) - diff;
        if (expectedHeight >= ci.sizeInfo.minHeight && expectedHeight <= ci.sizeInfo.maxHeight) {
            ci.e.y = expectedY;
            ci.e.height = expectedHeight;
            ci.e.style.height = expectedHeight + 'px';
        }
        else {
            ci.e.y = ci.sizeInfo.y;
            ci.e.height = ci.sizeInfo.minHeight;
            ci.e.style.height = ci.sizeInfo.minHeight + 'px';
        }
    }

    handleSizeMoveCheckWidth(ci) {
        let baseX = ci.mouseX - ci.pBoudingRect.left;
        let expectedX = baseX;
        if (this._options.snapToGrid) {
            let fx = Math.round(expectedX / this._options.gridSize[0]);
            expectedX = fx * this._options.gridSize[0];
        }

        let diff = expectedX - baseX;

        let expectedWidth = ci.eBoundingRect.width + (ci.eBoundingRect.left - ci.mouseX) - diff;
        if (expectedWidth >= ci.sizeInfo.minWidth && expectedWidth <= ci.sizeInfo.maxWidth) {
            ci.e.x = expectedX;
            ci.e.width = expectedWidth;
            ci.e.style.width = expectedWidth + 'px';
        }
        else {
            ci.e.x = ci.sizeInfo.x;
            ci.e.width = ci.sizeInfo.minWidth;
            ci.e.style.width = ci.sizeInfo.minWidth + 'px';
        }
    }

    handleSizeMoveSnapWidth(ci) {
        let expectedWidth = (ci.mouseX - ci.eBoundingRect.left);
        if (this._options.snapToGrid) {
            let fw = Math.round(expectedWidth / this._options.gridSize[0]);
            expectedWidth = fw * this._options.gridSize[0];
        }

        ci.e.width = expectedWidth;
        ci.e.style.width = expectedWidth + 'px';
    }

    handleSizeMoveSnapHeight(ci) {
        let expectedHeight = (ci.mouseY - ci.eBoundingRect.top);
        if (this._options.snapToGrid) {
            let fh = Math.round(expectedHeight / this._options.gridSize[1]);
            expectedHeight = fh * this._options.gridSize[1];
        }
        ci.e.height = expectedHeight;
        ci.e.style.height = expectedHeight + 'px';
    }

    handleSizeMove(evt) {
        for(let h of this._sizePool) {
            let e = h.sizeParent;

            let checkInfo = {
                e: e,
                sizeInfo: e.sizeInfo,
                pBoudingRect: e.parentElement.getBoundingClientRect(),
                eBoundingRect: e.getBoundingClientRect(),
                mouseY: (evt.pageY - document.body.scrollTop),
                mouseX: (evt.pageX - document.body.scrollLeft)
            };

            if (h.classList.contains('n')) {
                this.handleSizeMoveCheckHeight(checkInfo);
            }
            else if (h.classList.contains('ne')) {
                this.handleSizeMoveCheckHeight(checkInfo);
                this.handleSizeMoveSnapWidth(checkInfo);
            }
            else if (h.classList.contains('nw')) {
                this.handleSizeMoveCheckHeight(checkInfo);
                this.handleSizeMoveCheckWidth(checkInfo);
            }
            else if (h.classList.contains('s')) {
                this.handleSizeMoveSnapHeight(checkInfo);
            }
            else if (h.classList.contains('e')) {
                this.handleSizeMoveSnapWidth(checkInfo);
            }
            else if (h.classList.contains('se')) {
                this.handleSizeMoveSnapWidth(checkInfo);
                this.handleSizeMoveSnapHeight(checkInfo);
            }
            else if (h.classList.contains('w')) {
                this.handleSizeMoveCheckWidth(checkInfo);
            }
            else if (h.classList.contains('sw')) {
                this.handleSizeMoveCheckWidth(checkInfo);
                this.handleSizeMoveSnapHeight(checkInfo);
            }
        }
    }

    handleSizeStop(evt) {
        for(let h of this._sizePool) {
            h.sizeParent.sizeInfo = undefined;
            h.sizeParent.classList.remove('sizing');
            h.sizeParent.syncDOM();
        }
        this._sizePool.clear();

        this._options.host.removeAttribute('action');
        window.removeEventListener('mousemove', this._handleSizeMoveProxy);
        window.removeEventListener('mouseup', this._handleSizeStopProxy);

        this.dispatchEvent('handleSizeStop');
    }

    register(element) {
        if (!(element instanceof HTMLElement)) return;
        
        if(!this._trackedElements.has(element)) {
            this._trackedElements.add(element);
            element.addEventListener('sizable', this._handleSizableChangedProxy);
        }
                
        if (!element.isSizable) return;

        element.classList.add('sizable');
        
        let shadow = element.shadowRoot == null ? element.createShadowRoot() : element.shadowRoot;
        let content = shadow.querySelector('content');

        if(content === null) {
            content = document.createElement('content');
            content.select = '*';
            
            shadow.appendChild(content);
        }
            
        this._handles.forEach(function (h) {
            let handle = this.createResizeHandle(h);

            handle.sizeParent = element;
            handle.addEventListener('mousedown', this._handleSizeStartProxy, true);
        
            shadow.appendChild(handle);
        }, this);
    }

    unregister(element) {
        if (!(element instanceof HTMLElement)) return;

        element.classList.remove('sizable');

        if(element.shadowRoot !== null){
            Array.from(element.shadowRoot.querySelectorAll('.size-handle')).forEach(function(handle) {
                handle.removeEventListener('mousedown', this._handleSizeStartProxy, true);
                element.shadowRoot.removeChild(handle);
            }, this); 
        }
        else {
            Array.from(element.querySelectorAll(':scope > .size-handle')).forEach(function(handle) {
                handle.removeEventListener('mousedown', this._handleSizeStartProxy, true);
                element.shadowRoot.removeChild(handle);
            }, this);
        }
    }
}