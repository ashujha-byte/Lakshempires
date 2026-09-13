/**
 * Laksh Empires — 24/7 Luxury AI Real Estate Concierge & Auto Email Dispatch
 * Handles conversational queries powered by Google Gemini and automatically
 * emails lead transcripts to lakshempires@gmail.com via FormSubmit.
 */

(function () {
  const GEMINI_API_KEY = ""; // Canvas runtime provides standard key when empty
  const GEMINI_MODEL = "gemini-3-flash-preview";
  const TARGET_EMAIL = "lakshempires@gmail.com";

  // System Persona guiding luxury tone, knowledge base and lead capturing
  const SYSTEM_INSTRUCTION = `
You are the elite 24/7 Virtual Real Estate Advisor for "Laksh Empires", Noida's premier real estate consultancy led by Founding Director Lakshay Dawar.
Laksh Empires specializes in:
1. YEIDA (Yamuna Expressway Industrial Development Authority) - Sectors 16, 17, 18, 20, 22D plots and Jewar Airport investment corridor.
2. GNIDA (Greater Noida) - Alpha, Beta, Delta sectors, institutional & residential hubs.
3. Noida - Sector 62, 150, premium luxury villas & high-rise apartments.
4. Commercial Studios & High-footfall Retail Shop Spaces.
5. Ground-up Construction & Turnkey Bespoke Interior Design.
6. End-to-end Portfolio Management (Buying, Selling, Leasing, Due Diligence).
7. Office/Direct Phone: +91 9696969916. Email: lakshempires@gmail.com.

Tone & Persona:
- Ultra-professional, respectful, warm, and sophisticated.
- Keep responses concise (2 to 4 sentences or bullet points), highly informative and elegant.
- Always encourage booking an on-site visit or speaking directly with Founding Director Lakshay Dawar.
- Gently ask for their name and mobile number when discussing specific plot sizes, pricing, or bookings so the advisor can prepare documentation.
`;

  let chatOpen = false;
  let isGenerating = false;
  let chatHistory = [];
  let userProfile = { name: '', phone: '', email: '' };
  let transcriptSent = false;
  let messageCountSinceLastSync = 0;

  // Restore prior session history if present
  try {
    const savedChat = sessionStorage.getItem('le_ai_chat');
    if (savedChat) chatHistory = JSON.parse(savedChat);
    const savedUser = sessionStorage.getItem('le_ai_user');
    if (savedUser) userProfile = JSON.parse(savedUser);
  } catch (e) {
    console.debug('Storage access warning', e);
  }

  function injectStylesAndMarkup() {
    // Custom styles for chat scrollbar and animations
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      #le-ai-widget * { box-sizing: border-box; }
      #le-ai-window {
        transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      #le-ai-messages::-webkit-scrollbar { width: 4px; }
      #le-ai-messages::-webkit-scrollbar-thumb { background: rgba(245, 166, 35, 0.3); border-radius: 9999px; }
      @keyframes lePulseSlow {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.08); opacity: 1; box-shadow: 0 0 25px rgba(245, 166, 35, 0.6); }
      }
      .le-pulse-slow { animation: lePulseSlow 3s infinite ease-in-out; }
    `;
    document.head.appendChild(styleEl);

    // Main Floating Container
    const container = document.createElement('div');
    container.id = 'le-ai-widget';
    container.className = 'fixed bottom-5 right-5 z-[9999] font-sans antialiased';

    container.innerHTML = `
      <!-- ============ EXPANDABLE CHAT WINDOW ============ -->
      <div id="le-ai-window" class="hidden opacity-0 translate-y-4 fixed sm:absolute bottom-0 sm:bottom-20 right-0 sm:right-0 w-full sm:w-[420px] h-[90vh] sm:h-[620px] max-h-[92vh] bg-[#060919]/95 backdrop-blur-xl border border-[#F5A623]/30 rounded-t-3xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-[#F3EFE4]">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-[#0A0E27] via-[#10153A] to-[#0A0E27] px-5 py-4 border-b border-[#F5A623]/25 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="relative w-10 h-10 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/40 flex items-center justify-center text-[#FFD98A] shadow-inner">
              <i data-lucide="crown" class="w-5 h-5"></i>
              <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#060919]"></span>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-extrabold text-sm tracking-wide text-[#FFD98A] uppercase">Laksh Concierge</span>
                <span class="text-[9px] font-bold bg-[#F5A623]/20 text-[#FFD98A] px-1.5 py-0.5 rounded uppercase">24/7 AI</span>
              </div>
              <p class="text-[11px] text-[#F3EFE4]/60 tracking-wider">Laksh Empires Real Estate Advisor</p>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button id="le-ai-end-btn" title="End & Email Transcript" class="p-2 rounded-lg text-[#F3EFE4]/60 hover:text-[#FFD98A] hover:bg-[#F5A623]/10 transition-colors text-xs flex items-center gap-1">
              <i data-lucide="mail-check" class="w-4 h-4"></i>
            </button>
            <button id="le-ai-minimize" class="p-2 rounded-lg text-[#F3EFE4]/70 hover:text-white hover:bg-white/10 transition-colors">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
        </div>

        <!-- Notification Banner -->
        <div id="le-ai-toast" class="hidden bg-[#F5A623]/15 border-b border-[#F5A623]/25 px-4 py-2 text-[11px] text-[#FFD98A] text-center font-medium">
          Chat transcript synced with Laksh Empires desk.
        </div>

        <!-- Message History -->
        <div id="le-ai-messages" class="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 text-xs">
          <!-- Initial Welcome Message -->
          <div class="flex items-start gap-2.5">
            <div class="w-7 h-7 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 flex items-center justify-center text-[#FFD98A] shrink-0 mt-0.5">
              <i data-lucide="bot" class="w-3.5 h-3.5"></i>
            </div>
            <div class="bg-[#10153A]/90 border border-[#F5A623]/20 rounded-2xl rounded-tl-sm px-4 py-3 text-[#F3EFE4]/90 max-w-[85%] leading-relaxed shadow">
              Welcome to <strong class="text-[#FFD98A]">Laksh Empires</strong>. I am your 24/7 Luxury Advisory Assistant. How may I assist your investment portfolio across <span class="text-[#FFD98A]">YEIDA, GNIDA, or Noida</span> today?
            </div>
          </div>
        </div>

        <!-- Quick Suggestion Chips -->
        <div class="px-4 py-2 bg-[#0A0E27]/80 border-t border-[#F5A623]/15 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button class="le-quick-chip shrink-0 bg-[#10153A] hover:bg-[#F5A623]/20 border border-[#F5A623]/30 rounded-full px-3 py-1.5 text-[11px] text-[#FFD98A] transition-all">
            YEIDA Plots Sector 18/20
          </button>
          <button class="le-quick-chip shrink-0 bg-[#10153A] hover:bg-[#F5A623]/20 border border-[#F5A623]/30 rounded-full px-3 py-1.5 text-[11px] text-[#FFD98A] transition-all">
            Commercial Studio ROI
          </button>
          <button class="le-quick-chip shrink-0 bg-[#10153A] hover:bg-[#F5A623]/20 border border-[#F5A623]/30 rounded-full px-3 py-1.5 text-[11px] text-[#FFD98A] transition-all">
            Book Site Visit
          </button>
          <button class="le-quick-chip shrink-0 bg-[#10153A] hover:bg-[#F5A623]/20 border border-[#F5A623]/30 rounded-full px-3 py-1.5 text-[11px] text-[#FFD98A] transition-all">
            Direct Director Call
          </button>
        </div>

        <!-- Lead Capture Bar (Optional quick phone capture) -->
        <div id="le-lead-strip" class="bg-[#10153A]/70 px-4 py-2 border-t border-[#F5A623]/10 flex items-center justify-between text-[11px] text-[#F3EFE4]/80">
          <span class="flex items-center gap-1.5 text-[#FFD98A]">
            <i data-lucide="phone-outgoing" class="w-3.5 h-3.5"></i> Prefer a call back?
          </span>
          <a href="tel:+919696969916" class="text-[#FFD98A] font-bold underline hover:text-white uppercase tracking-wider">
            +91 9696969916
          </a>
        </div>

        <!-- Input Area -->
        <form id="le-ai-form" class="bg-[#0A0E27] p-3 border-t border-[#F5A623]/25 flex items-center gap-2 shrink-0">
          <input id="le-ai-input" type="text" autocomplete="off" placeholder="Ask about plots, villas, shops or returns..." 
            class="flex-1 bg-[#060919] border border-[#F5A623]/30 focus:border-[#F5A623] rounded-full px-4 py-2.5 text-xs text-[#F3EFE4] placeholder-[#F3EFE4]/40 outline-none transition-colors">
          <button type="submit" id="le-ai-send" aria-label="Send message" class="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F5A623] to-[#FFD98A] text-[#060919] flex items-center justify-center font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer">
            <i data-lucide="send" class="w-4 h-4 ml-0.5"></i>
          </button>
        </form>
      </div>

      <!-- ============ FLOATING TRIGGER BUTTON ============ -->
      <button id="le-ai-trigger" type="button" aria-label="Open 24/7 AI Concierge" class="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#0A0E27] via-[#10153A] to-[#0A0E27] border border-[#F5A623]/60 hover:border-[#F5A623] rounded-full p-2.5 sm:px-4 sm:py-3 shadow-[0_8px_30px_rgba(245,166,35,0.35)] transition-all duration-300 hover:scale-105 cursor-pointer">
        <div class="relative w-10 h-10 rounded-full bg-[#F5A623]/20 flex items-center justify-center text-[#FFD98A] le-pulse-slow">
          <i data-lucide="sparkles" class="w-5 h-5 text-[#FFD98A]"></i>
          <span class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#060919]"></span>
        </div>
        <div class="hidden sm:flex flex-col text-left">
          <span class="font-bold text-xs text-[#FFD98A] tracking-wider uppercase flex items-center gap-1">
            24/7 AI Advisor <i data-lucide="chevron-up" class="w-3.5 h-3.5 text-[#F5A623] transition-transform group-hover:-translate-y-0.5"></i>
          </span>
          <span class="text-[10px] text-[#F3EFE4]/70">Online &bull; Instant Answers</span>
        </div>
      </button>
    `;

    document.body.appendChild(container);

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function setupWidgetEvents() {
    const trigger = document.getElementById('le-ai-trigger');
    const win = document.getElementById('le-ai-window');
    const minBtn = document.getElementById('le-ai-minimize');
    const endBtn = document.getElementById('le-ai-end-btn');
    const form = document.getElementById('le-ai-form');
    const input = document.getElementById('le-ai-input');
    const chips = document.querySelectorAll('.le-quick-chip');

    function toggleChat(openState) {
      chatOpen = typeof openState === 'boolean' ? openState : !chatOpen;
      if (chatOpen) {
        win.classList.remove('hidden');
        setTimeout(() => {
          win.classList.remove('opacity-0', 'translate-y-4');
          input.focus();
        }, 20);
        trigger.classList.add('scale-90', 'opacity-80');
      } else {
        win.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => win.classList.add('hidden'), 250);
        trigger.classList.remove('scale-90', 'opacity-80');
      }
    }

    trigger.addEventListener('click', () => toggleChat());
    minBtn.addEventListener('click', () => toggleChat(false));

    // End & Email Transcript
    endBtn.addEventListener('click', () => {
      sendTranscriptToEmail('User manually ended conversation & requested transcript.');
    });

    // Quick chips click
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.textContent.trim();
        input.value = text;
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = input.value.trim();
      if (!message || isGenerating) return;

      input.value = '';
      appendMessage('user', message);
      await generateAIResponse(message);
    });
  }

  function appendMessage(role, text) {
    const messagesBox = document.getElementById('le-ai-messages');
    if (!messagesBox) return;

    const msgRow = document.createElement('div');
    const isBot = role === 'model' || role === 'assistant';

    // Track for lead contact discovery
    detectLeadInformation(text);

    chatHistory.push({
      role: isBot ? 'model' : 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    sessionStorage.setItem('le_ai_chat', JSON.stringify(chatHistory));

    msgRow.className = `flex items-start gap-2.5 ${isBot ? '' : 'justify-end'}`;
    msgRow.innerHTML = isBot ? `
      <div class="w-7 h-7 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 flex items-center justify-center text-[#FFD98A] shrink-0 mt-0.5">
        <i data-lucide="bot" class="w-3.5 h-3.5"></i>
      </div>
      <div class="bg-[#10153A]/90 border border-[#F5A623]/20 rounded-2xl rounded-tl-sm px-4 py-3 text-[#F3EFE4]/90 max-w-[85%] leading-relaxed shadow">
        ${escapeHtml(text)}
      </div>
    ` : `
      <div class="bg-gradient-to-r from-[#F5A623] to-[#FFC152] text-[#060919] font-medium rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] leading-relaxed shadow">
        ${escapeHtml(text)}
      </div>
    `;

    messagesBox.appendChild(msgRow);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    messageCountSinceLastSync++;
    // Auto-sync email every 6 turns to guarantee Laksh Empires gets leads before exit
    if (messageCountSinceLastSync >= 6) {
      sendTranscriptToEmail('Auto-sync checkpoint during active conversation');
      messageCountSinceLastSync = 0;
    }
  }

  function detectLeadInformation(rawText) {
    // Phone detection
    const phoneMatch = rawText.match(/(\+?\d{1,4}[-.\s]?)?(\d{10})/);
    if (phoneMatch && !userProfile.phone) {
      userProfile.phone = phoneMatch[0];
      sessionStorage.setItem('le_ai_user', JSON.stringify(userProfile));
    }
    // Email detection
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !userProfile.email) {
      userProfile.email = emailMatch[0];
      sessionStorage.setItem('le_ai_user', JSON.stringify(userProfile));
    }
  }

  async function generateAIResponse(userQuery) {
    isGenerating = true;
    const messagesBox = document.getElementById('le-ai-messages');

    // Loading indicator bubble
    const loaderRow = document.createElement('div');
    loaderRow.id = 'le-ai-loader';
    loaderRow.className = 'flex items-start gap-2.5';
    loaderRow.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 flex items-center justify-center text-[#FFD98A] shrink-0">
        <i data-lucide="bot" class="w-3.5 h-3.5"></i>
      </div>
      <div class="bg-[#10153A]/90 border border-[#F5A623]/20 rounded-2xl rounded-tl-sm px-4 py-3 text-[#FFD98A] max-w-[85%] flex items-center gap-1.5 text-xs">
        <span class="w-2 h-2 rounded-full bg-[#F5A623] animate-ping"></span> Consulting Laksh Empires records...
      </div>
    `;
    messagesBox.appendChild(loaderRow);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

      // Build conversation contents matching Gemini standard
      const conversationContents = chatHistory.slice(-8).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      // Append current user query
      conversationContents.push({
        role: 'user',
        parts: [{ text: userQuery }]
      });

      const payload = {
        contents: conversationContents,
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        }
      };

      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        "Thank you for your interest. For immediate property booking and registry papers, you can speak directly with Founding Director Lakshay Dawar at +91 9696969916.";

      loaderRow.remove();
      appendMessage('model', botText);

    } catch (err) {
      console.warn('AI Assistant fallback active', err);
      loaderRow.remove();
      appendMessage('model', "I would be delighted to assist you with plots, apartments or commercial properties across YEIDA, GNIDA and Noida. Please connect directly with our desk at +91 9696969916 or share your contact number here.");
    } finally {
      isGenerating = false;
    }
  }

  async function sendTranscriptToEmail(triggerReason = 'Automatic Background Sync') {
    if (chatHistory.length < 2) return; // Don't send empty sessions

    let transcriptTable = `
=== LAKSH EMPIRES 24/7 AI CHAT TRANSCRIPT ===
Generated At: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Trigger Reason: ${triggerReason}
Captured Contact: Phone: ${userProfile.phone || 'Not directly provided'} | Email: ${userProfile.email || 'Not directly provided'}

--- CONVERSATION LOG ---
`;

    chatHistory.forEach(item => {
      const speaker = item.role === 'user' ? 'CLIENT' : 'LAKSH EMPIRES AI';
      transcriptTable += `[${item.timestamp || ''}] ${speaker}:\n${item.text}\n\n`;
    });

    transcriptTable += `\n==========================================\nLaksh Empires Real Estate Advisory Desk`;

    try {
      const formPayload = new FormData();
      formPayload.append('_subject', `New 24/7 AI Chat Lead (${userProfile.phone || 'Visitor'}) — Laksh Empires`);
      formPayload.append('_template', 'table');
      formPayload.append('_captcha', 'false');
      formPayload.append('Client_Contact', userProfile.phone || 'Visitor in Web Session');
      formPayload.append('Client_Email', userProfile.email || 'None provided');
      formPayload.append('Sync_Reason', triggerReason);
      formPayload.append('Chat_Transcript', transcriptTable);

      // Submit silently to FormSubmit
      await fetch(`https://formsubmit.co/${TARGET_EMAIL}`, {
        method: 'POST',
        body: formPayload,
        headers: { 'Accept': 'application/json' }
      });

      transcriptSent = true;
      showNotification("Conversation log synced with Laksh Empires desk.");
    } catch (err) {
      console.debug('Transcript sync status:', err);
    }
  }

  function showNotification(msg) {
    const toast = document.getElementById('le-ai-toast');
    if (toast) {
      toast.textContent = msg;
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 4000);
    }
  }

  async function fetchWithRetry(url, options, retries = 2, delay = 1000) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      return res;
    } catch (e) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw e;
    }
  }

  function escapeHtml(string) {
    const div = document.createElement('div');
    div.innerText = string;
    return div.innerHTML;
  }

  // Automatic transcript dispatch on tab visibility change or window unload
  window.addEventListener('beforeunload', () => {
    if (chatHistory.length >= 2 && !transcriptSent) {
      sendTranscriptToEmail('Visitor leaving website page');
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && chatHistory.length >= 2) {
      sendTranscriptToEmail('Visitor switched tab / minimized browser');
    }
  });

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectStylesAndMarkup();
      setupWidgetEvents();
    });
  } else {
    injectStylesAndMarkup();
    setupWidgetEvents();
  }
})();