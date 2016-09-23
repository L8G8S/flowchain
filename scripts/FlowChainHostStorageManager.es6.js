'use strict';

class FlowChainHostStorageManager extends FlowChainHostManager {
    get autoSave() {
        return this.options.autoSave;
    }
    
    get loadUrl() {
        return this.options.loadUrl;
    }
    
    get saveUrl() {
        return this.options.saveUrl;
    }
    
    get isDownloadButtonVisible() {
        return this.options.downloadButtonVisible;
    }

    set isDownloadButtonVisible(value) {
        if(this.options.downloadButtonVisible === value) return;

        this.options.downloadButtonVisible = value;
        
        if(this.options.downloadButtonVisible === false) this.hideDownloadButton();
        else this.showDownloadButton();
        
        this.syncDOM();
    }
    
    get isUploadButtonVisible() {
        return this.options.uploadButtonVisible;
    }

    set isUploadButtonVisible(value) {
        if(this.options.uploadButtonVisible === value) return;

        this.options.uploadButtonVisible = value;
        
        if(this.options.uploadButtonVisible === false) this.hideUploadButton();
        else this.showUploadButton();
        
        this.syncDOM();
    }
    
    get isSaveButtonVisible() {
        return this.options.saveButtonVisible;
    }

    set isSaveButtonVisible(value) {
        if(this.options.saveButtonVisible === value) return;

        this.options.saveButtonVisible = value;
        
        if(this.options.saveButtonVisible === false) this.hideSaveButton();
        else this.showSaveButton();
        
        this.syncDOM();
    }
    
    get isLoadButtonVisible() {
        return this.options.loadButtonVisible;
    }

    set isLoadButtonVisible(value) {
        if(this.options.loadButtonVisible === value) return;

        this.options.loadButtonVisible = value;
        
        if(this.options.loadButtonVisible === false) this.hideLoadButton();
        else this.showLoadButton();
        
        this.syncDOM();
    }
    
    constructor(options) {
        super(Object.assign({
            host: null,
            autoSave: false,
            saveUrl: null,
            loadUrl: null,
            downloadButtonVisible: true,
            uploadButtonVisible: true,
            saveButtonVisible: true,
            loadButtonVisible: true
        }, options));

        this._finder = null;  
        this._autoSaveProxy = null;
        this._storePool = new Set();

        this.initializeFromAttributes();
        //this.initializeAutoSaveProxy();
        this.initializeEvents();
        this.initializeDOM();
    }

    initializeFromAttributes() {
        this.attributeChangedCallback('fc-storage-download-visible');
        this.attributeChangedCallback('fc-storage-upload-visible');
        
        this.attributeChangedCallback('fc-storage-auto-save');
        this.attributeChangedCallback('fc-storage-load-url');
        this.attributeChangedCallback('fc-storage-save-url');
    }
        
    /*
    initializeAutoSaveProxy() {
        if(this.autoSave === false || this.saveUrl === null) return;
        
        let self = this;
        
        if(this.saveUrl.indexOf('http') === 0) {
            // HTTP(S)
            //this._autoSaveProxy = new XMLHttpRequest();

            let _autoSavePromise = new Promise(function(resolve, reject) {
                self._autoSaveProxy.onreadystatechange = function () {
                    if (self._autoSaveProxy.readyState === 4) {
                        if (self._autoSaveProxy.status === 200) {
                            console.log('response received : OK')
                            resolve(self._autoSaveProxy.responseText);
                        }
                        else {
                            console.log('response received : error')
                            reject(self._autoSaveProxy.responseText);
                        }
                    }
                };
            });
        }
        else if(this.saveUrl.indexOf('ws') === 0) {
            // Web Socket
            this._autoSaveProxy = new WebSocket(this.saveUrl);
            this._autoSaveProxy.addEventListener('open', function (evt) {
                console.log('onopen');
            });
            this._autoSaveProxy.addEventListener('message', function (evt) {
                console.log('onmessage');
            });
            this._autoSaveProxy.addEventListener('error', function (evt) {
                console.log('onerror');
            });
            this._autoSaveProxy.addEventListener('close', function (evt) {
                console.log('onclose');
            });
        }
    }
    */
    
    initializeEvents() {
        let self = this;
        
        this._hanleSaveClickProxy = function hanleSaveClickProxy () { self.save.apply(self, undefined); };
        this._hanleLoadClickProxy = function hanleLoadClickProxy () { self.load.apply(self, undefined); };
        this._hanleDownloadClickProxy = function hanleDownloadClickProxy () { self.downloadAsJSON.apply(self, [...arguments]); };
        this._hanleUploadClickProxy = function hanleUploadClickProxy () { self.uploadAsJSON.apply(self, [...arguments]); };
        this._handleUploadInputChangedProxy = function handleUploadInputChangedProxy () { self.handleUploadInputChange.apply(self, [...arguments]); };
        this._handlePropertyChangedProxy = function handlePropertyChangedProxy () { self.handlePropertyChanged.apply(self, [...arguments]); };
        this._handleHostScrollResizeProxy = function handleHostScrollResizeProxy () { self.repositionBar.apply(self, [...arguments]); };
        
        this._hanleFinderClosedProxy = function hanleFinderClosedProxy () { self.handleFilePicked.apply(self, [...arguments]); };

        this.options.host.addEventListener('scroll', this._handleHostScrollResizeProxy);
        this.options.host.addEventListener('mousewheel', this._handleHostScrollResizeProxy);
        window.addEventListener('resize', this._handleHostScrollResizeProxy);
    }
    
    initializeDOM() {
         // append the buttons
        let shadow = this.options.host.shadowRoot == null ? this.options.host.createShadowRoot() : this.options.host.shadowRoot;
        let content = shadow.querySelector('content');
        
        if(content === null) {
            content = document.createElement('content');
            content.select = '*';
            
            shadow.appendChild(content);
        }

        if(shadow.querySelector('.storage-bar') === null){
            let bar = document.createElement('div');
            bar.classList.add('storage-bar');
                       
            // JSON upload button
            let upload = document.createElement('div');
            upload.classList.add('storage-button');
            upload.classList.add('upload');
            upload.setAttribute('title', this.options.host.getAttribute('fc-storage-upload-tooltip') || 'Open from disk');
            
            let file = document.createElement('input');
            file.type = 'file';
            file.id = 'files';
            file.name = 'files[]';
            file.accept= '.json';
            upload.appendChild(file);

            bar.appendChild(upload);
            
            // JSON download button
            let download = document.createElement('a');
            download.classList.add('storage-button');
            download.classList.add('download');
            download.setAttribute('title', this.options.host.getAttribute('fc-storage-download-tooltip') || 'Save to disk');
            download.setAttribute('download', (this.options.host.name + '.json'));
            bar.appendChild(download);
            
            // remote download button
            let load = document.createElement('a');
            load.classList.add('storage-button');
            load.classList.add('load');
            load.setAttribute('title', this.options.host.getAttribute('fc-storage-load-tooltip') || 'Open from url');
            if(!this.options.loadButtonVisible) load.style.display = 'none';
            bar.appendChild(load);
            
            this._finder = document.createElement('rf-window');
            document.body.appendChild(this._finder);
            this._finder.setAttribute('rf-title', 'Pick-up a file...');
            this._finder.setAttribute('rf-width', '450');
            this._finder.setAttribute('rf-height', '300');
            this._finder.setAttribute('rf-filesystem-filters', 'json');
            this._finder.setAttribute('rf-filesystem-url', this.loadUrl);
                    
            // remote upload button
            let save = document.createElement('a');
            save.classList.add('storage-button');
            save.classList.add('save');
            save.setAttribute('title', this.options.host.getAttribute('fc-storage-save-tooltip') || 'Save');
            if(!this.options.saveButtonVisible) save.style.display = 'none';
            bar.appendChild(save);
            
            shadow.appendChild(bar);
        }
    }
    
    syncDOM() {
        if(!this.options.host) return;
        
        this.options.host.setAttribute('fc-storage-download-visible', this.isDownloadButtonVisible === true ? 'true' : 'false');
        this.options.host.setAttribute('fc-storage-upload-visible', this.isUploadButtonVisible === true ? 'true' : 'false');
    }
    
    initialize() {
        super.initialize();
        
        let bar = this.options.host.shadowRoot.querySelector('.storage-bar');
        if(bar) {
            let upload = bar.querySelector('.upload');
            upload.addEventListener('click', this._hanleUploadClickProxy);
            upload.firstElementChild.addEventListener('change', this._handleUploadInputChangedProxy, false);
            
            let download = bar.querySelector('.download');
            download.addEventListener('click', this._hanleDownloadClickProxy);
            
            let load = bar.querySelector('.load');
            load.addEventListener('click', this._hanleLoadClickProxy);
            
            let save = bar.querySelector('.save');
            save.addEventListener('click', this._hanleSaveClickProxy);
        }
        
        if(this._finder) {
            this._finder.addEventListener('closed', this._hanleFinderClosedProxy);
        }
     
        window.addEventListener('resize', this._handleHostScrollResizeProxy);
        this.options.host.addEventListener('scroll', this._handleHostScrollResizeProxy);
        this.options.host.addEventListener('mousewheel', this._handleHostScrollResizeProxy);
    }
    
    destroy() {
        super.destroy();

        if(this._finder) {
            this._finder.removeEventListener('closed', this._hanleFinderClosedProxy);
            
            document.body.removeChild(this._finder);
            
            this._finder = null;    
        }
        
        /*
        if(this._autoSaveProxy && this._autoSaveProxy.close) {
            this._autoSaveProxy.onopen = null;
            this._autoSaveProxy.onmessage = null;
            this._autoSaveProxy.close();
            this._autoSaveProxy.onerror = null;
            this._autoSaveProxy.onclose = null;
        }
        this._autoSaveProxy = null;
        */
        
        let bar = this.options.host.shadowRoot.querySelector('.storage-bar');
        if(bar) {
            let upload = bar.querySelector('.upload');
            upload.removeEventListener('click', this._hanleUploadClickProxy);
            upload.firstElementChild.removeEventListener('change', this._handleUploadInputChangedProxy, false);
            
            let download = bar.querySelector('.download');
            download.removeEventListener('click', this._hanleDownloadClickProxy);
            
            let load = bar.querySelector('.load');
            load.removeEventListener('click', this._hanleLoadClickProxy);
            
            let save = bar.querySelector('.save');
            save.removeEventListener('click', this._hanleSaveClickProxy);
        }
     
        window.removeEventListener('resize', this._handleHostScrollResizeProxy);
        this.options.host.removeEventListener('scroll', this._handleHostScrollResizeProxy);
        this.options.host.removeEventListener('mousewheel', this._handleHostScrollResizeProxy);
    }
    
    attributeChangedCallback(attrName) {
        super.attributeChangedCallback(attrName);
        
        let attributeValue = this.options.host.getAttribute(attrName);
        
        switch(attrName) {
            case 'fc-storage-download-visible':
                this.isDownloadButtonVisible = (attributeValue === null || attributeValue === 'true');
                break;
                
            case 'fc-storage-upload-visible':
                this.options.isUploadButtonVisible = (attributeValue === null || attributeValue === 'true');
                break;
                
            case 'fc-storage-auto-save':
                this.options.autoSave = (attributeValue === null || attributeValue === 'true');
                break;
                
            case 'fc-storage-load-url':
                this.options.loadUrl = attributeValue;
                this.options.loadButtonVisible = (this.options.loadUrl || '').length > 0;
                break;
                
            case 'fc-storage-save-url':
                this.options.saveUrl = attributeValue;
                this.options.saveButtonVisible = (this.options.saveUrl || '').length > 0;
                break;
        }
    }
    
    register(element) {
        if (this._storePool.has(element)) return;

        element.addEventListener('property', this._handlePropertyChangedProxy);

        this._storePool.add(element);
    }

    unregister(element) {
        if (!this._storePool.has(element)) return;

        element.removeEventListener('property', this._handlePropertyChangedProxy);

        this._storePool.delete(element);
    }
    
    repositionBar() {
        let bar = this.options.host.shadowRoot.querySelector('.storage-bar');
        if(bar) {
            if(!bar.originalTop && !bar.originalBottom) {
                let bstyle = getComputedStyle(bar);
                
                if(bstyle.right !== 'auto') {
                    bar.originalRight = parseInt(bstyle.right);
                }
                else {
                    bar.originalLeft = parseInt(bstyle.left);
                }
                
                if(bstyle.bottom !== 'auto') {
                    bar.originalBottom = parseInt(bstyle.bottom);
                }
                else {
                    bar.originalTop = parseInt(bstyle.top);
                }
            }
            
            if(bar.originalTop) {
                bar.style.top = (bar.originalTop + this.options.host.scrollTop) + 'px';                
            }
            else {
                bar.style.bottom = (bar.originalBottom - this.options.host.scrollTop) + 'px';                
            }
            
            if(bar.originalLeft) {
                bar.style.left = (bar.originalLeft + this.options.host.scrollLeft) + 'px';                
            }
            else {
                bar.style.right = (bar.originalRight - this.options.host.scrollLeft) + 'px';                
            }
        }
    }
        
    handlePropertyChanged(evt) {
        if(!evt.srcElement.isAttached 
        || evt.detail.name === 'attached' 
        || evt.detail.name === 'detached') {
            return;    
        } 

        if(this.options.autoSave === true) {
            this.save(evt.srcElement);
        }
    }

    showStorageButton(selector, useVisibility) {
        let button = this.options.host.shadowRoot.querySelector(selector);
        if(button === null) return;

        if(useVisibility === true) button.style.visibility = 'visible';
        else button.style.display = 'inline-block';
    }
    
    hideStorageButton(selector, useVisibility) {
        let button = this.options.host.shadowRoot.querySelector(selector);
        if(button === null) return;

        if(useVisibility === true) button.style.visibility = 'hidden';
        else button.style.display = 'none';
    }

    showLoadButton() {
        this.showStorageButton('.storage-button.load', false);
    }

    hideLoadButton() {
        this.hideStorageButton('.storage-button.load', false);
    }
    
    handleFilePicked(evt) {
        if(!this._finder || this._finder.selectedFiles.length === 0) return;
                
        let self = this;
        let selectedFile = this._finder.selectedFiles[0];
        Ajax.getJSON(selectedFile).then(function handleFilePickedSucceeded(jsonObj) {
            self.clearHostContent();
            self.updateHostProperties(jsonObj);
            self.updateHostContent(jsonObj.elements);
        }, 
        function handleFilePickedFailed(responseText){});
    }
    
    load() {
        if(!this.loadUrl || !this._finder) return;
        
        this._finder.open({startPosition : 'center'});
    }
    
    showSaveButton() {
        this.showStorageButton('.storage-button.save', false);
    }

    hideSaveButton() {
        this.hideStorageButton('.storage-button.save', false);
    }
    
    save(element) {
        if(!this.saveUrl) return;

        // NOTE : we need something to identify the project on which we are working (like a GUID) => sent in the query
        let xhrContent = JSON.stringify({
            uid: this.options.host.uid, 
            data: (element || this.options.host)
        });

        let xhr = new XMLHttpRequest();
        xhr.open('POST', this.saveUrl, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.send(xhrContent);
    }

    setDownloadFileName(value) {
        let button = this.options.host.shadowRoot.querySelector('.storage-button.download');
        if(button === null) return;
        
        button.setAttribute('download', (value + '.json'));
    }
    
    showDownloadButton() {
        this.showStorageButton('.storage-button.download', false);
    }

    hideDownloadButton() {
        this.hideStorageButton('.storage-button.download', false);
    }

    downloadAsJSON(evt){
        var uri = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.options.host));
        this.options.host.shadowRoot.querySelector('.storage-button.download').href = uri;
    }
    
    showUploadButton() {
        this.showStorageButton('.storage-button.upload', false);
    }

    hideUploadButton() {
        this.hideStorageButton('.storage-button.upload', false);
    }
    
    uploadAsJSON() {
       let button = this.options.host.shadowRoot.querySelector('.storage-button.upload');
       if(button === null) return;
       
       button.firstElementChild.value = null;
       button.firstElementChild.click();
    }

    clearHostContent() {
        this.options.host.clear();
    }
    
    updateHostProperties(properties) {
        if(!properties) return;
        
        if(properties.name) {
            this.options.host.setAttribute('fc-name', properties.name);
        }
        
        if(properties.uid) {
            this.options.host.setAttribute('fc-unique-identifier', properties.uid);
        }
    }
    
    updateHostContent(elements) {
        if(!elements) return;
        
        let host = this.options.host;
         
        host.beginInitialize();

        let offlineBuffer = document.createDocumentFragment();
        
        // NOTE: all this computation could be done in  web worker
        let element = null;
        while((element = elements.shift())) {
            let elementType = element.type || 'fc-element';
            let elementPropertyNames = Object.getOwnPropertyNames(element);
            let newNode = offlineBuffer.querySelector('#' + element.id) || document.createElement(elementType);

            elementPropertyNames.forEach(function(p) {
                if(newNode[p] === undefined) {
                    switch(p) {
                        case 'linkable':
                            newNode.isLinkable = element.linkable;
                            break;
                        case 'sizable':
                            newNode.isSizable = element.sizable;
                            break;
                        case 'sizable':
                            newNode.isDraggable = element.draggable;
                            break;
                    }
                    
                    return;   
                }
                
                if(p === 'links') {
                    newNode.setAttribute('fc-links', (element.links || []).join(','));
                    return;      
                }
                
                newNode[p] = element[p];
            });

            if(newNode.parentNode === null) {
                offlineBuffer.appendChild(newNode);
            }

            if(element.links != null && newNode.addLink) {
                for(let li=0; li < element.links.length ;li++) {
                    let target = offlineBuffer.querySelector('#' + element.links[li]);
                    if(target !== null) {
                        newNode.addLink(target);
                        
                        element.links.splice(li, 1);
                        li--;
                    }
                }

                if(element.links.length > 0) {
                    elements.push(element);
                }
            }
        }
        
        host.querySelector('.root').appendChild(offlineBuffer);
       
        host.endInitialize();                    
    }
    
    handleUploadInputChange(evt) {
        if(evt.target.files === null || evt.target.files.length === 0) return;

        let self = this;
        let reader = new FileReader();
        
        reader.onload = function(readEvt) {
            let graph = JSON.parse(readEvt.target.result);
            
            self.clearHostContent();
            self.updateHostProperties(graph);
            self.updateHostContent(graph.elements);
        };
        
        // launch file content reading 
        Array.from(evt.target.files).forEach(function (file) {
            if(file.name.indexOf('json') === -1) return;
            
            reader.readAsText(file);
        });
    }

    *[Symbol.iterator]() {
        yield *this._storePool;
    }
}