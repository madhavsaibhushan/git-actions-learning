(function () {
    // Endpoint of the storybook-chat-bot backend. Override via window.DS_CHAT_ENDPOINT.
var ENDPOINT = window.DS_CHAT_ENDPOINT || 'http://localhost:3000/chat';
    if (document.getElementById('ds-chat-bubble-btn')) {
        return; // already injected
    }
var ICON_CHAT =
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M12 3C7.03 3 3 6.58 3 11c0 2.05.87 3.92 2.3 5.34-.1 1.1-.46 2.3-1.3 3.16 1.6 0 3.04-.5 4.16-1.3 1.16.45 2.45.7 3.84.7 4.97 0 9-3.58 9-8s-4.03-8-9-8z" fill="currentColor"/>' +
        '<circle cx="8.5" cy="11" r="1.2" fill="#9453ad"/>' +
        '<circle cx="12" cy="11" r="1.2" fill="#9453ad"/>' +
        '<circle cx="15.5" cy="11" r="1.2" fill="#9453ad"/>' +
        '</svg>';
    var ICON_CLOSE =
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
        '</svg>';

    var btn = document.createElement('button');
    btn.id = 'ds-chat-bubble-btn';
    btn.className = 'ds-chat-bubble-btn';
    btn.setAttribute('aria-label', 'Open chat assistant');
    btn.innerHTML = ICON_CHAT;

    var panel = document.createElement('div');
    panel.className = 'ds-chat-panel';
    panel.innerHTML =
        '<div class="ds-chat-header">Design System Assistant</div>' +
        '<div class="ds-chat-messages" id="ds-chat-messages"></div>' +
        '<div class="ds-chat-input-row">' +
        '<input class="ds-chat-input" id="ds-chat-input" type="text" placeholder="Ask something..." />' +
        '<button class="ds-chat-send" id="ds-chat-send">Send</button>' +
        '</div>';

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    var messages = panel.querySelector('#ds-chat-messages');
    var input = panel.querySelector('#ds-chat-input');
    var send = panel.querySelector('#ds-chat-send');
    var sessionId = null; // Store session ID for conversation context

    function addMessage(text, role) {
        var el = document.createElement('div');
        el.className = 'ds-chat-msg ' + role;
        
if (role == 'bot') {
            // Parse markdown code blocks and inline code
            el.innerHTML = parseMarkdown(text);
        } else {
            el.textContent = text;
        }
        
        messages.appendChild(el);
        messages.scrollTop = messages.scrollHeight;
        return el;
    }

    function parseMarkdown(text) {
        // Escape HTML first to prevent injection
        text = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Parse code blocks (``` language ... ```)
        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
            var language = lang || 'text';
            return '<pre class="ds-chat-code"><code class="language-' + language + '">' + code.trim() + '</code></pre>';
        });

        // Parse inline code (backticks)
        text = text.replace(/`([^`]+)`/g, '<code class="ds-chat-inline-code">$1</code>');

        // Parse bold (**text**)
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Parse line breaks
        text = text.replace(/\n/g, '<br>');

        return text;
    }

    btn.addEventListener('click', function () {
        var open = panel.classList.toggle('open');
        btn.innerHTML = open ? ICON_CLOSE : ICON_CHAT;
        btn.setAttribute('aria-label', open ? 'Close chat assistant' : 'Open chat assistant');
        if (open) {
            input.focus();
        }
    });

    async function sendMessage() {
        var text = input.value.trim();
        if (!text) {
            return;
        }
        addMessage(text, 'user');
        input.value = '';
        send.disabled = true;

        var pending = addMessage('…', 'bot');

        try {
            var res = await fetch(ENDPOINT, {
                method: 'POST',  headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, sessionId: sessionId }),
            });
            var data = await res.json();
            if (res.ok) {
                pending.textContent = data.reply || '(no reply)';
                sessionId = data.sessionId; // Store session ID for next message
            } else {
                pending.textContent = data.error || 'Request failed';
            }
        } catch (e) {
            pending.textContent = 'Could not reach the chat service.';
        } finally {
            send.disabled = false;
            input.focus();
        }
    }

    send.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {sendMessage();
        }
    });
})();
