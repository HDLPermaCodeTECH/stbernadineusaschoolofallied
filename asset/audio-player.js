/**
 * Background Audio Player (St. Bernadine Anthem)
 * St. Bernadine Official Website
 */

(function() {
    const audioSrc = 'asset/audio/st._bernadines_anthem.mp3';
    const audioVolume = 0.5;
    
    // Create audio element
    const anthem = new Audio(audioSrc);
    anthem.loop = true;
    anthem.volume = audioVolume;
    
    const tryPlay = () => {
        anthem.play().catch(err => {
            // Autoplay is likely blocked by the browser. 
            // We'll wait for the first click/touch to start the music.
            const startOnInteraction = () => {
                anthem.play();
                document.removeEventListener('click', startOnInteraction);
                document.removeEventListener('scroll', startOnInteraction);
                document.removeEventListener('touchstart', startOnInteraction);
            };
            
            document.addEventListener('click', startOnInteraction);
            document.addEventListener('scroll', startOnInteraction);
            document.addEventListener('touchstart', startOnInteraction);
        });
    };

    // Attempt playback when the page is ready
    if (document.readyState === 'complete') {
        tryPlay();
    } else {
        window.addEventListener('load', tryPlay);
    }
})();
