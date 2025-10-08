/**
 * DATA 101 ADVANCED SEARCH SYSTEM
 * Version: 1.0
 * Description: Real-time search with fuzzy matching, context preview, and intelligent ranking
 */

class Data101Search {
    constructor() {
        this.searchIndex = [];
        this.searchResults = [];
        this.isIndexing = false;
        this.searchInput = null;
        this.searchResults = null;
        this.searchContainer = null;
        
        // Search configuration
        this.config = {
            minQueryLength: 2,
            maxResults: 10,
            highlightClass: 'search-highlight',
            debounceDelay: 300,
            fuzzyThreshold: 0.6
        };
        
        this.initializeSearch();
    }
    
    /**
     * Initialize the search system
     */
    initializeSearch() {
        this.createSearchInterface();
        this.buildSearchIndex();
        this.setupEventListeners();
    }
    
    /**
     * Create the search UI elements
     */
    createSearchInterface() {
        // Find or create search container
        let existingSearch = document.querySelector('.search-container');
        if (!existingSearch) {
            existingSearch = document.createElement('div');
            existingSearch.className = 'search-container';
            
            // Insert into navigation or header
            const nav = document.querySelector('.bd-navbar') || document.querySelector('nav') || document.body;
            nav.appendChild(existingSearch);
        }
        
        this.searchContainer = existingSearch;
        
        // Create search input with icon
        this.searchContainer.innerHTML = `
            <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input 
                    type="text" 
                    class="search-input" 
                    placeholder="Search textbook content, code examples, and key terms..."
                    autocomplete="off"
                    spellcheck="false"
                >
            </div>
            <div class="search-results" style="display: none;"></div>
            <div class="search-loading" style="display: none;">
                <div class="loading-spinner"></div>
                <span>Indexing content...</span>
            </div>
        `;
        
        this.searchInput = this.searchContainer.querySelector('.search-input');
        this.searchResultsContainer = this.searchContainer.querySelector('.search-results');
        this.searchLoading = this.searchContainer.querySelector('.search-loading');
    }
    
    /**
     * Build search index from page content
     */
    async buildSearchIndex() {
        this.showLoading(true);
        this.searchIndex = [];
        
        try {
            // Index current page content
            await this.indexCurrentPage();
            
            // Index other pages if available (for multi-page sites)
            await this.indexOtherPages();
            
            console.log(`Search index built with ${this.searchIndex.length} entries`);
            
        } catch (error) {
            console.error('Error building search index:', error);
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Index content from the current page
     */
    async indexCurrentPage() {
        const contentSelectors = [
            'main article',
            '.content',
            '.jp-Cell',
            'section',
            '.bd-content'
        ];
        
        for (const selector of contentSelectors) {
            const containers = document.querySelectorAll(selector);
            containers.forEach(container => this.indexContainer(container));
        }
    }
    
    /**
     * Index content from a container element
     */
    indexContainer(container) {
        // Index headings
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            this.addToIndex({
                type: 'heading',
                title: this.cleanText(heading.textContent),
                content: this.getContextAfterElement(heading, 200),
                element: heading,
                level: parseInt(heading.tagName.charAt(1)),
                url: this.getElementUrl(heading)
            });
        });
        
        // Index paragraphs
        const paragraphs = container.querySelectorAll('p');
        paragraphs.forEach(p => {
            const text = this.cleanText(p.textContent);
            if (text.length > 20) { // Ignore very short paragraphs
                this.addToIndex({
                    type: 'paragraph',
                    title: this.extractTitle(p),
                    content: text.substring(0, 300),
                    element: p,
                    url: this.getElementUrl(p)
                });
            }
        });
        
        // Index code blocks
        const codeBlocks = container.querySelectorAll('pre code, .highlight');
        codeBlocks.forEach(code => {
            const text = code.textContent.trim();
            if (text.length > 10) {
                this.addToIndex({
                    type: 'code',
                    title: this.extractCodeTitle(code),
                    content: text.substring(0, 200),
                    element: code,
                    url: this.getElementUrl(code)
                });
            }
        });
        
        // Index lists
        const lists = container.querySelectorAll('ul, ol');
        lists.forEach(list => {
            const items = Array.from(list.querySelectorAll('li')).map(li => li.textContent.trim());
            if (items.length > 0) {
                this.addToIndex({
                    type: 'list',
                    title: this.extractTitle(list) || 'List',
                    content: items.join(' • '),
                    element: list,
                    url: this.getElementUrl(list)
                });
            }
        });
        
        // Index tables
        const tables = container.querySelectorAll('table');
        tables.forEach(table => {
            const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim()).join(' | ');
            const rows = Array.from(table.querySelectorAll('tr')).slice(0, 3).map(tr => 
                Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()).join(' | ')
            ).join(' ');
            
            this.addToIndex({
                type: 'table',
                title: this.extractTitle(table) || 'Table',
                content: headers + ' ' + rows,
                element: table,
                url: this.getElementUrl(table)
            });
        });
    }
    
    /**
     * Add entry to search index
     */
    addToIndex(entry) {
        if (!entry.content || entry.content.length < 10) return;
        
        // Generate search keywords
        entry.keywords = this.generateKeywords(entry.title + ' ' + entry.content);
        
        // Calculate weight based on content type and position
        entry.weight = this.calculateWeight(entry);
        
        this.searchIndex.push(entry);
    }
    
    /**
     * Generate keywords for search indexing
     */
    generateKeywords(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !this.isStopWord(word));
    }
    
    /**
     * Check if word is a stop word
     */
    isStopWord(word) {
        const stopWords = ['the', 'and', 'but', 'for', 'are', 'with', 'this', 'that', 'from', 'they', 'she', 'have', 'had', 'what', 'said', 'each', 'which', 'their', 'will', 'about', 'all', 'were', 'very', 'like', 'just', 'long', 'make', 'him', 'over', 'such', 'call', 'back', 'way', 'only', 'think', 'also', 'its', 'now', 'find', 'any', 'new', 'work', 'part', 'take', 'get', 'place', 'made', 'live', 'where', 'after', 'never', 'here', 'how', 'our', 'out', 'up', 'time', 'them'];
        return stopWords.includes(word.toLowerCase());
    }
    
    /**
     * Calculate search weight for ranking
     */
    calculateWeight(entry) {
        let weight = 1;
        
        // Type-based weighting
        switch (entry.type) {
            case 'heading':
                weight *= (6 - entry.level); // h1 = 5, h6 = 1
                break;
            case 'code':
                weight *= 3;
                break;
            case 'table':
                weight *= 2;
                break;
            case 'list':
                weight *= 1.5;
                break;
            default:
                weight *= 1;
        }
        
        // Length-based weighting (prefer substantial content)
        const contentLength = entry.content.length;
        if (contentLength > 100) weight *= 1.2;
        if (contentLength > 200) weight *= 1.3;
        
        return weight;
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        let searchTimeout;
        
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, this.config.debounceDelay);
        });
        
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.trim().length >= this.config.minQueryLength) {
                this.showResults(true);
            }
        });
        
        // Close results when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.searchContainer.contains(e.target)) {
                this.showResults(false);
            }
        });
        
        // Handle keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
        });
    }
    
    /**
     * Perform search and display results
     */
    performSearch(query) {
        if (!query || query.trim().length < this.config.minQueryLength) {
            this.showResults(false);
            return;
        }
        
        const results = this.search(query.trim());
        this.displayResults(results, query);
        this.showResults(results.length > 0);
    }
    
    /**
     * Execute search against index
     */
    search(query) {
        const queryWords = this.generateKeywords(query);
        const results = [];
        
        this.searchIndex.forEach(entry => {
            const score = this.calculateRelevanceScore(entry, queryWords, query);
            if (score > 0) {
                results.push({
                    ...entry,
                    score: score,
                    matchedTerms: this.getMatchedTerms(entry, queryWords)
                });
            }
        });
        
        // Sort by relevance score
        results.sort((a, b) => b.score - a.score);
        
        return results.slice(0, this.config.maxResults);
    }
    
    /**
     * Calculate relevance score for search entry
     */
    calculateRelevanceScore(entry, queryWords, originalQuery) {
        let score = 0;
        const entryText = (entry.title + ' ' + entry.content).toLowerCase();
        
        // Exact phrase match (highest priority)
        if (entryText.includes(originalQuery.toLowerCase())) {
            score += 10 * entry.weight;
        }
        
        // Title matches (high priority)
        queryWords.forEach(word => {
            if (entry.title.toLowerCase().includes(word)) {
                score += 5 * entry.weight;
            }
        });
        
        // Keyword matches
        queryWords.forEach(word => {
            const matchCount = entry.keywords.filter(keyword => 
                keyword.includes(word) || this.fuzzyMatch(keyword, word)
            ).length;
            score += matchCount * entry.weight;
        });
        
        // Content matches
        queryWords.forEach(word => {
            const regex = new RegExp(word, 'gi');
            const matches = entryText.match(regex);
            if (matches) {
                score += matches.length * 0.5 * entry.weight;
            }
        });
        
        return score;
    }
    
    /**
     * Fuzzy string matching
     */
    fuzzyMatch(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length >= this.config.fuzzyThreshold;
    }
    
    /**
     * Calculate Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    /**
     * Display search results
     */
    displayResults(results, query) {
        if (results.length === 0) {
            this.searchResultsContainer.innerHTML = `
                <div class="search-no-results">
                    <p>No results found for "${query}"</p>
                    <p>Try different keywords or check spelling</p>
                </div>
            `;
            return;
        }
        
        const resultsHTML = results.map((result, index) => `
            <div class="search-result-item" data-index="${index}" data-url="${result.url}">
                <div class="search-result-type">${result.type.toUpperCase()}</div>
                <div class="search-result-title">${this.highlightText(result.title, query)}</div>
                <div class="search-result-preview">${this.highlightText(result.content, query)}</div>
                <div class="search-result-meta">
                    Score: ${result.score.toFixed(1)} | Type: ${result.type}
                </div>
            </div>
        `).join('');
        
        this.searchResultsContainer.innerHTML = resultsHTML;
        
        // Add click handlers
        this.searchResultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const url = item.dataset.url;
                if (url && url !== '#') {
                    window.location.href = url;
                } else {
                    const index = parseInt(item.dataset.index);
                    const result = results[index];
                    if (result.element) {
                        result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        this.highlightElement(result.element);
                    }
                }
                this.showResults(false);
            });
        });
    }
    
    /**
     * Highlight search terms in text
     */
    highlightText(text, query) {
        if (!query) return text;
        
        const queryWords = this.generateKeywords(query);
        let highlightedText = text;
        
        queryWords.forEach(word => {
            const regex = new RegExp(`(${word})`, 'gi');
            highlightedText = highlightedText.replace(regex, `<span class="${this.config.highlightClass}">$1</span>`);
        });
        
        return highlightedText;
    }
    
    /**
     * Highlight element temporarily
     */
    highlightElement(element) {
        element.style.backgroundColor = 'rgba(57, 255, 20, 0.2)';
        element.style.transition = 'background-color 0.3s ease';
        
        setTimeout(() => {
            element.style.backgroundColor = '';
        }, 2000);
    }
    
    /**
     * Show/hide search results
     */
    showResults(show) {
        this.searchResultsContainer.style.display = show ? 'block' : 'none';
    }
    
    /**
     * Show/hide loading indicator
     */
    showLoading(show) {
        this.searchLoading.style.display = show ? 'block' : 'none';
    }
    
    /**
     * Handle keyboard navigation in search results
     */
    handleKeyNavigation(e) {
        const items = this.searchResultsContainer.querySelectorAll('.search-result-item');
        if (items.length === 0) return;
        
        const currentSelected = this.searchResultsContainer.querySelector('.search-result-item.selected');
        let selectedIndex = currentSelected ? Array.from(items).indexOf(currentSelected) : -1;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % items.length;
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
                break;
            case 'Enter':
                e.preventDefault();
                if (currentSelected) {
                    currentSelected.click();
                }
                return;
            case 'Escape':
                this.showResults(false);
                this.searchInput.blur();
                return;
            default:
                return;
        }
        
        // Update selection
        items.forEach(item => item.classList.remove('selected'));
        if (selectedIndex >= 0) {
            items[selectedIndex].classList.add('selected');
        }
    }
    
    /**
     * Utility functions
     */
    cleanText(text) {
        return text.replace(/\s+/g, ' ').trim();
    }
    
    extractTitle(element) {
        // Try to find a nearby heading
        let current = element.previousElementSibling;
        while (current) {
            if (/^H[1-6]$/.test(current.tagName)) {
                return current.textContent.trim();
            }
            current = current.previousElementSibling;
        }
        
        // Try parent headings
        current = element.parentElement;
        while (current) {
            const heading = current.querySelector('h1, h2, h3, h4, h5, h6');
            if (heading) {
                return heading.textContent.trim();
            }
            current = current.parentElement;
        }
        
        return 'Content';
    }
    
    extractCodeTitle(codeElement) {
        // Look for preceding comment or heading
        const parent = codeElement.closest('pre') || codeElement;
        const prev = parent.previousElementSibling;
        
        if (prev && /^H[1-6]$/.test(prev.tagName)) {
            return prev.textContent.trim();
        }
        
        // Check for inline comments
        const firstLine = codeElement.textContent.split('\n')[0];
        if (firstLine.includes('#') || firstLine.includes('//')) {
            return firstLine.replace(/^[#\s\/]+/, '').trim();
        }
        
        return 'Code Example';
    }
    
    getContextAfterElement(element, maxLength = 200) {
        let text = '';
        let current = element.nextElementSibling;
        
        while (current && text.length < maxLength) {
            if (current.tagName === 'P') {
                text += current.textContent + ' ';
            }
            current = current.nextElementSibling;
        }
        
        return text.trim().substring(0, maxLength);
    }
    
    getElementUrl(element) {
        const id = element.id;
        if (id) {
            return `#${id}`;
        }
        
        // Generate anchor for headings
        if (/^H[1-6]$/.test(element.tagName)) {
            const anchor = element.textContent.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, '-');
            return `#${anchor}`;
        }
        
        return '#';
    }
    
    getMatchedTerms(entry, queryWords) {
        return entry.keywords.filter(keyword => 
            queryWords.some(word => keyword.includes(word))
        );
    }
    
    /**
     * Index other pages (for multi-page books)
     */
    async indexOtherPages() {
        // This could be extended to index other pages in the book
        // For now, we'll just index the current page
        console.log('Multi-page indexing not implemented yet');
    }
}

// Initialize search when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.data101Search = new Data101Search();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Data101Search;
}