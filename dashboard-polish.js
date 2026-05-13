(function(){
  const CUSTOMER_PAGE_SIZE = 8;

  function initialsFromName(name){
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if(!parts.length) return '?';
    if(parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  }

  function appointmentStateForCustomer(customerId){
    const appointments = Array.isArray(state?.appointments) ? state.appointments : [];
    const relevant = appointments.filter((appointment)=>appointment.customerId === customerId && appointment.status !== 'declined');
    if(!relevant.length) return { tone: 'red', label: 'Noch kein Termin' };
    const now = new Date();
    const hasUpcoming = relevant.some((appointment)=>{
      const raw = `${appointment.date || ''} ${appointment.time || '00:00'}`.trim();
      const parsed = typeof parseDate === 'function' ? parseDate(raw) : new Date(raw.replace(' ', 'T'));
      return parsed && !Number.isNaN(parsed.getTime()) && parsed >= now;
    });
    return hasUpcoming
      ? { tone: 'green', label: 'Termin gebucht' }
      : { tone: 'yellow', label: 'Schon Kundin' };
  }

  function renderFreeSlotsOverview(){
    if(typeof activeServices !== 'function' || typeof getNextAvailableSlots !== 'function' || typeof getNextAvailableDays !== 'function' || typeof openOverviewModalV54 !== 'function') return false;
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const services = activeServices();
    const nextDays = getNextAvailableDays(5);
    const todaySlots = getNextAvailableSlots(todayKey, 6);
    document.body.classList.add('modal-open');
    openOverviewModalV54('Freie Termine', 'Alle aktuell freien Zeiten auf einen Blick.', `
      <div class="free-slot-service-grid">
        ${services.map((service)=>{
          const nextLabel = todaySlots[0]
            ? `Heute · ${todaySlots[0]}`
            : nextDays[0]
              ? `${nextDays[0].date.toLocaleDateString('de-DE',{weekday:'short', day:'2-digit', month:'2-digit'})} · ${nextDays[0].slots[0]}`
              : 'Aktuell ausgebucht';
          return `<div class="free-slot-service-card"><span class="helper-badge">${service}</span><strong>${nextLabel}</strong></div>`;
        }).join('')}
      </div>
      <div class="stack-list free-slot-day-list">
        ${nextDays.length ? nextDays.map((entry)=>`
          <div class="list-item">
            <strong>${entry.date.toLocaleDateString('de-DE',{weekday:'long', day:'2-digit', month:'2-digit'})}</strong>
            <div class="week-day-content">${entry.slots.map((slot)=>`<span class="week-chip">${slot}</span>`).join('')}</div>
          </div>
        `).join('') : '<div class="empty-note">Aktuell sind keine freien Zeiten hinterlegt.</div>'}
      </div>
    `);
    return false;
  }

  function syncPolishCustomerDocuments(){
    const birthdateValue = document.getElementById('polishEditCustomerBirthdate')?.value || '';
    const minor = typeof isMinorFromBirthdate === 'function' ? isMinorFromBirthdate(birthdateValue) : null;
    const treatment = document.getElementById('polishEditDocTreatmentContract');
    const consent = document.getElementById('polishEditDocMinorConsent');
    const idCopy = document.getElementById('polishEditDocIdCopy');
    const treatmentCard = document.querySelector('.polish-doc-treatment');
    const consentCard = document.querySelector('.polish-doc-minor');
    const idCard = document.querySelector('.polish-doc-id');

    if(minor === null){
      [treatmentCard, consentCard, idCard].forEach((node)=>node?.classList.remove('hidden'));
      [treatment, consent, idCopy].forEach((field)=>{ if(field) field.disabled = false; });
      return;
    }
    if(minor){
      if(treatment){
        treatment.checked = false;
        treatment.disabled = true;
      }
      if(consent) consent.disabled = false;
      if(idCopy) idCopy.disabled = false;
      treatmentCard?.classList.add('hidden');
      consentCard?.classList.remove('hidden');
      idCard?.classList.remove('hidden');
      return;
    }
    if(treatment) treatment.disabled = false;
    if(consent){
      consent.checked = false;
      consent.disabled = true;
    }
    if(idCopy){
      idCopy.checked = false;
      idCopy.disabled = true;
    }
    treatmentCard?.classList.remove('hidden');
    consentCard?.classList.add('hidden');
    idCard?.classList.add('hidden');
  }

  function openCustomerEditorDirect(customerId, options = {}){
    const customer = state?.users?.find((user)=>user.id === customerId && user.role === 'customer');
    if(!customer || typeof openOverviewModalV54 !== 'function') return false;
    const returnTarget = options.returnTarget || 'close';
    if(typeof ensureUserNameParts === 'function') ensureUserNameParts(customer);
    document.body.classList.add('modal-open');
    if(typeof window.openOverviewLayerV64 === 'function'){
      window.openOverviewLayerV64(customer.name || 'Kundin bearbeiten', 'Profil, Kontaktdaten und Unterlagen direkt hier bearbeiten.', '<div class="customer-editor-shell-placeholder"></div>');
    } else {
      openOverviewModalV54(customer.name || 'Kundin bearbeiten', 'Profil, Kontaktdaten und Unterlagen direkt hier bearbeiten.', '<div class="customer-editor-shell-placeholder"></div>');
    }

    const title = document.getElementById('overviewDetailTitle');
    const subline = document.getElementById('overviewDetailSubline');
    const content = document.getElementById('overviewDetailContent');
    if(!content) return false;
    const docs = customer.documents || {};
    if(title) title.textContent = customer.name || 'Kundin bearbeiten';
    if(subline) subline.textContent = 'Profil, Kontaktdaten und Unterlagen direkt hier bearbeiten.';
    content.innerHTML = `
      <button type="button" class="customer-editor-back-btn" id="polishBackToDirectoryTop" aria-label="Zurück">
        <svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.41 0Z"/></svg>
      </button>
      <button type="button" class="customer-editor-close-btn" id="polishCustomerCloseTop" aria-label="Schliessen">
        <svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.7 5.3a1 1 0 0 1 1.4 0L12 9.17l3.9-3.88a1 1 0 1 1 1.4 1.42L13.4 10.6l3.88 3.9a1 1 0 0 1-1.42 1.4L12 12.03l-3.9 3.88a1 1 0 0 1-1.4-1.42l3.87-3.88-3.88-3.9a1 1 0 0 1 0-1.4Z"/></svg>
      </button>
      <button type="button" class="customer-editor-trash-btn" id="polishDeleteCustomerTop" aria-label="Kundin löschen" title="Kundin löschen">
        <svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3.75A1.75 1.75 0 0 1 10.75 2h2.5A1.75 1.75 0 0 1 15 3.75V4h3a1 1 0 1 1 0 2h-.54l-.77 11.16A2 2 0 0 1 14.7 19H9.3a2 2 0 0 1-1.99-1.84L6.54 6H6a1 1 0 1 1 0-2h3v-.25ZM11 4h2v-.25a.25.25 0 0 0-.25-.25h-1.5a.25.25 0 0 0-.25.25V4Zm-1 4.25a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0V9A.75.75 0 0 1 10 8.25Zm4 .75a.75.75 0 0 0-1.5 0v6a.75.75 0 0 0 1.5 0V9Z"/></svg>
      </button>
      <form id="polishCustomerEditForm" class="simple-form">
        <input type="hidden" id="polishEditCustomerId" value="${customer.id}">
        <div class="grid-three">
          <label><span>Vorname</span><input type="text" id="polishEditCustomerFirstName" value="${customer.firstName || ''}" required></label>
          <label><span>Nachname</span><input type="text" id="polishEditCustomerLastName" value="${customer.lastName || ''}" required></label>
          <label><span>E-Mail</span><input type="email" id="polishEditCustomerEmail" value="${customer.email || ''}" required></label>
          <label><span>Neues Passwort</span><input type="password" id="polishEditCustomerPassword" minlength="8" placeholder="Leer lassen, um nichts zu ändern"></label>
          <label><span>Telefon</span><input type="text" id="polishEditCustomerPhone" value="${customer.phone || ''}"></label>
          <label><span>WhatsApp</span><input type="text" id="polishEditCustomerWhatsapp" value="${customer.whatsapp || ''}" placeholder="Optional"></label>
          <label><span>Instagram</span><input type="text" id="polishEditCustomerInstagram" value="${customer.instagram || ''}" placeholder="@kundin"></label>
          <label><span>Geburtsdatum</span><input type="date" id="polishEditCustomerBirthdate" value="${customer.birthdate || ''}"></label>
          <label class="span-2"><span>Anschrift</span><input type="text" id="polishEditCustomerAddress" value="${customer.address || ''}"></label>
        </div>
        <div class="document-check-grid">
          <label class="checkbox-card polish-doc-treatment"><input type="checkbox" id="polishEditDocTreatmentContract" ${docs.treatmentContract ? 'checked' : ''}><span>Behandlungsvertrag</span></label>
          <label class="checkbox-card polish-doc-minor"><input type="checkbox" id="polishEditDocMinorConsent" ${docs.minorConsent ? 'checked' : ''}><span>Einverständniserklärung</span></label>
          <label class="checkbox-card polish-doc-id"><input type="checkbox" id="polishEditDocIdCopy" ${docs.idCopy ? 'checked' : ''}><span>Ausweiskopie</span></label>
        </div>
        <div class="grid-three uploads-grid polish-doc-uploads">
          <label class="polish-upload-card polish-doc-treatment"><span>Behandlungsvertrag hochladen</span><input type="file" id="polishEditUploadTreatmentContract" accept=".pdf,image/*"></label>
          <label class="polish-upload-card polish-doc-minor"><span>Einverständniserklärung hochladen</span><input type="file" id="polishEditUploadMinorConsent" accept=".pdf,image/*"></label>
          <label class="polish-upload-card polish-doc-id"><span>Ausweiskopie hochladen</span><input type="file" id="polishEditUploadIdCopy" accept=".pdf,image/*"></label>
        </div>
        <div class="form-actions customer-editor-actions">
          <button type="submit" class="button primary" id="polishCustomerEditSave">Änderungen speichern</button>
        </div>
      </form>
    `;

    const goBack = function(event){
      if(event){
        event.preventDefault();
        event.stopPropagation();
      }
      if(returnTarget === 'directory') return renderCompactCustomerDirectory();
      if(typeof window.goBackOverviewLayerV64 === 'function') return window.goBackOverviewLayerV64();
      if(typeof closeOverviewModalV54 === 'function') return closeOverviewModalV54();
      return false;
    };

    document.getElementById('polishBackToDirectoryTop')?.addEventListener('click', goBack);
    document.getElementById('polishCustomerCloseTop')?.addEventListener('click', function(event){
      event?.preventDefault?.();
      event?.stopPropagation?.();
      if(typeof closeOverviewModalV54 === 'function') return closeOverviewModalV54();
      return false;
    });
    document.getElementById('polishDeleteCustomerTop')?.addEventListener('click', function(event){
      event.preventDefault();
      event.stopPropagation();
      if(currentUser?.role !== 'admin') return false;
      if(typeof window.requestDeleteCustomer === 'function') return window.requestDeleteCustomer(customer.id);
      return false;
    });
    const birthdateField = document.getElementById('polishEditCustomerBirthdate');
    if(birthdateField){
      birthdateField.oninput = syncPolishCustomerDocuments;
      birthdateField.onchange = syncPolishCustomerDocuments;
    }
    syncPolishCustomerDocuments();

    const form = document.getElementById('polishCustomerEditForm');
    const commitCustomer = function(){
      const idx = state.users.findIndex((user)=>user.id === customer.id);
      if(idx < 0) return false;
      const birthdate = document.getElementById('polishEditCustomerBirthdate')?.value || '';
      const minor = typeof isMinorFromBirthdate === 'function' ? isMinorFromBirthdate(birthdate) : null;
      const nextPassword = document.getElementById('polishEditCustomerPassword')?.value.trim() || '';
      state.users[idx] = {
        ...state.users[idx],
        firstName: document.getElementById('polishEditCustomerFirstName')?.value.trim() || '',
        lastName: document.getElementById('polishEditCustomerLastName')?.value.trim() || '',
        name: typeof mergeNameParts === 'function'
          ? mergeNameParts(document.getElementById('polishEditCustomerFirstName')?.value, document.getElementById('polishEditCustomerLastName')?.value)
          : `${document.getElementById('polishEditCustomerFirstName')?.value || ''} ${document.getElementById('polishEditCustomerLastName')?.value || ''}`.trim(),
        email: document.getElementById('polishEditCustomerEmail')?.value || '',
        password: isDemoMode() ? (nextPassword || state.users[idx].password || '') : (state.users[idx].password || ''),
        pendingPassword: nextPassword,
        phone: document.getElementById('polishEditCustomerPhone')?.value || '',
        whatsapp: document.getElementById('polishEditCustomerWhatsapp')?.value || '',
        instagram: document.getElementById('polishEditCustomerInstagram')?.value || '',
        birthdate,
        address: document.getElementById('polishEditCustomerAddress')?.value || '',
        documents: {
          treatmentContract: minor === false && (
            !!document.getElementById('polishEditDocTreatmentContract')?.checked ||
            !!document.getElementById('polishEditUploadTreatmentContract')?.files?.length
          ),
          minorConsent: minor === true && (
            !!document.getElementById('polishEditDocMinorConsent')?.checked ||
            !!document.getElementById('polishEditUploadMinorConsent')?.files?.length
          ),
          idCopy: minor === true && (
            !!document.getElementById('polishEditDocIdCopy')?.checked ||
            !!document.getElementById('polishEditUploadIdCopy')?.files?.length
          )
        },
        lastEdited: typeof nowISO === 'function' ? nowISO() : new Date().toISOString()
      };
      if(typeof saveState === 'function') saveState();
      if(typeof renderAll === 'function') renderAll();
      if(returnTarget === 'directory') return renderCompactCustomerDirectory();
      return goBack();
    };
    if(form){
      form.onsubmit = function(event){
        event.preventDefault();
        return commitCustomer();
      };
    }
    document.getElementById('polishCustomerEditSave')?.addEventListener('click', function(event){
      event.preventDefault();
      event.stopPropagation();
      return commitCustomer();
    });
    return false;
  }

  function renderCompactCustomerDirectory(){
    if(typeof customerUsers !== 'function' || typeof openOverviewModalV54 !== 'function') return false;
    const rows = [...customerUsers()].sort((a,b)=>a.name.localeCompare(b.name, 'de'));
    document.body.classList.add('modal-open');
    if(typeof window.openOverviewLayerV64 === 'function'){
      window.openOverviewLayerV64('Kundenliste A-Z', 'Alle Kundinnen kompakt und direkt zum Bearbeiten.', `
        <div class="task-search-row customer-directory-search-row">
          <label class="icon-search-field"><span>⌕</span><input type="text" id="polishCustomerDirectorySearch" placeholder="Kundin suchen"></label>
        </div>
        <div id="polishCustomerDirectoryList"></div>
        <div id="polishCustomerDirectoryPagination" class="customer-directory-pagination"></div>
      `, { resetHistory: true });
    } else {
      openOverviewModalV54('Kundenliste A-Z', 'Alle Kundinnen kompakt und direkt zum Bearbeiten.', `
        <div class="task-search-row customer-directory-search-row">
          <label class="icon-search-field"><span>⌕</span><input type="text" id="polishCustomerDirectorySearch" placeholder="Kundin suchen"></label>
        </div>
        <div id="polishCustomerDirectoryList"></div>
        <div id="polishCustomerDirectoryPagination" class="customer-directory-pagination"></div>
      `);
    }
    const search = document.getElementById('polishCustomerDirectorySearch');
    const list = document.getElementById('polishCustomerDirectoryList');
    const pagination = document.getElementById('polishCustomerDirectoryPagination');
    let currentPage = 1;

    const render = function(){
      if(!list || !pagination) return;
      const query = (search?.value || '').trim().toLowerCase();
      const filtered = rows.filter((customer)=>!query || String(customer.name || '').toLowerCase().includes(query));
      const pageCount = Math.max(1, Math.ceil(filtered.length / CUSTOMER_PAGE_SIZE));
      currentPage = Math.min(currentPage, pageCount);
      const pageRows = filtered.slice((currentPage - 1) * CUSTOMER_PAGE_SIZE, currentPage * CUSTOMER_PAGE_SIZE);
      list.innerHTML = pageRows.length ? pageRows.map((customer)=>{
        const appointmentState = appointmentStateForCustomer(customer.id);
        const avatar = customer.avatar
          ? `<img src="${customer.avatar}" alt="${customer.name}" class="directory-avatar">`
          : `<span class="directory-avatar directory-avatar-fallback">${initialsFromName(customer.name)}</span>`;
        return `
          <button type="button" class="customer-directory-tile customer-tone-${appointmentState.tone}" data-customer-id="${customer.id}">
            <span class="customer-directory-main">
              ${avatar}
              <span class="customer-directory-copy">
                <strong>${customer.name}</strong>
                <span class="customer-directory-status">
                  <span class="customer-status-dot customer-status-${appointmentState.tone}"></span>
                  <span>${appointmentState.label}</span>
                </span>
              </span>
            </span>
            <span class="customer-profile-chip">Profil</span>
          </button>
        `;
      }).join('') : '<div class="empty-note">Keine passende Kundin gefunden.</div>';
      pagination.innerHTML = filtered.length > CUSTOMER_PAGE_SIZE ? Array.from({ length: pageCount }, (_, index)=>`
        <button type="button" class="page-chip ${index + 1 === currentPage ? 'is-active' : ''}" data-page="${index + 1}">${index + 1}</button>
      `).join('') : '';
      list.querySelectorAll('[data-customer-id]').forEach((button)=>{
        button.onclick = function(event){
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation?.();
          return openCustomerEditorDirect(button.getAttribute('data-customer-id'), { returnTarget: 'directory' });
        };
      });
      pagination.querySelectorAll('[data-page]').forEach((button)=>{
        button.onclick = function(event){
          event.preventDefault();
          event.stopPropagation();
          currentPage = Number(button.getAttribute('data-page') || '1');
          render();
          return false;
        };
      });
    };

    if(search){
      search.oninput = function(){
        currentPage = 1;
        render();
      };
    }
    render();
    return false;
  }

  function tidyHistoryCard(){
    const settingsTab = document.getElementById('tab-settings');
    if(!settingsTab) return;
    const inlineCard = settingsTab.querySelector('.settings-inline-card');
    if(!inlineCard) return;
    inlineCard.querySelector('strong')?.remove();
    inlineCard.querySelector('.subtle')?.remove();
  }

  function bindPrettyValidation(){
    document.querySelectorAll('input, textarea, select').forEach((field)=>{
      field.addEventListener('invalid', function(){
        const label = this.closest('label')?.querySelector('span')?.textContent?.trim() || 'Dieses Feld';
        let message = `${label} bitte noch ausfüllen.`;
        if(this.validity.valueMissing){
          message = `${label} bitte noch ausfüllen.`;
        } else if(this.validity.typeMismatch && this.type === 'email'){
          message = 'Bitte gib eine gültige E-Mail-Adresse ein.';
        } else if(this.validity.tooShort){
          message = `${label} ist noch zu kurz.`;
        }
        this.setCustomValidity(message);
      });
      field.addEventListener('input', function(){
        this.setCustomValidity('');
      });
      field.addEventListener('change', function(){
        this.setCustomValidity('');
      });
    });
  }

  function bindPolishActions(){
    const customerButton = document.getElementById('openCustomerDirectory');
    if(customerButton){
      const handler = function(event){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        return renderCompactCustomerDirectory();
      };
      customerButton.onclick = handler;
      customerButton.addEventListener('click', handler, true);
    }
    tidyHistoryCard();
  }

  function initPolish(){
    bindPolishActions();
    bindPrettyValidation();
  }

  const originalEditCustomer = window.editCustomer;
  window.openCustomerEditorDirectV65 = openCustomerEditorDirect;
  window.editCustomer = function(customerId){
    if(currentUser?.role !== 'admin'){
      return typeof originalEditCustomer === 'function' ? originalEditCustomer(customerId) : false;
    }
    return openCustomerEditorDirect(customerId);
  };

  const originalRenderOverview = window.renderOverview;
  if(typeof originalRenderOverview === 'function'){
    window.renderOverview = function(){
      const result = originalRenderOverview.apply(this, arguments);
      bindPolishActions();
      return result;
    };
  }

  const originalRenderSettings = window.renderSettings;
  if(typeof originalRenderSettings === 'function'){
    window.renderSettings = function(){
      const result = originalRenderSettings.apply(this, arguments);
      bindPolishActions();
      return result;
    };
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initPolish);
  } else {
    initPolish();
  }
  window.addEventListener('load', initPolish);
})();

/* ============================================================
   PERFORMANCE & ACCESSIBILITY IMPROVEMENTS
   ============================================================ */
(function(){
  'use strict';

  // --- Add lazy loading to all images that don't have it ---
  function addLazyLoading(){
    try {
      var images = document.querySelectorAll('img:not([loading])');
      images.forEach(function(img){
        // Don't lazy-load above-the-fold brand logo
        if(!img.classList.contains('brand-logo')){
          img.setAttribute('loading', 'lazy');
        }
        // Ensure alt text exists (accessibility)
        if(!img.hasAttribute('alt')){
          img.setAttribute('alt', '');
        }
      });
    } catch(err){
      console.error('[Polish] addLazyLoading error:', err);
    }
  }

  // --- Add missing ARIA labels to icon buttons ---
  function improveAriaLabels(){
    try {
      // Notification trigger
      var notifBtn = document.getElementById('notificationTrigger');
      if(notifBtn && !notifBtn.getAttribute('aria-label')){
        notifBtn.setAttribute('aria-label', 'Mitteilungen öffnen');
      }

      // Theme toggle
      var themeBtn = document.getElementById('themeToggle');
      if(themeBtn && !themeBtn.getAttribute('aria-label')){
        themeBtn.setAttribute('aria-label', 'Darkmode umschalten');
      }

      // Logout button
      var logoutBtn = document.getElementById('logoutBtn');
      if(logoutBtn && !logoutBtn.getAttribute('aria-label')){
        logoutBtn.setAttribute('aria-label', 'Abmelden');
      }

      // Calendar navigation
      var prevMonth = document.getElementById('prevMonth');
      if(prevMonth && !prevMonth.getAttribute('aria-label')){
        prevMonth.setAttribute('aria-label', 'Vorheriger Monat');
      }
      var nextMonth = document.getElementById('nextMonth');
      if(nextMonth && !nextMonth.getAttribute('aria-label')){
        nextMonth.setAttribute('aria-label', 'Nächster Monat');
      }

      // Close buttons (×)
      var closeBtns = document.querySelectorAll('.quick-user-close:not([aria-label])');
      closeBtns.forEach(function(btn){
        btn.setAttribute('aria-label', 'Schließen');
      });

      // Search inputs
      var searchInputs = document.querySelectorAll('input[type="text"][placeholder]:not([aria-label])');
      searchInputs.forEach(function(input){
        if(input.placeholder){
          input.setAttribute('aria-label', input.placeholder);
        }
      });
    } catch(err){
      console.error('[Polish] improveAriaLabels error:', err);
    }
  }

  // --- Prevent horizontal overflow on mobile ---
  function preventHorizontalScroll(){
    try {
      if(window.innerWidth <= 768){
        // Check for any element wider than viewport
        var body = document.body;
        if(body.scrollWidth > window.innerWidth){
          body.style.overflowX = 'hidden';
        }
      }
    } catch(err){}
  }

  // --- Run improvements ---
  function runImprovements(){
    addLazyLoading();
    improveAriaLabels();
    preventHorizontalScroll();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', runImprovements);
  } else {
    runImprovements();
  }

  // Re-run after dynamic content loads
  window.addEventListener('load', runImprovements);
})();
