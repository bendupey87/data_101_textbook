/**
 * CLEAN SINGLE TOC FOR DATA 101
 * Simple expand/collapse navigation with unified search
 */

class SimpleCleanTOC {
    constructor() {
        this.init();
    }
    
    init() {
        // Remove competing interfaces
        this.removeClutter();
        // Create single clean TOC
        this.createCleanTOC();
        // Add single search functionality
        this.enhanceSearch();
    }
    
    removeClutter() {
        // Remove duplicate search bars
        const extraSearches = document.querySelectorAll('.search-container');
        extraSearches.forEach(search => {
            if (search.id !== 'main-search') {
                search.remove();
            }
        });
        
        // Remove progress indicators and other clutter
        const progressBars = document.querySelectorAll('.progress-bar, .progress-text, .progress-indicator');
        progressBars.forEach(progress => progress.remove());
        
        // Remove extra buttons and widgets
        const extraButtons = document.querySelectorAll('.sidebar-ethical-ads, .edit-this-page');
        extraButtons.forEach(btn => btn.remove());
    }
    
    createCleanTOC() {
        const sidebar = document.querySelector('.bd-sidebar-primary');
        if (!sidebar) return;
        
        // Clear existing content
        sidebar.innerHTML = '';
        
        // Create clean header with single search
        const header = document.createElement('div');
        header.className = 'clean-toc-header';
        header.innerHTML = `
            <div class="toc-title">
                <h3>📚 Data 101 Navigation</h3>
            </div>
            <div class="single-search">
                <input type="text" id="unified-search" placeholder="🔍 Search entire textbook..." />
                <div id="search-results-clean"></div>
            </div>
        `;
        sidebar.appendChild(header);
        
        // Create navigation container
        const navContainer = document.createElement('nav');
        navContainer.className = 'clean-navigation';
        navContainer.setAttribute('aria-label', 'Main Navigation');
        
        // Find existing TOC structure and clean it up
        this.buildCleanNavigation(navContainer);
        sidebar.appendChild(navContainer);
    }
    
    buildCleanNavigation(container) {
        // Get the existing navigation structure
        const existingNav = document.querySelector('.bd-toc-nav nav, .toctree-wrapper');
        if (!existingNav) return;
        
        const tocItems = existingNav.querySelectorAll('a[href]');
        const structure = this.organizeNavStructure(tocItems);
        
        const navList = document.createElement('ul');
        navList.className = 'clean-nav-list';
        
        structure.forEach(item => {
            const listItem = this.createNavItem(item);
            navList.appendChild(listItem);
        });
        
        container.appendChild(navList);
    }
    
    organizeNavStructure(tocItems) {
        const structure = [];
        const itemMap = new Map();
        
        tocItems.forEach((link, index) => {
            const href = link.getAttribute('href');
            const text = link.textContent.trim();
            const level = this.getItemLevel(link);
            
            const item = {
                id: `nav-item-${index}`,
                href: href,
                text: text,
                level: level,
                children: [],
                element: link
            };
            
            itemMap.set(href, item);
            
            if (level === 1) {
                structure.push(item);
            } else {
                // Find parent - simple approach for now
                const parent = this.findParent(structure, level);
                if (parent) {
                    parent.children.push(item);
                }
            }
        });
        
        return structure;
    }
    
    getItemLevel(element) {
        let level = 1;
        let parent = element.parentElement;
        while (parent && !parent.matches('.bd-toc-nav, .toctree-wrapper')) {
            if (parent.tagName === 'UL' || parent.tagName === 'OL') {
                level++;
            }
            parent = parent.parentElement;
        }
        return Math.min(level, 3);
    }
    
    findParent(structure, level) {
        // Simple parent finding - get the last item at level-1
        for (let i = structure.length - 1; i >= 0; i--) {
            if (structure[i].level === level - 1) {
                return structure[i];
            }
            // Check nested children
            const nestedParent = this.findParentInChildren(structure[i].children, level);
            if (nestedParent) return nestedParent;
        }
        return structure[structure.length - 1]; // fallback
    }
    
    findParentInChildren(children, level) {
        for (let i = children.length - 1; i >= 0; i--) {
            if (children[i].level === level - 1) {
                return children[i];
            }
            const nested = this.findParentInChildren(children[i].children, level);
            if (nested) return nested;
        }
        return null;
    }
    
    createNavItem(item) {
        const li = document.createElement('li');
        li.className = `nav-item level-${item.level}`;
        
        const content = document.createElement('div');
        content.className = 'nav-item-content';
        
        // Add expand button if has children
        if (item.children.length > 0) {
            const expandBtn = document.createElement('button');
            expandBtn.className = 'expand-btn';
            expandBtn.innerHTML = '▶';
            expandBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSection(li, expandBtn);
            });
            content.appendChild(expandBtn);
        }
        
        // Add the main link
        const link = document.createElement('a');
        link.href = item.href;
        link.textContent = item.text;
        link.className = 'nav-link';
        content.appendChild(link);
        
        li.appendChild(content);
        
        // Add children if any
        if (item.children.length > 0) {
            const childList = document.createElement('ul');
            childList.className = 'nav-children collapsed';
            
            item.children.forEach(child => {
                const childItem = this.createNavItem(child);
                childList.appendChild(childItem);
            });
            
            li.appendChild(childList);
        }
        
        return li;
    }
    
    toggleSection(listItem, button) {
        const childList = listItem.querySelector('.nav-children');
        if (!childList) return;
        
        const isCollapsed = childList.classList.contains('collapsed');
        
        if (isCollapsed) {
            childList.classList.remove('collapsed');
            button.innerHTML = '▼';
            button.classList.add('expanded');
        } else {
            childList.classList.add('collapsed');
            button.innerHTML = '▶';
            button.classList.remove('expanded');
        }
    }
    
    enhanceSearch() {
        const searchInput = document.getElementById('unified-search');
        const resultsContainer = document.getElementById('search-results-clean');
        
        if (!searchInput || !resultsContainer) return;
        
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                this.performSearch(query, resultsContainer);
            }, 300);
        });
        
        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
                resultsContainer.style.display = 'none';
            }
        });
    }
    
    performSearch(query, container) {
        // Simple content search across all pages
        const allLinks = document.querySelectorAll('.nav-link');
        const results = [];
        
        allLinks.forEach(link => {
            const text = link.textContent.toLowerCase();
            const queryLower = query.toLowerCase();
            
            if (text.includes(queryLower)) {
                results.push({
                    title: link.textContent,
                    href: link.href,
                    relevance: this.calculateRelevance(text, queryLower)
                });
            }
        });
        
        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);
        
        this.displaySearchResults(results.slice(0, 8), container, query);
    }
    
    calculateRelevance(text, query) {
        let score = 0;
        if (text.startsWith(query)) score += 10;
        if (text.includes(query)) score += 5;
        score += (query.length / text.length) * 3;
        return score;
    }
    
    displaySearchResults(results, container, query) {
        if (results.length === 0) {
            container.innerHTML = '<div class="no-results">No results found</div>';
        } else {
            const resultHtml = results.map(result => `
                <div class="search-result">
                    <a href="${result.href}" class="result-link">
                        ${this.highlightQuery(result.title, query)}
                    </a>
                </div>
            `).join('');
            
            container.innerHTML = resultHtml;
        }
        
        container.style.display = 'block';
    }
    
    highlightQuery(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for Jupyter Book to finish loading
    setTimeout(() => {
        window.simpleCleanTOC = new SimpleCleanTOC();
    }, 1000);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleCleanTOC;
}