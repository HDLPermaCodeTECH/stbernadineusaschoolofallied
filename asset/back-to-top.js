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
        backToTopBtn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
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
                behavior: 'smooth'
            });
        });
    }
});
