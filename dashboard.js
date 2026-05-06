
const STORAGE_KEY = 'lia-dashboard-demo-v61';
const REMEMBER_KEY = 'lia-dashboard-remember-v60';
const API_URL = '/api';
const NOTIFICATION_SEEN_KEY = 'lia-dashboard-notifications-v1';

// Global auth token - stored after login
let AUTH_TOKEN = null;

const DEFAULT_STATE = {
  users: [
    {
      id: 'admin-1',
      role: 'admin',
      approvalStatus: 'approved',
      approvedAt: '2026-03-01T09:00:00',
      approvedBy: 'System',
      firstName: 'Julia',
      lastName: 'Edmaier',
      name: 'Julia Edmaier',
      email: 'julia@lashes-by-lia.de',
      password: 'Julia2026!',
      phone: '0170 2454353',
      birthdate: '2000-06-12',
      address: 'Zum Kirchplatz 15, 84056 Rottenburg a. d. Laaber',
      avatar: '',
      deletedAt: '',
      deletedBy: '',
      documents: {},
      createdAt: '2026-03-01T09:00:00',
      lastEdited: '2026-03-31T10:00:00',
      lastLogin: '2026-03-31T10:00:00',
      lastActive: '2026-03-31T10:00:00',
      online: false
    },
    {
      id: 'cust-1',
      role: 'customer',
      approvalStatus: 'approved',
      approvedAt: '2026-03-15T14:10:00',
      approvedBy: 'Julia Edmaier',
      firstName: 'Mara',
      lastName: 'Schneider',
      name: 'Mara Schneider',
      email: 'mara@example.com',
      password: 'Kundin2026!',
      phone: '0171 1112233',
      birthdate: '2010-04-22',
      address: 'Musterstraße 7, 84056 Rottenburg',
      avatar: '',
      deletedAt: '',
      deletedBy: '',
      documents: { minorConsent: true, idCopy: false, treatmentContract: false },
      createdAt: '2026-03-15T14:10:00',
      lastEdited: '2026-03-29T11:30:00',
      lastLogin: '2026-03-30T18:20:00',
      lastActive: '2026-03-30T18:23:00',
      online: false
    }
  ],
  appointments: [
    {id:'a1', customerId:'cust-1', service:'Wimpernverlängerung', date:'2026-04-03', time:'10:00', note:'Neues Set gewünscht', status:'open', updatedBy:'Mara Schneider', updatedByRole:'customer', updatedAt:'2026-03-30T19:42:00', needsReconfirm:true},
    {id:'a2', customerId:'cust-1', service:'Lashlifting', date:'2026-04-10', time:'14:30', note:'', status:'confirmed', updatedBy:'Julia Edmaier', updatedByRole:'admin', updatedAt:'2026-03-31T09:05:00', needsReconfirm:false}
  ],
  customTasks: [],
  settings: {
    services: {
      'Wimpernverlängerung': true,
      'Lashlifting': true,
      'Browlifting': true,
      'Auffüllen': true,
      'Beratung': true
    },
    openingHours: {
      'Mo': { enabled: true, start: '09:00', end: '18:00', slotMinutes: 30, bufferMinutes: 0 },
      'Di': { enabled: true, start: '09:00', end: '18:00', slotMinutes: 30, bufferMinutes: 0 },
      'Mi': { enabled: true, start: '09:00', end: '18:00', slotMinutes: 30, bufferMinutes: 0 },
      'Do': { enabled: true, start: '09:00', end: '18:00', slotMinutes: 30, bufferMinutes: 0 },
      'Fr': { enabled: true, start: '09:00', end: '18:00', slotMinutes: 30, bufferMinutes: 0 },
      'Sa': { enabled: false, start: '09:00', end: '14:00', slotMinutes: 30, bufferMinutes: 0 },
      'So': { enabled: false, start: '00:00', end: '00:00', slotMinutes: 30, bufferMinutes: 0 }
    },
    reminders: {
      message: 'Hallo! Das ist deine Erinnerung an deinen Termin bei Lashes by Lia. Wenn du Rückfragen hast, melde dich gerne kurz zurück.',
      leadMinutes: 1440,
      channels: {
        email: true,
        whatsapp: false,
        instagram: false
      }
    },
    overview: {
      quickNotes: '',
      quickNotesOpen: false
    }
  }
};


const el = (id) => document.getElementById(id);
const qsa = (sel) => [...document.querySelectorAll(sel)];
let state = null;
let currentUser = null;
let currentMonth = new Date();
let onlineTab = 'online';
let lastNotificationKeys = [];
let notificationsPrimed = false;
const activeNotificationToasts = new Map();
let selectedCalendarDate = '';
let dashboardLiveRefreshTimer = null;
const DASHBOARD_TAB_TEMPLATES = {};
window.DASHBOARD_TAB_TEMPLATES = DASHBOARD_TAB_TEMPLATES;

function cloneDefault(){ return JSON.parse(JSON.stringify(DEFAULT_STATE)); }
function isDemoMode(){
  // NO demo mode - use real API only
  return false;
}
function splitFullName(name){
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return { firstName:'', lastName:'' };
  if(parts.length === 1) return { firstName:parts[0], lastName:'' };
  return { firstName:parts[0], lastName:parts.slice(1).join(' ') };
}
function mergeNameParts(firstName, lastName){
  return [String(firstName || '').trim(), String(lastName || '').trim()].filter(Boolean).join(' ').trim();
}
function showRegisterFeedback(options){
  const noteBox = el('registerNoteMessage');
  if(!noteBox) return;
  document.getElementById('registerSuccessOverlay')?.remove();
  if(options?.type === 'success'){
    noteBox.textContent = '';
    noteBox.classList.remove('is-success', 'is-error');
    document.body.classList.add('modal-open');
    const overlay = document.createElement('div');
    overlay.id = 'registerSuccessOverlay';
    overlay.className = 'register-success-overlay';
    overlay.innerHTML = `
      <div class="register-success-dialog" role="dialog" aria-modal="true" aria-labelledby="registerSuccessTitle">
        <button type="button" class="register-success-close" id="registerSuccessClose" aria-label="Schließen">
          <svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.7 5.3a1 1 0 0 0-1.4 1.4L10.59 12l-5.3 5.3a1 1 0 1 0 1.42 1.4L12 13.41l5.3 5.3a1 1 0 0 0 1.4-1.42L13.41 12l5.3-5.3a1 1 0 1 0-1.42-1.4L12 10.59 6.7 5.3Z"/></svg>
        </button>
        <div class="register-success-icon">
          <svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.55 16.18 5.7 12.33a1 1 0 1 0-1.4 1.42l4.55 4.53a1 1 0 0 0 1.42 0l9.43-9.44a1 1 0 1 0-1.42-1.41l-8.73 8.75Z"/></svg>
        </div>
        <div class="register-success-copy">
          <strong id="registerSuccessTitle">Du wurdest erfolgreich registriert!</strong>
          <p>${options.title || 'Du erhältst eine Bestätigung per E-Mail. Dein Konto wird jetzt persönlich geprüft.'}</p>
          <p class="subtle">${options.text || 'Du wirst benachrichtigt, sobald dein Account freigegeben wurde.'}</p>
        </div>
        <div class="register-success-actions">
          <button type="button" class="button secondary small-btn" id="registerBackToLogin">Zurück zum Anmelden</button>
          <a href="index.html" class="button secondary small-btn">Zur Webseite</a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const closeOverlay = ()=>{
      overlay.remove();
      document.body.classList.remove('modal-open');
    };
    document.getElementById('registerBackToLogin')?.addEventListener('click', ()=>{
      closeOverlay();
      el('authModeLogin')?.click();
    });
    document.getElementById('registerSuccessClose')?.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (event)=>{
      if(event.target === overlay) closeOverlay();
    });
    return;
  }
  document.body.classList.remove('modal-open');
  noteBox.classList.remove('is-success');
  noteBox.classList.add('is-error');
  noteBox.textContent = options?.text || '';
}

function ensureUserNameParts(user){
  if(!user) return user;
  const split = splitFullName(user.name || '');
  if(!user.firstName) user.firstName = split.firstName;
  if(typeof user.lastName === 'undefined' || user.lastName === null) user.lastName = split.lastName;
  user.name = mergeNameParts(user.firstName, user.lastName) || user.name || '';
  return user;
}
function fullNameOf(user){
  if(!user) return 'Unbekannt';
  ensureUserNameParts(user);
  return mergeNameParts(user.firstName, user.lastName) || user.name || 'Unbekannt';
}
function firstNameOf(user){
  if(!user) return '';
  ensureUserNameParts(user);
  return user.firstName || splitFullName(user.name || '').firstName || '';
}
function normalizeAllUsers(collection){
  if(!Array.isArray(collection)) return collection;
  collection.forEach(ensureUserNameParts);
  return collection;
}
function normalizeApprovalStatus(user){
  if(!user) return 'pending';
  if(user.role === 'admin') return 'approved';
  return user.approvalStatus || 'approved';
}
function ensureDemoPasswords(data){
  if(!data?.users) return data;
  data.users = data.users.map(user=>{
    ensureUserNameParts(user);
    if(!user.approvalStatus) user.approvalStatus = user.role === 'admin' ? 'approved' : 'approved';
    if(!user.approvedAt && user.approvalStatus === 'approved') user.approvedAt = user.createdAt || nowISO();
    if(!user.approvedBy && user.approvalStatus === 'approved') user.approvedBy = user.role === 'admin' ? 'System' : 'Julia Edmaier';
    return user;
  });
  return data;
}
function loadDemoState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : cloneDefault();
    const data = {...cloneDefault(), ...parsed};
    normalizeAllUsers(data.users);
    // Ensure demo passwords are always set
    data.users = data.users.map(u => {
      if(u.email === 'julia@lashes-by-lia.de') u.password = 'Julia2026!';
      if(u.email === 'mara@example.com') u.password = 'Kundin2026!';
      return u;
    });
    ensureSettings(data);
    return data;
  }catch(e){
    const data = cloneDefault();
    normalizeAllUsers(data.users);
    // Ensure demo passwords are always set
    data.users = data.users.map(u => {
      if(u.email === 'julia@lashes-by-lia.de') u.password = 'Julia2026!';
      if(u.email === 'mara@example.com') u.password = 'Kundin2026!';
      return u;
    });
    ensureSettings(data);
    return data;
  }
}

window.clearDashboardData = function(){
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(NOTIFICATION_SEEN_KEY);
  location.reload();
}
function saveDemoState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function loadSeenNotificationKeys(){
  try{
    const raw = localStorage.getItem(NOTIFICATION_SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  }catch{
    return [];
  }
}
function saveSeenNotificationKeys(keys){
  try{
    localStorage.setItem(NOTIFICATION_SEEN_KEY, JSON.stringify(keys));
  }catch{}
}
function formatRelativeAge(isoString){
  if(!isoString) return 'Gerade eben';
  const timestamp = new Date(isoString).getTime();
  if(Number.isNaN(timestamp)) return 'Gerade eben';
  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if(diffMinutes < 1) return 'Gerade eben';
  if(diffMinutes < 60) return `vor ${diffMinutes} Min.`;
  const diffHours = Math.round(diffMinutes / 60);
  if(diffHours < 24) return `vor ${diffHours} Std.`;
  const diffDays = Math.round(diffHours / 24);
  if(diffDays < 7) return `vor ${diffDays} Tag${diffDays === 1 ? '' : 'en'}`;
  return formatGermanDate(isoString);
}
function openTasksAndReveal(sectionId){
  if(currentUser?.role === 'customer'){
    openTab('calendar');
    return;
  }
  openTab('tasks');
  window.setTimeout(()=>{
    const section = el(sectionId);
    if(!section) return;
    section.classList.remove('hidden');
    section.scrollIntoView({behavior:'smooth', block:'center'});
  }, 30);
}
function ensureNotificationToastHost(){
  let host = el('notificationToastHost');
  if(host) return host;
  host = document.createElement('div');
  host.id = 'notificationToastHost';
  host.className = 'notification-toast-host';
  document.body.appendChild(host);
  return host;
}
function removeNotificationToast(key){
  const existing = activeNotificationToasts.get(key);
  if(existing?.timer) window.clearTimeout(existing.timer);
  existing?.node?.remove();
  activeNotificationToasts.delete(key);
}
function syncNotificationToasts(currentKeys){
  [...activeNotificationToasts.keys()]
    .filter(key=>!currentKeys.includes(key))
    .forEach(removeNotificationToast);
}
function showNotificationToasts(items){
  const host = ensureNotificationToastHost();
  items.forEach(item=>{
    if(activeNotificationToasts.has(item.key)) return;
    const toast = document.createElement('button');
    toast.type = 'button';
    toast.className = 'notification-toast';
    toast.innerHTML = `
      <span class="notification-toast-kicker">${item.type === 'request' ? 'Neue Anfrage' : 'Offene Aufgabe'}</span>
      <strong>${item.title}</strong>
      <span>${item.text}</span>
      <span class="notification-toast-meta">${item.ageLabel}</span>
    `;
    toast.onclick = ()=>{
      item.action?.();
      removeNotificationToast(item.key);
    };
    host.appendChild(toast);
    const timer = window.setTimeout(()=> removeNotificationToast(item.key), 6500);
    activeNotificationToasts.set(item.key, {node:toast, timer});
  });
}
function buildNotifications(){
  if(!currentUser) return [];
  const items = [];
  sortedAppointments(visibleAppointments())
    .filter(a=>a.status==='open' || a.needsReconfirm)
    .forEach(a=>{
      items.push({
        key:`appointment-${a.id}-${a.updatedAt || a.date}-${a.status}-${a.needsReconfirm ? 'reconfirm':'open'}`,
        type:'request',
        title:a.needsReconfirm ? 'Termin erneut bestätigen' : 'Neue Anfrage',
        text:`${a.service} · ${displayName(a.customerId)}`,
        meta:`${formatDateOnly(a.date)} · ${a.time}`,
        timestamp:a.updatedAt || `${a.date}T${a.time || '00:00'}:00`,
        action:()=> openTasksAndReveal(`request-${a.id}`)
      });
    });

  if(currentUser.role === 'admin'){
    pendingCustomerUsers().forEach(customer=>{
      items.push({
        key:`registration-${customer.id}-${customer.createdAt || customer.lastEdited}`,
        type:'task',
        title:'Neue Registrierung',
        text:`${customer.name} wartet auf Freigabe`,
        meta:customer.email || customer.phone || 'Neue Kundin',
        timestamp:customer.createdAt || customer.lastEdited || nowISO(),
        action:()=> openTasksAndReveal(`registration-${customer.id}`)
      });
    });
    customerUsers()
      .map(customer=>({customer, status:customerDocsStatus(customer)}))
      .filter(entry=>entry.status.missing.length > 0)
      .forEach(entry=>{
        items.push({
          key:`docs-${entry.customer.id}-${entry.status.missing.join('-')}`,
          type:'task',
          title:'Offene Unterlagen',
          text:`${entry.customer.name} · ${entry.status.missing.join(', ')}`,
          meta:'Bitte vervollständigen',
          timestamp:entry.customer.lastEdited || entry.customer.createdAt || nowISO(),
          action:()=> editCustomer(entry.customer.id)
        });
      });
  }

  visibleCustomTasks()
    .filter(task=>task.status !== 'done')
    .forEach(task=>{
      items.push({
        key:`custom-${task.id}-${task.createdAt}-${task.status}`,
        type:'task',
        title:'Offene Aufgabe',
        text:task.title,
        meta:task.reminderAt ? `Erinnerung ${formatGermanDate(task.reminderAt)}` : 'Ohne Erinnerungszeitpunkt',
        timestamp:task.createdAt || task.reminderAt || nowISO(),
        action:()=> openTasksAndReveal(`custom-${task.id}`)
      });
    });

  return items
    .map(item=>({...item, ageLabel: formatRelativeAge(item.timestamp)}))
    .sort((a,b)=> new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
}
function playNotificationTone(){
  try{
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if(!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(740, context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(980, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);
  }catch{}
}
function renderNotifications(){
  const badge = el('notificationBadge');
  const list = el('notificationList');
  const summary = el('notificationSummary');
  const trigger = el('notificationTrigger');
  if(!badge || !list || !summary || !currentUser) return;
  applyCleanHeaderIcons();

  const notifications = buildNotifications();
  const currentKeys = notifications.map(item=>item.key);
  const seenKeys = loadSeenNotificationKeys().filter(key=>currentKeys.includes(key));
  const newKeys = currentKeys.filter(key=>!seenKeys.includes(key) && !lastNotificationKeys.includes(key));
  if(notificationsPrimed && newKeys.length){
    playNotificationTone();
    showNotificationToasts(notifications.filter(item=>newKeys.includes(item.key)));
  }
  syncNotificationToasts(currentKeys);
  notificationsPrimed = true;
  lastNotificationKeys = currentKeys;
  saveSeenNotificationKeys(currentKeys);

  badge.textContent = String(notifications.length);
  badge.classList.toggle('hidden', notifications.length === 0);
  summary.textContent = notifications.length ? `${notifications.length} offen` : 'Keine offenen Hinweise';
  list.innerHTML = notifications.length ? notifications.map(item=>`
    <button type="button" class="notification-item" data-notification-key="${item.key}">
      <div class="notification-item-head">
        <span class="notification-pill ${item.type === 'request' ? 'is-request' : item.type === 'issue' ? 'is-issue' : 'is-task'}">${item.type === 'request' ? 'Anfrage' : item.type === 'issue' ? 'Hinweis' : 'Aufgabe'}</span>
        <span class="subtle">${item.ageLabel}</span>
      </div>
      <div class="notification-item-body">
        <strong>${item.title}</strong>
        <div class="notification-item-copy">${item.text}</div>
      </div>
      <div class="notification-meta-row"><span class="subtle">${item.meta}</span><span class="notification-jump">Direkt öffnen</span></div>
    </button>
  `).join('') : '<div class="empty-note">Gerade gibt es keine offenen Mitteilungen.</div>';
  qsa('.notification-item').forEach((button, index)=>{
    button.onclick = ()=>{
      el('headerNotificationMenu')?.classList.remove('open');
      window.setTimeout(()=>{
        notifications[index]?.action?.();
      }, 90);
      el('headerNotificationMenu')?.classList.remove('open');
    };
  });
}
function apiRequestSync(action, payload){
  const xhr = new XMLHttpRequest();
  xhr.open(payload ? 'POST' : 'GET', `${API_URL}?action=${encodeURIComponent(action)}`, false);
  xhr.setRequestHeader('Accept', 'application/json');
  if(payload) xhr.setRequestHeader('Content-Type', 'application/json');
  try{
    xhr.send(payload ? JSON.stringify(payload) : null);
    return xhr.responseText ? JSON.parse(xhr.responseText) : null;
  }catch{
    return null;
  }
}
async function apiRequest(action, payload){
  if(location.protocol === 'file:'){
    return {
      ok:false,
      message:'Der sichere Login braucht einen Server. Bitte die Website über deinen Webspace oder lokalen Server öffnen.'
    };
  }
  try{
    // Map actions to correct API endpoints
    let url;
    if(action === 'login'){
      url = `${API_URL}/auth/login`;
    }else if(action === 'session'){
      url = `${API_URL}/auth/me`;
    }else if(action === 'register'){
      url = `${API_URL}/auth/register`;
    }else if(action === 'request-password-reset'){
      url = `${API_URL}/auth/forgot`;
    }else{
      url = `${API_URL}/${action}`;
    }
    const response = await fetch(url, {
      method: payload ? 'POST' : 'GET',
      headers: {
        'Accept':'application/json',
        ...(payload ? {'Content-Type':'application/json'} : {})
      },
      credentials: 'include',
      body: payload ? JSON.stringify(payload) : undefined
    });
    const result = await response.json().catch(()=> null);
    if(!response.ok){
      return result || {ok:false, message: result?.error || `Serverfehler (${response.status}).`};
    }
    // Convert server response to expected dashboard format
    if(result && result.success !== undefined){
      return {ok: result.success, user: result.user, currentUser: result.user, ...result};
    }
    if(result && result.authenticated !== undefined){
      return {ok: result.authenticated, user: result.user, currentUser: result.user};
    }
    return result;
  }catch(err){
    console.error('API request error:', err);
    return {
      ok:false,
      message:'Serververbindung fehlgeschlagen.'
    };
  }
}
async function loadState(){
  if(isDemoMode()){
    currentUser = null;
    state = loadDemoState();
    ensureSettings();
    return state;
  }
  // Initialize default state structure
  state = cloneDefault();
  ensureSettings();
  
  // Try to load from API
  try{
    const sessionRes = await fetch(`${API_URL}/auth/me`, {credentials: 'include'});
    if(!sessionRes.ok){
      currentUser = null;
      return state;
    }
    const session = await sessionRes.json();
    if(session?.authenticated && session?.user){
      currentUser = session.user;
      
      // Force admin role for the main admin email
      if(currentUser.email === 'julia@lashes-by-lia.de' || currentUser.email === 'info@lashes-by-lia.de'){
        currentUser.role = 'admin';
        currentUser.firstName = currentUser.firstName || 'Julia';
        currentUser.lastName = currentUser.lastName || 'Edmaier';
        currentUser.name = currentUser.name || 'Julia Edmaier';
      }
      
      // Keep admin in state.users, merge customers from API
      const adminUser = state.users.find(u => u.role === 'admin');
      const adminExists = adminUser ? 1 : 0;
      
      // Load customers from API for admins
      if(currentUser.role === 'admin'){
        try{
          const custRes = await fetch(`${API_URL}/customers`, {credentials: 'include'});
          if(custRes.ok){
            const apiCustomers = await custRes.json();
            if(Array.isArray(apiCustomers)){
              // Keep admin user, add API customers
              state.users = [
                ...state.users.filter(u => u.role === 'admin'),
                ...apiCustomers.map(c => ({
                  ...c,
                  role: 'customer',
                  approvalStatus: 'approved'
                }))
              ];
            }
          }
        }catch(e){
          console.warn('Could not load customers from API:', e);
        }
      }
      
      // Load appointments from API
      try{
        const apptRes = await fetch(`${API_URL}/appointments`, {credentials: 'include'});
        if(apptRes.ok){
          const apiAppointments = await apptRes.json();
          if(Array.isArray(apiAppointments)){
            state.appointments = apiAppointments;
          }
        }
      }catch(e){
        console.warn('Could not load appointments from API:', e);
      }
      // Load settings from API (opening hours, services, reminders)
      if(currentUser.role === 'admin'){
        try{
          const settingsRes = await fetch(`${API_URL}/settings`, {credentials: 'include'});
          if(settingsRes.ok){
            const apiSettings = await settingsRes.json();
            if(apiSettings && typeof apiSettings === 'object'){
              // Merge API settings over defaults
              Object.keys(apiSettings).forEach(key => {
                try{
                  const val = typeof apiSettings[key] === 'string' ? JSON.parse(apiSettings[key]) : apiSettings[key];
                  if(key === 'openingHours' && val && typeof val === 'object') state.settings.openingHours = val;
                  else if(key === 'services' && val && typeof val === 'object') state.settings.services = val;
                  else if(key === 'reminders' && val && typeof val === 'object') state.settings.reminders = {...state.settings.reminders, ...val};
                  else if(state.settings[key] !== undefined) state.settings[key] = val;
                }catch{}
              });
            }
          }
        }catch(e){
          console.warn('Could not load settings from API:', e);
        }
      }
      return state;
    }
  }catch(e){
    console.warn('API not available:', e);
  }
  currentUser = null;
  return state;
}
function saveState(){
  if(isDemoMode()){
    saveDemoState();
    showSaveFeedback(true);
    return;
  }
  if(!currentUser) return;
  const savedRole = currentUser.role;
  currentUser.role = savedRole;
  // Save settings via dedicated endpoint (persists opening hours, services, reminders)
  const settingsPromise = fetch(`${API_URL}/settings`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify(state.settings || {})
  }).catch(() => null);
  // Also save state blob for user-level persistence
  const statePromise = apiRequest('save-state', {state});
  Promise.all([settingsPromise, statePromise]).then(([, stateResult]) => {
    if(stateResult?.ok){
      showSaveFeedback(true);
    } else {
      showSaveFeedback(false, stateResult?.message);
    }
  }).catch(() => {
    showSaveFeedback(false, 'Verbindungsfehler beim Speichern.');
  });
}

function showSaveFeedback(success, errorMsg){
  // Show a brief toast notification for save status
  let host = document.getElementById('saveFeedbackHost');
  if(!host){
    host = document.createElement('div');
    host.id = 'saveFeedbackHost';
    host.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:300;pointer-events:none;';
    document.body.appendChild(host);
  }
  const toast = document.createElement('div');
  toast.style.cssText = `
    display:inline-flex;align-items:center;gap:8px;
    padding:10px 18px;border-radius:999px;
    background:${success ? 'rgba(45,138,78,.95)' : 'rgba(192,57,43,.95)'};
    color:#fff;font-size:.88rem;font-weight:700;
    box-shadow:0 8px 24px rgba(0,0,0,.18);
    animation:saveFeedbackIn .2s ease;
    opacity:1;transition:opacity .3s ease;
  `;
  toast.textContent = success ? '✓ Gespeichert' : (errorMsg || 'Fehler beim Speichern');
  host.appendChild(toast);
  setTimeout(()=>{ toast.style.opacity = '0'; setTimeout(()=> toast.remove(), 350); }, 1800);
}
function nowISO(){ return new Date().toISOString(); }
function pad(n){ return String(n).padStart(2,'0'); }
function parseDate(value){
  if(!value) return null;
  const d = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}
function formatGermanDate(value){
  const d = parseDate(value);
  if(!d) return value || 'Noch nicht verfügbar';
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatDateOnly(value){
  const d = parseDate(value);
  if(!d) return value || '';
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`;
}
function initials(name){
  const parts = splitFullName(name);
  if(!parts.firstName && !parts.lastName) return '?';
  return `${(parts.firstName || '?')[0] || '?'}${(parts.lastName || parts.firstName || '?')[0] || '?'}`.toUpperCase();
}
function customerUsers(){ 
  return state.users.filter(u=>u.role === 'customer' && normalizeApprovalStatus(u) === 'approved' && !u.deletedAt); 
}
function pendingCustomerUsers(){ return state.users.filter(u=>u.role === 'customer' && normalizeApprovalStatus(u) === 'pending' && !u.deletedAt); }
function deletedCustomerUsers(){ return state.users.filter(u=>u.role === 'customer' && !!u.deletedAt); }
function displayName(id){
  if(id === 'private') return 'Privat blockiert';
  if(!id) return 'Keine Kundin';
  const user = state.users.find(u=>u.id===id);
  return user ? fullNameOf(user) : 'Keine Kundin';
}
function statusLabel(status){ return ({open:'Offen', confirmed:'Bestätigt', declined:'Abgelehnt'})[status] || 'Offen'; }
function statusClass(status){ return ({open:'pill-yellow', confirmed:'pill-green', declined:'pill-red'})[status] || 'pill-yellow'; }
function visibleAppointments(){
  if(!currentUser) return [];
  if(!state?.appointments || !Array.isArray(state.appointments)) return [];
  return currentUser.role === 'admin'
    ? state.appointments
    : state.appointments.filter(a=>a.customerId === currentUser.id);
}
function sortedAppointments(list){ 
  if(!list || !Array.isArray(list)) return [];
  return [...list].sort((a,b)=>(`${a.date} ${a.time}`).localeCompare(`${b.date} ${b.time}`)); 
}
function isMinorFromBirthdate(value){
  if(!value) return null;
  const birth = new Date(value);
  if(Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if(m < 0 || (m===0 && today.getDate() < birth.getDate())) age--;
  return age < 18;
}
function customerDocsStatus(customer){
  const birthSet = !!customer.birthdate;
  if(!birthSet) return {birthSet:false, minor:false, adult:false, required:[], missing:[]};
  const minor = isMinorFromBirthdate(customer.birthdate);
  const docs = customer.documents || {};
  const required = minor ? ['Einverständniserklärung','Ausweiskopie'] : ['Behandlungsvertrag'];
  const missing = [];
  if(minor){
    if(!docs.minorConsent) missing.push('Einverständniserklärung');
    if(!docs.idCopy) missing.push('Ausweiskopie');
  }else{
    if(!docs.treatmentContract) missing.push('Behandlungsvertrag');
  }
  return {birthSet:true, minor, adult:!minor, required, missing};
}
function formatOnlineStatus(user){
  if(!user) return 'Noch nicht verfügbar';
  if(user.online) return 'Online';
  const d = parseDate(user.lastActive || user.lastLogin || user.createdAt);
  if(!d) return 'Noch nicht verfügbar';
  const diffMin = Math.floor((Date.now() - d.getTime())/60000);
  if(diffMin < 1) return 'Vor kurzem online';
  if(diffMin < 60) return `vor ${diffMin} Minuten online`;
  const diffHours = Math.floor(diffMin/60);
  if(diffHours < 24) return `vor ${diffHours} ${diffHours===1?'Stunde':'Stunden'} online`;
  return `zuletzt online am ${formatGermanDate(d.toISOString())}`;
}
function ensureSettings(){
  if(!state) state = cloneDefault();
  if(!state.settings) state.settings = {};
  if(!Array.isArray(state.customTasks)) state.customTasks = [];
  if(!state.settings.services) state.settings.services = {};
  if(!state.settings.openingHours) state.settings.openingHours = {};
  if(!state.settings.reminders) state.settings.reminders = {};
  if(!state.settings.overview) state.settings.overview = {};
  const defaults = DEFAULT_STATE.settings;
  Object.keys(defaults.services).forEach(service=>{
    if(typeof state.settings.services[service] === 'undefined') state.settings.services[service] = defaults.services[service];
  });
  Object.keys(defaults.openingHours).forEach(day=>{
    state.settings.openingHours[day] = {
      ...defaults.openingHours[day],
      ...(state.settings.openingHours[day] || {})
    };
  });
  state.settings.reminders = {
    ...defaults.reminders,
    ...state.settings.reminders,
    channels: {
      ...defaults.reminders.channels,
      ...(state.settings.reminders.channels || {})
    }
  };
  state.settings.overview = {
    ...defaults.overview,
    ...state.settings.overview
  };
}
function activeServices(){
  ensureSettings();
  return Object.entries(state.settings.services).filter(([,v])=>v).map(([k])=>k);
}
function weekdayKeyFromDate(dateValue){
  const date = parseDate(dateValue);
  if(!date) return '';
  return weekdayShort(date);
}
function timeToMinutes(value){
  if(!value || !String(value).includes(':')) return 0;
  const [hours, minutes] = String(value).split(':').map(Number);
  return (hours * 60) + minutes;
}
function minutesToTime(total){
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
function normalizeCalendarDateSelection(){
  if(selectedCalendarDate) return;
  const today = new Date();
  selectedCalendarDate = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
}
function getOpeningConfigForDate(dateValue){
  ensureSettings();
  const dayKey = weekdayKeyFromDate(dateValue);
  return state.settings.openingHours?.[dayKey] || null;
}
function getBlockedTimesForDate(dateValue, excludeAppointmentId=''){
  return new Set(
    state.appointments
      .filter(appointment=>
        appointment.date === dateValue &&
        appointment.id !== excludeAppointmentId &&
        appointment.status !== 'declined'
      )
      .map(appointment=>appointment.time)
  );
}
function buildSlotsFromConfig(config){
  if(!config || !config.enabled) return [];
  const startMinutes = timeToMinutes(config.start);
  const endMinutes = timeToMinutes(config.end);
  const duration = Number(config.slotMinutes) || 30;
  const bufferMinutes = Math.max(0, Number(config.bufferMinutes) || 0);
  const interval = duration + bufferMinutes;
  if(endMinutes <= startMinutes || interval <= 0) return [];
  const slots = [];
  for(let current = startMinutes; current + duration <= endMinutes; current += interval){
    slots.push({ time: minutesToTime(current), blocked: false });
  }
  return slots;
}
function isoDateFromDate(date){
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
}
function nextDateForWeekday(dayKey){
  const weekdayMap = {Mo:1, Di:2, Mi:3, Do:4, Fr:5, Sa:6, So:0};
  const targetDay = weekdayMap[dayKey];
  if(typeof targetDay === 'undefined') return null;
  const today = new Date();
  const candidate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while(candidate.getDay() !== targetDay){
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}
function getOpeningDayStats(dayKey){
  const config = state.settings.openingHours?.[dayKey];
  const nextDate = nextDateForWeekday(dayKey);
  if(!config || !config.enabled || !nextDate) return null;
  const dateValue = isoDateFromDate(nextDate);
  const allSlots = buildSlotsFromConfig(config);
  const availableSlots = getAvailableSlotsForDate(dateValue);
  const blocked = availableSlots.filter(slot=>slot.blocked).length;
  return {
    dateValue,
    dateLabel: formatDateOnly(dateValue),
    total: allSlots.length,
    blocked,
    free: Math.max(0, allSlots.length - blocked)
  };
}
function getAvailableSlotsForDate(dateValue, excludeAppointmentId=''){
  const config = getOpeningConfigForDate(dateValue);
  const blocked = getBlockedTimesForDate(dateValue, excludeAppointmentId);
  const now = new Date();
  return buildSlotsFromConfig(config).map(slot=>({
    ...slot,
    blocked: blocked.has(slot.time) || (() => {
      const slotDate = parseDate(`${dateValue} ${slot.time}`);
      return slotDate ? slotDate.getTime() <= now.getTime() : false;
    })()
  }));
}
function getNextAvailableSlots(dateValue, limit=4){
  return getAvailableSlotsForDate(dateValue)
    .filter(slot=>!slot.blocked)
    .slice(0, limit)
    .map(slot=>slot.time);
}
function getUpcomingAppointments(limit=6){
  const now = new Date();
  return sortedAppointments(visibleAppointments())
    .filter(appointment=>{
      const date = parseDate(`${appointment.date} ${appointment.time}`);
      return date && date.getTime() >= now.getTime();
    })
    .slice(0, limit);
}
function getNextAvailableDays(limit=4){
  const days = [];
  const base = new Date();
  for(let offset = 0; offset < 14 && days.length < limit; offset++){
    const date = new Date(base);
    date.setDate(base.getDate() + offset);
    const key = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
    const slots = getNextAvailableSlots(key, 3);
    if(slots.length){
      days.push({ key, date, slots });
    }
  }
  return days;
}
function visibleCustomTasks(){
  if(!state?.customTasks) return [];
  const tasks = currentUser.role === 'admin'
    ? state.customTasks
    : state.customTasks.filter(task=>task.createdById === currentUser.id || task.completedById === currentUser.id);
  return tasks;
}
function reminderChannelsLabel(reminder){
  if(!reminder) return 'Keine Erinnerung';
  const channels = [];
  if(reminder.emailEnabled) channels.push(reminder.email ? `E-Mail: ${reminder.email}` : 'E-Mail');
  if(reminder.phoneEnabled) channels.push(reminder.phone ? `Nummer: ${reminder.phone}` : 'Nummer');
  return channels.length ? channels.join(' · ') : 'Keine Erinnerung';
}
function weekdayShort(date){
  return ['So','Mo','Di','Mi','Do','Fr','Sa'][date.getDay()];
}
function refreshOnlineStates(){
  const now = Date.now();
  state.users.forEach(u=>{
    const d = parseDate(u.lastActive || u.lastLogin || u.createdAt);
    u.online = !!(d && now - d.getTime() < 2*60*1000);
  });
  if(currentUser){
    const fresh = state.users.find(u=>u.id===currentUser.id);
    if(fresh) currentUser = fresh;
  }
}
function markCurrentUserOnline(){
  if(!currentUser) return;
  const idx = state.users.findIndex(u=>u.id===currentUser.id);
  if(idx < 0) return;
  state.users[idx].lastLogin = nowISO();
  state.users[idx].lastActive = nowISO();
  state.users[idx].online = true;
  currentUser = state.users[idx];
  saveState();
}
function updateCurrentActivity(){
  if(!currentUser || !state?.users) return;
  const idx = state.users.findIndex(u=>u.id===currentUser.id);
  if(idx < 0) return;
  state.users[idx].lastActive = nowISO();
  state.users[idx].online = true;
  currentUser = state.users[idx];
  debouncedSaveState();
}
let saveStateTimeout = null;
function debouncedSaveState(){
  if(saveStateTimeout) window.clearTimeout(saveStateTimeout);
  saveStateTimeout = window.setTimeout(()=>{
    saveState();
    saveStateTimeout = null;
  }, 5000);
}
function startDashboardLiveRefresh(){
  if(dashboardLiveRefreshTimer) window.clearInterval(dashboardLiveRefreshTimer);
  dashboardLiveRefreshTimer = window.setInterval(()=>{
    if(!currentUser) return;
    if(typeof renderOverview === 'function') renderOverview();
    if(typeof renderNotifications === 'function') renderNotifications();
    if(selectedCalendarDate){
      if(typeof renderCalendar === 'function') renderCalendar();
      if(typeof renderCalendarList === 'function') renderCalendarList();
    }
  }, 60000);
}
function stopDashboardLiveRefresh(){
  if(!dashboardLiveRefreshTimer) return;
  window.clearInterval(dashboardLiveRefreshTimer);
  dashboardLiveRefreshTimer = null;
}

async function boot(){
  qsa('.dash-tab').forEach((panel)=>{
    if(panel?.id && !DASHBOARD_TAB_TEMPLATES[panel.id]){
      DASHBOARD_TAB_TEMPLATES[panel.id] = panel.innerHTML;
    }
  });
  // Wait for state to load from API
  await loadState();
  ensureSettings();
  bindAuth();
  bindGlobal();
  bindLogoutConfirm();
  hydrateRememberedLogin();
  setTimeout(()=> bindThemeAndOnline(), 0);
  if(currentUser) showDashboard();
}

function hydrateRememberedLogin(){
  try{
    const raw = localStorage.getItem(REMEMBER_KEY);
    if(!raw) return;
    const data = JSON.parse(raw);
    if(data.email) el('loginEmail').value = data.email;
    if(data.password) el('loginPassword').value = data.password;
    if(data.remember) el('rememberLogin').checked = true;
  }catch{}
}
function submitLoginFormFromKeyboard(event){
  if(event.key !== 'Enter') return;
  const form = el('loginForm');
  if(!form) return;
  event.preventDefault();
  form.requestSubmit();
}

function bindAuth(){
  const setAuthMode = (mode)=>{
    const isRegister = mode === 'register';
    el('registerBox')?.classList.toggle('hidden', !isRegister);
    el('loginForm')?.classList.toggle('hidden', isRegister);
    el('loginDemoBox')?.classList.toggle('hidden', isRegister);
    el('showForgot')?.classList.toggle('hidden', isRegister);
    el('hideRegister')?.classList.add('hidden');
    el('authModeLogin')?.classList.toggle('is-active', !isRegister);
    el('authModeRegister')?.classList.toggle('is-active', isRegister);
    const heading = document.querySelector('#loginSection .login-panel h1');
    const lead = document.querySelector('#loginSection .login-panel .lead');
    if(heading) heading.textContent = isRegister ? 'Erstelle dein Konto!' : 'Schön, dich wiederzusehen';
    if(lead) lead.textContent = isRegister
      ? 'Registriere dich in wenigen Schritten selbst!. Dein Konto wird anschließend persönlich bestätigt.'
      : 'Bitte melde dich mit deinen Zugangsdaten an.';
  };

  el('loginForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = el('loginEmail').value.trim().toLowerCase();
    const password = el('loginPassword').value;
    const remember = el('rememberLogin').checked;

    el('loginError').textContent = '';
    el('loginSuccess').textContent = '';
    el('loginSuccess').classList.remove('active');
    el('loginLoading').classList.add('active');

    if(remember) localStorage.setItem(REMEMBER_KEY, JSON.stringify({email,password,remember:true}));
    else localStorage.removeItem(REMEMBER_KEY);

    await new Promise(r=>setTimeout(r, 300));

    if(isDemoMode()){
      const user = state.users.find(u=>u.email.toLowerCase()===email && u.password===password);
      el('loginLoading').classList.remove('active');
      if(!user){
        el('loginError').textContent = 'Die E-Mail-Adresse oder das Passwort stimmen nicht.';
        return;
      }
      if(normalizeApprovalStatus(user) !== 'approved'){
        el('loginError').textContent = normalizeApprovalStatus(user) === 'rejected'
          ? 'Dieses Konto wurde noch nicht als Kundin freigegeben. Bitte melde dich direkt bei Lashes by Lia.'
          : 'Deine Registrierung wurde empfangen und wartet noch auf die Bestätigung durch den Admin.';
        return;
      }
      currentUser = user;
      markCurrentUserOnline();
    }else{
      // Clear everything first
      localStorage.clear();
      sessionStorage.clear();
      
      const result = await apiRequest('login', {email, password});
      el('loginLoading').classList.remove('active');
      if(!result?.success && !result?.ok){
        el('loginError').textContent = result?.message || result?.error || 'Die E-Mail-Adresse oder das Passwort stimmen nicht.';
        return;
      }
      // Server returns result.user, map to currentUser
      currentUser = result.user || result.currentUser;
      
      // Force admin role for the main admin emails
      if(email === 'julia@lashes-by-lia.de' || email === 'info@lashes-by-lia.de'){
        currentUser.role = 'admin';
        currentUser.firstName = 'Julia';
        currentUser.lastName = 'Edmaier';
        currentUser.name = 'Julia Edmaier';
      }
      
      // Initialize state
      state = cloneDefault();
      ensureSettings();
      
      // Load appointments and customers for the user
      try{
        const apptRes = await fetch(`${API_URL}/appointments`, {credentials: 'include'});
        if(apptRes.ok){
          const apiAppointments = await apptRes.json();
          if(Array.isArray(apiAppointments)){
            state.appointments = apiAppointments;
          }
        }
      }catch(e){
        console.warn('Load appointments error:', e);
      }
      if(currentUser.role === 'admin'){
        try{
          const custRes = await fetch(`${API_URL}/customers`, {credentials: 'include'});
          if(custRes.ok){
            const apiCustomers = await custRes.json();
            if(Array.isArray(apiCustomers)){
              // Keep admin in state.users, add API customers
              const adminUser = state.users.find(u => u.role === 'admin');
              state.users = [
                ...(adminUser ? [adminUser] : []),
                ...apiCustomers.map(c => ({...c, role: 'customer', approvalStatus: 'approved'}))
              ];
            }
          }
        }catch(e){
          console.warn('Load customers error:', e);
        }
      }
    }

    el('loginSuccess').textContent = `Willkommen zurück, ${firstNameOf(currentUser)}!`;
    const loginHour = new Date().getHours();
    const loginGreeting = loginHour < 11
      ? 'Guten Morgen'
      : loginHour < 17
        ? 'Schönen Nachmittag'
        : 'Willkommen zurück';
    el('loginSuccess').textContent = `${loginGreeting}, ${firstNameOf(currentUser)}!`;
    el('loginSuccess').classList.add('active');

    // Load data from API after login
    if(!isDemoMode()){
      try{
        const apptRes = await fetch(`${API_URL}/appointments`, {credentials: 'include'});
        if(apptRes.ok){
          const appts = await apptRes.json();
          state.appointments = appts || [];
        }
      }catch(e){ console.warn('Load appts after login:', e); }
      if(currentUser.role === 'admin'){
        try{
          const custRes = await fetch(`${API_URL}/customers`, {credentials: 'include'});
          if(custRes.ok){
            const custs = await custRes.json();
            const adminUser = state.users.find(u => u.role === 'admin');
            state.users = [
              ...(adminUser ? [adminUser] : []),
              ...(custs || []).map(c => ({...c, role: 'customer', approvalStatus: 'approved'}))
            ];
          }
        }catch(e){ console.warn('Load custs after login:', e); }
      }
    }

    setTimeout(showDashboard, 600);
  });
  el('loginEmail')?.addEventListener('keydown', submitLoginFormFromKeyboard);
  el('loginPassword')?.addEventListener('keydown', submitLoginFormFromKeyboard);

  el('showForgot')?.addEventListener('click', ()=>{
    el('forgotBox').classList.remove('hidden');
    el('registerBox')?.classList.add('hidden');
    setAuthMode('login');
    if(el('registerNoteMessage')) el('registerNoteMessage').textContent = '';
  });
  el('authModeLogin')?.addEventListener('click', ()=>{
    setAuthMode('login');
    if(el('forgotNote')) el('forgotNote').textContent = '';
    el('forgotBox')?.classList.add('hidden');
  });
  el('authModeRegister')?.addEventListener('click', ()=>{
    setAuthMode('register');
    if(el('forgotNote')) el('forgotNote').textContent = '';
    el('forgotBox')?.classList.add('hidden');
  });
  el('showRegister')?.addEventListener('click', ()=> setAuthMode('register'));
  el('hideRegister')?.addEventListener('click', ()=> setAuthMode('login'));
  el('forgotBox')?.addEventListener('click', (e)=> { if(e.target.id === 'forgotBox') el('forgotBox').classList.add('hidden'); });
  el('forgotSend')?.addEventListener('click', async ()=>{
    const email = el('forgotEmail').value.trim();
    if(!email){
      el('forgotNote').textContent = 'Bitte gib zuerst deine E-Mail-Adresse ein.';
      return;
    }
    if(isDemoMode()){
      const idx = state.users.findIndex(u=>u.email.toLowerCase() === email.toLowerCase());
      if(idx < 0){
        el('forgotNote').textContent = 'Wenn ein Konto existiert, wird ein Reset vorbereitet. Im Testmodus passiert das nur lokal.';
        return;
      }
      const tempPassword = `Test-${Math.random().toString(36).slice(2,8)}!`;
      state.users[idx].password = tempPassword;
      state.users[idx].lastEdited = nowISO();
      saveState();
      el('forgotNote').textContent = `Testmodus: Temporäres Passwort gesetzt für ${email}: ${tempPassword}`;
      return;
    }
    const result = await apiRequest('request-password-reset', {email});
    el('forgotNote').textContent = result?.message || 'Wenn ein Konto existiert, wird ein Reset-Link verschickt.';
  });
  el('registerForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const firstName = el('registerFirstName')?.value.trim() || '';
    const lastName = el('registerLastName')?.value.trim() || '';
    const name = mergeNameParts(firstName, lastName);
    const email = el('registerEmail')?.value.trim().toLowerCase() || '';
    const password = el('registerPassword')?.value || '';
    const phone = el('registerPhone')?.value.trim() || '';
    const birthdate = el('registerBirthdate')?.value || '';
    const contactHint = el('registerContactHint')?.value.trim() || '';
    const note = el('registerNote')?.value.trim() || '';
    const noteBox = el('registerNoteMessage');
    if(noteBox) noteBox.textContent = '';
    if(!firstName || !lastName || !email || password.length < 8){
      showRegisterFeedback({type:'error', text:'Bitte fülle Vorname, Nachname, E-Mail-Adresse und ein Passwort mit mindestens 8 Zeichen aus.'});
      return;
    }
    if(isDemoMode() && state.users.some(user => (user.email || '').toLowerCase() === email)){
      showRegisterFeedback({type:'error', text:'Für diese E-Mail-Adresse existiert bereits ein Konto. Bitte melde dich an oder nutze „Passwort vergessen“.'});
      return;
    }

    if(isDemoMode()){
      state.users.push({
        id:`cust-${Date.now()}`,
        role:'customer',
        approvalStatus:'pending',
        approvedAt:'',
        approvedBy:'',
        firstName,
        lastName,
        name,
        email,
        password,
        pendingPassword: password,
        phone,
        whatsapp: '',
        instagram: contactHint.startsWith('@') ? contactHint : '',
        birthdate,
        address: '',
        avatar: '',
        registrationNote: note,
        registrationSource: 'self-service',
        contactHint,
        documents: {},
        createdAt: nowISO(),
        lastEdited: nowISO(),
        lastLogin: '',
        lastActive: '',
        online: false
      });
      saveState();
      e.target.reset();
      showRegisterFeedback({
        type:'success',
        title:'Du erhältst eine Bestätigung per E-Mail. Der Admin prüft deine Registrierung jetzt persönlich.',
        text:'Du wirst benachrichtigt, sobald dein Account freigegeben wurde.'
      });
      if(typeof renderAll === 'function' && currentUser?.role === 'admin') renderAll();
      return;
    }

    const result = await apiRequest('register', {firstName, lastName, name, email, password, phone, birthdate, contactHint, note});
    if(!result?.ok){
      showRegisterFeedback({type:'error', text:result?.message || 'Die Registrierung konnte gerade nicht gespeichert werden. Bitte versuche es gleich noch einmal.'});
      return;
    }
    state = {...cloneDefault(), ...(result.state || state)};
    e.target.reset();
    showRegisterFeedback({
      type:'success',
      title:'Du erhältst eine Bestätigung per E-Mail. Dein Konto wird anschließend persönlich bestätigt.',
      text:'Du wirst benachrichtigt, sobald dein Account freigegeben wurde.'
    });
  });
  setAuthMode('login');
}

function showDashboard(){
  document.body.classList.toggle('role-admin-active', currentUser?.role === 'admin');
  document.body.classList.toggle('role-customer-active', currentUser?.role !== 'admin');
  el('loginSection').classList.add('hidden');
  el('dashboardApp').classList.remove('hidden');
  el('headerAccountArea').classList.remove('hidden');
  el('dashboardFooter').classList.remove('hidden');
  if(typeof closeOverviewSpotlightV65 === 'function') closeOverviewSpotlightV65();
  syncRoleVisibility();
  bindThemeAndOnlineV61();
  renderAll();
  openTab('overview');
  startDashboardLiveRefresh();
  requestAnimationFrame(()=>{
    if(typeof closeOverviewSpotlightV65 === 'function') closeOverviewSpotlightV65();
    openTab('overview');
  });
}

function syncRoleVisibility(){
  if(!currentUser) return;
  const isAdmin = currentUser.role === 'admin';
  document.body.classList.toggle('role-admin-active', isAdmin);
  document.body.classList.toggle('role-customer-active', !isAdmin);
  qsa('.admin-only').forEach((node)=>{
    node.style.display = isAdmin ? '' : 'none';
    node.setAttribute('aria-hidden', isAdmin ? 'false' : 'true');
  });
  if(!isAdmin){
    qsa('.side-tab').forEach((btn)=>{
      if(btn.dataset.tab === 'customers' || btn.dataset.tab === 'settings'){
        btn.classList.remove('active');
      }
    });
    ['customers','settings'].forEach((tab)=>{
      const panel = el(`tab-${tab}`);
      if(panel){
        panel.classList.remove('active');
        panel.style.display = 'none';
      }
    });
  }
}

function bindLogoutConfirm(){
  const modal = el('logoutConfirmModal');
  const trigger = el('logoutBtn');
  const closeBtn = el('logoutConfirmClose');
  const panel = modal?.querySelector('.logout-confirm-panel');
  const close = ()=>{
    modal?.classList.remove('active');
    modal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    const accept = el('logoutConfirmAccept');
    if(accept){
      accept.disabled = false;
      accept.textContent = 'Jetzt abmelden';
    }
  };
  if(closeBtn){
    closeBtn.classList.remove('quick-user-close');
    closeBtn.classList.add('logout-modal-close');
    closeBtn.innerHTML = '<svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.7 5.3a1 1 0 0 1 1.4 0L12 9.17l3.9-3.88a1 1 0 1 1 1.4 1.42L13.41 10.6l3.88 3.9a1 1 0 0 1-1.42 1.4L12 12.01l-3.9 3.88a1 1 0 0 1-1.4-1.42l3.89-3.89-3.88-3.9a1 1 0 0 1 0-1.4Z"/></svg>';
    closeBtn.setAttribute('aria-label', 'Schließen');
  }
  if(panel && !el('logoutConfirmBack')){
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.id = 'logoutConfirmBack';
    backBtn.className = 'logout-modal-back';
    backBtn.setAttribute('aria-label', 'Zurück');
    backBtn.innerHTML = '<svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.41 0Z"/></svg>';
    panel.insertBefore(backBtn, panel.firstChild);
  }
  if(trigger && !trigger.dataset.logoutConfirmBound){
    trigger.dataset.logoutConfirmBound = 'true';
    trigger.addEventListener('click', (event)=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      document.body.classList.add('modal-open');
      modal?.classList.add('active');
      modal?.setAttribute('aria-hidden', 'false');
    }, true);
  }
  if(el('logoutConfirmClose')) el('logoutConfirmClose').onclick = close;
  if(el('logoutConfirmBack')) el('logoutConfirmBack').onclick = close;
  if(el('logoutConfirmBackdrop')) el('logoutConfirmBackdrop').onclick = close;
  if(el('logoutConfirmCancel')) el('logoutConfirmCancel').onclick = close;
  if(el('logoutConfirmAccept')) el('logoutConfirmAccept').onclick = async ()=>{
    const accept = el('logoutConfirmAccept');
    if(accept){
      accept.disabled = true;
      accept.textContent = 'Abmelden...';
    }
    // Clear all localStorage and session
    localStorage.clear();
    sessionStorage.clear();
    if(!isDemoMode()){
      try {
        await fetch(`${API_URL}/auth/logout`, {method: 'POST', credentials: 'include'});
      } catch(e) {}
    }
    stopDashboardLiveRefresh();
    currentUser = null;
    state = null;
    document.body.classList.remove('role-admin-active', 'role-customer-active');
    close();
    window.location.href = '/';
  };
}

function bindGlobal(){
  el('logoutBtn')?.addEventListener('click', ()=>{});

  el('jumpToProfile')?.addEventListener('click', ()=>{
    openTab('profile');
    el('headerProfileMenu')?.classList.remove('open');
  });

  if(el('notificationTrigger')){
    el('notificationTrigger').onclick = (event)=>{
      event.preventDefault();
      event.stopPropagation();
      el('headerNotificationMenu')?.classList.toggle('open');
      el('headerProfileMenu')?.classList.remove('open');
      return false;
    };
  }
  if(el('headerProfileTrigger')){
    el('headerProfileTrigger').onclick = (event)=>{
      event.preventDefault();
      event.stopPropagation();
      el('headerProfileMenu')?.classList.toggle('open');
      el('headerNotificationMenu')?.classList.remove('open');
      return false;
    };
  }
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('#headerProfileMenu')) el('headerProfileMenu')?.classList.remove('open');
    if(!e.target.closest('#headerNotificationMenu')) el('headerNotificationMenu')?.classList.remove('open');
  });

  qsa('.side-tab').forEach(btn=>{
    btn.addEventListener('click', ()=> openTab(btn.dataset.tab));
  });

  el('prevMonth')?.addEventListener('click', ()=>{
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1, 1);
    renderCalendar();
  });
  el('nextMonth')?.addEventListener('click', ()=>{
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 1);
    renderCalendar();
  });

  ['click','keydown','mousemove','touchstart'].forEach(evt=>{
    document.addEventListener(evt, ()=> {
      if(currentUser){
        updateCurrentActivity();
        updateHeaderProfile();
        renderOnlinePanel();
      }
    }, {passive:true});
  });
  setInterval(()=>{
    if(currentUser){
      updateCurrentActivity();
      updateHeaderProfile();
      renderOnlinePanel();
    }
  }, 30000);
}

function openTab(tab){
  if(currentUser?.role !== 'admin' && (tab === 'customers' || tab === 'settings')){
    tab = 'overview';
  }
  if(typeof closeOverviewSpotlightV65 === 'function') closeOverviewSpotlightV65();
  qsa('.side-tab').forEach(btn=> btn.classList.toggle('active', btn.dataset.tab===tab));
  qsa('.dash-tab').forEach(panel=>{
    const active = panel.id === `tab-${tab}`;
    panel.classList.toggle('active', active);
    panel.style.display = active ? 'block' : 'none';
    if(active) panel.classList.remove('hidden');
    else panel.classList.add('hidden');
    panel.hidden = !active;
    panel.setAttribute('aria-hidden', active ? 'false' : 'true');
  });
  if(window.__liaFinalizeActive && typeof window.__liaForceRebuildTabs === 'function' && (tab === 'tasks' || tab === 'customers' || tab === 'settings')){
    window.__liaForceRebuildTabs();
  }
  if(tab === 'overview' && typeof window.renderOverview === 'function'){
    window.renderOverview();
  }
  if(tab === 'calendar'){
    if(typeof window.renderCalendar === 'function') window.renderCalendar();
    if(typeof window.renderCalendarList === 'function') window.renderCalendarList();
  }
  if(tab === 'tasks' && typeof window.renderTasks === 'function'){
    window.renderTasks();
  }
  if(tab === 'appointments' && typeof window.renderAppointments === 'function'){
    window.renderAppointments();
  }
  if(tab === 'customers' && typeof window.renderCustomers === 'function'){
    window.renderCustomers();
  }
  if(tab === 'settings' && typeof window.renderSettings === 'function'){
    window.renderSettings();
  }
  if(tab === 'profile'){
    if(typeof fillProfile === 'function') fillProfile();
  }
}

function bindThemeAndOnline(){
  const themeBtn = el('themeToggle');
  if(themeBtn){
    const applyTheme = (mode)=>{
      document.documentElement.classList.toggle('theme-dark', mode === 'dark');
      localStorage.setItem('lia-theme', mode);
      themeBtn.innerHTML = mode === 'dark'
        ? '<span class="theme-sun" aria-hidden="true">☀</span>'
        : '<span class="theme-moon" aria-hidden="true">◐</span>';
    };
    applyTheme(localStorage.getItem('lia-theme') || 'light');
    themeBtn.onclick = (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const next = document.documentElement.classList.contains('theme-dark') ? 'light' : 'dark';
      applyTheme(next);
    };
  }
  if(el('onlineToggle')){
    const adminVisible = !!currentUser && currentUser.role === 'admin';
    el('onlineToggle').classList.toggle('hidden', !adminVisible);
    if(!adminVisible) el('onlinePanel')?.classList.remove('active');
  }
}

window.toggleOnlinePanelV58 = function(){
  const panel = el('onlinePanel');
  if(!panel) return;
  panel.classList.remove('hidden');
  panel.classList.toggle('active');
  renderOnlinePanel();
}

function updateHeaderProfile(){
  refreshOnlineStates();
  const avatar = currentUser.avatar || '';
  [el('headerAvatar'), el('headerAvatarLarge'), el('profilePreviewLarge')].forEach(img=>{
    if(!img) return;
    if(avatar){ img.src = avatar; img.style.display='block'; }
    else { img.removeAttribute('src'); img.style.display='none'; }
  });

  const trigger = el('headerProfileTrigger');
  if(trigger){
    trigger.dataset.initials = initials(fullNameOf(currentUser));
    trigger.classList.toggle('has-avatar', !!avatar);
  }
  const dot = document.querySelector('.header-online-dot');
  if(dot) dot.classList.toggle('is-offline', !currentUser.online);

  const roleText = currentUser.role==='admin' ? 'Admin' : 'Kundin';
  const roleClass = currentUser.role==='admin' ? 'role-admin' : 'role-customer';

  el('headerDisplayName').textContent = fullNameOf(currentUser);
  el('headerDisplayRole').textContent = roleText;
  el('headerDisplayRole').className = `role-badge ${roleClass}`;
  el('dropdownName').textContent = fullNameOf(currentUser);
  el('dropdownRole').textContent = roleText;
  el('dropdownRole').className = `role-badge ${roleClass}`;
  el('dropdownEmail').textContent = currentUser.email || '-';
  el('dropdownPhone').textContent = currentUser.phone || '-';
  renderNotifications();
}

function fillProfile(){
  ensureUserNameParts(currentUser);
  el('profileFirstName').value = currentUser.firstName || '';
  el('profileLastName').value = currentUser.lastName || '';
  el('profilePhone').value = currentUser.phone || '';
  el('profileEmail').value = currentUser.email || '';
  el('profileBirthdate').value = currentUser.birthdate || '';
  el('profileCreatedAt').textContent = formatGermanDate(currentUser.createdAt);
  el('profileRole').innerHTML = `<span class="role-badge ${currentUser.role==='admin'?'role-admin':'role-customer'}">${currentUser.role==='admin'?'Admin':'Kundin'}</span>`;
  el('profileLastEdited').textContent = formatGermanDate(currentUser.lastEdited);
  el('profileLastOnline').textContent = formatOnlineStatus(currentUser);
}
el('profileForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const btn = el('profileSaveBtn');
  const idx = state.users.findIndex(u=>u.id===currentUser.id);
  const firstName = el('profileFirstName').value.trim();
  const lastName = el('profileLastName').value.trim();
  const savedRole = currentUser.role;
  state.users[idx] = {...state.users[idx], firstName, lastName, name:mergeNameParts(firstName, lastName), phone:el('profilePhone').value, birthdate:el('profileBirthdate').value, lastEdited: nowISO(), role: savedRole};
  currentUser = state.users[idx];
  currentUser.role = savedRole;
  saveState();
  if(btn){
    const originalText = btn.textContent;
    btn.textContent = 'Gespeichert!';
    btn.style.background = 'var(--green, #2d8a4e)';
    btn.disabled = true;
    setTimeout(()=>{
      btn.textContent = originalText;
      btn.style.background = '';
      btn.disabled = false;
    }, 2000);
  }
  renderAll();
});
el('avatarInput')?.addEventListener('change', (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    const idx = state.users.findIndex(u=>u.id===currentUser.id);
    state.users[idx].avatar = reader.result;
    state.users[idx].lastEdited = nowISO();
    currentUser = state.users[idx];
    saveState();
    renderAll();
  };
  reader.readAsDataURL(file);
});

function renderOverviewReminder(){
  const reminder = el('overviewTasksReminder');
  if(!reminder || !currentUser) return;
  const openItems = visibleAppointments().filter(a=>a.status==='open' || a.needsReconfirm);
  const pendingRegistrations = currentUser.role === 'admin' ? pendingCustomerUsers().length : 0;
  const docsOpen = currentUser.role === 'admin'
    ? customerUsers().some(c=>customerDocsStatus(c).missing.length > 0)
    : false;
  const customOpen = visibleCustomTasks().some(task=>task.status !== 'done');
  if(currentUser.role === 'admin'){
    reminder.innerHTML = pendingRegistrations
      ? `<span class="helper-badge pill-neutral">Freigabe</span> ${pendingRegistrations} neue Registrierung${pendingRegistrations === 1 ? ' wartet' : ' warten'} noch auf deine Bestätigung.`
      : '<span class="helper-badge">Reminder</span> Es sind noch offene Aufgaben zu bearbeiten!';
    reminder.classList.toggle('hidden', !(openItems.length || docsOpen || customOpen || pendingRegistrations));
    return;
  }
  const hasAnyBooking = visibleAppointments().some(a=>a.status !== 'declined');
  reminder.innerHTML = '<span class="helper-badge">Hinweis</span> Du hast aktuell noch keinen Termin gebucht. Wenn du möchtest, kannst du direkt eine Anfrage stellen.';
  reminder.classList.toggle('hidden', hasAnyBooking);
}

function renderOverview(){
  const base = new Date();
  const today = `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`;
  const visible = sortedAppointments(visibleAppointments());
  const todaysAppointments = visible.filter(a=>a.date===today);
  const upcomingAppointments = getUpcomingAppointments(6);
  const nextAppointment = todaysAppointments[0] || upcomingAppointments[0];

  const freeBox = el('overviewFreeSlots');
  if(freeBox){
    const dayKey = weekdayShort(base);
    const freeSlots = getNextAvailableSlots(today, 6);
    freeBox.innerHTML = freeSlots.length
      ? freeSlots.map(time=>`<span class="week-chip">${dayKey} · ${time}</span>`).join('')
      : '<span class="week-empty">Heute sind keine freien Zeiten mehr verfügbar</span>';
  }

  const summary = el('overviewTodaySummary');
  if(summary){
    summary.innerHTML = `
      <div class="today-highlight-main">
        <span class="helper-badge">Nächster Termin</span>
        <strong>${nextAppointment ? `${nextAppointment.time} · ${displayName(nextAppointment.customerId)}` : 'Heute noch frei'}</strong>
        <span>${nextAppointment ? nextAppointment.service : 'Aktuell ist kein Termin eingetragen.'}</span>
      </div>
      <div class="overview-mini-stats">
        <div class="mini-stat"><strong>${todaysAppointments.length}</strong><span>Heute</span></div>
        <div class="mini-stat"><strong>${todaysAppointments.filter(a=>a.status==='open').length}</strong><span>Offen</span></div>
        <div class="mini-stat"><strong>${todaysAppointments.filter(a=>a.status==='confirmed').length}</strong><span>Bestätigt</span></div>
      </div>
    `;
  }

  const timeline = el('overviewTodayTimeline');
  if(timeline){
    timeline.innerHTML = todaysAppointments.length ? todaysAppointments.map(a=>`
      <button type="button" class="timeline-slot" onclick="openAppointmentFromDay('${a.id}')">
        <div class="slot-time">${a.time} · ${a.service}</div>
        <div class="slot-meta">${displayName(a.customerId)} · <span class="pill ${statusClass(a.status)}">${statusLabel(a.status)}</span></div>
        <div class="subtle">Zuletzt bearbeitet von ${a.updatedBy} am ${formatGermanDate(a.updatedAt)}</div>
      </button>
    `).join('') : `<div class="timeline-slot empty"><div class="slot-time">Noch kein Termin für heute</div><div class="slot-meta">Sobald Termine eingetragen werden, erscheinen sie hier.</div></div>`;
  }

  const monday = new Date(base);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  const days = [];
  for(let i=0;i<7;i++){
    const d = new Date(monday);
    d.setDate(monday.getDate()+i);
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    days.push({date:d, items: visible.filter(a=>a.date===key)});
  }
  const weekBox = el('overviewWeekList');
  if(weekBox){
    weekBox.innerHTML = days.map(dayObj=>`
      <div class="week-row">
        <div class="week-day-meta">
          <strong>${dayObj.date.toLocaleDateString('de-DE',{weekday:'long'})}</strong>
          <span>${dayObj.date.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})}</span>
        </div>
        <div class="week-day-content">
          ${dayObj.items.length ? dayObj.items.map(a=>`<button type="button" class="week-chip" onclick="openAppointmentFromDay('${a.id}')">${a.time} · ${displayName(a.customerId)}</button>`).join('') : '<span class="week-empty">Keine Termine</span>'}
        </div>
      </div>
    `).join('');
  }

  const jumpWeekBtn = el('jumpToCalendarFromWeek');
  if (jumpWeekBtn) jumpWeekBtn.onclick = ()=> openTab('calendar');
  renderOverviewReminder();
}

window.openTodayOverviewV58 = function(){ document.body.classList.add('modal-open');
  const base = new Date();
  const today = `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`;
  const items = sortedAppointments(visibleAppointments()).filter(a=>a.date===today);
  const content = items.length ? items.map(a=>`
    <button type="button" class="list-item" onclick="openAppointmentFromDay('${a.id}'); closeOverviewModalV54();">
      <strong>${a.time} · ${a.service}</strong>
      <div>${displayName(a.customerId)}</div>
      <div class="list-meta"><span class="pill ${statusClass(a.status)}">${statusLabel(a.status)}</span><span>${formatGermanDate(a.updatedAt)}</span></div>
    </button>
  `).join('') : '<div class="empty-note">Heute sind aktuell keine Termine eingetragen.</div>';
  openOverviewModalV54('Tagesübersicht', 'Alle Termine für heute im Detail', content);
};
window.openWeekOverviewV58 = function(){ document.body.classList.add('modal-open');
  const base = new Date();
  const visible = sortedAppointments(visibleAppointments());
  const monday = new Date(base);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  const days = [];
  for(let i=0;i<7;i++){
    const d = new Date(monday);
    d.setDate(monday.getDate()+i);
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    days.push({date:d, items: visible.filter(a=>a.date===key)});
  }
  const content = days.map(dayObj=>`
    <div class="list-item">
      <strong>${dayObj.date.toLocaleDateString('de-DE',{weekday:'long', day:'2-digit', month:'2-digit'})}</strong>
      <div class="week-modal-list">
        ${dayObj.items.length ? dayObj.items.map(a=>`<button type="button" class="week-chip" onclick="openAppointmentFromDay('${a.id}'); closeOverviewModalV54();">${a.time} · ${displayName(a.customerId)}</button>`).join('') : '<span class="week-empty">Keine Termine</span>'}
      </div>
    </div>
  `).join('') + `<div class="calendar-link-row"><button type="button" class="button secondary small-btn" onclick="closeOverviewModalV54(); openTab('calendar');">Zum Kalender</button></div>`;
  openOverviewModalV54('Wochenansicht', 'Alle Termine dieser Woche im Detail', content);
};
window.openOverviewModalV54 = function(title, subline, contentHtml){
  el('overviewDetailTitle').textContent = title;
  el('overviewDetailSubline').textContent = subline;
  el('overviewDetailContent').innerHTML = contentHtml;
  el('overviewDetailModal').classList.add('active');
}
window.closeOverviewModalV54 = function(){
  el('overviewDetailModal').classList.remove('active');
  document.body.classList.remove('modal-open');
}

function renderCalendar(){
  const grid = el('calendarGrid');
  const expandToggle = el('calendarExpandToggle');
  if(!grid) return;
  normalizeCalendarDateSelection();
  const labels = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  grid.innerHTML = labels.map(l=>`<div class="calendar-label">${l}</div>`).join('');
  el('calendarTitle').textContent = currentMonth.toLocaleDateString('de-DE', {month:'long', year:'numeric'});

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const first = new Date(year, month, 1);
  let start = first.getDay(); if(start===0) start=7;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const todayKey = isoDateFromDate(new Date());
  const totalWeeks = Math.ceil(((start - 1) + daysInMonth) / 7);
  const selectedWeek = selectedCalendarDate && selectedCalendarDate.startsWith(`${year}-${pad(month+1)}`)
    ? Math.ceil(((start - 1) + Number(selectedCalendarDate.slice(-2))) / 7)
    : 1;
  const expanded = window.__liaCalendarExpanded === true || selectedWeek > 3;
  let cellIndex = 0;

  for(let i=1;i<start;i++){
    cellIndex += 1;
    const week = Math.ceil(cellIndex / 7);
    grid.insertAdjacentHTML('beforeend', `<div class="calendar-cell empty ${!expanded && week > 3 ? 'is-collapsed' : ''}"></div>`);
  }
  for(let d=1; d<=daysInMonth; d++){
    cellIndex += 1;
    const week = Math.ceil(cellIndex / 7);
    const key = `${year}-${pad(month+1)}-${pad(d)}`;
    const items = sortedAppointments(visibleAppointments().filter(a=>a.date===key));
    const isSelected = key === selectedCalendarDate;
    const previewItems = items.slice(0, isSelected ? 2 : 1);
    const freeSlots = getAvailableSlotsForDate(key).filter(slot=>!slot.blocked);
    const isFullyBooked = items.length > 0 && freeSlots.length === 0;
    const compactPreview = !isSelected;
    const previewHtml = items.length
      ? `<div class="calendar-preview-list">
          ${previewItems.map(a=>`<span class="calendar-preview-item ${compactPreview ? 'is-compact' : ''}"><strong>${a.time}</strong><span>${displayName(a.customerId)}</span></span>`).join('')}
          <div class="calendar-preview-footer">
            <span class="calendar-day-badge ${isFullyBooked ? 'is-full' : 'is-busy'}">${isFullyBooked ? 'Ausgebucht' : `${items.length} Termin${items.length===1?'':'e'}`}</span>
            ${items.length > previewItems.length ? `<span class="calendar-preview-more">+ ${items.length - previewItems.length} weitere</span>` : ''}
          </div>
        </div>`
      : isSelected
        ? `<div class="calendar-preview-list calendar-preview-list-empty">
            <span class="calendar-preview-empty-card">
              <strong>Frei</strong>
              <span>${freeSlots.length ? `${freeSlots.length} Zeiten verfügbar` : 'Keine Zeiten hinterlegt'}</span>
            </span>
            <div class="calendar-preview-footer">
              <span class="calendar-day-badge ${freeSlots.length ? 'is-busy' : 'is-full'}">${freeSlots.length ? 'Planbar' : 'Keine Zeiten'}</span>
            </div>
          </div>`
        : '<span class="calendar-count">Frei</span>';
    const isPast = key < todayKey;
    const classes = [
      'calendar-cell',
      isPast ? 'past' : '',
      key === todayKey ? 'today' : '',
      key === selectedCalendarDate && !isPast ? 'selected' : '',
      !expanded && week > 3 ? 'is-collapsed' : ''
    ].filter(Boolean).join(' ');
    const cellContent = `<span class="day">${d}</span>${previewHtml}${items.map(a=>`<span class="calendar-pill ${statusClass(a.status)}"></span>`).join('')}`;
    grid.insertAdjacentHTML('beforeend', isPast ? `<div class="${classes}">${cellContent}</div>` : `<button type="button" class="${classes}" onclick="selectCalendarDateV64('${key}')">${cellContent}</button>`);
  }
  if(expandToggle){
    if(totalWeeks > 3){
      expandToggle.classList.remove('hidden');
      expandToggle.textContent = expanded ? 'Weniger anzeigen' : 'Mehr anzeigen';
      expandToggle.onclick = function(){
        window.__liaCalendarExpanded = !expanded;
        renderCalendar();
      };
    } else {
      expandToggle.classList.add('hidden');
      expandToggle.onclick = null;
    }
  }
}
function filteredAppointments(){ return visibleAppointments(); }
function renderCalendarList(){
  const box = el('calendarAllList');
  const actionsBox = el('calendarDayActions');
  if(!box) return;
  normalizeCalendarDateSelection();
  const summary = el('calendarDaySummary');
  const allItems = sortedAppointments(visibleAppointments());
  const items = selectedCalendarDate
    ? allItems.filter(a=>a.date===selectedCalendarDate)
    : allItems;
  if(summary){
    const availableSlots = selectedCalendarDate ? getAvailableSlotsForDate(selectedCalendarDate) : [];
    const freeSlots = availableSlots.filter(slot=>!slot.blocked);
    summary.innerHTML = `
      <div class="helper-badge">Ausgewählter&nbsp;Tag</div>
      <strong>${selectedCalendarDate ? formatDateOnly(selectedCalendarDate) : 'Kein Datum gewählt'}</strong>
      <div class="subtle">${items.length ? `${items.length} Termin${items.length===1?'':'e'} geplant` : 'Noch keine Termine an diesem Tag.'}</div>
      <div class="list-meta">${selectedCalendarDate ? `<span>${freeSlots.length} freie Zeiten</span><span>${availableSlots.length - freeSlots.length} blockiert</span>` : '<span>Bitte einen Tag wählen</span>'}</div>
    `;
  }
  if(actionsBox){
    const hasDay = !!selectedCalendarDate;
    const formattedDay = selectedCalendarDate ? formatDateOnly(selectedCalendarDate) : 'Kein Datum gewählt';
    actionsBox.innerHTML = `
      <div class="calendar-actions-copy">
        <span class="subtle">${hasDay ? 'Öffne den ausgewählten Tag als eigene Detailansicht.' : 'Wähle zuerst einen Tag im Kalender aus.'}</span>
      </div>
      <div class="calendar-actions-row">
        <button type="button" class="button secondary" ${hasDay ? '' : 'disabled'} onclick="${hasDay ? `return window.openWeekDayOverviewV64 ? window.openWeekDayOverviewV64('${selectedCalendarDate}') : false;` : 'return false;'}">Tagesansicht öffnen</button>
        <button type="button" class="button primary" ${hasDay ? '' : 'disabled'} onclick="${hasDay ? `return window.openAppointmentEditorV64 ? window.openAppointmentEditorV64('', '${selectedCalendarDate}') : false;` : 'return false;'}">${currentUser?.role === 'admin' ? 'Termin vergeben' : 'Termin anfragen'}</button>
      </div>
    `;
  }
  box.innerHTML = '';
  box.classList.add('hidden');
  return;
  box.innerHTML = items.length ? items.map(a=>`
    <div class="list-item appointment-item">
      <div class="appointment-row">
        <div>
          <strong>${a.service}</strong>
          <div>${displayName(a.customerId)}</div>
          <div class="list-meta"><span>${formatDateOnly(a.date)}</span><span>${a.time}</span><span class="pill ${statusClass(a.status)}">${statusLabel(a.status)}</span></div>
        </div>
        <div class="subtle align-right">${a.needsReconfirm ? 'Erneute Bestätigung nötig' : 'Aktueller Stand'}<br>Zuletzt bearbeitet von ${a.updatedBy}</div>
      </div>
      <div>${a.note || ''}</div>
    </div>
  `).join('') : `<div class="empty-note">${selectedCalendarDate ? 'Für diesen Tag sind aktuell keine Termine eingetragen.' : 'Es sind aktuell keine Termine eingetragen.'}</div>`;
}
window.selectCalendarDateV64 = function(dateValue){
  const todayKey = isoDateFromDate(new Date());
  if(dateValue < todayKey){
    return false;
  }
  if(selectedCalendarDate === dateValue && typeof window.openWeekDayOverviewV64 === 'function'){
    return window.openWeekDayOverviewV64(dateValue);
  }
  selectedCalendarDate = dateValue;
  if(el('appointmentDate')) el('appointmentDate').value = dateValue;
  renderCalendar();
  renderCalendarList();
  syncAppointmentTimeOptions(el('appointmentTime')?.value || '');
  return false;
}
window.openAppointmentFromDay = function(id){
  editAppointment(id);
  openTab('calendar');
}

function fillServiceSelector(){
  const select = el('appointmentService');
  if(!select) return;
  const current = select.value;
  const services = activeServices();
  select.innerHTML = services.map(s=>`<option value="${s}">${s}</option>`).join('');
  if(current && services.includes(current)) select.value = current;
}

function fillCustomerSelector(){
  const select = el('appointmentCustomer');
  if(!select) return;
  const users = customerUsers();
  select.innerHTML = users.map(u=>`<option value="${u.id}">${u.name}</option>`).join('');
}
function syncAppointmentTimeOptions(preferredTime=''){
  const input = el('appointmentTime');
  const datalist = el('appointmentTimeSuggestions');
  const dateValue = el('appointmentDate')?.value || '';
  const editId = el('appointmentEditId')?.value || '';
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
  const available = slots.filter(slot=>!slot.blocked);
  if(datalist){
    datalist.innerHTML = available.map(slot=>`<option value="${slot.time}">`).join('');
  }
  if(preferredTime){
    input.value = preferredTime;
  } else if(available.length && !input.value){
    input.value = available[0].time;
  }
}
function previewOpeningHours(day, configOverride=null){
  const preview = el('openingHoursPreview');
  if(!preview) return;
  const config = configOverride || state.settings.openingHours?.[day];
  if(!config || !config.enabled){
    preview.innerHTML = '<span class="week-empty">An diesem Tag werden aktuell keine Termine angeboten.</span>';
    return;
  }
  const times = buildSlotsFromConfig(config).map(slot=>slot.time);
  preview.innerHTML = times.length ? times.map(time=>`<span class="week-chip">${time}</span>`).join('') : '<span class="week-empty">Aus diesen Zeiten entstehen aktuell keine Terminfenster.</span>';
}
window.openOpeningHoursDay = function(day){
  const config = state.settings.openingHours?.[day];
  if(!config) return false;
  el('openingHoursTitle').textContent = `${day} bearbeiten`;
  el('openingHoursDay').value = day;
  el('openingHoursEnabled').checked = !!config.enabled;
  el('openingHoursStart').value = config.start || '09:00';
  el('openingHoursEnd').value = config.end || '18:00';
  el('openingHoursSlotMinutes').value = String(config.slotMinutes || 30);
  if(el('openingHoursBufferMinutes')) el('openingHoursBufferMinutes').value = String(config.bufferMinutes || 0);
  previewOpeningHours(day);
  el('openingHoursModal')?.classList.add('active');
  return false;
}

el('appointmentForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const editId = el('appointmentEditId').value;
  const date = el('appointmentDate').value;
  const time = el('appointmentTime').value;
  const config = getOpeningConfigForDate(date);
  const slotTimes = getAvailableSlotsForDate(date, editId).filter(slot=>!slot.blocked).map(slot=>slot.time);
  const isInSlots = slotTimes.includes(time);
  const isInRange = config && config.enabled && timeToMinutes(time) >= timeToMinutes(config.start) && timeToMinutes(time) <= timeToMinutes(config.end);
  if(!isInSlots && !isInRange){
    window.alert('Die Uhrzeit liegt außerhalb der Öffnungszeiten dieses Tages.');
    return;
  }
  if(!isInSlots && isInRange){
    const conflicts = getAvailableSlotsForDate(date, editId).filter(slot=>slot.blocked).map(slot=>slot.time);
    if(conflicts.length && !window.confirm('Achtung: Diese Zeit liegt außerhalb der Standard-Intervalle. Es könnten Überschneidungen bestehen. Trotzdem fortfahren?')){
      return;
    }
  }
  const payload = {
    customerId: currentUser.role==='admin' ? el('appointmentCustomer').value : currentUser.id,
    service: el('appointmentService').value,
    date: el('appointmentDate').value,
    time: el('appointmentTime').value,
    note: el('appointmentNote').value,
    status: currentUser.role==='admin' ? 'confirmed' : 'open',
    updatedBy: currentUser.name,
    updatedByRole: currentUser.role,
    updatedAt: nowISO(),
    needsReconfirm: currentUser.role === 'customer'
  };

  // Use real API if not in demo mode
  if(!isDemoMode()){
    try{
      if(editId){
        await fetch(`${API_URL}/appointments/${editId}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      }else{
        await fetch(`${API_URL}/appointments`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      }
      // Reload appointments from API
      const response = await fetch(`${API_URL}/appointments`, {credentials: 'include'});
      const apiAppointments = await response.json();
      state.appointments = apiAppointments || [];
    }catch(err){
      console.error('API error:', err);
      window.alert('Fehler beim Speichern in der Datenbank.');
      return;
    }
  }else{
    // Demo mode - use localStorage
    if(editId){
      const appt = state.appointments.find(a=>a.id===editId);
      if(appt){
        Object.assign(appt, payload);
        if(currentUser.role !== 'admin'){
          appt.status = 'open';
          appt.needsReconfirm = true;
        } else {
          appt.needsReconfirm = false;
        }
      }
    }else{
      state.appointments.push({id:`a${Date.now()}`,...payload});
    }
    saveState();
  }
  
  e.target.reset();
  el('appointmentEditId').value = '';
  el('appointmentSubmitBtn').textContent = currentUser.role==='admin' ? 'Termin speichern' : 'Termin anfragen';
  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  if(el('appointmentDate')) el('appointmentDate').min = today;
  renderAll();
});
el('appointmentDate')?.addEventListener('change', ()=>{
  selectedCalendarDate = el('appointmentDate')?.value || selectedCalendarDate;
  syncAppointmentTimeOptions();
  renderCalendar();
  renderCalendarList();
});
window.editAppointment = function(id){
  const a = state.appointments.find(x=>x.id===id);
  if(!a) return;
  if(currentUser.role!=='admin' && a.customerId!==currentUser.id) return;
  if(currentUser.role==='admin') el('appointmentCustomer').value = a.customerId;
  el('appointmentService').value = a.service;
  el('appointmentDate').value = a.date;
  selectedCalendarDate = a.date;
  el('appointmentEditId').value = a.id;
  syncAppointmentTimeOptions(a.time);
  el('appointmentNote').value = a.note || '';
  el('appointmentSubmitBtn').textContent = 'Termin aktualisieren';
}
const CUSTOMER_NOTIFICATIONS_KEY = 'lia-customer-notifications-v1';
function getCustomerNotifications(){
  try{ return JSON.parse(localStorage.getItem(CUSTOMER_NOTIFICATIONS_KEY) || '[]'); }
  catch{ return []; }
}
function addCustomerNotification(customerId, notification){
  const notifications = getCustomerNotifications();
  notifications.push({...notification, customerId, createdAt: nowISO()});
  localStorage.setItem(CUSTOMER_NOTIFICATIONS_KEY, JSON.stringify(notifications));
}
function getCustomerUnreadNotifications(customerId){
  return getCustomerNotifications().filter(n => n.customerId === customerId && !n.read);
}
function markCustomerNotificationsRead(customerId){
  const notifications = getCustomerNotifications();
  notifications.forEach(n => { if(n.customerId === customerId) n.read = true; });
  localStorage.setItem(CUSTOMER_NOTIFICATIONS_KEY, JSON.stringify(notifications));
}
function showCustomerConfirmationToast(appointment){
  const host = ensureNotificationToastHost();
  const toast = document.createElement('div');
  toast.className = 'notification-toast notification-toast-success';
  toast.innerHTML = `
    <div class="notification-toast-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </div>
    <div class="notification-toast-content">
      <span class="notification-toast-kicker">Termin bestätigt</span>
      <span class="notification-toast-text">${appointment.service} · ${formatDateOnly(appointment.date)} um ${appointment.time}</span>
      <span class="notification-toast-meta">Dein Termin wurde bestätigt!</span>
    </div>
  `;
  host.appendChild(toast);
  setTimeout(() => toast.classList.add('notification-toast-exit'), 4200);
  setTimeout(() => toast.remove(), 5000);
}
window.setAppointmentStatusV54 = async function(id, status){
  const a = state.appointments.find(x=>x.id===id);
  if(!a) return;
  const wasConfirmed = a.status !== 'confirmed' && status === 'confirmed';
  a.status = status;
  a.needsReconfirm = false;
  a.updatedBy = currentUser.name;
  a.updatedByRole = currentUser.role;
  a.updatedAt = nowISO();
  if(!isDemoMode()){
    try{
      await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({
          service: a.service, date: a.date, time: a.time, endTime: a.endTime,
          note: a.note, status, needsReconfirm: false
        })
      });
    }catch(err){ console.error('API error updating appointment status:', err); }
  } else {
    saveState();
  }
  if(wasConfirmed && currentUser.role === 'admin'){
    addCustomerNotification(a.customerId, {
      type: 'appointment-confirmed',
      title: 'Termin bestätigt',
      text: `${a.service} am ${formatDateOnly(a.date)} um ${a.time}`,
      appointmentId: a.id
    });
  }
  renderAll();
}
window.deleteAppointment = async function(id){
  if(currentUser?.role !== 'admin') return;
  const idx = state.appointments.findIndex(x=>x.id===id);
  if(idx < 0) return;
  if(!window.confirm('Möchtest du diesen Termin wirklich löschen?')) return;
  if(!isDemoMode()){
    try{
      await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE', credentials: 'include' });
      state.appointments.splice(idx, 1);
    }catch(err){
      console.error('API error deleting appointment:', err);
      window.alert('Fehler beim Löschen des Termins.');
      return;
    }
  } else {
    state.appointments.splice(idx, 1);
    saveState();
  }
  if(typeof renderAll === 'function') renderAll();
  if(typeof closeOverviewModalV54 === 'function') closeOverviewModalV54();
}

function renderTasks(){
  const metric = el('tasksMetricGrid');
  const acc = el('tasksAccordion');
  const completedBox = el('completedTasksList');
  const completedBadge = el('completedTasksBadge');
  const tasksSideSubtle = document.querySelector('#tab-tasks .rules-head .subtle');
  const completedLegacyNote = document.querySelector('#completedTasksList + p');
  if(!metric || !acc) return;
  const isAdmin = currentUser.role === 'admin';
  if(tasksSideSubtle) tasksSideSubtle.textContent = isAdmin
    ? 'Manuell anlegen, abhaken und erledigte Einträge nachverfolgen'
    : 'Behalte deine Anfragen, Unterlagen und eigenen Notizen im Blick';
  if(completedLegacyNote) completedLegacyNote.classList.add('hidden');
  const q = (el('taskCustomerSearch')?.value || '').trim().toLowerCase();
  const openItems = sortedAppointments(visibleAppointments()).filter(a=>{
    if(!(a.status==='open' || a.needsReconfirm)) return false;
    const customer = displayName(a.customerId).toLowerCase();
    return !q || customer.includes(q) || (a.service || '').toLowerCase().includes(q);
  });
  const customers = currentUser.role === 'admin'
    ? customerUsers()
    : customerUsers().filter(customer=>customer.id === currentUser.id);
  const customTasks = visibleCustomTasks();
  const openCustomTasks = customTasks
    .filter(task=>task.status !== 'done')
    .sort((a,b)=>(`${a.reminderAt || '9999-12-31T23:59'} ${a.createdAt}`).localeCompare(`${b.reminderAt || '9999-12-31T23:59'} ${b.createdAt}`));
  const completedCustomTasks = [...customTasks]
    .filter(task=>task.status === 'done')
    .sort((a,b)=>(b.completedAt || '').localeCompare(a.completedAt || ''));
  const docRows = customers
    .filter(c=> !q || `${c.name} ${c.email} ${c.phone||''}`.toLowerCase().includes(q))
    .map(c=>({customer:c, status:customerDocsStatus(c)}))
    .filter(row=>row.status.missing.length > 0);
  const pendingRows = isAdmin
    ? pendingCustomerUsers().filter(c=> !q || `${c.name} ${c.email} ${c.phone||''}`.toLowerCase().includes(q))
    : [];
  const customerHasBookings = visibleAppointments().some(a=>a.status !== 'declined');

  metric.innerHTML = isAdmin ? `
    <button type="button" class="card metric-card clickable" onclick="openTab('tasks')"><div class="metric-top"><span class="helper-badge">Offene Anfragen</span></div><h3>${openItems.length}</h3><p>Zur Prüfung offen</p></button>
    <button type="button" class="card metric-card clickable" onclick="openTab('tasks')"><div class="metric-top"><span class="helper-badge">Offene Unterlagen</span></div><h3>${docRows.length}</h3><p>Benötigen Nacharbeit</p></button>
    <button type="button" class="card metric-card clickable" onclick="openTab('tasks')"><div class="metric-top"><span class="helper-badge">Eigene Aufgaben</span></div><h3>${openCustomTasks.length}</h3><p>Manuell offen</p></button>
  ` : `
    <button type="button" class="card metric-card clickable" onclick="openTab('tasks')"><div class="metric-top"><span class="helper-badge">Meine Anfragen</span></div><h3>${openItems.length}</h3><p>Warten auf Rückmeldung</p></button>
    <button type="button" class="card metric-card clickable" onclick="openTab('calendar')"><div class="metric-top"><span class="helper-badge">Terminstatus</span></div><h3>${customerHasBookings ? 'Aktiv' : 'Offen'}</h3><p>${customerHasBookings ? 'Du hast bereits Termine im Blick' : 'Noch keine Buchung vorhanden'}</p></button>
    <button type="button" class="card metric-card clickable" onclick="openTab('tasks')"><div class="metric-top"><span class="helper-badge">Eigene Aufgaben</span></div><h3>${openCustomTasks.length}</h3><p>Für dich notiert</p></button>
  `;

  const requestsHtml = openItems.length ? openItems.map(a=>`
    <div class="task-accordion-item">
      <button type="button" class="task-toggle-btn" onclick="toggleTaskSection('request-${a.id}')">
        <span><strong>${a.service}</strong> · ${displayName(a.customerId)}</span>
        <span class="task-count-badge">${a.needsReconfirm ? (isAdmin ? 'Neu bestätigen' : 'Erneut angefragt') : 'Offen'}</span>
      </button>
      <div class="task-section-body hidden" id="request-${a.id}">
        <div class="list-meta"><span>${formatDateOnly(a.date)}</span><span>${a.time}</span><span class="pill ${statusClass(a.status)}">${statusLabel(a.status)}</span></div>
        <div class="subtle">${a.updatedByRole === 'customer' ? (isAdmin ? 'Von Kundin geändert – erneute Bestätigung nötig.' : 'Du hast diesen Termin geändert. Eine erneute Bestätigung kann nötig sein.') : 'Von Admin bearbeitet.'}</div>
        <div class="subtle">Zuletzt bearbeitet von ${a.updatedBy} am ${formatGermanDate(a.updatedAt)}</div>
        <div class="inline-actions">
          ${currentUser.role==='admin' ? `<button class="button secondary small-btn" onclick="setAppointmentStatusV54('${a.id}','confirmed')">Bestätigen</button><button class="button secondary small-btn" onclick="setAppointmentStatusV54('${a.id}','declined')">Ablehnen</button>` : ''}
          <button class="button secondary small-btn" onclick="editAppointment('${a.id}')">Bearbeiten</button>
        </div>
      </div>
    </div>`).join('') : `<div class="empty-note">${isAdmin ? 'Derzeit gibt es keine offenen Aufgaben oder offenen Anfragen.' : 'Derzeit gibt es keine offenen Termin-Anfragen von dir.'}</div>`;

  const docsHtml = docRows.length ? docRows.map(row=>`
    <div class="task-accordion-item">
      <button type="button" class="task-toggle-btn" onclick="toggleTaskSection('doc-${row.customer.id}')">
        <span><strong>${row.customer.name}</strong> <span class="subtle">${row.status.minor ? 'Unter 18' : 'Ab 18'}</span></span>
        <span class="task-count-badge">${row.status.missing.length} offen</span>
      </button>
      <div class="task-section-body hidden" id="doc-${row.customer.id}">
        <div class="subtle">Erforderlich: ${row.status.required.join(' · ')}</div>
        <div class="list-meta"><span>Fehlt:</span><span>${row.status.missing.join(' · ')}</span></div>
        <div class="inline-actions">
          <button class="button secondary small-btn" onclick="${isAdmin ? `editCustomer('${row.customer.id}')` : `openTab('profile')`}">${isAdmin ? 'Kundin bearbeiten' : 'Zum Profil'}</button>
        </div>
      </div>
    </div>`).join('') : '<div class="empty-note">Derzeit gibt es keine offenen Dokumenten-Aufgaben.</div>';

  const customTasksHtml = openCustomTasks.length ? openCustomTasks.map(task=>`
    <div class="task-accordion-item">
      <button type="button" class="task-toggle-btn" onclick="toggleTaskSection('custom-${task.id}')">
        <span><strong>${task.title}</strong><span class="subtle task-owner-line"> · ${task.createdByName}</span></span>
        <span class="task-count-badge">${task.reminderAt ? formatGermanDate(task.reminderAt) : 'Offen'}</span>
      </button>
      <div class="task-section-body hidden" id="custom-${task.id}">
        <div class="subtle">${task.note || 'Keine zusätzliche Notiz hinterlegt.'}</div>
        <div class="list-meta"><span>Erstellt von ${task.createdByName}</span><span>${formatGermanDate(task.createdAt)}</span></div>
        <div class="list-meta"><span>${reminderChannelsLabel(task.reminder)}</span>${task.reminderAt ? `<span>Erinnerung: ${formatGermanDate(task.reminderAt)}</span>` : '<span>Kein Erinnerungszeitpunkt</span>'}</div>
        <div class="inline-actions">
          <button class="button secondary small-btn" onclick="completeCustomTask('${task.id}')">Als erledigt markieren</button>
          <button class="button secondary small-btn" onclick="deleteCustomTask('${task.id}')">Löschen</button>
        </div>
      </div>
    </div>
  `).join('') : '<div class="empty-note">Derzeit gibt es keine offenen eigenen Aufgaben.</div>';

  acc.innerHTML = isAdmin
    ? `<div class="task-section-title">Offene Anfragen</div>${requestsHtml}<div class="task-section-title">Offene Unterlagen</div>${docsHtml}<div class="task-section-title">Eigene Aufgaben</div>${customTasksHtml}`
    : `<div class="task-section-title">Meine Anfragen</div>${requestsHtml}<div class="task-section-title">Eigene Aufgaben</div>${customTasksHtml}`;

  if(completedBox){
    completedBox.innerHTML = completedCustomTasks.length ? completedCustomTasks.map(task=>`
      <div class="task-accordion-item completed-task-item">
        <button type="button" class="task-toggle-btn" onclick="toggleTaskSection('done-${task.id}')">
          <span><strong>${task.title}</strong><span class="subtle task-owner-line"> · ${task.completedByName || 'Offen'}</span></span>
          <span class="task-count-badge">${task.completedAt ? formatDateOnly(task.completedAt) : 'Erledigt'}</span>
        </button>
        <div class="task-section-body hidden" id="done-${task.id}">
          <div class="subtle">${task.note || 'Keine zusätzliche Notiz hinterlegt.'}</div>
          <div class="list-meta"><span>Erstellt von ${task.createdByName || 'System'}</span><span>${formatGermanDate(task.createdAt)}</span></div>
          <div class="list-meta"><span>Erledigt von ${task.completedByName || '-'}</span><span>${formatGermanDate(task.completedAt)}</span></div>
          <div class="list-meta"><span>${reminderChannelsLabel(task.reminder)}</span>${task.reminderAt ? `<span>Erinnerung geplant für ${formatGermanDate(task.reminderAt)}</span>` : '<span>Ohne Erinnerungszeitpunkt</span>'}</div>
        </div>
      </div>
    `).join('') : '<div class="empty-note">Noch keine erledigten eigenen Aufgaben vorhanden.</div>';
  }
  if(completedBadge) completedBadge.textContent = String(completedCustomTasks.length);
}
window.toggleTaskSection = function(id){
  const node = document.getElementById(id);
  if(node) node.classList.toggle('hidden');
}
window.completeCustomTask = async function(id){
  const task = state.customTasks.find(entry=>entry.id === id);
  if(!task || !currentUser) return;
  task.status = 'done';
  task.completedAt = nowISO();
  task.completedById = currentUser.id;
  task.completedByName = currentUser.name;
  if(!isDemoMode()){
    try{
      await fetch(`${API_URL}/tasks/${id}/complete`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({})
      });
    }catch(err){ console.error('API error completing task:', err); }
  } else {
    saveState();
  }
  renderAll();
}
window.deleteCustomTask = async function(id){
  if(!currentUser) return;
  const idx = state.customTasks.findIndex(entry=>entry.id === id);
  if(idx < 0) return;
  if(!window.confirm('Möchtest du diese Aufgabe wirklich löschen?')) return;
  if(!isDemoMode()){
    try{
      await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE', credentials: 'include' });
      state.customTasks.splice(idx, 1);
    }catch(err){
      console.error('API error deleting task:', err);
      window.alert('Fehler beim Löschen der Aufgabe.');
      return;
    }
  } else {
    state.customTasks.splice(idx, 1);
    saveState();
  }
  renderAll();
}
el('taskCustomerSearch')?.addEventListener('input', renderTasks);

function renderAppointmentsHub() {
  const hub = el('appointmentsHub');
  if(!hub) return;
  
  const appointments = sortedAppointments(visibleAppointments());
  if(!appointments.length) {
    hub.innerHTML = '<div class="empty-note">Noch keine Termine eingetragen.</div>';
    return;
  }
  
  const grouped = {};
  appointments.forEach(a => {
    if(!grouped[a.date]) grouped[a.date] = [];
    grouped[a.date].push(a);
  });
  
  hub.innerHTML = Object.entries(grouped).map(([date, items]) => `
    <div class="card panel">
      <header><h3>${formatDateOnly(date)}</h3></header>
      <div class="stack-list">
        ${items.map(a => `
          <div class="list-item">
            <div><strong>${a.time} · ${a.service}</strong></div>
            <div class="subtle">${displayName(a.customerId)} · <span class="pill ${statusClass(a.status)}">${statusLabel(a.status)}</span></div>
            ${a.note ? `<div class="subtle" style="margin-top:6px;">${a.note}</div>` : ''}
            <div class="inline-actions" style="margin-top:8px;">
              <button class="button secondary small-btn" onclick="return openAppointmentFromDay('${a.id}');">Bearbeiten</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderCustomers(){
  const list = el('customerList');
  if(!list) return;
  const q = (el('customerSearch')?.value || '').trim().toLowerCase();
  const rows = [...customerUsers()].sort((a,b)=>a.name.localeCompare(b.name, 'de')).filter(c=>{
    const hay = `${c.name} ${c.email} ${c.phone||''}`.toLowerCase();
    return !q || hay.includes(q);
  });
  list.innerHTML = rows.length ? rows.map(c=>`
    <button type="button" class="card panel customer-card" onclick="editCustomer('${c.id}')">
      <div class="customer-card-header">
        <div class="customer-avatar">${(c.name || '?').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</div>
        <div class="customer-info">
          <strong>${c.name}</strong>
          <span class="subtle">${c.email}</span>
        </div>
      </div>
      <div class="customer-details">
        ${c.phone ? `<div class="customer-detail"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ${c.phone}</div>` : ''}
        ${c.birthdate ? `<div class="customer-detail"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${formatDateOnly(c.birthdate)}</div>` : ''}
        ${c.address ? `<div class="customer-detail"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${c.address}</div>` : ''}
      </div>
      <div class="customer-docs">
        ${c.documents?.treatmentContract ? '<span class="doc-badge success"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Vertrag</span>' : ''}
        ${c.documents?.minorConsent ? '<span class="doc-badge success"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Einverständnis</span>' : ''}
        ${c.documents?.idCopy ? '<span class="doc-badge success"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Ausweis</span>' : ''}
      </div>
    </button>`).join('') : '<div class="empty-note">Keine Kundin gefunden.</div>';
}
el('customerSearch')?.addEventListener('input', renderCustomers);

function updateCreateCustomerDocumentUI(){
  const birth = el('createCustomerBirthdate')?.value || '';
  const hint = el('createCustomerDocHint');
  const minor = birth ? isMinorFromBirthdate(birth) : null;
  const resetCreateField = (id)=>{
    const node = el(id);
    if(!node) return;
    if(node.type === 'checkbox') node.checked = false;
    else node.value = '';
  };
  qsa('.create-doc-field').forEach(node=> node.style.display = 'none');
  if(!birth){
    ['createDocTreatmentContract','createDocMinorConsent','createDocIdCopy','createUploadTreatmentContract','createUploadMinorConsent','createUploadIdCopy'].forEach(resetCreateField);
    if(hint) hint.innerHTML = '<span class="helper-badge">Geburtsdatum offen</span> Erst wenn ein Geburtsdatum gesetzt ist, erscheinen die passenden Unterlagen.';
    return;
  }
  qsa('.create-doc-field.minor-only, .minor-only.create-doc-field').forEach(node=> node.style.display = minor ? '' : 'none');
  qsa('.create-doc-field.adult-only, .adult-only.create-doc-field').forEach(node=> node.style.display = minor ? 'none' : '');
  if(minor){
    ['createDocTreatmentContract','createUploadTreatmentContract'].forEach(resetCreateField);
  } else {
    ['createDocMinorConsent','createDocIdCopy','createUploadMinorConsent','createUploadIdCopy'].forEach(resetCreateField);
  }
  if(hint){
    hint.innerHTML = minor
      ? '<span class="helper-badge">Unter 18</span> Erforderlich: Einverständniserklärung + Ausweiskopie.'
      : '<span class="helper-badge">Ab 18</span> Erforderlich: Behandlungsvertrag.';
  }
}
el('createCustomerBirthdate')?.addEventListener('change', updateCreateCustomerDocumentUI);
el('createCustomerBirthdate')?.addEventListener('input', updateCreateCustomerDocumentUI);

el('customerCreateForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const birth = el('createCustomerBirthdate').value || null;
  const minor = birth && birth !== null ? isMinorFromBirthdate(birth) : null;
  const customerNote = el('createCustomerNote')?.value.trim() || '';
  const payload = {
    firstName: el('createCustomerFirstName').value.trim(),
    lastName: el('createCustomerLastName').value.trim(),
    name: mergeNameParts(el('createCustomerFirstName').value, el('createCustomerLastName').value),
    email: el('createCustomerEmail').value,
    password: el('createCustomerPassword').value,
    phone: el('createCustomerPhone').value,
    whatsapp: el('createCustomerWhatsapp')?.value || '',
    instagram: el('createCustomerInstagram').value || '',
    birthdate: birth,
    address: el('createCustomerAddress').value,
    documents: {
      treatmentContract: !minor && (!!el('createDocTreatmentContract')?.checked || !!el('createUploadTreatmentContract')?.files?.length),
      minorConsent: minor && (!!el('createDocMinorConsent')?.checked || !!el('createUploadMinorConsent')?.files?.length),
      idCopy: minor && (!!el('createDocIdCopy')?.checked || !!el('createUploadIdCopy')?.files?.length)
    }
  };

  // Use real API if not in demo mode
  if(!isDemoMode()){
    try{
      const res = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(!res.ok){
        console.error('API error response:', data);
        window.alert('Fehler beim Erstellen: ' + (data.error || 'Unbekannt'));
        return;
      }
      // Reload customers from API, keep admin
      const custRes = await fetch(`${API_URL}/customers`, {credentials: 'include'});
      if(custRes.ok){
        const apiCustomers = await custRes.json();
        // Keep admin, add new customers
        const adminUser = state.users.find(u => u.role === 'admin');
        state.users = [
          ...(adminUser ? [adminUser] : []),
          ...(apiCustomers || []).map(c => ({...c, role: 'customer', approvalStatus: 'approved'}))
        ];
      }
      // Close modal
      el('customerCreateModal')?.classList.remove('active');
      document.body.classList.remove('modal-open');
    }catch(err){
      console.error('API error:', err);
      window.alert('Fehler beim Erstellen in der Datenbank: ' + err.message);
      return;
    }
  }else{
    // Demo mode
    state.users.push({...payload, id:`cust-${Date.now()}`, role:'customer', approvalStatus:'approved', approvedAt:nowISO(), approvedBy:currentUser?.name || 'Admin'});
    saveState();
  }
  
  e.target.reset();
  updateCreateCustomerDocumentUI();
  renderAll();
});

function bindCustomerDirectory(){
  const modal = el('customerDirectoryModal');
el('openCustomerDirectory')?.addEventListener('click', ()=>{
    if(typeof window.openCustomerDirectoryV64 === 'function'){
      window.openCustomerDirectoryV64(event);
    }
  });

  // Customer Create Modal
  el('openCustomerCreateModal')?.addEventListener('click', ()=>{
    el('customerCreateModal')?.classList.add('active');
    document.body.classList.add('modal-open');
  });
  el('customerCreateClose')?.addEventListener('click', ()=>{
    el('customerCreateModal')?.classList.remove('active');
    document.body.classList.remove('modal-open');
  });
  el('customerCreateBackdrop')?.addEventListener('click', ()=>{
    el('customerCreateModal')?.classList.remove('active');
    document.body.classList.remove('modal-open');
  });
  el('customerDirectoryClose')?.addEventListener('click', ()=> modal?.classList.remove('active'));
  el('customerDirectoryBackdrop')?.addEventListener('click', ()=> modal?.classList.remove('active'));
}

function updateEditCustomerDocumentUI(){
  const birth = el('editCustomerBirthdate')?.value || '';
  const hint = el('editCustomerDocHint');
  const minor = birth ? isMinorFromBirthdate(birth) : null;
  const resetEditField = (id)=>{
    const node = el(id);
    if(!node) return;
    if(node.type === 'checkbox') node.checked = false;
    else node.value = '';
  };
  qsa('.edit-doc-field').forEach(node=> node.style.display = 'none');
  if(!birth){
    ['editDocTreatmentContract','editDocMinorConsent','editDocIdCopy','editUploadTreatmentContract','editUploadMinorConsent','editUploadIdCopy'].forEach(resetEditField);
    if(hint) hint.innerHTML = '<span class="helper-badge">Geburtsdatum offen</span> Erst dann erscheinen die passenden Unterlagen.';
    return;
  }
  qsa('.edit-doc-field.minor-only, .minor-only.edit-doc-field').forEach(node=> node.style.display = minor ? '' : 'none');
  qsa('.edit-doc-field.adult-only, .adult-only.edit-doc-field').forEach(node=> node.style.display = minor ? 'none' : '');
  if(minor){
    ['editDocTreatmentContract','editUploadTreatmentContract'].forEach(resetEditField);
  } else {
    ['editDocMinorConsent','editDocIdCopy','editUploadMinorConsent','editUploadIdCopy'].forEach(resetEditField);
  }
  if(hint){
    hint.innerHTML = minor
      ? '<span class="helper-badge">Unter 18</span> Erforderlich: Einverständniserklärung + Ausweiskopie.'
      : '<span class="helper-badge">Ab 18</span> Erforderlich: Behandlungsvertrag.';
  }
}
el('editCustomerBirthdate')?.addEventListener('input', updateEditCustomerDocumentUI);
window.deleteCustomer = async function(id){
  if(currentUser?.role !== 'admin') return false;
  const idx = state.users.findIndex(u=>u.id===id && u.role==='customer');
  if(idx < 0) return false;
  const customer = state.users[idx];
  const customerName = fullNameOf(customer);
  if(!window.confirm(`Möchtest du ${customerName} wirklich löschen? Alle zugehörigen Termine werden ebenfalls gelöscht. Du kannst die Kundin später im Verlauf wiederherstellen.`)){
    return false;
  }
  
  // Use real API if not in demo mode
  if(!isDemoMode()){
    try{
      await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE', credentials: 'include' });
      // Reload customers from API, keep admin user
      const custRes = await fetch(`${API_URL}/customers`, {credentials: 'include'});
      if(custRes.ok){
        const apiCustomers = await custRes.json();
        const adminUser = state.users.find(u => u.role === 'admin');
        state.users = [
          ...(adminUser ? [adminUser] : []),
          ...(apiCustomers || []).map(c => ({...c, role: 'customer', approvalStatus: 'approved'}))
        ];
      }
    }catch(err){
      console.error('API error:', err);
      window.alert('Fehler beim Löschen in der Datenbank.');
      return;
    }
  }else{
    // Demo mode
    state.users[idx] = {...state.users[idx], deletedAt: nowISO(), deletedBy: currentUser.name, lastEdited: nowISO()};
    state.appointments = state.appointments.filter(a => a.customerId !== id);
    saveState();
  }
  
  el('customerEditModal')?.classList.remove('active');
  if(typeof closeOverviewModalV54 === 'function') closeOverviewModalV54();
  renderAll();
  if(typeof window.finalRenderHistoryLogList === 'function') window.finalRenderHistoryLogList();
  if(typeof renderNotifications === 'function') renderNotifications();
  openTab('customers');
  return false;
}
window.requestDeleteCustomer = function(id){
  if(currentUser?.role !== 'admin') return false;
  const customer = state.users.find(u=>u.id===id && u.role==='customer');
  if(!customer) return false;
  if(typeof window.openOverviewLayerV64 === 'function'){
    el('customerEditModal')?.classList.remove('active');
    document.body.classList.add('modal-open');
    window.openOverviewLayerV64(
      'Kundin löschen',
      'Du kannst diese Kundin später im Verlauf wiederherstellen.',
      `
        <div class="delete-customer-sheet">
          <div class="delete-customer-icon-wrap">
            <span class="delete-customer-icon">
              <svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3.75A1.75 1.75 0 0 1 10.75 2h2.5A1.75 1.75 0 0 1 15 3.75V4h3a1 1 0 1 1 0 2h-.54l-.77 11.16A2 2 0 0 1 14.7 19H9.3a2 2 0 0 1-1.99-1.84L6.54 6H6a1 1 0 1 1 0-2h3v-.25ZM11 4h2v-.25a.25.25 0 0 0-.25-.25h-1.5a.25.25 0 0 0-.25.25V4Zm-1 4.25a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0V9A.75.75 0 0 1 10 8.25Zm4 .75a.75.75 0 0 0-1.5 0v6a.75.75 0 0 0 1.5 0V9Z"/></svg>
            </span>
          </div>
          <div class="delete-customer-copy">
            <strong>${fullNameOf(customer)} wirklich löschen?</strong>
            <span class="subtle">Das Konto verschwindet aus der aktiven Kundenliste und kann später im Verlauf wiederhergestellt werden.</span>
          </div>
          <div class="delete-customer-actions">
            <button type="button" class="button secondary small-btn" onclick="return closeOverviewModalV54();">Abbrechen</button>
            <button type="button" class="button danger small-btn" onclick="return window.deleteCustomer('${customer.id}');">Kundin löschen</button>
          </div>
        </div>
      `,
      { resetHistory:true }
    );
    return false;
  }
  return window.deleteCustomer(customer.id);
}
window.editCustomer = function(id){
  if(currentUser.role !== 'admin'){
    openTab('profile');
    return;
  }
  const customer = state.users.find(u=>u.id===id && u.role==='customer');
  if(!customer) return;
  el('editCustomerId').value = customer.id;
  ensureUserNameParts(customer);
  el('editCustomerFirstName').value = customer.firstName || '';
  el('editCustomerLastName').value = customer.lastName || '';
  el('editCustomerEmail').value = customer.email || '';
  el('editCustomerPassword').value = '';
  el('editCustomerPhone').value = customer.phone || '';
  el('editCustomerWhatsapp').value = customer.whatsapp || '';
  el('editCustomerInstagram').value = customer.instagram || '';
  el('editCustomerBirthdate').value = customer.birthdate || '';
  el('editCustomerAddress').value = customer.address || '';
  const deleteBtn = el('deleteCustomerBtn');
  if(deleteBtn){
    deleteBtn.className = 'button danger-soft-btn customer-delete-btn';
    deleteBtn.setAttribute('aria-label', 'Kundin löschen');
    deleteBtn.setAttribute('title', 'Kundin löschen');
    deleteBtn.innerHTML = '<svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3.75A1.75 1.75 0 0 1 10.75 2h2.5A1.75 1.75 0 0 1 15 3.75V4h3a1 1 0 1 1 0 2h-.54l-.77 11.16A2 2 0 0 1 14.7 19H9.3a2 2 0 0 1-1.99-1.84L6.54 6H6a1 1 0 1 1 0-2h3v-.25ZM11 4h2v-.25a.25.25 0 0 0-.25-.25h-1.5a.25.25 0 0 0-.25.25V4Zm-1 4.25a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0V9A.75.75 0 0 1 10 8.25Zm4 .75a.75.75 0 0 0-1.5 0v6a.75.75 0 0 0 1.5 0V9Z"/></svg>';
  }
  const docs = customer.documents || {};
  el('editDocTreatmentContract').checked = !!docs.treatmentContract;
  el('editDocMinorConsent').checked = !!docs.minorConsent;
  el('editDocIdCopy').checked = !!docs.idCopy;
  updateEditCustomerDocumentUI();
  el('customerEditModal').classList.add('active');
}
el('editCustomerBirthdate')?.addEventListener('change', updateEditCustomerDocumentUI);
el('deleteCustomerBtn')?.addEventListener('click', ()=> window.requestDeleteCustomer(el('editCustomerId')?.value || ''));
el('customerEditClose')?.addEventListener('click', ()=> el('customerEditModal')?.classList.remove('active'));
el('customerEditBackdrop')?.addEventListener('click', ()=> el('customerEditModal')?.classList.remove('active'));
el('customerEditForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const idx = state.users.findIndex(u=>u.id===el('editCustomerId').value);
  if(idx < 0) return;
  const birth = el('editCustomerBirthdate').value;
  const minor = birth ? isMinorFromBirthdate(birth) : null;
  const updatedCustomer = {
    ...state.users[idx],
    firstName: el('editCustomerFirstName').value.trim(),
    lastName: el('editCustomerLastName').value.trim(),
    name: mergeNameParts(el('editCustomerFirstName').value, el('editCustomerLastName').value),
    email: el('editCustomerEmail').value,
    password: isDemoMode() ? (el('editCustomerPassword').value.trim() || state.users[idx].password || '') : (state.users[idx].password || ''),
    pendingPassword: el('editCustomerPassword').value.trim(),
    phone: el('editCustomerPhone').value,
    whatsapp: el('editCustomerWhatsapp')?.value || '',
    instagram: el('editCustomerInstagram')?.value || '',
    birthdate: birth,
    address: el('editCustomerAddress').value,
    documents: {
      treatmentContract: !minor && (!!el('editDocTreatmentContract')?.checked || !!el('editUploadTreatmentContract')?.files?.length),
      minorConsent: minor && (!!el('editDocMinorConsent')?.checked || !!el('editUploadMinorConsent')?.files?.length),
      idCopy: minor && (!!el('editDocIdCopy')?.checked || !!el('editUploadIdCopy')?.files?.length)
    },
    lastEdited: nowISO()
  };

  if(!isDemoMode()){
    try{
      const res = await fetch(`${API_URL}/customers/${updatedCustomer.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify(updatedCustomer)
      });
      const data = await res.json();
      if(!res.ok){
        console.error('API error response:', data);
        window.alert('Fehler beim Speichern: ' + (data.error || 'Unbekannt'));
        return;
      }
      // Reload only customers from API to avoid wiping currentUser
      const custRes = await fetch(`${API_URL}/customers`, {credentials: 'include'});
      if(custRes.ok){
        const apiCustomers = await custRes.json();
        const adminUser = state.users.find(u => u.role === 'admin');
        state.users = [
          ...(adminUser ? [adminUser] : []),
          ...(apiCustomers || []).map(c => ({...c, role: 'customer', approvalStatus: 'approved'}))
        ];
      }
    }catch(err){
      console.error('API error:', err);
      window.alert('Fehler beim Speichern in der Datenbank: ' + err.message);
      return;
    }
  }else{
    state.users[idx] = updatedCustomer;
    saveState();
  }

  el('customerEditModal').classList.remove('active');
  renderAll();
});


function renderSettings(){
  const box = el('timeSettingsList');
  const reminderBox = el('reminderSettingsBox');
  if(!box) return;
  ensureSettings();
  const days = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  box.innerHTML = days.map(day=>{
    const slot = state.settings.openingHours[day];
    const stats = getOpeningDayStats(day);
    const slotPreview = slot.enabled
      ? buildSlotsFromConfig(slot).slice(0, 4).map(entry=>entry.time)
      : [];
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
          ${slotPreview.length ? slotPreview.map(time=>`<span class="week-chip">${time}</span>`).join('') : '<span class="week-empty">Keine freien Zeitfenster hinterlegt</span>'}
        </div>
        <div class="list-meta">
          ${stats ? `<span>Nächster Tag: ${stats.dateLabel}</span><span>${stats.free} frei</span><span>${stats.blocked} blockiert</span><span>${stats.total} gesamt</span>` : '<span>Aktuell keine buchbaren Zeiten für diesen Tag</span>'}
        </div>
        <div class="time-setting-actions">
          <button type="button" class="button secondary small-btn" onclick="openOpeningHoursDay('${day}')">Zeiten bearbeiten</button>
        </div>
      </div>
    `;
  }).join('');

  const customerRows = customerUsers();
  const missingEmail = customerRows.filter(customer=>!customer.email).length;
  const missingWhatsapp = customerRows.filter(customer=>!(customer.whatsapp || customer.phone)).length;
  const missingInstagram = customerRows.filter(customer=>!customer.instagram).length;
  if(reminderBox){
    const reminderSettings = state.settings.reminders;
    const hint = (count, label)=> count ? `<span class="reminder-hint">${count} Kundin${count===1?'':'nen'} hat ${count===1?'':'haben'} ${label} noch nicht angegeben.</span>` : `<span class="reminder-hint is-ok">${label} bei allen verfügbar.</span>`;
    reminderBox.innerHTML = `
      <div class="reminder-settings-card">
        <label><span>Erinnerungstext</span><textarea id="reminderMessage" rows="5">${reminderSettings.message || ''}</textarea></label>
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
            <label class="checkbox-card reminder-channel-card"><input type="checkbox" id="reminderChannelEmail" ${reminderSettings.channels.email ? 'checked' : ''}><span>E-Mail</span></label>
            ${hint(missingEmail, 'E-Mail')}
            <label class="checkbox-card reminder-channel-card"><input type="checkbox" id="reminderChannelWhatsapp" ${reminderSettings.channels.whatsapp ? 'checked' : ''}><span>WhatsApp</span></label>
            ${hint(missingWhatsapp, 'WhatsApp / Telefonnummer')}
            <label class="checkbox-card reminder-channel-card"><input type="checkbox" id="reminderChannelInstagram" ${reminderSettings.channels.instagram ? 'checked' : ''}><span>Instagram</span></label>
            ${hint(missingInstagram, 'Instagram')}
            <span class="subtle small-note">Mehrere Kanäle können gleichzeitig aktiviert werden.</span>
          </div>
        </div>
      </div>
    `;
  }

  el('reminderMessage') && (el('reminderMessage').onchange = ()=>{
    state.settings.reminders.message = el('reminderMessage').value;
    saveState();
  });
  el('reminderLeadMinutes') && (el('reminderLeadMinutes').onchange = ()=>{
    state.settings.reminders.leadMinutes = Number(el('reminderLeadMinutes').value);
    saveState();
  });
  el('reminderChannelEmail') && (el('reminderChannelEmail').onchange = ()=>{
    state.settings.reminders.channels.email = !!el('reminderChannelEmail').checked;
    saveState();
    renderSettings();
  });
  el('reminderChannelWhatsapp') && (el('reminderChannelWhatsapp').onchange = ()=>{
    state.settings.reminders.channels.whatsapp = !!el('reminderChannelWhatsapp').checked;
    saveState();
    renderSettings();
  });
  el('reminderChannelInstagram') && (el('reminderChannelInstagram').onchange = ()=>{
    state.settings.reminders.channels.instagram = !!el('reminderChannelInstagram').checked;
    saveState();
    renderSettings();
  });
}
function bindOpeningHoursEditor(){
  const modal = el('openingHoursModal');
  const closeBtn = el('openingHoursClose');
  const backdrop = el('openingHoursBackdrop');
  const enabled = el('openingHoursEnabled');
  const form = el('openingHoursForm');
  const updatePreview = ()=>{
    const day = el('openingHoursDay')?.value;
    if(!day) return;
    previewOpeningHours(day, {
      ...state.settings.openingHours[day],
      enabled: !!enabled?.checked,
      start: el('openingHoursStart')?.value || '09:00',
      end: el('openingHoursEnd')?.value || '18:00',
      slotMinutes: Number(el('openingHoursSlotMinutes')?.value || 30),
      bufferMinutes: Number(el('openingHoursBufferMinutes')?.value || 0)
    });
  };
  if(closeBtn) closeBtn.onclick = ()=> modal?.classList.remove('active');
  if(backdrop) backdrop.onclick = ()=> modal?.classList.remove('active');
  if(enabled) enabled.onchange = updatePreview;
  el('openingHoursStart') && (el('openingHoursStart').onchange = updatePreview);
  el('openingHoursEnd') && (el('openingHoursEnd').onchange = updatePreview);
  el('openingHoursSlotMinutes') && (el('openingHoursSlotMinutes').onchange = updatePreview);
  el('openingHoursBufferMinutes') && (el('openingHoursBufferMinutes').onchange = updatePreview);
  if(form) form.onsubmit = (event)=>{
    event.preventDefault();
    const day = el('openingHoursDay').value;
    const start = el('openingHoursStart').value;
    const end = el('openingHoursEnd').value;
    if(el('openingHoursEnabled').checked && timeToMinutes(end) <= timeToMinutes(start)){
      window.alert('Die Endzeit muss nach der Startzeit liegen.');
      return;
    }
    state.settings.openingHours[day] = {
      ...state.settings.openingHours[day],
      enabled: !!el('openingHoursEnabled').checked,
      start,
      end,
      slotMinutes: Number(el('openingHoursSlotMinutes').value || 30),
      bufferMinutes: Number(el('openingHoursBufferMinutes')?.value || 0)
    };
    saveState();
    modal?.classList.remove('active');
    renderAll();
  };
}
function bindRulesHelp(){
  const modal = el('rulesHelpModal');
  const openBtn = el('openRulesHelp');
  const closeBtn = el('rulesHelpClose');
  const backdrop = el('rulesHelpBackdrop');
  if(openBtn){
    openBtn.type = 'button';
    openBtn.onclick = (event)=>{
      event.preventDefault();
      event.stopPropagation();
      modal?.classList.add('active');
      return false;
    };
  }
  if(closeBtn) closeBtn.onclick = ()=> modal?.classList.remove('active');
  if(backdrop) backdrop.onclick = ()=> modal?.classList.remove('active');
}
function bindHistoryLog(){
  function buildHistoryItems(){
    const customerHistory = customerUsers().map(c=>({
      type:'Dokument / Konto',
      title:c.name,
      subtitle:(c.documents ? Object.entries(c.documents).filter(([,v])=>v).map(([k])=>k).join(' · ') : 'Keine Unterlagen'),
      by:'System/Konto',
      at:c.lastEdited || c.createdAt
    }));
    const appointmentHistory = state.appointments.map(a=>({
      type:'Termin',
      title:`${a.service} · ${displayName(a.customerId)}`,
      subtitle:`Bearbeitet von ${a.updatedBy}`,
      by:a.updatedBy,
      at:a.updatedAt
    }));
    const customTaskHistory = (state.customTasks || []).map(task=>({
      type:task.status === 'done' ? 'Aufgabe erledigt' : 'Aufgabe erstellt',
      title:task.title,
      subtitle:task.status === 'done'
        ? `Erledigt von ${task.completedByName || 'System'}`
        : `Erstellt von ${task.createdByName || 'System'}`,
      by:task.status === 'done'
        ? (task.completedByName || 'System')
        : (task.createdByName || 'System'),
      at:task.status === 'done'
        ? (task.completedAt || task.createdAt)
        : task.createdAt
    }));
    return [...customerHistory, ...appointmentHistory, ...customTaskHistory].sort((a,b)=>`${b.at}`.localeCompare(`${a.at}`));
  }
  function renderHistory(){
    const q = (el('historySearch')?.value || '').trim().toLowerCase();
    const from = el('historyDateFrom')?.value || '';
    const to = el('historyDateTo')?.value || '';
    const items = buildHistoryItems().filter(item=>{
      const hay = `${item.type} ${item.title} ${item.subtitle} ${item.by}`.toLowerCase();
      if(q && !hay.includes(q)) return false;
      const itemDate = item.at ? String(item.at).slice(0,10) : '';
      if(from && itemDate < from) return false;
      if(to && itemDate > to) return false;
      return true;
    });
    el('historyLogList').innerHTML = items.length ? items.map(item=>`
      <div class="list-item">
        <strong>${item.type} · ${item.title}</strong>
        <div class="subtle">${item.subtitle}</div>
        <div class="list-meta"><span>${item.by}</span><span>${formatGermanDate(item.at)}</span></div>
      </div>`).join('') : '<div class="empty-note">Für diese Filter gibt es keine Einträge.</div>';
  }
  const modal = el('historyLogModal');
  const openBtn = el('openHistoryLog');
  const closeBtn = el('historyLogClose');
  const backdrop = el('historyLogBackdrop');
  const search = el('historySearch');
  const fromInput = el('historyDateFrom');
  const toInput = el('historyDateTo');
  window.openHistoryLogV64 = function(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
    }
    modal?.classList.add('active');
    renderHistory();
    return false;
  };
  if(openBtn) openBtn.onclick = window.openHistoryLogV64;
  if(closeBtn) closeBtn.onclick = ()=> modal?.classList.remove('active');
  if(backdrop) backdrop.onclick = ()=> modal?.classList.remove('active');
  if(search) search.oninput = renderHistory;
  if(fromInput) fromInput.onchange = renderHistory;
  if(toInput) toInput.onchange = renderHistory;
}

function renderOnlinePanel(){
  const onlineBox = el('onlineUsersOnline');
  const offlineBox = el('onlineUsersOffline');
  if(!onlineBox || !offlineBox || !currentUser) return;
  refreshOnlineStates();
  const visible = currentUser.role==='admin' ? state.users : state.users.filter(u=>u.id===currentUser.id);
  const onlineUsers = visible.filter(u=>u.online);
  const offlineUsers = visible.filter(u=>!u.online);
  const tpl = (u)=>`<div class="online-user-item"><span class="dot ${u.online?'on':'off'}"></span><div class="online-user-copy"><strong>${u.name}</strong><div class="sub">${formatOnlineStatus(u)}</div></div></div>`;
  onlineBox.innerHTML = onlineUsers.length ? onlineUsers.map(tpl).join('') : '<div class="empty-note">Gerade ist niemand online.</div>';
  offlineBox.innerHTML = offlineUsers.length ? offlineUsers.map(tpl).join('') : '<div class="empty-note">Keine Offline-Einträge vorhanden.</div>';
  onlineBox.classList.toggle('hidden', onlineTab !== 'online');
  offlineBox.classList.toggle('hidden', onlineTab !== 'offline');
  qsa('.online-tabs .tab-btn').forEach(btn=>{
    btn.onclick = ()=> {
      qsa('.online-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      onlineTab = btn.dataset.tab || 'online';
      renderOnlinePanel();
    };
  });
}

function bindOverviewModal(){
  const closeBtn = el('overviewDetailClose');
  const backdrop = el('overviewDetailBackdrop');
  if(closeBtn) closeBtn.onclick = closeOverviewModalV54;
  if(backdrop) backdrop.onclick = closeOverviewModalV54;
}

function renderAll(){
  if(!currentUser) return;
  if(typeof renderMetrics === 'function') renderMetrics();
  renderOverview();
  renderCalendar();
  renderCalendarList();
  renderTasks();
  if(typeof window.renderAppointments === 'function') window.renderAppointments();
  if(typeof window.renderAppointmentsHub === 'function') window.renderAppointmentsHub();
  renderCustomers();
  renderSettings();
  updateHeaderProfile();
  fillProfile();
  fillCustomerSelector();
  fillServiceSelector();
  syncAppointmentTimeOptions(el('appointmentTime')?.value || '');
  renderOnlinePanel();
  bindOverviewModal();
  bindRulesHelp();
  if(!window.__liaFinalizeActive){
    bindOpeningHoursEditor();
    bindHistoryLog();
    bindCustomerDirectoryV63();
  }
  bindOverviewCardsV59();
  bindOverviewButtonsV63();
  updateCreateCustomerDocumentUI();
  updateEditCustomerDocumentUI();
  renderOverviewReminder();
  bindThemeAndOnlineV61();
  checkCustomerNotifications();
}

function checkCustomerNotifications(){
  if(!currentUser || currentUser.role !== 'customer') return;
  if(!state || !state.appointments) return;
  const notifications = getCustomerUnreadNotifications(currentUser.id);
  if(!notifications.length) return;
  const confirmedAppt = notifications.find(n => n.type === 'appointment-confirmed');
  if(confirmedAppt && confirmedAppt.appointmentId){
    const appt = state.appointments.find(a => a.id === confirmedAppt.appointmentId);
    if(appt){
      setTimeout(() => showCustomerConfirmationToast(appt), 800);
    }
  }
  markCustomerNotificationsRead(currentUser.id);
}

boot();

function bindOverviewButtonsV61(){
  const todayBtn = el('openTodayDetailBtn');
  const weekBtn = el('openWeekDetailBtn');
  if(todayBtn){
    todayBtn.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); openTodayOverviewV58(); };
  }
  if(weekBtn){
    weekBtn.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); openWeekOverviewV58(); };
  }
}

function bindThemeAndOnlineV61(){
  const themeBtn = el('themeToggle');
  const onlineToggle = el('onlineToggle');
  const onlinePanel = el('onlinePanel');

  if(themeBtn){
    const applyTheme = (mode)=>{
      document.documentElement.classList.toggle('theme-dark', mode === 'dark');
      localStorage.setItem('lia-theme', mode);
      themeBtn.innerHTML = mode === 'dark'
        ? '<span class="theme-sun" aria-hidden="true">☀</span>'
        : '<span class="theme-moon" aria-hidden="true">◐</span>';
    };
    applyTheme(localStorage.getItem('lia-theme') || 'light');
    themeBtn.onclick = (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const next = document.documentElement.classList.contains('theme-dark') ? 'light' : 'dark';
      applyTheme(next);
    };
  }

    if(onlineToggle && onlinePanel){
      const adminVisible = !!currentUser && currentUser.role === 'admin';
      onlineToggle.classList.toggle('hidden', !adminVisible);
      if(!adminVisible){
        onlinePanel.classList.remove('active');
        return;
      }
      onlineToggle.onclick = (e)=>{
      e.preventDefault();
      e.stopPropagation();
      onlinePanel.classList.remove('hidden');
      onlinePanel.classList.toggle('active');
      renderOnlinePanel();
    };
    document.addEventListener('click', (e)=>{
      if(onlinePanel.classList.contains('active') && !onlinePanel.contains(e.target) && !onlineToggle.contains(e.target)){
        onlinePanel.classList.remove('active');
      }
    });
  }
}



/* --- V63 explicit openers fix --- */
function buildTodayOverviewHtmlV63(){
  const base = new Date();
  const today = `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`;
  const items = sortedAppointments(visibleAppointments()).filter(a=>a.date===today);
  return items.length ? items.map(a=>`
    <button type="button" class="list-item" onclick="openAppointmentFromDay('${a.id}'); closeOverviewModalV54();">
      <strong>${a.time} · ${a.service}</strong>
      <div>${displayName(a.customerId)}</div>
      <div class="list-meta"><span class="pill ${statusClass(a.status)}">${statusLabel(a.status)}</span><span>${formatGermanDate(a.updatedAt)}</span></div>
    </button>
  `).join('') : '<div class="empty-note">Heute sind aktuell keine Termine eingetragen.</div>';
}
function buildWeekOverviewHtmlV63(){
  const base = new Date();
  const visible = sortedAppointments(visibleAppointments());
  const monday = new Date(base);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  const days = [];
  for(let i=0;i<7;i++){
    const d = new Date(monday);
    d.setDate(monday.getDate()+i);
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    days.push({date:d, items: visible.filter(a=>a.date===key)});
  }
  return days.map(dayObj=>`
    <div class="list-item">
      <strong>${dayObj.date.toLocaleDateString('de-DE',{weekday:'long', day:'2-digit', month:'2-digit'})}</strong>
      <div class="week-modal-list">
        ${dayObj.items.length ? dayObj.items.map(a=>`<button type="button" class="week-chip" onclick="openAppointmentFromDay('${a.id}'); closeOverviewModalV54();">${a.time} · ${displayName(a.customerId)}</button>`).join('') : '<span class="week-empty">Keine Termine</span>'}
      </div>
    </div>
  `).join('') + `<div class="calendar-link-row"><button type="button" class="button secondary small-btn" onclick="closeOverviewModalV54(); openTab('calendar');">Zum Kalender</button></div>`;
}

window.openTodayOverviewV58 = function(){
  document.body.classList.add('modal-open');
  openOverviewModalV54('Tagesübersicht', 'Alle Termine für heute im Detail', buildTodayOverviewHtmlV63());
};
window.openWeekOverviewV58 = function(){
  document.body.classList.add('modal-open');
  openOverviewModalV54('Wochenansicht', 'Alle Termine dieser Woche im Detail', buildWeekOverviewHtmlV63());
};

function bindOverviewButtonsV63(){
  const todayBtn = el('openTodayDetailBtn');
  const weekBtn = el('openWeekDetailBtn');
  if(todayBtn){
    todayBtn.type = 'button';
    todayBtn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); openTodayOverviewV58(); return false; };
  }
  if(weekBtn){
    weekBtn.type = 'button';
    weekBtn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); openWeekOverviewV58(); return false; };
  }
}

function bindCustomerDirectoryV63(){
  const modal = el('customerDirectoryModal');
  const openBtn = el('openCustomerDirectory');
  const closeBtn = el('customerDirectoryClose');
  const backdrop = el('customerDirectoryBackdrop');
  const list = el('customerDirectoryList');
  if(openBtn && modal && list){
    openBtn.onclick = function(e){
      e.preventDefault();
      const rows = [...customerUsers()].sort((a,b)=>a.name.localeCompare(b.name, 'de'));
      list.innerHTML = rows.length ? rows.map(c=>`
        <button type="button" class="list-item" onclick="editCustomer('${c.id}'); document.getElementById('customerDirectoryModal').classList.remove('active');">
          <strong>${c.name}</strong>
          <div class="list-meta"><span>${c.email}</span><span>${c.phone || 'Keine Telefonnummer'}</span></div>
        </button>`).join('') : '<div class="empty-note">Noch keine Kundinnen vorhanden.</div>';
      modal.classList.add('active');
      return false;
    };
  }
  if(closeBtn) closeBtn.onclick = ()=> modal && modal.classList.remove('active');
  if(backdrop) backdrop.onclick = ()=> modal && modal.classList.remove('active');
}

function applyCleanHeaderIcons(){
  const notificationBtn = el('notificationTrigger');
  const notificationBadge = el('notificationBadge');
  const logoutBtn = el('logoutBtn');
  const themeBtn = el('themeToggle');
  if(notificationBtn && notificationBadge){
    notificationBtn.setAttribute('aria-label', 'Mitteilungen öffnen');
    notificationBtn.title = 'Mitteilungen öffnen';
    notificationBtn.innerHTML = `<svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a4 4 0 0 0-4 4v1.2c0 .8-.24 1.58-.7 2.22L5.6 13.2A1 1 0 0 0 6.4 14.8h11.2a1 1 0 0 0 .8-1.6l-1.7-2.78A3.8 3.8 0 0 1 16 8.2V7a4 4 0 0 0-4-4Zm0 18a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 21Z"/></svg>`;
    notificationBtn.appendChild(notificationBadge);
  }
  if(logoutBtn){
    logoutBtn.setAttribute('aria-label', 'Abmelden');
    logoutBtn.title = 'Abmelden';
    logoutBtn.innerHTML = `<svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4.75A1.25 1.25 0 0 1 11.25 3.5h5.5A2.25 2.25 0 0 1 19 5.75v12.5a2.25 2.25 0 0 1-2.25 2.25h-5.5A1.25 1.25 0 0 1 10 19.25a1 1 0 1 1 2 0a.25.25 0 0 0 .25.25h4.5a.25.25 0 0 0 .25-.25V5.75a.25.25 0 0 0-.25-.25h-4.5a.25.25 0 0 0-.25.25a1 1 0 1 1-2 0Zm-4.3 6.55 2.6-2.6a1 1 0 1 1 1.4 1.4L8.8 11H14a1 1 0 1 1 0 2H8.8l.9.9a1 1 0 0 1-1.4 1.4l-2.6-2.6a1 1 0 0 1 0-1.4Z"/></svg>`;
  }
  if(themeBtn){
    themeBtn.setAttribute('aria-label', 'Darkmode umschalten');
    themeBtn.title = 'Darkmode umschalten';
    themeBtn.innerHTML = `<svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 3.2a1 1 0 0 1 .62 1.56A7.5 7.5 0 1 0 19.24 15.1a1 1 0 0 1 1.56.62A9.5 9.5 0 1 1 14.5 3.2Z"/></svg>`;
  }
}

/* --- V64F absolute last stable bindings --- */
window.openTodayOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  document.body.classList.add('modal-open');
  openOverviewModalV54('Tagesübersicht', 'Alle Termine für heute im Detail', buildTodayOverviewHtmlV63());
  return false;
};

window.openWeekOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  document.body.classList.add('modal-open');
  openOverviewModalV54('Wochenansicht', 'Alle Termine dieser Woche im Detail', buildWeekOverviewHtmlV63());
  return false;
};

window.openTodayOverviewV58 = window.openTodayOverviewV64;
window.openWeekOverviewV58 = window.openWeekOverviewV64;

bindOverviewCardsV59 = function(){
  const todayCard = el('todayOverviewCard');
  const weekCard = el('weekOverviewCard');
  const todayRow = todayCard?.querySelector('.calendar-link-row');
  const weekRow = weekCard?.querySelector('.calendar-link-row');
  let todayBtn = el('openTodayOverviewBtn');
  let weekBtn = el('openWeekOverviewBtn');
  let calendarBtn = el('jumpToCalendarFromWeek');

  [todayCard, weekCard].forEach(card=>{
    if(!card) return;
    card.onclick = null;
    card.onkeydown = null;
    card.removeAttribute('onclick');
    card.removeAttribute('tabindex');
    card.removeAttribute('role');
  });

  if(todayBtn && todayRow && todayBtn.parentElement !== todayRow) todayRow.appendChild(todayBtn);
  if(weekBtn && weekRow && weekBtn.parentElement !== weekRow) weekRow.prepend(weekBtn);

  if(todayBtn){
    todayBtn.type = 'button';
    todayBtn.onclick = window.openTodayOverviewV64;
  }
  if(weekBtn){
    weekBtn.type = 'button';
    weekBtn.onclick = window.openWeekOverviewV64;
  }
  if(calendarBtn){
    calendarBtn.type = 'button';
    calendarBtn.innerHTML = '<span aria-hidden="true"></span>';
    calendarBtn.onclick = (event)=>{
      event.preventDefault();
      event.stopPropagation();
      openTab('calendar');
      return false;
    };
  }
};

window.addEventListener('load', ()=>{
  if(window.__liaFinalizeActive) return;
  bindOverviewCardsV59();
});

renderOverview = function(){
  const base = new Date();
  const today = `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`;
  const visible = sortedAppointments(visibleAppointments());
  const todaysAppointments = visible.filter(a=>a.date===today);
  const upcomingAppointments = getUpcomingAppointments(6);
  const nextAppointment = todaysAppointments[0] || upcomingAppointments[0];

  const freeBox = el('overviewFreeSlots');
  if(freeBox){
    const dayKey = weekdayShort(base);
    const freeSlots = getNextAvailableSlots(today, 6);
    const nextDays = getNextAvailableDays(4);
    freeBox.innerHTML = freeSlots.length
      ? freeSlots.map(time=>`<span class="week-chip">${dayKey} · ${time}</span>`).join('')
      : nextDays.length
        ? nextDays.map(entry=>`<span class="week-chip">${entry.date.toLocaleDateString('de-DE',{weekday:'short', day:'2-digit', month:'2-digit'})} · ${entry.slots[0]}</span>`).join('')
        : '<span class="week-empty">Aktuell sind keine freien Zeiten hinterlegt</span>';
  }

  const summary = el('overviewTodaySummary');
  if(summary){
    summary.innerHTML = `
      <div class="today-highlight-main">
        <span class="helper-badge">${todaysAppointments.length ? 'Nächster Termin' : 'Nächster geplanter Termin'}</span>
        <strong>${nextAppointment ? `${formatDateOnly(nextAppointment.date)} · ${nextAppointment.time}` : 'Heute noch frei'}</strong>
        <span>${nextAppointment ? `${nextAppointment.service} · ${displayName(nextAppointment.customerId)}` : 'Aktuell ist kein Termin eingetragen.'}</span>
      </div>
      <div class="overview-mini-stats">
        <div class="mini-stat"><strong>${todaysAppointments.length}</strong><span>Heute</span></div>
        <div class="mini-stat"><strong>${todaysAppointments.filter(a=>a.status==='open').length}</strong><span>Offen</span></div>
        <div class="mini-stat"><strong>${todaysAppointments.filter(a=>a.status==='confirmed').length}</strong><span>Bestätigt</span></div>
      </div>
    `;
  }

  const timeline = el('overviewTodayTimeline');
  if(timeline){
    timeline.innerHTML = todaysAppointments.length ? todaysAppointments.map(a=>`
      <button type="button" class="timeline-slot" onclick="openAppointmentFromDay('${a.id}')">
        <div class="slot-time">${a.time} · ${a.service}</div>
        <div class="slot-meta">${displayName(a.customerId)} · <span class="pill ${statusClass(a.status)}">${statusLabel(a.status)}</span></div>
        <div class="subtle">Zuletzt bearbeitet von ${a.updatedBy} am ${formatGermanDate(a.updatedAt)}</div>
      </button>
    `).join('') : upcomingAppointments.length ? upcomingAppointments.slice(0,3).map(a=>`
      <button type="button" class="timeline-slot empty" onclick="openAppointmentFromDay('${a.id}')">
        <div class="slot-time">${formatDateOnly(a.date)} · ${a.time}</div>
        <div class="slot-meta">${a.service} · ${displayName(a.customerId)}</div>
        <div class="subtle">Als Nächstes geplant</div>
      </button>
    `).join('') : `<div class="timeline-slot empty"><div class="slot-time">Noch kein Termin für heute</div><div class="slot-meta">Sobald Termine eingetragen werden, erscheinen sie hier.</div></div>`;
  }

  const monday = new Date(base);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  const days = [];
  for(let i=0;i<7;i++){
    const d = new Date(monday);
    d.setDate(monday.getDate()+i);
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    days.push({date:d, key, items: visible.filter(a=>a.date===key)});
  }
  const weekBox = el('overviewWeekList');
  if(weekBox){
    weekBox.innerHTML = days.map(dayObj=>{
      const openSlots = getNextAvailableSlots(dayObj.key, 2);
      return `
        <div class="week-row">
          <div class="week-day-meta">
            <strong>${dayObj.date.toLocaleDateString('de-DE',{weekday:'long'})}</strong>
            <span>${dayObj.date.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})}</span>
          </div>
          <div class="week-day-content">
            ${dayObj.items.length ? dayObj.items.map(a=>`<button type="button" class="week-chip" onclick="openAppointmentFromDay('${a.id}')">${a.time} · ${displayName(a.customerId)}</button>`).join('') : openSlots.length ? openSlots.map(time=>`<span class="week-empty">Frei: ${time}</span>`).join('') : '<span class="week-empty">Keine Termine</span>'}
          </div>
        </div>
      `;
    }).join('');
  }

  const jumpWeekBtn = el('jumpToCalendarFromWeek');
  if(jumpWeekBtn) jumpWeekBtn.onclick = ()=> openTab('calendar');
  renderOverviewReminder();
};

window.openNotificationsCenterV64 = function(event){
  if(event){
    event.preventDefault();
    event.stopPropagation();
  }
  const notifications = currentUser ? buildNotifications() : [];
  document.getElementById('headerNotificationMenu')?.classList.remove('open');
  const content = notifications.length ? notifications.map(item=>`
    <button type="button" class="list-item notification-center-item" onclick="window.__notificationAction('${item.key}')">
      <div class="notification-item-head">
        <span class="notification-pill ${item.type === 'request' ? 'is-request' : item.type === 'issue' ? 'is-issue' : 'is-task'}">${item.type === 'request' ? 'Anfrage' : item.type === 'issue' ? 'Hinweis' : 'Aufgabe'}</span>
        <span class="subtle">${item.ageLabel || ''}</span>
      </div>
      <div class="notification-item-body">
        <strong>${item.title}</strong>
        <div class="notification-item-copy">${item.text}</div>
      </div>
      <div class="notification-meta-row"><span class="subtle">${item.meta}</span><span class="notification-jump">Direkt öffnen</span></div>
    </button>
  `).join('') : '<div class="empty-note">Gerade gibt es keine offenen Mitteilungen.</div>';
  window.__notificationMap = Object.fromEntries(notifications.map(item=>[item.key, item.action]));
  window.__notificationAction = function(key){
    const action = window.__notificationMap?.[key];
    if(typeof closeOverviewModalV54 === 'function') closeOverviewModalV54();
    window.setTimeout(()=>{
      if(typeof action === 'function') action();
    }, 110);
  };
  document.body.classList.add('modal-open');
  openOverviewModalV54('Mitteilungen', notifications.length ? `${notifications.length} offene Hinweise` : 'Keine offenen Hinweise', content);
  return false;
};

window.openTodayOverviewV64 = function(event){
  if(event){
    event.preventDefault();
    event.stopPropagation();
  }
  document.body.classList.add('modal-open');
  openOverviewModalV54('Tagesübersicht', 'Alle Termine für heute im Detail', buildTodayOverviewHtmlV63());
  return false;
};

window.openTodayOverviewV58 = window.openTodayOverviewV64;

bindOverviewCardsV59 = function(){
  const todayCard = el('todayOverviewCard');
  const weekCard = el('weekOverviewCard');
  const spotlightClose = el('overviewSpotlightClose');
  const spotlightCalendar = el('overviewSpotlightCalendar');
  const ensureRow = (card)=>{
    if(!card) return null;
    let row = card.querySelector('.calendar-link-row');
    if(!row){
      row = document.createElement('div');
      row.className = 'calendar-link-row';
      card.appendChild(row);
    }
    return row;
  };
  const todayRow = ensureRow(todayCard);
  const weekRow = ensureRow(weekCard);

  [todayCard, weekCard].forEach(card=>{
    if(!card) return;
    card.onclick = null;
    card.onkeydown = null;
    card.removeAttribute('onclick');
    card.removeAttribute('tabindex');
    card.removeAttribute('role');
  });

  let todayBtn = el('openTodayOverviewBtn');
  if(!todayBtn){
    todayBtn = document.createElement('button');
    todayBtn.type = 'button';
    todayBtn.id = 'openTodayOverviewBtn';
  }
  todayBtn.className = 'button secondary small-btn';
  todayBtn.textContent = 'Tagesuebersicht oeffnen';
  if(todayRow && todayBtn.parentElement !== todayRow) todayRow.appendChild(todayBtn);
  todayBtn.onclick = window.openTodayOverviewV64;

  let weekBtn = el('openWeekOverviewBtn');
  if(!weekBtn){
    weekBtn = document.createElement('button');
    weekBtn.type = 'button';
    weekBtn.id = 'openWeekOverviewBtn';
  }
  weekBtn.className = 'button secondary small-btn';
  weekBtn.textContent = 'Wochenansicht oeffnen';
  if(weekRow && weekBtn.parentElement !== weekRow) weekRow.prepend(weekBtn);
  weekBtn.onclick = window.openWeekOverviewV64;

  let calendarBtn = el('jumpToCalendarFromWeek');
  if(!calendarBtn){
    calendarBtn = document.createElement('button');
    calendarBtn.type = 'button';
    calendarBtn.id = 'jumpToCalendarFromWeek';
  }
  calendarBtn.className = 'theme-icon-btn overview-calendar-icon';
  calendarBtn.setAttribute('aria-label', 'Kalender oeffnen');
  calendarBtn.title = 'Kalender oeffnen';
  calendarBtn.innerHTML = '<span aria-hidden="true"></span>';
  if(weekRow && calendarBtn.parentElement !== weekRow) weekRow.appendChild(calendarBtn);
  calendarBtn.onclick = (event)=>{
    event.preventDefault();
    event.stopPropagation();
    openTab('calendar');
    return false;
  };

  if(spotlightClose) spotlightClose.onclick = closeOverviewSpotlightV65;
  if(spotlightCalendar) spotlightCalendar.onclick = ()=> openTab('calendar');
  return false;
};

window.addEventListener('load', ()=>{
  if(window.__liaFinalizeActive) return;
  const notificationTrigger = el('notificationTrigger');
  if(notificationTrigger){
    notificationTrigger.onclick = window.openNotificationsCenterV64;
    const icon = notificationTrigger.querySelector('span[aria-hidden="true"]');
    applyCleanHeaderIcons();
  }
  if(currentUser){
    bindOverviewCardsV59();
  }
});

window.addEventListener('load', ()=>{
  if(window.__liaFinalizeActive) return;
  try{
    bindLogoutConfirm();
    bindRulesHelp();
    bindHistoryLog();
    bindOpeningHoursEditor();
    bindCustomerDirectoryV63();

    const notificationTrigger = el('notificationTrigger');
    if(notificationTrigger){
      notificationTrigger.onclick = (event)=>{
        event.preventDefault();
        event.stopPropagation();
        el('headerNotificationMenu')?.classList.toggle('open');
        el('headerProfileMenu')?.classList.remove('open');
        return false;
      };
      const icon = notificationTrigger.querySelector('span[aria-hidden="true"]');
      applyCleanHeaderIcons();
    }

    if(currentUser){
      bindOverviewCardsV59();
      renderNotifications();
    }
  }catch(error){
    console.error('Late dashboard rebind failed', error);
  }
});

/* --- V64E absolute final overview override --- */
window.openWeekOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return openOverviewSpotlightV65({
    kicker:'Woche im Blick',
    title:'Wochenansicht',
    subline:'Alle Termine dieser Woche mit direktem Sprung in einzelne Tage.',
    html:buildWeekSpotlightHtmlV65(),
    selectedCardId:'weekOverviewCard'
  });
};

window.openTodayOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return openOverviewSpotlightV65({
    kicker:'Heute im Fokus',
    title:'Tagesuebersicht',
    subline:'Dein heutiger Ablauf in einer ruhigen Detailansicht.',
    html:buildTodaySpotlightHtmlV65(),
    selectedCardId:'todayOverviewCard'
  });
};

window.openTodayOverviewV58 = window.openTodayOverviewV64;
window.openWeekOverviewV58 = window.openWeekOverviewV64;

bindOverviewCardsV59 = function(){
  const todayCard = el('todayOverviewCard');
  const weekCard = el('weekOverviewCard');
  const spotlightClose = el('overviewSpotlightClose');
  const spotlightCalendar = el('overviewSpotlightCalendar');
  const ensureRow = (card)=>{
    if(!card) return null;
    let row = card.querySelector('.calendar-link-row');
    if(!row){
      row = document.createElement('div');
      row.className = 'calendar-link-row';
      card.appendChild(row);
    }
    return row;
  };

  const todayRow = ensureRow(todayCard);
  const weekRow = ensureRow(weekCard);

  [todayCard, weekCard].forEach(card=>{
    if(!card) return;
    card.onclick = null;
    card.onkeydown = null;
    card.removeAttribute('onclick');
    card.removeAttribute('tabindex');
    card.removeAttribute('role');
  });

  let todayBtn = el('openTodayOverviewBtn');
  if(!todayBtn){
    todayBtn = document.createElement('button');
    todayBtn.type = 'button';
    todayBtn.id = 'openTodayOverviewBtn';
  }
  todayBtn.className = 'button secondary small-btn';
  todayBtn.textContent = 'Tagesuebersicht oeffnen';
  if(todayRow && todayBtn.parentElement !== todayRow) todayRow.appendChild(todayBtn);
  todayBtn.onclick = window.openTodayOverviewV64;

  let weekBtn = el('openWeekOverviewBtn');
  if(!weekBtn){
    weekBtn = document.createElement('button');
    weekBtn.type = 'button';
    weekBtn.id = 'openWeekOverviewBtn';
  }
  weekBtn.className = 'button secondary small-btn';
  weekBtn.textContent = 'Wochenansicht oeffnen';
  if(weekRow && weekBtn.parentElement !== weekRow) weekRow.prepend(weekBtn);
  weekBtn.onclick = window.openWeekOverviewV64;

  let calendarBtn = el('jumpToCalendarFromWeek');
  if(!calendarBtn){
    calendarBtn = document.createElement('button');
    calendarBtn.type = 'button';
    calendarBtn.id = 'jumpToCalendarFromWeek';
  }
  calendarBtn.className = 'theme-icon-btn overview-calendar-icon';
  calendarBtn.setAttribute('aria-label', 'Kalender oeffnen');
  calendarBtn.title = 'Kalender oeffnen';
  calendarBtn.innerHTML = '<span aria-hidden="true"></span>';
  if(weekRow && calendarBtn.parentElement !== weekRow) weekRow.appendChild(calendarBtn);
  calendarBtn.onclick = (event)=>{
    event.preventDefault();
    event.stopPropagation();
    openTab('calendar');
    return false;
  };

  if(spotlightClose) spotlightClose.onclick = closeOverviewSpotlightV65;
  if(spotlightCalendar) spotlightCalendar.onclick = ()=> openTab('calendar');
  return false;
};

/* --- V64D final overview hard override --- */
window.openWeekOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return openOverviewSpotlightV65({
    kicker:'Woche im Blick',
    title:'Wochenansicht',
    subline:'Alle Termine dieser Woche mit direktem Sprung in einzelne Tage.',
    html:buildWeekSpotlightHtmlV65(),
    selectedCardId:'weekOverviewCard'
  });
};

window.openTodayOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return openOverviewSpotlightV65({
    kicker:'Heute im Fokus',
    title:'Tagesuebersicht',
    subline:'Dein heutiger Ablauf in einer ruhigen Detailansicht.',
    html:buildTodaySpotlightHtmlV65(),
    selectedCardId:'todayOverviewCard'
  });
};

window.openTodayOverviewV58 = window.openTodayOverviewV64;
window.openWeekOverviewV58 = window.openWeekOverviewV64;

bindOverviewCardsV59 = function(){
  const todayCard = el('todayOverviewCard');
  const weekCard = el('weekOverviewCard');
  const spotlightClose = el('overviewSpotlightClose');
  const spotlightCalendar = el('overviewSpotlightCalendar');
  const ensureRow = (card)=>{
    if(!card) return null;
    let row = card.querySelector('.calendar-link-row');
    if(!row){
      row = document.createElement('div');
      row.className = 'calendar-link-row';
      card.appendChild(row);
    }
    return row;
  };

  const todayRow = ensureRow(todayCard);
  const weekRow = ensureRow(weekCard);

  [todayCard, weekCard].forEach(card=>{
    if(!card) return;
    card.onclick = null;
    card.onkeydown = null;
    card.removeAttribute('onclick');
    card.removeAttribute('tabindex');
    card.removeAttribute('role');
  });

  let todayBtn = el('openTodayOverviewBtn');
  if(!todayBtn){
    todayBtn = document.createElement('button');
    todayBtn.type = 'button';
    todayBtn.id = 'openTodayOverviewBtn';
  }
  todayBtn.className = 'button secondary small-btn';
  todayBtn.textContent = 'Tagesuebersicht oeffnen';
  if(todayRow && todayBtn.parentElement !== todayRow) todayRow.appendChild(todayBtn);
  todayBtn.onclick = window.openTodayOverviewV64;

  let weekBtn = el('openWeekOverviewBtn');
  if(!weekBtn){
    weekBtn = document.createElement('button');
    weekBtn.type = 'button';
    weekBtn.id = 'openWeekOverviewBtn';
  }
  weekBtn.className = 'button secondary small-btn';
  weekBtn.textContent = 'Wochenansicht oeffnen';
  if(weekRow && weekBtn.parentElement !== weekRow) weekRow.prepend(weekBtn);
  weekBtn.onclick = window.openWeekOverviewV64;

  let calendarBtn = el('jumpToCalendarFromWeek');
  if(!calendarBtn){
    calendarBtn = document.createElement('button');
    calendarBtn.type = 'button';
    calendarBtn.id = 'jumpToCalendarFromWeek';
  }
  calendarBtn.className = 'theme-icon-btn overview-calendar-icon';
  calendarBtn.setAttribute('aria-label', 'Kalender oeffnen');
  calendarBtn.title = 'Kalender oeffnen';
  calendarBtn.innerHTML = '<span aria-hidden="true"></span>';
  if(weekRow && calendarBtn.parentElement !== weekRow) weekRow.appendChild(calendarBtn);
  calendarBtn.onclick = (event)=>{
    event.preventDefault();
    event.stopPropagation();
    openTab('calendar');
    return false;
  };

  if(spotlightClose) spotlightClose.onclick = closeOverviewSpotlightV65;
  if(spotlightCalendar) spotlightCalendar.onclick = ()=> openTab('calendar');
  return false;
};

/* --- V64C final overview wiring --- */

window.openWeekOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return openOverviewSpotlightV65({
    kicker:'Woche im Blick',
    title:'Wochenansicht',
    subline:'Alle Termine dieser Woche mit direktem Sprung in einzelne Tage.',
    html:buildWeekSpotlightHtmlV65(),
    selectedCardId:'weekOverviewCard'
  });
};

window.openTodayOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return openOverviewSpotlightV65({
    kicker:'Heute im Fokus',
    title:'Tagesuebersicht',
    subline:'Dein heutiger Ablauf in einer ruhigen Detailansicht.',
    html:buildTodaySpotlightHtmlV65(),
    selectedCardId:'todayOverviewCard'
  });
};

window.openTodayOverviewV58 = window.openTodayOverviewV64;
window.openWeekOverviewV58 = window.openWeekOverviewV64;

function ensureOverviewActionRow(card){
  if(!card) return null;
  let row = card.querySelector('.calendar-link-row');
  if(!row){
    row = document.createElement('div');
    row.className = 'calendar-link-row';
    card.appendChild(row);
  }
  return row;
}

function ensureWeekCalendarIcon(){
  let button = el('jumpToCalendarFromWeek');
  if(button) return button;
  button = document.createElement('button');
  button.type = 'button';
  button.id = 'jumpToCalendarFromWeek';
  button.className = 'theme-icon-btn overview-calendar-icon';
  button.setAttribute('aria-label', 'Kalender oeffnen');
  button.title = 'Kalender oeffnen';
  button.innerHTML = '<span aria-hidden="true">📅</span>';
  return button;
}

function bindOverviewCardsV59(){
  const todayCard = el('todayOverviewCard');
  const weekCard = el('weekOverviewCard');
  const todayRow = ensureOverviewActionRow(todayCard);
  const weekRow = ensureOverviewActionRow(weekCard);
  const spotlightClose = el('overviewSpotlightClose');
  const spotlightCalendar = el('overviewSpotlightCalendar');
  let todayBtn = el('openTodayOverviewBtn');
  let weekBtn = el('openWeekOverviewBtn');
  const calendarBtn = ensureWeekCalendarIcon();

  [todayCard, weekCard].forEach(card => {
    if(!card) return;
    card.onclick = null;
    card.onkeydown = null;
    card.removeAttribute('onclick');
    card.removeAttribute('tabindex');
    card.removeAttribute('role');
  });

  if(todayBtn){
    todayBtn.type = 'button';
    todayBtn.textContent = 'Tagesuebersicht oeffnen';
    todayBtn.classList.add('button', 'secondary', 'small-btn');
    if(todayRow && todayBtn.parentElement !== todayRow) todayRow.prepend(todayBtn);
  }

  if(!weekBtn){
    weekBtn = document.createElement('button');
    weekBtn.type = 'button';
    weekBtn.id = 'openWeekOverviewBtn';
    weekBtn.className = 'button secondary small-btn';
    weekBtn.textContent = 'Wochenansicht oeffnen';
  } else {
    weekBtn.type = 'button';
    weekBtn.textContent = 'Wochenansicht oeffnen';
    weekBtn.classList.add('button', 'secondary', 'small-btn');
  }
  if(weekRow && weekBtn.parentElement !== weekRow) weekRow.prepend(weekBtn);

  if(calendarBtn){
    calendarBtn.type = 'button';
    calendarBtn.classList.add('theme-icon-btn', 'overview-calendar-icon');
    calendarBtn.setAttribute('aria-label', 'Kalender oeffnen');
    calendarBtn.title = 'Kalender oeffnen';
    if(!calendarBtn.innerHTML.trim()) calendarBtn.innerHTML = '<span aria-hidden="true">📅</span>';
    if(weekRow && calendarBtn.parentElement !== weekRow) weekRow.appendChild(calendarBtn);
  }

  if(todayBtn) todayBtn.onclick = window.openTodayOverviewV64;
  if(weekBtn) weekBtn.onclick = window.openWeekOverviewV64;
  if(calendarBtn) calendarBtn.onclick = (event)=>{
    event.preventDefault();
    event.stopPropagation();
    openTab('calendar');
    return false;
  };
  if(spotlightClose) spotlightClose.onclick = closeOverviewSpotlightV65;
  if(spotlightCalendar) spotlightCalendar.onclick = ()=> openTab('calendar');
  return false;
}

function openOverviewSpotlightV65(config){
  const spotlight = el('overviewSpotlight');
  const title = el('overviewSpotlightTitle');
  const subline = el('overviewSpotlightSubline');
  const content = el('overviewSpotlightContent');
  const kicker = el('overviewSpotlightKicker');
  const calendarBtn = el('overviewSpotlightCalendar');
  if(!spotlight || !title || !subline || !content || !kicker) return false;
  title.textContent = config.title;
  subline.textContent = config.subline;
  kicker.textContent = config.kicker;
  content.innerHTML = config.html;
  if(calendarBtn) calendarBtn.onclick = ()=> openTab('calendar');
  spotlight.classList.remove('hidden');
  ['todayOverviewCard','weekOverviewCard'].forEach(id=> el(id)?.classList.toggle('is-selected', id===config.selectedCardId));
  return false;
}

window.openTodayOverviewV58 = function(){
  return openOverviewSpotlightV65({
    kicker:'Heute im Fokus',
    title:'Tagesübersicht',
    subline:'Dein heutiger Ablauf in einer ruhigeren, klareren Ansicht.',
    html:buildTodaySpotlightHtmlV65(),
    selectedCardId:'todayOverviewCard'
  });
};

window.openWeekOverviewV58 = function(){
  return openOverviewSpotlightV65({
    kicker:'Woche im Blick',
    title:'Wochenansicht',
    subline:'Alle Termine dieser Woche mit direktem Sprung in einzelne Tage.',
    html:buildWeekSpotlightHtmlV65(),
    selectedCardId:'weekOverviewCard'
  });
};

window.openTodayOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return window.openTodayOverviewV58();
};

window.openWeekOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return window.openWeekOverviewV58();
};

function bindOverviewCardsV59(){
  const todayCard = el('todayOverviewCard');
  const weekCard = el('weekOverviewCard');
  const spotlightClose = el('overviewSpotlightClose');
  const spotlightCalendar = el('overviewSpotlightCalendar');
  const todayBtn = el('openTodayOverviewBtn');
  const weekBtn = el('openWeekOverviewBtn');
  if(todayCard){
    todayCard.onclick = null;
    todayCard.removeAttribute('onclick');
  }
  if(weekCard){
    weekCard.onclick = null;
    weekCard.removeAttribute('onclick');
  }
  if(weekBtn && weekCard && !weekCard.contains(weekBtn)){
    weekCard.querySelector('.calendar-link-row')?.prepend(weekBtn);
  }
  if(todayBtn) todayBtn.onclick = window.openTodayOverviewV64;
  if(weekBtn) weekBtn.onclick = window.openWeekOverviewV64;
  if(spotlightClose) spotlightClose.onclick = closeOverviewSpotlightV65;
  if(spotlightCalendar) spotlightCalendar.onclick = ()=> openTab('calendar');
}

window.openTodayOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return openOverviewSpotlightV65({
    kicker:'Heute im Fokus',
    title:'Tagesübersicht',
    subline:'Dein heutiger Ablauf in einer ruhigeren, klareren Ansicht.',
    html:buildTodaySpotlightHtmlV65(),
    selectedCardId:'todayOverviewCard'
  });
};

window.openWeekOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return openOverviewSpotlightV65({
    kicker:'Woche im Blick',
    title:'Wochenansicht',
    subline:'Alle Termine dieser Woche mit direktem Sprung in einzelne Tage.',
    html:buildWeekSpotlightHtmlV65(),
    selectedCardId:'weekOverviewCard'
  });
};

window.openTodayOverviewV58 = window.openTodayOverviewV64;
window.openWeekOverviewV58 = window.openWeekOverviewV64;

function bindOverviewCardsV59(){
  const todayCard = el('todayOverviewCard');
  const weekCard = el('weekOverviewCard');
  const spotlightClose = el('overviewSpotlightClose');
  const spotlightCalendar = el('overviewSpotlightCalendar');
  const bindCard = (card, handler) => {
    if(!card) return;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.onclick = handler;
    card.onkeydown = (event)=>{
      if(event.key === 'Enter' || event.key === ' '){
        handler(event);
      }
    };
  };
  bindCard(todayCard, window.openTodayOverviewV64);
  bindCard(weekCard, window.openWeekOverviewV64);
  if(spotlightClose) spotlightClose.onclick = closeOverviewSpotlightV65;
  if(spotlightCalendar) spotlightCalendar.onclick = ()=> openTab('calendar');
}

function buildTodaySpotlightHtmlV65(){
  const base = new Date();
  const today = `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`;
  const items = sortedAppointments(visibleAppointments()).filter(a=>a.date===today);
  const next = items[0];
  const doneCount = items.filter(a=>a.status==='confirmed').length;
  const openCount = items.filter(a=>a.status==='open').length;
  return `
    <div class="overview-spotlight-column">
      <div class="overview-feature-card soft">
        <strong>${next ? `${next.time} · ${next.service}` : 'Heute ist noch alles frei'}</strong>
        <p class="subtle">${next ? `${displayName(next.customerId)} ist dein nächster Termin.` : 'Aktuell ist für heute kein Termin eingetragen.'}</p>
        <div class="overview-meta-row">
          <span>${items.length} Termin${items.length===1?'':'e'} heute</span>
          <span>${doneCount} bestätigt</span>
          <span>${openCount} offen</span>
        </div>
      </div>
      <div class="overview-feature-card">
        <strong>Tagesrhythmus</strong>
        <p class="subtle">Alle Einträge in einer ruhigen, direkt lesbaren Reihenfolge.</p>
      </div>
    </div>
    <div class="overview-spotlight-column">
      <div class="overview-agenda">
        ${items.length ? items.map(a=>`
          <button type="button" class="overview-agenda-item" onclick="openAppointmentFromDay('${a.id}')">
            <div class="overview-agenda-top">
              <span class="overview-agenda-time">${a.time}</span>
              <span class="pill ${statusClass(a.status)}">${statusLabel(a.status)}</span>
            </div>
            <div class="overview-agenda-title">${a.service}</div>
            <div class="subtle">${displayName(a.customerId)}</div>
            <div class="list-meta"><span>Zuletzt bearbeitet von ${a.updatedBy}</span><span>${formatGermanDate(a.updatedAt)}</span></div>
          </button>
        `).join('') : `<div class="overview-empty-state">Heute gibt es noch keine Termine. Du kannst direkt in den Kalender springen und neue Einträge anlegen.</div>`}
      </div>
    </div>
  `;
}

function buildWeekSpotlightHtmlV65(){
  const base = new Date();
  const visible = sortedAppointments(visibleAppointments());
  const monday = new Date(base);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  const days = [];
  for(let i=0;i<7;i++){
    const d = new Date(monday);
    d.setDate(monday.getDate()+i);
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    days.push({date:d, items: visible.filter(a=>a.date===key)});
  }
  const busiestDay = [...days].sort((a,b)=>b.items.length-a.items.length)[0];
  return `
    <div class="overview-spotlight-column">
      <div class="overview-feature-card soft">
        <strong>${visible.length} Termin${visible.length===1?'':'e'} in dieser Woche</strong>
        <p class="subtle">${busiestDay?.items?.length ? `${busiestDay.date.toLocaleDateString('de-DE',{weekday:'long'})} ist aktuell am stärksten belegt.` : 'Im Moment ist die Woche noch entspannt geplant.'}</p>
        <div class="overview-meta-row">
          <span>${days.filter(entry=>entry.items.length).length} aktive Tage</span>
          <span>${visible.filter(a=>a.status==='confirmed').length} bestätigt</span>
          <span>${visible.filter(a=>a.status==='open').length} offen</span>
        </div>
      </div>
    </div>
    <div class="overview-spotlight-column">
      <div class="overview-week-stack">
        ${days.map(dayObj=>`
          <div class="overview-week-card">
            <header>
              <strong>${dayObj.date.toLocaleDateString('de-DE',{weekday:'long'})}</strong>
              <span>${dayObj.date.toLocaleDateString('de-DE',{day:'2-digit', month:'2-digit'})}</span>
            </header>
            ${dayObj.items.length ? dayObj.items.map(a=>`
              <button type="button" class="week-chip" onclick="openAppointmentFromDay('${a.id}')">${a.time} · ${displayName(a.customerId)}</button>
            `).join('') : '<div class="overview-empty-state">Keine Termine geplant.</div>'}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function closeOverviewSpotlightV65(){
  const spotlight = el('overviewSpotlight');
  if(!spotlight) return;
  spotlight.classList.add('hidden');
  ['todayOverviewCard','weekOverviewCard'].forEach(id=> el(id)?.classList.remove('is-selected'));
}

function openOverviewSpotlightV65(config){
  const spotlight = el('overviewSpotlight');
  const title = el('overviewSpotlightTitle');
  const subline = el('overviewSpotlightSubline');
  const content = el('overviewSpotlightContent');
  const kicker = el('overviewSpotlightKicker');
  const calendarBtn = el('overviewSpotlightCalendar');
  if(!spotlight || !title || !subline || !content || !kicker) return false;
  title.textContent = config.title;
  subline.textContent = config.subline;
  kicker.textContent = config.kicker;
  content.innerHTML = config.html;
  if(calendarBtn) calendarBtn.onclick = ()=> openTab('calendar');
  spotlight.classList.remove('hidden');
  ['todayOverviewCard','weekOverviewCard'].forEach(id=> el(id)?.classList.toggle('is-selected', id===config.selectedCardId));
  spotlight.scrollIntoView({behavior:'smooth', block:'nearest'});
  return false;
}

window.openTodayOverviewV58 = function(){
  return openOverviewSpotlightV65({
    kicker:'Heute im Fokus',
    title:'Tagesübersicht',
    subline:'Dein heutiger Ablauf in einer ruhigeren, klareren Ansicht.',
    html:buildTodaySpotlightHtmlV65(),
    selectedCardId:'todayOverviewCard'
  });
};

window.openWeekOverviewV58 = function(){
  return openOverviewSpotlightV65({
    kicker:'Woche im Blick',
    title:'Wochenansicht',
    subline:'Alle Termine dieser Woche mit direktem Sprung in einzelne Tage.',
    html:buildWeekSpotlightHtmlV65(),
    selectedCardId:'weekOverviewCard'
  });
};

window.openTodayOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return openTodayOverviewV58();
};

window.openWeekOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return openWeekOverviewV58();
};

function bindOverviewCardsV59(){
  const todayCard = el('todayOverviewCard');
  const weekCard = el('weekOverviewCard');
  const spotlightClose = el('overviewSpotlightClose');
  const spotlightCalendar = el('overviewSpotlightCalendar');
  const bindCard = (card, handler) => {
    if(!card) return;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.onclick = handler;
    card.onkeydown = (event)=>{
      if(event.key === 'Enter' || event.key === ' '){
        handler(event);
      }
    };
  };
  bindCard(todayCard, window.openTodayOverviewV64);
  bindCard(weekCard, window.openWeekOverviewV64);
  if(spotlightClose) spotlightClose.onclick = closeOverviewSpotlightV65;
  if(spotlightCalendar) spotlightCalendar.onclick = ()=> openTab('calendar');
}


/* --- V64B direct click openers --- */
window.openTodayOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  document.body.classList.add('modal-open');
  const base = new Date();
  const today = `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`;
  const items = sortedAppointments(visibleAppointments()).filter(a=>a.date===today);
  const content = items.length ? items.map(a=>`
    <button type="button" class="list-item" onclick="openAppointmentFromDay('${a.id}'); closeOverviewModalV54();">
      <strong>${a.time} · ${a.service}</strong>
      <div>${displayName(a.customerId)}</div>
      <div class="list-meta"><span class="pill ${statusClass(a.status)}">${statusLabel(a.status)}</span><span>${formatGermanDate(a.updatedAt)}</span></div>
    </button>
  `).join('') : '<div class="empty-note">Heute sind aktuell keine Termine eingetragen.</div>';
  openOverviewModalV54('Tagesübersicht', 'Alle Termine für heute im Detail', content);
  return false;
};

window.openWeekOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  document.body.classList.add('modal-open');
  const base = new Date();
  const visible = sortedAppointments(visibleAppointments());
  const monday = new Date(base);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  const days = [];
  for(let i=0;i<7;i++){
    const d = new Date(monday);
    d.setDate(monday.getDate()+i);
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    days.push({date:d, items: visible.filter(a=>a.date===key)});
  }
  const content = days.map(dayObj=>`
    <div class="list-item">
      <strong>${dayObj.date.toLocaleDateString('de-DE',{weekday:'long', day:'2-digit', month:'2-digit'})}</strong>
      <div class="week-modal-list">
        ${dayObj.items.length ? dayObj.items.map(a=>`<button type="button" class="week-chip" onclick="openAppointmentFromDay('${a.id}'); closeOverviewModalV54();">${a.time} · ${displayName(a.customerId)}</button>`).join('') : '<span class="week-empty">Keine Termine</span>'}
      </div>
    </div>
  `).join('') + `<div class="calendar-link-row"><button type="button" class="button secondary small-btn" onclick="closeOverviewModalV54(); openTab('calendar');">Zum Kalender</button></div>`;
  openOverviewModalV54('Wochenansicht', 'Alle Termine dieser Woche im Detail', content);
  return false;
};

window.openCustomerDirectoryV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  const modal = el('customerDirectoryModal');
  const list = el('customerDirectoryList');
  if(!modal || !list) return false;
  const rows = [...customerUsers()].sort((a,b)=>a.name.localeCompare(b.name, 'de'));
  list.innerHTML = rows.length ? rows.map(c=>`
    <button type="button" class="list-item" onclick="editCustomer('${c.id}'); document.getElementById('customerDirectoryModal').classList.remove('active');">
      <strong>${c.name}</strong>
      <div class="list-meta"><span>${c.email}</span><span>${c.phone || 'Keine Telefonnummer'}</span></div>
    </button>`).join('') : '<div class="empty-note">Noch keine Kundinnen vorhanden.</div>';
  modal.classList.add('active');
  return false;
};

function bindOverviewCardsV59(){
  const todayCard = el('todayOverviewCard');
  const weekCard = el('weekOverviewCard');
  const bindCard = (card, handler) => {
    if(!card) return;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.onclick = handler;
    card.onkeydown = (event)=>{
      if(event.key === 'Enter' || event.key === ' '){
        handler(event);
      }
    };
  };

  bindCard(todayCard, window.openTodayOverviewV64);
  bindCard(weekCard, window.openWeekOverviewV64);
}

window.openTodayOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  document.body.classList.add('modal-open');
  openOverviewModalV54('Tagesübersicht', 'Alle Termine für heute im Detail', buildTodayOverviewHtmlV63());
  return false;
};

window.openWeekOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return openOverviewSpotlightV65({
    kicker:'Woche im Blick',
    title:'Wochenansicht',
    subline:'Alle Termine dieser Woche mit direktem Sprung in einzelne Tage.',
    html:buildWeekSpotlightHtmlV65(),
    selectedCardId:'weekOverviewCard'
  });
};

window.openTodayOverviewV64 = function(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  return openOverviewSpotlightV65({
    kicker:'Heute im Fokus',
    title:'Tagesübersicht',
    subline:'Dein heutiger Ablauf in einer ruhigen Detailansicht.',
    html:buildTodaySpotlightHtmlV65(),
    selectedCardId:'todayOverviewCard'
  });
};

window.openTodayOverviewV58 = window.openTodayOverviewV64;
window.openWeekOverviewV58 = window.openWeekOverviewV64;

bindOverviewCardsV59 = function(){
  const todayCard = el('todayOverviewCard');
  const weekCard = el('weekOverviewCard');
  const spotlightClose = el('overviewSpotlightClose');
  const spotlightCalendar = el('overviewSpotlightCalendar');

  const ensureRow = (card)=>{
    if(!card) return null;
    let row = card.querySelector('.calendar-link-row');
    if(!row){
      row = document.createElement('div');
      row.className = 'calendar-link-row';
      card.appendChild(row);
    }
    return row;
  };

  const todayRow = ensureRow(todayCard);
  const weekRow = ensureRow(weekCard);

  [todayCard, weekCard].forEach(card=>{
    if(!card) return;
    card.onclick = null;
    card.onkeydown = null;
    card.removeAttribute('onclick');
    card.removeAttribute('tabindex');
    card.removeAttribute('role');
  });

  let todayBtn = el('openTodayOverviewBtn');
  if(todayBtn){
    todayBtn.type = 'button';
    todayBtn.className = 'button secondary small-btn';
    todayBtn.innerHTML = 'Tages&uuml;bersicht &ouml;ffnen';
    if(todayRow && todayBtn.parentElement !== todayRow) todayRow.appendChild(todayBtn);
    todayBtn.onclick = window.openTodayOverviewV64;
  }

  let weekBtn = el('openWeekOverviewBtn');
  if(!weekBtn){
    weekBtn = document.createElement('button');
    weekBtn.type = 'button';
    weekBtn.id = 'openWeekOverviewBtn';
  }
  weekBtn.className = 'button secondary small-btn';
  weekBtn.innerHTML = 'Wochenansicht &ouml;ffnen';
  if(weekRow && weekBtn.parentElement !== weekRow) weekRow.prepend(weekBtn);
  weekBtn.onclick = window.openWeekOverviewV64;

  let calendarBtn = el('jumpToCalendarFromWeek');
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
  calendarBtn.onclick = (event)=>{
    event.preventDefault();
    event.stopPropagation();
    openTab('calendar');
    return false;
  };

  if(spotlightClose) spotlightClose.onclick = closeOverviewSpotlightV65;
  if(spotlightCalendar) spotlightCalendar.onclick = ()=> openTab('calendar');
  return false;
};

function bindOverviewButtonsV61(){
  bindOverviewButtonsV63();
}

function bindCustomerDirectoryV63(){
  const modal = el('customerDirectoryModal');
  const openBtn = el('openCustomerDirectory');
  const closeBtn = el('customerDirectoryClose');
  const backdrop = el('customerDirectoryBackdrop');
  const list = el('customerDirectoryList');
  if(openBtn && modal && list){
    openBtn.type = 'button';
    openBtn.onclick = function(e){
      e.preventDefault();
      e.stopPropagation();
      const rows = [...customerUsers()].sort((a,b)=>a.name.localeCompare(b.name, 'de'));
      list.innerHTML = rows.length ? rows.map(c=>`
        <button type="button" class="list-item" onclick="editCustomer('${c.id}'); document.getElementById('customerDirectoryModal').classList.remove('active');">
          <strong>${c.name}</strong>
          <div class="list-meta"><span>${c.email}</span><span>${c.phone || 'Keine Telefonnummer'}</span></div>
        </button>`).join('') : '<div class="empty-note">Noch keine Kundinnen vorhanden.</div>';
      modal.classList.add('active');
      return false;
    };
  }
  if(closeBtn) closeBtn.onclick = ()=> modal && modal.classList.remove('active');
  if(backdrop) backdrop.onclick = ()=> modal && modal.classList.remove('active');
}

window.addEventListener('load', ()=>{
  if(window.__liaFinalizeActive) return;
  applyCleanHeaderIcons();
  bindOverviewCardsV59();
});

/* --- Safe stubs for functions defined in later-loaded scripts ---
 * These are overwritten by dashboard-free-slots.js and dashboard-finalize.js
 * once those scripts execute. The stubs prevent ReferenceErrors if a button
 * is clicked before all scripts have finished loading.
 */
if(typeof window.openFreeSlotsOverviewV64 !== 'function'){
  window.openFreeSlotsOverviewV64 = function(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    console.warn('[Dashboard] openFreeSlotsOverviewV64 not yet loaded');
    return false;
  };
}
if(typeof window.openHistoryLogV64 !== 'function'){
  window.openHistoryLogV64 = function(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    console.warn('[Dashboard] openHistoryLogV64 not yet loaded');
    return false;
  };
}
if(typeof window.openCustomerDirectoryV64 !== 'function'){
  window.openCustomerDirectoryV64 = function(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    console.warn('[Dashboard] openCustomerDirectoryV64 not yet loaded');
    return false;
  };
}
