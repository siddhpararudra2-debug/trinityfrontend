"use strict";
(() => {
    const getElement = (selector) => {
        const element = document.querySelector(selector);
        if (!element)
            throw new Error(`Required chatbot element not found: ${selector}`);
        return element;
    };
    const getById = (id) => {
        const element = document.getElementById(id);
        if (!element)
            throw new Error(`Required chatbot element not found: #${id}`);
        return element;
    };
    const video = getById('hero-motion');
    const quote = getElement('.quote-line');
    const input = getElement('.message');
    const messages = getById('messages');
    const conversation = getElement('.conversation');
    const form = getElement('.chat-dock');
    const quotes = [
        'Ready when you are.',
        'The world needs your inputs to function. You can’t quit now.',
        'Your next idea might change everything.',
        'One small step can change the whole day.',
        'Take a breath. Then make something brilliant.',
        'You’ve got this. The future is rooting for you.'
    ];
    let name = '';
    try {
        name = localStorage.getItem('trinty-name') || '';
    }
    catch {
        // Storage may be unavailable; the page continues without saving a name.
    }
    const scrollToLatest = () => {
        conversation.scrollTop = conversation.scrollHeight;
    };
    const addMessage = (role, text) => {
        const row = document.createElement('div');
        row.className = `message-row ${role}`;
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = text;
        row.appendChild(bubble);
        messages.appendChild(row);
        requestAnimationFrame(scrollToLatest);
        return row;
    };
    const homeGreeting = () => name ? `Good morning, ${name}.` : 'Ready when you are.';
    const resetToHome = () => {
        document.body.classList.remove('chat-active');
        messages.replaceChildren();
        addMessage('assistant', name ? `Good morning, ${name}. What are you working on?` : 'Hey, I’m Trinty. What are you working on?');
        quote.textContent = homeGreeting();
        input.value = '';
    };
    resetToHome();
    let quoteIndex = 0;
    const rotateQuote = () => {
        quote.classList.add('is-changing');
        window.setTimeout(() => {
            quoteIndex = (quoteIndex + 1) % (quotes.length + (name ? 1 : 0));
            quote.textContent = name && quoteIndex === quotes.length ? `Good morning, ${name}.` : quotes[quoteIndex];
            quote.classList.remove('is-changing');
        }, 560);
    };
    window.setInterval(rotateQuote, 4800);
    const keepPlaying = () => {
        if (document.visibilityState === 'visible' && video.paused) {
            void video.play().catch(() => undefined);
        }
    };
    video.addEventListener('canplay', keepPlaying);
    video.addEventListener('ended', () => {
        video.currentTime = 0;
        keepPlaying();
    });
    document.addEventListener('visibilitychange', keepPlaying);
    window.setInterval(() => {
        if (document.visibilityState === 'visible' && video.readyState >= 2)
            keepPlaying();
    }, 2500);
    void video.play().catch(() => undefined);
    window.addEventListener('pagehide', resetToHome);
    window.addEventListener('pageshow', (event) => {
        if (event.persisted)
            resetToHome();
    });
    const makeReply = (text) => {
        const lower = text.toLowerCase();
        const nameMatch = text.match(/(?:my name is|i am|i'm|call me)\s+([a-z][a-z' -]{0,30})/i);
        if (nameMatch) {
            name = nameMatch[1].trim().replace(/[<>]/g, '').slice(0, 32);
            try {
                localStorage.setItem('trinty-name', name);
            }
            catch {
                // Keep the name for this page session when storage is unavailable.
            }
            return `Good morning, ${name}. What would you like to work on?`;
        }
        if (/\b(drone|uav|quad(copter)?|multirotor)\b/.test(lower)) {
            const size = /\b30\s*(?:by|x|×)\s*30\s*cm\b/.test(lower);
            return size
                ? 'A 30 × 30 cm drone is a good starting envelope. What will it carry, how long should it fly, where will it operate, and what is your budget?'
                : 'I can help plan the drone. What size, payload, flight time, operating environment, and budget should I design around?';
        }
        if (/\b(good morning|hello|hi|hey)\b/.test(lower)) {
            return name ? `Good morning, ${name}. What can I help you figure out today?` : 'Hey! What are you hoping to build or solve today?';
        }
        if (/\b(thanks|thank you)\b/.test(lower))
            return 'You’re welcome. What would you like to work on next?';
        return 'Tell me what you want to make, what it needs to do, and any limits I should keep in mind.';
    };
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const entered = input.value.trim();
        if (!entered)
            return;
        document.body.classList.add('chat-active');
        addMessage('user', entered);
        input.value = '';
        input.focus();
        const typing = addMessage('assistant', 'Thinking…');
        typing.classList.add('typing');
        window.setTimeout(() => {
            typing.remove();
            addMessage('assistant', makeReply(entered));
        }, 620);
    });
})();
