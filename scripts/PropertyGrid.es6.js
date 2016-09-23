'use strict';

class PropertyGrid extends HTMLDivElement {

    static get NativeValueTypes() {
        return ['String', 'Number', 'DateTime', 'Boolean'];
    }
    
    static get NativeStringRelatedTypes() {
        return ['CSSStyleDeclaration'];
    }
    
    static get NativeCollectionTypes() {
        return ['Array', 'Set', 'DOMStringMap', 'NamedNodeMap', 'DOMTokenList', 'HTMLCollection'];
    }

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
    
    get groupProperties() {
        return this._groupProperties;
    }
    
    set groupProperties(value) {
        if (this._groupProperties === value) return;

        this.stopPropertyInspection();

        this._groupProperties = value;
        
        this.refreshPropertyList();
        this.startPropertyInspection();
        
        this.raisePropertyChange('groupProperties', value);
    }
    
    /**
     * Gets the object currently inspected in the grid.
     * @return {String} An object.
     */
    get source() {
        return this._source;
    }
    
    set source(value) {
        if (this._source === value) return;

        this.stopPropertyInspection();
        
        this._source = value;
        
        this.refreshPropertyList();
        this.startPropertyInspection();
        
        this.raisePropertyChange('source', value);
    }

    get groupExcludeList() {
        return this._groupExcludeList || (this._groupExcludeList = []);
    }
    
    set groupExcludeList(value) {
        if (this._groupExcludeList === value) return;

        this._groupExcludeList = value;
        
        this.refreshPropertyList();
        
        this.raisePropertyChange('groupExcludeList', value);
    }
    
    initializeFromAttributes() {
        this.groupProperties = (this.getAttribute('pg-group-properties') || 'true') === 'true';
        this.source = document.querySelector(this.getAttribute('pg-source') || '');
        this.groupExcludeList = (this.getAttribute('pg-group-exclude') || '').split(',');
    }
    
    initializeDOM() {
        let shadow = this.shadowRoot == null ? this.createShadowRoot() : this.shadowRoot;
        let shadowContent = shadow.querySelector('content');
        if(shadowContent === null) {
            shadowContent = document.createElement('content');
            shadowContent.select = '*';
            
            shadow.appendChild(shadowContent);
        }
        
        let handle = document.createElement('div');
        handle.classList.add('size-handle');
        shadow.appendChild(handle);
        
        let header = this.querySelector('pg-grid-header');
        if(header === null) {
            header = document.createElement('pg-grid-header');
            this.appendChild(header);
            
            let row = document.createElement('pg-grid-row');
            
            let toggle = document.createElement('pg-grid-cell');
            toggle.classList.add('offset');
            row.appendChild(toggle);
                
            let cellName = document.createElement('pg-grid-cell');
            cellName.classList.add('name');
            cellName.innerHTML = 'Name';
            row.appendChild(cellName);
            
            let cellValue = document.createElement('pg-grid-cell');
            cellValue.classList.add('value');
            cellValue.innerHTML = 'Value';
            row.appendChild(cellValue);
            
            header.appendChild(row);

            // reposition the size handle            
            this.repositionSizeHandle(); 
        }
        
        let gridContent = this.querySelector('pg-grid-content');
        if(gridContent === null) {
            gridContent = document.createElement('pg-grid-content');
            this.appendChild(gridContent);
        }
    }
    
    syncDOM() {
        this._updatingDOM = true;
        
        this.setAttribute('pg-group-properties', this.groupProperties.toString());
        this.setAttribute('pg-source', this.source && this.source.getAttribute ? '#' + this.source.getAttribute('id') : null);
        this.setAttribute('pg-group-exclude', this.groupExcludeList.join(','));
        
        this._updatingDOM = false;
    }
    
    initializeEvents() {
        let self = this;

        this._toggleGroupProxy = function toggleGroupProxy () { self.toggleGroup.apply(self, [...arguments]); };
        this._editorValueChangedProxy = function editorValueChangedProxy () { self.editorValueChanged.apply(self, [...arguments]); };
        this._editorFocusinProxy = function editorFocusinProxy (evt) {  self.editorFocusIn.apply(self, [...arguments]); };
        this._editorFocusoutProxy = function editorFocusoutProxy (evt) { self.editorFocusOut.apply(self, [...arguments]); };
        this._selectionTrackingProxy = function selectionTrackingProxy (evt) { self.source = evt.srcElement; };
        
        this._handleSizeColumnStartProxy = function handleSizeColumnStartProxy () { self.handleSizeColumnStart.apply(self, [...arguments]); };
        this._handleSizeColumnMoveProxy = function handleSizeColumnMoveProxy () { self.handleSizeColumnMove.apply(self, [...arguments]); };
        this._handleSizeColumnStopProxy = function handleSizeColumnStopProxy () { self.handleSizeColumnStop.apply(self, [...arguments]); };
        
        this._handleWindowResizeProxy = function handleWindowResizeProxy() { self.repositionSizeHandle(); };
    }

    createdCallback() {
        this._updatingDOM = false;
        
        this._source = null;
        this._watch = null;
        
        let self = this;
        this._nodeInspector = new MutationObserver(function() { self.nodeInspectorValueChanged.apply(self, [...arguments]); });
        
        this.initializeFromAttributes();
        this.initializeDOM();
        this.initializeEvents();

        this.dispatchEvent(new CustomEvent('created', { bubbles: true, cancelable: false}));
    }

    attachedCallback() {
        this._isAttached = true;
        this.raisePropertyChange('attached', true, true);

        let handle = this.shadowRoot.querySelector('.size-handle');
        if(handle !== null) {
            handle.addEventListener('mousedown', this._handleSizeColumnStartProxy, true);   
        }
        
        window.addEventListener('resize', this._handleWindowResizeProxy);
        
        this.refreshPropertyList();
        this.startPropertyInspection();
        
        this.syncDOM();
    }

    detachedCallback() {
        this._isAttached = false;
        this.raisePropertyChange('detached', false, true);
        
        this.sizeInfo = undefined;
        
        window.removeEventListener('resize', this._handleWindowResizeProxy);
        
        let handle = this.shadowRoot.querySelector('.size-handle');
        if(handle !== null) {
            handle.removeEventListener('mousedown', this._handleSizeColumnStartProxy, true);   
        }
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        if(this._updatingDOM === true) return;
                
        switch(attrName) {
            case 'pg-group-properties':
                this.groupProperties = (this.getAttribute('pg-group-properties') || 'true') === 'true';
                break;
                
            case 'pg-source':
                this.source = document.querySelector(this.getAttribute('pg-source') || '');
                break;
            
            case 'pg-watch':
                this.watch = document.querySelector(this.getAttribute('pg-watch') || '');
                break;

            case 'pg-group-exclude':
                this.groupExcludeList = (this.getAttribute('pg-group-exclude') || '').split(',');
                break;
        }
    }

    buildGroup(descriptor) {
        if(!descriptor) return null;
        
        let level = descriptor.level;
        if(level === 0) level = 1;
        
        let group = document.createElement('pg-grid-group');
        group.setAttribute('level', descriptor.level);
                
        let header = document.createElement('pg-grid-group-header');
        group.appendChild(header);
        
        while(level > 0) {
            let toggle = document.createElement('pg-grid-cell');
            toggle.classList.add('offset');
            header.appendChild(toggle);
            
            level--;
            
            if(level === 0) {
                toggle.classList.add('toggle');
                toggle.addEventListener('click', this._toggleGroupProxy, false);                
            }
        }

        let groupName = document.createElement('pg-grid-cell');
        groupName.innerHTML = '<span>' + descriptor.name + '</span>';
        groupName.setAttribute('title', descriptor.name);
        header.appendChild(groupName);
        
        if(descriptor.level > 0) {
            let value = (descriptor.source[descriptor.name] || '').toString();
            
            let groupValue = document.createElement('pg-grid-cell');
            groupValue.innerHTML = '<span>' + value + '</span>';
            groupValue.setAttribute('title', value);
            header.appendChild(groupValue);
            
            if(this.sizeInfo) {
                groupValue.style.minWidth = this.sizeInfo.currentWidth + 'px';
                groupValue.style.width = this.sizeInfo.currentWidth + 'px';
            }
        }
        
        return group;
    }
    
    buildRow(source, descriptor, typeName, groupLevel) {
        if(!descriptor) return null;
         
        let row = document.createElement('pg-grid-row');
        row.setAttribute('id', descriptor.propertyName);
        row.propertyDescriptor = descriptor;
        row.source = source;
        
        while(groupLevel > 0) {
            let toggle = document.createElement('pg-grid-cell');
            toggle.classList.add('offset');
            row.appendChild(toggle);
            
            groupLevel--;
        }        
        
        let cellName = document.createElement('pg-grid-cell');
        cellName.innerHTML = '<span>' + descriptor.propertyName + '</span>';
        cellName.classList.add('name');
        cellName.setAttribute('title', descriptor.propertyName);
        row.appendChild(cellName);
       
        if(descriptor.typeName !== typeName) {
            let inheritElement = document.createElement('div');
            inheritElement.classList.add('inherit');
            inheritElement.setAttribute('title', 'inherited from "' + descriptor.typeName + '"');
            
            cellName.appendChild(inheritElement);
        }
        
        let cellValue = document.createElement('pg-grid-cell');
        cellValue.classList.add('value');
        row.appendChild(cellValue);
        
        if(descriptor.isReadonly === true){
            cellValue.classList.add('readonly');
        }
        
        if(this.sizeInfo) {
            cellValue.style.minWidth = this.sizeInfo.currentWidth + 'px';
            cellValue.style.width = this.sizeInfo.currentWidth + 'px';
        }
        
        this.buildEditor(source, descriptor, cellValue);
       
        return row;
    }
    
    buildEditor(source, descriptor, cell) {
        if(cell.firstElementChild !== null) return;
        
        let value = source[descriptor.propertyName];
        let propertyTypeName = descriptor.propertyTypeName; 
        
        if((PropertyGrid.NativeValueTypes.indexOf(propertyTypeName) !== -1 || PropertyGrid.NativeStringRelatedTypes.indexOf(propertyTypeName) !== -1) && descriptor.isReadonly === false) {
            if(propertyTypeName === 'Boolean') {
                cell.innerHTML = '<select><option value="true" '+(value === true ? 'selected' : '')+'>true</option><option value="false" '+(value === false ? 'selected' : '')+'>false</option></select>';
            }
            else if(propertyTypeName === 'CSSStyleDeclaration') {
                cell.innerHTML = '<textarea rows="2"></textarea>';
                cell.firstElementChild.value = value.cssText;
            }
            else if(descriptor.propertyName.indexOf('HTML') !== -1) {
                cell.innerHTML = '<textarea rows="4"></textarea>';
                cell.firstElementChild.value = value.trim();
            }   
            else {
                cell.innerHTML = '<input type="' + (propertyTypeName === 'Number' ? 'number' : 'text') + '" />';
                cell.firstElementChild.value = value;
            }         
        }
        else if(PropertyGrid.NativeCollectionTypes.indexOf(propertyTypeName) !== -1) {
            let items = Array.from(value);
            
            cell.innerHTML = '<input type="text" readonly="readonly" /><textarea rows="' + (items.length + 1) + '"></textarea>';
            cell.setAttribute('title', value);
            cell.firstElementChild.value = value;
                        
            if(descriptor.isReadonly === true) {
                cell.lastElementChild.setAttribute('readonly', 'readonly');
            }
            
            items.forEach(function(item) {
                cell.lastElementChild.value += item.toString() + '\n';
            });
        }
        else {
            cell.innerHTML = '<span>' + value + '</span>';
            cell.setAttribute('title', value);
        }
        
        let editor = cell.querySelector('input,select,textarea');
        if(editor !== null) {
            editor.addEventListener('focusin', this._editorFocusinProxy, false);
            editor.addEventListener('focusout', this._editorFocusoutProxy, false);   
        }
    }
    
    appendRow(source, descriptor, group) {
        let groupLevel = parseInt(group.getAttribute('level') || '0') + 1;
        
        if(PropertyGrid.NativeValueTypes.indexOf(descriptor.propertyTypeName) === -1 
            && PropertyGrid.NativeStringRelatedTypes.indexOf(descriptor.propertyTypeName) === -1 
            && PropertyGrid.NativeCollectionTypes.indexOf(descriptor.propertyTypeName) === -1) {

            let expandableRow = this.buildGroup({ name: descriptor.propertyName, source:source, level:groupLevel });
            
            expandableRow.source = source[descriptor.propertyName];
            expandableRow.propertyDescriptor = descriptor;
            expandableRow.classList.add('collapsed');
            
            group.appendChild(expandableRow);
        }
        else {
            group.appendChild(this.buildRow(source, descriptor, undefined, groupLevel));     
        }
    }
    
    repositionSizeHandle() {
        let handle = this.shadowRoot.querySelector('.size-handle');;
        if(handle !== null) {
            let lastColumn = this.querySelector('pg-grid-header pg-grid-cell:last-child');
            handle.style.left = (lastColumn.offsetLeft - handle.offsetWidth / 2) + 'px';   
        }
    }
        
    handleSizeColumnStart(evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();

        this.sizeInfo = {
            mouseX: evt.pageX,
            initialX: evt.srcElement.offsetLeft,
            initialWidth: this.querySelector('pg-grid-header pg-grid-cell:last-child').offsetWidth
        };
        
        window.addEventListener('mousemove', this._handleSizeColumnMoveProxy);
        window.addEventListener('mouseup', this._handleSizeColumnStopProxy);
        
        this.classList.add('sizing');
        this.dispatchEvent(new CustomEvent('sizeColumnStart', { bubbles: true, cancelable: false}));
    }
    
    handleSizeColumnMove(evt) {
        let currentX = this.sizeInfo.initialX + (evt.pageX - this.sizeInfo.mouseX);
        let currentWidth = this.sizeInfo.initialWidth - (evt.pageX - this.sizeInfo.mouseX);

        let handle = this.shadowRoot.querySelector('.size-handle');
        handle.style.left = currentX + 'px';
                
        let lastColumn = this.querySelector('pg-grid-header pg-grid-cell:last-child');
               
        lastColumn.style.minWidth = currentWidth + 'px';
        lastColumn.style.width = currentWidth + 'px';
        
        let lastColumns = Array.from(this.querySelectorAll('pg-grid-content pg-grid-group pg-grid-group-header pg-grid-cell:last-child, pg-grid-content pg-grid-row pg-grid-cell:last-child'));
        lastColumns.forEach(function(c) {
            c.style.minWidth = currentWidth + 'px';
            c.style.width = currentWidth + 'px';
        });
        
        this.sizeInfo.currentWidth = currentWidth;
    }

    handleSizeColumnStop(evt) {
        //this.sizeInfo = undefined;
        
        window.removeEventListener('mousemove', this._handleSizeColumnMoveProxy);
        window.removeEventListener('mouseup', this._handleSizeColumnStopProxy);

        this.classList.remove('sizing');
        this.dispatchEvent(new CustomEvent('sizeColumnStop', { bubbles: true, cancelable: false}));
    }
    
    toggleGroup(evt) {
        let group = evt.srcElement;
        while(group !== null && group.tagName.toLowerCase() !== 'pg-grid-group') group = group.parentElement;
        
        if(group === null) return;
        group.classList.toggle('collapsed');
       
        if(group.propertyDescriptor && group.querySelector('pg-grid-row') === null) {
            if(!Reflection.isRawObject(group.source)) {
                let properties = Reflection.getPropertyDescriptors(group.source, Object);

                properties.forEach(function(descriptor) {
                    this.appendRow(group.source, descriptor, group);
                }, this);   
            }
            else {
                let fields = Reflection.getFieldDescriptors(group.source, Object);
                
                fields.forEach(function(descriptor) {
                    this.appendRow(group.source, descriptor, group);
                }, this);   
            }
        }
    }
    
    /**
     * Update the displayed value for the specified property descriptor.
     * @param {Object} descriptor The property descriptor.
     * @param {HTMLElement} content [optional] The HTMLElement corresponding to where all properties are displayed.
     */
    refreshPropertyValue(row, content) {
        if(row === null || !row.propertyDescriptor) return;
        
        content = content || this.querySelector('pg-grid-content');
        
        let descriptor = row.propertyDescriptor;
        let propertyTypeName = descriptor.propertyTypeName;
                
        let cellValue = row.querySelector('.value');
        let value = row.source[descriptor.propertyName];
                
        if(PropertyGrid.NativeValueTypes.indexOf(propertyTypeName) !== -1 || PropertyGrid.NativeStringRelatedTypes.indexOf(propertyTypeName) !== -1) {
            if(cellValue.firstElementChild !== null) {
                if(propertyTypeName === 'Boolean') {
                    let boolValue = row.source[descriptor.propertyName].toString();
                    
                    Array.from(cellValue.querySelectorAll('option')).forEach(function(o) {
                        o.removeAttribute('selected');                        
                        if(o.value === boolValue) o.setAttribute('selected', 'selected');
                    });
                }
                else if(propertyTypeName === 'CSSStyleDeclaration') {
                    cellValue.firstElementChild.value = value ? value.cssText : '';
                }
                else {
                    value = (value || '').toString();
                    
                    if(descriptor.isReadonly === true) {
                        cellValue.innerHTML = '<span>' + value + '</span>';
                        cellValue.setAttribute('title', value);
                    }
                    else {
                        cellValue.firstElementChild.value = value;   
                    }
                }
            }
        }
        else if(PropertyGrid.NativeCollectionTypes.indexOf(propertyTypeName) !== -1) {
            if(cellValue.firstElementChild !== null) {
                let refValue = row.source[descriptor.propertyName];
                let items = Array.from(refValue);
                
                cellValue.firstElementChild.value = refValue;
                cellValue.lastElementChild.value = '';
                
                cellValue.lastElementChild.setAttribute('rows', (items.length + 1));
                
                items.forEach(function(item) {
                    cellValue.lastElementChild.value += item.toString() + '\n';
                });
            }
        }
        else {
            cellValue.innerHTML = '<span>' + value + '</span>';
            cellValue.setAttribute('title', value);
        }
    }
    
    clearPropertyList() {
        if(!this.isAttached) return;
        
        let content = this.querySelector('pg-grid-content');
       
        // clear content
        Array.from(content.querySelectorAll('pg-grid-row,pg-grid-group')).forEach(function(r) {
            r.source = undefined;
            r.propertyDescriptor = undefined;
            
            let toggle = r.querySelector('pg-grid-group-indicator');
            if(toggle !== null) {
                toggle.removeEventListener('click', this._toggleGroupProxy, false);                
            }

            let editor = r.querySelector('input,select');
            if(editor !== null) {
                editor.removeEventListener('focusin', this._editorFocusinProxy, false);
                editor.removeEventListener('focusout', this._editorFocusoutProxy, false);   
            }
        }, this);
        
        Array.from(content.querySelectorAll('.toggler')).forEach(function(t) {
            t.removeEventListener('click', this._toggleGroupProxy, false);
        }, this);
        
        content.innerHTML = '';
    }
    
    /**
     * List all the properties of the current source object, and update the UI.
     */
    refreshPropertyList() {
        this.clearPropertyList();
        
        if(!this.isAttached || !this._source) return;
        
        let typeName = Reflection.getTypeName(this._source);
        let properties = Reflection.getPropertyDescriptors(this._source);
        if(this.groupExcludeList.length > 0) {
            let exclusionList = this.groupExcludeList;
            properties = properties.filter(function(d) { return exclusionList.indexOf(d.typeName) === -1; });
        }
        
        // append properties
        let grouping = this.groupProperties;
        let groupName = typeName;
        let group = null;
        
        // sort properties according to this.groupProperties
        properties.sort(function(d1, d2) {
            if(grouping) {
                if(d1.typeName > d2.typeName) return 1;
                if(d1.typeName < d2.typeName) return -1;
            }
            
            if(d1.propertyName > d2.propertyName) return 1;
            if(d1.propertyName < d2.propertyName) return -1;
            return 0;
        });
        
        // then enumerate descriptors
        let content = this.querySelector('pg-grid-content');
        
        properties.forEach(function refreshPropertyListForEach (descriptor) {
            if(this.groupProperties) {
                if(group === null || descriptor.typeName !== groupName) {
                    
                    groupName = descriptor.typeName;
                    group = this.buildGroup({ name: groupName, source:this._source, level:0 });
                    
                    if(groupName !== typeName) {
                        group.classList.add('collapsed');
                    }
                    
                    content.appendChild(group);
                }
            }
            else if(group === null) {
                group = content;
            }

            this.appendRow(this._source, descriptor, group);
        }, this);
    }
    
    editorFocusIn(evt) {
        let editor = evt.srcElement;
        if(editor.getAttribute('readonly') !== null) {
            editor.classList.add('focused');
            editor.removeEventListener('focusout', this._editorFocusoutProxy, false); 
            
            let textarea = editor.nextSibling;
            
            if(textarea.style.width === '') {
                textarea.style.width = editor.offsetWidth + 'px';
            }
            
            textarea.focus();
            textarea.addEventListener('focusout', this._editorFocusoutProxy, false);
            if(textarea.getAttribute('readonly') === null) {
                textarea.addEventListener('change', this._editorValueChangedProxy, false);   
            } 
        }
        
        editor.addEventListener('change', this._editorValueChangedProxy, false);
    }
    
    editorFocusOut(evt) {
        let editor = evt.srcElement;
        if(editor.tagName.toLowerCase() === 'textarea') {
            editor.previousSibling.classList.remove('focused');
        }
        
        editor.removeEventListener('change', this._editorValueChangedProxy, false);
    }
    
    editorValueChanged(evt) {
        if(!this._source) return;
        
        let input = evt.srcElement;
        let row = input.parentElement;
        while(row !== null && row.tagName.toLowerCase() !== 'pg-grid-row') row = row.parentElement;
        if(row === null) return;
        
        let descriptor = row.propertyDescriptor;
        if(descriptor === null || descriptor === undefined || descriptor.isReadonly === true) return;
                
        let source = row.source;
        if(source === null || source === undefined) return;
        
        if(descriptor.propertyTypeName === 'Boolean') {
            source[descriptor.propertyName] = (input.value === 'true');
        } 
        else if(descriptor.propertyTypeName === 'Number') {
            source[descriptor.propertyName] = Number(input.value);
        }
        else if(descriptor.propertyTypeName === 'Array') {
            let value = input.value.trim().split('\n');
            let type = Reflection.getTypeName(source[descriptor.propertyName][0]);
            
            if(type === 'Number') {
                source[descriptor.propertyName] = value.map(function(v){ return Number(v); });
            }
            else {
                source[descriptor.propertyName] = value;
            }
            
            this.refreshPropertyValue(row);
        }
        else {
            source[descriptor.propertyName] = input.value;   
        }       
    }
    
    nodeInspectorValueChanged(mutations) {
        let content = this.querySelector('pg-grid-content');
        Array.from(content.querySelectorAll('pg-grid-row')).forEach(function(row) {
            this.refreshPropertyValue(row, content);
        }, this);
    }
    
    /**
     * Starts inspection of property changes on the source object.
     */
    startPropertyInspection() {
        if(!this._source || !this.isAttached) return;
        
        if(this._source instanceof Node) {
            this._nodeInspector.observe(this._source, {
                childList : true,	
                attributes: true,	
                characterData: true
            });   
        }
    }
    
    /**
     * Stops inspection of property changes on the source object.
     */
    stopPropertyInspection() {
        if(this._nodeInspector !== null) {
            this._nodeInspector.disconnect();
        }
    }
}

document.registerElement('pg-grid', PropertyGrid);