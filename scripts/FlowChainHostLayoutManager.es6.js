'use strict';

class FlowChainHostLayoutManager extends FlowChainHostManager {

    constructor(options){
        super(Object.assign({
            host: null,
            gridSize : [10, 10],
            snapToGrid: true
        }, options));
        
        this.initializeFromAttributes();
        this.initializeEvents();
    }
    
    initializeFromAttributes() {
        let host = this.options.host;
        
        this._visibleBounds = { width: host.offsetWidth - 2, height: host.offsetHeight - 2 };
        this._overallBounds = { width: host.offsetWidth - 2, height: host.offsetHeight - 2 };
        this._edgeElementX = null;
        this._edgeElementY = null;

        // get user-defined values
        this.attributeChangedCallback('fc-grid-snap');
        this.attributeChangedCallback('fc-grid-size');
    }
    
    initializeEvents() {
        // define handlers
        let self = this;

        this._handleXChangedProxy = function handleXChangedProxy() { self.handleXChanged.apply(self, [...arguments]); };
        this._handleYChangedProxy = function handleYChangedProxy() { self.handleYChanged.apply(self, [...arguments]); };
        this._handleWidthChangedProxy = function handleWidthChangedProxy() { self.handleWidthChanged.apply(self, [...arguments]); };
        this._handleHeightChangedProxy = function handleHeightChangedProxy() { self.handleHeightChanged.apply(self, [...arguments]); };

        this._handleWindowResizeProxy = function handleWindowResizeProxy() {
            self._visibleBounds = { width: self.options.host.offsetWidth - 2, height: self.options.host.offsetHeight - 2 };
            self.resizeToFit(); 
        };
        
        window.addEventListener('resize', this._handleWindowResizeProxy);
    }
    
    get visibleBounds () {
        return this._visibleBounds;    
    }
    
    get overallBounds () {
        return this._overallBounds;    
    }
    
    get root() {
        return (this._root = (this._root || this.options.host.querySelector('.root')));
    }
    
    attributeChangedCallback(attrName) {
        super.attributeChangedCallback(attrName);
        
        let attributeValue = this.options.host.getAttribute(attrName);
        
        switch(attrName) {
            case 'fc-grid-snap':
                this.options.snapToGrid = (attributeValue === null || attributeValue === 'true');
                break;
            case 'fc-grid-size':
                this.options.gridSize = !attributeValue ? [10,10] : attributeValue.split(',').map(function(item) { return parseInt(item, 10); });
                break;
        }
    }

    handleXChanged(evt) {
        let element = evt.srcElement;
        this.updatePosition(element);
    }
    
    handleYChanged(evt) {
        let element = evt.srcElement;
       
        this.updatePosition(element);
    }
    
    handleWidthChanged(evt) {
        let element = evt.srcElement;
        if(element !== null) element.style.width = element.width + 'px';
    }
    
    handleHeightChanged(evt) {
        let element = evt.srcElement;
        if(element !== null) element.style.height = element.height + 'px';
    }
    
    // TODO: to be optimized (call stack)
    guessEdgeElements() {
        let elements = Array.from(this.options.host.elements);
        
        let xValues = elements.map(function largestElementX(o) { return o.classList.contains('root') ? 0 : (o.x + o.width) + 20; });
        let yValues = elements.map(function largestElementY(o) { return o.classList.contains('root') ? 0 : (o.y + o.height) + 20; });
        
        let largestX = Math.max.apply(Math, xValues);
        let largestY = Math.max.apply(Math, yValues);
        
        this._edgeElementX = this._overallBounds.width <= largestX ? elements[xValues.indexOf(largestX)] : null;
        this._edgeElementY = this._overallBounds.height <= largestY ? elements[yValues.indexOf(largestY)] : null;
    }
    
    resizeToFit() {
        if(this.options.host.isInitializing) return;

        let changeMade = false;

        let width = this._visibleBounds.width;
        if (this._edgeElementX) {
            width = Math.max(this._visibleBounds.width, (this._edgeElementX.x + this._edgeElementX.width));
        }

        if (this._overallBounds.width !== width) {
            this._overallBounds.width = width;
            this.root.style.width = this._overallBounds.width + 'px';

            changeMade = true;
        }
         
        let height = this._visibleBounds.height;
        if (this._edgeElementY) {
            height = Math.max(this._visibleBounds.height, (this._edgeElementY.y + this._edgeElementY.height));
        }

        if (this._overallBounds.height !== height) {
            this._overallBounds.height = height;
            this.root.style.height = this._overallBounds.height + 'px';

            changeMade = true;
        }

        if (changeMade === true) {
            // NOTE: the following code is used to have a fine grained management on how scrollbars are displayed
            // this will not be the case if you let the browser do (ie. many scrollbars displayed and/or even if the size is smaller than the actual bounds)
            if (this._overallBounds.width === this._visibleBounds.width) {
                this.options.host.style.overflowX = 'hidden';
            }
            else if (this.options.host.style.overflowX === 'hidden') {
                this.options.host.style.overflowX = 'auto';
            }

            if (this._overallBounds.height === this._visibleBounds.height) {
                this.options.host.style.overflowY = 'hidden';
            }
            else if (this.options.host.style.overflowY === 'hidden') {
                this.options.host.style.overflowY = 'auto';
            }
        }
    }
    
    isInWidth(element) {
        return (0 <= element.x && element.x <= this._overallBounds.width && (element.x + element.width) <= this._overallBounds.width);
    }
    
    isInHeight(element) {
        return (0 <= element.y && element.y <= this._overallBounds.height && (element.y + element.height) <= this._overallBounds.height);
    }
    
    isInBounds(element) {
        return this.isInWidth(element) && this.isInHeight(element);  
    }
    
    updatePosition(element) {
        if(!(element instanceof FlowChainElement) || (element.classList.contains('root') && element instanceof FlowChainGroup)) return;
                
        let ex = element.x;
        let ey = element.y;
        let style = element.style;
        
        let changed = false;
        
        if (this._options.snapToGrid) {
            ex = Math.round(element.x / this._options.gridSize[0]) * this._options.gridSize[0];
            ey = Math.round(element.y / this._options.gridSize[1]) * this._options.gridSize[1];
        }
        
        if(ex !== element.x) {
            element._x = ex;
        }
        
        if(style.left !== (element.x + 'px')) {
            style.left = (element.x + 'px');
            changed = true;
        }
        
        if(ey !== element.y) {
            element._y = ey;
        }
        
        if(style.top !== (element.y + 'px')) {
            style.top = (element.y + 'px');
            changed = true;
        }
        
        if(!this.isInBounds(element) || (changed && (this._edgeElementX === element || this._edgeElementY == element))) {
            this.guessEdgeElements();
            this.resizeToFit();   
        }
    }
    
    layout(element) {
        if (!this._options.host) return;
        
        if(element === undefined) {
            this.options.host.elements.forEach(this.updatePosition, this);
            this.resizeToFit();
        }
        else if(element instanceof FlowChainElement){
            this.updatePosition(element);
        }
    }
    
    register(element) {
        if (!(element instanceof HTMLElement)) return;

        element.addEventListener('x', this._handleXChangedProxy);
        element.addEventListener('y', this._handleYChangedProxy);
        element.addEventListener('width', this._handleWidthChangedProxy);
        element.addEventListener('height', this._handleHeightChangedProxy);
        
        this.updatePosition(element);
    }
    
    unregister(element) {
        if (!(element instanceof HTMLElement)) return;

        element.removeEventListener('x', this._handleXChangedProxy);
        element.removeEventListener('y', this._handleYChangedProxy);
        element.removeEventListener('width', this._handleWidthChangedProxy);
        element.removeEventListener('height', this._handleHeightChangedProxy);
        
        if (element === this._edgeElementX || element === this._edgeElementY) {
            this._edgeElementX = null;
            this._edgeElementY = null;
            
            this.guessEdgeElements();
            this.resizeToFit();
        }
    }
}