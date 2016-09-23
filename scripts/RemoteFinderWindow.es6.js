'use strict';

class RemoteFinderWindow extends HTMLDivElement {

    raisePropertyChange(propertyName, detail, namedEvent) {
        namedEvent = namedEvent || this.isAttached;
        
        if (namedEvent === true) {
            this.dispatchEvent(new CustomEvent(propertyName, { bubbles: true, cancelable: false, detail: detail }));
        }

        this.dispatchEvent(new CustomEvent("property", { bubbles: true, cancelable: false, detail: { name: propertyName, value: detail } }));
    }
    
    raisePropertyChangeAsync(propertyName, detail, namedEvent) {
        let self = this;
        setTimeout(function raisePropertyChangeTimer () {
            self.raisePropertyChange(propertyName, detail, namedEvent);
        }, 0);
    }
    
    dispatchEventAsync(event) {
        let self = this;
        setTimeout(function dispatchEventAsyncTimer () {
            self.dispatchEvent(event);
        }, 0);
    }

    get isAttached() {
        return (this._isAttached = (this._isAttached || false));
    }
    
    set isAttached(value) {
        if (this._isAttached === value) return;

        this._isAttached = value;
        
        this.raisePropertyChange(this.isAttached ? 'attached' : 'detached', value, true);
    }
    
    get title() {
        return this._title || (this._title = '');
    }

    set title(value) {
        if(this._title === value) return;
        
        this._title = value;
        
        let titlebar = this.querySelector('rf-window-titlebar');
        if(titlebar !== null) titlebar.innerHTML = "<span>" + value + "</span>";
        
        this.raisePropertyChange('title', value);
    }
    
    get filesystemUrl() {
        return this._filesystemUrl;    
    }
    
    set filesystemUrl(value) {
        if(this._filesystemUrl === value) return;
        
        this._filesystemUrl = value;
        this.raisePropertyChange('filesystemUrl', value);
        this.syncFilesystem();
    }
    
    get filesystemFilters() {
        return this._filesystemFilters;    
    }
    
    set filesystemFilters(value) {
        if(this._filesystemFilters === value) return;
        
        this._filesystemFilters = value;
        this.raisePropertyChange('filesystemFilters', value);
        this.syncFilesystem();
    }
    
    get selectedFiles() {
        return Array.from(this.querySelectorAll('rf-file-list .file.selected')).map(function(f) { return f.fileInfo.path; });
    }
    
    get x() {
        return (this._x = (this._x || 0));
    }

    set x(value) {
        if (this._x === value) return;

        this._x = value;
        this.style.left = this.x + 'px';
        
        this.raisePropertyChange('x', value);
    }

    get y() {
        return (this._y = (this._y || 0));
    }

    set y(value) {
        if (this._y === value) return;

        this._y = value;
        this.style.top = this.y + 'px';
        
        this.raisePropertyChange('y', value);
    }

    get width() {
        return this._width;
    }

    set width(value) {
        if (value === this._width) return;

        this._width = value;
        this.style.width = value + 'px';
        
        this.raisePropertyChange('width', value);
    }

    get height() {
        return this._height;
    }

    set height(value) {
        if (value === this._height) return;

        this._height = value;
        this.style.height = value + 'px';
        
        this.raisePropertyChange('height', value);
    }
    
    get isSizable() {
        return this._sizable;
    }

    set isSizable(value) {
        if (this._sizable === value) return;

        this._sizable = value;
        this.initializeSizable();
        
        this.raisePropertyChange('sizable', value);
    }
    
    get isDraggable() {
        return this._draggable;
    }

    set isDraggable(value) {
        if (this._draggable === value) return;

        this._draggable = value;
        this.initializeDraggable();

        this.raisePropertyChange('draggable', value);   
    }

    initializeFromAttributes() {
        this.width = 0;
        this.height = 0;
        
        this.title = this.getAttribute('rf-title') || '';
        this.filesystemUrl = this.getAttribute('rf-filesystem-url') || '';
        this.filesystemFilters = (this.getAttribute('rf-filesystem-filters') || '*').split(',');
        
        this.x = parseFloat(this.getAttribute('rf-pos-x') || this.x);
        this.y = parseFloat(this.getAttribute('rf-pos-y') || this.y);
        this.width = parseFloat(this.getAttribute('rf-width') || this.width);
        this.height = parseFloat(this.getAttribute('rf-height') || this.height);
        
        this.isSizable = (this.getAttribute('rf-sizable') === null || this.getAttribute('rf-sizable') === 'true');
        this.isDraggable = (this.getAttribute('rf-draggable') === null || this.getAttribute('rf-draggable') === 'true');
    }
    
    createShadowFor(element) {
        let shadow = element.shadowRoot == null ? element.createShadowRoot() : element.shadowRoot;
        let content = shadow.querySelector('content');

        if(content === null) {
            content = document.createElement('content');
            content.select = '*';
            
            shadow.appendChild(content);
        }
        
        return shadow;
    }
    
    initializeTitlebarDOM(){
        let titlebar = this.querySelector('rf-window-titlebar');

        if(titlebar === null) {
            titlebar = document.createElement('rf-window-titlebar');
            titlebar.innerHTML = '<span>'+ this.title + '</span>';
            this.appendChild(titlebar);
        }     

        let shadow = this.createShadowFor(titlebar);
        let closeButton = document.createElement('div');
        closeButton.setAttribute('tabindex', '0');
        closeButton.classList.add('close-button');
        shadow.appendChild(closeButton);
    }
    
    initializeContentDOM (){
        let content = this.querySelector('rf-window-content');
        let directoryList = this.querySelector('rf-directory-list');
        let fileList = this.querySelector('rf-file-list');

        if(content === null) {
            content = document.createElement('rf-window-content');
            
            if(directoryList === null) {
                directoryList = document.createElement('rf-directory-list');
                directoryList.classList.add('sizable');
                
                let shadow = this.createShadowFor(directoryList);
                let handle = document.createElement('div');
                handle.classList.add('size-handle');
                handle.classList.add('ew');
            
                shadow.appendChild(handle);
            }
            
            if(fileList === null) {
                fileList = document.createElement('rf-file-list');
            }
            
            content.appendChild(directoryList);
            content.appendChild(fileList);
            
            this.appendChild(content);
        }
    }
    
    initializeStatusbarDOM(){
        let status = this.querySelector('rf-window-statusbar');

        if(status === null) {
            status = document.createElement('rf-window-statusbar');
            
            let openButton = document.createElement('button');
            openButton.innerHTML = 'Open';
            openButton.classList.add('default');
            
            let cancelButton = document.createElement('button');
            cancelButton.innerHTML = 'Cancel';

            status.appendChild(openButton);
            status.appendChild(cancelButton);
            
            this.appendChild(status);
        }
    }
    
    initializeDOM() {
        this.initializeTitlebarDOM();
        this.initializeContentDOM();
        this.initializeStatusbarDOM();
                
        let shadow = this.createShadowFor(this);
        let handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
        handles.forEach(function (h) {
            let handle = document.createElement('div');
            handle.classList.add('size-handle');
            handle.classList.add(h);
            handle.sizeParent = this;
        
            shadow.appendChild(handle);
        }, this);
    }
    
    syncDOM() {
        this._updatingDOM = true;
        
        this.setAttribute("rf-title", this.title);
        this.setAttribute("rf-pos-y", this.y);
        this.setAttribute("rf-pos-x", this.x);
        this.setAttribute("rf-width", this.width);
        this.setAttribute("rf-height", this.height);
                
        if (this.isDraggable) this.removeAttribute('rf-draggable');
        else this.setAttribute('rf-draggable', 'false');

        if (this.isSizable) this.removeAttribute('rf-sizable');
        else this.setAttribute('rf-sizable', 'false');
        
        this._updatingDOM = false;
    }
    
    initializeEvents() {
        let self = this;
        
        this._dragStartProxy = function dragStartProxy () { self.dragStart.apply(self, [...arguments]); };
        this._dragMoveProxy = function dragMoveProxy () { self.dragMove.apply(self, [...arguments]); };
        this._dragStopProxy = function dragStopProxy () { self.dragStop.apply(self, [...arguments]); };
        
        this._sizeStartProxy = function sizeStartProxy () { self.sizeStart.apply(self, [...arguments]); };
        this._sizeMoveProxy = function sizeMoveProxy () { self.sizeMove.apply(self, [...arguments]); };
        this._sizeStopProxy = function sizeStopProxy () { self.sizeStop.apply(self, [...arguments]); };
        
        this._directorySizeStartProxy = function directorySizeStartProxy () { self.directorySizeStart.apply(self, [...arguments]); };
        this._directorySizeMoveProxy = function directorySizeMoveProxy () { self.directorySizeMove.apply(self, [...arguments]); };
        this._directorySizeStopProxy = function directorySizeStopProxy () { self.directorySizeStop.apply(self, [...arguments]); };
                
        this._directoryClickProxy = function directoryClickProxy () { self.directoryClick.apply(self, [...arguments]); };
        this._directoryKeyupProxy = function directoryKeyupProxy () { self.directoryKeyup.apply(self, [...arguments]); };
        this._fileClickProxy = function directoryClickProxy () { self.fileClick.apply(self, [...arguments]); };
        this._fileKeyupProxy = function directoryKeyupProxy () { self.fileKeyup.apply(self, [...arguments]); };
        
        this._closeButtonClickProxy = function closeButtonClickProxy () { self.close.apply(self, [...arguments]); };
        this._openButtonClickProxy = function openButtonClickProxy () { self.openButtonClick.apply(self, [...arguments]); };
        this._cancelButtonClickProxy = function cancelButtonClickProxy () { self.cancelButtonClick.apply(self, [...arguments]); };
    }
   
    initializeDraggable() {
        let titlebar = this.querySelector('rf-window-titlebar');
        if(titlebar !== null) {
            if(this.isDraggable) {
                this.classList.add('draggable');
                titlebar.addEventListener('mousedown', this._dragStartProxy);       
            }
            else {
                this.classList.remove('draggable');
                titlebar.removeventListener('mousedown', this._dragStartProxy);
            }
        }
    }
    
    initializeSizable () {
        let shadow = this.createShadowFor(this);
        
        Array.from(shadow.querySelectorAll('.size-handle')).forEach(function(handle) {
            if(this.isSizable) {
                handle.addEventListener('mousedown', this._sizeStartProxy, true);   
            }
            else {
                handle.removeEventListener('mousedown', this._sizeStartProxy, true);
            }
        }, this);
        
        if(this.isSizable) {
            this.classList.add('sizable');
        }
        else {
            this.classList.remove('sizable');
        }
    }
    
    initializeDirectorySizable () {
        let directoryList = this.querySelector('rf-directory-list');
        let shadow = this.createShadowFor(directoryList);
        
        Array.from(shadow.querySelectorAll('.size-handle')).forEach(function(handle) {
            handle.addEventListener('mousedown', this._directorySizeStartProxy, true);
        }, this);
    }

    initializeClosable() {
        let closeButton = this.querySelector('rf-window-titlebar').shadowRoot.querySelector('.close-button');
        if(closeButton !== null) closeButton.addEventListener('click', this._closeButtonClickProxy);
        
        let status = this.querySelector('rf-window-statusbar');
        let openButton = status.querySelector('button:nth-child(1)');
        let cancelButton = status.querySelector('button:nth-child(2)');
        if(openButton !== null) openButton.addEventListener('click', this._openButtonClickProxy);
        if(cancelButton !== null) cancelButton.addEventListener('click', this._cancelButtonClickProxy);
    }

    createdCallback() {
        this._updatingDOM = false;
        
        this.initializeFromAttributes();
        this.initializeDOM();
        this.initializeEvents();
        
        this.initializeDraggable();
        this.initializeSizable();
        this.initializeDirectorySizable();
        this.initializeClosable();

        this.dispatchEvent(new CustomEvent('created', { bubbles: true, cancelable: false}));
    }

    attachedCallback() {
        this.width = this.offsetWidth;
        this.height = this.offsetHeight;

        this.isAttached = true;
        this.syncFilesystem();
        this.syncDOM();
    }

    detachedCallback() {
        this.isAttached = false;
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        if(this._updatingDOM === true) return;
                
        switch(attrName) {
            case 'rf-title':
                this.title = this.getAttribute('rf-title') || '';
                break;
                
            case 'rf-filesystem-url':
                this.filesystemUrl = this.getAttribute('rf-filesystem-url') || '';
                break;

            case 'rf-filesystem-filters':
                this.filesystemFilters = (this.getAttribute('rf-filesystem-filters') || '*').split(',');
                break;
                
            case 'rf-pos-x':
                this.x = parseInt(newVal || 0);
                break;
                
            case 'rf-pos-y':
                this.y = parseInt(newVal || 0);
                break;
                
            case 'rf-width':
                this.width = parseFloat(this.getAttribute('rf-width') || this.width);
                break;
                
            case 'rf-height':
                this.height = parseFloat(this.getAttribute('rf-height') || this.height);
                break;
                
            case 'rf-sizable':
                this.isSizable = (newVal != null && newVal != undefined) ? (newVal==='true') : false;
                break;
                
            case 'rf-draggable':
                this.isDraggable = (newVal != null && newVal != undefined) ? (newVal === 'true') : false;
                break;
        }
    }

    dragStart(evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();

        window.addEventListener('mousemove', this._dragMoveProxy);
        window.addEventListener('mouseup', this._dragStopProxy);
        
        let mousePos = { 
            x: (document.documentElement.scrollLeft + evt.clientX), 
            y: (document.documentElement.scrollTop + evt.clientY) 
        };
        
        this.dragOffset = { 
            x: mousePos.x - this.x, 
            y: mousePos.y - this.y 
        };
        
        this.classList.add('dragging');
        
        this.dispatchEvent(new CustomEvent('dragstart', { bubbles: true, cancelable: false}));
    }

    dragMove(evt) {
        let mousePos = { 
            x: (document.documentElement.scrollLeft + evt.clientX), 
            y: (document.documentElement.scrollTop + evt.clientY) 
        };

        this.x = mousePos.x - this.dragOffset.x;
        this.y = mousePos.y - this.dragOffset.y;
        
        this.dispatchEventAsync(new CustomEvent('dragmove', { bubbles: true, cancelable: false}));
    }

    dragStop(evt) {
        window.removeEventListener('mousemove', this._dragMoveProxy);
        window.removeEventListener('mouseup', this._dragStopProxy);

        this.classList.remove('dragging');
        
        //this.syncDOM();
        
        this.dispatchEvent(new CustomEvent('dragstop', { bubbles: true, cancelable: false}));
    }
    
    sizeStart(evt) {
        evt.stopImmediatePropagation();

        let h = evt.srcElement,
            e = this;
        
        if (!e.isSizable) return;

        document.body.classList.add('sizing');
        document.body.classList.add(h.classList[1]);
        e.classList.add('sizing');
        
        let style = window.getComputedStyle(e);

        e.handle = h;
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
            
        window.addEventListener('mousemove', this._sizeMoveProxy);
        window.addEventListener('mouseup', this._sizeStopProxy);
        
        this.dispatchEvent(new CustomEvent('sizeStart', { bubbles: true, cancelable: false }));
    }
    
    sizeMoveCheckHeight(ci) {
        let expectedY = ci.mouseY;
        let expectedHeight = ci.eBoundingRect.height + (ci.eBoundingRect.top - ci.mouseY);
        
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
    
    sizeMoveCheckWidth(ci) {
        let expectedX = ci.mouseX;
        let expectedWidth = ci.eBoundingRect.width + (ci.eBoundingRect.left - ci.mouseX);
        
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
    
    sizeMoveSnapWidth(ci) {
        let expectedWidth = (ci.mouseX - ci.eBoundingRect.left);

        ci.e.width = expectedWidth;
        ci.e.style.width = expectedWidth + 'px';
    }

    sizeMoveSnapHeight(ci) {
        let expectedHeight = (ci.mouseY - ci.eBoundingRect.top);

        ci.e.height = expectedHeight;
        ci.e.style.height = expectedHeight + 'px';
    }
    
    sizeMove(evt) {
        let h = this.handle;
        let e = this;

        let checkInfo = {
            e: e,
            sizeInfo: e.sizeInfo,
            pBoudingRect: e.parentElement.getBoundingClientRect(),
            eBoundingRect: e.getBoundingClientRect(),
            mouseY: (evt.pageY - document.documentElement.scrollTop),
            mouseX: (evt.pageX - document.documentElement.scrollLeft)
        };

        if (h.classList.contains('n')) {
            this.sizeMoveCheckHeight(checkInfo);
        }
        else if (h.classList.contains('ne')) {
            this.sizeMoveCheckHeight(checkInfo);
            this.sizeMoveSnapWidth(checkInfo);
        }
        else if (h.classList.contains('nw')) {
            this.sizeMoveCheckHeight(checkInfo);
            this.sizeMoveCheckWidth(checkInfo);
        }
        else if (h.classList.contains('s')) {
            this.sizeMoveSnapHeight(checkInfo);
        }
        else if (h.classList.contains('e')) {
            this.sizeMoveSnapWidth(checkInfo);
        }
        else if (h.classList.contains('se')) {
            this.sizeMoveSnapWidth(checkInfo);
            this.sizeMoveSnapHeight(checkInfo);
        }
        else if (h.classList.contains('w')) {
            this.sizeMoveCheckWidth(checkInfo);
        }
        else if (h.classList.contains('sw')) {
            this.sizeMoveCheckWidth(checkInfo);
            this.sizeMoveSnapHeight(checkInfo);
        }
        
        this.dispatchEventAsync(new CustomEvent('sizeMove', { bubbles: true, cancelable: false }));
    }
    
    sizeStop(evt) {
        document.body.classList.remove('sizing');
        document.body.classList.remove(this.handle.classList[1]);
        this.classList.remove('sizing');
        
        this.handle = undefined;
        this.sizeInfo = undefined;       
        
        this.syncDOM();

        window.removeEventListener('mousemove', this._sizeMoveProxy);
        window.removeEventListener('mouseup', this._sizeStopProxy);

        this.dispatchEvent(new CustomEvent('sizeStop', { bubbles: true, cancelable: false }));
    }
    
    directorySizeStart(evt) {
        evt.stopImmediatePropagation();

        let directoryList = this.querySelector('rf-directory-list');
        let shadow = this.createShadowFor(directoryList);
        let handle = shadow.querySelector('.size-handle');
        
        document.body.classList.add('sizing');
        document.body.classList.add(handle.classList[1]);
        
        window.addEventListener('mousemove', this._directorySizeMoveProxy);
        window.addEventListener('mouseup', this._directorySizeStopProxy);
        
        let style = window.getComputedStyle(directoryList);
        directoryList.sizeInfo = {
            x: evt.clientX,
            minWidth: (style.minWidth != 'none') ? parseFloat(style.minWidth) : 0,
            maxWidth: (style.maxWidth != 'none') ? parseFloat(style.maxWidth) : Number.POSITIVE_INFINITY,
            width: parseFloat(style.width),
            height: parseFloat(style.height)
        };
    }
    
    directorySizeMove(evt) {
        let directoryList = this.querySelector('rf-directory-list');
        if(!directoryList.sizeInfo) return;
        
        directoryList.style.width = (evt.clientX - directoryList.sizeInfo.x) + directoryList.sizeInfo.width;
    }
    
    directorySizeStop(evt) {
        let directoryList = this.querySelector('rf-directory-list');
        let shadow = this.createShadowFor(directoryList);
        let handle = shadow.querySelector('.size-handle');
        
        directoryList.sizeInfo = undefined;
        
        document.body.classList.remove('sizing');
        document.body.classList.remove(handle.classList[1]);
        
        window.removeEventListener('mousemove', this._directorySizeMoveProxy);
        window.removeEventListener('mouseup', this._directorySizeStopProxy);
    }
    
    open(options) {
        options = options || {};

        this.classList.add('shown');

        if(options.startPosition && options.startPosition === 'center') {
            this.center();
            
            this.startX = this.x;
            this.startY = this.y;
        }
        
        this.x = this.startX || 0;
        this.y = this.startY || 0;
        
        this.dispatchEvent(new CustomEvent('opened', { bubbles: true, cancelable: false }));
    }
    
    close() {
        this.classList.remove('shown');
        
        // backup the last position of the window
        this.startX = this.x;
        this.startY = this.y;
        
        // then put it offscreen
        let self = this;
        window.setTimeout(function() {
            self.x = -self.width;
            self.y = -self.height;
        }, 1000);
                
        this.dispatchEvent(new CustomEvent('closed', { bubbles: true, cancelable: false }));
    }
    
    center() {
        let wholeSize = {
            width: document.documentElement.offsetWidth,
            height: document.documentElement.offsetHeight
        };
        
        let currentSize = {
            width: this.width,
            height: this.height
        }
        
        this.x = (wholeSize.width - currentSize.width) / 2;
        this.y = (wholeSize.height - currentSize.height) / 4;
    }
    
    directoryClick(evt) {
        if(!evt) return;
        
        let directoryList = this.querySelector('rf-directory-list');
        if(directoryList === null) return;
        
        Array.from(directoryList.querySelectorAll('.directory.selected')).forEach(function(d) {
            d.classList.remove('selected');
        });
        
        let current = evt.srcElement;
        while(current !== null && !current.classList.contains('directory')) current = current.parentElement;
        
        if(current === null) return;
        
        current.classList.add('selected');
        this.syncFileList(current.directoryInfo);
    }
    
    directoryKeyup(evt) {
        if(!evt) return;
        
        if(evt.keyCode === 32 || evt.keyCode === 13) {
            this.directoryClick(evt);
        }    
    }
    
    fileClick(evt) {
        if(!evt) return;
        
        let fileList = this.querySelector('rf-file-list');
        if(fileList === null) return;
        
        if(evt.ctrlKey === false && evt.metaKey === false) {
            Array.from(fileList.querySelectorAll('.file.selected')).forEach(function(f) {
                f.classList.remove('selected');
            });            
        }
        
        let current = evt.srcElement;
        while(current !== null && !current.classList.contains('file')) current = current.parentElement;
        
        current.classList.add('selected');
        
        let defaultButton = this.querySelector('rf-window-statusbar').querySelector('.default');
        if(defaultButton !== null) defaultButton.focus();
    }
    
    fileKeyup(evt) {
        if(!evt) return;
        
        if(evt.keyCode === 32 || evt.keyCode === 13) {
            this.fileClick(evt);
        }    
    }
    
    openButtonClick() {
        this.close();
    }
    
    cancelButtonClick() {
        Array.from(this.querySelectorAll('rf-file-list .file.selected')).forEach(function(f) {
            f.classList.remove('selected');
        });
        
        this.close();
    }
    
    syncDirectoryList(root) {
        if(!root) return;
        
        let directoryList = this.querySelector('rf-directory-list');
        if(directoryList === null) return;
        
        // remove listener(s) from existing directory nodes
        Array.from(directoryList.querySelectorAll('.directory')).forEach(function(d) {
            d.directoryInfo = undefined;
            d.removeEventListener('click', this._directoryClickProxy, false);
            d.removeEventListener('keyup', this._directoryKeyupProxy, false);
        }, this);
        
        // clear and append new content
        directoryList.innerHTML = '<div class="directory selected" tabindex="0"><span>' + root.name + '</span></div><ul></ul>';
        directoryList.firstElementChild.directoryInfo = root;
        
        root.directories.forEach(function(d) {
            d.path = (root.path || '.') + '/'+ d.name;
            
            let directoryElement = document.createElement('li');
            directoryElement.innerHTML = '<div class="directory" tabindex="0"><span>' + d.name + '</span></div>';
            directoryElement.firstElementChild.directoryInfo = d;

            directoryList.lastElementChild.appendChild(directoryElement);
        }, this);
        
        // add listener(s)
        Array.from(directoryList.querySelectorAll('.directory')).forEach(function(d) {
            d.addEventListener('click', this._directoryClickProxy, false);
            d.addEventListener('keyup', this._directoryKeyupProxy, false);
        }, this);
    }
    
    syncFileList(dir) {
        if(!dir) return;
        
        let fileList = this.querySelector('rf-file-list');
        if(fileList === null) return;
        
        // remove listener(s) from existing file nodes
        Array.from(fileList.querySelectorAll('.file')).forEach(function(f) {
            f.fileInfo = undefined;
            f.removeEventListener('click', this._fileClickProxy, false);
            f.removeEventListener('keyup', this._fileKeyupProxy, false);
        }, this);
        
        // clear and append new content
        fileList.innerHTML = '<ul></ul>';

        let allowAll = this.filesystemFilters.indexOf('*') !== -1;
        dir.files.sort(function(f1, f2){ if(f1.name>f2.name) return 1; if(f1.name<f2.name) return -1; return 0;}).forEach(function(f) {
            f.path = (dir.path || '.') + '/'+ f.name;
            
            let fileExt = f.name.indexOf('.') !== -1 ? f.name.split('.')[1] : '';
            if(fileExt.length > 0 && this.filesystemFilters.indexOf(fileExt) === -1 && !allowAll) return;
            
            let fileElement = document.createElement('li');
            fileElement.innerHTML = '<div class="file" tabindex="0"><span>' + f.name + '</span></div>';
            fileElement.firstElementChild.fileInfo = f;
                        
            fileList.lastElementChild.appendChild(fileElement);
        }, this);
        
        // add listener(s)
        Array.from(fileList.querySelectorAll('.file')).forEach(function(f) {
            f.addEventListener('click', this._fileClickProxy, false);
            f.addEventListener('keyup', this._fileKeyupProxy, false);
        }, this);
    }
    
    syncFilesystem () {
        if(!this.filesystemUrl) return;
        
        let self = this;
                
        Ajax.getJSON(this.filesystemUrl).then(function syncSucceeded(jsonObj) {
            self.syncDirectoryList(jsonObj);
            self.syncFileList(jsonObj);
        }, 
        function syncFailed(responseText){});
    }
}

document.registerElement('rf-window', RemoteFinderWindow);