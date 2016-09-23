'use strict';

class FlowChainHostDraggableManager extends FlowChainHostManager {

    constructor(options) {
        super(Object.assign({
            host: null,
            dragHandle: '::shadow .drag-handle',
            moveSmallChange: 10,
            moveLargeChange: 30
        }, options));

        this._trackedElements = new Set();
        this._dragPool = new Set();
        
        this.initializeEvents();
    }
    
    initializeEvents() {
        let self = this;
        
        this._keyDownProxy = function keyDownProxy () { self.keyDown.apply(self, [...arguments]); };
        this._keyUpProxy = function keyUpProxy () { self.keyUp.apply(self, [...arguments]); };
        
        this._draggableChangeProxy = function draggableChangeProxy () { self.draggableChange.apply(self, [...arguments]); };

        this._mouseDragStartProxy = function mouseDragStartProxy () { self.mouseDragStart.apply(self, [...arguments]); };
        this._mouseDragMoveProxy = function mouseDragMoveProxy () { self.mouseDragMove.apply(self, [...arguments]); };
        this._mouseDragStopProxy = function mouseDragStopProxy () { self.mouseDragStop.apply(self, [...arguments]); };

        this._touchDragStartProxy = function touchDragStartProxy () { self.touchDragStart.apply(self, [...arguments]); };
        this._touchDragMoveProxy = function touchDragMoveProxy () { self.touchDragMove.apply(self, [...arguments]); };
        this._touchDragStopProxy = function touchDragStopProxy () { self.touchDragStop.apply(self, [...arguments]); };

        this._dropTargetHitProxy = function dropTargetHitProxy () { self.dropTargetHit.apply(self, [...arguments]); };
        this._dropTargetLostProxy = function dropTargetLostProxy () { self.dropTargetLost.apply(self, [...arguments]); };        
    }
    
    destroy() {
        super.destroy();
        
        Array.from(this._trackedElements).forEach(function(e) {
            e.addEventListener('draggable', this._draggableChangeProxy);
        }, this);
        this._trackedElements.clear();
    }

    get generatedEvents() {
        return ['movestart', 'movestop', 'dragstart', 'dragstop'];
    }

    keyDown(evt) {
        if (!(evt.srcElement instanceof FlowChainElement)) return;

        if (evt.keyCode >= 37 && evt.keyCode <= 40) {
            evt.stopImmediatePropagation();

            let offsetX = (evt.repeat
                    ? this._options.moveLargeChange
                    : this._options.moveSmallChange);

            let offsetY = (evt.repeat
                    ? this._options.moveLargeChange
                    : this._options.moveSmallChange);
            
            let root = this.options.host.querySelector('.root');
            let draggables = Array.from(root.querySelectorAll('.selected.draggable'));
                    
            draggables.forEach(function(d) {
                d.classList.add('dragging');
                
                if (evt.keyCode == 37) d.x -= offsetX;
                else if (evt.keyCode == 39) d.x += offsetX;
                else if (evt.keyCode == 38) d.y -= offsetY;
                else if (evt.keyCode == 40) d.y += offsetY;
                
            }, this);

            if (!evt.repeat) {
                this.dispatchEvent('movestart', draggables);
            }
        }
    }

    keyUp(evt) {
        if (!(evt.srcElement instanceof FlowChainElement)) return;

        if (evt.keyCode >= 37 && evt.keyCode <= 40) {
            evt.stopImmediatePropagation();
                   
            let root = this.options.host.querySelector('.root');
            let draggables = Array.from(root.querySelectorAll('.selected.draggable'));

            draggables.forEach(function(d) {
                d.classList.remove('dragging');
                d.syncDOM();
            });
            
            this.dispatchEvent('movestop', draggables);
        }
    }

    draggableChange(evt) {
        let element = evt.srcElement;

        if (element.isDraggable) {
            this.registerDraggable(element);
        }
        else {
            this.unregisterDraggable(element);
        }
    }
    
    mouseDragStart(evt) {
        if((evt.which && evt.which !== 1) || (evt.button && evt.button !== 0)) return;
        
        evt.preventDefault();
        evt.stopImmediatePropagation();

        window.addEventListener('mousemove', this._mouseDragMoveProxy);
        window.addEventListener('mouseup', this._mouseDragStopProxy);

        this.dragStart(evt.srcElement.dragParent, { x: (this.options.host.scrollLeft + evt.clientX), y: (this.options.host.scrollTop + evt.clientY) });
    }

    mouseDragMove(evt) {
        this.dragMove({ x: (this.options.host.scrollLeft + evt.clientX), y: (this.options.host.scrollTop + evt.clientY) });
    }

    mouseDragStop(evt) {
        window.removeEventListener('mousemove', this._mouseDragMoveProxy);
        window.removeEventListener('mouseup', this._mouseDragStopProxy);

        this.dragStop();
    }

    touchDragStart(evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();

        window.addEventListener('touchmove', this._touchDragMoveProxy);
        window.addEventListener('touchend', this._touchDragStopProxy);

        let touched = evt.touches[0];
        this.dragStart(touched.target.dragParent, { x: touched.pageX, y: touched.pageY });
    }

    touchDragMove(evt) {
        evt.preventDefault();

        let touched = evt.touches[0];
        this.dragMove({ x: touched.pageX, y: touched.pageY });
    }

    touchDragStop(evt) {
        evt.preventDefault();

        window.removeEventListener('touchmove', this._touchDragMoveProxy);
        window.removeEventListener('touchend', this._touchDragStopProxy);

        this.dragStop();
    }

    dragStart(dragged, mousePos) {
        if (!dragged || this._dragPool.has(dragged)) return;

        dragged.focus();
        
        let root = this.options.host.querySelector('.root');
        
        if(!dragged.classList.contains('selected')) {
            Array.from(root.querySelectorAll('.selected.draggable')).forEach(function(d) {
                d.classList.remove('selected');
            });
            dragged.classList.add('selected');   
        }
                
        Array.from(root.querySelectorAll('.selected.draggable')).forEach(function(d) {
            d.classList.add('dragging');
            d.dragOffset = new Point(mousePos.x - (d.x - d.parentElement.x), mousePos.y - (d.y - d.parentElement.y));
            this._dragPool.add(d);
        }, this);

        if (this._dragPool.size >= 1) {
            this._options.host.setAttribute('action', 'dragging');
            document.documentElement.classList.add('dragging');

            // list all the drop targets
            // + store their BoundingClientRect for performance reason
            this._dropTargets = [];
            Array.from(this._options.host.querySelectorAll('fc-group')).forEach(function dropTargetForEach(dropTarget) {
                if (!dropTarget.allowDrop || dragged === dropTarget) return;

                let rect = dropTarget.getBoundingClientRect();
                dropTarget.bounds = new Rectangle(new Point(rect.left, rect.top), new Size(rect.width, rect.height));

                this._dropTargets.push(dropTarget);
            }, this);

            if (dragged.parentElement instanceof FlowChainGroup) {
                dragged.parentElement.classList.add('hit');
            }

            this.dispatchEvent('dragstart', Array.from(this._dragPool));
        }
    }

    dragMove(mousePos) {
        this._dragPool.forEach(function dragMoveUpdatePosition(dragged) {
            dragged.x = mousePos.x - dragged.dragOffset.x;
            dragged.y = mousePos.y - dragged.dragOffset.y;
        });

        // check if the mouse location is in a droptarget
        this._dropTargets.forEach(function dragMoveUpdateHit (dropTarget) {
            if (dropTarget.bounds.contains(mousePos)) {
                dropTarget.classList.add('hit');
            }
            else {
                dropTarget.classList.remove('hit');
            } 
        });
    }

    dragStop() {        
        // check if a drop target has been hit
        let dropTarget = null;
        let dropTargetRect = new Rectangle();
        
        for(let dt of this._dropTargets) {
            if (dt.classList.contains('hit')) {
                dropTarget = dt;
                dropTargetRect = dt.bounds; // we already have the bounding rect
            }
            dt.bounds = undefined; // free the created Rectangle
            dt.classList.remove('hit');
        }
        this._dropTargets = [];

        // then clear data on dragged elements
        for(let d of this._dragPool) {
            d.dragOffset = undefined;
            d.classList.remove('dragging');

            if (dropTarget !== null && !d.contains(dropTarget) && d.parentElement !== dropTarget) {
                // compute the location of the element relative to its new parent
                let dBoundingRect = d.getBoundingClientRect();
                d.x = dBoundingRect.left - dropTargetRect.left;
                d.y = dBoundingRect.top - dropTargetRect.top;

                if (d.x < 0) d.x = 0;
                if (d.y < 0) d.y = 0;

                dropTarget.appendChild(d);
            }
        }
        this._dragPool.clear();
        
        document.documentElement.classList.remove('dragging');
        this._options.host.removeAttribute('action');

        this.dispatchEvent('dragstop');
    }

    registerKeyboardHook(element) {
        if (!(element instanceof HTMLElement)) return;

        element.addEventListener('keydown', this._keyDownProxy);
        element.addEventListener('keyup', this._keyUpProxy);
    }

    registerDraggable(element) {
        if (!(element instanceof HTMLElement)) return;
        
        if(!this._trackedElements.has(element)) {
            this._trackedElements.add(element);
            element.addEventListener('draggable', this._draggableChangeProxy);
        }
        
        if (!element.isDraggable) return;

        element.classList.add('draggable');

        let dh = element;
        if (this._options.dragHandle) {
            dh = element.querySelector(this._options.dragHandle);
        }

        if (dh) {
            dh.dragParent = element;
            dh.classList.add('drag-handle');

            dh.addEventListener('mousedown', this._mouseDragStartProxy);
            dh.addEventListener('touchstart', this._touchDragStartProxy);
        }
    }

    register(element) {
        this.registerKeyboardHook(element);
        this.registerDraggable(element);
    }

    unregisterKeyboardHook(element) {
        if (!(element instanceof HTMLElement)) return;

        element.removeEventListener('keydown', this._keyDownProxy, true);
        element.removeEventListener('keyup', this._keyUpProxy, true);
    }

    unregisterDraggable(element) {
        if (!(element instanceof HTMLElement)) return false;

        element.classList.remove('draggable');

        let dh = element;
        if (this._options.dragHandle) {
            dh = element.querySelector(this._options.dragHandle);
        }

        if (dh) {
            dh.removeEventListener('mousedown', this._mouseDragStartProxy);
            dh.removeEventListener('touchstart', this._touchDragStartProxy);

            dh.dragParent = undefined;
            dh.classList.remove('drag-handle');
        }
    }

    unregister(element) {
        this.unregisterKeyboardHook(element);
        this.unregisterDraggable(element);
    }
}