/**
 * ULTRA CLEAN TOC - MINIMAL AND FUNCTIONAL
 * No clutter, no competing interfaces, just clean navigation
 */

class UltraCleanTOC {
    constructor() {
        this.init();
    }
    
    init() {
        // Wait for page to load completely
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        // Remove all competing interfaces first
        this.removeClutter();
        
        // Create clean navigation after a brief delay to ensure DOM is ready
        setTimeout(() => {
            this.createCleanNavigation();
            this.setupSearch();
        }, 500);
    }
    
    removeClutter() {
        // Remove all the Jupyter Book interface clutter
        const clutterSelectors = [
            '.bd-header',
            '.bd-navbar', 
            '.navbar',
            '.bd-sidebar-secondary',
            '.bd-toc',
            '.bd-footer',
            'header.bd-header',
            '.bd-search',
            '.search-button',
            '.theme-switch-button',
            '.prev-next-area',
            '.sidebar-primary-items__end',
            '.sidebar-primary-items__start'
        ];
        
        clutterSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.style.display = 'none');
        });
    }
    
    createCleanNavigation() {
        const sidebar = document.querySelector('.bd-sidebar-primary');
        if (!sidebar) return;
        
        // Clear existing content
        sidebar.innerHTML = '';
        
        // Create clean header with search
        const header = document.createElement('div');
        header.className = 'clean-toc-header';
        header.innerHTML = `
            <div class="toc-title">
                <h3>📚 Data 101</h3>
            </div>
            <input type="text" id="unified-search" placeholder="🔍 Search textbook..." />
            <div id="search-results" style="display: none;"></div>
        `;
        sidebar.appendChild(header);
        
        // Create navigation
        const nav = document.createElement('nav');
        nav.className = 'clean-navigation';
        
        // Build navigation from existing page structure
        this.buildNavigation(nav);
        sidebar.appendChild(nav);
    }
    
    buildNavigation(container) {
        // Create a simple, clean navigation structure
        const navData = [
            {
                title: 'Getting Started',
                items: [
                    { title: 'Table of Contents', href: '01_table_of_contents.html' }
                ]
            },
            {
                title: '🏢 Real-World Applications',
                items: [
                    { title: 'Chapter Overview', href: 'chapter02_real_world_problems/00_chapter_overview.html' },
                    { title: 'Retail Demand Forecasting', href: 'chapter02_real_world_problems/01_retail_demand_forecasting.html' },
                    { title: 'Healthcare Readmissions', href: 'chapter02_real_world_problems/02_healthcare_readmissions.html' },
                    { title: 'Financial Fraud Detection', href: 'chapter02_real_world_problems/03_financial_fraud_detection.html' }
                ]
            }
        ];
        
        const navList = document.createElement('ul');
        navList.className = 'clean-nav-list';
        
        navData.forEach(section => {
            const sectionItem = document.createElement('li');
            sectionItem.className = 'nav-item nav-section';
            
            const sectionContent = document.createElement('div');
            sectionContent.className = 'nav-item-content';
            
            const expandBtn = document.createElement('button');
            expandBtn.className = 'expand-btn';
            expandBtn.innerHTML = '▼';
            expandBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSection(sectionItem, expandBtn);
            });
            
            const sectionTitle = document.createElement('span');
            sectionTitle.className = 'nav-section-title';
            sectionTitle.textContent = section.title;
            
            sectionContent.appendChild(expandBtn);
            sectionContent.appendChild(sectionTitle);
            sectionItem.appendChild(sectionContent);
            
            // Add subsections
            if (section.items && section.items.length > 0) {
                const subList = document.createElement('ul');
                subList.className = 'nav-children';
                
                section.items.forEach(item => {
                    const subItem = document.createElement('li');
                    subItem.className = 'nav-item nav-subitem';
                    
                    const subContent = document.createElement('div');
                    subContent.className = 'nav-item-content';
                    
                    const link = document.createElement('a');
                    link.className = 'nav-link';
                    link.href = item.href;
                    link.textContent = item.title;
                    
                    // Highlight current page
                    if (window.location.pathname.includes(item.href.replace('.html', ''))) {
                        link.classList.add('current-page');
                    }
                    
                    subContent.appendChild(link);
                    subItem.appendChild(subContent);
                    subList.appendChild(subItem);
                });
                
                sectionItem.appendChild(subList);
            }
            
            navList.appendChild(sectionItem);
        });
        
        container.appendChild(navList);
    }
    
    toggleSection(sectionItem, button) {
        const subList = sectionItem.querySelector('.nav-children');
        if (!subList) return;
        
        const isCollapsed = subList.classList.contains('collapsed');
        
        if (isCollapsed) {
            subList.classList.remove('collapsed');
            button.innerHTML = '▼';
        } else {
            subList.classList.add('collapsed');
            button.innerHTML = '▶';
        }
    }
    
    setupSearch() {
        const searchInput = document.getElementById('unified-search');
        const resultsContainer = document.getElementById('search-results');
        
        if (!searchInput || !resultsContainer) return;
        
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
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
        // Simple search through navigation items
        const allLinks = document.querySelectorAll('.nav-link');
        const results = [];
        
        allLinks.forEach(link => {
            const text = link.textContent.toLowerCase();
            const queryLower = query.toLowerCase();
            
            if (text.includes(queryLower)) {
                results.push({
                    title: link.textContent,
                    href: link.href
                });
            }
        });
        
        this.displayResults(results, container, query);
    }
    
    displayResults(results, container, query) {
        if (results.length === 0) {
            container.innerHTML = '<div style="padding: 1rem; color: #888; text-align: center;">No results found</div>';
        } else {
            const resultHtml = results.map(result => `
                <div style="padding: 0.5rem 1rem; border-bottom: 1px solid #333;">
                    <a href="${result.href}" style="color: #39ff14; text-decoration: none; font-size: 0.9rem;">
                        ${this.highlightQuery(result.title, query)}
                    </a>
                </div>
            `).join('');
            
            container.innerHTML = resultHtml;
        }
        
        container.style.display = 'block';
        container.style.position = 'absolute';
        container.style.top = '100%';
        container.style.left = '0';
        container.style.right = '0';
        container.style.background = '#0a0a0a';
        container.style.border = '1px solid #39ff14';
        container.style.borderRadius = '0 0 8px 8px';
        container.style.maxHeight = '300px';
        container.style.overflowY = 'auto';
        container.style.zIndex = '1000';
    }
    
    highlightQuery(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark style="background: #39ff14; color: #0a0a0a; padding: 0 2px;">$1</mark>');
    }
}

// Initialize immediately
if (typeof window !== 'undefined') {
    window.ultraCleanTOC = new UltraCleanTOC();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UltraCleanTOC;
}