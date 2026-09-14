/**
 * Laksh Empires — 24/7 Luxury AI Real Estate Concierge & Auto Lead Dispatch
 * Built with Conversational Lead Intelligence & Automatic Email Sync.
 */

(function () {
  const TARGET_EMAIL = "lakshempires@gmail.com";
  const DIRECT_PHONE = "+91 9696969916";

  let chatOpen = false;
  let chatHistory = [];
  let userProfile = { name: '', phone: '', email: '', requirement: '', budget: '', location: '' };
  let transcriptSent = false;
  let messageCountSinceLastSync = 0;

  // Restore prior session history
  try {
    const savedChat = sessionStorage.getItem('le_ai_chat');
    if (savedChat) chatHistory = JSON.parse(savedChat);
    const savedUser = sessionStorage.getItem('le_ai_user');
    if (savedUser) userProfile = JSON.parse(savedUser);
  } catch (e) {
    console.debug('Storage access warning', e);
  }

  function injectStylesAndMarkup() {
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

    const container = document.createElement('div');
    container.id = 'le-ai-widget';
    container.className = 'fixed bottom-5 right-5 z-[9999] font-sans antialiased';

    container.innerHTML = `
      <!-- ============ EXPANDABLE CHAT WINDOW ============ -->
      <div id="le-ai-window" class="hidden opacity-0 translate-y-4 fixed sm:absolute bottom-0 sm:bottom-20 right-0 sm:right-0 w-full sm:w-[420px] h-[90vh] sm:h-[600px] max-h-[92vh] bg-[#060919]/95 backdrop-blur-xl border border-[#F5A623]/30 rounded-t-3xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-[#F3EFE4]">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-[#0A0E27] via-[#10153A] to-[#0A0E27] px-5 py-4 border-b border-[#F5A623]/25 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="relative w-10 h-10 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/40 flex items-center justify-center p-1 shadow-inner">
              <img src="ku-removebg-preview.png" alt="Laksh Empires Logo" class="w-full h-full object-contain" />
              <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#060919]"></span>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-display font-extrabold text-base sm:text-lg text-gold-500 uppercase">LAKSH EMPIRES</span>
                <span class="text-[9px] font-bold bg-[#F5A623]/20 text-[#FFD98A] px-1.5 py-0.5 rounded uppercase">24/7 AI</span>
              </div>
              <p class="text-[11px] text-cream/60 tracking-wider">Laksh Empires Real Estate Advisor</p>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button id="le-ai-end-btn" title="End & Email Transcript" class="p-2 rounded-lg text-[#F3EFE4]/60 hover:text-[#FFD98A] hover:bg-[#F5A623]/10 transition-colors text-xs flex items-center gap-1 cursor-pointer">
              <i data-lucide="mail-check" class="w-4 h-4"></i>
            </button>
            <button id="le-ai-minimize" class="p-2 rounded-lg text-[#F3EFE4]/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
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
          <!-- Welcome Message -->
          <div class="flex items-start gap-2.5">
            <div class="w-7 h-7 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 flex items-center justify-center text-[#FFD98A] shrink-0 mt-0.5 p-1">
              <img src="ku-removebg-preview.png" alt="Laksh Logo" class="w-full h-full object-contain" />
            </div>
            <div class="bg-[#10153A]/90 border border-[#F5A623]/20 rounded-2xl rounded-tl-sm px-4 py-3 text-[#F3EFE4]/90 max-w-[85%] leading-relaxed shadow">
              Namaste! Welcome to <strong class="text-[#FFD98A]">Laksh Empires</strong>. I am your 24/7 Property Advisor. Are you looking to buy, sell, or invest in <strong class="text-[#FFD98A]">NOIDA · G.NOIDA · YEIDA · DELHI NCR,  Commercial Shops/Studios, or Luxury Villas</strong> today?
            </div>
          </div>
        </div>

        <!-- Quick Suggestion Chips -->
        <div class="px-4 py-2 bg-[#0A0E27]/80 border-t border-[#F5A623]/15 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button class="le-quick-chip shrink-0 bg-[#10153A] hover:bg-[#F5A623]/20 border border-[#F5A623]/30 rounded-full px-3 py-1.5 text-[11px] text-[#FFD98A] transition-all cursor-pointer">
            YEIDA Plots Sector 18/20
          </button>
          <button class="le-quick-chip shrink-0 bg-[#10153A] hover:bg-[#F5A623]/20 border border-[#F5A623]/30 rounded-full px-3 py-1.5 text-[11px] text-[#FFD98A] transition-all cursor-pointer">
            Commercial Studio / Shop Space
          </button>
          <button class="le-quick-chip shrink-0 bg-[#10153A] hover:bg-[#F5A623]/20 border border-[#F5A623]/30 rounded-full px-3 py-1.5 text-[11px] text-[#FFD98A] transition-all cursor-pointer">
            Luxury Villas in Greater Noida
          </button>
          <button class="le-quick-chip shrink-0 bg-[#10153A] hover:bg-[#F5A623]/20 border border-[#F5A623]/30 rounded-full px-3 py-1.5 text-[11px] text-[#FFD98A] transition-all cursor-pointer">
            Book Site Visit
          </button>
        </div>

        <!-- Lead Strip -->
        <div id="le-lead-strip" class="bg-[#10153A]/70 px-4 py-2 border-t border-[#F5A623]/10 flex items-center justify-between text-[11px] text-[#F3EFE4]/80">
          <span class="flex items-center gap-1.5 text-[#FFD98A]">
            <i data-lucide="phone-call" class="w-3.5 h-3.5"></i> Call Advisor Directly:
          </span>
          <a href="tel:+919696969916" class="text-[#FFD98A] font-bold underline hover:text-white uppercase tracking-wider">
            ${DIRECT_PHONE}
          </a>
        </div>

        <!-- Input Area -->
        <form id="le-ai-form" class="bg-[#0A0E27] p-3 border-t border-[#F5A623]/25 flex items-center gap-2 shrink-0">
          <input id="le-ai-input" type="text" autocomplete="off" placeholder="Type here (e.g. villa chahiye, budget 1 crore)..." 
            class="flex-1 bg-[#060919] border border-[#F5A623]/30 focus:border-[#F5A623] rounded-full px-4 py-2.5 text-xs text-[#F3EFE4] placeholder-[#F3EFE4]/40 outline-none transition-colors">
          <button type="submit" id="le-ai-send" aria-label="Send message" class="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F5A623] to-[#FFD98A] text-[#060919] flex items-center justify-center font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer">
            <i data-lucide="send" class="w-4 h-4 ml-0.5"></i>
          </button>
        </form>
      </div>

      <!-- ============ FLOATING TRIGGER BUTTON ============ -->
      <button id="le-ai-trigger" type="button" aria-label="Open 24/7 AI Concierge" class="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#0A0E27] via-[#10153A] to-[#0A0E27] border border-[#F5A623]/60 hover:border-[#F5A623] rounded-full p-2.5 sm:px-4 sm:py-3 shadow-[0_8px_30px_rgba(245,166,35,0.35)] transition-all duration-300 hover:scale-105 cursor-pointer">
        <div class="relative w-10 h-10 rounded-full bg-[#F5A623]/20 flex items-center justify-center text-[#FFD98A] le-pulse-slow p-1">
          <img src="ku-removebg-preview.png" alt="Laksh Logo" class="w-full h-full object-contain" />
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

    endBtn.addEventListener('click', () => {
      sendTranscriptToEmail('User manually ended conversation & requested transcript.');
    });

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.textContent.trim();
        input.value = text;
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = input.value.trim();
      if (!message) return;

      input.value = '';
      appendMessage('user', message);

      // Conversational typing simulation
      showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator();
        const response = generateConversationalResponse(message);
        appendMessage('model', response);
      }, 700);
    });
  }

  function appendMessage(role, text) {
    const messagesBox = document.getElementById('le-ai-messages');
    if (!messagesBox) return;

    const msgRow = document.createElement('div');
    const isBot = role === 'model' || role === 'assistant';

    detectLeadInformation(text);

    chatHistory.push({
      role: isBot ? 'model' : 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    sessionStorage.setItem('le_ai_chat', JSON.stringify(chatHistory));

    msgRow.className = `flex items-start gap-2.5 ${isBot ? '' : 'justify-end'}`;
    msgRow.innerHTML = isBot ? `
      <div class="w-7 h-7 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 flex items-center justify-center text-[#FFD98A] shrink-0 mt-0.5 p-1">
        <img src="ku-removebg-preview.png" alt="Laksh Logo" class="w-full h-full object-contain" />
      </div>
      <div class="bg-[#10153A]/90 border border-[#F5A623]/20 rounded-2xl rounded-tl-sm px-4 py-3 text-[#F3EFE4]/90 max-w-[85%] leading-relaxed shadow">
        ${escapeHtml(text).replace(/\n/g, '<br>')}
      </div>
    ` : `
      <div class="bg-gradient-to-r from-[#F5A623] to-[#FFC152] text-[#060919] font-medium rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] leading-relaxed shadow">
        ${escapeHtml(text)}
      </div>
    `;

    messagesBox.appendChild(msgRow);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    messageCountSinceLastSync++;
    if (messageCountSinceLastSync >= 4) {
      sendTranscriptToEmail('Auto-sync during active chat');
      messageCountSinceLastSync = 0;
    }
  }

  function showTypingIndicator() {
    const messagesBox = document.getElementById('le-ai-messages');
    if (!messagesBox) return;
    const loaderRow = document.createElement('div');
    loaderRow.id = 'le-ai-loader';
    loaderRow.className = 'flex items-start gap-2.5';
    loaderRow.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 flex items-center justify-center p-1 shrink-0">
        <img src="ku-removebg-preview.png" class="w-full h-full object-contain" />
      </div>
      <div class="bg-[#10153A]/90 border border-[#F5A623]/20 rounded-2xl rounded-tl-sm px-4 py-2.5 text-[#FFD98A] max-w-[85%] flex items-center gap-1.5 text-xs">
        <span class="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-ping"></span> Laksh Empires Advisor typing...
      </div>
    `;
    messagesBox.appendChild(loaderRow);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  function removeTypingIndicator() {
    const loader = document.getElementById('le-ai-loader');
    if (loader) loader.remove();
  }

  function detectLeadInformation(rawText) {
    const phoneMatch = rawText.match(/(\+?\d{1,4}[-.\s]?)?(\d{10})/);
    if (phoneMatch && !userProfile.phone) {
      userProfile.phone = phoneMatch[0].replace(/[^0-9]/g, '');
    }
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !userProfile.email) {
      userProfile.email = emailMatch[0];
    }
    if (!userProfile.name) {
      const nameMatch = rawText.match(/(?:my name is|i am|naam|mera naam|myself)\s+([a-zA-Z\s]{2,25})/i);
      if (nameMatch) userProfile.name = nameMatch[1].trim();
    }
    sessionStorage.setItem('le_ai_user', JSON.stringify(userProfile));
  }

  // ================= SMART HUMAN-LIKE CONVERSATIONAL ENGINE =================
  function generateConversationalResponse(userInput) {
    const text = userInput.toLowerCase();

    // 1. Phone number or Contact Shared
    if (userProfile.phone && (text.includes(userProfile.phone) || /\d{10}/.test(text))) {
      sendTranscriptToEmail('Client shared contact number in chat');
      return `Thank you! I have registered your number (${userProfile.phone}) with our direct desk. Our Founding Director Lakshay Dawar or a senior portfolio advisor will call you shortly to discuss verified options. What time today or tomorrow would you prefer for a quick discussion?`;
    }

    // 2. Name given
    if (text.startsWith('my name is') || text.includes('mera naam') || /^[a-z]{3,15}\s[a-z]{3,15}$/i.test(userInput.trim())) {
      const name = userInput.replace(/(my name is|mera naam|i am)/gi, '').trim();
      userProfile.name = name;
      return `Pleasure connecting with you, ${name}! Are you looking for property in YEIDA (Yamuna Expressway near Jewar Airport), Greater Noida, or Noida? And what is your target budget range?`;
    }

    // 3. Villa Inquiry
    if (text.includes('villa') || text.includes('kothi') || text.includes('bungalow') || text.includes('independent house')) {
      userProfile.requirement = 'Luxury Villa';
      return `We have prime Luxury Villas available:
• Ready-to-move designer villas in Alpha-2, Greater Noida
• Custom turnkey villa construction across YEIDA & Noida Sector 150

Are you looking for a ready-to-move villa or ground-up construction? Also, please share your expected budget and 10-digit WhatsApp number so I can send the detailed layouts and videos.`;
    }

    // 4. Commercial Shops / Studio Spaces
    if (text.includes('shop') || text.includes('studio') || text.includes('commercial') || text.includes('retail') || text.includes('office')) {
      userProfile.requirement = 'Commercial Space';
      return `For Commercial investments, Laksh Empires offers high-yield properties:
1. High-Footfall Retail Shops in Noida & YEIDA business sectors (immediate registry).
2. Fully Furnished Commercial Studio Apartments with strong rental yields.

Which one fits your plan better — a retail shop for business/rental or a studio apartment for passive ROI? What is your budget bracket?`;
    }

    // 5. Plots / Land (YEIDA, Authority plots)
    if (text.includes('plot') || text.includes('land') || text.includes('yeida') || text.includes('sector 18') || text.includes('sector 20') || text.includes('zamin') || text.includes('zameen')) {
      userProfile.requirement = 'Plots / Land';
      return `Laksh Empires is a specialized authority in YEIDA & Greater Noida plots:
• 120, 300, 500, 1000, and 2000+ sq. mtr clear-title plots in YEIDA Sectors 16, 17, 18, 20 & 22D (close to the upcoming Jewar International Airport).
• 100% verified documentation and legal due diligence.

What size plot are you considering, and are you planning this for immediate construction or 2-3 year investment?`;
    }

    // 6. Flats / Apartments
    if (text.includes('flat') || text.includes('apartment') || text.includes('bhk') || text.includes('2bhk') || text.includes('3bhk') || text.includes('4bhk')) {
      userProfile.requirement = 'Apartment';
      return `We deal in verified premium 2, 3, and 4 BHK gated apartments across Noida, Greater Noida, and Delhi NCR with verified paperwork and clear titles.

Are you looking for ready-to-move or under-construction projects, and what is your preferred location?`;
    }

    // 7. Construction / Interiors / Renovation
    if (text.includes('construct') || text.includes('build') || text.includes('interior') || text.includes('renovate') || text.includes('naksha') || text.includes('thekedaar')) {
      userProfile.requirement = 'Construction / Interior';
      return `Under the leadership of Founding Director Lakshay Dawar, Laksh Empires executes turnkey luxury construction:
• Ground-up villa and independent floor construction (A-grade materials, on-site supervision).
• Bespoke luxury interior architecture and space planning.

Where is your plot/site located, and what is the approximate plot area?`;
    }

    // 8. Budget Mentioned
    if (text.includes('crore') || text.includes('cr') || text.includes('lakh') || text.includes('lacs') || /\d+\s*(k|l|cr)/i.test(text)) {
      userProfile.budget = userInput;
      return `Noted! A budget of ${userInput} opens up excellent prime options with strong appreciation potential in the Noida & YEIDA express corridors.

To share the verified shortlist and legal document check directly on WhatsApp, could you please share your name and 10-digit mobile number?`;
    }

    // 9. Site Visit or Meeting Request
    if (text.includes('visit') || text.includes('dekhna') || text.includes('meet') || text.includes('milna') || text.includes('office') || text.includes('address')) {
      return `We would be honored to host you! Our office is located at D-39, Block D, Alpha I, Greater Noida. We also organize personalized on-ground site visits across YEIDA Sectors & Noida.

What date works best for you? Please share your mobile number so our team can coordinate the visit.`;
    }

    // 10. Greetings & Casual Queries
    if (text.includes('hi') || text.includes('hello') || text.includes('hey') || text.includes('namaste')) {
      return `Hello! How can Laksh Empires assist you today? We specialize in YEIDA Plots (Sector 18/20/22D), Commercial Shops/Studios, and Luxury Villa Builds. Tell me what type of property you are exploring!`;
    }

    // Default Conversational Fallback (Always engaging, never static robotic block)
    return `Laksh Empires provides end-to-end advisory across YEIDA, Greater Noida, and Noida — covering Plots, Premium Apartments, Commercial Spaces, and Construction.

Could you tell me a little more about what you are looking for (e.g., plot size, budget, or preferred sector) so I can guide you accurately? Or leave your number and our team will call you directly.`;
  }

  async function sendTranscriptToEmail(triggerReason = 'Automatic Background Sync') {
    if (chatHistory.length < 2) return;

    let transcriptTable = `
=== LAKSH EMPIRES 24/7 AI CHAT LEAD TRANSCRIPT ===
Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Trigger Reason: ${triggerReason}
Captured Lead Details:
- Name: ${userProfile.name || 'Not provided'}
- Phone: ${userProfile.phone || 'Not directly provided'}
- Email: ${userProfile.email || 'Not provided'}
- Requirement: ${userProfile.requirement || 'General Inquiry'}
- Budget: ${userProfile.budget || 'Not specified'}

--- CONVERSATION LOG ---
`;

    chatHistory.forEach(item => {
      const speaker = item.role === 'user' ? 'CLIENT' : 'LAKSH EMPIRES ADVISOR';
      transcriptTable += `[${item.timestamp || ''}] ${speaker}:\n${item.text}\n\n`;
    });

    transcriptTable += `\n==========================================\nLaksh Empires Luxury Real Estate Desk`;

    try {
      const formPayload = new FormData();
      formPayload.append('_subject', `New 24/7 AI Chat Lead (${userProfile.phone || userProfile.name || 'Visitor'}) — Laksh Empires`);
      formPayload.append('_template', 'table');
      formPayload.append('_captcha', 'false');
      formPayload.append('Client_Name', userProfile.name || 'Website Visitor');
      formPayload.append('Client_Contact', userProfile.phone || 'Visitor in Session');
      formPayload.append('Client_Email', userProfile.email || 'None');
      formPayload.append('Interested_Property', userProfile.requirement || 'General Real Estate');
      formPayload.append('Chat_Transcript', transcriptTable);

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
      setTimeout(() => toast.classList.add('hidden'), 3500);
    }
  }

  function escapeHtml(string) {
    const div = document.createElement('div');
    div.innerText = string;
    return div.innerHTML;
  }

  // Auto transcript dispatch on tab close
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