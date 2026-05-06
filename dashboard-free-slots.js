(function(){
  function stopEvent(event){
    if(!event) return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
  }

  function openSlotEditor(dateValue, timeValue, event){
    stopEvent(event);
    if(!dateValue || !timeValue) return false;
    if(typeof window.openAppointmentEditorV64 === 'function'){
      return window.openAppointmentEditorV64('', dateValue, timeValue);
    }
    return false;
  }

  function buildFreeSlotsHtml(){
    const base = new Date();
    const today = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
    const services = typeof activeServices === 'function' ? activeServices() : [];
    const todaySlots = typeof getNextAvailableSlots === 'function' ? getNextAvailableSlots(today, 72) : [];
    const nextDays = typeof getNextAvailableDays === 'function' ? getNextAvailableDays(21) : [];

    const renderSlotButton = function(dateValue, timeValue, label){
      return `
        <button
          type="button"
          class="free-slot-booking-card lia-free-slot-btn"
          data-slot-date="${dateValue}"
          data-slot-time="${timeValue}"
          onclick="return window.__liaOpenFreeSlotDirect ? window.__liaOpenFreeSlotDirect('${dateValue}','${timeValue}', event) : false;"
        >
          <strong>${timeValue}</strong>
          <span>${label}</span>
        </button>
      `;
    };

    return `
      <div class="stack-list free-slot-booking-list">
        <div class="list-item">
          <strong>Aktive Leistungen</strong>
          <div class="week-day-content">
            ${services.length ? services.map((service)=>`<span class="week-chip">${service}</span>`).join('') : '<span class="week-empty">Keine aktiven Leistungen hinterlegt.</span>'}
          </div>
        </div>
        <div class="list-item">
          <strong>Heute oder als nächstes frei</strong>
          <div class="free-slot-booking-grid">
            ${todaySlots.length
              ? todaySlots.map((timeValue)=>renderSlotButton(today, timeValue, currentUser?.role === 'admin' ? 'Jetzt Termin vergeben' : 'Termin anfragen')).join('')
              : '<div class="week-empty">Heute sind aktuell keine freien Zeiten verfügbar.</div>'}
          </div>
        </div>
        ${nextDays.map((entry)=>`
          <div class="list-item">
            <strong>${typeof formatDateOnly === 'function' ? formatDateOnly(entry.key || entry.date) : (entry.key || '')}</strong>
            <div class="free-slot-booking-grid">
              ${entry.slots?.length
                ? entry.slots.map((timeValue)=>renderSlotButton(entry.key || entry.date, timeValue, 'Direkt übernehmen')).join('')
                : '<div class="week-empty">An diesem Tag ist aktuell nichts mehr frei.</div>'}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function bindFreeSlotButtons(){
    document.querySelectorAll('#overviewDetailContent .lia-free-slot-btn[data-slot-date][data-slot-time]').forEach((button)=>{
      button.onclick = function(event){
        return openSlotEditor(
          button.getAttribute('data-slot-date') || '',
          button.getAttribute('data-slot-time') || '',
          event
        );
      };
    });
  }

  function openFreeSlotsOverview(event){
    stopEvent(event);
    document.body.classList.add('modal-open');
    if(typeof window.openOverviewLayerV64 === 'function'){
      window.openOverviewLayerV64(
        'Freie Termine',
        'Alle aktuell freien Termine im Überblick.',
        buildFreeSlotsHtml(),
        { resetHistory:true }
      );
    } else if(typeof window.openOverviewModalV54 === 'function'){
      window.openOverviewModalV54(
        'Freie Termine',
        'Alle aktuell freien Termine im Überblick.',
        buildFreeSlotsHtml()
      );
    }
    if(typeof bindModalClose === 'function'){
      bindModalClose('overviewDetailModal', 'overviewDetailClose', 'overviewDetailBackdrop');
    } else if(typeof bindOverviewModal === 'function'){
      bindOverviewModal();
    }
    bindFreeSlotButtons();
    window.setTimeout(bindFreeSlotButtons, 40);
    return false;
  }

  window.__liaOpenFreeSlotDirect = openSlotEditor;
  window.__liaOpenFreeSlotsOverviewIsolated = openFreeSlotsOverview;
  window.openFreeSlotsOverviewV64 = openFreeSlotsOverview;
})();
