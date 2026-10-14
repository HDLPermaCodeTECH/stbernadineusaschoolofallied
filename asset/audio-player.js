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

    // Create audio button element if it doesn't already exist
    const createAudioButton = () => {
        if (document.getElementById('audio-control')) return;

        const audioBtn = document.createElement('button');
        const mutedIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m11 5-6 4H2v6h3l6 4V5ZM17 9l5 6M22 9l-5 6"/></svg>';
        const playingIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m11 5-6 4H2v6h3l6 4V5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg>';
        audioBtn.id = 'audio-control';
        audioBtn.innerHTML = mutedIcon;
        audioBtn.setAttribute('aria-label', 'Play Anthem');
        audioBtn.setAttribute('aria-pressed', 'false');
        audioBtn.setAttribute('title', 'Play Anthem');
        document.body.appendChild(audioBtn);

        let isPlaying = false;

        audioBtn.addEventListener('click', () => {
            if (!isPlaying) {
                // Play
                isPlaying = true;
                audioBtn.innerHTML = playingIcon;
                audioBtn.setAttribute('aria-label', 'Mute Anthem');
                audioBtn.setAttribute('aria-pressed', 'true');
                audioBtn.setAttribute('title', 'Mute Anthem');
                audioBtn.classList.add('playing');
                
                anthem.play().then(() => {
                    fadeIn(anthem, targetVolume, fadeDuration);
                }).catch(err => {
                    console.error("Audio playback failed:", err);
                    isPlaying = false;
                    audioBtn.innerHTML = mutedIcon;
                    audioBtn.setAttribute('title', 'Play Anthem');
                    audioBtn.setAttribute('aria-label', 'Play Anthem');
                    audioBtn.setAttribute('aria-pressed', 'false');
                    audioBtn.classList.remove('playing');
                });
            } else {
                // Mute/Pause
                isPlaying = false;
                audioBtn.innerHTML = mutedIcon;
                audioBtn.setAttribute('aria-label', 'Play Anthem');
                audioBtn.setAttribute('aria-pressed', 'false');
                audioBtn.setAttribute('title', 'Play Anthem');
                audioBtn.classList.remove('playing');
                
                fadeOut(anthem, 1000, () => {
                    anthem.pause();
                });
            }
        });
    };

    // Initialize button on load
    if (document.readyState === 'complete') {
        createAudioButton();
    } else {
        window.addEventListener('load', createAudioButton);
    }
})();
