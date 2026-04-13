/**
 * Background Audio Player (St. Bernadine Anthem)
 * St. Bernadine Official Website
 */

(function() {
    // Audio Settings
    // Relative path is most stable for subdirectory hosting (GitHub Pages / Hostinger)
    const audioSrc = 'asset/audio/st._bernadines_anthem.mp3';
    const targetVolume = 0.3; 
    const fadeDuration = 2; 
    const pauseBetweenLoops = 3500; 
    
    // Audio element setup
    const anthem = new Audio(audioSrc);
    anthem.loop = false;
    anthem.preload = 'auto';
    
    // Web Audio API state
    let audioCtx = null;
    let gainNode = null;
    let source = null;
    let isInitialized = false;
    let useWebAudio = true; 
    let isFadingOut = false;

    /**
     * Initializes the Web Audio graph. 
     * IMPORTANT: Must be called within a user interaction context for mobile.
     */
    const initAudio = () => {
        if (isInitialized && gainNode) return true;
        
        try {
            console.log("Initializing Web Audio Processing...");
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            // IMPORTANT: Ensure the audio element has full volume source signal 
            // before routing it through the gain node (for mobile compatibility).
            anthem.volume = 1.0;

            gainNode = audioCtx.createGain();
            
            if (!source) {
                source = audioCtx.createMediaElementSource(anthem);
            }
            
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Set volume to 0 initially for the fade in
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            
            isInitialized = true;
            useWebAudio = true;
            return true;
        } catch (e) {
            console.warn("Web Audio Routing Failed. Falling back to standard hardware output.", e);
            useWebAudio = false;
            isInitialized = true; 
            return false;
        }
    };
    
    let isFadingOut = false;

    /**
     * Smoothly increases volume to target
     */
    const fadeIn = (target, duration) => {
        if (isFadingOut) return;
        
        if (useWebAudio && gainNode) {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const now = audioCtx.currentTime;
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.linearRampToValueAtTime(target, now + duration);
        } else {
            // Standard Fallback Fade In
            let currentVol = anthem.volume;
            const interval = 50;
            const steps = (duration * 1000) / interval;
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
    const fadeOut = (duration, callback) => {
        isFadingOut = true;

        if (useWebAudio && gainNode) {
            const now = audioCtx.currentTime;
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);
            
            setTimeout(() => {
                if (callback) callback();
                isFadingOut = false;
            }, duration * 1000);
        } else {
            // Standard Fallback Fade Out
            let currentVol = anthem.volume;
            const interval = 50;
            const steps = (duration * 1000) / interval;
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
            initAudio(); 
            fadeIn(targetVolume, fadeDuration);
        }).catch(() => {
            const forceStart = () => {
                // 1. Play BEFORE connecting (Safari Mobile fix)
                anthem.play().then(() => {
                    // 2. Connect the volume cap AFTER the stream is active
                    initAudio();
                    fadeIn(targetVolume, fadeDuration);
                }).catch(e => {
                    // Final fallback: keep playing even if volume cap fails
                    console.warn("Playback stream active, volume routing failed.", e);
                    anthem.volume = targetVolume;
                });

                ['click', 'scroll', 'touchstart', 'mousedown', 'keydown'].forEach(ev => 
                    document.removeEventListener(ev, forceStart)
                );
            };

            ['click', 'scroll', 'touchstart', 'mousedown', 'keydown'].forEach(ev => 
                document.addEventListener(ev, forceStart, { passive: true })
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
