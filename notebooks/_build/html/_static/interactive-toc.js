/**
 * DATA 101 INTERACTIVE TABLE OF CONTENTS
 * Version: 1.0
 * Description: Collapsible TOC with progress tracking and smooth animations
 */

class InteractiveTOC {
    constructor() {
        this.tocContainer = null;
        this.tocItems = [];
        this.currentSection = null;
        this.progressData = this.loadProgress();
        this.isCollapsed = true; // Default to collapsed state
        
        this.config = {
            scrollOffset: 100,
            animationDuration: 300,
            autoCollapseDelay: 5000,
            progressStorageKey: 'data101_progress',
            collapsedStorageKey: 'data101_toc_collapsed'
        };
        
        this.init();
    }
    
    init() {
        this.createTOCStructure();
        this.setupEventListeners();
        this.setupScrollSpy();
        this.loadCollapsedState();
        this.updateProgress();
    }
    
    createTOCStructure() {
        this.tocContainer = document.querySelector('.bd-sidebar-primary .navbar-nav') || 
                           document.querySelector('.toc') ||
                           this.createTOCContainer();
        
        this.enhanceTOC();
    }
    
    createTOCContainer() {
        const container = document.createElement('div');
        container.className = 'interactive-toc';
        container.innerHTML = `
            <div class="toc-header">
                <h3 class="toc-title">
                    <span class="toc-icon">📚</span>
                    Table of Contents
                    <button class="toc-toggle" aria-label="Toggle TOC">
                        <span class="toggle-icon">▼</span>
                    </button>
                </h3>
                <div class="toc-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="progress-text">0% Complete</span>
                </div>
            </div>
            <nav class="toc-nav" aria-label="Table of Contents">
                <ul class="toc-list"></ul>
            </nav>
        `;
        
        const sidebar = document.querySelector('.bd-sidebar-primary') || document.body;
        sidebar.appendChild(container);
        
        return container;
    }
    
    enhanceTOC() {
        if (!this.tocContainer) return;
        
        if (!this.tocContainer.querySelector('.toc-header')) {
            const header = document.createElement('div');
            header.className = 'toc-header';
            header.innerHTML = `
                <h3 class="toc-title retro-title">
                    <span class="toc-icon terminal-cursor">></span>
                    <span class="typing-text">Table of Contents</span>
                    <button class="toc-toggle" aria-label="Toggle TOC">
                        <span class="toggle-icon">▼</span>
                    </button>
                </h3>
                <div class="toc-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="progress-text">0% Complete</span>
                </div>
            `;
            this.tocContainer.insertBefore(header, this.tocContainer.firstChild);
        }
        
        this.processTOCItems();
        this.makeCollapsible();
    }
    
    processTOCItems() {
        const links = this.tocContainer.querySelectorAll('a[href]');
        this.tocItems = [];
        
        links.forEach((link, index) => {
            const href = link.getAttribute('href');
            const text = link.textContent.trim();
            const level = this.determineTOCLevel(link);
            
            const tocItem = {
                id: `toc-item-${index}`,
                element: link,
                href: href,
                text: text,
                level: level,
                isRead: this.progressData[href] || false,
                parent: null,
                children: []
            };
            
            this.enhanceTOCItem(link, tocItem);
            this.tocItems.push(tocItem);
        });
        
        this.buildTOCHierarchy();
    }
    
    determineTOCLevel(link) {
        let level = 1;
        let parent = link.parentElement;
        while (parent && parent !== this.tocContainer) {
            if (parent.tagName === 'UL' || parent.tagName === 'OL') {
                level++;
            }
            parent = parent.parentElement;
        }
        
        return Math.min(level, 6);
    }
    
    enhanceTOCItem(link, tocItem) {
        const wrapper = document.createElement('div');
        wrapper.className = `toc-item-wrapper level-${tocItem.level}`;
        wrapper.dataset.level = tocItem.level;
        wrapper.id = tocItem.id;
        
        const progressIndicator = document.createElement('span');
        progressIndicator.className = `progress-indicator ${tocItem.isRead ? 'read' : 'unread'}`;
        progressIndicator.innerHTML = tocItem.isRead ? '✓' : '○';
        
        const expandButton = document.createElement('button');
        expandButton.className = 'expand-button';
        expandButton.innerHTML = '<span class="expand-icon">▶</span>';
        expandButton.style.display = 'none';
        
        link.parentNode.insertBefore(wrapper, link);
        wrapper.appendChild(expandButton);
        wrapper.appendChild(progressIndicator);
        wrapper.appendChild(link);
        
        link.addEventListener('click', () => {
            this.markAsRead(tocItem.href);
            this.updateProgress();
        });
        
        tocItem.wrapper = wrapper;
        tocItem.progressIndicator = progressIndicator;
        tocItem.expandButton = expandButton;
    }
    
    buildTOCHierarchy() {
        for (let i = 0; i < this.tocItems.length; i++) {
            const item = this.tocItems[i];
            const children = [];
            
            for (let j = i + 1; j < this.tocItems.length; j++) {
                const potentialChild = this.tocItems[j];
                
                if (potentialChild.level <= item.level) {
                    break;
                }
                
                if (potentialChild.level === item.level + 1) {
                    children.push(potentialChild);
                    potentialChild.parent = item;
                }
            }
            
            item.children = children;
            
            if (children.length > 0) {
                item.expandButton.style.display = 'inline-block';
                item.expandButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleSection(item);
                });
                
                this.collapseSection(item, false);
            }
        }
    }
    
    makeCollapsible() {
        const toggleButton = this.tocContainer.querySelector('.toc-toggle');
        const tocNav = this.tocContainer.querySelector('.toc-nav, .navbar-nav');
        
        if (toggleButton && tocNav) {
            toggleButton.addEventListener('click', () => {
                this.toggleTOC();
            });
            
            if (this.isCollapsed) {
                this.collapseTOC(false);
            }
        }
    }
    
    toggleTOC() {
        this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            this.collapseTOC();
        } else {
            this.expandTOC();
        }
        
        this.saveCollapsedState();
    }
    
    collapseTOC(animate = true) {
        const tocNav = this.tocContainer.querySelector('.toc-nav, .navbar-nav');
        const toggleIcon = this.tocContainer.querySelector('.toggle-icon');
        
        if (tocNav) {
            if (animate) {
                tocNav.style.transition = `all ${this.config.animationDuration}ms ease`;
            }
            tocNav.style.height = '0';
            tocNav.style.overflow = 'hidden';
            tocNav.style.opacity = '0';
        }
        
        if (toggleIcon) {
            toggleIcon.textContent = '▶';
            toggleIcon.style.transform = 'rotate(0deg)';
        }
        
        this.tocContainer.classList.add('toc-collapsed');
        this.isCollapsed = true;
    }
    
    expandTOC(animate = true) {
        const tocNav = this.tocContainer.querySelector('.toc-nav, .navbar-nav');
        const toggleIcon = this.tocContainer.querySelector('.toggle-icon');
        
        if (tocNav) {
            if (animate) {
                tocNav.style.transition = `all ${this.config.animationDuration}ms ease`;
            }
            tocNav.style.height = 'auto';
            tocNav.style.overflow = 'visible';
            tocNav.style.opacity = '1';
        }
        
        if (toggleIcon) {
            toggleIcon.textContent = '▼';
            toggleIcon.style.transform = 'rotate(180deg)';
        }
        
        this.tocContainer.classList.remove('toc-collapsed');
        this.isCollapsed = false;
    }
    
    toggleSection(item) {
        const isCollapsed = item.wrapper.classList.contains('section-collapsed');
        
        if (isCollapsed) {
            this.expandSection(item);
        } else {
            this.collapseSection(item);
        }
    }
    
    collapseSection(item, animate = true) {
        item.wrapper.classList.add('section-collapsed');
        
        const expandIcon = item.expandButton.querySelector('.expand-icon');
        if (expandIcon) {
            expandIcon.style.transform = 'rotate(0deg)';
        }
        
        item.children.forEach(child => {
            if (animate) {
                child.wrapper.style.transition = `all ${this.config.animationDuration}ms ease`;
            }
            child.wrapper.style.height = '0';
            child.wrapper.style.opacity = '0';
            child.wrapper.style.overflow = 'hidden';
            
            if (child.children.length > 0) {
                this.collapseSection(child, animate);
            }
        });
    }
    
    expandSection(item, animate = true) {
        item.wrapper.classList.remove('section-collapsed');
        
        const expandIcon = item.expandButton.querySelector('.expand-icon');
        if (expandIcon) {
            expandIcon.style.transform = 'rotate(90deg)';
        }
        
        item.children.forEach(child => {
            if (animate) {
                child.wrapper.style.transition = `all ${this.config.animationDuration}ms ease`;
            }
            child.wrapper.style.height = 'auto';
            child.wrapper.style.opacity = '1';
            child.wrapper.style.overflow = 'visible';
        });
    }
    
    setupScrollSpy() {
        let ticking = false;
        
        const updateActiveSection = () => {
            let activeItem = null;
            
            for (const item of this.tocItems) {
                const target = document.querySelector(item.href);
                if (target) {
                    const rect = target.getBoundingClientRect();
                    if (rect.top <= this.config.scrollOffset && rect.bottom > 0) {
                        activeItem = item;
                    }
                }
            }
            
            if (activeItem !== this.currentSection) {
                this.setActiveSection(activeItem);
            }
            
            ticking = false;
        };
        
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateActiveSection);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', onScroll, { passive: true });
        updateActiveSection();
    }
    
    setActiveSection(item) {
        if (this.currentSection) {
            this.currentSection.wrapper.classList.remove('active');
            this.currentSection.element.classList.remove('active');
        }
        
        if (item) {
            item.wrapper.classList.add('active');
            item.element.classList.add('active');
            
            let parent = item.parent;
            while (parent) {
                this.expandSection(parent, false);
                parent = parent.parent;
            }
            
            this.scrollTOCToItem(item);
        }
        
        this.currentSection = item;
    }
    
    scrollTOCToItem(item) {
        const tocNav = this.tocContainer.querySelector('.toc-nav, .navbar-nav');
        if (!tocNav || !item.wrapper) return;
        
        const itemRect = item.wrapper.getBoundingClientRect();
        const tocRect = tocNav.getBoundingClientRect();
        
        if (itemRect.top < tocRect.top || itemRect.bottom > tocRect.bottom) {
            const scrollTop = tocNav.scrollTop + (itemRect.top - tocRect.top) - (tocRect.height / 2);
            tocNav.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
    }
    
    markAsRead(href) {
        this.progressData[href] = true;
        this.saveProgress();
        
        const item = this.tocItems.find(item => item.href === href);
        if (item && item.progressIndicator) {
            item.isRead = true;
            item.progressIndicator.className = 'progress-indicator read';
            item.progressIndicator.innerHTML = '✓';
        }
    }
    
    updateProgress() {
        const totalItems = this.tocItems.length;
        const readItems = this.tocItems.filter(item => item.isRead).length;
        const progressPercentage = totalItems > 0 ? Math.round((readItems / totalItems) * 100) : 0;
        
        const progressFill = this.tocContainer.querySelector('.progress-fill');
        const progressText = this.tocContainer.querySelector('.progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${progressPercentage}% Complete`;
        }
        
        if (progressPercentage === 100 && readItems > 0) {
            this.celebrateCompletion();
        }
    }
    
    celebrateCompletion() {
        const celebration = document.createElement('div');
        celebration.className = 'completion-celebration';
        celebration.innerHTML = `
            <div class="celebration-content">
                <h3>🎉 Congratulations! 🎉</h3>
                <p>You've completed the Data 101 textbook!</p>
                <p class="celebration-emoji">📊🐍💻✨</p>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        setTimeout(() => {
            celebration.remove();
        }, 5000);
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 't':
                        e.preventDefault();
                        this.toggleTOC();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.navigateToNext();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.navigateToPrevious();
                        break;
                }
            }
        });
    }
    
    navigateToNext() {
        if (!this.currentSection) return;
        
        const currentIndex = this.tocItems.indexOf(this.currentSection);
        if (currentIndex < this.tocItems.length - 1) {
            const nextItem = this.tocItems[currentIndex + 1];
            window.location.href = nextItem.href;
        }
    }
    
    navigateToPrevious() {
        if (!this.currentSection) return;
        
        const currentIndex = this.tocItems.indexOf(this.currentSection);
        if (currentIndex > 0) {
            const prevItem = this.tocItems[currentIndex - 1];
            window.location.href = prevItem.href;
        }
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.config.progressStorageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Failed to load progress data:', e);
            return {};
        }
    }
    
    saveProgress() {
        try {
            localStorage.setItem(this.config.progressStorageKey, JSON.stringify(this.progressData));
        } catch (e) {
            console.warn('Failed to save progress data:', e);
        }
    }
    
    loadCollapsedState() {
        try {
            const saved = localStorage.getItem(this.config.collapsedStorageKey);
            this.isCollapsed = saved ? JSON.parse(saved) : true;
        } catch (e) {
            this.isCollapsed = true;
        }
    }
    
    saveCollapsedState() {
        try {
            localStorage.setItem(this.config.collapsedStorageKey, JSON.stringify(this.isCollapsed));
        } catch (e) {
            console.warn('Failed to save collapsed state:', e);
        }
    }
    
    resetProgress() {
        this.progressData = {};
        this.saveProgress();
        this.tocItems.forEach(item => {
            item.isRead = false;
            if (item.progressIndicator) {
                item.progressIndicator.className = 'progress-indicator unread';
                item.progressIndicator.innerHTML = '○';
            }
        });
        this.updateProgress();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.interactiveTOC = new InteractiveTOC();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InteractiveTOC;
}