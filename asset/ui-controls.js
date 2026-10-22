'use strict';

// Bind controls without inline event attributes, which the site's CSP blocks.
document.addEventListener('click', event => {
    const control = event.target.closest('[data-print], [data-job-position], [data-remove-file], [data-start-video]');
    if (!control) return;
    if (control.hasAttribute('data-print')) window.print();
    else if (control.hasAttribute('data-job-position')) selectJob(control.dataset.jobPosition);
    else if (control.hasAttribute('data-remove-file')) removeFile(Number(control.dataset.removeFile));
    else if (control.hasAttribute('data-start-video')) startVideo();
});

document.addEventListener('change', event => {
    const control = event.target;
    if (control.matches('input[name="AppMethod"]')) toggleFormSections();
    if (control.hasAttribute('data-referrer-source')) {
        document.getElementById('referrerOther').style.display = control.value === 'Others' ? 'block' : 'none';
    }
});
