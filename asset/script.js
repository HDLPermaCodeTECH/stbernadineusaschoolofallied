
document.addEventListener('DOMContentLoaded', () => {
    // --- FRONTEND SECURITY LAYER ---
    // 1. Disable Right-Click
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // 2. Disable Common Inspect Shortcuts
    document.addEventListener('keydown', (e) => {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
        if (
            e.keyCode === 123 || 
            (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || 
            (e.ctrlKey && e.keyCode === 85) || 
            (e.ctrlKey && e.keyCode === 83)
        ) {
            e.preventDefault();
            return false;
        }
    });

    // 3. Disable Text Selection (Optional - Best Effort)
    document.addEventListener('selectstart', (e) => e.preventDefault());

    // 4. Console Security Warning
    console.log("%cSTOP!", "color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px black;");
    console.log("%cThis is a browser feature intended for developers. Attempting to copy or replicate this site without permission is strictly prohibited.", "color: #055923; font-size: 18px; font-weight: bold;");
    console.log("%cSt. Bernadine School of Allied Health - Official Security layer active.", "color: #555; font-size: 12px;");

    // Flag body as JS-loaded for safe animations
    document.body.classList.add('js-loaded');
    document.querySelectorAll('#contact-form, #homeCareInquiryForm, #request-care-form, #jobApplicationForm, #application-form, #referral-form').forEach(form => {
        if (form.parentElement?.tagName === 'DIV') form.parentElement.classList.add('stb-form-card');
    });

    // --- Mobile Navigation ---
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.classList.add('mobile-menu-btn');
    mobileMenuBtn.innerHTML = '<span></span><span></span><span></span>';
    mobileMenuBtn.setAttribute('aria-label', 'Toggle navigation');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileMenuBtn.setAttribute('aria-controls', 'primary-navigation');
    document.querySelector('.navbar').appendChild(mobileMenuBtn);

    // Create overlay
    const navOverlay = document.createElement('div');
    navOverlay.classList.add('nav-overlay');
    document.body.appendChild(navOverlay);

    const navLinks = document.querySelector('.nav-links');
    navLinks.id = 'primary-navigation';
    const mobileViewport = window.matchMedia('(max-width: 1200px)');
    const navigationSlot = document.createComment('Desktop navigation position');
    navLinks.before(navigationSlot);
    const menuHeading = document.createElement('div');
    menuHeading.className = 'nav-menu-heading';
    menuHeading.innerHTML = '<div><strong>St. Bernadine</strong><small>Healthcare. Education. Opportunity.</small></div><button type="button" class="nav-menu-close" aria-label="Close navigation"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>';
    navLinks.prepend(menuHeading);
    function mountNavigation() {
        // A drawer outside the blurred header stays fixed to the viewport.
        if (mobileViewport.matches) document.body.appendChild(navLinks);
        else navigationSlot.after(navLinks);
    }
    mountNavigation();

    function setMobileMenu(isOpen) {
        navLinks.classList.toggle('active', isOpen);
        navOverlay.classList.toggle('active', isOpen);
        mobileMenuBtn.classList.toggle('active', isOpen);
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('nav-open', isOpen);
        navLinks.inert = mobileViewport.matches && !isOpen;
        document.documentElement.style.overflow = isOpen ? 'hidden' : '';
        document.body.style.overflow = '';
        if (isOpen) menuHeading.querySelector('button').focus();
        if (isOpen) {
            const pinnedHeader = document.querySelector('header');
            pinnedHeader.classList.remove('stb-header-hidden');
            pinnedHeader.inert = false;
        }
    }

    function toggleMobileMenu() {
        setMobileMenu(!navLinks.classList.contains('active'));
    }
    setMobileMenu(false);
    mobileViewport.addEventListener('change', () => { mountNavigation(); setMobileMenu(false); });
    menuHeading.querySelector('button').addEventListener('click', () => { setMobileMenu(false); mobileMenuBtn.focus(); });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navLinks.classList.contains('active')) {
            setMobileMenu(false);
            mobileMenuBtn.focus();
        }
        if (event.key === 'Tab' && navLinks.classList.contains('active')) {
            const links = [...navLinks.querySelectorAll('a[href], button:not([disabled])')];
            const first = links[0];
            const last = links[links.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                mobileMenuBtn.focus();
            } else if (event.shiftKey && document.activeElement === mobileMenuBtn) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === mobileMenuBtn) {
                event.preventDefault();
                first.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                mobileMenuBtn.focus();
            }
        }
    });

    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    navOverlay.addEventListener('click', toggleMobileMenu);

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });


    // --- Active Navigation Highlight ---
    function highlightActiveLink() {
        const normalizeUrl = (url) => {
            let u = url.split('#')[0].split('?')[0];
            if (u.endsWith('/')) u += 'index.html';
            return u;
        };

        const currentUrl = normalizeUrl(window.location.href);
        const navLinks = document.querySelectorAll('.nav-links a');

        // First remove all hardcoded active classes
        navLinks.forEach(link => link.classList.remove('active'));

        navLinks.forEach(link => {
            if (!link.href) return;
            const linkUrl = normalizeUrl(link.href);
            if (currentUrl === linkUrl) {
                link.classList.add('active');
            }
        });
    }
    highlightActiveLink();

    // --- AI Chatbot ---
    const chatbotHTML = `
        <div class="chatbot-container" id="chatbot-panel" role="dialog" aria-label="St. Bernadine AI assistant" inert>
            <div class="chat-header">
                <div class="chat-identity">
                    <img class="chat-avatar" src="/asset/images/st-bernadine-email-logo-20261026.png" alt="" width="46" height="46">
                    <div><span class="chat-title">St. Bernadine</span><span class="chat-subtitle">AI website assistant · Here to help you explore</span></div>
                </div>
                <button id="close-chat" aria-label="Close chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="message bot">
                    Welcome to St. Bernadine! I can help you find a program, explore care services, or reach the right team. Where would you like to start?
                </div>
            </div>
            <div class="chat-input local-theme-input">
                <input type="text" id="user-input" maxlength="2000" placeholder="Type your question..." aria-label="Your question">
                <button id="send-btn" aria-label="Send question"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/></svg></button>
            </div>
        </div>
        <button class="chat-toggle-btn" aria-label="Open chat" aria-expanded="false" aria-controls="chatbot-panel">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/></svg>
        </button>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    const chatToggleBtn = document.querySelector('.chat-toggle-btn');
    const chatbotContainer = document.querySelector('.chatbot-container');
    const closeChatBtn = document.getElementById('close-chat');
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');

    // Toggle Chat Window
    function toggleChat() {
        chatbotContainer.classList.toggle('active');
        const isActive = chatbotContainer.classList.contains('active');
        chatbotContainer.inert = !isActive;
        chatToggleBtn.setAttribute('aria-expanded', String(isActive));
        document.body.classList.toggle('chat-open', isActive);

        // Hide toggle button when chat is active to prevent overlap/interaction issues
        if (isActive) {
            chatToggleBtn.style.opacity = '0';
            chatToggleBtn.style.pointerEvents = 'none';
        } else {
            chatToggleBtn.style.opacity = '1';
            chatToggleBtn.style.pointerEvents = 'all';
            chatToggleBtn.focus();
        }

        if (isActive) {
            setTimeout(() => userInput.focus(), 300);
            if (!chatInitialized) {
                showInitialMessage();
            }
        }
    }

    chatToggleBtn.addEventListener('click', toggleChat);
    closeChatBtn.addEventListener('click', toggleChat);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && chatbotContainer.classList.contains('active')) toggleChat();
    });

    let chatInitialized = false;
    let chatBusy = false;

    function showInitialMessage() {
        chatInitialized = true;
        chatMessages.innerHTML = '';
        addMessage("Welcome to St. Bernadine! I can help you find a program, explore care services, or reach the right team. Where would you like to start?", 'bot');
        showSuggestions();
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message || chatBusy) return;
        userInput.value = '';
        chatBusy = true;
        sendBtn.disabled = true;
        chatbotContainer.setAttribute('aria-busy', 'true');
        const existing = document.querySelector('.chat-suggestions');
        if (existing) existing.remove();
        addMessage(message, 'user');
        showTypingIndicator();
        try {
            const response = await getBotResponse(message);
            removeTypingIndicator();
            addMessage(response, 'bot');
        } catch (_) {
            removeTypingIndicator();
            addMessage("I'm having trouble connecting right now. Please try again, choose a quick topic, or contact our team.", 'bot');
        } finally {
            chatBusy = false;
            sendBtn.disabled = false;
            chatbotContainer.setAttribute('aria-busy', 'false');
            showSuggestions();
        }
    }

    function handleSuggestion(text) {
        if (chatBusy) return;
        userInput.value = text;
        return sendMessage();
    }

    function showSuggestions() {
        // Clear existing suggestions
        const existing = document.querySelector('.chat-suggestions');
        if (existing) existing.remove();

        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.classList.add('chat-suggestions');

        const topics = [
            { label: 'Apply Now', query: 'application' },
            { label: 'Request Care', query: 'request care' },
            { label: 'Programs', query: 'programs' },
            { label: 'Tuition', query: 'tuition' },
            { label: 'Student Life', query: 'student_life' },
            { label: 'Visa Sponsorship', query: 'visa' },
            { label: 'Our Founder', query: 'founder' },
            { label: 'Location', query: 'location' },
            { label: 'Referral', query: 'referral' }
        ];

        topics.forEach(topic => {
            const btn = document.createElement('button');
            btn.classList.add('suggestion-btn');
            btn.innerText = topic.label;
            btn.onclick = () => handleSuggestion(topic.query);
            suggestionsDiv.appendChild(btn);
        });

        chatMessages.parentNode.insertBefore(suggestionsDiv, chatMessages.nextSibling);
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Treat both provider and visitor text as untrusted. Keep only simple formatting
    // and safe links; strip active elements, inline handlers and unsafe URL schemes.
    function safeChatContent(html) {
        const template = document.createElement('template');
        template.innerHTML = String(html);
        const clean = document.createDocumentFragment();
        const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'BR', 'P', 'UL', 'OL', 'LI', 'A']);
        function copy(node, parent) {
            if (node.nodeType === Node.TEXT_NODE) { parent.appendChild(document.createTextNode(node.textContent)); return; }
            if (node.nodeType !== Node.ELEMENT_NODE || ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG', 'MATH'].includes(node.tagName)) return;
            const target = allowed.has(node.tagName) ? document.createElement(node.tagName.toLowerCase()) : parent;
            if (target !== parent && node.tagName === 'A') {
                try {
                    const url = new URL(node.getAttribute('href') || '', location.origin + '/');
                    if (['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)) {
                        target.setAttribute('href', url.href);
                        target.setAttribute('target', '_blank');
                        target.setAttribute('rel', 'noopener noreferrer');
                    }
                } catch (_) { /* Malformed links remain readable text. */ }
            }
            if (target !== parent) parent.appendChild(target);
            for (const child of node.childNodes) copy(child, target);
        }
        for (const node of template.content.childNodes) copy(node, clean);
        return clean;
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        if (sender === 'bot') {
            messageDiv.innerHTML = '<strong>St. Bernadine assistant</strong><br>';
            messageDiv.appendChild(safeChatContent(text));
        } else {
            messageDiv.textContent = text;
        }
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.classList.add('message', 'bot', 'typing');
        indicator.innerHTML = '<span>.</span><span>.</span><span>.</span>';
        chatMessages.appendChild(indicator);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    // AI Knowledge Base
    const schoolKnowledge = {
        // --- Programs ---
        programs_list: {
            keywords: ['programs', 'courses', 'classes', 'list', 'offer', 'training', 'certification'],
            response: "We offer flexible schedules (Day, Evening, & Weekend). Click for details:<br><br>📚 <a href='cna-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CNA</a> (Day & Evening)<br>🏠 <a href='ch-hha-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CH-HHA</a> (Weekdays & Weekends)<br>💊 <a href='cma-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CMA</a> (56 Hours)<br>🏥 <a href='pct-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>PCT</a> (5 Months)<br>🥼 <a href='medical-assistant-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Medical Assistant</a> (5 Months)<br>🩸 <a href='ekg-phlebotomy-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>EKG & Phlebotomy</a> (Day & Weekend)<br>❤️ <a href='cpr-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CPR & BLS</a> (1 Day)<br>👶 <a href='newborn-care-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Newborn Care</a> (Weekend Workshop)"
        },
        cna: {
            keywords: ['cna', 'certified nurse aide', 'nursing assistant', 'nurse aide', '90 hours'],
            response: "Our <strong>Certified Nurse Aide (CNA)</strong> program is a 90-hour course (50 classroom / 40 clinicals).<br><br><strong>Schedule:</strong> Day & Evening classes available.<br><br><strong>Registration Fee:</strong> $500 ($200 non-refundable).<br><br><strong>Outcome:</strong> NJ State Licensure.<br><br>👉 <a href='cna-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>View CNA Details</strong></a>"
        },
        hha: {
            keywords: ['hha', 'home health aide', 'homemaker', '76 hours', 'ch-hha'],
            response: "Our <strong>Certified Homemaker Home Health Aide (CH-HHA)</strong> program is 76 hours (60 classroom / 16 skills).<br><br><strong>Schedule:</strong> Weekdays & Weekends available.<br><br><strong>Registration Fee:</strong> $200 ($200 non-refundable).<br><br><strong>Outcome:</strong> NJ Board of Nursing Certification.<br><br>👉 <a href='ch-hha-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>View CH-HHA Details</strong></a>"
        },
        cma: {
            keywords: ['cma', 'certified medication aide', 'medication', 'med aide', '56 hours'],
            response: "The <strong>Certified Medication Aide (CMA)</strong> course is 56 hours.<br><br><strong>Schedule:</strong> Flexible clinical hours.<br><br><strong>Prerequisite:</strong> Must have CNA or CH-HHA license.<br><br><strong>Registration Fee:</strong> $200.<br><br>👉 <a href='cma-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>View CMA Details</strong></a>"
        },
        pct: {
            keywords: ['pct', 'patient care technician', '220 hours', '5 months'],
            response: "Our <strong>Patient Care Technician (PCT)</strong> program is 220 hours (5 months).<br><br><strong>Schedule:</strong> Contact for next intake.<br><br><strong>Registration Fee:</strong> $500.<br><br><strong>Outcome:</strong> Advanced clinical skills.<br><br>👉 <a href='pct-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>View PCT Details</strong></a>"
        },
        ma: {
            keywords: ['medical assistant', 'ma program', '620 hours', 'admin', 'clinical assistant'],
            response: "Our <strong>Certified Medical Assistant</strong> program is 620 hours (5 months).<br><br><strong>Schedule:</strong> Intensive training + Externship.<br><br><strong>Registration Fee:</strong> $500.<br><br><strong>Focus:</strong> Clinical and administrative training.<br><br>👉 <a href='medical-assistant-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>View Medical Assistant Details</strong></a>"
        },
        ekg_phlebotomy: {
            keywords: ['ekg', 'phlebotomy', 'blood draw', 'heart monitor', '140 hours'],
            response: "The <strong>EKG & Phlebotomy</strong> program is 140 hours.<br><br><strong>Schedule:</strong> Day or Weekend classes.<br><br><strong>Reservation Fee:</strong> $200 (non-refundable).<br><br><strong>Outcome:</strong> Technical Proficiency Certificate.<br><br>👉 <a href='ekg-phlebotomy-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>View EKG/Phlebotomy Details</strong></a>"
        },
        cpr: {
            keywords: ['cpr', 'bls', 'basic life support', 'heart, association', 'first aid', 'resuscitation'],
            response: "We offer <strong>CPR & BLS</strong> certification through the American Heart Association.<br><br><strong>Duration:</strong> 5 hours.<br><br><strong>Schedule:</strong> Weekdays/Weekends (10am - 3pm).<br><br><strong>Fee:</strong> Inclusive of book.<br><br>👉 <a href='cpr-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>View CPR Details</strong></a>"
        },
        newborn: {
            keywords: ['newborn', 'baby nursing', 'infant care', 'neonatal', '10 hours', 'baby nurse'],
            response: "Our <strong>Newborn Care Specialist (Baby Nursing)</strong> workshop is 10 hours.<br><br><strong>Schedule:</strong> Weekends (10am - 3pm).<br><br><strong>Registration Fee:</strong> $200 (non-refundable).<br><br>👉 <a href='newborn-care-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>View Newborn Care Details</strong></a>"
        },

        // --- Tuition & Fees ---
        tuition: {
            keywords: ['tuition', 'cost', 'price', 'payment plan', 'fee', 'financial'],
            response: "We offer <strong>interest-free weekly or bi-weekly payment plans</strong>.<br><br><strong>Registration Fees:</strong><br>- CNA/PCT/MA: $500<br>- CH-HHA/CMA/Newborn: $200<br>- EKG/Phlebotomy/CPR: $200<br><br>Note: Reservation fees are non-refundable but consumable.<br><br>📝 <a href='tuition.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>View Tuition Schedule</strong></a>"
        },
        refund_policy: {
            keywords: ['refund', 'money back', 'cancellation', 'withdraw', 'non-refundable'],
            response: "<strong>Reservation fees are strictly non-refundable</strong> but are consumable for the next session of your chosen program if you need to reschedule.<br><br>Please check our enrollment agreement for the full refund policy regarding tuition."
        },

        // --- Admissions & Forms ---
        requirements: {
            keywords: ['enroll', 'document', 'paperwork', 'prerequisite', 'admission', 'qualify'],
            response: "General requirements include:<br>- High School Diploma/GED (for most programs)<br>- State ID / Driver's License<br>- Social Security Card<br>- Medical Clearance (PPD/Physical)<br><br>📍 <a href='apply.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>Start Online Application</strong></a><br><br>📝 <a href='forms.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>Download Forms</strong></a>"
        },
        forms: {
            keywords: ['form', 'download', 'pdf', 'application', 'catalog', 'physical form'],
            response: "You can download important documents from our Forms page:<br><br>📝 <a href='forms.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Enrollment Application</a><br><br>🥼 <a href='forms.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Medical Physical Form</a><br><br>📖 <a href='forms.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Course Catalog</a>"
        },

        // --- Placement & Global Services ---
        placement_process: {
            keywords: ['placement', 'process', 'steps', 'hiring', 'recruitment', 'screen'],
            response: "Our <strong>Global Placement Process</strong> has 5 steps:<br>1️⃣ <strong>Document Screening:</strong> Submit resume & credentials.<br>2️⃣ <strong>Legal Review:</strong> Attorney verifies qualifications.<br>3️⃣ <strong>Visa Petition:</strong> Filing with DOL & DHS.<br>4️⃣ <strong>Green Card:</strong> Adjustment of status or consular processing.<br>5️⃣ <strong>Onboarding:</strong> Arrival & orientation.<br><br>We charge <strong>NO Placement Fees</strong> for direct hires!"
        },
        visa: {
            keywords: ['visa', 'sponsorship', 'green card', 'eb3', 'immigration', 'global', 'international', 'abroad', 'petition', 'usa'],
            response: "We specialize in <strong>EB-3 Visa & Green Card Sponsorship</strong> for:<br>- Registered Nurses (RNs)<br>- Physical/Occupational Therapists<br>- Medical Technologists<br>- Nursing Assistants<br><br>We provide legal support and settlement assistance. <a href='placement.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Start Your Journey</a>."
        },

        // --- About & History ---
        history: {
            keywords: ['history', 'founded', 'begin', 'start', '1986', 'background'],
            response: "St. Bernadine was founded in <strong>1986</strong> by <strong>Bernadine 'Belen' Samin, R.N.</strong>.<br><br>It started with a vision to provide quality healthcare training in Jersey City. In the 2000s, we expanded to include allied health programs and international recruitment. Today, we are a global leader in healthcare education and placement."
        },
        values: {
            keywords: ['value', 'mission', 'vision', 'motto', 'stand for', 'belief'],
            response: "Our Core Values guide us:<br>❤️ <strong>Compassion:</strong> Kindness and empathy.<br>🏆 <strong>Excellence:</strong> Highest standards in training.<br>🤝 <strong>Integrity:</strong> Honesty and transparency.<br>🌍 <strong>Global Impact:</strong> Empowering professionals worldwide."
        },
        founder: {
            keywords: ['founder', 'belen', 'samin', 'owner', 'started'],
            response: "Our Founder, <strong>Bernadine 'Belen' Samin, R.N.</strong>, has over 40 years of nursing experience (ER, ICU, Neonatal).<br><br>From humble beginnings in the Philippines, she built St. Bernadine to share opportunities with others. <a href='about-us/' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Read her full story</a>."
        },
        leadership: {
            keywords: ['leadership', 'louie', 'administrator', 'co-founder'],
            response: "<strong>Louie Samin</strong> is our Co-Founder and Administrator.<br><br>With a B.S. in Finance/Economics from UC Berkeley and 40+ years of global operations experience, he oversees corporate functions and international student placement."
        },
        faculty: {
            keywords: ['faculty', 'teachers', 'instructors', 'staff', 'professors'],
            response: "Our expert faculty includes:<br>- <strong>Nenita Pawid, RN:</strong> 40+ years exp.<br>- <strong>Felicia Miller:</strong> 40+ years exp.<br>- <strong>Cecilia Domingo, RN:</strong> 40+ years exp.<br>- <strong>Aurea Cielito G. Batchar, RN:</strong> 33 years exp.<br><br>They bring decades of real-world clinical experience to the classroom."
        },
        partners: {
            keywords: ['partner', 'affiliate', 'accredit', 'approve', 'board', 'recognition'],
            response: "We are accredited and approved by:<br>✅ NJ Department of Education<br>✅ NJ Board of Nursing<br>✅ NJ Department of Health<br>✅ American Heart Association (AHA)<br>✅ AMCA (American Medical Certification Association)"
        },

        // --- Care Services ---
        request_care: {
            keywords: ['request care', 'home care', 'need caregiver', 'nursing care', 'health aide services', 'private duty'],
            response: "We provide 24/7 Professional Home Care Services tailored to your needs.<br><br><strong>Our Services:</strong><br>- Companion Care<br>- Personal Care Assistance<br>- Skilled Nursing Care<br>- Respite Care<br><br>👉 <a href='request-care.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>Submit a Care Request</strong></a>"
        },

        // --- General ---
        location: {
            keywords: ['location', 'address', 'map', 'directions', 'jersey city', 'office'],
            response: "We are located at <strong>591 Summit Avenue, Suite 410, Jersey City, NJ 07306</strong>.<br><br><strong>Hours:</strong> Tue-Sat 9am-5pm.<br><br><iframe src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.738080068307!2d-74.0620888!3d40.7275!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c250ca533f810b%3A0xc3f8e5c54e0aeb29!2s591%20Summit%20Ave%20Suite%20410%2C%20Jersey%20City%2C%20NJ%2007306!5e0!3m2!1sen!2sus!4v1707577800000!5m2!1sen!2sus' width='100%' height='200' style='border:0; border-radius: 8px; margin-top: 10px;' allowfullscreen='' loading='lazy' referrerpolicy='no-referrer-when-downgrade'></iframe>"
        },
        contact: {
            keywords: ['contact', 'phone', 'call', 'email', 'number'],
            response: "📞 <strong>Phone:</strong> (201) 222-1116<br><br>📧 <strong>Email:</strong> school@stbernadineusa.com<br><br>📍 <strong>Visit:</strong> 591 Summit Ave, Jersey City.<br><br>We are here to help!"
        },
        referral: {
            keywords: ['referral', 'refer', 'recommend', 'friend', 'bonus', 'commission'],
            response: "Refer a friend and earn rewards! We offer a <strong>Referral Program</strong> for our courses.<br><br>If you know someone interested in healthcare training, refer them to us!<br><br><a href='referral.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Submit a Referral</a>."
        },
        application: {
            keywords: ['application', 'apply', 'register', 'enroll', 'sign up', 'start', 'join'],
            response: "Ready to start? 🎓<br><br>💼 <a href='apply-job.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>Job Application</strong></a><br>📝 <a href='apply.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>Enrollment Application</strong></a><br>🥼 <a href='forms.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>Medical Physical Form</strong></a><br>📖 <a href='forms.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>Course Catalog</strong></a><br><br>It only takes a few minutes!"
        },
        student_life: {
            keywords: ['student', 'life', 'career', 'advice', 'skills', 'news', 'blog', 'events'],
            response: "Explore our Student Resources:<br><br>🎓 <a href='student-life.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Student Life</a><br>💼 <a href='career-advice.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Career Advice</a><br>🥼 <a href='clinical-skills.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Clinical Skills</a><br>📰 <a href='agency-news.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Agency News</a>"
        },
        developer: {
            keywords: ['developer', 'creator', 'troy', 'hebrey', 'llagas', 'who made', 'who built', 'designed by'],
            response: "This website and AI were architected and built by <strong>Hebrey Dill P. Llagas (Troy)</strong>.<br><br><strong>Role:</strong> Lead Full-Stack Web Developer, UI/UX Designer & AI Specialist.<br><strong>Expertise:</strong> He builds high-end websites, Financial Support Systems, POS SaaS (Point of Sale Software as a Service), and various custom web applications.<br><strong>Portfolio:</strong> <a href='https://hdlpermacodetech.com' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>hdlpermacodetech.com</a><br><br>He specializes in creating premium, AI-integrated web apps and is highly recommended for tech projects!"
        }
    };

    async function getBotResponse(input) {
        const lowerInput = input.toLowerCase();

        // 1. Check for Greetings locally (faster/cheaper)
        if (lowerInput.match(/\b(hi|hello|hey|greetings|good morning|good afternoon)\b/)) {
            return "Hello! I can help you with <strong>Professional Services</strong> (<a href='placement.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>Global Placement</strong></a> & <strong>Home Care</strong>) or our <strong>Allied Health Programs</strong> (CNA, HHA, etc.). What would you like to know?";
        }

        // 2. PRIORITY: Check Local Knowledge Base First (Instant & Accurate)
        // This fixes "slow response" and "hallucinated links"
        for (const key in schoolKnowledge) {
            if (schoolKnowledge[key].keywords.some(word => lowerInput.includes(word))) {
                console.log(`Matched local knowledge: ${key}`);
                return schoolKnowledge[key].response;
            }
        }

        // School information stays available even when the external AI is unavailable.
        const fallback = "Advanced AI answers are temporarily unavailable. I can still help with <strong>programs, tuition, location, placement and care services</strong> using our website information.<br><br>For other questions, <a href='/contact'>contact our team</a>.";
        if (input.length > 2000) return 'Please keep your question to 2,000 characters or fewer.';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input }),
                signal: controller.signal
            });
            if (response.ok) {
                const data = await response.json();
                return typeof data.response === 'string' && data.response.trim() ? data.response : fallback;
            }
            if (response.status === 429) {
                return 'Advanced AI answers are busy right now. Please try again later. You can still use the quick topics below or <a href="/contact">contact our team</a>.';
            }
            return fallback;
        } catch (_) {
            return fallback;
        } finally {
            clearTimeout(timeout);
        }
    }


    // --- Hero Slider ---
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (slides.length > 0 && !reducedMotion) {
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 5000); // Change slide every 5 seconds
    }

    // --- Stats Counter Animation ---
    const counters = document.querySelectorAll('.counter');

    if (counters.length > 0) {
        const animateCounter = (counter) => {
            const target = parseFloat(counter.getAttribute('data-target'));
            if (reducedMotion) {
                counter.innerText = target;
                return;
            }
            const duration = 2000;
            let start = 0;
            const increment = target / (duration / 16);

            const updateCount = () => {
                start += increment;
                if (start < target) {
                    counter.innerText = Math.ceil(start);
                    requestAnimationFrame(updateCount);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        };

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        counters.forEach(counter => counterObserver.observe(counter));
    }

    // --- FAQ Accordion ---
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // --- Direction-aware header: read downward, navigate upward. ---
    const header = document.querySelector('header');
    if (header) {
        let previousY = Math.max(0, window.scrollY);
        let travel = 0;
        let direction = 0;
        let scheduled = false;
        const revealHeader = () => {
            header.classList.remove('stb-header-hidden');
            header.inert = false;
        };
        const updateHeader = () => {
            scheduled = false;
            const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const y = Math.min(limit, Math.max(0, window.scrollY));
            const delta = y - previousY;
            previousY = y;
            header.classList.toggle('scrolled', y > 50);
            const keyboardFocus = header.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
            if (y < 50 || document.body.classList.contains('nav-open') || keyboardFocus) {
                revealHeader(); travel = 0; direction = 0; return;
            }
            if (!delta) return;
            const nextDirection = Math.sign(delta);
            travel = nextDirection === direction ? travel + Math.abs(delta) : Math.abs(delta);
            direction = nextDirection;
            if (travel < 12) return;
            const hidden = direction > 0 && y > header.offsetHeight + 80;
            header.classList.toggle('stb-header-hidden', hidden);
            header.inert = hidden;
            travel = 0;
        };
        window.addEventListener('scroll', () => {
            if (!scheduled) { scheduled = true; requestAnimationFrame(updateHeader); }
        }, { passive: true });
        document.addEventListener('keydown', event => { if (event.key === 'Tab') revealHeader(); });
        header.addEventListener('focusin', revealHeader);
        window.addEventListener('pageshow', () => { previousY = Math.max(0, window.scrollY); revealHeader(); });
    }

    // --- Scroll Reveal Animations ---
    const fadeElements = document.querySelectorAll('.fade-in-up, .reveal-image-left, .reveal-image-right, .reveal-scale');
    if (fadeElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        fadeElements.forEach(el => revealObserver.observe(el));
    }
    // Submit newsletter requests to the school office instead of reloading the page.
    document.querySelectorAll('.footer-subscribe-form').forEach(form => {
        const input = form.querySelector('input[type="email"]');
        const button = form.querySelector('button[type="submit"]');
        if (!input || !button) return;
        input.setAttribute('aria-label', 'Email address for school updates');
        const status = document.createElement('p');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        form.insertAdjacentElement('afterend', status);
        form.addEventListener('submit', async event => {
            event.preventDefault();
            const original = button.textContent;
            button.disabled = true;
            button.textContent = 'Sending...';
            status.textContent = '';
            try {
                const protection = await window.StbFormProtection.prepare(form);
                const response = await fetch('/subscribe', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: input.value, source_page: location.pathname, ...protection })
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok || typeof result.message !== 'string') throw new Error(result.error || 'Unable to send your request. Please try again later.');
                status.textContent = result.message;
                form.reset();
            } catch (error) {
                status.textContent = error.message || 'Unable to send your request. Please try again later.';
            } finally {
                button.disabled = false;
                button.textContent = original;
            }
        });
    });

    // Keep the primary headline readable during load and throughout the visit.
    const typewriterElement = document.getElementById('typewriter-text');
    if (typewriterElement) {
        typewriterElement.textContent = 'Turning the American Dream into Reality';
    }
});
