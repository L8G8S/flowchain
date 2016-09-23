'use strict';

class DirectedGraphInteractionManager extends FlowChainHostInteractionManager {
    
    constructor(options){
        super(Object.assign({
            host: null
        }, options));
        
        this._lifecycleManager = new DirectedGraphElementLifecycleManager(this.options);
    }
}