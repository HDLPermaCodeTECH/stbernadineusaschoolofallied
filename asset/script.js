
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
                    Hello! I'm the St. Bernadine AI. I can answer <strong>ANY</strong> question—whether it's about the school, general topics (history, science, etc.), or even about the web developer! 🤖✨
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
                addMessage("Hello! I'm the St. Bernadine AI. I can answer <strong>ANY</strong> question—whether it's about the school, general topics (history, science, etc.), or even about the web developer! 🤖✨", 'bot');
                showSuggestions(); // Restored per user request
            }, 800);
        }, 300);
    }

    // Send Message Logic
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            // Add user message
            addMessage(message, 'user');
            userInput.value = '';

            // Simulate AI thinking
            showTypingIndicator();

            try {
                // Get Response (Async)
                const response = await getBotResponse(message);

                removeTypingIndicator();
                addMessage(response, 'bot');

                // Re-show suggestions after bot response
                setTimeout(showSuggestions, 500);
            } catch (error) {
                console.error("Chat Error:", error);
                removeTypingIndicator();
                addMessage("I'm having trouble connecting right now. Please try again.", 'bot');
            }
        }
    }

    function handleSuggestion(text) {
        // Remove suggestions immediately to prevent double-clicks
        const existing = document.querySelector('.chat-suggestions');
        if (existing) existing.remove();

        addMessage(text, 'user');
        showTypingIndicator();

        // Use the same async logic
        getBotResponse(text).then(response => {
            removeTypingIndicator();
            addMessage(response, 'bot');
            setTimeout(showSuggestions, 500);
        });
    }

    function showSuggestions() {
        // Clear existing suggestions
        const existing = document.querySelector('.chat-suggestions');
        if (existing) existing.remove();

        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.classList.add('chat-suggestions');

        const topics = [
            { label: '📝 Apply Now', query: 'application' },
            { label: '📚 Programs', query: 'programs' },
            { label: '💰 Tuition', query: 'tuition' },
            { label: '🎓 Student Life', query: 'student_life' },
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
        programs_list: {
            keywords: ['programs', 'courses', 'classes', 'list', 'offer', 'training', 'certification'],
            response: "We offer flexible schedules (Day, Evening, & Weekend). Click for details:<br><br>📚 <a href='cna-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CNA</a> (Day & Evening)<br>🏠 <a href='ch-hha-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CH-HHA</a> (Weekdays & Weekends)<br>💊 <a href='cma-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CMA</a> (56 Hours)<br>🏥 <a href='pct-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>PCT</a> (5 Months)<br>🩺 <a href='medical-assistant-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Medical Assistant</a> (5 Months)<br>🩸 <a href='ekg-phlebotomy-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>EKG & Phlebotomy</a> (Day & Weekend)<br>❤️ <a href='cpr-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>CPR & BLS</a> (1 Day)<br>👶 <a href='newborn-care-program.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Newborn Care</a> (Weekend Workshop)"
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
            keywords: ['tuition', 'cost', 'price', 'payment plan', 'fee', 'financial', 'how much'],
            response: "We offer <strong>interest-free weekly or bi-weekly payment plans</strong>.<br><br><strong>Registration Fees:</strong><br>- CNA/PCT/MA: $500<br>- CH-HHA/CMA/Newborn: $200<br>- EKG/Phlebotomy/CPR: $200<br><br>Note: Reservation fees are non-refundable but consumable.<br><br>📄 <a href='tuition.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>View Tuition Schedule</strong></a>"
        },
        refund_policy: {
            keywords: ['refund', 'money back', 'cancellation', 'withdraw', 'non-refundable'],
            response: "<strong>Reservation fees are strictly non-refundable</strong> but are consumable for the next session of your chosen program if you need to reschedule.<br><br>Please check our enrollment agreement for the full refund policy regarding tuition."
        },

        // --- Admissions & Forms ---
        requirements: {
            keywords: ['require', 'enroll', 'document', 'paperwork', 'prerequisite', 'admission', 'qualify'],
            response: "General requirements include:<br>- High School Diploma/GED (for most programs)<br>- State ID / Driver's License<br>- Social Security Card<br>- Medical Clearance (PPD/Physical)<br><br>📝 <a href='apply.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>Start Online Application</strong></a><br><br>📄 <a href='forms.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>Download Forms</strong></a>"
        },
        forms: {
            keywords: ['form', 'download', 'pdf', 'application', 'catalog', 'physical form'],
            response: "You can download important documents from our Forms page:<br><br>📄 <a href='forms.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Enrollment Application</a><br><br>🩺 <a href='forms.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Medical Physical Form</a><br><br>📖 <a href='forms.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Course Catalog</a>"
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
            keywords: ['founder', 'ceo', 'bernadine', 'belen', 'owner', 'samin'],
            response: "Our Founder, <strong>Bernadine 'Belen' Samin, R.N.</strong>, has over 40 years of nursing experience (ER, ICU, Neonatal).<br><br>From humble beginnings in the Philippines, she built St. Bernadine to share opportunities with others. <a href='about.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Read her full story</a>."
        },
        faculty: {
            keywords: ['faculty', 'teacher', 'instructor', 'staff', 'team', 'nenita', 'felicia', 'cecilia'],
            response: "Our expert faculty includes:<br>- <strong>Nenita Pawid, RN:</strong> 40+ years exp.<br>- <strong>Felicia Miller:</strong> 40+ years exp.<br>- <strong>Cecilia Domingo, RN:</strong> 40+ years exp.<br>- <strong>Aurea Cielito G. Batchar, RN:</strong> 33 years exp.<br><br>They bring decades of real-world clinical experience to the classroom."
        },
        partners: {
            keywords: ['partner', 'affiliate', 'accredit', 'approve', 'board', 'recognition'],
            response: "We are accredited and approved by:<br>✅ NJ Department of Education<br>✅ NJ Board of Nursing<br>✅ NJ Department of Health<br>✅ American Heart Association (AHA)<br>✅ AMCA (American Medical Certification Association)"
        },

        // --- General ---
        location: {
            keywords: ['location', 'address', 'where', 'map', 'directions', 'jersey city', 'office'],
            response: "We are located at <strong>591 Summit Avenue, Suite 410, Jersey City, NJ 07306</strong>.<br><br><strong>Hours:</strong> Tue-Sat 9am-5pm.<br><br><iframe src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.738080068307!2d-74.0620888!3d40.7275!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c250ca533f810b%3A0xc3f8e5c54e0aeb29!2s591%20Summit%20Ave%20Suite%20410%2C%20Jersey%20City%2C%20NJ%2007306!5e0!3m2!1sen!2sus!4v1707577800000!5m2!1sen!2sus' width='100%' height='200' style='border:0; border-radius: 8px; margin-top: 10px;' allowfullscreen='' loading='lazy' referrerpolicy='no-referrer-when-downgrade'></iframe>"
        },
        contact: {
            keywords: ['contact', 'phone', 'call', 'email', 'number', 'talk', 'reach'],
            response: "📞 <strong>Phone:</strong> (201) 222-1116<br><br>📧 <strong>Email:</strong> school@stbernadineusa.com<br><br>📍 <strong>Visit:</strong> 591 Summit Ave, Jersey City.<br><br>We are here to help!"
        },
        referral: {
            keywords: ['referral', 'refer', 'recommend', 'friend', 'bonus', 'commission'],
            response: "Refer a friend and earn rewards! We offer a <strong>Referral Program</strong> for our courses.<br><br>If you know someone interested in healthcare training, refer them to us!<br><br><a href='referral.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Submit a Referral</a>."
        },
        application: {
            keywords: ['application', 'apply', 'register', 'enroll', 'sign up', 'start', 'join'],
            response: "Ready to start your career? 🎓<br><br>Click here to fill out the <strong>Online Application</strong>:<br>📝 <a href='apply.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>Apply Now</strong></a><br><br>It only takes a few minutes!"
        },
        student_life: {
            keywords: ['student', 'life', 'career', 'advice', 'skills', 'news', 'blog', 'events'],
            response: "Explore our Student Resources:<br><br>🎓 <a href='student-life.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Student Life</a><br>💼 <a href='career-advice.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Career Advice</a><br>🩺 <a href='clinical-skills.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Clinical Skills</a><br>📰 <a href='agency-news.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>Agency News</a>"
        },
        developer: {
            keywords: ['developer', 'dev', 'creator', 'made this', 'built this', 'architect', 'troy', 'hebrey', 'llagas', 'who are you', 'programming'],
            response: "This website and AI were architected and built by <strong>Hebrey Dill P. Llagas (Troy)</strong>.<br><br><strong>Role:</strong> Lead Developer & AI Specialist.<br><strong>Age:</strong> 29.<br><strong>Expertise:</strong> Full-Stack Development & AI Integration.<br><br>He is highly recommended for premium web projects!"
        }
    };

    async function getBotResponse(input) {
        const lowerInput = input.toLowerCase();

        // 1. Check for Greetings locally (faster/cheaper)
        if (lowerInput.match(/\b(hi|hello|hey|greetings|good morning|good afternoon)\b/)) {
            return "Hello! I can help you with <strong>Program Details</strong> (CNA, HHA, etc.), <a href='tuition.html' target='_blank' style='color: var(--primary-color); text-decoration: underline;'><strong>Tuition</strong></a>, <strong>Visa Sponsorship</strong>, or tell you about our <strong>Founder</strong>. What would you like to know?";
        }

        // 2. Try Direct Gemini API (Client-Side Fallback for Static Hosting)
        try {
            const API_KEY = 'AIzaSyCmHsdOyUghILg2bQ4IM3vk97ds1l0ZTf8'; // Restricted Key
            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

            // Construct Knowledge Base Context
            const knowledgeContext = Object.values(schoolKnowledge)
                .map(item => item.response.replace(/<[^>]*>?/gm, '')) // Strip HTML for token efficiency
                .join('\n\n');

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are St. Bernadine AI, a helpful assistant for St. Bernadine School of Allied Health in Jersey City.

INSTRUCTIONS:
1. If the user asks about the school (programs, tuition, location, etc.), USE the specific information below.
2. If the user asks about GENERAL topics (World History, Science, Math, Life, etc.), ANSWER it using your own vast knowledge. You are a smart AI.

SCHOOL INFORMATION:
${knowledgeContext}

Keep answers concise, friendly, and professional.
IMPORTANT: Do NOT use Markdown (like **bold** or [link](url)).
INSTEAD, use HTML tags for formatting: <b>bold</b>, <i>italics</i>, <br> for line breaks, and <a href='URL'>links</a>.
User Question: ${input}`
                        }]
                    }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.candidates && data.candidates.length > 0) {
                    return data.candidates[0].content.parts[0].text;
                }
            } else {
                console.warn("Gemini API Error:", response.status);
                addMessage(`System Error: ${response.status} - ${response.statusText}`, 'bot');
            }
        } catch (e) {
            console.log("Gemini API unreachable.", e);
            addMessage(`Connection Error: ${e.message}`, 'bot');
        }

        // 3. Fallback to Local Knowledge Base
        for (const key in schoolKnowledge) {
            if (schoolKnowledge[key].keywords.some(word => lowerInput.includes(word))) {
                return schoolKnowledge[key].response;
            }
        }

        // 4. Final Fallback
        return "I'm having trouble connecting to my brain right now (High Traffic).<br><br>But I can still help with:<br>- <strong>Programs</strong><br>- <strong>Tuition</strong><br>- <strong>Location</strong><br><br>Please try again in a few minutes!";
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
            const target = parseFloat(counter.getAttribute('data-target'));
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
    // --- Cookie Consent Banner ---
    const cookieBannerHTML = `
        <div id="cookie-banner" class="cookie-banner">
            <div class="container">
                <div class="cookie-content">
                    <p>🍪 We use cookies to improve your experience and analyze site traffic. By continuing, you agree to our use of cookies.</p>
                    <div class="cookie-actions">
                        <button id="accept-cookies" class="btn btn-primary btn-sm">Accept</button>
                        <button id="decline-cookies" class="btn btn-outline btn-sm">Decline</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Check if user has already made a choice
    if (!localStorage.getItem('cookieConsent')) {
        // Inject banner
        document.body.insertAdjacentHTML('beforeend', cookieBannerHTML);

        const cookieBanner = document.getElementById('cookie-banner');
        const acceptBtn = document.getElementById('accept-cookies');
        const declineBtn = document.getElementById('decline-cookies');

        // Show banner with a slight delay for animation
        setTimeout(() => {
            cookieBanner.classList.add('visible');
        }, 1000);

        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            cookieBanner.classList.remove('visible');
            setTimeout(() => cookieBanner.remove(), 500);
        });

        declineBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'declined');
            cookieBanner.classList.remove('visible');
            setTimeout(() => cookieBanner.remove(), 500);
        });
    }
});
