
document.addEventListener('DOMContentLoaded', () => {
    // Flag body as JS-loaded for safe animations
    document.body.classList.add('js-loaded');

    // --- Mobile Navigation ---
    // --- Mobile Navigation ---
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.classList.add('mobile-menu-btn');
    mobileMenuBtn.innerHTML = '<span></span><span></span><span></span>';
    mobileMenuBtn.setAttribute('aria-label', 'Toggle navigation');
    document.querySelector('.navbar').appendChild(mobileMenuBtn);

    // Create overlay
    const navOverlay = document.createElement('div');
    navOverlay.classList.add('nav-overlay');
    document.body.appendChild(navOverlay);

    const navLinks = document.querySelector('.nav-links');

    function toggleMobileMenu() {
        const isOpen = navLinks.classList.toggle('active');
        navOverlay.classList.toggle('active', isOpen);
        mobileMenuBtn.classList.toggle('active', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

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
        // Get the current filename from the URL
        // Handles: /path/to/index.html -> index.html
        // Handles: / (root) -> index.html (assumed)
        let currentFile = window.location.pathname.split('/').pop() || 'index.html';

        // Handle cases where the path ends in a slash (e.g. /folder/) -> assumed index.html
        if (currentFile.indexOf('.') === -1) {
            currentFile = 'index.html';
        }

        const navLinks = document.querySelectorAll('.nav-links a');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;

            // Get the filename from the link href
            // We use the link object property to get the absolute path, then extract filename
            // But link.href returns full URL. valid for comparison if we just want filename.

            // Simpler: Just check if the href *ends with* the current filename
            // This avoids issues with relative paths like ./about.html vs about.html

            // Special handling for home page
            if ((currentFile === 'index.html' || currentFile === '') && (href === 'index.html' || href === './' || href === '/' || href.endsWith('index.html'))) {
                link.classList.add('active');
                return;
            }

            if (href.endsWith(currentFile)) {
                link.classList.add('active');
            }
        });
    }
    highlightActiveLink();

    // --- AI Chatbot ---
    const chatbotHTML = `
        <div class="chatbot-container">
            <div class="chat-header">
                <div class="chat-title">
                    <i class="fa-solid fa-robot"></i> St. Bernadine School of Allied Health AI
                </div>
                <button id="close-chat"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="message bot">
                    Hello! I'm the AI assistant for St. Bernadine School of Allied Health, Healthcare Services. How can I help you today?
                </div>
            </div>
            <div class="chat-input local-theme-input">
                <input type="text" id="user-input" placeholder="Type your question...">
                <button id="send-btn"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
        <button class="chat-toggle-btn">
            <i class="fa-solid fa-comment-dots"></i>
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

        // Hide toggle button when chat is active to prevent overlap/interaction issues
        if (isActive) {
            chatToggleBtn.style.opacity = '0';
            chatToggleBtn.style.pointerEvents = 'none';
        } else {
            chatToggleBtn.style.opacity = '1';
            chatToggleBtn.style.pointerEvents = 'all';
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

    let chatInitialized = false;

    function showInitialMessage() {
        chatInitialized = true;
        // Clear any hardcoded messages from HTML template if they exist
        chatMessages.innerHTML = '';

        setTimeout(() => {
            showTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();
                addMessage("Hello! I'm the St. Bernadine AI. I can answer questions about our <strong>📚 Programs</strong>, <strong>💰 Tuition</strong>, <strong>🌏 Visa Sponsorship</strong>, <strong>👩‍⚕️ Founder</strong>, and more.<br><br>How can I help you today?", 'bot');
                showSuggestions();
            }, 800);
        }, 300);
    }

    // Send Message Logic
    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            // Add user message
            addMessage(message, 'user');
            userInput.value = '';

            // Simulate AI thinking
            showTypingIndicator();

            // Simulate AI response delay
            setTimeout(() => {
                removeTypingIndicator();
                const response = getBotResponse(message);
                addMessage(response, 'bot');
                // Re-show suggestions after bot response
                setTimeout(showSuggestions, 500);
            }, 1000);
        }
    }

    function handleSuggestion(text) {
        // Remove suggestions immediately to prevent double-clicks
        const existing = document.querySelector('.chat-suggestions');
        if (existing) existing.remove();

        addMessage(text, 'user');
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            const response = getBotResponse(text);
            addMessage(response, 'bot');
            // Re-show suggestions after bot response
            setTimeout(showSuggestions, 500);
        }, 800);
    }

    function showSuggestions() {
        // Clear existing suggestions
        const existing = document.querySelector('.chat-suggestions');
        if (existing) existing.remove();

        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.classList.add('chat-suggestions');

        const topics = [
            { label: '📚 Programs', query: 'programs' },
            { label: '💰 Tuition', query: 'tuition' },
            { label: '🌏 Visa Sponsorship', query: 'visa' },
            { label: '👩‍⚕️ Founder', query: 'founder' },
            { label: '📍 Location', query: 'location' },
            { label: '🤝 Referral', query: 'referral' }
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

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        if (sender === 'bot') {
            messageDiv.innerHTML = `<strong>St. Bernadine School AI:</strong><br>${text}`;
        } else {
            messageDiv.innerHTML = text;
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
        // --- Programs ---
        programs_list: {
            keywords: ['programs', 'courses', 'classes', 'list', 'offer', 'training'],
            response: "We offer flexible schedules (Day, Evening, & Weekend). Click for details:<br><br>📚 <a href='cna-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CNA</a> (Day & Evening)<br>🏠 <a href='ch-hha-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CH-HHA</a> (Weekdays & Weekends)<br>💊 <a href='cma-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CMA</a> (56 Hours)<br>🏥 <a href='pct-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>PCT</a> (5 Months)<br>🩺 <a href='medical-assistant-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Medical Assistant</a> (5 Months)<br>🩸 <a href='ekg-phlebotomy-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>EKG & Phlebotomy</a> (Day & Weekend)<br>❤️ <a href='cpr-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CPR & BLS</a> (1 Day)<br>👶 <a href='newborn-care-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Newborn Care</a> (Weekend Workshop)"
        },
        cna: {
            keywords: ['cna', 'certified nurse aide', 'nursing assistant', 'nurse aide', '90 hours'],
            response: "Our <strong>Certified Nurse Aide (CNA)</strong> program is a 90-hour course (50 classroom / 40 clinicals).<br><br><strong>Schedule:</strong> Day & Evening classes available.<br><strong>Registration Fee:</strong> $500 ($200 non-refundable).<br><strong>Outcome:</strong> NJ State Licensure.<br><br>Learn more or apply on our <a href='cna-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CNA Page</a>."
        },
        hha: {
            keywords: ['hha', 'home health aide', 'homemaker', '76 hours', 'ch-hha'],
            response: "Our <strong>Certified Homemaker Home Health Aide (CH-HHA)</strong> program is 76 hours (60 classroom / 16 skills).<br><br><strong>Schedule:</strong> Weekdays & Weekends available.<br><strong>Registration Fee:</strong> $200 ($200 non-refundable).<br><strong>Outcome:</strong> NJ Board of Nursing Certification.<br><br>Details on our <a href='ch-hha-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CH-HHA Page</a>."
        },
        cma: {
            keywords: ['cma', 'certified medication aide', 'medication', 'med aide', '56 hours'],
            response: "The <strong>Certified Medication Aide (CMA)</strong> course is 56 hours.<br><br><strong>Schedule:</strong> Flexible clinical hours.<br><strong>Prerequisite:</strong> Must have CNA or CH-HHA license.<br><strong>Registration Fee:</strong> $200.<br><br>Apply here: <a href='cma-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CMA Program</a>."
        },
        pct: {
            keywords: ['pct', 'patient care technician', '220 hours', '5 months'],
            response: "Our <strong>Patient Care Technician (PCT)</strong> program is 220 hours (5 months).<br><br><strong>Schedule:</strong> Contact for next intake.<br><strong>Registration Fee:</strong> $500.<br><strong>Outcome:</strong> Advanced clinical skills.<br><br>More info: <a href='pct-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>PCT Page</a>."
        },
        ma: {
            keywords: ['medical assistant', 'ma program', '620 hours', 'admin'],
            response: "Our <strong>Certified Medical Assistant</strong> program is 620 hours (5 months).<br><br><strong>Schedule:</strong> Intensive training + Externship.<br><strong>Registration Fee:</strong> $500.<br><strong>Focus:</strong> Clinical and administrative training.<br><br>Start your career: <a href='medical-assistant-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Medical Assistant Page</a>."
        },
        ekg_phlebotomy: {
            keywords: ['ekg', 'phlebotomy', 'blood draw', 'heart monitor', '140 hours'],
            response: "The <strong>EKG & Phlebotomy</strong> program is 140 hours.<br><br><strong>Schedule:</strong> Day or Weekend classes.<br><strong>Reservation Fee:</strong> $200 (non-refundable).<br><strong>Outcome:</strong> Technical Proficiency Certificate.<br><br>Details: <a href='ekg-phlebotomy-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>EKG/Phlebotomy Page</a>."
        },
        cpr: {
            keywords: ['cpr', 'bls', 'basic life support', 'heart association', 'first aid'],
            response: "We offer <strong>CPR & BLS</strong> certification through the American Heart Association.<br><br><strong>Duration:</strong> 5 hours.<br><strong>Schedule:</strong> Weekdays/Weekends (10am - 3pm).<br><br>Register now: <a href='cpr-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CPR Page</a>."
        },
        newborn: {
            keywords: ['newborn', 'baby nursing', 'infant care', 'neonatal', '10 hours'],
            response: "Our <strong>Newborn Care Specialist (Baby Nursing)</strong> workshop is 10 hours.<br><br><strong>Schedule:</strong> Weekends (10am - 3pm).<br><strong>Registration Fee:</strong> $200 (non-refundable).<br><br>Learn more: <a href='newborn-care-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Newborn Care Page</a>."
        },

        // --- General Info ---
        tuition: {
            keywords: ['tuition', 'cost', 'price', 'payment plan', 'fee', 'financial'],
            response: "We strive to make education affordable. We offer <strong>interest-free weekly or bi-weekly payment plans</strong>.<br><br>Program fees vary. Registration fees range from $200 - $500. Full tuition must be paid before graduation.<br><br>See details: <a href='tuition.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Tuition & Aid</a>."
        },
        requirements: {
            keywords: ['require', 'enroll', 'document', 'paperwork', 'prerequisite'],
            response: "General requirements include:<br>- High School Diploma/GED (for most programs)<br>- State ID / Driver's License<br>- Social Security Card<br>- Medical Clearance (PPD/Physical)<br><br>Check specific program pages for details!"
        },
        location: {
            keywords: ['location', 'address', 'where', 'map', 'directions', 'jersey city'],
            response: "We are located at <strong>591 Summit Avenue, Suite 410, Jersey City, NJ 07306</strong>.<br><br>We are easily accessible by public transportation (Journal Square PATH).<br><iframe src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.738080068307!2d-74.0620888!3d40.7275!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c250ca533f810b%3A0xc3f8e5c54e0aeb29!2s591%20Summit%20Ave%20Suite%20410%2C%20Jersey%20City%2C%20NJ%2007306!5e0!3m2!1sen!2sus!4v1707577800000!5m2!1sen!2sus' width='100%' height='200' style='border:0; border-radius: 8px; margin-top: 10px;' allowfullscreen='' loading='lazy' referrerpolicy='no-referrer-when-downgrade'></iframe>"
        },
        contact: {
            keywords: ['contact', 'phone', 'call', 'email', 'number', 'talk'],
            response: "You can call us at <strong>(201) 222-1116</strong> or email <strong>info@stbernadine.com</strong>.<br><br>Our office hours are Tue-Sat 9am-5pm."
        },

        // --- Leadership & History ---
        founder: {
            keywords: ['founder', 'ceo', 'bernadine', 'belen', 'owner', 'started', 'history', '1986'],
            response: "St. Bernadine was founded in 1986 by <strong>Bernadine 'Belen' Samin, R.N.</strong>.<br><br>With over 40 years of nursing experience, her vision was to expand healthcare services globally to empower nurses and caregivers. <a href='about.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Read her story</a>."
        },
        leadership: {
            keywords: ['leader', 'team', 'director', 'administrator', 'louie', 'jocelyn', 'management'],
            response: "Our leadership team includes:<br>- <strong>Bernadine Samin, R.N.</strong> (Founder)<br>- <strong>Luis 'Louie' Samin</strong> (CEO & Administrator)<br>- <strong>Jocelyn Ortillo-Samin, RN, MA</strong> (Director)<br><br>Together, they bring over 40 years of excellence in healthcare education."
        },
        mission: {
            keywords: ['mission', 'vision', 'goal', 'values'],
            response: "Our mission is to serve people and strengthen healthcare services globally by delivering the best possible instruction and preparing students for success in the healthcare industry."
        },

        // --- Services ---
        visa: {
            keywords: ['visa', 'sponsorship', 'green card', 'eb3', 'immigration', 'global', 'international', 'abroad', 'petition'],
            response: "We offer <strong>Global Career Procurement</strong>!<br><br>We specialize in EB-3 Visa and Green Card sponsorship for international nurses and therapists, including placement in top US institutions and travel assistance.<br><br><a href='placement.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Learn about Global Placement</a>."
        },
        homecare_services: {
            keywords: ['home care service', 'caregiver service', 'hiring a nurse', 'need help', 'patient care', '24/7'],
            response: "Our <strong>Home Care Services</strong> division provides 24/7 personalized care.<br><br>We match certified caregivers to patients for medication management, meal prep, and daily living assistance.<br><br><a href='home-care.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Request Care</a>."
        },
        referral: {
            keywords: ['referral', 'refer', 'recommend', 'friend', 'bonus', 'commission'],
            response: "Refer a friend and earn rewards! We offer a <strong>Referral Program</strong> for our courses.<br><br>If you know someone interested in healthcare training, refer them to us.<br><br><a href='referral.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Submit a Referral</a>."
        }
    };

    function getBotResponse(input) {
        const lowerInput = input.toLowerCase();

        // Check for Greetings specifically
        if (lowerInput.match(/\b(hi|hello|hey|greetings|good morning|good afternoon)\b/)) {
            return "Hello! I can help you with <strong>Program Details</strong> (CNA, HHA, etc.), <a href='tuition.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>Tuition</strong></a>, <strong>Visa Sponsorship</strong>, or tell you about our <strong>Founder</strong>. What would you like to know?";
        }

        // Check for specific keywords in knowledge base
        for (const key in schoolKnowledge) {
            if (schoolKnowledge[key].keywords.some(word => lowerInput.includes(word))) {
                return schoolKnowledge[key].response;
            }
        }

        // Expanded Fallback
        return "I'm not sure about that specific detail. You can ask me about:<br>- <strong>Programs</strong> (CNA, HHA, PCT, MA)<br>- <strong>Tuition & Aid</strong><br>- <strong>Visa Sponsorship</strong><br>- <strong>Location & Contact</strong><br><br>Or call us at (201) 222-1116.";
    }



    // --- Hero Slider ---
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    if (slides.length > 0) {
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
            const target = parseInt(counter.getAttribute('data-target'));
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

    // --- Header Scroll Effect ---
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
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
});
