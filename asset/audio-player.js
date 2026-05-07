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
        audioBtn.id = 'audio-control';
        audioBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        audioBtn.setAttribute('title', 'Play Anthem');
        document.body.appendChild(audioBtn);

        let isPlaying = false;

        audioBtn.addEventListener('click', () => {
            if (!isPlaying) {
                // Play
                isPlaying = true;
                audioBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
                audioBtn.setAttribute('title', 'Mute Anthem');
                audioBtn.classList.add('playing');
                
                anthem.play().then(() => {
                    fadeIn(anthem, targetVolume, fadeDuration);
                }).catch(err => {
                    console.error("Audio playback failed:", err);
                    isPlaying = false;
                    audioBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
                    audioBtn.classList.remove('playing');
                });
            } else {
                // Mute/Pause
                isPlaying = false;
                audioBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
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
