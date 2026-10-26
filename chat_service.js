'use strict';

const UNAVAILABLE = 'Advanced AI answers are temporarily unavailable. You can still ask about our programs, tuition, location or care services, or contact our team.';

// Provider diagnostics may contain credentials. Log only a bounded category.
function failureCategory(error) {
    const status = Number(error && error.status);
    if (status === 429) return 'capacity';
    if ([400, 401, 403].includes(status)) return 'configuration';
    if (status === 404) return 'model';
    if (error && error.name === 'AbortError') return 'timeout';
    return 'unavailable';
}

function createChatHandler(model, { timeoutMs = 20000, logger = console } = {}) {
    let unavailableUntil = 0;
    return async (req, res) => {
        res.set('Cache-Control', 'no-store');
        if (!model || Date.now() < unavailableUntil) {
            return res.status(503).json({ code: 'AI_UNAVAILABLE', error: UNAVAILABLE });
        }
        let timer;
        try {
            const generation = async () => {
                const chat = model.startChat({ history: [], generationConfig: { maxOutputTokens: 1500 } });
                const result = await chat.sendMessage(req.body.message);
                const response = await result.response;
                const text = response.text();
                if (typeof text !== 'string' || !text.trim()) throw new Error('Empty answer');
                return text;
            };
            const timeout = new Promise((_, reject) => {
                timer = setTimeout(() => reject(Object.assign(new Error('Timeout'), { name: 'AbortError' })), timeoutMs);
            });
            const text = await Promise.race([generation(), timeout]);
            return res.json({ response: text });
        } catch (error) {
            const category = failureCategory(error);
            logger.warn('AI request unavailable', { category });
            // Avoid repeatedly calling a provider with invalid configuration.
            if (['configuration', 'model'].includes(category)) unavailableUntil = Date.now() + 60000;
            if (category === 'capacity') res.set('Retry-After', '60');
            return res.status(category === 'capacity' ? 429 : 503).json({ code: 'AI_UNAVAILABLE', error: UNAVAILABLE });
        } finally {
            clearTimeout(timer);
        }
    };
}

module.exports = { createChatHandler, failureCategory };
