// Simple and reliable TOC collapse/expand functionality
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the page to fully load
    setTimeout(function() {
        initializeSimpleTOC();
        initializeTOCCollapse();
        initializeMobileTOC();
    }, 1000);
});

function initializeSimpleTOC() {
    console.log('Initializing enhanced TOC...');
    
    // Find the TOC container
    const tocContainer = document.querySelector('.bd-toc');
    if (!tocContainer) {
        console.log('TOC container not found');
        return;
    }
    
    // Find all items with sublists at any level
    const allItemsWithSublists = tocContainer.querySelectorAll('li:has(ul)');
    console.log('Found items with sublists:', allItemsWithSublists.length);
    
    allItemsWithSublists.forEach(function(item) {
        const link = item.querySelector(':scope > a');
        const subList = item.querySelector(':scope > ul');
        
        if (link && subList) {
            const linkText = link.textContent.trim();
            console.log('Processing item:', linkText);
            
            // Make ALL items with sublists collapsible (Parts, Chapters, Sections)
            const isTopLevel = item.parentElement.parentElement.tagName.toLowerCase() === 'nav';
            
            if (isTopLevel && linkText.includes('Part ')) {
                // Top-level Parts: collapse by default
                subList.style.display = 'none';
                item.classList.add('toc-collapsible');
                console.log('Made top-level collapsible (collapsed):', linkText);
            } else if (!isTopLevel) {
                // Sub-items: also collapse by default for cleaner view
                subList.style.display = 'none';
                item.classList.add('toc-collapsible');
                console.log('Made sub-level collapsible (collapsed):', linkText);
            }
            
            // Add click handler for collapsible items
            if (item.classList.contains('toc-collapsible')) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Clicked on:', linkText);
                    
                    const isVisible = subList.style.display !== 'none';
                    console.log('Currently visible:', isVisible);
                    
                    // For top-level Parts, collapse siblings
                    if (isTopLevel && linkText.includes('Part ')) {
                        const topLevelItems = tocContainer.querySelectorAll('nav > ul > li');
                        topLevelItems.forEach(function(otherItem) {
                            if (otherItem !== item) {
                                const otherSubList = otherItem.querySelector('ul');
                                if (otherSubList && otherItem.classList.contains('toc-collapsible')) {
                                    otherSubList.style.display = 'none';
                                    otherItem.classList.remove('toc-expanded');
                                }
                            }
                        });
                    }
                    
                    // Toggle this item
                    if (isVisible) {
                        subList.style.display = 'none';
                        item.classList.remove('toc-expanded');
                        console.log('Collapsed:', linkText);
                        
                        // Also collapse all nested items
                        const nestedItems = subList.querySelectorAll('li.toc-expanded');
                        nestedItems.forEach(function(nested) {
                            const nestedSubList = nested.querySelector('ul');
                            if (nestedSubList) {
                                nestedSubList.style.display = 'none';
                                nested.classList.remove('toc-expanded');
                            }
                        });
                    } else {
                        subList.style.display = 'block';
                        item.classList.add('toc-expanded');
                        console.log('Expanded:', linkText);
                        
                        // Keep immediate children collapsed - user must click to expand them
                        const immediateChildren = subList.querySelectorAll(':scope > li.toc-collapsible');
                        immediateChildren.forEach(function(child) {
                            const childSubList = child.querySelector('ul');
                            if (childSubList) {
                                childSubList.style.display = 'none';
                                child.classList.remove('toc-expanded');
                            }
                        });
                        
                        // Log what we're showing
                        const directChildren = subList.querySelectorAll(':scope > li');
                        console.log('Showing direct children:', directChildren.length);
                    }
                });
            }
        }
    });
    
    console.log('Enhanced TOC initialized successfully');
}

function initializeTOCCollapse() {
    console.log('Initializing TOC collapse functionality...');
    
    const tocSidebar = document.querySelector('.bd-sidebar-secondary');
    if (!tocSidebar) {
        console.log('TOC sidebar not found');
        return;
    }
    
    // Create collapse button
    const collapseButton = document.createElement('button');
    collapseButton.className = 'toc-collapse-button';
    collapseButton.title = 'Toggle Table of Contents';
    collapseButton.setAttribute('aria-label', 'Toggle Table of Contents');
    
    // Insert the button at the top of the TOC sidebar
    tocSidebar.insertBefore(collapseButton, tocSidebar.firstChild);
    
    // Add click handler
    collapseButton.addEventListener('click', function() {
        tocSidebar.classList.toggle('toc-collapsed');
        console.log('TOC collapsed:', tocSidebar.classList.contains('toc-collapsed'));
    });
    
    console.log('TOC collapse functionality initialized');
}

function initializeMobileTOC() {
    console.log('Initializing mobile TOC functionality...');
    
    // Only create mobile TOC elements if we're on mobile
    function createMobileTOC() {
        // Check if mobile elements already exist
        if (document.querySelector('.mobile-toc-toggle')) {
            return;
        }
        
        // Create mobile toggle button
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-toc-toggle';
        mobileToggle.innerHTML = '☰';
        mobileToggle.title = 'Show Table of Contents';
        mobileToggle.setAttribute('aria-label', 'Show Table of Contents');
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-toc-overlay';
        
        // Create mobile TOC panel
        const panel = document.createElement('div');
        panel.className = 'mobile-toc-panel';
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'mobile-toc-close';
        closeButton.innerHTML = '×';
        closeButton.title = 'Close Table of Contents';
        closeButton.setAttribute('aria-label', 'Close Table of Contents');
        
        // Clone the TOC content
        const originalTOC = document.querySelector('.bd-toc');
        if (originalTOC) {
            const tocClone = originalTOC.cloneNode(true);
            panel.appendChild(closeButton);
            panel.appendChild(tocClone);
        }
        
        // Add elements to body
        document.body.appendChild(mobileToggle);
        document.body.appendChild(overlay);
        document.body.appendChild(panel);
        
        // Add event listeners
        mobileToggle.addEventListener('click', function() {
            document.body.classList.add('mobile-toc-active');
        });
        
        closeButton.addEventListener('click', function() {
            document.body.classList.remove('mobile-toc-active');
        });
        
        overlay.addEventListener('click', function() {
            document.body.classList.remove('mobile-toc-active');
        });
        
        // Handle escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.body.classList.contains('mobile-toc-active')) {
                document.body.classList.remove('mobile-toc-active');
            }
        });
        
        console.log('Mobile TOC elements created');
    }
    
    function removeMobileTOC() {
        const elements = [
            '.mobile-toc-toggle',
            '.mobile-toc-overlay', 
            '.mobile-toc-panel'
        ];
        
        elements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.remove();
            }
        });
        
        document.body.classList.remove('mobile-toc-active');
    }
    
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            createMobileTOC();
        } else {
            removeMobileTOC();
        }
    }
    
    // Check on load
    checkScreenSize();
    
    // Check on resize with debouncing
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(checkScreenSize, 250);
    });
    
    console.log('Mobile TOC functionality initialized');
}