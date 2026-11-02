((): void => {
  type Role = 'user' | 'assistant';
  type Message = { role: Role; content: string; attachments?: string[] };
  type ChatSession = { id: string; title: string; updatedAt: number; messages: Message[] };

  const getElement = <T extends Element>(selector: string): T => {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Required chatbot element not found: ${selector}`);
    return element;
  };
  const getById = <T extends HTMLElement>(id: string): T => {
    const element = document.getElementById(id) as T | null;
    if (!element) throw new Error(`Required chatbot element not found: #${id}`);
    return element;
  };

  const video = getById<HTMLVideoElement>('hero-motion');
  const quote = getElement<HTMLElement>('.quote-line');
  const input = getElement<HTMLInputElement>('.message');
  const messagesNode = getById<HTMLDivElement>('messages');
  const conversation = getElement<HTMLElement>('.conversation');
  const form = getElement<HTMLFormElement>('.chat-dock');
  const historyPanel = getById<HTMLElement>('history-panel');
  const settingsPanel = getById<HTMLElement>('settings-panel');
  const scrim = getById<HTMLDivElement>('panel-scrim');
  const historyList = getById<HTMLDivElement>('history-list');
  const historySearch = getById<HTMLInputElement>('history-search');
  const nameSetting = getById<HTMLInputElement>('name-setting');
  const fileInput = getById<HTMLInputElement>('file-input');
  const attachmentList = getById<HTMLDivElement>('attachment-list');
  const attachButton = getById<HTMLButtonElement>('attach-trigger');
  const mascotMotion = getById<HTMLDivElement>('mascot-motion');
  let pendingReplies = 0;

  const quotes: string[] = [
    'Ready when you are.',
    'The world needs your inputs to function. You can’t quit now.',
    'Your next idea might change everything.',
    'One small step can change the whole day.',
    'Take a breath. Then make something brilliant.',
    'You’ve got this. The future is rooting for you.'
  ];
  const CHAT_STORAGE_KEY = 'trinty-chats';
  const ACTIVE_STORAGE_KEY = 'trinty-active-chat';
  let name = '';
  let activeChatId = '';
  let chats: ChatSession[] = [];
  let selectedFiles: File[] = [];
  try {
    name = localStorage.getItem('trinty-name') || '';
    chats = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]') as ChatSession[];
    activeChatId = localStorage.getItem(ACTIVE_STORAGE_KEY) || '';
    if (!Array.isArray(chats)) chats = [];
  } catch {
    chats = [];
    activeChatId = '';
  }

  const activeChat = (): ChatSession | undefined => chats.find((chat) => chat.id === activeChatId);
  const safeSave = (): void => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats));
      if (activeChatId) localStorage.setItem(ACTIVE_STORAGE_KEY, activeChatId);
      else localStorage.removeItem(ACTIVE_STORAGE_KEY);
    } catch {
      // The interface remains usable when storage is unavailable or full.
    }
  };
  const scrollToLatest = (): void => {
    conversation.scrollTop = conversation.scrollHeight;
  };
  const appendMessage = (role: Role, text: string, attachedFiles: string[] = [], typing = false): HTMLDivElement => {
    const row = document.createElement('div');
    row.className = `message-row ${role}${typing ? ' typing' : ''}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    if (attachedFiles.length) {
      const attachmentGroup = document.createElement('div');
      attachmentGroup.className = 'message-attachments';
      attachedFiles.forEach((fileName) => {
        const item = document.createElement('span');
        item.className = 'message-attachment';
        item.textContent = fileName;
        attachmentGroup.appendChild(item);
      });
      bubble.appendChild(attachmentGroup);
    }
    row.appendChild(bubble);
    messagesNode.appendChild(row);
    return row;
  };
  const renderMessages = (items: Message[], typing = false): void => {
    messagesNode.replaceChildren();
    items.forEach((message) => appendMessage(message.role, message.content, message.attachments || []));
    if (typing) appendMessage('assistant', 'Thinking…', [], true);
    requestAnimationFrame(scrollToLatest);
  };
  const renderAttachmentQueue = (): void => {
    attachmentList.replaceChildren();
    selectedFiles.forEach((file, index) => {
      const chip = document.createElement('div');
      chip.className = 'attachment-chip';
      const fileName = document.createElement('span');
      fileName.className = 'attachment-name';
      fileName.textContent = file.name;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'attachment-remove';
      remove.dataset.removeAttachment = String(index);
      remove.setAttribute('aria-label', `Remove ${file.name}`);
      remove.textContent = '×';
      chip.append(fileName, remove);
      attachmentList.appendChild(chip);
    });
  };
  const homeGreeting = (): string => name ? `Good morning, ${name}.` : 'Ready when you are.';
  const renderHome = (): void => {
    activeChatId = '';
    document.body.classList.remove('chat-active');
    safeSave();
    messagesNode.replaceChildren();
    quote.textContent = homeGreeting();
    input.value = '';
    selectedFiles = [];
    fileInput.value = '';
    renderAttachmentQueue();
    renderHistory();
  };

  const renderHistory = (): void => {
    const query = historySearch.value.trim().toLowerCase();
    const visibleChats = [...chats]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .filter((chat) => !query || chat.title.toLowerCase().includes(query) || chat.messages.some((message) => message.content.toLowerCase().includes(query)));
    historyList.replaceChildren();
    if (!visibleChats.length) {
      const empty = document.createElement('p');
      empty.className = 'history-empty';
      empty.textContent = query ? 'No chats match your search.' : 'Your conversations will show up here.';
      historyList.appendChild(empty);
      return;
    }
    visibleChats.forEach((chat) => {
      const row = document.createElement('div');
      row.className = `history-item${chat.id === activeChatId ? ' is-current' : ''}`;
      const openButton = document.createElement('button');
      openButton.className = 'history-open-item';
      openButton.type = 'button';
      openButton.dataset.chatId = chat.id;
      openButton.textContent = chat.title;
      const deleteButton = document.createElement('button');
      deleteButton.className = 'history-delete';
      deleteButton.type = 'button';
      deleteButton.dataset.deleteChat = chat.id;
      deleteButton.setAttribute('aria-label', `Delete ${chat.title}`);
      deleteButton.textContent = '×';
      row.append(openButton, deleteButton);
      historyList.appendChild(row);
    });
  };

  const closePanels = (): void => {
    historyPanel.classList.remove('is-open');
    settingsPanel.classList.remove('is-open');
    historyPanel.setAttribute('aria-hidden', 'true');
    settingsPanel.setAttribute('aria-hidden', 'true');
    scrim.hidden = true;
  };
  const openPanel = (panel: HTMLElement): void => {
    closePanels();
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    scrim.hidden = false;
    if (panel === settingsPanel) nameSetting.value = name;
    if (panel === historyPanel) renderHistory();
  };
  const openChat = (chatId: string): void => {
    const chat = chats.find((item) => item.id === chatId);
    if (!chat) return;
    activeChatId = chat.id;
    safeSave();
    document.body.classList.add('chat-active');
    renderMessages(chat.messages);
    renderHistory();
    closePanels();
    input.focus();
  };
  const newChat = (): void => {
    closePanels();
    renderHome();
    input.focus();
  };

  let quoteIndex = 0;
  const rotateQuote = (): void => {
    quote.classList.add('is-changing');
    window.setTimeout(() => {
      quoteIndex = (quoteIndex + 1) % (quotes.length + (name ? 1 : 0));
      quote.textContent = name && quoteIndex === quotes.length ? `Good morning, ${name}.` : quotes[quoteIndex];
      quote.classList.remove('is-changing');
    }, 560);
  };
  window.setInterval(rotateQuote, 4800);

  const keepPlaying = (): void => {
    if (document.visibilityState === 'visible' && video.paused) void video.play().catch(() => undefined);
  };
  video.addEventListener('canplay', keepPlaying);
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    keepPlaying();
  });
  document.addEventListener('visibilitychange', keepPlaying);
  window.setInterval(() => {
    if (document.visibilityState === 'visible' && video.readyState >= 2) keepPlaying();
  }, 2500);
  void video.play().catch(() => undefined);

  const makeReply = (text: string): string => {
    const lower = text.toLowerCase();
    const nameMatch = text.match(/(?:my name is|i am|i'm|call me)\s+([a-z][a-z' -]{0,30})/i);
    if (nameMatch) {
      name = nameMatch[1].trim().replace(/[<>]/g, '').slice(0, 32);
      try { localStorage.setItem('trinty-name', name); } catch { /* Session-only name. */ }
      return `Good morning, ${name}. What would you like to work on?`;
    }
    if (/\b(drone|uav|quad(copter)?|multirotor)\b/.test(lower)) {
      const size = /\b30\s*(?:by|x|×)\s*30\s*cm\b/.test(lower);
      return size
        ? 'A 30 × 30 cm drone is a good starting envelope. What will it carry, how long should it fly, where will it operate, and what is your budget?'
        : 'I can help plan the drone. What size, payload, flight time, operating environment, and budget should I design around?';
    }
    if (/\b(good morning|hello|hi|hey)\b/.test(lower)) return name ? `Good morning, ${name}. What can I help you figure out today?` : 'Hey! What are you hoping to build or solve today?';
    if (/\b(thanks|thank you)\b/.test(lower)) return 'You’re welcome. What would you like to work on next?';
    return 'Tell me what you want to make, what it needs to do, and any limits I should keep in mind.';
  };

  form.addEventListener('submit', (event: SubmitEvent) => {
    event.preventDefault();
    const entered = input.value.trim();
    const attachedFiles = [...selectedFiles];
    if (!entered && !attachedFiles.length) return;
    const messageText = entered || 'Please take a look at these files.';
    const attachmentNames = attachedFiles.map((file) => file.name);
    let chat = activeChat();
    if (!chat) {
      chat = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: (entered || attachmentNames[0] || 'New chat').slice(0, 48), updatedAt: Date.now(), messages: [] };
      chats.push(chat);
      activeChatId = chat.id;
    }
    document.body.classList.add('chat-active');
    pendingReplies += 1;
    mascotMotion.dataset.state = 'working';
    chat.messages.push({ role: 'user', content: messageText, ...(attachmentNames.length ? { attachments: attachmentNames } : {}) });
    chat.updatedAt = Date.now();
    safeSave();
    renderMessages(chat.messages, true);
    renderHistory();
    const responseChatId = chat.id;
    selectedFiles = [];
    fileInput.value = '';
    renderAttachmentQueue();
    input.value = '';
    input.focus();
    window.setTimeout(() => {
      const current = chats.find((item) => item.id === responseChatId);
      if (current) {
        const reply = attachmentNames.length
          ? `I can see ${attachmentNames.length} attached file name${attachmentNames.length === 1 ? '' : 's'}. File contents are not analyzed by this frontend yet.` + (entered ? ` ${makeReply(entered)}` : ' What would you like to do with them?')
          : makeReply(entered);
        current.messages.push({ role: 'assistant', content: reply });
        current.updatedAt = Date.now();
        safeSave();
        if (activeChatId === responseChatId) renderMessages(current.messages);
        renderHistory();
      }
      pendingReplies = Math.max(0, pendingReplies - 1);
      if (pendingReplies === 0) mascotMotion.dataset.state = 'idle';
    }, 1600);
  });

  attachButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const incomingFiles = Array.from(fileInput.files || []);
    incomingFiles.forEach((file) => {
      const alreadySelected = selectedFiles.some((existing) => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified);
      if (!alreadySelected) selectedFiles.push(file);
    });
    fileInput.value = '';
    renderAttachmentQueue();
    if (selectedFiles.length) input.focus();
  });
  attachmentList.addEventListener('click', (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const removeButton = target.closest<HTMLButtonElement>('[data-remove-attachment]');
    if (!removeButton) return;
    const index = Number(removeButton.dataset.removeAttachment);
    if (Number.isInteger(index)) selectedFiles.splice(index, 1);
    renderAttachmentQueue();
  });

  getById<HTMLButtonElement>('history-open').addEventListener('click', () => openPanel(historyPanel));
  getById<HTMLButtonElement>('settings-open').addEventListener('click', () => openPanel(settingsPanel));
  getById<HTMLButtonElement>('new-chat').addEventListener('click', newChat);
  getById<HTMLButtonElement>('panel-new-chat').addEventListener('click', newChat);
  document.querySelectorAll<HTMLButtonElement>('[data-close-panel]').forEach((button) => button.addEventListener('click', closePanels));
  scrim.addEventListener('click', closePanels);
  historySearch.addEventListener('input', renderHistory);
  historyList.addEventListener('click', (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const deleteButton = target.closest<HTMLButtonElement>('[data-delete-chat]');
    if (deleteButton) {
      const chatId = deleteButton.dataset.deleteChat || '';
      const chat = chats.find((item) => item.id === chatId);
      if (!chat || !window.confirm(`Delete “${chat.title}”?`)) return;
      chats = chats.filter((item) => item.id !== chatId);
      if (activeChatId === chatId) renderHome();
      safeSave();
      renderHistory();
      return;
    }
    const openButton = target.closest<HTMLButtonElement>('[data-chat-id]');
    if (openButton?.dataset.chatId) openChat(openButton.dataset.chatId);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-prompt]').forEach((button) => {
    button.addEventListener('click', () => {
      input.value = button.dataset.prompt || '';
      form.requestSubmit();
    });
  });
  getById<HTMLButtonElement>('save-name').addEventListener('click', () => {
    name = nameSetting.value.trim().replace(/[<>]/g, '').slice(0, 32);
    try {
      if (name) localStorage.setItem('trinty-name', name);
      else localStorage.removeItem('trinty-name');
    } catch { /* Keep the preference for this session. */ }
    quote.textContent = homeGreeting();
    closePanels();
  });
  getById<HTMLButtonElement>('clear-history').addEventListener('click', () => {
    if (!chats.length || !window.confirm('Clear all saved chats on this device?')) return;
    chats = [];
    renderHome();
    renderHistory();
  });
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') closePanels();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openPanel(historyPanel);
      historySearch.focus();
    }
  });

  const savedChat = activeChat();
  if (savedChat) {
    document.body.classList.add('chat-active');
    renderMessages(savedChat.messages);
  } else {
    activeChatId = '';
    messagesNode.replaceChildren();
    quote.textContent = homeGreeting();
  }
  nameSetting.value = name;
  renderHistory();
  renderAttachmentQueue();
})();
