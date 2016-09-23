'use strict';

 document.addEventListener("DOMContentLoaded", function(evt) {
    
    // attach clearing
    document.querySelector('button').addEventListener('click', function() {
        document.getElementById('host').clear();
    });
    
    // bind changes triggered from the host to update what's displayed in the property grid
    let observer = new MutationObserver(function(mutations) {
        mutations.forEach(function (mutation) {
            if(!mutation.target || mutation.target.classList.contains('root')) return;
            
            if(mutation.attributeName === 'action' && (mutation.oldValue === 'initializing' || mutation.oldValue === 'selecting' || mutation.oldValue === 'dragging')) {
                let grid = document.getElementById('pgrid');
                let host = document.getElementById('host');
                let firstSelectedElement = host.querySelector('.selected');
                
                grid.source = firstSelectedElement || host;
            }
        });
    });
    
    observer.observe(document.getElementById('host'), { attributes: true, attributeFilter: ['action'], attributeOldValue: true, childList: true, subtree:true });
});