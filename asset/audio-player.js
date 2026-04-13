/**
 * Background Audio Player (St. Bernadine Anthem)
 * St. Bernadine Official Website
 */

(function() {
    // Audio Settings
    const audioSrc = 'asset/audio/st._bernadines_anthem.mp3';
    const targetVolume = 0.3; // Volume set to 30%
    const fadeDuration = 2; // 2 seconds for fade in (Web Audio uses seconds)
    const pauseBetweenLoops = 3500; // 3.5 seconds pause between loops
    
    // Create audio element
    const anthem = new Audio(audioSrc);
    anthem.loop = false; // Disable native loop to handle custom pause
    anthem.crossOrigin = "anonymous"; // Needed for Web Audio API if audio is on different domain (good practice)
    
    // Web Audio API setup
    let audioCtx = null;
    let gainNode = null;
    let source = null;
    let isInitialized = false;

    /**
     * Initializes the Web Audio context on user interaction
     */
    const initAudio = () => {
        if (isInitialized) return;
        
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioCtx.createGain();
            source = audioCtx.createMediaElementSource(anthem);
            
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Start gain at 0 for fade in
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            isInitialized = true;
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    };
    
    let isFadingOut = false;

    /**
     * Smoothly increases volume to target using Web Audio API
     */
    const fadeIn = (target, duration) => {
        if (!isInitialized || isFadingOut) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const now = audioCtx.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.linearRampToValueAtTime(target, now + duration);
    };

    /**
     * Smoothly decreases volume to 0 using Web Audio API
     */
    const fadeOut = (duration, callback) => {
        if (!isInitialized) {
            if (callback) callback();
            return;
        }
        
        isFadingOut = true;
        const now = audioCtx.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
        
        setTimeout(() => {
            if (callback) callback();
            isFadingOut = false;
        }, duration * 1000);
    };

    const tryPlay = () => {
        initAudio();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

        anthem.play().then(() => {
            fadeIn(targetVolume, fadeDuration);
        }).catch(err => {
            const startOnInteraction = () => {
                initAudio();
                if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                
                anthem.play().then(() => {
                    fadeIn(targetVolume, fadeDuration);
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

    // Handle end of audio with a 3.5s pause
    anthem.addEventListener('ended', function() {
        setTimeout(() => {
            this.currentTime = 0;
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            this.play().then(() => {
                fadeIn(targetVolume, fadeDuration);
            });
        }, pauseBetweenLoops);
    });

    // Professional Loop Transition (Fade out near end)
    anthem.addEventListener('timeupdate', function() {
        const buffer = 2; // Start fade out 2 seconds before end
        if (this.duration && (this.duration - this.currentTime) < buffer && !isFadingOut && !this.ended && isInitialized) {
            fadeOut(buffer);
        }
    });

    // Handle smooth Fade Out on page navigation
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href) return;
        
        const isInternal = link.href.startsWith(window.location.origin) || link.href.startsWith('/') || !link.href.includes('://');
        const isSamePage = link.getAttribute('href') && link.getAttribute('href').startsWith('#');

        if (isInternal && !isSamePage && !link.target && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            const destination = link.href;
            fadeOut(0.8, () => {
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
