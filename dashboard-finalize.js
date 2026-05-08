(function(){
  window.__liaFinalizeActive = true;
  const OVERVIEW_LAYER_STACK = [];

  function syncOverviewBackButton(){
    const backBtn = document.getElementById('overviewDetailBack');
    if(!backBtn) return;
    const hasHistory = OVERVIEW_LAYER_STACK.length > 0;
    backBtn.classList.toggle('hidden', !hasHistory);
    backBtn.setAttribute('aria-hidden', hasHistory ? 'false' : 'true');
    backBtn.tabIndex = hasHistory ? 0 : -1;
  }

  function captureOverviewLayerState(){
    return {
      title: document.getElementById('overviewDetailTitle')?.textContent || '',
      subline: document.getElementById('overviewDetailSubline')?.textContent || '',
      content: document.getElementById('overviewDetailContent')?.innerHTML || ''
    };
  }

  function renderOverviewLayerState(stateSnapshot){
    if(!stateSnapshot) return;
    const title = document.getElementById('overviewDetailTitle');
    const subline = document.getElementById('overviewDetailSubline');
    const content = document.getElementById('overviewDetailContent');
    const modal = document.getElementById('overviewDetailModal');
    if(title) title.textContent = stateSnapshot.title || '';
    if(subline) subline.textContent = stateSnapshot.subline || '';
    if(content) content.innerHTML = stateSnapshot.content || '';
    if(modal){
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('modal-open');
    syncOverviewBackButton();
  }

  function openOverviewLayer(title, subline, contentHtml, options = {}){
    const modal = document.getElementById('overviewDetailModal');
    if(options.resetHistory) OVERVIEW_LAYER_STACK.length = 0;
    if(modal?.classList.contains('active') && !options.resetHistory){
      OVERVIEW_LAYER_STACK.push(captureOverviewLayerState());
    }
    openOverviewModalV54(title, subline, contentHtml);
    syncOverviewBackButton();
  }

  window.openOverviewLayerV64 = openOverviewLayer;

  function goBackOverviewLayer(){
    const previous = OVERVIEW_LAYER_STACK.pop();
    if(previous){
      renderOverviewLayerState(previous);
      syncOverviewBackButton();
      return false;
    }
    if(typeof closeOverviewModalV54 === 'function') closeOverviewModalV54();
    return false;
  }

  window.goBackOverviewLayerV64 = goBackOverviewLayer;

  const originalCloseOverviewModal = window.closeOverviewModalV54;
  window.closeOverviewModalV54 = function(){
    OVERVIEW_LAYER_STACK.length = 0;
    syncOverviewBackButton();
    if(typeof originalCloseOverviewModal === 'function'){
      return originalCloseOverviewModal();
    }
    const modal = document.getElementById('overviewDetailModal');
    if(modal) modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    return false;
  };

  function finalApplyCleanHeaderIcons(){
    const notificationBtn = document.getElementById('notificationTrigger');
    const notificationBadge = document.getElementById('notificationBadge');
    const logoutBtn = document.getElementById('logoutBtn');
    const themeBtn = document.getElementById('themeToggle');
    if(notificationBtn && notificationBadge){
      notificationBtn.setAttribute('aria-label', 'Mitteilungen öffnen');
      notificationBtn.title = 'Mitteilungen öffnen';
      notificationBtn.innerHTML = '<svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a4 4 0 0 0-4 4v1.2c0 .8-.24 1.58-.7 2.22L5.6 13.2A1 1 0 0 0 6.4 14.8h11.2a1 1 0 0 0 .8-1.6l-1.7-2.78A3.8 3.8 0 0 1 16 8.2V7a4 4 0 0 0-4-4Zm0 18a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 21Z"/></svg>';
      notificationBtn.appendChild(notificationBadge);
    }
    if(logoutBtn){
      logoutBtn.setAttribute('aria-label', 'Abmelden');
      logoutBtn.title = 'Abmelden';
      logoutBtn.innerHTML = '<svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4.75A1.25 1.25 0 0 1 11.25 3.5h5.5A2.25 2.25 0 0 1 19 5.75v12.5a2.25 2.25 0 0 1-2.25 2.25h-5.5A1.25 1.25 0 0 1 10 19.25a1 1 0 1 1 2 0a.25.25 0 0 0 .25.25h4.5a.25.25 0 0 0 .25-.25V5.75a.25.25 0 0 0-.25-.25h-4.5a.25.25 0 0 0-.25.25a1 1 0 1 1-2 0Zm-4.3 6.55 2.6-2.6a1 1 0 1 1 1.4 1.4L8.8 11H14a1 1 0 1 1 0 2H8.8l.9.9a1 1 0 0 1-1.4 1.4l-2.6-2.6a1 1 0 0 1 0-1.4Z"/></svg>';
    }
    if(themeBtn){
      themeBtn.setAttribute('aria-label', 'Darkmode umschalten');
      themeBtn.title = 'Darkmode umschalten';
      if(!themeBtn.querySelector('.header-icon-svg')){
        themeBtn.innerHTML = '<svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 3.2a1 1 0 0 1 .62 1.56A7.5 7.5 0 1 0 19.24 15.1a1 1 0 0 1 1.56.62A9.5 9.5 0 1 1 14.5 3.2Z"/></svg>';
      }
    }
  }

  function finalRenderOverview(){
    if(typeof renderOverviewReminder !== 'function' || typeof getNextAvailableSlots !== 'function') return;
    if(typeof closeOverviewSpotlightV65 === 'function') closeOverviewSpotlightV65();
    const base = new Date();
    const hour = base.getHours();
    const firstName = typeof firstNameOf === 'function' ? firstNameOf(currentUser) : (currentUser?.firstName || 'Julia');
    const heroHeading = hour < 11
      ? `Guten Morgen, ${firstName}!`
      : hour < 17
        ? `Schönen Nachmittag, ${firstName}!`
        : `Willkommen zurück, ${firstName}!`;
    const heroSubline = hour < 11
      ? 'Dein Tag startet gleich mit allen wichtigen Terminen und Aufgaben im Blick.'
      : hour < 17
        ? ''
        : 'Schön, dass du wieder da bist. Alles Wichtige wartet schon auf dich.';
    const today = `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`;
    const visible = sortedAppointments(visibleAppointments());
    const todaysAppointments = visible.filter((appointment)=>appointment.date === today);
    const upcomingAppointments = getUpcomingAppointments(6);
    const nextAppointment = todaysAppointments[0] || upcomingAppointments[0];
    const heroHeadingNode = document.querySelector('#tab-overview .overview-hero h2');
    const heroSublineNode = document.querySelector('#tab-overview .overview-hero .subtle');
    if(heroHeadingNode) heroHeadingNode.innerHTML = `${heroHeading}<br>Hier ist dein Überblick für den Tag.`;
    if(heroSublineNode) heroSublineNode.textContent = heroSubline;

    const freeBox = document.getElementById('overviewFreeSlots');
    if(freeBox){
      const dayKey = weekdayShort(base);
      const freeSlots = getNextAvailableSlots(today, 6);
      const nextDays = getNextAvailableDays(4);
      const services = typeof activeServices === 'function' ? activeServices() : [];
      const nextHint = freeSlots[0]
        ? `${dayKey} · ${freeSlots[0]}`
        : nextDays[0]
          ? `${nextDays[0].date.toLocaleDateString('de-DE',{weekday:'short', day:'2-digit', month:'2-digit'})} · ${nextDays[0].slots[0]}`
          : 'Aktuell keine freien Zeiten hinterlegt';
      freeBox.innerHTML = `
        <div class="overview-compact-preview">
          <span class="helper-badge">${services.length} Leistungen aktiv</span>
          <strong>${nextHint}</strong>
          <span class="subtle">${freeSlots.length ? 'Nächster freier Slot heute.' : nextDays[0] ? 'Nächstes verfügbares Zeitfenster.' : 'Sobald Zeiten hinterlegt sind, erscheinen sie hier.'}</span>
        </div>
      `;
    }
    const todayHeaderText = document.querySelector('#todayOverviewCard header .subtle');
    if(todayHeaderText){
      todayHeaderText.textContent = `Deine Übersicht für heute · ${base.toLocaleDateString('de-DE',{weekday:'long', day:'2-digit', month:'2-digit', year:'numeric'})}`;
    }
    const summary = document.getElementById('overviewTodaySummary');
    if(summary){
      summary.innerHTML = `
        <div class="today-highlight-main">
          <span class="helper-badge">${todaysAppointments.length ? 'Nächster Termin' : 'Nächster geplanter Termin'}</span>
          <strong>${nextAppointment ? `${formatDateOnly(nextAppointment.date)} · ${nextAppointment.time}` : 'Heute noch frei'}</strong>
          <span>${nextAppointment ? `${nextAppointment.service} · ${displayName(nextAppointment.customerId)}` : 'Aktuell ist kein Termin eingetragen.'}</span>
        </div>
        <div class="overview-mini-stats">
          <div class="mini-stat"><strong>${todaysAppointments.length}</strong><span>Heute</span></div>
          <div class="mini-stat"><strong>${todaysAppointments.filter((appointment)=>appointment.status==='open').length}</strong><span>Offen</span></div>
          <div class="mini-stat"><strong>${todaysAppointments.filter((appointment)=>appointment.status==='confirmed').length}</strong><span>Bestätigt</span></div>
        </div>
      `;
    }

    const timeline = document.getElementById('overviewTodayTimeline');
    if(timeline){
      timeline.innerHTML = todaysAppointments.length ? todaysAppointments.map((appointment)=>`
        <button type="button" class="timeline-slot" onclick="openAppointmentFromDay('${appointment.id}')">
          <div class="slot-time">${appointment.time} · ${appointment.service}</div>
          <div class="slot-meta">${displayName(appointment.customerId)} · <span class="pill ${statusClass(appointment.status)}">${statusLabel(appointment.status)}</span></div>
          <div class="subtle">Zuletzt bearbeitet von ${appointment.updatedBy} am ${formatGermanDate(appointment.updatedAt)}</div>
        </button>
      `).join('') : upcomingAppointments.length ? upcomingAppointments.slice(0, 3).map((appointment)=>`
        <button type="button" class="timeline-slot empty" onclick="openAppointmentFromDay('${appointment.id}')">
          <div class="slot-time">${formatDateOnly(appointment.date)} · ${appointment.time}</div>
          <div class="slot-meta">${appointment.service} · ${displayName(appointment.customerId)}</div>
          <div class="subtle">Als Nächstes geplant</div>
        </button>
      `).join('') : '<div class="timeline-slot empty"><div class="slot-time">Noch kein Termin für heute</div><div class="slot-meta">Sobald Termine eingetragen werden, erscheinen sie hier.</div></div>';
    }

    const monday = new Date(base);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);
    const weekHeaderText = document.querySelector('#weekOverviewCard header .subtle');
    if(weekHeaderText){
      const weekStartLabel = monday.toLocaleDateString('de-DE',{day:'2-digit', month:'2-digit'});
      const weekEnd = new Date(monday);
      weekEnd.setDate(monday.getDate() + 6);
      weekHeaderText.textContent = `Deine Übersicht für diese Woche · ${weekStartLabel} – ${weekEnd.toLocaleDateString('de-DE',{day:'2-digit', month:'2-digit', year:'numeric'})}`;
    }
    const days = [];
    for(let i=0; i<7; i++){
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const key = `${current.getFullYear()}-${pad(current.getMonth()+1)}-${pad(current.getDate())}`;
      days.push({date: current, key, items: visible.filter((appointment)=>appointment.date === key)});
    }

    const weekBox = document.getElementById('overviewWeekList');
    if(weekBox){
      const appointmentsThisWeek = days.reduce((sum, entry)=>sum + entry.items.length, 0);
      const firstBusyDay = days.find((entry)=>entry.items.length);
      const weekPreviewMeta = firstBusyDay
        ? `${firstBusyDay.items.length} Termin${firstBusyDay.items.length === 1 ? '' : 'e'} am ${firstBusyDay.date.toLocaleDateString('de-DE',{weekday:'long'})}`
        : 'Noch keine festen Einträge für diese Woche';
      weekBox.innerHTML = `
        <div class="overview-compact-preview">
          <span class="helper-badge">${appointmentsThisWeek} Termine</span>
          <strong>${firstBusyDay ? `${firstBusyDay.date.toLocaleDateString('de-DE',{weekday:'long', day:'2-digit', month:'2-digit'})}` : 'Diese Woche ist noch frei planbar'}</strong>
          <span class="subtle">${weekPreviewMeta}</span>
        </div>
      `;
    }

    const jumpWeekBtn = document.getElementById('jumpToCalendarFromWeek');
    if(jumpWeekBtn) jumpWeekBtn.onclick = ()=> openTab('calendar');
    const openFreeSlotsBtn = document.getElementById('openFreeSlotsOverviewBtn');
    if(openFreeSlotsBtn) openFreeSlotsBtn.onclick = window.openFreeSlotsOverviewV64;
    renderOverviewReminder();
  }

  function buildFreeSlotsOverviewHtml(){
    const base = new Date();
    const today = `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`;
    const services = typeof activeServices === 'function' ? activeServices() : [];
    const nextDays = getNextAvailableDays(6);
    const freeToday = getNextAvailableSlots(today, 8);
    return `
      <div class="stack-list">
        <div class="list-item">
          <strong>Aktive Leistungen</strong>
          <div class="week-day-content">
            ${services.length ? services.map((service)=>`<span class="week-chip">${service}</span>`).join('') : '<span class="week-empty">Keine aktiven Leistungen hinterlegt</span>'}
          </div>
        </div>
        <div class="list-item">
          <strong>Heute</strong>
          <div class="week-day-content">
            ${freeToday.length ? freeToday.map((time)=>`<span class="week-chip">${weekdayShort(base)} · ${time}</span>`).join('') : '<span class="week-empty">Heute aktuell keine freien Zeiten</span>'}
          </div>
        </div>
        <div class="list-item">
          <strong>Nächste freie Tage</strong>
          <div class="stack-list">
            ${nextDays.length ? nextDays.map((entry)=>`
              <div class="week-row">
                <div class="week-day-meta">
                  <strong>${entry.date.toLocaleDateString('de-DE',{weekday:'long'})}</strong>
                  <span>${entry.date.toLocaleDateString('de-DE',{day:'2-digit', month:'2-digit'})}</span>
                </div>
                <div class="week-day-content">
                  ${entry.slots.map((time)=>`<span class="week-chip">${time}</span>`).join('')}
                </div>
              </div>
            `).join('') : '<span class="week-empty">Aktuell sind keine freien Zeiten hinterlegt</span>'}
          </div>
        </div>
      </div>
    `;
  }

  function buildDayOverviewAvatar(customer){
    const fullName = customer?.name || '';
    const avatar = customer?.avatar || '';
    const initials = typeof buildCustomerInitials === 'function'
      ? buildCustomerInitials(fullName)
      : String(fullName || '?').slice(0, 2).toUpperCase();
    return avatar
      ? `<span class="day-overview-avatar"><img src="${avatar}" alt="${fullName}"></span>`
      : `<span class="day-overview-avatar day-overview-avatar-fallback">${initials}</span>`;
  }

  function buildAppointmentActionButtons(appointment){
    const customerAction = currentUser?.role === 'admin'
      ? `<button type="button" class="button secondary small-btn" onclick="return editCustomer('${appointment.customerId}');">Kundin bearbeiten</button>`
      : `<button type="button" class="button secondary small-btn" onclick="closeOverviewModalV54(); setTimeout(function(){ openTab('profile'); }, 30);">Mein Profil</button>`;
    return `
      <div class="overview-day-actions">
        <button type="button" class="button secondary small-btn" onclick="return openAppointmentFromDay('${appointment.id}');">Termin bearbeiten</button>
        ${customerAction}
      </div>
    `;
  }

  function buildAppointmentDetailCard(appointment){
    const customer = state.users.find((user)=>user.id === appointment.customerId);
    return `
      <article class="overview-day-card-pro">
        <div class="overview-day-card-top">
          <div class="overview-day-time-block">
            <span class="overview-day-time">${appointment.time}</span>
            <span class="pill ${statusClass(appointment.status)}">${statusLabel(appointment.status)}</span>
          </div>
          <span class="helper-badge">${appointment.service}</span>
        </div>
        <div class="overview-day-customer-row">
          ${buildDayOverviewAvatar(customer)}
          <div class="overview-day-customer-copy">
            <strong>${displayName(appointment.customerId)}</strong>
            <span class="subtle">${customer?.phone || customer?.email || 'Keine Kontaktdaten hinterlegt'}</span>
          </div>
        </div>
        <div class="overview-day-meta-row">
          <span>Zuletzt bearbeitet von ${appointment.updatedBy}</span>
          <span>${formatGermanDate(appointment.updatedAt)}</span>
        </div>
        ${appointment.note ? `<div class="overview-day-note">${appointment.note}</div>` : ''}
        ${buildAppointmentActionButtons(appointment)}
      </article>
    `;
  }

  function buildAppointmentEditorHtml(options = {}){
    const appointment = options.appointment || null;
    const presetDate = options.presetDate || appointment?.date || '';
    const presetTime = options.presetTime || appointment?.time || '';
    const selectedCustomerId = typeof appointment?.customerId !== 'undefined'
      ? appointment.customerId
      : (currentUser?.role === 'admin' ? (customerUsers()[0]?.id || '') : currentUser?.id || '');
    const services = typeof activeServices === 'function' ? activeServices() : [];
    const customerOptions = currentUser?.role === 'admin'
      ? `
          <option value="" ${selectedCustomerId === '' ? 'selected' : ''}>Neukundin</option>
          <option value="private" ${selectedCustomerId === 'private' ? 'selected' : ''}>Privat blockieren</option>
          ${customerUsers().map((customer)=>`<option value="${customer.id}" ${customer.id === selectedCustomerId ? 'selected' : ''}>${customer.name}</option>`).join('')}
        `
      : '';
    return `
      <form id="finalAppointmentForm" class="simple-form final-appointment-form">
        <input type="hidden" id="finalAppointmentEditId" value="${appointment?.id || ''}">
        <div class="overview-day-sheet-head">
          <div>
            <span class="helper-badge">${appointment ? 'Termin bearbeiten' : 'Neuer Termin'}</span>
            <strong>${appointment ? `${displayName(appointment.customerId)} · ${appointment.service}` : 'Vergib jetzt einen festen Termin.'}</strong>
          </div>
          <span class="subtle">${appointment ? `${formatDateOnly(appointment.date)} · ${appointment.time} · Alle Änderungen werden sofort übernommen.` : 'Lege Kundin, Leistung, Datum und Uhrzeit in einem Schritt fest.'}</span>
        </div>
        <div class="overview-day-card-pro">
          <div class="grid-two">
            ${currentUser?.role === 'admin' ? `<label><span>Kundin</span><select id="finalAppointmentCustomer">${customerOptions}</select></label>` : ''}
            <label><span>Leistung</span><select id="finalAppointmentService">${services.map((service)=>`<option value="${service}" ${service === appointment?.service ? 'selected' : ''}>${service}</option>`).join('')}</select></label>
            <label><span>Datum</span><input type="date" id="finalAppointmentDate" value="${presetDate}" min="${appointment ? '' : isoDateFromDate(new Date())}">
            <label><span>Uhrzeit</span><input type="time" id="finalAppointmentTime" list="finalTimeSuggestions"><datalist id="finalTimeSuggestions"></datalist></label>
            ${currentUser?.role === 'admin' ? `<label><span>Status</span><select id="finalAppointmentStatus"><option value="confirmed" ${(appointment?.status || 'confirmed') === 'confirmed' ? 'selected' : ''}>Bestätigt</option><option value="open" ${appointment?.status === 'open' ? 'selected' : ''}>Offen</option><option value="declined" ${appointment?.status === 'declined' ? 'selected' : ''}>Abgelehnt</option></select></label>` : ''}
          </div>
          <label><span>Notiz</span><textarea id="finalAppointmentNote" rows="4" placeholder="Optionaler Hinweis für diesen Termin">${appointment?.note || ''}</textarea></label>
          <div class="overview-day-actions">
            <button type="submit" class="button primary">${appointment ? 'Termin speichern' : 'Jetzt Termin vergeben'}</button>
            <button type="button" class="button secondary small-btn" onclick="closeOverviewModalV54()">Abbrechen</button>
            ${appointment && currentUser?.role === 'admin' ? `<button type="button" class="button danger small-btn" onclick="if(window.confirm('Möchtest du diesen Termin wirklich löschen?')){window.deleteAppointment('${appointment.id}')}">Termin löschen</button>` : ''}
          </div>
        </div>
      </form>
    `;
  }

  function syncFinalAppointmentTimeOptions(preferredTime = ''){
    const input = document.getElementById('finalAppointmentTime');
    const datalist = document.getElementById('finalTimeSuggestions');
    const dateValue = document.getElementById('finalAppointmentDate')?.value || '';
    const editId = document.getElementById('finalAppointmentEditId')?.value || '';
    if(!input) return;
    if(!dateValue){
      if(datalist) datalist.innerHTML = '';
      return;
    }
    const config = getOpeningConfigForDate(dateValue);
    if(!config || !config.enabled){
      if(datalist) datalist.innerHTML = '';
      return;
    }
    const slots = getAvailableSlotsForDate(dateValue, editId);
    const available = slots.filter((slot)=>!slot.blocked);
    if(datalist){
      datalist.innerHTML = available.map((slot)=>`<option value="${slot.time}">`).join('');
    }
    if(preferredTime){
      input.value = preferredTime;
    } else if(available.length && !input.value){
      input.value = available[0].time;
    }
  }

  function bindFinalAppointmentEditor(options = {}){
    const appointment = options.appointment || null;
    const form = document.getElementById('finalAppointmentForm');
    const dateField = document.getElementById('finalAppointmentDate');
    if(dateField && !appointment){
      dateField.min = isoDateFromDate(new Date());
    }
    if(dateField){
      dateField.addEventListener('change', ()=> syncFinalAppointmentTimeOptions(appointment?.time || ''));
    }
    syncFinalAppointmentTimeOptions(appointment?.time || '');
    if(!form) return;
    form.onsubmit = function(event){
      event.preventDefault();
      const editId = document.getElementById('finalAppointmentEditId')?.value || '';
      const date = document.getElementById('finalAppointmentDate')?.value || '';
      const time = document.getElementById('finalAppointmentTime')?.value || '';
      const todayKey = isoDateFromDate(new Date());
      if(!editId && date < todayKey){
        alert('Termine können nur für heute oder in der Zukunft vergeben werden.');
        return false;
      }
      if(!time){
        alert('Bitte wähle oder gib eine Uhrzeit ein.');
        return false;
      }
      const config = getOpeningConfigForDate(date);
      const slotTimes = getAvailableSlotsForDate(date, editId).filter((slot)=>!slot.blocked).map((slot)=>slot.time);
      const isInSlots = slotTimes.includes(time);
      const isInRange = config && config.enabled && timeToMinutes(time) >= timeToMinutes(config.start) && timeToMinutes(time) <= timeToMinutes(config.end);
      if(!isInSlots && !isInRange){
        alert('Die Uhrzeit liegt außerhalb der Öffnungszeiten dieses Tages.');
        return false;
      }
      if(!isInSlots && isInRange){
        const conflicts = getAvailableSlotsForDate(date, editId).filter((slot)=>slot.blocked).map((slot)=>slot.time);
        if(conflicts.length && !window.confirm(`Achtung: Diese Zeit liegt außerhalb der Standard-Intervalle. Es könnten Überschneidungen mit anderen Terminen bestehen. Trotzdem fortfahren?`)){
          return false;
        }
      }
      const payload = {
        customerId: currentUser?.role === 'admin' ? (document.getElementById('finalAppointmentCustomer')?.value || '') : (currentUser?.id || ''),
        service: document.getElementById('finalAppointmentService')?.value || '',
        date,
        time,
        note: document.getElementById('finalAppointmentNote')?.value || '',
        status: currentUser?.role === 'admin' ? (document.getElementById('finalAppointmentStatus')?.value || 'confirmed') : 'open',
        updatedBy: currentUser?.name || 'System',
        updatedByRole: currentUser?.role || 'admin',
        updatedAt: nowISO(),
        needsReconfirm: currentUser?.role === 'customer'
      };
      const isDemoModeActive = typeof isDemoMode === 'function' ? isDemoMode() : false;
      if(!isDemoModeActive){
        // Persist directly to the database via the appointments API
        const apiBase = typeof API_URL !== 'undefined' ? API_URL : '/api';
        const apiCall = editId
          ? fetch(`${apiBase}/appointments/${editId}`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              credentials: 'include',
              body: JSON.stringify(payload)
            })
          : fetch(`${apiBase}/appointments`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              credentials: 'include',
              body: JSON.stringify(payload)
            });
        apiCall.then(async (response) => {
          if(response.ok){
            // Reload appointments from API to get the server-assigned id
            const listResponse = await fetch(`${apiBase}/appointments`, {credentials: 'include'});
            if(listResponse.ok){
              const apiAppointments = await listResponse.json();
              state.appointments = (apiAppointments || []).map(a => typeof normalizeAppointment === 'function' ? normalizeAppointment(a) : a);
            }
          } else {
            console.error('API error saving appointment:', response.status, await response.text());
          }
          if(typeof renderAll === 'function') renderAll();
        }).catch((err) => {
          console.error('API error saving appointment:', err);
          if(typeof renderAll === 'function') renderAll();
        });
      } else {
        // Demo mode — update local state only
        if(editId){
          const existing = state.appointments.find((entry)=>entry.id === editId);
          if(existing){
            Object.assign(existing, payload);
            if(currentUser?.role === 'admin'){
              existing.needsReconfirm = false;
            }
          }
        } else {
          state.appointments.push({ id: `a${Date.now()}`, ...payload });
        }
        if(typeof saveState === 'function') saveState();
        if(typeof renderAll === 'function') renderAll();
      }
      closeOverviewModalV54();
      return false;
    };
  }

  function openAppointmentEditorSheet(appointmentId = '', presetDate = ''){
    const appointment = appointmentId ? state.appointments.find((entry)=>entry.id === appointmentId) : null;
    document.body.classList.add('modal-open');
    openOverviewLayer(
      appointment ? 'Termin bearbeiten' : 'Termin vergeben',
      appointment ? 'Bearbeite diesen Termin in einer eigenen ruhigen Ansicht.' : 'Vergib einen festen Termin in einer eigenen ruhigen Ansicht.',
      buildAppointmentEditorHtml({ appointment, presetDate })
    );
    bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
    bindFinalAppointmentEditor({ appointment, presetDate });
    return false;
  }

  function buildTodayOverviewHtmlPro(){
    const base = new Date();
    const today = `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`;
    const items = sortedAppointments(visibleAppointments()).filter((appointment)=>appointment.date === today);
    if(!items.length){
      return `
        <div class="overview-day-sheet">
          <div class="overview-day-sheet-head">
            <div>
              <span class="helper-badge">Heute</span>
              <strong>${base.toLocaleDateString('de-DE',{weekday:'long', day:'2-digit', month:'2-digit', year:'numeric'})}</strong>
            </div>
          </div>
          <div class="overview-day-empty">
            <strong>Heute sind aktuell keine Termine eingetragen.</strong>
            <span class="subtle">Sobald Termine geplant sind, erscheinen sie hier in einer kompakten Übersicht.</span>
            <div class="overview-day-actions">
              <button type="button" class="button primary" onclick="return window.openAppointmentEditorV64 ? window.openAppointmentEditorV64('', '${today}') : false;">${currentUser?.role === 'admin' ? 'Jetzt Termin vergeben' : 'Termin anfragen'}</button>
            </div>
          </div>
        </div>
      `;
    }
    return `
      <div class="overview-day-sheet">
        <div class="overview-day-sheet-head">
          <div>
            <span class="helper-badge">${items.length} Termin${items.length === 1 ? '' : 'e'}</span>
            <strong>${base.toLocaleDateString('de-DE',{weekday:'long', day:'2-digit', month:'2-digit', year:'numeric'})}</strong>
          </div>
          <span class="subtle">Alle Termine für heute auf einen Blick.</span>
        </div>
        <div class="overview-day-card-list">
          ${items.map((appointment)=>{
            return buildAppointmentDetailCard(appointment);
          }).join('')}
        </div>
      </div>
    `;
  }

  function openWeekDayOverview(dateKey){
    const date = parseDate(dateKey);
    const items = sortedAppointments(visibleAppointments()).filter((appointment)=>appointment.date === dateKey);
    const titleLabel = date ? date.toLocaleDateString('de-DE',{weekday:'long', day:'2-digit', month:'2-digit', year:'numeric'}) : dateKey;
    document.body.classList.add('modal-open');
    openOverviewLayer('Tagesansicht', `${titleLabel} im Detail.`, items.length ? `
      <div class="overview-day-sheet">
        <div class="overview-day-sheet-head">
          <div>
            <span class="helper-badge">${items.length} Termin${items.length === 1 ? '' : 'e'}</span>
            <strong>${titleLabel}</strong>
          </div>
          <span class="subtle">Alle Termine dieses Tages professionell und kompakt im Überblick.</span>
        </div>
        <div class="overview-day-card-list">
          ${items.map((appointment)=>buildAppointmentDetailCard(appointment)).join('')}
        </div>
      </div>
    ` : `
      <div class="overview-day-sheet">
        <div class="overview-day-empty">
          <strong>Für diesen Tag sind aktuell keine Termine eingetragen.</strong>
          <span class="subtle">Sobald Termine geplant sind, erscheinen sie hier in der Tagesansicht.</span>
          <div class="overview-day-actions">
            <button type="button" class="button primary" onclick="return window.openAppointmentEditorV64 ? window.openAppointmentEditorV64('', '${dateKey}') : false;">${currentUser?.role === 'admin' ? 'Jetzt Termin vergeben' : 'Termin anfragen'}</button>
          </div>
        </div>
      </div>
    `);
    bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
    return false;
  }

  function buildWeekOverviewHtmlPro(){
    const base = new Date();
    const visible = sortedAppointments(visibleAppointments());
    const monday = new Date(base);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);
    const days = [];
    for(let i = 0; i < 7; i++){
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const key = `${current.getFullYear()}-${pad(current.getMonth()+1)}-${pad(current.getDate())}`;
      days.push({ date: current, key, items: visible.filter((appointment)=>appointment.date === key) });
    }
    return `
      <div class="overview-week-pro-grid">
        ${days.map((dayEntry)=>{
          const isBusy = dayEntry.items.length > 0;
          return `
            <article class="overview-week-card-pro ${isBusy ? 'is-busy' : 'is-open'}">
              <div class="overview-week-card-head">
                <div>
                  <span class="helper-badge">${dayEntry.items.length} Termin${dayEntry.items.length === 1 ? '' : 'e'}</span>
                  <strong>${dayEntry.date.toLocaleDateString('de-DE',{weekday:'long'})}</strong>
                  <span class="subtle">${dayEntry.date.toLocaleDateString('de-DE',{day:'2-digit', month:'2-digit', year:'numeric'})}</span>
                </div>
                <button type="button" class="button secondary small-btn" onclick="return window.openWeekDayOverviewV64 ? window.openWeekDayOverviewV64('${dayEntry.key}') : false;">Tag öffnen</button>
              </div>
              <div class="overview-week-card-body">
                ${isBusy ? dayEntry.items.slice(0, 3).map((appointment)=>`
                  <div class="overview-week-mini-item">
                    <strong>${appointment.time} · ${appointment.service}</strong>
                    <span class="subtle">${displayName(appointment.customerId)}</span>
                  </div>
                `).join('') : '<div class="overview-empty-state">An diesem Tag ist aktuell noch alles frei planbar.</div>'}
              </div>
            </article>
          `;
        }).join('')}
      </div>
      <div class="calendar-link-row">
        <button type="button" class="button secondary small-btn" onclick="closeOverviewModalV54(); openTab('calendar');">Zum Kalender</button>
      </div>
    `;
  }

  function finalBindOverviewCards(){
    const todayCard = document.getElementById('todayOverviewCard');
    const weekCard = document.getElementById('weekOverviewCard');
    const todayRow = todayCard?.querySelector('.calendar-link-row');
    const weekRow = weekCard?.querySelector('.calendar-link-row');
    let todayBtn = document.getElementById('openTodayOverviewBtn');
    let weekBtn = document.getElementById('openWeekOverviewBtn');
    let calendarBtn = document.getElementById('jumpToCalendarFromWeek');

    [todayCard, weekCard].forEach((card)=>{
      if(!card) return;
      card.onclick = null;
      card.onkeydown = null;
      card.removeAttribute('onclick');
      card.removeAttribute('tabindex');
      card.removeAttribute('role');
    });

    if(todayBtn){
      todayBtn.type = 'button';
      todayBtn.className = 'button secondary small-btn';
      todayBtn.innerHTML = 'Tagesübersicht öffnen';
      if(todayRow && todayBtn.parentElement !== todayRow) todayRow.appendChild(todayBtn);
      todayBtn.onclick = window.openTodayOverviewV64;
    }

    if(!weekBtn){
      weekBtn = document.createElement('button');
      weekBtn.type = 'button';
      weekBtn.id = 'openWeekOverviewBtn';
    }
    weekBtn.className = 'button secondary small-btn';
    weekBtn.innerHTML = 'Wochenansicht öffnen';
    if(weekRow && weekBtn.parentElement !== weekRow) weekRow.prepend(weekBtn);
    weekBtn.onclick = window.openWeekOverviewV64;

    if(!calendarBtn){
      calendarBtn = document.createElement('button');
      calendarBtn.type = 'button';
      calendarBtn.id = 'jumpToCalendarFromWeek';
    }
    calendarBtn.className = 'theme-icon-btn overview-calendar-icon';
    calendarBtn.setAttribute('aria-label', 'Kalender öffnen');
    calendarBtn.title = 'Kalender öffnen';
    calendarBtn.innerHTML = '<svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.75a1 1 0 0 1 2 0v1h6v-1a1 1 0 1 1 2 0v1h.75A2.25 2.25 0 0 1 20 7v10.25a2.25 2.25 0 0 1-2.25 2.25H6.25A2.25 2.25 0 0 1 4 17.25V7a2.25 2.25 0 0 1 2.25-2.25H7v-1ZM6 9.5v7.75c0 .14.11.25.25.25h11.5a.25.25 0 0 0 .25-.25V9.5H6Zm11.75-2.75H6.25A.25.25 0 0 0 6 7v.5h12V7a.25.25 0 0 0-.25-.25Z"/></svg>';
    if(weekRow && calendarBtn.parentElement !== weekRow) weekRow.appendChild(calendarBtn);
    calendarBtn.onclick = function(event){
      event.preventDefault();
      event.stopPropagation();
      openTab('calendar');
      return false;
    };
  }

  function finalRenderSettings(){
    const box = document.getElementById('timeSettingsList');
    const reminderBox = document.getElementById('reminderSettingsBox');
    if(!box || typeof ensureSettings !== 'function') return;
    ensureSettings();
    const customerRows = typeof customerUsers === 'function' ? customerUsers() : [];
    const missingEmail = customerRows.filter((customer)=>!customer.email).length;
    const missingWhatsapp = customerRows.filter((customer)=>!(customer.whatsapp || customer.phone)).length;
    const missingInstagram = customerRows.filter((customer)=>!customer.instagram).length;
    const reminderHint = function(count, label){
      return count
        ? `<span class="reminder-hint">${count} Kundin${count===1?'':'nen'} hat ${count===1?'':'haben'} ${label} noch nicht angegeben.</span>`
        : `<span class="reminder-hint is-ok">${label} bei allen verfügbar.</span>`;
    };
    const days = ['Mo','Di','Mi','Do','Fr','Sa','So'];
    box.innerHTML = days.map((day)=>{
      const slot = state.settings.openingHours[day];
      const stats = typeof getOpeningDayStats === 'function' ? getOpeningDayStats(day) : null;
      const slotPreview = slot.enabled ? buildSlotsFromConfig(slot).slice(0, 4).map((entry)=>entry.time) : [];
      return `
        <div class="time-setting-row schedule-day-card ${slot.enabled ? '' : 'is-disabled'}" data-opening-day="${day}">
          <div class="time-day-summary">
            <div>
              <strong>${day}</strong>
              <div class="subtle">${slot.enabled ? `${slot.start} - ${slot.end} · Termin ${slot.slotMinutes || 30} Min. · Puffer ${slot.bufferMinutes || 0} Min.` : 'Keine Terminvergabe aktiv'}</div>
            </div>
            <span class="helper-badge">${slot.enabled ? 'Aktiv' : 'Pause'}</span>
          </div>
          <div class="time-slot-preview">
            ${slotPreview.length ? slotPreview.map((time)=>`<span class="week-chip">${time}</span>`).join('') : '<span class="week-empty">Keine freien Zeitfenster hinterlegt</span>'}
          </div>
          <div class="list-meta">
            ${stats ? `<span>Nächster Tag: ${stats.dateLabel}</span><span>${stats.free} frei</span><span>${stats.blocked} blockiert</span><span>${stats.total} gesamt</span>` : '<span>Aktuell keine buchbaren Zeiten für diesen Tag</span>'}
          </div>
          <div class="time-setting-actions">
            <button type="button" class="button secondary small-btn" data-opening-day="${day}" onclick="return window.__liaOpenOpeningHoursDirect ? window.__liaOpenOpeningHoursDirect('${day}') : false;">Zeiten bearbeiten</button>
          </div>
        </div>
      `;
    }).join('');

    box.querySelectorAll('[data-opening-day]').forEach((button)=>{
      button.onclick = function(event){
        event.preventDefault();
        event.stopPropagation();
        window.openOpeningHoursDay?.(button.getAttribute('data-opening-day'));
        return false;
      };
    });

    if(reminderBox){
      const reminderSettings = state.settings.reminders || {};
      const channels = reminderSettings.channels || {};
      const hint = function(count, label){
        return count
          ? `<span class="reminder-hint">${count} Kundin${count===1?'':'nen'} hat ${count===1?'':'haben'} ${label} noch nicht angegeben.</span>`
          : `<span class="reminder-hint is-ok">${label} bei allen verfügbar.</span>`;
      };
      reminderBox.innerHTML = `
        <div class="reminder-settings-card">
          <div class="rule-card compact-rule-card reminder-message-box">
            <div class="reminder-section-title">
              <strong>Erinnerungstext</strong>
              <span class="subtle small-note">Eigener Textbaustein für deine Erinnerungen</span>
            </div>
            <label>
              <textarea id="reminderMessage" rows="5" placeholder="Zum Beispiel: Hallo ✨ dein Termin ist bald. Wir freuen uns auf dich!">${reminderSettings.message || ''}</textarea>
            </label>
            <span class="subtle small-note">Emojis können hier ganz normal verwendet werden.</span>
          </div>
          <div class="rule-card compact-rule-card reminder-options-box">
            <div class="reminder-section-title">
              <strong>Versand & Kanäle</strong>
              <span class="subtle small-note">Lege fest, wann und worüber erinnert werden soll</span>
            </div>
            <div class="grid-two reminder-meta-grid">
              <label><span>Versand vor dem Termin</span>
                <select id="reminderLeadMinutes">
                  <option value="60" ${String(reminderSettings.leadMinutes)==='60' ? 'selected' : ''}>1 Stunde vorher</option>
                  <option value="180" ${String(reminderSettings.leadMinutes)==='180' ? 'selected' : ''}>3 Stunden vorher</option>
                  <option value="720" ${String(reminderSettings.leadMinutes)==='720' ? 'selected' : ''}>12 Stunden vorher</option>
                  <option value="1440" ${String(reminderSettings.leadMinutes)==='1440' ? 'selected' : ''}>1 Tag vorher</option>
                  <option value="2880" ${String(reminderSettings.leadMinutes)==='2880' ? 'selected' : ''}>2 Tage vorher</option>
                </select>
              </label>
              <div class="reminder-channel-wrap">
                <span>Kanäle</span>
                <label class="checkbox-card reminder-channel-card"><input type="checkbox" id="reminderChannelEmail" ${channels.email ? 'checked' : ''}><span>E-Mail</span></label>
                ${reminderHint(missingEmail, 'E-Mail')}
                <label class="checkbox-card reminder-channel-card"><input type="checkbox" id="reminderChannelWhatsapp" ${channels.whatsapp ? 'checked' : ''}><span>WhatsApp</span></label>
                ${reminderHint(missingWhatsapp, 'WhatsApp / Telefonnummer')}
                <label class="checkbox-card reminder-channel-card"><input type="checkbox" id="reminderChannelInstagram" ${channels.instagram ? 'checked' : ''}><span>Instagram</span></label>
                ${reminderHint(missingInstagram, 'Instagram')}
                <span class="subtle small-note">Mehrere Kanäle können gleichzeitig aktiviert werden.</span>
              </div>
            </div>
          </div>
        </div>
      `;
      const reminderMessage = document.getElementById('reminderMessage');
      const reminderLeadMinutes = document.getElementById('reminderLeadMinutes');
      const reminderChannelEmail = document.getElementById('reminderChannelEmail');
      const reminderChannelWhatsapp = document.getElementById('reminderChannelWhatsapp');
      const reminderChannelInstagram = document.getElementById('reminderChannelInstagram');
      if(reminderMessage){
        const saveReminderMessage = function(){
          state.settings.reminders.message = reminderMessage.value;
          if(typeof saveState === 'function') saveState();
        };
        reminderMessage.oninput = saveReminderMessage;
        reminderMessage.onchange = saveReminderMessage;
      }
      if(reminderLeadMinutes){
        reminderLeadMinutes.onchange = function(){
          state.settings.reminders.leadMinutes = Number(reminderLeadMinutes.value);
          if(typeof saveState === 'function') saveState();
        };
      }
      if(reminderChannelEmail){
        reminderChannelEmail.onchange = function(){
          state.settings.reminders.channels.email = !!reminderChannelEmail.checked;
          if(typeof saveState === 'function') saveState();
          finalRenderSettings();
        };
      }
      if(reminderChannelWhatsapp){
        reminderChannelWhatsapp.onchange = function(){
          state.settings.reminders.channels.whatsapp = !!reminderChannelWhatsapp.checked;
          if(typeof saveState === 'function') saveState();
          finalRenderSettings();
        };
      }
      if(reminderChannelInstagram){
        reminderChannelInstagram.onchange = function(){
          state.settings.reminders.channels.instagram = !!reminderChannelInstagram.checked;
          if(typeof saveState === 'function') saveState();
          finalRenderSettings();
        };
      }
    }
    const activeDays = days.filter((day)=>state.settings.openingHours[day]?.enabled).length;
    box.innerHTML = `
      <div class="rule-card compact-rule-card settings-launch-card">
        <div class="settings-launch-copy">
          <strong>Termine festlegen</strong>
          <span class="subtle">${activeDays} aktive Tage · Öffne die Terminvergabe in einem eigenen Bereich.</span>
        </div>
        <button type="button" class="button secondary" id="openOpeningHoursOverview">Terminzeiten öffnen</button>
      </div>
    `;
    const reminderLeadLabel = String(state.settings.reminders?.leadMinutes || 1440) === '60'
      ? '1 Stunde vorher'
      : String(state.settings.reminders?.leadMinutes || 1440) === '180'
        ? '3 Stunden vorher'
        : String(state.settings.reminders?.leadMinutes || 1440) === '720'
          ? '12 Stunden vorher'
          : String(state.settings.reminders?.leadMinutes || 1440) === '2880'
            ? '2 Tage vorher'
            : '1 Tag vorher';
    const channels = state.settings.reminders?.channels || {};
    const activeChannels = ['E-Mail', 'WhatsApp', 'Instagram'].filter((label, index)=>[channels.email, channels.whatsapp, channels.instagram][index]);
    reminderBox.innerHTML = `
      <div class="rule-card compact-rule-card settings-launch-card">
        <div class="settings-launch-copy">
          <strong>Erinnerungen</strong>
          <span class="subtle">${reminderLeadLabel} · ${activeChannels.length ? activeChannels.join(', ') : 'Kein Kanal aktiv'}</span>
        </div>
        <button type="button" class="button secondary" id="openReminderSettingsSheet">Erinnerungen öffnen</button>
      </div>
    `;
    document.getElementById('openOpeningHoursOverview')?.addEventListener('click', (event)=>{
      event.preventDefault();
      event.stopPropagation();
      finalOpenOpeningHoursOverview();
    });
    document.getElementById('openReminderSettingsSheet')?.addEventListener('click', (event)=>{
      event.preventDefault();
      event.stopPropagation();
      finalOpenReminderSettingsSheet({ missingEmail, missingWhatsapp, missingInstagram, hint: reminderHint });
    });
    // Render services and reports boxes
    window.setTimeout(()=>{
      try { if(typeof window.renderServicesSettingsBox === 'function') window.renderServicesSettingsBox(); } catch(e) {}
      try { if(typeof window.renderReportsSettingsBox === 'function') window.renderReportsSettingsBox(); } catch(e) {}
    }, 0);
  }

  function finalOpenOpeningHoursOverview(){
    const days = ['Mo','Di','Mi','Do','Fr','Sa','So'];
    document.body.classList.add('modal-open');
    openOverviewLayer('Termine festlegen', 'Lege fest, wann an den einzelnen Tagen Termine vergeben werden können.', `
      <div class="time-settings-list">
        ${days.map((day)=>{
          const slot = state.settings.openingHours[day];
          const stats = typeof getOpeningDayStats === 'function' ? getOpeningDayStats(day) : null;
          const slotPreview = slot.enabled ? buildSlotsFromConfig(slot).slice(0, 4).map((entry)=>entry.time) : [];
          return `
            <div class="time-setting-row schedule-day-card ${slot.enabled ? '' : 'is-disabled'}">
              <div class="time-day-summary">
                <div>
                  <strong>${day}</strong>
                  <div class="subtle">${slot.enabled ? `${slot.start} - ${slot.end} · Termin ${slot.slotMinutes || 30} Min.${slot.bufferMinutes ? ` · Puffer ${slot.bufferMinutes} Min.` : ''}` : 'Keine Terminvergabe aktiv'}</div>
                </div>
                <span class="helper-badge">${slot.enabled ? 'Aktiv' : 'Pause'}</span>
              </div>
              <div class="time-slot-preview">
                ${slotPreview.length ? slotPreview.map((time)=>`<span class="week-chip">${time}</span>`).join('') : '<span class="week-empty">Keine freien Zeitfenster hinterlegt</span>'}
              </div>
              <div class="list-meta">
                ${stats ? `<span>Nächster Tag: ${stats.dateLabel}</span><span>${stats.free} frei</span><span>${stats.blocked} blockiert</span><span>${stats.total} gesamt</span>` : '<span>Aktuell keine buchbaren Zeiten für diesen Tag</span>'}
              </div>
              <div class="time-setting-actions">
                <button type="button" class="button secondary small-btn" onclick="return window.__liaOpenOpeningHoursDirect ? window.__liaOpenOpeningHoursDirect('${day}') : false;">Zeiten bearbeiten</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `, { resetHistory:true });
    bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
    return false;
  }

  function renderServicesSettingsBox(){
    const box = document.getElementById('servicesSettingsBox');
    if(!box) return;
    const services = state.settings.services || {};
    const activeCount = Object.values(services).filter(v => v).length;
    const totalCount = Object.keys(services).length;
    box.innerHTML = `
      <div class="services-summary-row">
        <span class="helper-badge">${activeCount} aktiv</span>
        <span class="subtle">${totalCount} Leistung${totalCount === 1 ? '' : 'en'} insgesamt</span>
      </div>
      <div class="services-preview-chips">
        ${Object.entries(services).filter(([,v]) => v).map(([name]) => `<span class="week-chip">${name}</span>`).join('') || '<span class="week-empty">Keine aktiven Leistungen</span>'}
      </div>
    `;
  }

  function finalOpenServicesSettingsSheet(){
    const services = state.settings.services || {};
    document.body.classList.add('modal-open');
    openOverviewLayer('Leistungen bearbeiten', 'Füge neue Leistungen hinzu oder deaktiviere bestehende.', `
      <div class="services-settings-sheet">
        <div class="services-add-section">
          <form id="addServiceForm" class="simple-form">
            <div class="services-add-row">
              <input type="text" id="newServiceName" placeholder="Neue Leistung, z. B. Wimpernlifting" required>
              <button type="submit" class="button primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                Hinzufügen
              </button>
            </div>
          </form>
        </div>
        
        <div class="services-list-section">
          <div class="services-section-header">
            <strong>Aktive Leistungen</strong>
            <span class="helper-badge">${Object.values(services).filter(v => v).length}</span>
          </div>
          <div id="servicesActiveList" class="services-manage-list">
            ${Object.entries(services).filter(([,v]) => v).map(([name]) => `
              <div class="service-manage-item">
                <div class="service-manage-info">
                  <span class="service-manage-name">${name}</span>
                </div>
                <div class="service-manage-actions">
                  <button type="button" class="icon-btn service-toggle" data-service="${name}" title="Deaktivieren">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button type="button" class="icon-btn danger service-remove-btn" data-service="${name}" title="Löschen">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  </button>
                </div>
              </div>
            `).join('') || '<div class="empty-state">Noch keine Leistungen vorhanden</div>'}
          </div>
        </div>
        
        ${Object.entries(services).filter(([,v]) => !v).length ? `
        <div class="services-list-section is-inactive">
          <div class="services-section-header">
            <strong>Deaktiviert</strong>
            <span class="helper-badge muted">${Object.entries(services).filter(([,v]) => !v).length}</span>
          </div>
          <div id="servicesInactiveList" class="services-manage-list">
            ${Object.entries(services).filter(([,v]) => !v).map(([name]) => `
              <div class="service-manage-item is-inactive">
                <div class="service-manage-info">
                  <span class="service-manage-name strikethrough">${name}</span>
                </div>
                <div class="service-manage-actions">
                  <button type="button" class="icon-btn restore service-restore-btn" data-service="${name}" title="Wiederherstellen">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
                  </button>
                  <button type="button" class="icon-btn danger service-remove-btn" data-service="${name}" title="Endgültig löschen">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `, { resetHistory:true });
    bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
    
    document.getElementById('addServiceForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('newServiceName');
      const name = nameInput?.value?.trim();
      if(!name) return;
      if(state.settings.services[name]){
        state.settings.services[name] = true;
      } else {
        state.settings.services[name] = true;
      }
      saveState?.();
      nameInput.value = '';
      finalOpenServicesSettingsSheet();
      renderServicesSettingsBox?.();
    });
    
    document.querySelectorAll('.service-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const name = toggle.dataset.service;
        state.settings.services[name] = false;
        saveState?.();
        renderServicesSettingsBox?.();
        finalOpenServicesSettingsSheet();
      });
    });
    
    document.querySelectorAll('.service-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.service;
        document.body.classList.add('modal-open');
        openOverviewLayer('Leistung löschen', 'Bist du sicher?', `
          <div class="confirm-delete-section">
            <div class="confirm-delete-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <p class="confirm-delete-text">Möchtest du die Leistung <strong>"${name}"</strong> wirklich löschen?</p>
            <p class="confirm-delete-sub">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div class="confirm-delete-actions">
              <button type="button" class="button secondary" id="cancelDeleteService">Abbrechen</button>
              <button type="button" class="button danger" id="confirmDeleteService">Ja, löschen</button>
            </div>
          </div>
        `, { resetHistory: true, preventDuplicate: true });
        bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
        
        document.getElementById('cancelDeleteService')?.addEventListener('click', () => {
          if(typeof closeOverviewModalV54 === 'function') closeOverviewModalV54();
          document.body.classList.remove('modal-open');
        });
        document.getElementById('confirmDeleteService')?.addEventListener('click', () => {
          delete state.settings.services[name];
          saveState?.();
          renderServicesSettingsBox?.();
          if(typeof closeOverviewModalV54 === 'function') closeOverviewModalV54();
          document.body.classList.remove('modal-open');
          finalOpenServicesSettingsSheet();
        });
      });
    });
    
    document.querySelectorAll('.service-restore-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.service;
        state.settings.services[name] = true;
        saveState?.();
        finalOpenServicesSettingsSheet();
        renderServicesSettingsBox?.();
      });
    });
    
    return false;
  }

  function finalOpenReminderSettingsSheet(context){
    context = context || {};
    const safeHint = typeof context.hint === 'function' ? context.hint : ()=> '';
    const reminderSettings = state.settings.reminders || {};
    const channels = reminderSettings.channels || {};
    document.body.classList.add('modal-open');
    openOverviewLayer('Erinnerungen', 'Lege Text, Versandzeit und Kanäle in einem eigenen Bereich fest.', `
      <div class="reminder-settings-card">
        <div class="rule-card compact-rule-card reminder-message-box">
          <div class="reminder-section-title">
            <strong>Erinnerungstext</strong>
            <span class="subtle small-note">Eigener Textbaustein für deine Erinnerungen</span>
          </div>
          <label>
            <textarea id="reminderMessage" rows="5" placeholder="Zum Beispiel: Hallo ✨ dein Termin ist bald. Wir freuen uns auf dich!">${reminderSettings.message || ''}</textarea>
          </label>
          <span class="subtle small-note">Emojis können hier ganz normal verwendet werden.</span>
        </div>
        <div class="rule-card compact-rule-card reminder-options-box">
          <div class="reminder-section-title">
            <strong>Versand & Kanäle</strong>
            <span class="subtle small-note">Lege fest, wann und worüber erinnert werden soll</span>
          </div>
          <div class="grid-two reminder-meta-grid">
            <label><span>Versand vor dem Termin</span>
              <select id="reminderLeadMinutes">
                <option value="60" ${String(reminderSettings.leadMinutes)==='60' ? 'selected' : ''}>1 Stunde vorher</option>
                <option value="180" ${String(reminderSettings.leadMinutes)==='180' ? 'selected' : ''}>3 Stunden vorher</option>
                <option value="720" ${String(reminderSettings.leadMinutes)==='720' ? 'selected' : ''}>12 Stunden vorher</option>
                <option value="1440" ${String(reminderSettings.leadMinutes)==='1440' ? 'selected' : ''}>1 Tag vorher</option>
                <option value="2880" ${String(reminderSettings.leadMinutes)==='2880' ? 'selected' : ''}>2 Tage vorher</option>
              </select>
            </label>
            <div class="reminder-channel-wrap">
              <span>Kanäle</span>
              <label class="checkbox-card reminder-channel-card"><input type="checkbox" id="reminderChannelEmail" ${channels.email ? 'checked' : ''}><span>E-Mail</span></label>
              ${safeHint(context.missingEmail, 'E-Mail')}
              <label class="checkbox-card reminder-channel-card"><input type="checkbox" id="reminderChannelWhatsapp" ${channels.whatsapp ? 'checked' : ''}><span>WhatsApp</span></label>
              ${safeHint(context.missingWhatsapp, 'WhatsApp / Telefonnummer')}
              <label class="checkbox-card reminder-channel-card"><input type="checkbox" id="reminderChannelInstagram" ${channels.instagram ? 'checked' : ''}><span>Instagram</span></label>
              ${safeHint(context.missingInstagram, 'Instagram')}
              <span class="subtle small-note">Mehrere Kanäle können gleichzeitig aktiviert werden.</span>
            </div>
          </div>
        </div>
      </div>
    `, { resetHistory:true });
    bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
    document.getElementById('reminderMessage')?.addEventListener('input', ()=>{
      state.settings.reminders.message = document.getElementById('reminderMessage')?.value || '';
      if(typeof saveState === 'function') saveState();
    });
    document.getElementById('reminderLeadMinutes')?.addEventListener('change', ()=>{
      state.settings.reminders.leadMinutes = Number(document.getElementById('reminderLeadMinutes')?.value || 1440);
      if(typeof saveState === 'function') saveState();
      finalRenderSettings();
    });
    document.getElementById('reminderChannelEmail')?.addEventListener('change', ()=>{
      state.settings.reminders.channels.email = !!document.getElementById('reminderChannelEmail')?.checked;
      if(typeof saveState === 'function') saveState();
      finalRenderSettings();
    });
    document.getElementById('reminderChannelWhatsapp')?.addEventListener('change', ()=>{
      state.settings.reminders.channels.whatsapp = !!document.getElementById('reminderChannelWhatsapp')?.checked;
      if(typeof saveState === 'function') saveState();
      finalRenderSettings();
    });
    document.getElementById('reminderChannelInstagram')?.addEventListener('change', ()=>{
      state.settings.reminders.channels.instagram = !!document.getElementById('reminderChannelInstagram')?.checked;
      if(typeof saveState === 'function') saveState();
      finalRenderSettings();
    });
    return false;
  }

  function finalBuildNotifications(){
    if(!currentUser) return [];
    const items = [];

    sortedAppointments(visibleAppointments())
      .filter((appointment)=>appointment.status === 'open' || appointment.needsReconfirm)
      .forEach((appointment)=>{
        items.push({
          key: `appointment-${appointment.id}-${appointment.updatedAt || appointment.date}-${appointment.status}-${appointment.needsReconfirm ? 'reconfirm' : 'open'}`,
          type: 'request',
          title: appointment.needsReconfirm ? 'Termin erneut bestätigen' : 'Neue Anfrage',
          text: `${appointment.service} · ${displayName(appointment.customerId)}`,
          meta: `${formatDateOnly(appointment.date)} · ${appointment.time}`,
          timestamp: appointment.updatedAt || `${appointment.date}T${appointment.time || '00:00'}:00`,
          action: ()=> openTasksAndReveal(`request-${appointment.id}`)
        });
      });

    if(currentUser.role === 'admin'){
      pendingCustomerUsers()
        .forEach((customer)=>{
          items.push({
            key: `registration-${customer.id}-${customer.createdAt || customer.lastEdited}`,
            type: 'task',
            title: 'Neue Registrierung',
            text: `${customer.name} wartet auf Freigabe`,
            meta: customer.email || customer.phone || 'Neue Kundin',
            timestamp: customer.createdAt || customer.lastEdited || nowISO(),
            action: ()=> openTasksAndReveal(`registration-${customer.id}`)
          });
        });
      customerUsers()
        .map((customer)=>({customer, status: customerDocsStatus(customer)}))
        .filter((entry)=>entry.status.missing.length > 0)
        .forEach((entry)=>{
          items.push({
            key: `docs-${entry.customer.id}-${entry.status.missing.join('-')}`,
            type: 'task',
            title: 'Offene Unterlagen',
            text: `${entry.customer.name} · ${entry.status.missing.join(', ')}`,
            meta: 'Bitte vervollständigen',
            timestamp: entry.customer.lastEdited || entry.customer.createdAt || nowISO(),
            action: ()=> openTasksAndReveal(`doc-${entry.customer.id}`)
          });
        });
    }

    visibleCustomTasks()
      .filter((task)=>task.status !== 'done')
      .forEach((task)=>{
        items.push({
          key: `custom-${task.id}-${task.createdAt}-${task.status}`,
          type: 'task',
          title: 'Offene Aufgabe',
          text: task.title,
          meta: task.reminderAt ? `Erinnerung ${formatGermanDate(task.reminderAt)}` : 'Ohne Erinnerungszeitpunkt',
          timestamp: task.createdAt || task.reminderAt || nowISO(),
          action: ()=> openTasksAndReveal(`custom-${task.id}`)
        });
      });

    return items
      .map((item)=>({...item, ageLabel: formatRelativeAge(item.timestamp)}))
      .sort((left, right)=>new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime());
  }

  function finalRenderOverviewReminder(){
    const reminder = document.getElementById('overviewTasksReminder');
    if(!reminder || !currentUser) return;
    reminder.onclick = null;
    reminder.onkeydown = null;
    reminder.removeAttribute('role');
    reminder.removeAttribute('tabindex');
    reminder.classList.remove('is-clickable');

    if(currentUser.role === 'admin'){
      const pendingRegistrations = pendingCustomerUsers().length;
      const openItems = visibleAppointments().filter((appointment)=>appointment.status === 'open' || appointment.needsReconfirm);
      const docsOpenCount = customerUsers().filter((customer)=>customerDocsStatus(customer).missing.length > 0).length;
      const customOpenCount = visibleCustomTasks().filter((task)=>task.status !== 'done').length;
      const totalOpen = openItems.length + docsOpenCount + customOpenCount + pendingRegistrations;
      const hasOpenTasks = totalOpen > 0;
      let reminderText = 'Es gibt noch offene Aufgaben!';
      if(pendingRegistrations > 0 && openItems.length === 0 && docsOpenCount === 0 && customOpenCount === 0){
        reminderText = `${pendingRegistrations} neue Registrierung${pendingRegistrations === 1 ? '' : 'en'} warten auf Freigabe.`;
      } else if(totalOpen > 0){
        const parts = [];
        if(openItems.length) parts.push(`${openItems.length} offene Anfrage${openItems.length === 1 ? '' : 'n'}`);
        if(pendingRegistrations) parts.push(`${pendingRegistrations} Registrierung${pendingRegistrations === 1 ? '' : 'en'}`);
        if(docsOpenCount) parts.push(`${docsOpenCount} fehlende Unterlagen`);
        if(customOpenCount) parts.push(`${customOpenCount} eigene Aufgabe${customOpenCount === 1 ? '' : 'n'}`);
        reminderText = parts.join(' · ');
      }
      reminder.innerHTML = `
        <span class="overview-reminder-icon" aria-hidden="true">!</span>
        <span class="overview-reminder-copy">${reminderText}</span>
      `;
      reminder.classList.toggle('hidden', !hasOpenTasks);
      if(hasOpenTasks){
        reminder.classList.add('is-clickable');
        reminder.setAttribute('role', 'button');
        reminder.setAttribute('tabindex', '0');
        reminder.onclick = ()=> openTab('tasks');
        reminder.onkeydown = (event)=>{
          if(event.key === 'Enter' || event.key === ' '){
            event.preventDefault();
            openTab('tasks');
          }
        };
      }
      return;
    }

    const hasAnyBooking = visibleAppointments().some((appointment)=>appointment.status !== 'declined');
    reminder.innerHTML = `
      <span class="overview-reminder-icon" aria-hidden="true">!</span>
      <span class="overview-reminder-copy">Du hast aktuell noch keinen Termin gebucht.</span>
    `;
    reminder.classList.toggle('hidden', hasAnyBooking);
    if(!hasAnyBooking){
      reminder.classList.add('is-clickable');
      reminder.setAttribute('role', 'button');
      reminder.setAttribute('tabindex', '0');
      reminder.onclick = ()=> openTab('calendar');
      reminder.onkeydown = (event)=>{
        if(event.key === 'Enter' || event.key === ' '){
          event.preventDefault();
          openTab('calendar');
        }
      };
    }
  }

  function finalRenderAppointmentsHub(){
    const hub = document.getElementById('appointmentsHub');
    if(!hub || !currentUser) return;
    const isAdmin = currentUser.role === 'admin';
    const searchQuery = (document.getElementById('appointmentsSearch')?.value || '').trim().toLowerCase();
    const statusFilter = document.getElementById('appointmentsStatusFilter')?.value || 'all';
    const visibleList = sortedAppointments(visibleAppointments()).filter((appointment)=>{
      const customerName = displayName(appointment.customerId).toLowerCase();
      const haystack = `${appointment.service || ''} ${customerName} ${appointment.note || ''} ${appointment.date || ''} ${appointment.time || ''}`.toLowerCase();
      const matchesSearch = !searchQuery || haystack.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' ? true : appointment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    hub.innerHTML = `
      <div class="cards appointments-layout">
        <div class="card panel appointments-main-panel">
          <header class="appointments-head">
            <div>
              <h2>Termine</h2>
              <p class="subtle">Komplette Übersicht aller bereits vergebenen Termine.</p>
            </div>
            <span class="helper-badge">${visibleList.length} sichtbar</span>
          </header>
          <div class="appointments-toolbar">
            <label class="icon-search-field">
              <span>⌕</span>
              <input type="text" id="appointmentsSearch" placeholder="Kundin, Leistung oder Notiz suchen" value="${searchQuery.replace(/"/g, '&quot;')}">
            </label>
            <label class="appointments-filter">
              <span>Status</span>
              <select id="appointmentsStatusFilter">
                <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>Alle</option>
                <option value="confirmed" ${statusFilter === 'confirmed' ? 'selected' : ''}>Bestätigt</option>
                <option value="open" ${statusFilter === 'open' ? 'selected' : ''}>Offen</option>
                <option value="declined" ${statusFilter === 'declined' ? 'selected' : ''}>Abgelehnt</option>
              </select>
            </label>
          </div>
          <div class="appointments-list" id="appointmentsList">
            ${visibleList.length ? visibleList.map((appointment)=>{
              const customer = state.users.find((user)=>user.id === appointment.customerId) || null;
              const avatar = customer ? __liaOverviewAvatar(customer) : '<span class="overview-appointment-avatar">--</span>';
              return `
                <div class="appointments-list-item">
                  <div class="appointments-item-main">
                    <div class="appointments-item-time">
                      <strong>${formatDateOnly(appointment.date)}</strong>
                      <span>${appointment.time}</span>
                    </div>
                    <div class="appointments-item-person">
                      ${avatar}
                      <div class="appointments-item-copy">
                        <strong>${displayName(appointment.customerId)}</strong>
                        <span>${appointment.service}</span>
                        ${appointment.note ? `<div class="subtle">${appointment.note}</div>` : ''}
                      </div>
                    </div>
                  </div>
                  <div class="appointments-item-meta">
                    <span class="pill ${statusClass(appointment.status)}">${statusLabel(appointment.status)}</span>
                    <div class="inline-actions">
                      <button type="button" class="button secondary small-btn" onclick="return openAppointmentFromDay('${appointment.id}')">Öffnen</button>
                      ${isAdmin ? `<button type="button" class="button secondary small-btn" onclick="return editCustomer('${appointment.customerId}')">Kundin</button>` : ''}
                    </div>
                    <span class="subtle appointments-updated-line">Zuletzt bearbeitet von ${appointment.updatedBy}</span>
                  </div>
                </div>
              `;
            }).join('') : '<div class="empty-note">Aktuell gibt es keine passenden Termine für deinen Filter.</div>'}
          </div>
        </div>
        <div class="card panel appointments-side-panel">
          <header>
            <h2>Terminstatus</h2>
            <p class="subtle">Schneller Überblick über offene, bestätigte und vergangene Einträge.</p>
          </header>
          <div class="overview-mini-stats appointments-mini-stats">
            <div class="mini-stat"><strong>${visibleList.length}</strong><span>Gesamt</span></div>
            <div class="mini-stat"><strong>${visibleList.filter((appointment)=>appointment.status === 'confirmed').length}</strong><span>Bestätigt</span></div>
            <div class="mini-stat"><strong>${visibleList.filter((appointment)=>appointment.status === 'open').length}</strong><span>Offen</span></div>
          </div>
          <div class="overview-empty-card compact">
            <strong>${visibleList[0] ? 'Nächster Termin im Blick' : 'Noch keine Termine vorhanden'}</strong>
            <span>${visibleList[0] ? `${formatDateOnly(visibleList[0].date)} · ${visibleList[0].time} · ${displayName(visibleList[0].customerId)}` : 'Sobald ein Termin vergeben wurde, erscheint er hier zusätzlich im Überblick.'}</span>
          </div>
        </div>
      </div>
    `;

    const search = document.getElementById('appointmentsSearch');
    const filter = document.getElementById('appointmentsStatusFilter');
    if(search) search.oninput = finalRenderAppointmentsHub;
    if(filter) filter.onchange = finalRenderAppointmentsHub;
  }

  function finalRenderTasks(){
    if(typeof window.__liaBaseRenderTasks === 'function'){
      window.__liaBaseRenderTasks();
    }
    if(!currentUser) return;
    normalizeTasksCards();
    bindFinalTaskActions();

    if(currentUser.role === 'admin'){
      const metric = document.getElementById('tasksMetricGrid');
      const accordion = document.getElementById('tasksAccordion');
      const query = (document.getElementById('taskCustomerSearch')?.value || '').trim().toLowerCase();
      const pendingRows = pendingCustomerUsers().filter((customer)=>!query || `${customer.name} ${customer.email} ${customer.phone || ''}`.toLowerCase().includes(query));
      if(metric && !metric.querySelector('.registration-metric-card')){
        metric.insertAdjacentHTML('afterbegin', `<button type="button" class="card metric-card clickable is-muted registration-metric-card" onclick="openTab('tasks')"><div class="metric-top"><span class="helper-badge pill-neutral">Neue Registrierungen</span></div><h3>${pendingRows.length}</h3><p>Warten auf Freigabe</p></button>`);
      }else if(metric?.querySelector('.registration-metric-card')){
        metric.querySelector('.registration-metric-card').outerHTML = `<button type="button" class="card metric-card clickable is-muted registration-metric-card" onclick="openTab('tasks')"><div class="metric-top"><span class="helper-badge pill-neutral">Neue Registrierungen</span></div><h3>${pendingRows.length}</h3><p>Warten auf Freigabe</p></button>`;
      }
      if(accordion){
        const registrationHtml = pendingRows.length ? pendingRows.map((customer)=>`
          <div class="task-accordion-item task-approval-card">
            <button type="button" class="task-toggle-btn" onclick="toggleTaskSection('registration-${customer.id}')">
              <span><strong>${customer.name}</strong><span class="subtle task-owner-line"> · ${customer.email}</span></span>
              <span class="task-count-badge">Neu</span>
            </button>
            <div class="task-section-body hidden" id="registration-${customer.id}">
              <div class="list-meta"><span>${customer.phone || 'Keine Telefonnummer'}</span><span>${customer.birthdate ? formatDateOnly(customer.birthdate) : 'Geburtsdatum offen'}</span></div>
              <div class="subtle">${customer.registrationNote || 'Keine zusätzliche Notiz hinterlegt.'}</div>
              <div class="list-meta"><span>Registriert am ${formatGermanDate(customer.createdAt)}</span><span>Wartet auf Freigabe</span></div>
              <div class="inline-actions">
                <button class="button secondary small-btn" onclick="approvePendingCustomer('${customer.id}')">Als Kundin freigeben</button>
                <button class="button secondary small-btn" onclick="rejectPendingCustomer('${customer.id}')">Ablehnen</button>
              </div>
            </div>
          </div>
        `).join('') : '<div class="empty-note">Aktuell gibt es keine neuen Registrierungen zur Freigabe.</div>';
        accordion.innerHTML = `<div class="task-section-title">Neue Registrierungen</div>${registrationHtml}${accordion.innerHTML}`;
      }
      return;
    }

    const tasksSideSubtle = document.querySelector('#tab-tasks .rules-head .subtle');
    if(tasksSideSubtle){
      tasksSideSubtle.textContent = 'Behalte deine Anfragen, deinen Terminstatus und eigene Notizen im Blick';
    }

    const tasksAccordion = document.getElementById('tasksAccordion');
    if(tasksAccordion){
      [...tasksAccordion.querySelectorAll('.task-section-title')].forEach((titleNode)=>{
        if((titleNode.textContent || '').trim().toLowerCase().includes('unterlagen')){
          const nextNodes = [];
          let cursor = titleNode.nextElementSibling;
          while(cursor && !cursor.classList.contains('task-section-title')){
            nextNodes.push(cursor);
            cursor = cursor.nextElementSibling;
          }
          nextNodes.forEach((node)=>node.remove());
          titleNode.remove();
        }
      });
    }
  }

  window.approvePendingCustomer = function(id){
    const idx = state.users.findIndex((user)=>user.id === id && user.role === 'customer');
    if(idx < 0 || currentUser?.role !== 'admin') return;
    state.users[idx].approvalStatus = 'approved';
    state.users[idx].approvedAt = nowISO();
    state.users[idx].approvedBy = currentUser.name;
    state.users[idx].lastEdited = nowISO();
    if(typeof saveState === 'function') saveState();
    finalRenderTasks();
    finalRenderOverviewReminder();
    if(typeof renderNotifications === 'function') renderNotifications();
    if(typeof renderAll === 'function') renderAll();
    openTab('tasks');
  };

  window.rejectPendingCustomer = function(id){
    const idx = state.users.findIndex((user)=>user.id === id && user.role === 'customer');
    if(idx < 0 || currentUser?.role !== 'admin') return;
    state.users[idx].approvalStatus = 'rejected';
    state.users[idx].approvedAt = '';
    state.users[idx].approvedBy = currentUser.name;
    state.users[idx].lastEdited = nowISO();
    if(typeof saveState === 'function') saveState();
    finalRenderTasks();
    finalRenderOverviewReminder();
    if(typeof renderNotifications === 'function') renderNotifications();
    if(typeof renderAll === 'function') renderAll();
    openTab('tasks');
  };

  window.restoreDeletedCustomer = function(id){
    const idx = state.users.findIndex((user)=>user.id === id && user.role === 'customer');
    if(idx < 0 || currentUser?.role !== 'admin') return false;
    state.users[idx].deletedAt = '';
    state.users[idx].deletedBy = '';
    state.users[idx].lastEdited = nowISO();
    if(typeof saveState === 'function') saveState();
    if(typeof renderCustomers === 'function') renderCustomers();
    if(typeof renderTasks === 'function') renderTasks();
    finalRenderHistoryLogList();
    if(typeof renderNotifications === 'function') renderNotifications();
    return false;
  };

  function finalOpenOpeningHoursDay(day){
    if(!day || typeof ensureSettings !== 'function') return false;
    ensureSettings();
    const config = state.settings.openingHours?.[day];
    if(!config) return false;
    document.body.classList.add('modal-open');
    openOverviewModalV54(`${day} bearbeiten`, 'Lege fest, wann an diesem Tag Termine vergeben werden können.', `
      <form id="finalOpeningHoursForm" class="simple-form" novalidate>
        <input type="hidden" id="finalOpeningHoursDay" value="${day}">
        <label class="checkbox-card"><input type="checkbox" id="finalOpeningHoursEnabled" ${config.enabled ? 'checked' : ''}><span>Termine an diesem Tag erlauben</span></label>
        <div class="grid-two">
          <label><span>Von</span><input type="time" id="finalOpeningHoursStart" value="${config.start || '09:00'}"></label>
          <label><span>Bis</span><input type="time" id="finalOpeningHoursEnd" value="${config.end || '18:00'}"></label>
        </div>
        <div class="grid-two">
          <label><span>Terminzeit in Minuten</span><input type="number" min="5" step="5" id="finalOpeningHoursSlotMinutes" value="${Number(config.slotMinutes || 30)}"></label>
          <label><span>Pufferzeit in Minuten</span><input type="number" min="0" step="5" id="finalOpeningHoursBufferMinutes" value="${Number(config.bufferMinutes || 0)}"></label>
        </div>
        <div class="opening-hours-preview">
          <strong>Vorschau freie Zeiten</strong>
          <div id="finalOpeningHoursPreview" class="week-day-content"></div>
        </div>
        <div class="form-actions">
          <button type="button" class="button primary" id="finalOpeningHoursSubmit" onclick="return window.__liaCommitOpeningHoursDay ? window.__liaCommitOpeningHoursDay('${day}') : false;">Speichern</button>
        </div>
      </form>
    `);
    bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
    bindFinalOpeningHoursSheet(day);
    return false;
  }

  function finalBindOpeningHoursEditor(){
    // handled by the dynamic overview sheet in bindFinalOpeningHoursSheet()
  }

  function finalOpenHistoryLog(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
    document.body.classList.add('modal-open');
    openOverviewLayer('Zuletzt bearbeitet', 'Kompletter Verlauf aller Änderungen mit Filtermöglichkeiten.', `
      <div class="history-filters final-history-filters">
        <label><span>Suche</span><input type="text" id="finalHistorySearch" placeholder="Name, Termin, Dokument"></label>
        <label><span>Ab Datum</span><input type="date" id="finalHistoryDateFrom"></label>
        <label><span>Bis Datum</span><input type="date" id="finalHistoryDateTo"></label>
      </div>
      <div id="finalHistoryLogList" class="stack-list"></div>
    `, { resetHistory:true });
    bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
    bindFinalHistorySheet();
    return false;
  }

  function finalRenderHistoryLogList(){
    const list = document.getElementById('finalHistoryLogList') || document.getElementById('historyLogList');
    if(!list || typeof customerUsers !== 'function') return;
    const query = (document.getElementById('finalHistorySearch')?.value || document.getElementById('historySearch')?.value || '').trim().toLowerCase();
    const fromDate = document.getElementById('finalHistoryDateFrom')?.value || document.getElementById('historyDateFrom')?.value || '';
    const toDate = document.getElementById('finalHistoryDateTo')?.value || document.getElementById('historyDateTo')?.value || '';
    const customerHistory = customerUsers().map((customer)=>({
      type: 'Dokument / Konto',
      title: customer.name,
      subtitle: (customer.documents ? Object.entries(customer.documents).filter(([,value])=>value).map(([key])=>key).join(' · ') : 'Keine Unterlagen') || 'Keine Unterlagen',
      by: 'System/Konto',
      at: customer.lastEdited || customer.createdAt || '',
      keywords: `${customer.name} ${customer.email} ${customer.phone || ''} konto dokument`
    }));
    const appointmentHistory = (state.appointments || []).map((appointment)=>({
      type: 'Termin',
      title: `${appointment.service} · ${displayName(appointment.customerId)}`,
      subtitle: `Bearbeitet von ${appointment.updatedBy || 'System'}`,
      by: appointment.updatedBy || 'System',
      at: appointment.updatedAt || appointment.createdAt || '',
      keywords: `${appointment.service} ${displayName(appointment.customerId)} termin ${appointment.status || ''}`
    }));
    const customTaskHistory = (state.customTasks || []).map((task)=>({
      type: task.status === 'done' ? 'Aufgabe erledigt' : 'Aufgabe erstellt',
      title: task.title,
      subtitle: task.status === 'done'
        ? `Erledigt von ${task.completedByName || 'System'}`
        : `Erstellt von ${task.createdByName || 'System'}`,
      by: task.status === 'done' ? (task.completedByName || 'System') : (task.createdByName || 'System'),
      at: task.status === 'done' ? (task.completedAt || task.createdAt || '') : (task.createdAt || ''),
      keywords: `${task.title} ${task.note || ''} aufgabe ${task.createdByName || ''} ${task.completedByName || ''}`
    }));
    const deletedCustomerHistory = (typeof deletedCustomerUsers === 'function' ? deletedCustomerUsers() : []).map((customer)=>({
      type: 'Kundin gelöscht',
      title: customer.name,
      subtitle: `Gelöscht von ${customer.deletedBy || 'Admin'}`,
      by: customer.deletedBy || 'Admin',
      at: customer.deletedAt || customer.lastEdited || '',
      keywords: `${customer.name} ${customer.email || ''} gelöscht`,
      actionLabel: 'Wiederherstellen',
      actionId: customer.id
    }));
    const items = [...customerHistory, ...appointmentHistory, ...customTaskHistory, ...deletedCustomerHistory]
      .filter((item)=>{
        const itemDate = `${item.at}`.slice(0, 10);
        if(fromDate && itemDate && itemDate < fromDate) return false;
        if(toDate && itemDate && itemDate > toDate) return false;
        if(!query) return true;
        return `${item.type} ${item.title} ${item.subtitle} ${item.by} ${item.keywords}`.toLowerCase().includes(query);
      })
      .sort((a,b)=>`${b.at}`.localeCompare(`${a.at}`));
    list.innerHTML = items.length ? items.map((item)=>`
      <div class="list-item">
        <strong>${item.title}</strong>
        <div class="list-meta"><span>${item.type}</span><span>${item.by}</span><span>${item.at ? formatGermanDate(item.at) : 'Ohne Datum'}</span></div>
        <div class="subtle">${item.subtitle}</div>
        ${item.actionId ? `<div class="inline-actions"><button type="button" class="button secondary small-btn" onclick="restoreDeletedCustomer('${item.actionId}')">${item.actionLabel}</button></div>` : ''}
      </div>
    `).join('') : '<div class="empty-note">Für die gewählten Filter gibt es noch keinen Verlauf.</div>';
  }

  function bindFinalHistorySheet(){
    const search = document.getElementById('finalHistorySearch');
    const from = document.getElementById('finalHistoryDateFrom');
    const to = document.getElementById('finalHistoryDateTo');
    if(search) search.oninput = finalRenderHistoryLogList;
    if(from) from.onchange = finalRenderHistoryLogList;
    if(to) to.onchange = finalRenderHistoryLogList;
    finalRenderHistoryLogList();
  }

  function bindFinalOpeningHoursSheet(day){
    const preview = function(){
      const previewBox = document.getElementById('finalOpeningHoursPreview');
      if(!previewBox) return;
      const tempConfig = {
        ...state.settings.openingHours[day],
        enabled: !!document.getElementById('finalOpeningHoursEnabled')?.checked,
        start: document.getElementById('finalOpeningHoursStart')?.value || '09:00',
        end: document.getElementById('finalOpeningHoursEnd')?.value || '18:00',
        slotMinutes: Number(document.getElementById('finalOpeningHoursSlotMinutes')?.value || 30),
        bufferMinutes: Number(document.getElementById('finalOpeningHoursBufferMinutes')?.value || 0)
      };
      const times = tempConfig.enabled ? buildSlotsFromConfig(tempConfig).map((slot)=>slot.time) : [];
      previewBox.innerHTML = times.length
        ? times.map((time)=>`<span class="week-chip">${time}</span>`).join('')
        : '<span class="week-empty">An diesem Tag werden aktuell keine Termine angeboten.</span>';
    };
    ['finalOpeningHoursEnabled','finalOpeningHoursStart','finalOpeningHoursEnd','finalOpeningHoursSlotMinutes','finalOpeningHoursBufferMinutes'].forEach((id)=>{
      const field = document.getElementById(id);
      if(field) field.onchange = preview;
      if(field && field.tagName !== 'SELECT') field.oninput = preview;
    });
    const commitOpeningHours = function(){
      ensureSettings();
      const start = document.getElementById('finalOpeningHoursStart')?.value || '';
      const end = document.getElementById('finalOpeningHoursEnd')?.value || '';
      const enabled = !!document.getElementById('finalOpeningHoursEnabled')?.checked;
      const slotMinutes = Number(document.getElementById('finalOpeningHoursSlotMinutes')?.value || 30);
      const bufferMinutes = Number(document.getElementById('finalOpeningHoursBufferMinutes')?.value || 0);
      if(enabled && typeof timeToMinutes === 'function' && timeToMinutes(end) <= timeToMinutes(start)){
        window.alert('Die Endzeit muss nach der Startzeit liegen.');
        return false;
      }
      state.settings.openingHours[day] = {
        ...state.settings.openingHours[day],
        enabled,
        start,
        end,
        slotMinutes,
        bufferMinutes
      };
      if(typeof saveState === 'function') saveState();
      if(typeof renderAll === 'function') renderAll();
      finalOpenOpeningHoursOverview();
      return false;
    };
    window.__liaCommitOpeningHoursDay = commitOpeningHours;
    const form = document.getElementById('finalOpeningHoursForm');
    if(form){
      form.onsubmit = function(event){
        event.preventDefault();
        return commitOpeningHours();
      };
    }
    const submitBtn = document.getElementById('finalOpeningHoursSubmit');
    if(submitBtn){
      submitBtn.onclick = function(event){
        event.preventDefault();
        event.stopPropagation();
        return commitOpeningHours();
      };
    }
    preview();
  }

  function buildCustomerInitials(name){
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if(!parts.length) return '?';
    if(parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  }

  function bindFinalCustomerDirectoryList(rows){
    const search = document.getElementById('finalCustomerDirectorySearch');
    const list = document.getElementById('finalCustomerDirectoryList');
    if(!list) return;
    const render = function(){
      const query = (search?.value || '').trim().toLowerCase();
      const filtered = rows.filter((customer)=>!query || String(customer.name || '').toLowerCase().includes(query));
      list.innerHTML = filtered.length ? filtered.map((customer)=>{
        const avatar = customer.avatar
          ? `<img src="${customer.avatar}" alt="${customer.name}" class="directory-avatar">`
          : `<span class="directory-avatar directory-avatar-fallback">${buildCustomerInitials(customer.name)}</span>`;
        return `
          <button type="button" class="list-item customer-directory-entry" onclick="closeOverviewModalV54(); setTimeout(function(){ editCustomer('${customer.id}'); }, 40);">
            <span class="customer-directory-main">
              ${avatar}
              <strong>${customer.name}</strong>
            </span>
          </button>
        `;
      }).join('') : '<div class="empty-note">Keine passende Kundin gefunden.</div>';
    };
    if(search) search.oninput = render;
    render();
  }

  function finalOpenCustomerDirectory(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
    if(typeof customerUsers !== 'function') return false;
    const rows = [...customerUsers()].sort((a,b)=>a.name.localeCompare(b.name, 'de'));
    document.body.classList.add('modal-open');
    openOverviewLayer('Kundenliste A–Z', 'Alle Kundinnen alphabetisch sortiert.', rows.length ? rows.map((customer)=>`
      <button type="button" class="list-item" onclick="return editCustomer('${customer.id}');">
        <strong>${customer.name}</strong>
        <div class="list-meta"><span>${customer.email}</span><span>${customer.phone || 'Keine Telefonnummer'}</span></div>
      </button>
    `).join('') : '<div class="empty-note">Noch keine Kundinnen vorhanden.</div>', { resetHistory:true });
    bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
    return false;
  }

  function stabilizeDashboardLayouts(){
    const tasksTab = document.getElementById('tab-tasks');
    if(tasksTab && !tasksTab.dataset.finalizedMarkup){
      tasksTab.innerHTML = `
        <div class="metric-grid" id="tasksMetricGrid"></div>
        <div class="tasks-layout-grid">
          <div class="card panel">
            <header><h2>Aufgaben</h2><p class="subtle">Offene Anfragen und fehlende Unterlagen auf einen Blick</p></header>
            <div class="task-search-row">
              <label class="icon-search-field"><span>⌕</span><input type="text" id="taskCustomerSearch" placeholder="Kundin suchen"></label>
            </div>
            <div id="tasksAccordion" class="tasks-accordion"></div>
          </div>
          <div class="tasks-side-stack">
            <div class="card panel">
              <header class="rules-head">
                <div>
                  <h2>Eigene Aufgaben</h2>
                </div>
                <button type="button" class="help-icon-btn" id="openRulesHelp" aria-label="Aufgaben-Regeln anzeigen">?</button>
              </header>
              <form id="customTaskForm" class="simple-form custom-task-form">
                <label><span>Aufgabe</span><input type="text" id="customTaskTitle" placeholder="z. B. Kundin wegen Terminrückfrage anrufen" required></label>
                <label><span>Notiz</span><textarea id="customTaskNote" rows="3" placeholder="Optionaler Hinweis, Ablauf oder Rückrufinfo"></textarea></label>
                <div class="form-actions" style="margin-top:16px;display:flex !important;">
                  <button class="button primary" type="submit" style="display:inline-flex !important;visibility:visible !important;opacity:1 !important;width:100% !important;justify-content:center !important;">Aufgabe hinzufügen</button>
                </div>
              </form>
            </div>
            <div class="card panel completed-tasks-panel">
              <header><h2>Erledigte Aufgaben</h2><p class="subtle">Kompakter Verlauf mit Erstellerin, Erledigt-von und Zeitpunkten</p></header>
              <div class="rule-card compact-rule-card completed-tasks-card">
                <button type="button" class="task-toggle-btn completed-task-toggle" onclick="toggleTaskSection('completedTasksWrap')">
                  <span><strong>Erledigte Aufgaben</strong><span class="subtle task-owner-line"> · kompakter Verlauf</span></span>
                  <span class="task-count-badge" id="completedTasksBadge">0</span>
                </button>
                <div class="task-section-body hidden" id="completedTasksWrap">
                  <p class="subtle">Hier siehst du, wer welche Aufgabe erstellt, erledigt und zuletzt bearbeitet hat.</p>
                  <div id="completedTasksList" class="stack-list compact-task-history"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      tasksTab.dataset.finalizedMarkup = 'true';
    }

    const settingsTab = document.getElementById('tab-settings');
    if(settingsTab && !settingsTab.dataset.finalizedMarkup){
      settingsTab.innerHTML = `
        <div class="cards two">
          <div class="card panel">
            <header><h2>Termine</h2><p class="subtle">Lege fest, wann du an den einzelnen Tagen Termine anbietest</p></header>
            <div id="timeSettingsList" class="time-settings-list"></div>
          </div>
          <div class="card panel">
            <header><h2>Zuletzt bearbeitet</h2><p class="subtle">Öffne den kompletten Verlauf mit Filtern</p></header>
            <div class="rule-card compact-rule-card settings-inline-card">
              <strong>Zuletzt bearbeitet</strong>
              <button type="button" class="button secondary" id="openHistoryLog" onclick="return window.__liaOpenHistoryDirect ? window.__liaOpenHistoryDirect(event) : false;">Verlauf öffnen</button>
            </div>
          </div>
        </div>
      `;
      settingsTab.dataset.finalizedMarkup = 'true';
    }

    const tasksGrid = tasksTab?.querySelector('.tasks-layout-grid');
    if(tasksTab && tasksGrid){
      tasksGrid.className = 'tasks-layout-grid';
      const panels = [...tasksTab.querySelectorAll('.card.panel')];
      const openTasksCard = panels.find((panel)=>panel.querySelector('#tasksAccordion'));
      const ownTasksCard = panels.find((panel)=>panel.querySelector('#customTaskForm'));
      const completedTasksCard = panels.find((panel)=>panel.querySelector('#completedTasksList'));
      if(openTasksCard && ownTasksCard && completedTasksCard){
        const sideStack = document.createElement('div');
        sideStack.className = 'tasks-side-stack';
        tasksGrid.innerHTML = '';
        tasksGrid.appendChild(openTasksCard);
        sideStack.appendChild(ownTasksCard);
        sideStack.appendChild(completedTasksCard);
        tasksGrid.appendChild(sideStack);
        const legacyParagraph = completedTasksCard.querySelector('.completed-tasks-card > p');
        if(legacyParagraph) legacyParagraph.classList.add('hidden');
      }
    }

    const customersTab = document.getElementById('tab-customers');
    const customerWrap = customersTab?.querySelector('.customer-admin-stack, .cards.two.customer-admin-layout');
    if(customersTab && customerWrap){
      customerWrap.className = 'customer-admin-stack';
      const panels = [...customerWrap.querySelectorAll(':scope > .card.panel')];
      const searchCard = panels.find((panel)=>panel.querySelector('#customerList'));
      const createCard = panels.find((panel)=>panel.querySelector('#customerCreateForm'));
      if(searchCard && createCard){
        createCard.classList.add('customer-create-panel');
        customerWrap.innerHTML = '';
        customerWrap.appendChild(searchCard);
        customerWrap.appendChild(createCard);
      }
    }
  }

  function normalizeSettingsPanels(){
    const settingsTab = document.getElementById('tab-settings');
    if(!settingsTab) return;
    const timeSettingsList = document.getElementById('timeSettingsList');
    const historyButton = document.getElementById('openHistoryLog');
    if(!timeSettingsList || !historyButton) return;
    if(settingsTab.dataset.settingsNormalized === 'true') return;

    const layout = document.createElement('div');
    layout.className = 'settings-layout-grid';

    const leftCard = document.createElement('div');
    leftCard.className = 'card panel';
    leftCard.innerHTML = '<header><h2>Termine</h2><p class="subtle">Lege fest, wann du an den einzelnen Tagen Termine anbietest</p></header>';
    leftCard.appendChild(timeSettingsList);

    const sideStack = document.createElement('div');
    sideStack.className = 'settings-side-stack';

    const historyCard = document.createElement('div');
    historyCard.className = 'card panel';
    historyCard.innerHTML = '<header><h2>Zuletzt bearbeitet</h2><p class="subtle">Öffne den kompletten Verlauf mit Filtern</p></header>';
    const historyWrap = document.createElement('div');
    historyWrap.className = 'rule-card compact-rule-card settings-inline-card';
    historyWrap.appendChild(historyButton);
    historyCard.appendChild(historyWrap);
    sideStack.appendChild(historyCard);

    const servicesCard = document.createElement('div');
    servicesCard.className = 'card panel';
    servicesCard.innerHTML = `
      <header><h2>Leistungen</h2><p class="subtle">Füge neue Leistungen hinzu oder bearbeite bestehende</p></header>
      <div id="servicesSettingsBox" class="services-settings-box"></div>
      <button type="button" class="settings-action-btn" id="openServicesSettingsSheet">Leistungen bearbeiten</button>
    `;

    const reportsCard = document.createElement('div');
    reportsCard.className = 'card panel';
    reportsCard.innerHTML = `
      <header><h2>Reports</h2><p class="subtle">Gemeldete Probleme und Feedback</p></header>
      <div id="reportsSettingsBox" class="reports-settings-box"></div>
      <button type="button" class="settings-action-btn" id="openReportsOverview">Reports anzeigen</button>
    `;

    sideStack.appendChild(servicesCard);
    sideStack.appendChild(reportsCard);

    layout.appendChild(leftCard);
    layout.appendChild(sideStack);

    settingsTab.innerHTML = '';
    settingsTab.appendChild(layout);
    settingsTab.dataset.settingsNormalized = 'true';

    document.getElementById('openServicesSettingsSheet')?.addEventListener('click', (event)=>{
      event.preventDefault();
      event.stopPropagation();
      finalOpenServicesSettingsSheet();
    });
    document.getElementById('openReportsOverview')?.addEventListener('click', (event)=>{
      event.preventDefault();
      event.stopPropagation();
      finalOpenReportsOverview();
    });
  }

  function renderReportsSettingsBox(){
    const box = document.getElementById('reportsSettingsBox');
    if(!box) return;
    const reports = JSON.parse(localStorage.getItem('lia_reports') || '[]');
    const newCount = reports.filter(r => r.status === 'neu').length;

    box.innerHTML = `
      <div class="reports-preview-row">
        <div class="reports-preview-stat ${newCount > 0 ? 'has-new' : ''}">
          <span class="reports-preview-number">${newCount}</span>
          <span class="reports-preview-label">Neu</span>
        </div>
        <div class="reports-preview-stat">
          <span class="reports-preview-number">${reports.length}</span>
          <span class="reports-preview-label">Gesamt</span>
        </div>
      </div>
    `;
  }
  function finalOpenReportsOverview(){
    const reports = JSON.parse(localStorage.getItem('lia_reports') || '[]');
    document.body.classList.add('modal-open');
    openOverviewLayer('Reports', 'Gemeldete Probleme und Feedback.', `
      <div class="reports-overview-list">
        ${reports.length ? reports.map(report => `
          <div class="report-card ${report.status === 'neu' ? 'is-new' : ''}">
            <div class="report-card-header">
              <div class="report-card-meta">
                <span class="report-card-from">${report.from}</span>
                <span class="report-card-date">${new Date(report.date).toLocaleDateString('de-DE', {day:'2-digit', month:'2-digit', year:'numeric'})}</span>
              </div>
              <span class="helper-badge ${report.status === 'neu' ? 'pill-yellow' : 'pill-green'}">${report.status === 'neu' ? 'Neu' : 'Erledigt'}</span>
            </div>
            <p class="report-card-message">${report.message.replace(/\n/g, '<br>')}</p>
            <div class="report-card-actions">
              <button type="button" class="icon-btn restore report-done-btn" data-report-id="${report.id}" title="Als erledigt markieren">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
              </button>
              <button type="button" class="icon-btn danger report-delete-btn" data-report-id="${report.id}" title="Löschen">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </div>
        `).join('') : '<div class="empty-state">Noch keine Meldungen vorhanden.</div>'}
      </div>
    `, { resetHistory:true });
    bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');


    
    document.querySelectorAll('.report-done-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.reportId;
        const reports = JSON.parse(localStorage.getItem('lia_reports') || '[]');
        const idx = reports.findIndex(r => r.id === id);
        if(idx >= 0){
          reports[idx].status = 'erledigt';
          localStorage.setItem('lia_reports', JSON.stringify(reports));
          window.renderReportsSettingsBox?.();
          finalOpenReportsOverview();
        }
      });
    });
    
    document.querySelectorAll('.report-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.reportId;
        const reports = JSON.parse(localStorage.getItem('lia_reports') || '[]');
        const filtered = reports.filter(r => r.id !== id);
        localStorage.setItem('lia_reports', JSON.stringify(filtered));
        window.renderReportsSettingsBox?.();
        finalOpenReportsOverview();
      });
    });
    
    return false;
  }

  function bindStableGlobalActions(){
    const timeSettingsList = document.getElementById('timeSettingsList');
    if(timeSettingsList){
      timeSettingsList.onclick = function(event){
        const trigger = event.target.closest('[data-opening-day]');
        if(!trigger) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        window.openOpeningHoursDay?.(trigger.getAttribute('data-opening-day'));
      };
    }
    const historySearch = document.getElementById('historySearch');
    const historyDateFrom = document.getElementById('historyDateFrom');
    const historyDateTo = document.getElementById('historyDateTo');
    const historyButton = document.getElementById('openHistoryLog');
    const reminderButton = document.getElementById('openReminderSettingsSheet');
    const customerDirectoryButton = document.getElementById('openCustomerDirectory');
    if(historySearch) historySearch.oninput = finalRenderHistoryLogList;
    if(historyDateFrom) historyDateFrom.onchange = finalRenderHistoryLogList;
    if(historyDateTo) historyDateTo.onchange = finalRenderHistoryLogList;
    if(historyButton){
      historyButton.onclick = finalOpenHistoryLog;
      historyButton.addEventListener('click', finalOpenHistoryLog, true);
    }
    if(reminderButton){
      const reminderHandler = function(event){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        const customers = typeof customerUsers === 'function' ? customerUsers() : [];
        const missingEmail = customers.some((customer)=>!String(customer.email || '').trim());
        const missingWhatsapp = customers.some((customer)=>!String(customer.whatsapp || customer.phone || '').trim());
        const missingInstagram = customers.some((customer)=>!String(customer.instagram || '').trim());
        const hint = (missing, label)=> missing
          ? `<span class="subtle small-note">${label} ist bei mindestens einer Kundin noch nicht hinterlegt.</span>`
          : `<span class="subtle small-note">${label} ist bei allen verfügbaren Kundinnen hinterlegt.</span>`;
        return finalOpenReminderSettingsSheet({ missingEmail, missingWhatsapp, missingInstagram, hint });
      };
      reminderButton.onclick = reminderHandler;
      reminderButton.addEventListener('click', reminderHandler, true);
    }
    if(customerDirectoryButton){
      customerDirectoryButton.onclick = finalOpenCustomerDirectory;
      customerDirectoryButton.addEventListener('click', finalOpenCustomerDirectory, true);
    }
    const notificationTrigger = document.getElementById('notificationTrigger');
    if(notificationTrigger && typeof window.openNotificationsCenterV64 === 'function'){
      const openNotifications = function(event){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        document.getElementById('headerNotificationMenu')?.classList.remove('open');
        return window.openNotificationsCenterV64(event);
      };
      notificationTrigger.onclick = openNotifications;
      notificationTrigger.addEventListener('click', openNotifications, true);
    }
    const rulesHelpButton = document.getElementById('openRulesHelp');
    const rulesModal = document.getElementById('rulesHelpModal');
    if(rulesHelpButton && rulesModal){
      const openRules = function(event){
        event.preventDefault();
        event.stopPropagation();
        rulesModal.classList.add('active');
        document.body.classList.add('modal-open');
        return false;
      };
      rulesHelpButton.onclick = openRules;
    }
  }

  function bindFinalTaskActions(){
    const taskSearch = document.getElementById('taskCustomerSearch');
    const customTaskForm = document.getElementById('customTaskForm');
    const completedHistoryBtn = document.getElementById('openCompletedTasksHistory');
    if(taskSearch) taskSearch.oninput = ()=> typeof renderTasks === 'function' && renderTasks();
    if(completedHistoryBtn){
      completedHistoryBtn.onclick = finalOpenCompletedTasksHistory;
    }
    if(customTaskForm){
      const submitBtn = customTaskForm.querySelector('button[type="submit"]');
      if(submitBtn){
        submitBtn.onclick = function(e){
          e.preventDefault();
          if(!currentUser || typeof ensureSettings !== 'function') return;
          ensureSettings();
          const title = document.getElementById('customTaskTitle')?.value.trim();
            if(!title){
              return;
            }
          const newTask = {
            id: `task-${Date.now()}`,
            title,
            note: document.getElementById('customTaskNote')?.value.trim() || '',
            status: 'open',
            createdAt: nowISO(),
            createdById: currentUser.id,
            createdByName: currentUser.name,
            completedAt: '',
            completedById: '',
            completedByName: '',
            reminderAt: '',
            reminder: {}
          };
          state.customTasks.push(newTask);
          // Save to API if not in demo mode
          if(typeof isDemoMode === 'function' && !isDemoMode()){
            fetch('/api/tasks', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              credentials: 'include',
              body: JSON.stringify({
                title: newTask.title,
                note: newTask.note,
                reminderAt: null,
                reminder: {}
              })
            }).catch(err => console.error('API error creating task:', err));
          } else if(typeof saveState === 'function'){
            saveState();
          }
          customTaskForm.reset();
          if(typeof renderAll === 'function') renderAll();
        };
      }
    }
  }

  function normalizeTasksCards(){
    const ownPanel = document.querySelector('#tab-tasks .card.panel:has(#customTaskForm)');

    const completedPanel = document.querySelector('#tab-tasks .completed-tasks-panel');
    const form = document.getElementById('customTaskForm');
    if(form) {
      form.style.display = 'block';
    }

    if(ownPanel && !ownPanel.dataset.polishedComposer){
      ownPanel.dataset.polishedComposer = 'true';
    }

    if(completedPanel && !completedPanel.dataset.polishedHistory){
      const headerSubtle = completedPanel.querySelector('header .subtle');
      const list = completedPanel.querySelector('#completedTasksList');
      const countBadge = completedPanel.querySelector('#completedTasksBadge');
      const card = completedPanel.querySelector('.completed-tasks-card');
      if(headerSubtle) headerSubtle.textContent = 'Öffne den kompakten Verlauf mit Suche, Datum und Zuständigkeit.';
      if(card && list){
        list.classList.add('hidden');
        card.innerHTML = `
          <div class="settings-launch-copy">
            <strong>Erledigte Aufgaben</strong>
            <span class="subtle">Kompakter Verlauf mit Erstellerin, Erledigt-von und Zeitpunkten.</span>
          </div>
          <div class="inline-actions">
            <span class="task-count-badge" id="completedTasksBadge">${countBadge ? countBadge.textContent : '0'}</span>
            <button type="button" class="button secondary" id="openCompletedTasksHistory">Verlauf öffnen</button>
          </div>
        `;
        card.appendChild(list);
      }
      completedPanel.dataset.polishedHistory = 'true';
    }
  }

  function finalOpenCompletedTasksHistory(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
    openOverviewLayer('Erledigte Aufgaben', 'Kompakter Verlauf aller erledigten eigenen Aufgaben mit Filtern.', `
      <div class="history-filters">
        <label><span>Suche</span><input type="text" id="finalCompletedTasksSearch" placeholder="Titel, Notiz, erstellt von"></label>
        <label><span>Ab Datum</span><input type="date" id="finalCompletedTasksDateFrom"></label>
        <label><span>Bis Datum</span><input type="date" id="finalCompletedTasksDateTo"></label>
      </div>
      <div id="finalCompletedTasksList" class="stack-list"></div>
    `, { resetHistory:true });
    bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
    const render = function(){
      const list = document.getElementById('finalCompletedTasksList');
      if(!list) return;
      const query = (document.getElementById('finalCompletedTasksSearch')?.value || '').trim().toLowerCase();
      const from = document.getElementById('finalCompletedTasksDateFrom')?.value || '';
      const to = document.getElementById('finalCompletedTasksDateTo')?.value || '';
      const rows = visibleCustomTasks()
        .filter((task)=>task.status === 'done')
        .filter((task)=>{
          const haystack = `${task.title || ''} ${task.note || ''} ${task.createdByName || ''} ${task.completedByName || ''}`.toLowerCase();
          if(query && !haystack.includes(query)) return false;
          const compareDate = (task.completedAt || task.createdAt || '').slice(0, 10);
          if(from && compareDate < from) return false;
          if(to && compareDate > to) return false;
          return true;
        })
        .sort((a, b)=>(b.completedAt || '').localeCompare(a.completedAt || ''));
      list.innerHTML = rows.length ? rows.map((task)=>`
        <div class="list-item">
          <strong>${task.title}</strong>
          <div class="list-meta"><span>Erstellt von ${task.createdByName || 'System'}</span><span>${formatGermanDate(task.createdAt)}</span></div>
          <div class="list-meta"><span>Erledigt von ${task.completedByName || '-'}</span><span>${formatGermanDate(task.completedAt)}</span></div>
          <div class="subtle">${task.note || 'Keine zusätzliche Notiz hinterlegt.'}</div>
        </div>
      `).join('') : '<div class="empty-note">Für diesen Filter gibt es aktuell keine erledigten Aufgaben.</div>';
    };
    const search = document.getElementById('finalCompletedTasksSearch');
    const from = document.getElementById('finalCompletedTasksDateFrom');
    const to = document.getElementById('finalCompletedTasksDateTo');
    if(search) search.oninput = render;
    if(from) from.onchange = render;
    if(to) to.onchange = render;
    render();
    return false;
  }

  function bindModalClose(modalId, closeId, backdropId){
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeId);
    const backdrop = document.getElementById(backdropId);
    const close = function(event){
      if(event){
        event.preventDefault();
        event.stopPropagation();
      }
      if(modal){
        modal.classList.remove('active');
        modal.style.display = '';
        modal.setAttribute('aria-hidden', 'true');
      }
      if(modalId === 'overviewDetailModal'){
        document.body.classList.remove('modal-open');
      }
      return false;
    };
      if(modalId === 'overviewDetailModal' && modal){
        const panel = modal.querySelector('.overview-detail-panel');
        if(panel && !document.getElementById('overviewDetailBack')){
          const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.id = 'overviewDetailBack';
        backBtn.className = 'overview-detail-back';
        backBtn.setAttribute('aria-label', 'Zurück');
        backBtn.innerHTML = '<svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.41 0Z"/></svg>';
        panel.insertBefore(backBtn, panel.firstChild);
        }
      const backBtn = document.getElementById('overviewDetailBack');
      if(backBtn){
        backBtn.onclick = goBackOverviewLayer;
        syncOverviewBackButton();
      }
    }
    if(closeBtn) closeBtn.onclick = close;
    if(backdrop) backdrop.onclick = close;
    if(modal){
      modal.setAttribute('tabindex', '-1');
      modal.onkeydown = function(event){
        if(event.key === 'Escape') close(event);
      };
    }
  }

  window.__liaBaseRenderTasks = window.renderTasks;
  window.applyCleanHeaderIcons = finalApplyCleanHeaderIcons;
  window.buildNotifications = finalBuildNotifications;
  buildNotifications = finalBuildNotifications;
  window.renderOverviewReminder = finalRenderOverviewReminder;
  renderOverviewReminder = finalRenderOverviewReminder;
  window.renderOverview = finalRenderOverview;
  window.bindOverviewCardsV59 = finalBindOverviewCards;
  bindOverviewCardsV59 = finalBindOverviewCards;
  window.bindOverviewButtonsV63 = finalBindOverviewCards;
  bindOverviewButtonsV63 = finalBindOverviewCards;
  window.renderTasks = finalRenderTasks;
  renderTasks = finalRenderTasks;
  window.renderSettings = finalRenderSettings;
  window.renderAppointments = finalRenderAppointmentsHub;
  renderAppointments = finalRenderAppointmentsHub;
  window.openOpeningHoursDay = finalOpenOpeningHoursDay;
  openOpeningHoursDay = finalOpenOpeningHoursDay;
  window.openOpeningHoursOverview = finalOpenOpeningHoursOverview;
  window.bindOpeningHoursEditor = finalBindOpeningHoursEditor;
  bindOpeningHoursEditor = finalBindOpeningHoursEditor;
  window.openHistoryLogV64 = finalOpenHistoryLog;
  window.openCustomerDirectoryV64 = finalOpenCustomerDirectory;
  window.__liaOpenHistoryDirect = finalOpenHistoryLog;
  window.__liaOpenOpeningHoursDirect = finalOpenOpeningHoursDay;

  window.openAppointmentEditorV64 = function(appointmentId = '', presetDate = '', presetTime = ''){
    const result = openAppointmentEditorSheet(appointmentId, presetDate);
    if(presetDate){
      const dateField = document.getElementById('finalAppointmentDate');
      if(dateField) dateField.value = presetDate;
    }
    if(presetTime && typeof syncFinalAppointmentTimeOptions === 'function'){
      syncFinalAppointmentTimeOptions(presetTime);
    }
    return result;
  };


  window.openTodayOverviewV64 = function(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    document.body.classList.add('modal-open');
    openOverviewLayer('Tagesübersicht', 'Dein Tag professionell und kompakt im Überblick.', buildTodayOverviewHtmlPro(), { resetHistory:true });
    return false;
  };
  window.openWeekOverviewV64 = function(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    document.body.classList.add('modal-open');
    openOverviewLayer('Wochenansicht', 'Deine Woche professionell und klar im Überblick.', buildWeekOverviewHtmlPro(), { resetHistory:true });
    return false;
  };
  window.openAppointmentFromDay = function(id){
    return openAppointmentEditorSheet(id);
  };
  window.editAppointment = function(id){
    return openAppointmentEditorSheet(id);
  };
  window.openTodayOverviewV58 = window.openTodayOverviewV64;
  window.openWeekOverviewV58 = window.openWeekOverviewV64;

  window.openTodayOverviewV64 = function(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    document.body.classList.add('modal-open');
    openOverviewLayer('Tagesübersicht', 'Dein Tag professionell und kompakt im Überblick.', buildTodayOverviewHtmlPro(), { resetHistory:true });
    bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
    return false;
  };
  window.openWeekOverviewV64 = function(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    document.body.classList.add('modal-open');
    openOverviewLayer('Wochenansicht', 'Deine Woche professionell und klar im Überblick.', buildWeekOverviewHtmlPro(), { resetHistory:true });
    bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
    return false;
  };
  window.openWeekDayOverviewV64 = openWeekDayOverview;
  window.openTodayOverviewV58 = window.openTodayOverviewV64;
  window.openWeekOverviewV58 = window.openWeekOverviewV64;

  if(typeof window.renderCalendarList === 'function'){
    const originalRenderCalendarListV64 = window.renderCalendarList;
    window.renderCalendarList = function(){
      const result = originalRenderCalendarListV64.apply(this, arguments);
      const calendarActionsCopy = document.querySelector('.calendar-actions-copy');
      if(calendarActionsCopy) calendarActionsCopy.innerHTML = '';
      const calendarAllList = document.getElementById('calendarAllList');
      if(calendarAllList){
        calendarAllList.innerHTML = '';
        calendarAllList.classList.add('hidden');
      }
      return result;
    };
    renderCalendarList = window.renderCalendarList;
  }

  function finalInit(){
    stabilizeDashboardLayouts();
    normalizeSettingsPanels();
    finalApplyCleanHeaderIcons();
    if(typeof bindLogoutConfirm === 'function') bindLogoutConfirm();
    if(typeof bindRulesHelp === 'function') bindRulesHelp();
    finalBindOpeningHoursEditor();
    bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
    bindModalClose('openingHoursModal', 'openingHoursClose', 'openingHoursBackdrop');
    bindModalClose('historyLogModal', 'historyLogClose', 'historyLogBackdrop');
    bindModalClose('logoutConfirmModal', 'logoutConfirmClose', 'logoutConfirmBackdrop');
    bindModalClose('rulesHelpModal', 'rulesHelpClose', 'rulesHelpBackdrop');
    bindModalClose('customerDirectoryModal', 'customerDirectoryClose', 'customerDirectoryBackdrop');
    bindModalClose('customerEditModal', 'customerEditClose', 'customerEditBackdrop');
    finalBindOverviewCards();
    normalizeTasksCards();
    bindFinalTaskActions();
    bindStableGlobalActions();
    if(currentUser){
      if(typeof renderOverview === 'function') renderOverview();
      if(typeof renderCalendar === 'function') renderCalendar();
      if(typeof renderCalendarList === 'function') renderCalendarList();
      if(typeof renderTasks === 'function') renderTasks();
      if(typeof renderAppointments === 'function') renderAppointments();
      if(typeof renderCustomers === 'function') renderCustomers();
      if(typeof renderSettings === 'function') renderSettings();
      if(typeof renderNotifications === 'function') renderNotifications();
    }
    const historyButton = document.getElementById('openHistoryLog');
    if(historyButton) historyButton.setAttribute('onclick', 'return window.__liaOpenHistoryDirect ? window.__liaOpenHistoryDirect(event) : false;');
  }

  window.__liaForceRebuildTabs = function(){
    if(!currentUser) return;
    stabilizeDashboardLayouts();
    normalizeSettingsPanels();
    bindStableGlobalActions();
    normalizeTasksCards();
    bindFinalTaskActions();
    if(typeof renderTasks === 'function') renderTasks();
    if(typeof renderAppointments === 'function') renderAppointments();
    if(typeof renderCustomers === 'function') renderCustomers();
    if(typeof renderSettings === 'function') renderSettings();
    if(typeof renderCalendar === 'function') renderCalendar();
    if(typeof renderCalendarList === 'function') renderCalendarList();
  };

  let __finalInitDone = false;
  function finalInitOnce(){
    if(__finalInitDone) return;
    __finalInitDone = true;
    finalInit();
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', finalInitOnce);
  } else {
    finalInitOnce();
  }
  window.addEventListener('load', finalInitOnce);

  function __liaOverviewFindUser(userId){
    return Array.isArray(state?.users) ? state.users.find((entry)=>entry.id === userId) : null;
  }

  function __liaOverviewAvatar(user){
    const name = typeof fullNameOf === 'function' ? fullNameOf(user) : (user?.name || 'Kundin');
    const letters = typeof initials === 'function' ? initials(name) : String(name || '?').slice(0, 2).toUpperCase();
    if(user?.avatar){
      return `<span class="overview-appointment-avatar has-image"><img src="${user.avatar}" alt="${name}"></span>`;
    }
    return `<span class="overview-appointment-avatar">${letters}</span>`;
  }

  function __liaOverviewTimeUntil(dateValue, timeValue){
    const target = parseDate(`${dateValue} ${timeValue}`);
    if(!target) return '';
    const diffMinutes = Math.round((target.getTime() - Date.now()) / 60000);
    if(diffMinutes <= 0) return 'Startet gleich';
    if(diffMinutes < 60) return `In ${diffMinutes} Min.`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return minutes ? `In ${hours} Std. ${minutes} Min.` : `In ${hours} Std.`;
  }

  function __liaOverviewCompletedToday(appointment, now){
    const stamp = parseDate(`${appointment.date} ${appointment.time}`);
    return !!(stamp && stamp.getTime() <= now.getTime());
  }

  function __liaOverviewOccasions(base){
    if(!currentUser || currentUser.role !== 'admin' || typeof customerUsers !== 'function') return [];
    const monthDay = `${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
    const birthdays = customerUsers()
      .filter((customer)=>String(customer.birthdate || '').slice(5, 10) === monthDay)
      .map((customer)=>({
        kind: 'birthday',
        title: `${fullNameOf(customer)} hat heute Geburtstag`,
        meta: customer.birthdate ? `${base.getFullYear() - Number(String(customer.birthdate).slice(0, 4))} Jahre` : 'Heute'
      }));
    const anniversaries = customerUsers()
      .filter((customer)=>{
        const source = customer.createdAt || customer.approvedAt || '';
        if(String(source).slice(5, 10) !== monthDay) return false;
        const years = base.getFullYear() - Number(String(source).slice(0, 4));
        return years >= 1 && state.appointments.some((appointment)=>appointment.customerId === customer.id);
      })
      .map((customer)=>{
        const source = customer.createdAt || customer.approvedAt || '';
        const years = base.getFullYear() - Number(String(source).slice(0, 4));
        return {
          kind: 'anniversary',
          title: `${fullNameOf(customer)} ist seit ${years} Jahr${years === 1 ? '' : 'en'} dabei`,
          meta: years === 1 ? 'Stammkundin seit 1 Jahr' : `Stammkundin seit ${years} Jahren`
        };
      });
    return [...birthdays, ...anniversaries].slice(0, 3);
  }

  function __liaBindOverviewQuickNotes(){
    const toggleBtn = document.getElementById('overviewQuickNotesToggle');
    const saveBtn = document.getElementById('overviewQuickNotesSave');
    const noteField = document.getElementById('overviewQuickNotesField');
    const statusField = document.getElementById('overviewQuickNotesStatus');
    const ensureOverviewSettings = ()=>{
      if(!state.settings) state.settings = {};
      if(!state.settings.overview) state.settings.overview = { quickNotes:'', quickNotesOpen:false };
    };
    if(toggleBtn){
      toggleBtn.onclick = ()=>{
        ensureOverviewSettings();
        state.settings.overview.quickNotesOpen = !state.settings.overview.quickNotesOpen;
        if(typeof saveState === 'function') saveState();
        window.renderOverview?.();
      };
    }
    if(saveBtn && noteField){
      saveBtn.onclick = ()=>{
        ensureOverviewSettings();
        state.settings.overview.quickNotes = noteField.value.trim();
        // Persist quickNotes directly to the database
        const apiBase = typeof API_URL !== 'undefined' ? API_URL : '/api';
        fetch(`${apiBase}/settings`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          credentials: 'include',
          body: JSON.stringify({ quickNotes: state.settings.overview.quickNotes, overview: state.settings.overview })
        }).catch(err => console.warn('Quick notes save error:', err));
        if(typeof saveState === 'function') saveState();
        if(statusField) statusField.textContent = 'Gespeichert';
        setTimeout(()=>{
          if(statusField?.textContent === 'Gespeichert') statusField.textContent = '';
        }, 1800);
      };
    }

  }

  function __liaRenderOverviewV70(){
    if(!currentUser || typeof renderOverviewReminder !== 'function' || typeof getNextAvailableSlots !== 'function') return;
    if(typeof closeOverviewSpotlightV65 === 'function') closeOverviewSpotlightV65();
    const base = new Date();
    const hour = base.getHours();
    const firstName = typeof firstNameOf === 'function' ? firstNameOf(currentUser) : (currentUser?.firstName || 'Julia');
    const heroHeading = hour < 11
      ? `Guten Morgen, ${firstName}!`
      : hour < 17
        ? `Schönen Nachmittag, ${firstName}!`
        : `Willkommen zurück, ${firstName}!`;
    const today = `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`;
    const visible = sortedAppointments(visibleAppointments());
    const todaysAppointments = visible.filter((appointment)=>appointment.date === today);
    const upcomingAppointments = getUpcomingAppointments(6);
    const nextAppointment = upcomingAppointments[0] || todaysAppointments.find((appointment)=>!__liaOverviewCompletedToday(appointment, base));
    const nextCustomer = nextAppointment ? __liaOverviewFindUser(nextAppointment.customerId) : null;
    const completedTodayCount = todaysAppointments.filter((appointment)=>__liaOverviewCompletedToday(appointment, base)).length;
    const todayTotalCount = todaysAppointments.length;
    const progressPercent = todayTotalCount ? Math.max(8, Math.round((completedTodayCount / todayTotalCount) * 100)) : 0;
    const openTaskCount = currentUser.role === 'admin'
      ? visible.filter((appointment)=>appointment.status === 'open' || appointment.needsReconfirm).length + (typeof visibleCustomTasks === 'function' ? visibleCustomTasks().filter((task)=>task.status !== 'done').length : 0)
      : (typeof visibleCustomTasks === 'function' ? visibleCustomTasks().filter((task)=>task.status !== 'done').length : 0);
    const occasions = __liaOverviewOccasions(base);
    const quickNotes = state?.settings?.overview?.quickNotes || '';
    const quickNotesOpen = !!state?.settings?.overview?.quickNotesOpen;

    const heroHeadingNode = document.querySelector('#tab-overview .overview-hero h2');
    if(heroHeadingNode) heroHeadingNode.innerHTML = `${heroHeading}<br>Hier ist dein Überblick für den Tag.`;

    const nextCard = document.getElementById('overviewNextAppointmentCard');
    if(nextCard){
      nextCard.innerHTML = nextAppointment ? `
        <div class="overview-card-kicker">Nächster Termin</div>
        <div class="overview-next-appointment">
          <div class="overview-next-time">${nextAppointment.time}</div>
          <div class="overview-next-main">
            <div class="overview-next-person">
              ${__liaOverviewAvatar(nextCustomer)}
              <div class="overview-next-copy">
                <strong>${fullNameOf(nextCustomer)}</strong>
                <span>${nextAppointment.service}</span>
              </div>
            </div>
            <div class="overview-next-meta">${nextAppointment.date === today ? __liaOverviewTimeUntil(nextAppointment.date, nextAppointment.time) : formatDateOnly(nextAppointment.date)}</div>
            ${nextAppointment.note ? `<div class="overview-next-note">Notiz: ${nextAppointment.note}</div>` : ''}
            <div class="overview-next-actions">
              <button type="button" class="button secondary small-btn" id="overviewNextAppointmentOpen">Termin öffnen</button>
            </div>
          </div>
        </div>
      ` : `
        <div class="overview-card-kicker">Nächster Termin</div>
        <div class="overview-empty-card">
          <strong>Aktuell keine anstehenden Termine</strong>
          <span>${currentUser.role === 'admin' ? 'Sobald ein neuer Termin eingetragen wird, erscheint er hier.' : 'Sobald ein Termin bestätigt oder angefragt wurde, erscheint er hier.'}</span>
        </div>
      `;
      const nextBtn = document.getElementById('overviewNextAppointmentOpen');
      if(nextBtn && nextAppointment) nextBtn.onclick = ()=> openAppointmentFromDay(nextAppointment.id);
    }

    const progressCard = document.getElementById('overviewProgressCard');
    if(progressCard){
      progressCard.innerHTML = `
        <div class="overview-card-kicker">Tagesfortschritt</div>
        <div class="overview-progress-copy">
          <strong>${todayTotalCount ? `${completedTodayCount} von ${todayTotalCount} Terminen geschafft` : 'Heute ist alles ruhig'}</strong>
          <span>${todayTotalCount ? (completedTodayCount === todayTotalCount ? 'Heute ist alles erledigt.' : `${Math.max(todayTotalCount - completedTodayCount, 0)} Termine warten noch auf dich.`) : 'Aktuell keine anstehenden Termine.'}</span>
        </div>
        <div class="overview-progress-track"><span class="overview-progress-bar" style="width:${progressPercent}%;"></span></div>
        <div class="overview-progress-footer">${openTaskCount ? `${openTaskCount} offene Aufgaben` : 'Keine offenen Aufgaben'}</div>
      `;
    }

    const occasionCard = document.getElementById('overviewOccasionCard');
    if(occasionCard){
      occasionCard.innerHTML = `
        <div class="overview-card-kicker">Geburtstag & Jubiläum</div>
        ${occasions.length ? `<div class="overview-occasion-list">${occasions.map((item)=>`
          <div class="overview-occasion-item">
            <span class="overview-occasion-badge ${item.kind === 'birthday' ? 'is-birthday' : 'is-anniversary'}">${item.kind === 'birthday' ? 'Heute Geburtstag' : 'Jubiläum'}</span>
            <strong>${item.title}</strong>
            <span>${item.meta}</span>
          </div>
        `).join('')}</div>` : `
          <div class="overview-empty-card compact">
            <strong>Heute gibt es keinen besonderen Anlass</strong>
            <span>Geburtstage und Jubiläen erscheinen hier automatisch.</span>
          </div>
        `}
      `;
    }

    const quickNotesCard = document.getElementById('overviewQuickNotesCard');
    if(quickNotesCard){
      quickNotesCard.innerHTML = `
        <div class="overview-quicknotes-head">
          <div>
            <div class="overview-card-kicker">Quick Notes</div>
            <strong>Dein spontaner Merkzettel</strong>
          </div>
          <button type="button" class="button secondary small-btn" id="overviewQuickNotesToggle">${quickNotesOpen ? 'Zuklappen' : 'Aufklappen'}</button>
        </div>
        ${quickNotesOpen ? `
          <div class="overview-quicknotes-body">
            <textarea id="overviewQuickNotesField" rows="5" placeholder="Kurze interne Notiz für später ...">${quickNotes}</textarea>
            <div class="overview-quicknotes-actions">
              <span class="subtle" id="overviewQuickNotesStatus"></span>
              <button type="button" class="button primary small-btn" id="overviewQuickNotesSave">Speichern</button>
            </div>
          </div>
        ` : `
          <div class="overview-quicknotes-preview">${quickNotes || 'Hier kannst du spontane Gedanken, Rückrufe oder kleine Erinnerungen für dich festhalten.'}</div>
        `}
      `;
      __liaBindOverviewQuickNotes();
    }

    const freeBox = document.getElementById('overviewFreeSlots');
    if(freeBox){
      const freeSlots = getNextAvailableSlots(today, 6);
      const nextDays = getNextAvailableDays(4);
      const services = typeof activeServices === 'function' ? activeServices() : [];
      const nextHint = freeSlots[0]
        ? `${weekdayShort(base)} · ${freeSlots[0]}`
        : nextDays[0]
          ? `${nextDays[0].date.toLocaleDateString('de-DE',{weekday:'short', day:'2-digit', month:'2-digit'})} · ${nextDays[0].slots[0]}`
          : 'Aktuell keine freien Zeiten hinterlegt';
      freeBox.innerHTML = `
        <div class="overview-compact-preview">
          <span class="helper-badge">${services.length} Leistungen aktiv</span>
          <strong>${nextHint}</strong>
          <span class="subtle">${freeSlots.length ? 'Übersicht aller freien Termine.' : nextDays[0] ? 'Das nächste freie Zeitfenster ist bereits vorbereitet.' : 'Aktuell keine freien Termine.'}</span>
        </div>
      `;
    }
    const freeSlotsSubline = document.querySelector('#tab-overview .free-slots-bar .subtle');
    if(freeSlotsSubline) freeSlotsSubline.textContent = 'Übersicht aller freien Termine.';

    const todayHeaderText = document.querySelector('#todayOverviewCard header .subtle');
    if(todayHeaderText){
      todayHeaderText.textContent = `Deine Übersicht für heute · ${base.toLocaleDateString('de-DE',{weekday:'long', day:'2-digit', month:'2-digit', year:'numeric'})}`;
    }

    const summary = document.getElementById('overviewTodaySummary');
    if(summary){
      summary.innerHTML = `
        <div class="today-highlight-main">
          <span class="helper-badge">${todaysAppointments.length ? 'Heute im Fokus' : 'Freier Tag'}</span>
          <strong>${todaysAppointments.length ? `${todaysAppointments.length} Termine für heute eingeplant` : 'Heute ist alles erledigt'}</strong>
          <span>${todaysAppointments.length ? `${completedTodayCount} geschafft · ${Math.max(todayTotalCount - completedTodayCount, 0)} noch offen` : 'Aktuell keine anstehenden Termine.'}</span>
        </div>
        <div class="overview-mini-stats">
          <div class="mini-stat"><strong>${todaysAppointments.length}</strong><span>Heute</span></div>
          <div class="mini-stat"><strong>${completedTodayCount}</strong><span>Geschafft</span></div>
          <div class="mini-stat"><strong>${Math.max(todayTotalCount - completedTodayCount, 0)}</strong><span>Noch offen</span></div>
        </div>
      `;
    }

    const timeline = document.getElementById('overviewTodayTimeline');
    if(timeline){
      timeline.innerHTML = todaysAppointments.length ? todaysAppointments.map((appointment)=>`
        <button type="button" class="timeline-slot" onclick="openAppointmentFromDay('${appointment.id}')">
          <div class="slot-time">${appointment.time} · ${appointment.service}</div>
          <div class="slot-meta">${displayName(appointment.customerId)} · <span class="pill ${statusClass(appointment.status)}">${statusLabel(appointment.status)}</span></div>
          <div class="subtle">Zuletzt bearbeitet von ${appointment.updatedBy} am ${formatGermanDate(appointment.updatedAt)}</div>
        </button>
      `).join('') : upcomingAppointments.length ? upcomingAppointments.slice(0, 3).map((appointment)=>`
        <button type="button" class="timeline-slot empty" onclick="openAppointmentFromDay('${appointment.id}')">
          <div class="slot-time">${formatDateOnly(appointment.date)} · ${appointment.time}</div>
          <div class="slot-meta">${appointment.service} · ${displayName(appointment.customerId)}</div>
          <div class="subtle">Als Nächstes geplant</div>
        </button>
      `).join('') : '<div class="timeline-slot empty"><div class="slot-time">Heute ist alles erledigt</div><div class="slot-meta">Aktuell keine anstehenden Termine.</div></div>';
    }

    const monday = new Date(base);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);
    const weekHeaderText = document.querySelector('#weekOverviewCard header .subtle');
    if(weekHeaderText){
      const weekStartLabel = monday.toLocaleDateString('de-DE',{day:'2-digit', month:'2-digit'});
      const weekEnd = new Date(monday);
      weekEnd.setDate(monday.getDate() + 6);
      weekHeaderText.textContent = `Deine Übersicht für diese Woche · ${weekStartLabel} – ${weekEnd.toLocaleDateString('de-DE',{day:'2-digit', month:'2-digit', year:'numeric'})}`;
    }
    const days = [];
    for(let i=0; i<7; i++){
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const key = `${current.getFullYear()}-${pad(current.getMonth()+1)}-${pad(current.getDate())}`;
      days.push({date: current, key, items: visible.filter((appointment)=>appointment.date === key)});
    }

    const weekBox = document.getElementById('overviewWeekList');
    if(weekBox){
      const appointmentsThisWeek = days.reduce((sum, entry)=>sum + entry.items.length, 0);
      const firstBusyDay = days.find((entry)=>entry.items.length);
      const weekPreviewMeta = firstBusyDay
        ? `${firstBusyDay.items.length} Termin${firstBusyDay.items.length === 1 ? '' : 'e'} am ${firstBusyDay.date.toLocaleDateString('de-DE',{weekday:'long'})}`
        : 'Noch keine festen Einträge für diese Woche';
      weekBox.innerHTML = `
        <div class="overview-compact-preview">
          <span class="helper-badge">${appointmentsThisWeek} Termine</span>
          <strong>${firstBusyDay ? `${firstBusyDay.date.toLocaleDateString('de-DE',{weekday:'long', day:'2-digit', month:'2-digit'})}` : 'Diese Woche ist noch frei planbar'}</strong>
          <span class="subtle">${weekPreviewMeta}</span>
        </div>
      `;
    }

    const jumpWeekBtn = document.getElementById('jumpToCalendarFromWeek');
    if(jumpWeekBtn) jumpWeekBtn.onclick = ()=> openTab('calendar');
    const openFreeSlotsBtn = document.getElementById('openFreeSlotsOverviewBtn');
    if(openFreeSlotsBtn) openFreeSlotsBtn.onclick = window.openFreeSlotsOverviewV64;
    renderOverviewReminder();
  }

  window.renderOverview = __liaRenderOverviewV70;
  renderOverview = __liaRenderOverviewV70;
})();

(function(){
  function initReportSystem(){
    var reportBtn = document.getElementById('openReportModal');
    var reportModal = document.getElementById('reportModal');
    var reportForm = document.getElementById('reportForm');
    var closeBtn = document.getElementById('closeReportModal');
    var backdrop = document.getElementById('reportBackdrop');
    
    if(!reportBtn) return;
    
    function openReportModal(){
      if(!reportModal) return;
      reportModal.classList.remove('hidden');
      reportModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    }
    
    function closeReportModal(){
      if(!reportModal) return;
      reportModal.classList.add('hidden');
      reportModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }
    
    reportBtn.addEventListener('click', openReportModal);
    closeBtn?.addEventListener('click', closeReportModal);
    backdrop?.addEventListener('click', closeReportModal);
    
    reportForm?.addEventListener('submit', function(e){
      e.preventDefault();
      var message = document.getElementById('reportMessage')?.value?.trim();
      if(!message) return;
      
      var reports = JSON.parse(localStorage.getItem('lia_reports') || '[]');
      var userName = (typeof currentUser !== 'undefined' && currentUser?.name) ? currentUser.name : 'Unbekannt';
      var isAdmin = (typeof currentUser !== 'undefined' && currentUser?.role === 'admin');
      reports.unshift({
        id: 'r' + Date.now(),
        message: message,
        from: userName + (isAdmin ? ' (Admin)' : ''),
        date: new Date().toISOString(),
        status: 'neu'
      });
      localStorage.setItem('lia_reports', JSON.stringify(reports.slice(0, 100)));
      
      closeReportModal();
      try {
        if(typeof window.renderReportsSettingsBox === 'function'){
          window.renderReportsSettingsBox();
        }
      } catch(e) {}
      reportForm.reset();
    });
  }
  
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initReportSystem);
  } else {
    initReportSystem();
  }
  
  // Export functions to window when they exist - use try/catch for safety
  try {
    if(typeof renderReportsSettingsBox !== 'undefined') {
      window.renderReportsSettingsBox = renderReportsSettingsBox;
    }
  } catch(e) { /* ignore if not defined yet */ }
  try {
    if(typeof finalOpenReportsOverview !== 'undefined') {
      window.finalOpenReportsOverview = finalOpenReportsOverview;
    }
  } catch(e) { /* ignore if not defined yet */ }
  try {
    if(typeof renderServicesSettingsBox !== 'undefined') {
      window.renderServicesSettingsBox = renderServicesSettingsBox;
    }
  } catch(e) { /* ignore if not defined yet */ }
  try {
    if(typeof finalOpenServicesSettingsSheet !== 'undefined') {
      window.finalOpenServicesSettingsSheet = finalOpenServicesSettingsSheet;
    }
  } catch(e) { /* ignore if not defined yet */ }
  
  setTimeout(function(){
    try { window.renderServicesSettingsBox?.(); } catch(e) {}
    try { window.renderReportsSettingsBox?.(); } catch(e) {}
  }, 200);
  
  // === MISSING FUNCTIONS ===
  
  window.openTodayOverviewV64 = function(event) {
    if(event) { event.preventDefault(); event.stopPropagation(); }
    if(!currentUser) return false;
    
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const todaysAppointments = sortedAppointments(visibleAppointments()).filter(a => a.date === todayKey);
    
    const html = `
      <div class="stack-list">
        <div class="list-item">
          <strong>Heute: ${todaysAppointments.length} Termine</strong>
          <div class="subtle">${todaysAppointments.filter(a=>a.status==='open').length} offen · ${todaysAppointments.filter(a=>a.status==='confirmed').length} bestätigt</div>
        </div>
        ${todaysAppointments.length ? todaysAppointments.map(a => `
          <div class="list-item">
            <div><strong>${a.time} · ${a.service}</strong></div>
            <div class="subtle">${displayName(a.customerId)} · <span class="pill ${statusClass(a.status)}">${statusLabel(a.status)}</span></div>
            ${a.note ? `<div class="subtle" style="margin-top:6px;">${a.note}</div>` : ''}
          </div>
        `).join('') : '<div class="empty-note">Heute sind noch keine Termine eingetragen.</div>'}
      </div>
    `;
    
    if(typeof window.openOverviewLayerV64 === 'function') {
      window.openOverviewLayerV64('Tagesübersicht', `Deine Termine für heute · ${today.toLocaleDateString('de-DE')}`, html, { resetHistory: true });
    }
    return false;
  };

  window.openWeekOverviewV64 = function(event) {
    if(event) { event.preventDefault(); event.stopPropagation(); }
    if(!currentUser) return false;
    
    const base = new Date();
    const monday = new Date(base);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);
    
    const days = [];
    for(let i=0; i<7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const key = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`;
      const items = sortedAppointments(visibleAppointments()).filter(a => a.date === key);
      days.push({ date: current, key, items });
    }
    
    const html = `
      <div class="stack-list">
        ${days.map(entry => `
          <div class="list-item">
            <strong>${entry.date.toLocaleDateString('de-DE', {weekday:'long', day:'2-digit', month:'2-digit'})}</strong>
            <div class="subtle">${entry.items.length} Termine${entry.items.length ? ` · ${entry.items.filter(a=>a.status==='open').length} offen` : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
    
    if(typeof window.openOverviewLayerV64 === 'function') {
      window.openOverviewLayerV64('Wochenansicht', 'Deine Termine für diese Woche', html, { resetHistory: true });
    }
    return false;
  };
})();

