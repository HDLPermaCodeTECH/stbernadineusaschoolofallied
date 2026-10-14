/**
 * Back to Top Button Logic
 * St. Bernadine Official Website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create button element if it doesn't already exist
    if (!document.getElementById('back-to-top')) {
        const backToTopBtn = document.createElement('a');
        backToTopBtn.id = 'back-to-top';
        backToTopBtn.href = '#';
        backToTopBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 6-6 6 6M12 6v14"/></svg>';
        backToTopBtn.setAttribute('aria-label', 'Go to top');
        backToTopBtn.setAttribute('title', 'Go to top');
        
        // Add to body
        document.body.appendChild(backToTopBtn);
        
        // Show/Hide logic based on scroll position
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
        
        // Smooth scroll to top on click
        backToTopBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
            });
        });
    }
});
