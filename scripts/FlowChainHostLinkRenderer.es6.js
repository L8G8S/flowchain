'use strict';

var startMarker = Symbol('fc-start-marker');
var endMarker = Symbol('fc-end-marker');

class FlowChainHostLinkRenderer extends FlowChainHostManager {

    get gridContext() {
        return (this._gridContext = (this._gridContext || this._gridPlane.getContext('2d')))
    }
    
    get wireContext() {
        return (this._wireContext = (this._wireContext || this._wirePlane.getContext('2d')))
    }
    
    get freeContext() {
        return (this._freePlane = (this._freePlane || this._freePlane.getContext('2d')))
    }

    get root() {
        return (this._root = (this._root || this.options.host.querySelector('.root')));
    }
    
    constructor(options){
        super(Object.assign({
            host: null,

            connectorSize: 2, 
            connectorColor: '#c0c0c0', 
            
            displayFPS: true,
            
            showGrid : true,
            gridSize : [10, 10],
            gridColor: '#d0d0d0'
        }, options));
        
        this.initializeFromAttributes();
        this.initializeEvents();
        this.initializeDOM();
    }
    
    initializeFromAttributes() {
        let host = this.options.host;
        
        // get user-defined values
        this.attributeChangedCallback('fc-grid-snap');
        this.attributeChangedCallback('fc-grid-show');
        this.attributeChangedCallback('fc-grid-size');
        this.attributeChangedCallback('fc-grid-color');
        this.attributeChangedCallback('fc-connector-color');
        this.attributeChangedCallback('fc-connector-size');
        this.attributeChangedCallback('fc-show-fps');
        
        // define connector markers
        let em = new Triangle(new Point(0, 0), new Point(0, 5.5), new Point(3, 3));
        this[endMarker] = em.translate(new Vector(-em.p3.x, -em.p3.y));
    }
       
    initializeEvents() {
        let self = this;
        this._handleLinkRemovedProxy = function handleLinkRemovedProxy (evt) { evt.preventDefault(); self.render(); };
        this._handleWindowResizeProxy = function handleWindowResizeProxy () { self.render(); };
        
        window.addEventListener("resize", this._handleWindowResizeProxy);
    }
    
    initializeDOM() {
        // create DOM structure
        let shadow = this._options.host.shadowRoot == null ? this._options.host.createShadowRoot() : this._options.host.shadowRoot;
        let content = shadow.querySelector('content');
        
        if(content === null) {
            content = document.createElement('content');
            content.select = '*';
            
            shadow.appendChild(content);
        }

        this._gridPlane = shadow.querySelector('canvas[name="grid"]') !== null ? shadow.querySelector('canvas[name="grid"]') : document.createElement('canvas');
        this._wirePlane = shadow.querySelector('canvas[name="wire"]') !== null ? shadow.querySelector('canvas[name="wire"]') : document.createElement('canvas');
        this._freePlane = shadow.querySelector('canvas[name="free"]') !== null ? shadow.querySelector('canvas[name="free"]') : document.createElement('canvas');
        this._gridPlaneInvalidated = false;
        this._wirePlaneInvalidated = false;
        this._freePlaneInvalidated = false;
                    
        if(this._gridPlane.parentElement === null) {
            this._gridPlane.setAttribute('name', 'grid');
            this._wirePlane.setAttribute('name', 'wire');
            this._freePlane.setAttribute('name', 'free');
            
            shadow.insertBefore(this._gridPlane, content);
            shadow.insertBefore(this._wirePlane, content);
            shadow.insertBefore(this._freePlane, content);
        }
    }
    
    attributeChangedCallback(attrName) {
        super.attributeChangedCallback(attrName);
        
        let attributeValue = this.options.host.getAttribute(attrName);
        
        switch(attrName) {
            case 'fc-grid-snap':
                this.options.snapToGrid = (attributeValue === null || attributeValue === 'true');
                break;

            case 'fc-grid-show':
                this.options.showGrid = (attributeValue === null || attributeValue === 'true');
                break;
                
            case 'fc-grid-size':
                this.options.gridSize = !attributeValue ? [10,10] : attributeValue.split(',').map(function(item) { return parseInt(item, 10); });
                break;

            case 'fc-grid-color':
                this.options.gridColor = !attributeValue ? '#d0d0d0' : attributeValue;
                break;

            case 'fc-connector-color':
                this.options.connectorColor = !attributeValue ? '#c0c0c0' : attributeValue;
                break;
                
            case 'fc-connector-size':
                this.options.connectorSize = !attributeValue ? 2 : parseFloat(attributeValue);
                break;

            case 'fc-show-fps':
                this.options.displayFPS = (attributeValue === 'true');
                break;
        }
    }
    
    destroy() {
        super.destroy();
     
        window.removeEventListener("resize", this._handleWindowResizeProxy);
    }

    register(element) {
        if (!(element instanceof FlowChainElement)) return;
        
        element.addEventListener('linkRemoved', this._handleLinkRemovedProxy);
    }
    
    unregister(element) {
        if (!(element instanceof FlowChainElement)) return;
        
        element.removeEventListener('linkRemoved', this._handleLinkRemovedProxy);
    }
        
    resizeToFit() {
        if(this.options.host.isInitializing) return;
        
        let rootSize = this.options.host.layoutManager.overallBounds;
       
        // NOTE: when a canvas is resized, it is automatically cleared (ie. drawing context is reseted and nothing is drawn)
        if(this._gridPlane.width !== rootSize.width) {
            this._freePlane.width = this._wirePlane.width = this._gridPlane.width = rootSize.width;
            this._freePlaneInvalidated = this._wirePlaneInvalidated = this._gridPlaneInvalidated = true;
        }
        
        if(this._gridPlane.height !== rootSize.height) {
            this._freePlane.height = this._wirePlane.height = this._gridPlane.height = rootSize.height;
            this._freePlaneInvalidated = this._wirePlaneInvalidated = this._gridPlaneInvalidated = true;
        }
    }
    
    clearGridPlane() {
        this.gridContext.clearRect(0, 0, this._gridPlane.width, this._gridPlane.height);
        this._gridPlaneInvalidated = true;
    }
    
    clearWirePlane() {
        this.wireContext.clearRect(0, 0, this._wirePlane.width, this._wirePlane.height);
        this._wirePlaneInvalidated = true;
    }
    
    clearFreePlane() {
        this.freeContext.clearRect(0, 0, this._freePlane.width, this._freePlane.height);
        this._freePlaneInvalidated = true;
    }
    
    clear() {
        this.clearGridPlane();
        this.clearWirePlane();
        this.clearFreePlane();
    }

    render() {
        this.resizeToFit();
        
        this.renderGridPlane();
        this.renderWirePlane();
        this.renderFreePlane();
    }

    renderGridPlane() {
        if(this.options.showGrid && this._gridPlaneInvalidated === true) {
            let size = { width: this._wirePlane.width, height: this._wirePlane.height };
            let dotx = this.options.gridSize[0];
            let doty = this.options.gridSize[1];

            let offscreen = document.createElement("canvas");
            offscreen.width = dotx;
            offscreen.height = doty;

            let offscreenCtx = offscreen.getContext("2d");
            offscreenCtx.fillStyle = this.options.gridColor;
            offscreenCtx.rect(dotx-1, doty-1, 1, 1);
            offscreenCtx.fill();

            let pattern = this.gridContext.createPattern(offscreen, "repeat");
            this.gridContext.fillStyle = pattern;
            this.gridContext.fillRect(0, 0, this._gridPlane.width, this._gridPlane.height);
            this.gridContext.fill();
            
            this._gridPlaneInvalidated = false;
        }
    }
        
    renderWirePlane() {
        this.clearWirePlane();

        if (this.wireContext.lineWidth !== this.options.connectorSize) {
            this.wireContext.lineWidth = this.options.connectorSize;
        }

        if (this.wireContext.strokeStyle !== this.options.connectorColor) {
            this.wireContext.strokeStyle = this.options.connectorColor;
        }

        /*
        if (this.wireContext.fillStyle !== this.options.connectorColor) {
            this.wireContext.fillStyle = this.options.connectorColor;
        }
        */

        if (this.wireContext.lineCap !== 'square') {
            this.wireContext.lineCap = 'square';
        }
        
        this.wireContext.beginPath();
        Array.from(this.options.host.elements).forEach(this.renderElementWires, this);
        this.wireContext.stroke();

        this._wirePlaneInvalidated = false;
    }
    
    renderFreePlane() {
        if(this._freePlaneInvalidated === true) {
            
            this._freePlaneInvalidated === false;
        }
    }

    isRound(element) {
        let s = window.getComputedStyle(element);

        if(s.borderRadius.indexOf('%') != -1){
            return s.borderRadius == '50%';
        }
        else if(s.borderRadius.indexOf('px') != -1){
            return s.borderRadius == (element.width / 2) + 'px';
        }
        
        return false;
    }
    
    getPointToHost(element) {
        let point = new Point();

        while (element != null && !element.classList.contains('root')) {
            point.x += element.x;
            point.y += element.y;

            element = element.parentElement;
        }

        return point
    }

    renderElementWires(element) {
        if(!(element instanceof FlowChainElement) || element === this.root || element.links.size === 0) return;
        
        let elementRect = element.rect || (element.rect = new Rectangle(this.getPointToHost(element), new Size(element.width, element.height)).inflate(2, 2));
        let elementCenter = elementRect.center;
        let elementIsRound = element.isRound || (element.isRound = this.isRound(element));
        let elementPolygon = elementRect.toPolygon();

        Array.from(element.links).forEach(function renderElementWiresForEach (l) {
            let toElement = l.toElement;
            let toElementId = toElement.id;
            
            if(toElement.parentElement === null) return;
              
            if(toElement === element) {
                this.renderElementSelfWire(element);
            }
            else {
                let linkIsRound = toElement.isRound || (toElement.isRound = this.isRound(toElement));
                let linkRect = (!toElement.classList.contains('link-pointer') ? toElement.rect : undefined) || (toElement.rect = new Rectangle(this.getPointToHost(toElement), new Size(toElement.width, toElement.height)).inflate(2, 2));
                let linkCenter = linkRect.center;

                let c2c = new Line(elementCenter, linkCenter);
                
                let sinter;
                if(elementIsRound){
                    sinter = Geometry.getIntersectionLineCircle(c2c, elementCenter, (elementRect.width / 2) + 2);
                }
                else{
                    sinter = Array.from(Geometry.getIntersectionLinePolygon(c2c, elementPolygon));
                }
                
                let tinter;
                if(linkIsRound) {
                    tinter = Geometry.getIntersectionLineCircle(c2c, linkCenter, (linkRect.width / 2) + 2);
                }
                else {
                    let tpoly = linkRect.toPolygon();
                    tinter = Array.from(Geometry.getIntersectionLinePolygon(c2c, tpoly));
                }

                if(sinter.length === 0 || tinter.length === 0) return;

                let line = new Line(sinter[0].round(), tinter[0].round());
                let lineLength = line.length;
                let lineAngle = line.angle;

                let button = element.shadowRoot.querySelector('.delete-link[to="' + toElementId + '"]');
                if(button !== null) {
                    let lc = Geometry.pointAtDistance(line.p1, Math.min(lineLength/2, 20), lineAngle);
                    
                    button.style.left = (lc.x - element.x - button.width/2 -2)+ 'px';
                    button.style.top = (lc.y - element.y - button.height/2 -2) + 'px';    
                }
                
                this.renderElementWire(line.p1, line.p2);
            }            
        }, this);
    }

    renderElementWireStartMarker(p, a){

    }

    renderElementWireEndMarker(t, a) {
        let marker = this[endMarker].clone();
        marker.rotate(a, marker.p3).translate(t);

        this.wireContext.moveTo(marker.p1.x, marker.p1.y);
        this.wireContext.lineTo(marker.p2.x, marker.p2.y);
        this.wireContext.lineTo(marker.p3.x, marker.p3.y);
        this.wireContext.lineTo(marker.p1.x, marker.p1.y);
    }
   
    renderElementWire(s, t) {
        if(s === undefined || t === undefined) return;
        
        let v1 = t.clone().translate(new Vector(-s.x, -s.y));
        let v2 = new Vector(Math.abs(s.x), 0);
        let a = Geometry.angle(v1, v2);

        this.renderElementWireStartMarker(s, a);

        this.wireContext.moveTo(s.x, s.y);
        this.wireContext.lineTo(t.x, t.y);
        
        this.renderElementWireEndMarker(t, a);
    }
    
    renderElementSelfWire(e) {
        if(e === undefined) return;
        
        let elementRect = e.rect || (e.rect = new Rectangle(this.getPointToHost(e), new Size(e.width, e.height)).inflate(2, 2));
        let radius = elementRect.width / 3;

        //this.renderElementWireStartMarker(s, a);

        this.wireContext.moveTo(elementRect.center.x + radius, elementRect.center.y);
        this.wireContext.arc(elementRect.center.x + radius, elementRect.center.y - radius, radius, (60 * Math.PI / 180), (215 * Math.PI / 180), true);

        this.renderElementWireEndMarker(new Point(elementRect.center.x, elementRect.y), 130);
    }
        
    startWire(what) {
        if (what !== undefined) {
            if(what[0] instanceof Array) what = what[0];
            
            for(let i of what) {
                i.rect = undefined;
                i.isRound = undefined;
            }
        }

        this.render();

        if(this.options.displayFPS === true) {
            this.computeFPS();
            this.showFPS();
        }
        
        this._rafId = window.requestAnimationFrame(this.startWire.bind(this, what));
    }

    stopWire() {
        if(this._rafId === undefined) return;
        
        cancelAnimationFrame(this._rafId);
        
        this.render();
        
        this._rafId = undefined;
        this._rafLastTime = undefined;
    }
    
    computeFPS() {
        if (this._rafLastTime === undefined) {
            this._rafFPS == undefined;
            this._rafLastTime = new Date().getTime();
        }

        let delta = (new Date().getTime() - this._rafLastTime)/1000;
        this._rafLastTime = new Date().getTime();
        //this._rafFPS = Math.round(Math.min(this._rafFPS || 120, 1/delta));
        this._rafFPS = Math.round(1 / delta);
    }

    clearFPS() {
        this.wireContext.clearRect((this.options.host.clientWidth + this.options.host.scrollLeft) - 50, 5, 50, 18);
    }
    
    showFPS() {
        if(this._rafFPS === undefined || this._rafFPS === Number.POSITIVE_INFINITY) return;
        
        this.clearFPS();
        
        let x = (this.options.host.clientWidth + this.options.host.scrollLeft) - 50;
        let y = 20;
        
        this.wireContext.fillStyle = "Black";
        this.wireContext.font      = "normal 10pt Arial";
        this.wireContext.fillText(this._rafFPS + " fps", x, y); //(min)
    }
}