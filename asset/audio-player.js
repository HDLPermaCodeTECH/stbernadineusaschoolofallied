/**
 * Background Audio Player (St. Bernadine Anthem)
 * St. Bernadine Official Website
 */

(function() {
    // Audio Settings
    // Relative path for compatibility with all domains and subdirectories
    const audioSrc = 'asset/audio/st._bernadines_anthem.mp3';
    const targetVolume = 0.3; 
    const fadeDuration = 2; // seconds for Web Audio, converts for fallback
    const pauseBetweenLoops = 3500; 

    // Create audio element
    const anthem = new Audio(audioSrc);
    anthem.loop = false;
    anthem.preload = 'auto';

    // Professional Audio State
    let audioCtx = null;
    let gainNode = null;
    let source = null;
    let isInitialized = false;
    let useWebAudio = false; 
    let isFadingOut = false;

    /**
     * Tries to initialize the professional volume system (Web Audio)
     * Must be called within a user interaction context.
     */
    const initWebAudio = () => {
        if (isInitialized) return useWebAudio;
        
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();

            gainNode = audioCtx.createGain();
            source = audioCtx.createMediaElementSource(anthem);
            
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Start at 0 for fade in
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            
            isInitialized = true;
            useWebAudio = true;
            return true;
        } catch (e) {
            console.warn("Professional audio blocked. Using standard playback fallback.", e);
            isInitialized = true;
            useWebAudio = false;
            return false;
        }
    };

    /**
     * Smoothly increases volume to target
     */
    const fadeIn = (target, durationSec) => {
        if (isFadingOut) return;

        if (useWebAudio && gainNode) {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const now = audioCtx.currentTime;
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.linearRampToValueAtTime(target, now + durationSec);
        } else {
            // Standard Fallback Fade
            let currentVol = anthem.volume;
            const interval = 50;
            const steps = (durationSec * 1000) / interval;
            const stepSize = (target - currentVol) / steps;
            
            const fadeTimer = setInterval(() => {
                currentVol += stepSize;
                if (currentVol >= target) {
                    anthem.volume = target;
                    clearInterval(fadeTimer);
                } else {
                    anthem.volume = Math.max(0, Math.min(target, currentVol));
                }
            }, interval);
        }
    };

    /**
     * Smoothly decreases volume to 0
     */
    const fadeOut = (durationSec, callback) => {
        isFadingOut = true;

        if (useWebAudio && gainNode) {
            const now = audioCtx.currentTime;
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.linearRampToValueAtTime(0, now + durationSec);
            
            setTimeout(() => {
                if (callback) callback();
                isFadingOut = false;
            }, durationSec * 1000);
        } else {
            // Standard Fallback Fade
            let currentVol = anthem.volume;
            const interval = 50;
            const steps = (durationSec * 1000) / interval;
            const stepSize = currentVol / steps;
            
            const fadeTimer = setInterval(() => {
                currentVol -= stepSize;
                if (currentVol <= 0) {
                    anthem.volume = 0;
                    clearInterval(fadeTimer);
                    if (callback) callback();
                    isFadingOut = false;
                } else {
                    anthem.volume = Math.max(0, currentVol);
                }
            }, interval);
        }
    };

    const tryPlay = () => {
        if (!anthem.paused) return;

        anthem.play().then(() => {
            // Success (usually PC)
            fadeIn(targetVolume, fadeDuration);
        }).catch(() => {
            // Interaction required (Mobile)
            const handleInteraction = () => {
                // Initialize professional system on first touch
                initWebAudio();
                
                anthem.play().then(() => {
                    fadeIn(targetVolume, fadeDuration);
                });

                ['click', 'scroll', 'touchstart', 'mousedown', 'keydown'].forEach(ev => 
                    document.removeEventListener(ev, handleInteraction)
                );
            };

            ['click', 'scroll', 'touchstart', 'mousedown', 'keydown'].forEach(ev => 
                document.addEventListener(ev, handleInteraction, { passive: true })
            );
        });
    };

    // Handle end of audio with a 3.5s pause
    anthem.addEventListener('ended', function() {
        setTimeout(() => {
            this.currentTime = 0;
            this.play().then(() => {
                fadeIn(targetVolume, fadeDuration);
            });
        }, pauseBetweenLoops);
    });

    // Professional Loop Transition (Fade out near end)
    anthem.addEventListener('timeupdate', function() {
        const buffer = 2; // Start fade out 2 seconds before end
        if (this.duration && (this.duration - this.currentTime) < buffer && !isFadingOut && !this.ended) {
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
            const destination = link.href;
            e.preventDefault();
            fadeOut(0.8, () => {
                window.location.href = destination;
            });
        }
    });

    // Launch based on page state
    if (document.readyState === 'complete') {
        tryPlay();
    } else {
        window.addEventListener('load', tryPlay);
    }
})();
