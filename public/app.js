/**
 * QORVEX — Enterprise AI Connector Frontend Client
 * Organization: Virtual Galaxy Infotech Limited (VGIL)
 * Security: Strict server-side isolation, no client credentials
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM References
  const navButtons = document.querySelectorAll(".nav-item");
  const viewPanels = document.querySelectorAll(".view-panel");
  const topbarTitle = document.getElementById("topbar-title");
  const topbarStatusText = document.getElementById("topbar-status-text");
  const mobileToggle = document.getElementById("mobile-toggle");
  const sidebar = document.getElementById("sidebar");

  // Chat Elements
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const charCount = document.getElementById("char-count");
  const btnNewChat = document.getElementById("btn-new-chat");
  const btnSend = document.getElementById("btn-send");

  // Search Elements
  const searchInput = document.getElementById("knowledge-search-input");
  const searchClearBtn = document.getElementById("search-clear-btn");
  const searchFilterChips = document.querySelectorAll(".filter-chip");
  const searchResultsContainer = document.getElementById("search-results-container");
  const searchResultsMeta = document.getElementById("search-results-meta");
  const resultsCountText = document.getElementById("results-count-text");

  // Catalog Elements
  const catalogGrid = document.getElementById("catalog-grid");
  const catalogTabs = document.querySelectorAll(".tab-btn");
  const countAll = document.getElementById("count-all");
  const countProducts = document.getElementById("count-products");
  const countServices = document.getElementById("count-services");
  const navCatalogCount = document.getElementById("nav-catalog-count");

  // Status Elements
  const kpiServiceStatus = document.getElementById("kpi-service-status");
  const kpiServiceMode = document.getElementById("kpi-service-mode");
  const kpiRecordsCount = document.getElementById("kpi-records-count");
  const kpiLlmStatus = document.getElementById("kpi-llm-status");
  const kpiLlmModel = document.getElementById("kpi-llm-model");
  const sidebarModelName = document.getElementById("sidebar-model-name");
  const categoryBars = document.getElementById("category-bars");
  const btnRefreshStatus = document.getElementById("btn-refresh-status");

  // Runtime API Configuration (Railway or Same-Origin)
  const API_BASE = (window.QORVEX_CONFIG?.API_BASE_URL || "").trim().replace(/\/+$/, "");

  // State
  let currentView = "chat";
  let activeSearchCategory = "";
  let searchDebounceTimer = null;
  let catalogItems = [];
  let isChatLoading = false;

  // View Names
  const viewTitles = {
    chat: "AI Assistant",
    search: "Knowledge Search",
    catalog: "Products & Services",
    mcp: "MCP Integration",
    status: "System Status"
  };

  // -------------------------------------------------------------
  // NAVIGATION & TAB SWITCHING
  // -------------------------------------------------------------
  function switchView(viewName) {
    if (!viewTitles[viewName]) return;
    currentView = viewName;

    navButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });

    viewPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === `view-${viewName}`);
    });

    topbarTitle.textContent = viewTitles[viewName];

    // Close mobile sidebar if open
    if (window.innerWidth <= 860) {
      sidebar.classList.remove("open");
    }

    // Lazy load data per view
    if (viewName === "catalog" && catalogItems.length === 0) {
      loadCatalog();
    } else if (viewName === "status") {
      fetchHealth();
      fetchStats();
    }
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  mobileToggle?.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // -------------------------------------------------------------
  // HEALTH & TELEMETRY
  // -------------------------------------------------------------
  async function fetchHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      topbarStatusText.textContent = `Online • ${data.indexedRecords || 66} Records`;
      kpiServiceStatus.textContent = "Online";
      kpiServiceMode.textContent = `Mode: ${data.mode || "production-mvp"}`;
      kpiRecordsCount.textContent = data.indexedRecords ? `${data.indexedRecords}` : "66";

      if (data.llmConfigured) {
        kpiLlmStatus.textContent = "Active";
        kpiLlmModel.textContent = `Model: ${data.llmModel || "DeepSeek V4.1 Flash"}`;
        sidebarModelName.textContent = data.llmModel ? data.llmModel.replace(":free", "") : "DeepSeek V4.1 Flash";
      } else {
        kpiLlmStatus.textContent = "Unconfigured";
        kpiLlmModel.textContent = "Check server .env";
      }
    } catch (err) {
      topbarStatusText.textContent = "Backend Offline";
      kpiServiceStatus.textContent = "Offline";
      kpiServiceMode.textContent = "Connection refused";
      kpiLlmStatus.textContent = "Offline";
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE}/api/knowledge/stats`);
      if (!res.ok) return;
      const data = await res.json();
      renderCategoryBars(data.categories || {}, data.total || 66);
    } catch {
      // Ignore
    }
  }

  function renderCategoryBars(categories, total) {
    if (!categoryBars) return;
    categoryBars.innerHTML = "";

    const labels = {
      product: "Products & Banking Suites",
      service: "IT & Smart Infrastructure Services",
      resource: "Knowledge, Articles & Press Milestones",
      investor: "Investor Relations & Statutory Governance",
      career: "Workplace, Culture & Careers",
      company: "Company Overview & Offices"
    };

    Object.entries(categories).forEach(([cat, count]) => {
      const pct = Math.round((count / total) * 100);
      const itemEl = document.createElement("div");
      itemEl.className = "cat-bar-item";

      const headerEl = document.createElement("div");
      headerEl.className = "cat-bar-header";
      headerEl.innerHTML = `<span>${labels[cat] || cat}</span><span>${count} records (${pct}%)</span>`;

      const trackEl = document.createElement("div");
      trackEl.className = "bar-track";
      const fillEl = document.createElement("div");
      fillEl.className = "bar-fill";
      fillEl.style.width = `${pct}%`;
      trackEl.appendChild(fillEl);

      itemEl.appendChild(headerEl);
      itemEl.appendChild(trackEl);
      categoryBars.appendChild(itemEl);
    });
  }

  btnRefreshStatus?.addEventListener("click", () => {
    fetchHealth();
    fetchStats();
  });

  // -------------------------------------------------------------
  // CHAT INTERACTION & SAFE FORMATTING
  // -------------------------------------------------------------
  chatInput?.addEventListener("input", () => {
    // Auto resize
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + "px";
    charCount.textContent = `${chatInput.value.length} / 1000`;
  });

  chatInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm?.dispatchEvent(new Event("submit"));
    }
  });

  // Suggested Queries Click
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".query-chip");
    if (chip && chip.dataset.query) {
      chatInput.value = chip.dataset.query;
      charCount.textContent = `${chatInput.value.length} / 1000`;
      chatForm?.dispatchEvent(new Event("submit"));
    }
  });

  btnNewChat?.addEventListener("click", () => {
    if (isChatLoading) return;
    chatMessages.innerHTML = `
      <div class="message-card message-bot">
        <div class="message-avatar">
          <div class="bot-badge">Q</div>
        </div>
        <div class="message-body">
          <div class="message-sender">QORVEX Intelligence <span class="time-stamp">Enterprise Connector</span></div>
          <div class="message-text">
            <p>New conversation started. How can I assist you with Virtual Galaxy Infotech Limited (VGIL) today?</p>
          </div>
          <div class="suggested-queries">
            <div class="suggested-title">Suggested Inquiries:</div>
            <div class="chip-group">
              <button class="query-chip" data-query="What core banking solutions does VGIL offer?">Core Banking Solutions</button>
              <button class="query-chip" data-query="Where are VGIL's headquarters and development centres?">Headquarters & SEZ</button>
              <button class="query-chip" data-query="What smart technology solutions are provided under VGST?">VGST Smart Tech</button>
              <button class="query-chip" data-query="What are VGIL's digital payment capabilities?">Digital Payments</button>
              <button class="query-chip" data-query="What is VGIL's transaction volume and scale?">Volume & Scale</button>
            </div>
          </div>
        </div>
      </div>
    `;
    chatInput.value = "";
    charCount.textContent = "0 / 1000";
    chatInput.focus();
  });

  chatForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query || isChatLoading) return;

    // Append User Message
    appendUserMessage(query);
    chatInput.value = "";
    chatInput.style.height = "auto";
    charCount.textContent = "0 / 1000";

    // Show Loading
    const loadingId = appendLoadingIndicator();
    isChatLoading = true;
    btnSend.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query })
      });

      removeLoadingIndicator(loadingId);
      isChatLoading = false;
      btnSend.disabled = false;

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        appendBotError(errJson.error || `Server error (${res.status})`);
        return;
      }

      const data = await res.json();
      appendBotResponse(data);
    } catch (err) {
      removeLoadingIndicator(loadingId);
      isChatLoading = false;
      btnSend.disabled = false;
      appendBotError(`Network failure: ${err.message}. Please verify the server is running.`);
    }
  });

  function appendUserMessage(text) {
    const card = document.createElement("div");
    card.className = "message-card message-user";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = `<div class="user-badge">You</div>`;

    const body = document.createElement("div");
    body.className = "message-body";

    const sender = document.createElement("div");
    sender.className = "message-sender";
    sender.textContent = "You";

    const textEl = document.createElement("div");
    textEl.className = "message-text";
    textEl.textContent = text;

    body.appendChild(sender);
    body.appendChild(textEl);
    card.appendChild(avatar);
    card.appendChild(body);

    chatMessages.appendChild(card);
    scrollToBottom();
  }

  function appendLoadingIndicator() {
    const id = "loading-" + Date.now();
    const el = document.createElement("div");
    el.id = id;
    el.className = "chat-loading";
    el.innerHTML = `
      <div class="typing-dots">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
      <span>Retrieving VGIL records & generating grounded response...</span>
    `;
    chatMessages.appendChild(el);
    scrollToBottom();
    return id;
  }

  function removeLoadingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function appendBotError(errorMsg) {
    const card = document.createElement("div");
    card.className = "message-card message-bot";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = `<div class="bot-badge" style="background: #DC2626;">!</div>`;

    const body = document.createElement("div");
    body.className = "message-body";
    body.style.borderColor = "#FCA5A5";

    const sender = document.createElement("div");
    sender.className = "message-sender";
    sender.style.color = "#DC2626";
    sender.textContent = "System Alert";

    const textEl = document.createElement("div");
    textEl.className = "message-text";
    textEl.textContent = errorMsg;

    body.appendChild(sender);
    body.appendChild(textEl);
    card.appendChild(avatar);
    card.appendChild(body);

    chatMessages.appendChild(card);
    scrollToBottom();
  }

  function appendBotResponse(data) {
    const card = document.createElement("div");
    card.className = "message-card message-bot";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = `<div class="bot-badge">Q</div>`;

    const body = document.createElement("div");
    body.className = "message-body";

    const sender = document.createElement("div");
    sender.className = "message-sender";
    sender.innerHTML = `QORVEX Intelligence <span class="time-stamp">${escapeHtml(data.model || "DeepSeek V4.1 Flash")}</span>`;

    const textEl = document.createElement("div");
    textEl.className = "message-text";
    renderSafeMarkdown(data.answer, textEl);

    body.appendChild(sender);
    body.appendChild(textEl);

    // Render Sources if present
    if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
      const sourcesContainer = document.createElement("div");
      sourcesContainer.className = "message-sources";

      const heading = document.createElement("div");
      heading.className = "sources-heading";
      heading.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        <span>Verified Sources (${data.sources.length}):</span>
      `;
      sourcesContainer.appendChild(heading);

      const list = document.createElement("div");
      list.className = "sources-list";

      data.sources.forEach((s) => {
        const item = document.createElement("div");
        item.className = "source-item";

        const titleSpan = document.createElement("span");
        titleSpan.className = "source-title-text";
        titleSpan.textContent = s.title;

        const link = document.createElement("a");
        link.className = "source-link";
        link.href = sanitizeUrl(s.url);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.innerHTML = `<span>Visit Page</span> <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;

        item.appendChild(titleSpan);
        item.appendChild(link);
        list.appendChild(item);
      });

      sourcesContainer.appendChild(list);
      body.appendChild(sourcesContainer);
    }

    card.appendChild(avatar);
    card.appendChild(body);

    chatMessages.appendChild(card);
    scrollToBottom();
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Safe Markdown Parser
   * Parses bold (**text**), bullet points (- or •), headers (###), and newlines
   * strictly creating DOM elements (never sets raw innerHTML of user/model input).
   */
  function renderSafeMarkdown(text, container) {
    container.innerHTML = "";
    if (!text) return;

    const lines = text.split("\n");
    let currentList = null;

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        currentList = null;
        return;
      }

      // Headings
      if (trimmedLine.startsWith("### ")) {
        currentList = null;
        const h3 = document.createElement("h4");
        h3.style.margin = "10px 0 4px";
        h3.style.fontWeight = "700";
        appendFormattedText(trimmedLine.substring(4), h3);
        container.appendChild(h3);
        return;
      }
      if (trimmedLine.startsWith("## ")) {
        currentList = null;
        const h2 = document.createElement("h3");
        h2.style.margin = "12px 0 6px";
        h2.style.fontWeight = "700";
        appendFormattedText(trimmedLine.substring(3), h2);
        container.appendChild(h2);
        return;
      }

      // Bullet List
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("• ") || trimmedLine.startsWith("* ")) {
        if (!currentList) {
          currentList = document.createElement("ul");
          container.appendChild(currentList);
        }
        const li = document.createElement("li");
        appendFormattedText(trimmedLine.substring(2), li);
        currentList.appendChild(li);
        return;
      }

      // Regular Paragraph
      currentList = null;
      const p = document.createElement("p");
      appendFormattedText(line, p);
      container.appendChild(p);
    });
  }

  function appendFormattedText(text, parent) {
    // Regex for bold **bold** and URLs
    const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g);

    parts.forEach((part) => {
      if (!part) return;
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        const strong = document.createElement("strong");
        strong.textContent = part.substring(2, part.length - 2);
        parent.appendChild(strong);
      } else if (part.startsWith("http://") || part.startsWith("https://")) {
        const a = document.createElement("a");
        a.href = sanitizeUrl(part);
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = part;
        a.style.color = "var(--primary)";
        parent.appendChild(a);
      } else {
        parent.appendChild(document.createTextNode(part));
      }
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function sanitizeUrl(url) {
    if (!url) return "#";
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return parsed.toString();
      }
    } catch {
      // invalid
    }
    return "#";
  }

  // -------------------------------------------------------------
  // KNOWLEDGE SEARCH VIEW
  // -------------------------------------------------------------
  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim();
    searchClearBtn.style.display = query ? "block" : "none";

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      performSearch(query, activeSearchCategory);
    }, 250);
  });

  searchClearBtn?.addEventListener("click", () => {
    searchInput.value = "";
    searchClearBtn.style.display = "none";
    performSearch("", activeSearchCategory);
  });

  searchFilterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      searchFilterChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeSearchCategory = chip.dataset.category || "";
      performSearch(searchInput.value.trim(), activeSearchCategory);
    });
  });

  async function performSearch(query, category) {
    if (!query) {
      searchResultsContainer.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5" style="margin-bottom: 12px;">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <div style="font-weight: 600; font-size: 15px; color: var(--text-main);">Search VGIL Knowledge Base</div>
          <div style="font-size: 13px; margin-top: 4px;">Enter terms like "Core Banking", "ERP", "VGST", "MIHAN", or "Cyber Security"</div>
        </div>
      `;
      searchResultsMeta.style.display = "none";
      return;
    }

    try {
      const params = new URLSearchParams({ q: query, limit: "10" });
      if (category) params.set("category", category);

      const res = await fetch(`${API_BASE}/api/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search request failed");
      const data = await res.json();

      searchResultsMeta.style.display = "block";
      resultsCountText.textContent = `Found ${data.count} verified record${data.count === 1 ? "" : "s"} for "${query}"`;

      renderSearchResults(data.results || []);
    } catch (err) {
      searchResultsContainer.innerHTML = `<div style="color: var(--danger); padding: 20px;">Search failed: ${err.message}</div>`;
    }
  }

  function renderSearchResults(results) {
    searchResultsContainer.innerHTML = "";

    if (results.length === 0) {
      searchResultsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background: white; border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
          <div style="font-weight: 700; color: var(--text-main); font-size: 15px;">No Records Found</div>
          <div style="font-size: 13px; color: var(--text-muted); margin-top: 6px;">The VGIL knowledge base has no indexed records matching your query.</div>
        </div>
      `;
      return;
    }

    results.forEach((item) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const top = document.createElement("div");
      top.className = "result-top";

      const badge = document.createElement("span");
      badge.className = `category-badge badge-${item.category}`;
      badge.textContent = item.category;

      const score = document.createElement("span");
      score.className = "result-score";
      score.textContent = `Relevance: ${item.score}`;

      top.appendChild(badge);
      top.appendChild(score);

      const title = document.createElement("h3");
      title.className = "result-title";
      title.textContent = item.title;

      const subtitle = document.createElement("div");
      subtitle.className = "result-subtitle";
      subtitle.textContent = item.subtitle || "";

      const excerpt = document.createElement("p");
      excerpt.className = "result-excerpt";
      excerpt.textContent = item.excerpt;

      card.appendChild(top);
      card.appendChild(title);
      if (item.subtitle) card.appendChild(subtitle);
      card.appendChild(excerpt);

      // Metrics if any
      if (item.metrics && item.metrics.length > 0) {
        const metricsGroup = document.createElement("div");
        metricsGroup.className = "result-meta-tags";
        item.metrics.slice(0, 3).forEach((m) => {
          const pill = document.createElement("span");
          pill.className = "meta-pill";
          pill.textContent = `${m.label}: ${m.value}`;
          metricsGroup.appendChild(pill);
        });
        card.appendChild(metricsGroup);
      }

      // Footer Link
      const footer = document.createElement("div");
      footer.className = "result-footer";
      const link = document.createElement("a");
      link.className = "source-link";
      link.href = sanitizeUrl(item.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.innerHTML = `<span>View Verified VGIL Source</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
      footer.appendChild(link);
      card.appendChild(footer);

      searchResultsContainer.appendChild(card);
    });
  }

  // -------------------------------------------------------------
  // CATALOG VIEW
  // -------------------------------------------------------------
  async function loadCatalog() {
    try {
      const res = await fetch(`${API_BASE}/api/knowledge/items`);
      if (!res.ok) return;
      catalogItems = await res.json();

      const prodCount = catalogItems.filter((i) => i.category === "product").length;
      const servCount = catalogItems.filter((i) => i.category === "service").length;

      countAll.textContent = `${prodCount + servCount}`;
      countProducts.textContent = `${prodCount}`;
      countServices.textContent = `${servCount}`;
      navCatalogCount.textContent = `${prodCount + servCount}`;

      renderCatalog("all");
    } catch {
      // Ignore
    }
  }

  catalogTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      catalogTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderCatalog(tab.dataset.catalogTab);
    });
  });

  function renderCatalog(filter) {
    if (!catalogGrid) return;
    catalogGrid.innerHTML = "";

    const filtered = catalogItems.filter((item) => {
      if (filter === "product") return item.category === "product";
      if (filter === "service") return item.category === "service";
      return item.category === "product" || item.category === "service";
    });

    filtered.forEach((item) => {
      const card = document.createElement("div");
      card.className = "catalog-card";

      const header = document.createElement("div");
      header.className = "catalog-card-header";
      const badge = document.createElement("span");
      badge.className = `category-badge badge-${item.category}`;
      badge.textContent = item.category;
      header.appendChild(badge);

      const title = document.createElement("h3");
      title.className = "catalog-title";
      title.textContent = item.title;

      const desc = document.createElement("p");
      desc.className = "catalog-desc";
      desc.textContent = item.summary || item.subtitle || "";

      card.appendChild(header);
      card.appendChild(title);
      card.appendChild(desc);

      if (item.metrics && item.metrics.length > 0) {
        const metricsContainer = document.createElement("div");
        metricsContainer.className = "catalog-metrics";
        item.metrics.slice(0, 3).forEach((m) => {
          const badge = document.createElement("span");
          badge.className = "metric-badge";
          badge.textContent = `${m.label}: ${m.value}`;
          metricsContainer.appendChild(badge);
        });
        card.appendChild(metricsContainer);
      }

      const footer = document.createElement("div");
      footer.className = "catalog-footer";
      const link = document.createElement("a");
      link.className = "source-link";
      link.href = sanitizeUrl(item.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.innerHTML = `<span>Official Page</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
      footer.appendChild(link);
      card.appendChild(footer);

      catalogGrid.appendChild(card);
    });
  }

  // -------------------------------------------------------------
  // INITIAL LOAD
  // -------------------------------------------------------------
  fetchHealth();
  fetchStats();
  loadCatalog();
  performSearch("", "");
});
