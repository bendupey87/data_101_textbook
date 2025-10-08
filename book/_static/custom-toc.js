// Simple mobile navigation for Data 101 textbook
document.addEventListener('DOMContentLoaded', function() {
    console.log('Data 101 mobile navigation loaded');
    
    // Add mobile-friendly behavior if needed
    if (window.innerWidth <= 768) {
        console.log('Mobile view detected');
        
        // Ensure mobile layout works properly
        const main = document.querySelector('.bd-main');
        if (main) {
            main.style.flexDirection = 'column';
            main.style.width = '100vw';
        }
    }
});
