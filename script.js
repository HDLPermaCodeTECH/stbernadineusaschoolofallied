
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
                addMessage("Hello! I'm the AI assistant for St. Bernadine School of Allied Health, Healthcare Services. How can I help you today?", 'bot');
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
        programs: {
            keywords: ['program', 'course', 'class', 'study', 'offer', 'training', 'certification', 'pct', 'medical assistant', 'ekg', 'phlebotomy', 'cpr', 'newborn', 'nurse', 'nursing'],
            response: "We offer a variety of healthcare programs including CNA, CH-HHA, CMA, PCT, and more. For all details, schedules, and costs, please visit our <a href='services.html' style='color: var(--primary-color); text-decoration: underline;'>Services page</a>."
        },
        cna: {
            keywords: ['cna', 'nurse aide'],
            response: "Our Nursing Assistant (CNA) program information is fully detailed on our <a href='services.html' style='color: var(--primary-color); text-decoration: underline;'>Services page</a>. Please visit for more info!"
        },
        hha: {
            keywords: ['hha', 'home health', 'caregiver'],
            response: "For details on our Home Health Aide (CH-HHA) program, please head over to our <a href='services.html' style='color: var(--primary-color); text-decoration: underline;'>Services page</a>."
        },
        cma: {
            keywords: ['cma', 'medication aide'],
            response: "Information about the Medication Aide (CMA) program can be found on our <a href='services.html' style='color: var(--primary-color); text-decoration: underline;'>Services page</a>."
        },
        tuition: {
            keywords: ['tuition', 'cost', 'price', 'pay', 'fee', 'financial'],
            response: "Registration fees range from $200 to $500 depending on the program. We offer interest-free weekly or bi-weekly payment plans. Full tuition must be paid before graduation."
        },
        requirements: {
            keywords: ['require', 'enroll', 'need', 'document', 'paperwork'],
            response: "To enroll, you generally need: High School level education, State ID, Social Security Card, Medical Clearance (PPD/X-Ray), and Covid Vaccine record."
        },
        location: {
            keywords: ['location', 'address', 'where', 'office', 'jersey city', 'summit ave'],
            response: "Our School and Home Care office is located at <strong>591 Summit Avenue, Suite 415, Jersey City, NJ 07306</strong>."
        },
        contact: {
            keywords: ['contact', 'phone', 'call', 'email', 'registrar', 'reach'],
            response: "You can reach us at (201) 222-1116 or email info@stbernadine.com. Our office is happy to help!"
        },
        apply: {
            keywords: ['apply', 'application', 'join', 'start', 'sign up'],
            response: "You can apply online by clicking the 'Apply Now' button in the menu, or visit us in person at our Jersey City office."
        },
        referral: {
            keywords: ['refer', 'friend', 'reward', 'recommend', 'refferal'],
            response: "Our Referral Program allows you to earn rewards for recommending friends! Simply fill out the form on our <a href='referral.html' style='color: var(--primary-color); text-decoration: underline;'>Referral page</a> with your info and your friend's contact details."
        },
        founder: {
            keywords: ['founder', 'ceo', 'bernadine', 'belen', 'owner', 'who started'],
            response: "St. Bernadine was founded in 1986 by <strong>Bernadine Samin, R.N.</strong>, who envisioned expanding healthcare services globally to empower nurses and caregivers."
        },
        mission: {
            keywords: ['mission', 'vision', 'goal', 'purpose'],
            response: "Our mission is to serve people and strengthen healthcare services globally by delivering the best possible instruction and preparing students for success in the healthcare industry."
        },
        leadership: {
            keywords: ['leadership', 'team', 'management', 'louie', 'jocelyn', 'director', 'administrator'],
            response: "Our leadership team includes <strong>Bernadine Samin, R.N.</strong> (Founder), <strong>Luis (Louie) Samin</strong> (CEO & Administrator), and <strong>Jocelyn Ortillo-Samin</strong> (Director)."
        },
        visa: {
            keywords: ['visa', 'sponsorship', 'green card', 'eb3', 'international', 'abroad', 'plane ticket', 'travel', 'career procurement'],
            response: "We provide comprehensive <strong>Global Career Procurement</strong> including EB-3 Visa and Green Card sponsorship. Professionals in nursing and therapy roles even receive <strong>FREE plane tickets</strong> for US integration!"
        },
        homecare_details: {
            keywords: ['matching', 'match', 'safety', '24/7', 'personalized care', 'senior', 'healthcare professional'],
            response: "Our professional clinical services provide 24/7 personalized care with a meticulous <strong>Clinical Matching</strong> process to ensure elite support for your loved ones."
        }
    };

    function getBotResponse(input) {
        const lowerInput = input.toLowerCase();

        // Check for specific keywords
        for (const key in schoolKnowledge) {
            if (schoolKnowledge[key].keywords.some(word => lowerInput.includes(word))) {
                return schoolKnowledge[key].response;
            }
        }

        if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
            return "Hello! I'm the AI for St. Bernadine School of Allied Health, Healthcare Services. I can tell you about our programs, tuition, requirements, or location. What would you like to know?";
        }

        return "I'm not quite sure about that. You can ask me about our programs (CNA, HHA, etc.), tuition, requirements, or our location in Jersey City. How can I help?";
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
