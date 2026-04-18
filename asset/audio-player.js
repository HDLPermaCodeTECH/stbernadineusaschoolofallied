/**
 * Background Audio Player (St. Bernadine Anthem)
 * St. Bernadine Official Website
 */

(function() {
    // Audio Settings
    const audioSrc = 'asset/audio/st._bernadines_anthem.mp3';
    const targetVolume = 0.3; // Volume set to 30%
    const fadeDuration = 2000; // 2 seconds for fade in
    const pauseBetweenLoops = 3500; // 3.5 seconds pause between loops
    
    // Create audio element
    const anthem = new Audio(audioSrc);
    anthem.loop = false; // Disable native loop to handle custom pause
    anthem.volume = 0; // Start at 0 for fade in
    
    let isFadingOut = false;

    /**
     * Smoothly increases volume to target
     */
    const fadeIn = (element, target, duration) => {
        if (isFadingOut) return;
        let currentVol = element.volume;
        const interval = 50;
        const steps = duration / interval;
        const stepSize = (target - currentVol) / steps;
        
        const fadeTimer = setInterval(() => {
            currentVol += stepSize;
            if (currentVol >= target) {
                element.volume = target;
                clearInterval(fadeTimer);
            } else {
                element.volume = Math.max(0, Math.min(target, currentVol));
            }
        }, interval);
    };

    /**
     * Smoothly decreases volume to 0
     */
    const fadeOut = (element, duration, callback) => {
        isFadingOut = true;
        let currentVol = element.volume;
        const interval = 50;
        const steps = duration / interval;
        const stepSize = currentVol / steps;
        
        const fadeTimer = setInterval(() => {
            currentVol -= stepSize;
            if (currentVol <= 0) {
                element.volume = 0;
                clearInterval(fadeTimer);
                if (callback) callback();
                isFadingOut = false;
            } else {
                element.volume = Math.max(0, currentVol);
            }
        }, interval);
    };

    const tryPlay = () => {
        anthem.play().then(() => {
            fadeIn(anthem, targetVolume, fadeDuration);
        }).catch(err => {
            const startOnInteraction = () => {
                anthem.play().then(() => {
                    fadeIn(anthem, targetVolume, fadeDuration);
                });
                ['click', 'scroll', 'touchstart'].forEach(ev => 
                    document.removeEventListener(ev, startOnInteraction)
                );
            };
            ['click', 'scroll', 'touchstart'].forEach(ev => 
                document.addEventListener(ev, startOnInteraction)
            );
        });
    };

    // Professional End Of Track (Fade out near end, no loop)
    anthem.addEventListener('timeupdate', function() {
        const buffer = 3.5; // Start fade out 3.5 seconds before end
        if (this.duration && (this.duration - this.currentTime) < buffer && !isFadingOut && !this.ended) {
            fadeOut(this, buffer * 1000);
        }
    });

    // Handle end of audio
    anthem.addEventListener('ended', function() {
        console.log('Audio finished playing');
        this.volume = 0;
    });

    // Handle smooth Fade Out on page navigation
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href) return;
        
        const isInternal = link.href.startsWith(window.location.origin) || link.href.startsWith('/') || !link.href.includes('://');
        const isSamePage = link.getAttribute('href') && link.getAttribute('href').startsWith('#');

        if (isInternal && !isSamePage && !link.target && !e.ctrlKey && !e.shiftKey) {
            const destination = link.href;
            e.preventDefault();
            fadeOut(anthem, 800, () => {
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
