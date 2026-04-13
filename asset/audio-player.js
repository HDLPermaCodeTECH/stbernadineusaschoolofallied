/**
 * Background Audio Player (St. Bernadine Anthem)
 * St. Bernadine Official Website
 */

(function() {
    const audioSrc = 'asset/audio/st._bernadines_anthem.mp3';
    const targetVolume = 0.5;
    const fadeDuration = 2000; // 2 seconds for fade in
    const fadeOutDuration = 1000; // 1 second for fade out on navigation
    
    // Create audio element
    const anthem = new Audio(audioSrc);
    anthem.loop = true;
    anthem.volume = 0; // Start at 0 for fade in
    
    /**
     * Smoothly increases volume to target
     */
    const fadeIn = (element, target, duration) => {
        let currentVolume = 0;
        const interval = 50; // Update every 50ms
        const step = target / (duration / interval);
        
        const fadeTimer = setInterval(() => {
            currentVolume += step;
            if (currentVolume >= target) {
                element.volume = target;
                clearInterval(fadeTimer);
            } else {
                element.volume = currentVolume;
            }
        }, interval);
    };

    /**
     * Smoothly decreases volume to 0
     */
    const fadeOut = (element, duration, callback) => {
        let currentVolume = element.volume;
        const interval = 50;
        const step = currentVolume / (duration / interval);
        
        const fadeTimer = setInterval(() => {
            currentVolume -= step;
            if (currentVolume <= 0) {
                element.volume = 0;
                clearInterval(fadeTimer);
                if (callback) callback();
            } else {
                element.volume = currentVolume;
            }
        }, interval);
    };

    const tryPlay = () => {
        anthem.play().then(() => {
            fadeIn(anthem, targetVolume, fadeDuration);
        }).catch(err => {
            // Autoplay blocked - wait for user interaction
            const startOnInteraction = () => {
                anthem.play().then(() => {
                    fadeIn(anthem, targetVolume, fadeDuration);
                });
                document.removeEventListener('click', startOnInteraction);
                document.removeEventListener('scroll', startOnInteraction);
                document.removeEventListener('touchstart', startOnInteraction);
            };
            
            document.addEventListener('click', startOnInteraction);
            document.addEventListener('scroll', startOnInteraction);
            document.addEventListener('touchstart', startOnInteraction);
        });
    };

    // Handle smooth Fade Out on page navigation
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.href.includes(window.location.origin) && !link.target && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            const destination = link.href;
            fadeOut(anthem, fadeOutDuration, () => {
                window.location.href = destination;
            });
        }
    });

    // Attempt playback when the page is ready
    if (document.readyState === 'complete') {
        tryPlay();
    } else {
        window.addEventListener('load', tryPlay);
    }
})();
