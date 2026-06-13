// Copa del Mundo 2026 Polla Digital - Core Application Logic
// Powered by Parley.com.ve

// Normalization and mapping helper for FlagCDN flags
function getFlagCode(countryName) {
  if (!countryName) return "un";
  const normalized = countryName
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s.\/-]/g, "");

  const mapping = {
    "alemania": "de",
    "arabia saudita": "sa",
    "argelia": "dz",
    "argentina": "ar",
    "australia": "au",
    "austria": "at",
    "bosnia-herzegovina": "ba",
    "brasil": "br",
    "belgica": "be",
    "cabo verde": "cv",
    "canada": "ca",
    "catar": "qa",
    "colombia": "co",
    "costa de marfil": "ci",
    "croacia": "hr",
    "curazao": "cw",
    "ee.uu.": "us",
    "ecuador": "ec",
    "egipto": "eg",
    "escocia": "gb-sct",
    "espana": "es",
    "francia": "fr",
    "ghana": "gh",
    "haiti": "ht",
    "inglaterra": "gb-eng",
    "irak": "iq",
    "iran": "ir",
    "japon": "jp",
    "jordania": "jo",
    "marruecos": "ma",
    "mexico": "mx",
    "noruega": "no",
    "nueva zelanda": "nz",
    "panama": "pa",
    "paraguay": "py",
    "paises bajos": "nl",
    "portugal": "pt",
    "rd congo": "cd",
    "rep. de corea": "kr",
    "rep. checa": "cz",
    "senegal": "sn",
    "sudafrica": "za",
    "suecia": "se",
    "suiza": "ch",
    "turquia": "tr",
    "tunez": "tn",
    "uruguay": "uy",
    "uzbekistan": "uz"
  };

  return mapping[normalized] || "un";
}

// Generate the HTML for a flag using FlagCDN PNG and fallback handler
function getFlagHTML(countryName) {
  const code = getFlagCode(countryName);
  const url = `https://flagcdn.com/w80/${code}.png`;
  const fallback = `https://flagcdn.com/w80/un.png`;
  return `<img src="${url}" alt="${countryName}" class="flag-svg" onerror="this.src='${fallback}'">`;
}

// Venezuelan date and time formatting (12H, DD-MM-AAAA)
function formatDateVZLA(dateStr) {
  if (!dateStr) return { date: "", time: "" };

  const hasOffset = /(Z|z|[+-]\d{2}(:?\d{2})?)$/.test(dateStr.trim());
  let year, month, day, hour, minStr;

  if (hasOffset) {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      return { date: dateStr, time: "" };
    }
    const vzlaMs = dateObj.getTime() - (4 * 60 * 60 * 1000);
    const vzlaDate = new Date(vzlaMs);
    
    year = String(vzlaDate.getUTCFullYear());
    month = String(vzlaDate.getUTCMonth() + 1).padStart(2, '0');
    day = String(vzlaDate.getUTCDate()).padStart(2, '0');
    hour = vzlaDate.getUTCHours();
    minStr = String(vzlaDate.getUTCMinutes()).padStart(2, '0');
  } else {
    let cleanStr = dateStr.replace("T", " ").trim();
    const parts = cleanStr.split(" ");
    if (parts.length < 2) return { date: dateStr, time: "" };
    const [datePart, timePart] = parts;
    
    const dateParts = datePart.split("-");
    if (dateParts.length < 3) return { date: dateStr, time: "" };
    [year, month, day] = dateParts;
    
    const timeParts = timePart.split(":");
    if (timeParts.length < 2) return { date: dateStr, time: "" };
    const [hourStr, minPart] = timeParts;
    hour = parseInt(hourStr, 10);
    minStr = minPart;
  }

  const ampm = hour >= 12 ? "PM" : "AM";
  let hour12 = hour % 12;
  hour12 = hour12 ? hour12 : 12;
  const formattedHour = String(hour12).padStart(2, '0');

  return {
    date: `${day}-${month}-${year}`,
    time: `${formattedHour}:${minStr} ${ampm}`
  };
}

// Generate 5-character alphanumeric ID (e.g. ID-G5B9A)
function generateUserID() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ID-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if tournament is finished
function checkTournamentFinished() {
  return STATE.tournamentFinished;
}

// Admin inspect user details modals
async function openAdminUserModal(cedula) {
  STATE.inspectedUserCedula = cedula;
  const user = STATE.users.find(u => u.cedula === cedula);
  if (!user) return;
  
  // Load predictions and specials on-demand
  if (!user.predictionsLoaded && !user.is_mock) {
    try {
      const loadedData = await loadUserData(user.id);
      if (loadedData) {
        Object.assign(user, loadedData);
      }
    } catch (err) {
      console.error("Error loading user data for admin modal:", err);
      showToast("ERROR AL CARGAR DATOS DEL USUARIO.", "error");
      closeAdminUserModal();
      return;
    }
  }
  
  document.getElementById('admin-inspect-name').innerText = user.name;
  document.getElementById('admin-inspect-id').innerText = user.id;
  document.getElementById('admin-inspect-cedula').innerText = user.cedula;
  document.getElementById('admin-inspect-phone').innerText = user.phone || 'N/A';
  document.getElementById('admin-inspect-email').innerText = user.email || 'N/A';
  document.getElementById('admin-inspect-dob').innerText = user.dob || 'N/A';
  
  // Set parley username in admin inspect
  const parleyUsernameEl = document.getElementById('admin-inspect-parley-username');
  if (parleyUsernameEl) {
    parleyUsernameEl.innerText = user.parley_username || 'N/A';
  }
  
  const points = user.points || 0;
  const bd = user.points_breakdown || { exacts: 0, simple_1x2: 0, exact_gd: 0, group_leaders_points: 0, badges_points: 0 };
  
  document.getElementById('admin-inspect-points').innerText = `${points} PTS`;
  document.getElementById('admin-inspect-exacts').innerText = `${bd.exacts} PTS`;
  document.getElementById('admin-inspect-1x2').innerText = `${bd.simple_1x2} PTS`;
  document.getElementById('admin-inspect-gd').innerText = `${bd.exact_gd} PTS`;
  
  // Safeguard against removed element
  const teamGoalsEl = document.getElementById('admin-inspect-team-goals');
  if (teamGoalsEl) {
    teamGoalsEl.innerText = `${bd.team_goals || 0} PTS`;
  }
  
  document.getElementById('admin-inspect-group-leaders').innerText = `${bd.group_leaders_points} PTS`;
  document.getElementById('admin-inspect-badges-pts').innerText = `${bd.badges_points || 0} PTS`;
  document.getElementById('admin-inspect-badges').innerText = user.badges && user.badges.length > 0 ? user.badges.join(", ") : "Ninguna";
  
  // Check if HAT-TRICK VIP is active
  const toggleVipBtn = document.getElementById('btn-toggle-vip-badge');
  if (toggleVipBtn) {
    if (user.badges && user.badges.includes("HAT-TRICK VIP")) {
      toggleVipBtn.innerText = "REVOCAR HAT-TRICK VIP";
      toggleVipBtn.style.borderColor = "var(--alert)";
      toggleVipBtn.style.color = "var(--alert)";
    } else {
      toggleVipBtn.innerText = "ASIGNAR HAT-TRICK VIP";
      toggleVipBtn.style.borderColor = "var(--accent)";
      toggleVipBtn.style.color = "var(--accent)";
    }
  }
  
  // Load Predictions Ticket visual receipt
  const ticketContainer = document.getElementById('admin-inspect-ticket-container');
  ticketContainer.innerHTML = "";
  
  STATE.matches.forEach(m => {
    const pred = user.predictions[m.match_no];
    let predText = "Sin pronóstico";
    let wildcardHTML = "";
    let ptsEarned = 0;
    
    if (pred && pred.home_score !== null && pred.away_score !== null) {
      predText = `${pred.home_score} - ${pred.away_score}`;
      if (pred.wildcard) wildcardHTML = " 🚨 (x2)";
      
      // Calculate single match points
      if (m.home_score !== null && m.away_score !== null) {
        let matchPoints = 0;
        if (pred.home_score === m.home_score && pred.away_score === m.away_score) {
          matchPoints = 6;
        } else {
          const r_win = m.home_score > m.away_score ? 'home' : (m.home_score < m.away_score ? 'away' : 'draw');
          const p_win = pred.home_score > pred.away_score ? 'home' : (pred.home_score < pred.away_score ? 'away' : 'draw');
          if (r_win === p_win) {
            matchPoints += 3;
            if (m.home_score !== m.away_score && (m.home_score - m.away_score) === (pred.home_score - pred.away_score)) {
              matchPoints += 2;
            }
          }
        }
        if (pred.wildcard) matchPoints *= 2;
        ptsEarned = matchPoints;
      }
    }
    
    const realText = m.home_score !== null && m.away_score !== null ? `${m.home_score} - ${m.away_score}` : "Por jugar";
    
    const item = document.createElement('div');
    item.className = "ticket-row-item";
    item.innerHTML = `
      <div class="ticket-team-row">
        <div class="ticket-team-col" style="flex: 1; justify-content: flex-end; text-align: right; min-width: 0;">
          ${getFlagHTML(m.home_name)}
          <span style="margin-left: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.home_name}</span>
        </div>
        <span style="font-weight: 800; font-size: 13px; color: var(--accent); margin: 0 10px; min-width: 50px; text-align: center; white-space: nowrap; flex-shrink: 0;">${predText}${wildcardHTML}</span>
        <div class="ticket-team-col" style="flex: 1; justify-content: flex-start; text-align: left; min-width: 0;">
          <span style="margin-right: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.away_name}</span>
          ${getFlagHTML(m.away_name)}
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-top: 4px; flex-wrap: wrap; gap: 4px;">
        <span>Partido #${m.match_no} (${m.group ? `Grupo ${m.group}` : ''})</span>
        <span>Real: <strong style="color: #FFF;">${realText}</strong> | Ganado: <strong style="color: var(--accent);">${ptsEarned} PTS</strong></span>
      </div>
    `;
    ticketContainer.appendChild(item);
  });
  
  document.getElementById('admin-user-modal').classList.add('active');
}

function closeAdminUserModal() {
  document.getElementById('admin-user-modal').classList.remove('active');
}

function adminToggleVipBadge() {
  const cedula = STATE.inspectedUserCedula;
  if (!cedula) return;
  const user = STATE.users.find(u => u.cedula === cedula);
  if (!user) return;
  
  if (!user.badges) {
    user.badges = [];
  }
  
  const idx = user.badges.indexOf("HAT-TRICK VIP");
  if (idx > -1) {
    user.badges.splice(idx, 1);
    showToast("INSIGNIA HAT-TRICK VIP REVOCADA.");
  } else {
    user.badges.push("HAT-TRICK VIP");
    showToast("INSIGNIA HAT-TRICK VIP ASIGNADA.");
  }
  
  saveUsersToLocalStorage();
  recalculateAllPoints();
  openAdminUserModal(cedula);
  renderApp();
  
  const searchInput = document.getElementById('admin-user-search-input');
  const query = searchInput ? searchInput.value : "";
  renderAdminUsersList(query);
}

function toggleTournamentFinished() {
  STATE.tournamentFinished = !STATE.tournamentFinished;
  localStorage.setItem('parley_wc_tournament_finished', STATE.tournamentFinished);
  if (STATE.tournamentFinished) {
    showToast("TORNEO DECLARADO FINALIZADO. ¡FIESTA DE PREMIACIÓN ACTIVADA!");
  } else {
    showToast("ESTADO DEL TORNEO REESTABLECIDO A ACTIVO.");
  }
  recalculateAllPoints();
  renderApp();
  if (STATE.adminMode) {
    renderAdminView();
  }
}

// Global App State
let STATE = {
  users: [],
  matches: [],
  groups: {},
  assign_third: {},
  leagues: [],
  currentUser: null,
  simulatedTime: new Date("2026-06-11T12:00:00-04:00").getTime(), // defaults to 3 hours before Match 1 (Venezuela Time)
  simulatorEnabled: false,
  realTimeOffset: 0,
  adminMode: false,
  tournamentFinished: false,
  inspectedUserCedula: null,
  groupStandingsOverrides: {},
  tempOverrideTeams: []
};

// Helper: Toast alerts
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  container.className = `toast active toast-${type}`;
  container.innerText = message;
  setTimeout(() => {
    container.classList.remove('active');
  }, 4000);
}

// Format Cédula: digits only + prefix
function formatCedulaInput(prefixVal, numberVal) {
  const digits = numberVal.replace(/\D/g, '');
  return `${prefixVal}-${digits}`;
}

// Age check (18+)
function isAdult(dobString) {
  if (!dobString) return false;
  const dob = new Date(dobString);
  const now = new Date(getCurrentTime());
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 18;
}

// Streak calculation (correct 1X2 or exact score counts for streak)
function calculateUserStreak(user) {
  let currentStreak = 0;
  let maxStreak = 0;
  
  const finishedMatches = STATE.matches
    .filter(m => m.home_score !== null && m.away_score !== null)
    .sort((a, b) => a.match_no - b.match_no);
    
  finishedMatches.forEach(m => {
    const pred = user.predictions[m.match_no];
    if (!pred) {
      currentStreak = 0;
      return;
    }
    
    const H_p = pred.home_score;
    const A_p = pred.away_score;
    if (H_p === null || H_p === undefined || A_p === null || A_p === undefined) {
      currentStreak = 0;
      return;
    }
    
    const H_r = m.home_score;
    const A_r = m.away_score;
    
    const r_winner = H_r > A_r ? 'home' : (H_r < A_r ? 'away' : 'draw');
    const p_winner = H_p > A_p ? 'home' : (H_p < A_p ? 'away' : 'draw');
    
    if (r_winner === p_winner) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  });
  
  return { currentStreak, maxStreak };
}

// Deterministic mini-insights for matches
function getMatchInsights(match) {
  const seed = match.match_no + match.home_name.length + match.away_name.length;
  
  const pHome = 30 + (seed % 35);
  const pDraw = 15 + (seed % 20);
  const pAway = 100 - pHome - pDraw;
  
  const forms = ["V V E D V", "E D V V E", "V D D V E", "E E V D V", "V V V E D", "D E V D D"];
  const homeForm = forms[seed % forms.length];
  const awayForm = forms[(seed + 3) % forms.length];
  
  const facts = [
    "Históricamente cerrado: sus últimos encuentros oficiales terminaron en empate.",
    "El equipo local llega con una racha invicta de 5 partidos de local.",
    "Promedio de goles alto: más de 2.5 goles anotados en sus últimos choques.",
    "Fuerte defensa: el visitante no ha recibido goles en sus últimos 3 partidos.",
    "Historial favorable para el local con un 60% de victorias en esta sede.",
    "El último enfrentamiento oficial terminó 2-1 a favor del equipo visitante."
  ];
  const keyFact = facts[seed % facts.length];
  
  return {
    probabilities: { home: pHome, draw: pDraw, away: pAway },
    homeForm,
    awayForm,
    keyFact
  };
}

// Toggle insights visibility state
function toggleInsights(matchNo) {
  const pane = document.getElementById(`insights-${matchNo}`);
  if (!pane) return;
  const isHidden = pane.style.display === 'none';
  pane.style.display = isHidden ? 'block' : 'none';
  
  const btn = document.getElementById(`btn-insights-toggle-${matchNo}`);
  if (btn) {
    btn.innerText = isHidden ? "📊 OCULTAR INSIGHTS" : "📊 VER INSIGHTS";
  }
}

// Gold visual feedback flash + particles on save
function triggerSaveVisualFeedback(matchNo) {
  const container = document.getElementById(`score-wrapper-${matchNo}`);
  if (!container) return;
  
  container.classList.remove('save-flash-gold');
  void container.offsetWidth; // force reflow
  container.classList.add('save-flash-gold');
  
  // Spawn 6 golden particles
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.className = 'gold-particle';
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 25;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    
    p.style.setProperty('--dx', `${dx}px`);
    p.style.setProperty('--dy', `${dy}px`);
    p.style.left = '50%';
    p.style.top = '50%';
    
    container.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

// Dynamic PWA registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered successfully'))
      .catch(err => console.log('Service Worker registration failed: ', err));
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// Initialize Supabase Client
const supabaseUrl = 'https://vbodvczpnmyxdcerpxrb.supabase.co';
const supabaseKey = 'sb_publishable_zDy8TgI2nQb0gj64emSNbg_9M2qVrsd';
const supabaseClient = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

// API Service Layer rewritten for Supabase compatibility
const API = {
  getCurrentUser: function() {
    return STATE.currentUser ? STATE.currentUser.cedula : localStorage.getItem('parley_wc_current_user');
  },
  
  setCurrentUser: function(cedula) {
    if (cedula) {
      localStorage.setItem('parley_wc_current_user', cedula);
    } else {
      localStorage.removeItem('parley_wc_current_user');
    }
  },

  getTutorialSeen: function(cedula) {
    return localStorage.getItem('tutorial_seen_' + cedula) === 'true';
  },
  
  saveTutorialSeen: function(cedula, seen) {
    localStorage.setItem('tutorial_seen_' + cedula, seen ? 'true' : 'false');
    if (supabaseClient && STATE.currentUser && STATE.currentUser.cedula === cedula) {
      supabaseClient.from('profiles').update({ tutorial_seen: seen }).eq('id', STATE.currentUser.id)
        .then(({ error }) => { if (error) console.error("Error saving tutorial_seen in Supabase", error); });
    }
  }
};

// Generate code for leagues (kept standard)
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Load user details including predictions and special predictions from Supabase
async function loadUserData(userId) {
  if (!supabaseClient) return null;
  
  // Helper to fetch profile with retry backoff loop (up to 3 times, 500ms delay)
  const fetchProfileWithRetry = async () => {
    let profile = null;
    let profileError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        profile = result.data;
        profileError = result.error;
        if (!profileError && profile) {
          break;
        }
      } catch (err) {
        profileError = err;
      }
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    return { profile, error: profileError };
  };

  // Parallelize the queries inside loadUserData() using Promise.all
  const [profileResult, predsResult, glPredsResult] = await Promise.all([
    fetchProfileWithRetry(),
    supabaseClient.from('predictions').select('*').eq('user_id', userId),
    supabaseClient.from('group_leader_predictions').select('*').eq('user_id', userId)
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  const profile = profileResult.profile;
  if (!profile) {
    const err = new Error("Profile not found");
    err.code = 'PGRST116';
    throw err;
  }
  
  profile.predictions = {};
  const preds = predsResult.data;
  if (preds) {
    preds.forEach(p => {
      profile.predictions[p.match_no] = {
        home_score: p.home_score,
        away_score: p.away_score,
        wildcard: p.wildcard
      };
    });
  }
  
  profile.special_predictions = { group_leaders: {} };
  const glPreds = glPredsResult.data;
  if (glPreds) {
    glPreds.forEach(gp => {
      profile.special_predictions.group_leaders[gp.group_letter] = gp.team_code;
    });
  }
  
  profile.predictionsLoaded = true;
  return profile;
}

let currentSyncPromise = null;
let pendingSyncRequest = false;

// Fetch matches, config, leaderboard, and user leagues from Supabase
async function syncFromSupabase() {
  if (!supabaseClient) return;

  if (currentSyncPromise) {
    pendingSyncRequest = true;
    return currentSyncPromise.then(() => {
      if (pendingSyncRequest) {
        pendingSyncRequest = false;
        return syncFromSupabase();
      }
    });
  }

  const doSync = async () => {
    // 1. Fetch matches
    const { data: dbMatches } = await supabaseClient
      .from('matches')
      .select('*')
      .order('match_no', { ascending: true });
    if (dbMatches) {
      STATE.matches = dbMatches.map(m => {
        let localDate = m.match_date;
        if (typeof WORLD_CUP_DATA !== 'undefined' && WORLD_CUP_DATA.matches) {
          const localMatch = WORLD_CUP_DATA.matches.find(lm => lm.match_no === m.match_no);
          if (localMatch) {
            localDate = localMatch.date; // Use the local VET date string
          }
        }
        return {
          ...m,
          date: localDate,
          group: m.group_letter // Map group_letter to group for frontend compatibility
        };
      });
    }
    
    // 2. Batch config queries in syncFromSupabase() into a single app_config select
    const { data: configData } = await supabaseClient
      .from('app_config')
      .select('key, value')
      .in('key', ['tournament_finished', 'simulated_time', 'group_standings_overrides']);

    let finishedVal = 'false';
    let simTimeVal = null;
    let overridesVal = '{}';

    if (configData) {
      configData.forEach(row => {
        if (row.key === 'tournament_finished') finishedVal = row.value;
        else if (row.key === 'simulated_time') simTimeVal = row.value;
        else if (row.key === 'group_standings_overrides') overridesVal = row.value;
      });
    }

    STATE.tournamentFinished = finishedVal === 'true';
    STATE.simulatedTime = simTimeVal ? parseInt(simTimeVal, 10) : new Date("2026-06-11T12:00:00-04:00").getTime();
    try {
      STATE.groupStandingsOverrides = JSON.parse(overridesVal);
    } catch (e) {
      STATE.groupStandingsOverrides = {};
    }

    // 5. Check logged in user
    const { data: { user: authUser } } = await supabaseClient.auth.getUser();
    if (authUser) {
      try {
        const profile = await loadUserData(authUser.id);
        if (profile) {
          STATE.currentUser = profile;
          STATE.adminMode = profile.is_admin || profile.cedula === 'V-12345678';
          API.setCurrentUser(profile.cedula);
          
          // Sync profile.tutorial_seen from database back to localStorage to prevent tutorial loops
          if (profile.tutorial_seen !== undefined && profile.tutorial_seen !== null) {
            localStorage.setItem('tutorial_seen_' + profile.cedula, profile.tutorial_seen ? 'true' : 'false');
          }
        } else {
          await supabaseClient.auth.signOut();
          STATE.currentUser = null;
          STATE.adminMode = false;
          API.setCurrentUser(null);
        }
      } catch (err) {
        if (err && (err.code === 'PGRST116' || err.message === 'Profile not found')) {
          console.warn("User profile explicitly missing from database. Forcing logout.", err);
          await supabaseClient.auth.signOut();
          STATE.currentUser = null;
          STATE.adminMode = false;
          API.setCurrentUser(null);
        } else {
          console.warn("Transient database/network error while fetching user profile. Session preserved.", err);
        }
      }
    } else {
      STATE.currentUser = null;
      STATE.adminMode = false;
      API.setCurrentUser(null);
    }
    
    // 6. Fetch Top 50 users (excluding admin)
    const { data: topProfiles } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('is_admin', false)
      .order('points', { ascending: false })
      .limit(50);
      
    const userMap = new Map();
    
    if (topProfiles) {
      topProfiles.forEach(p => {
        p.predictions = p.predictions || {};
        p.special_predictions = p.special_predictions || { group_leaders: {} };
        userMap.set(p.cedula, p);
      });
    }
    
    // Add current user to map if not present
    if (STATE.currentUser) {
      userMap.set(STATE.currentUser.cedula, STATE.currentUser);
      
      // 7. Load leagues for current user
      const { data: dbMembers } = await supabaseClient
        .from('league_members')
        .select(`
          league_id,
          leagues (
            id,
            code,
            name,
            owner_id
          )
        `)
        .eq('user_id', STATE.currentUser.id);
        
      if (dbMembers) {
        const leaguesList = [];
        // Eliminate the N+1 loop in private leagues sync. Replace it with a single .in('league_id', leagueIds) query to load all league members.
        const leagueIds = dbMembers.map(item => item.league_id).filter(id => id);
        
        let membersByLeague = {};
        if (leagueIds.length > 0) {
          const { data: allLeagueMembers } = await supabaseClient
            .from('league_members')
            .select(`
              league_id,
              user_id,
              profiles (
                id,
                cedula,
                name,
                points,
                badges,
                exacts_count,
                outcomes_count
              )
            `)
            .in('league_id', leagueIds);
            
          if (allLeagueMembers) {
            allLeagueMembers.forEach(m => {
              if (!membersByLeague[m.league_id]) {
                membersByLeague[m.league_id] = [];
              }
              membersByLeague[m.league_id].push(m);
            });
          }
        }
        
        for (const item of dbMembers) {
          const dbLeague = item.leagues;
          if (!dbLeague) continue;
          
          const leagueMembers = membersByLeague[dbLeague.id] || [];
          const membersCedulas = [];
          
          leagueMembers.forEach(m => {
            const p = m.profiles;
            if (p) {
              p.predictions = p.predictions || {};
              p.special_predictions = p.special_predictions || { group_leaders: {} };
              if (!userMap.has(p.cedula)) {
                userMap.set(p.cedula, p);
              }
              membersCedulas.push(p.cedula);
            }
          });
          
          leaguesList.push({
            id: dbLeague.id,
            code: dbLeague.code,
            name: dbLeague.name,
            owner_id: dbLeague.owner_id,
            members: membersCedulas
          });
        }
        STATE.leagues = leaguesList;
      }
    } else {
      STATE.leagues = [];
    }
    
    STATE.users = Array.from(userMap.values());
    
    if (STATE.currentUser && STATE.currentUser.is_admin) {
      if (!STATE.users.some(u => u.id === STATE.currentUser.id)) {
        STATE.users.push(STATE.currentUser);
      }
    }
  };

  try {
    currentSyncPromise = doSync();
    await currentSyncPromise;
  } finally {
    currentSyncPromise = null;
    pendingSyncRequest = false;
  }
}

// Initialize database
async function initDatabase() {
  console.log("Initializing database with Supabase...");
  
  if (typeof WORLD_CUP_DATA !== 'undefined') {
    STATE.groups = WORLD_CUP_DATA.groups;
    STATE.assign_third = WORLD_CUP_DATA.assign_third;
  } else {
    showToast("ERROR CRÍTICO: DATOS DE COPA DEL MUNDO NO ENCONTRADOS.", "error");
  }
  
  try {
    await syncFromSupabase();
    console.log("Supabase database successfully initialized.");
  } catch (err) {
    console.error("Error initializing Supabase database", err);
    showToast("ERROR DE CONEXIÓN CON EL SERVIDOR DE BASE DE DATOS.", "error");
  }
}

// Redundant LocalStorage persistence helpers made no-ops
function saveUsersToLocalStorage() {
  console.log("saveUsersToLocalStorage: updates persisted in Supabase database");
}
function saveMatchesToLocalStorage() {
  console.log("saveMatchesToLocalStorage: updates persisted in Supabase database");
}
function saveLeaguesToLocalStorage() {
  console.log("saveLeaguesToLocalStorage: updates persisted in Supabase database");
}

function recalculateAllPoints() {
  console.log("Recalculating all points...");
  
  // First calculate standings & group leaders based on REAL matches
  const { standings, leaders } = resolveBrackets(STATE.matches);
  
  STATE.users.forEach(user => {
    // Skip recalculation if the user's prediction data is not loaded in memory and they are not a mock user.
    const isCurrentUser = STATE.currentUser && user.id === STATE.currentUser.id;
    if (!user.predictionsLoaded && !user.is_mock && !isCurrentUser) {
      return;
    }

    let totalPoints = 0;
    let exactsCount = 0;
    let winnerCount = 0;
    let predictionsCount = 0;
    let successfulWildcardsCount = 0;
    
    let breakdown = {
      exacts: 0,
      simple_1x2: 0,
      exact_gd: 0,
      group_leaders_points: 0
    };
    
    // A. Match predictions points
    STATE.matches.forEach(match => {
      const pred = user.predictions[match.match_no];
      if (!pred) return;
      
      const H_p = pred.home_score;
      const A_p = pred.away_score;
      
      // Only calculate if scores are filled (not null)
      if (H_p === null || H_p === undefined || A_p === null || A_p === undefined) return;
      if (match.home_score === null || match.home_score === undefined || match.away_score === null || match.away_score === undefined) return;
      
      predictionsCount++;
      
      const H_r = match.home_score;
      const A_r = match.away_score;
      
      let matchPoints = 0;
      
      // Exact Score
      if (H_p === H_r && A_p === A_r) {
        matchPoints = 6;
        breakdown.exacts += 6;
        exactsCount++;
        winnerCount++;
      } else {
        // Partial points
        const r_winner = H_r > A_r ? 'home' : (H_r < A_r ? 'away' : 'draw');
        const p_winner = H_p > A_p ? 'home' : (H_p < A_p ? 'away' : 'draw');
        
        let p_earned = 0;
        
        // 1. Simple outcome correct
        if (r_winner === p_winner) {
          p_earned += 3;
          breakdown.simple_1x2 += 3;
          winnerCount++;
          
          // 2. Goal Difference correct (only if winner correct and not a draw as draw is already checked by exact diff)
          if (H_r !== A_r && (H_r - A_r) === (H_p - A_p)) {
            p_earned += 2;
            breakdown.exact_gd += 2;
          }
        }
        
        matchPoints = p_earned;
      }
      
      // Comodín (Wildcard) double multiplier
      if (pred.wildcard) {
        matchPoints *= 2;
      }
      
      totalPoints += matchPoints;
      
      // Check if wildcard is successful
      if (pred.wildcard && matchPoints > 0) {
        successfulWildcardsCount++;
      }
    });
    
    // B. Group Leaders predictions (+5 per correct leader)
    if (user.special_predictions && user.special_predictions.group_leaders) {
      Object.entries(leaders).forEach(([grpLetter, realLeaderCode]) => {
        // Condition: Only count points if ALL group matches are completed
        const groupMatches = STATE.matches.filter(m => m.group === grpLetter);
        const allFinished = groupMatches.length > 0 && groupMatches.every(m => m.home_score !== null && m.away_score !== null);
        
        if (allFinished) {
          const userPickCode = user.special_predictions.group_leaders[grpLetter];
          if (userPickCode && userPickCode === realLeaderCode) {
            totalPoints += 5;
            breakdown.group_leaders_points += 5;
          }
        }
      });
    }
    
    // D. Gamification badges
    let badges = [];
    if (exactsCount >= 3) badges.push("Ojo Clínico");
    if (winnerCount >= 15) badges.push("Ganador Frecuente");
    if (predictionsCount >= 50) badges.push("Pronosticador Activo");
    
    // Check for Group Leader badge (6+ correct)
    const leaderAciertos = breakdown.group_leaders_points / 5;
    if (leaderAciertos >= 6) badges.push("Oráculo de Grupos");
    
    if (user.badges && user.badges.includes("HAT-TRICK VIP")) {
      badges.push("HAT-TRICK VIP");
    }
    
    // Calculate badgePoints according to the new individual tiered values for each badge:
    // - 'Pronosticador Activo': 5
    // - 'Ganador Frecuente': 10
    // - 'Ojo Clínico': 15
    // - 'Oráculo de Grupos': 15
    // - 'HAT-TRICK VIP': 20
    let badgePoints = 0;
    badges.forEach(b => {
      if (b === "Pronosticador Activo") badgePoints += 5;
      else if (b === "Ganador Frecuente") badgePoints += 10;
      else if (b === "Ojo Clínico") badgePoints += 15;
      else if (b === "Oráculo de Grupos") badgePoints += 15;
      else if (b === "HAT-TRICK VIP") badgePoints += 20;
    });
    totalPoints += badgePoints;
    breakdown.badges_points = badgePoints;
    
    user.points = totalPoints;
    user.points_breakdown = breakdown;
    user.badges = badges;
    user.exacts_count = exactsCount;
    user.outcomes_count = winnerCount - exactsCount;
    user.successful_wildcards_count = successfulWildcardsCount;
  });
  
  // Save updated users
  saveUsersToLocalStorage();
}

function sortUsersLeaderboard(usersArray) {
  return [...usersArray].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const exactsA = a.exacts_count || 0;
    const exactsB = b.exacts_count || 0;
    if (exactsB !== exactsA) return exactsB - exactsA;
    const outcomesA = a.outcomes_count || 0;
    const outcomesB = b.outcomes_count || 0;
    if (outcomesB !== outcomesA) return outcomesB - outcomesA;
    const wcsA = a.successful_wildcards_count || 0;
    const wcsB = b.successful_wildcards_count || 0;
    if (wcsB !== wcsA) return wcsB - wcsA;
    return a.cedula.localeCompare(b.cedula);
  });
}

// Compute dynamic group standings using FIFA tie-breakers (Points, GD, GF)
function calculateGroupStandings(matchesList) {
  const standings = {};
  
  // Initialize standings for all teams
  Object.entries(STATE.groups).forEach(([grpLetter, teams]) => {
    standings[grpLetter] = teams.map(t => ({
      id: t.id,
      name: t.name,
      played: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0
    }));
  });
  
  // Accumulate scores from matches List
  matchesList.forEach(m => {
    if (m.stage !== 'group') return;
    if (m.home_score === null || m.away_score === null) return;
    
    const grp = m.group;
    const homeTeam = standings[grp].find(t => t.id === m.home_code);
    const awayTeam = standings[grp].find(t => t.id === m.away_code);
    
    if (!homeTeam || !awayTeam) return;
    
    const hs = m.home_score;
    const as = m.away_score;
    
    homeTeam.played++;
    awayTeam.played++;
    homeTeam.gf += hs;
    homeTeam.ga += as;
    awayTeam.gf += as;
    awayTeam.ga += hs;
    homeTeam.gd = homeTeam.gf - homeTeam.ga;
    awayTeam.gd = awayTeam.gf - awayTeam.ga;
    
    if (hs > as) {
      homeTeam.w++;
      homeTeam.pts += 3;
      awayTeam.l++;
    } else if (hs < as) {
      awayTeam.w++;
      awayTeam.pts += 3;
      homeTeam.l++;
    } else {
      homeTeam.d++;
      homeTeam.pts += 1;
      awayTeam.d++;
      awayTeam.pts += 1;
    }
  });
  
  // Sort standings within each group (FIFA rules: Pts, GD, GF)
  Object.keys(standings).forEach(grp => {
    standings[grp].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      // fallback: alphabetical
      return a.name.localeCompare(b.name);
    });

    // Apply manual group overrides if present
    if (STATE.groupStandingsOverrides && STATE.groupStandingsOverrides[grp]) {
      const overrideOrder = STATE.groupStandingsOverrides[grp];
      standings[grp].sort((a, b) => {
        const idxA = overrideOrder.indexOf(a.id);
        const idxB = overrideOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) {
          return idxA - idxB;
        }
        return 0; // fallback
      });
    }
  });
  
  return standings;
}

// Brackets engine: Simplified to only resolve group leaders since brackets are disabled
function resolveBrackets(matchesList) {
  const standings = calculateGroupStandings(matchesList);
  
  const firsts = {};
  Object.entries(standings).forEach(([grp, list]) => {
    firsts[grp] = list[0];
  });
  
  const groupLeadersReal = {};
  Object.entries(firsts).forEach(([grp, team]) => {
    groupLeadersReal[grp] = team ? team.id : "";
  });
  
  return {
    standings,
    leaders: groupLeadersReal
  };
}

// Check if a match is locked (10 mins before kickoff or if real scores are entered)
function isMatchLocked(match) {
  if (checkTournamentFinished()) return true;
  
  // Lock immediately if the match already has a real result manually entered
  if (match.home_score !== null && match.home_score !== undefined &&
      match.away_score !== null && match.away_score !== undefined) {
    return true;
  }
  
  // Treat the database date string literally as Venezuela Time (UTC-4)
  let cleanStr = match.date.replace(" ", "T");
  if (cleanStr.includes("+")) {
    cleanStr = cleanStr.split("+")[0];
  } else if (cleanStr.includes("Z")) {
    cleanStr = cleanStr.split("Z")[0];
  }
  
  // Explicitly parse in Venezuela Time zone to make checks location-independent
  const kickoffStr = cleanStr + "-04:00";
  const kickoffTime = new Date(kickoffStr).getTime();
  const lockoutLimit = kickoffTime - (10 * 60 * 1000); // 10 mins
  
  return getCurrentTime() >= lockoutLimit;
}

// Check if the tournament specials are locked (opt-in allowed until June 18, 2026 at 10:00 AM VET)
function isSpecialPredictionsLocked() {
  const deadlineTime = new Date("2026-06-18T10:00:00-04:00").getTime();
  return getCurrentTime() >= deadlineTime;
}

// -------------------------------------------------------------------------
// PWA Robustness: IndexedDB Offline Queue for Predictions
// -------------------------------------------------------------------------
function getOfflineDB() {
  return new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined' || !indexedDB) {
        reject(new Error("IndexedDB is not supported or restricted in this environment."));
        return;
      }
      const request = indexedDB.open('OfflinePredictionsDB', 2);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (db.objectStoreNames.contains('queue')) {
          db.deleteObjectStore('queue');
        }
        db.createObjectStore('queue', { keyPath: 'match_no' });
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error || new Error("Failed to open IndexedDB"));
    } catch (err) {
      reject(err);
    }
  });
}

async function queueOfflinePrediction(prediction) {
  try {
    const db = await getOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['queue'], 'readwrite');
      const store = transaction.objectStore('queue');
      const request = store.put(prediction);
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error("Error queueing offline prediction:", err);
    return false;
  }
}

async function getPendingPredictions() {
  try {
    const db = await getOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['queue'], 'readonly');
      const store = transaction.objectStore('queue');
      const request = store.getAll();
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error("Error getting pending predictions:", err);
    return [];
  }
}

async function dequeueOfflinePrediction(match_no) {
  try {
    const db = await getOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['queue'], 'readwrite');
      const store = transaction.objectStore('queue');
      const request = store.delete(match_no);
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error("Error dequeuing offline prediction:", err);
    return false;
  }
}

async function syncOfflineQueue() {
  if (!navigator.onLine || !supabaseClient || !STATE.currentUser) return;
  const pending = await getPendingPredictions();
  if (pending.length === 0) return;
  
  console.log(`Syncing ${pending.length} offline predictions...`);
  for (const item of pending) {
    if (item.user_id !== STATE.currentUser.id) {
      await dequeueOfflinePrediction(item.match_no);
      continue;
    }

    // Offline Match Lockout Bypass Check
    const match = STATE.matches.find(m => m.match_no === item.match_no);
    if (!match || isMatchLocked(match)) {
      console.warn(`Match ${item.match_no} is locked/expired or not found. Removing from offline queue without syncing.`);
      await dequeueOfflinePrediction(item.match_no);
      continue;
    }

    try {
      const { error } = await supabaseClient
        .from('predictions')
        .upsert({
          user_id: item.user_id,
          match_no: item.match_no,
          home_score: item.home_score,
          away_score: item.away_score,
          wildcard: item.wildcard
        }, { onConflict: 'user_id,match_no' });
      
      if (!error) {
        await dequeueOfflinePrediction(item.match_no);
      } else {
        console.error(`Error syncing offline prediction for match ${item.match_no}:`, error);
      }
    } catch (err) {
      console.error(`Error syncing offline prediction for match ${item.match_no}:`, err);
    }
  }
  
  await syncFromSupabase();
  recalculateAllPoints();
  renderApp();
  renderMatchesView();
  showToast("PRONÓSTICOS SINCRONIZADOS DESDE LA COLA OFFLINE. ✅");
}

window.addEventListener('online', syncOfflineQueue);

// User Actions: Save predictions
async function saveUserPrediction(matchNo, homeScoreVal, awayScoreVal) {
  if (!STATE.currentUser) {
    showToast("DEBES INICIAR SESIÓN PARA GUARDAR TUS PRONÓSTICOS.", "error");
    return;
  }
  
  const match = STATE.matches.find(m => m.match_no === matchNo);
  if (isMatchLocked(match)) {
    showToast("ESTE PARTIDO ESTÁ BLOQUEADO PARA PREDICCIONES.", "error");
    return;
  }
  
  // Format inputs
  if (homeScoreVal === "" || awayScoreVal === "") {
    // Silently return since user is in the middle of entering the scores
    return;
  }
  
  const hs = parseInt(homeScoreVal, 10);
  const as = parseInt(awayScoreVal, 10);
  
  if (isNaN(hs) || isNaN(as) || hs < 0 || as < 0) {
    showToast("POR FAVOR INGRESE MARCADORES VÁLIDOS.", "error");
    return;
  }
  
  // Update local memory STATE
  if (!STATE.currentUser.predictions[matchNo]) {
    STATE.currentUser.predictions[matchNo] = { home_score: null, away_score: null, wildcard: false };
  }
  STATE.currentUser.predictions[matchNo].home_score = hs;
  STATE.currentUser.predictions[matchNo].away_score = as;
  
  const userInUsers = STATE.users.find(u => u.cedula === STATE.currentUser.cedula);
  if (userInUsers) {
    userInUsers.predictions = STATE.currentUser.predictions;
  }

  if (!navigator.onLine) {
    const predData = {
      user_id: STATE.currentUser.id,
      match_no: matchNo,
      home_score: hs,
      away_score: as,
      wildcard: STATE.currentUser.predictions[matchNo].wildcard
    };
    const queued = await queueOfflinePrediction(predData);
    if (queued) {
      triggerSaveVisualFeedback(matchNo);
      showToast("PRONÓSTICO GUARDADO OFFLINE (SE SINCRONIZARÁ AL VOLVER A LA RED). 📡");
    } else {
      showToast("ERROR AL GUARDAR EL PRONÓSTICO LOCALMENTE.", "error");
    }
    return;
  }
  
  if (!supabaseClient) {
    showToast("ERROR DE CONEXIÓN CON EL SERVIDOR.", "error");
    return;
  }
  
  try {
    const { error } = await supabaseClient
      .from('predictions')
      .upsert({
        user_id: STATE.currentUser.id,
        match_no: matchNo,
        home_score: hs,
        away_score: as,
        wildcard: STATE.currentUser.predictions[matchNo].wildcard
      }, { onConflict: 'user_id,match_no' });
      
    if (error) throw error;
    
    triggerSaveVisualFeedback(matchNo);
  } catch (err) {
    console.warn("Supabase upsert failed silently, falling back to IndexedDB local queue:", err);
    const predData = {
      user_id: STATE.currentUser.id,
      match_no: matchNo,
      home_score: hs,
      away_score: as,
      wildcard: STATE.currentUser.predictions[matchNo].wildcard
    };
    await queueOfflinePrediction(predData);
    triggerSaveVisualFeedback(matchNo);
  }
}

// Explicit edit lock toggler for match card predictions
function toggleEditLock(matchNo) {
  const homeInput = document.getElementById(`home-score-${matchNo}`);
  const awayInput = document.getElementById(`away-score-${matchNo}`);
  const lockBtn = document.getElementById(`lock-btn-${matchNo}`);
  
  if (homeInput && awayInput) {
    const currentlyDisabled = homeInput.disabled;
    if (currentlyDisabled) {
      homeInput.disabled = false;
      awayInput.disabled = false;
      if (lockBtn) {
        lockBtn.innerText = "🔓";
        lockBtn.style.color = "var(--text-secondary)";
      }
      showToast(`PARTIDO #${matchNo} DESBLOQUEADO PARA EDICIÓN.`);
    } else {
      homeInput.disabled = true;
      awayInput.disabled = true;
      if (lockBtn) {
        lockBtn.innerText = "🔒";
        lockBtn.style.color = "var(--accent)";
      }
      showToast(`PARTIDO #${matchNo} BLOQUEADO.`);
    }
  }
}

// Wildcard management
// Toggle Wildcard on match (Only up to 3 wildcards active in total across all matches)
async function toggleWildcard(matchNo) {
  if (!STATE.currentUser) {
    showToast("INICIA SESIÓN PARA USAR TU COMODÍN.", "error");
    return;
  }
  
  const targetMatch = STATE.matches.find(m => m.match_no === matchNo);
  if (isMatchLocked(targetMatch)) {
    showToast("NO PUEDES CAMBIAR EL COMODÍN DE UN PARTIDO BLOQUEADO.", "error");
    return;
  }
  
  // Initialize pred object if empty
  if (!STATE.currentUser.predictions[matchNo]) {
    STATE.currentUser.predictions[matchNo] = { home_score: null, away_score: null, wildcard: false };
  }
  
  const currentlyActive = STATE.currentUser.predictions[matchNo].wildcard;
  const homeScore = STATE.currentUser.predictions[matchNo].home_score;
  const awayScore = STATE.currentUser.predictions[matchNo].away_score;
  
  if (!currentlyActive) {
    // Safety check: must have predicted first
    if (homeScore === null || awayScore === null) {
      showToast("DEBES INGRESAR UN PRONÓSTICO ANTES DE ACTIVAR EL COMODÍN.", "error");
      return;
    }
    
    // Count how many wildcards are already active
    let activeCount = 0;
    STATE.matches.forEach(m => {
      const pred = STATE.currentUser.predictions[m.match_no];
      if (pred && pred.wildcard) {
        activeCount++;
      }
    });
    
    if (activeCount >= 3) {
      showToast("LÍMITE ALCANZADO: SÓLO PUEDES ACTIVAR HASTA 3 COMODINES EN TOTAL.", "error");
      return;
    }
    
    // Assign new wildcard
    STATE.currentUser.predictions[matchNo].wildcard = true;
    showToast(`¡COMODÍN PARLEY ACTIVADO PARA EL PARTIDO ${matchNo}!`);
  } else {
    // Turn it OFF
    STATE.currentUser.predictions[matchNo].wildcard = false;
    showToast("COMODÍN PARLEY DESACTIVADO.");
  }
  
  const userInUsers = STATE.users.find(u => u.cedula === STATE.currentUser.cedula);
  if (userInUsers) {
    userInUsers.predictions = STATE.currentUser.predictions;
  }

  if (!navigator.onLine) {
    const predData = {
      user_id: STATE.currentUser.id,
      match_no: matchNo,
      home_score: STATE.currentUser.predictions[matchNo].home_score,
      away_score: STATE.currentUser.predictions[matchNo].away_score,
      wildcard: STATE.currentUser.predictions[matchNo].wildcard
    };
    const queued = await queueOfflinePrediction(predData);
    if (queued) {
      renderApp();
      renderMatchesView();
      showToast("COMODÍN GUARDADO OFFLINE (SE SINCRONIZARÁ AL VOLVER A LA RED). 📡");
    } else {
      showToast("ERROR AL GUARDAR EL COMODÍN LOCALMENTE.", "error");
    }
    return;
  }
  
  if (!supabaseClient) {
    showToast("ERROR DE CONEXIÓN CON EL SERVIDOR.", "error");
    return;
  }
  
  try {
    const { error } = await supabaseClient
      .from('predictions')
      .upsert({
        user_id: STATE.currentUser.id,
        match_no: matchNo,
        home_score: STATE.currentUser.predictions[matchNo].home_score,
        away_score: STATE.currentUser.predictions[matchNo].away_score,
        wildcard: STATE.currentUser.predictions[matchNo].wildcard
      }, { onConflict: 'user_id,match_no' });
      
    if (error) throw error;
    
    renderApp();
    renderMatchesView();
  } catch (err) {
    console.error("Error toggling wildcard in Supabase", err);
    const predData = {
      user_id: STATE.currentUser.id,
      match_no: matchNo,
      home_score: STATE.currentUser.predictions[matchNo].home_score,
      away_score: STATE.currentUser.predictions[matchNo].away_score,
      wildcard: STATE.currentUser.predictions[matchNo].wildcard
    };
    await queueOfflinePrediction(predData);
    renderApp();
    renderMatchesView();
  }
}

// Tournament Specials: Group Leaders, Champion, Runner-up
async function saveTournamentSpecials(type, val, key = null) {
  if (!supabaseClient) {
    showToast("ERROR DE CONEXIÓN CON EL SERVIDOR.", "error");
    return;
  }
  if (!STATE.currentUser) return;
  if (isSpecialPredictionsLocked()) {
    showToast("LAS PREDICCIONES DE TORNEO ESTÁN CERRADAS.", "error");
    return;
  }
  
  if (type === 'group') {
    // Update local memory STATE
    if (!STATE.currentUser.special_predictions) {
      STATE.currentUser.special_predictions = { group_leaders: {} };
    }
    STATE.currentUser.special_predictions.group_leaders[key] = val;
    
    const userInUsers = STATE.users.find(u => u.cedula === STATE.currentUser.cedula);
    if (userInUsers) {
      userInUsers.special_predictions = STATE.currentUser.special_predictions;
    }
    
    try {
      const { error } = await supabaseClient
        .from('group_leader_predictions')
        .upsert({
          user_id: STATE.currentUser.id,
          group_letter: key,
          team_code: val
        }, { onConflict: 'user_id,group_letter' });
        
      if (error) throw error;
      
      renderApp();
      showToast("PREDICCIONES DE TORNEO ACTUALIZADAS.");
    } catch (err) {
      console.error("Error saving special prediction in Supabase", err);
      showToast("ERROR AL GUARDAR EN EL SERVIDOR.", "error");
    }
  }
}

async function createLeague(nameVal) {
  if (!supabaseClient) {
    showToast("ERROR DE CONEXIÓN CON EL SERVIDOR.", "error");
    return;
  }
  if (!STATE.currentUser) return;
  const name = nameVal.trim();
  if (!name) {
    showToast("POR FAVOR INGRESA UN NOMBRE PARA EL GRUPO.", "error");
    return;
  }
  
  const code = generateCode();
  
  try {
    // 1. Insert league row
    const { data: dbLeague, error: leagueError } = await supabaseClient
      .from('leagues')
      .insert({
        code: code,
        name: name,
        owner_id: STATE.currentUser.id
      })
      .select()
      .single();
      
    if (leagueError) throw leagueError;
    
    // 2. Insert owner as the first member
    const { error: joinError } = await supabaseClient
      .from('league_members')
      .insert({
        league_id: dbLeague.id,
        user_id: STATE.currentUser.id
      });
      
    if (joinError) throw joinError;
    
    showToast(`¡LIGA "${name}" CREADA CON ÉXITO! CÓDIGO: ${code}`);
    
    // Refresh memory and view
    await syncFromSupabase();
    renderLeaguesView();
  } catch (err) {
    console.error("Error creating league in Supabase", err);
    showToast("ERROR AL CREAR LA LIGA EN EL SERVIDOR.", "error");
  }
}

async function joinLeague(codeVal) {
  if (!supabaseClient) {
    showToast("ERROR DE CONEXIÓN CON EL SERVIDOR.", "error");
    return;
  }
  if (!STATE.currentUser) return;
  const code = codeVal.trim().toUpperCase();
  if (code.length !== 5) {
    showToast("EL CÓDIGO DEBE TENER 5 CARACTERES.", "error");
    return;
  }
  
  try {
    // 1. Find league by code
    const { data: dbLeague, error: findError } = await supabaseClient
      .from('leagues')
      .select('id, name')
      .eq('code', code)
      .maybeSingle();
      
    if (findError || !dbLeague) {
      showToast("NO SE ENCONTRÓ NINGÚN GRUPO CON ESE CÓDIGO.", "error");
      return;
    }
    
    // 2. Insert member row
    const { error: joinError } = await supabaseClient
      .from('league_members')
      .insert({
        league_id: dbLeague.id,
        user_id: STATE.currentUser.id
      });
      
    if (joinError) {
      if (joinError.code === '23505') {
        showToast("YA ERES MIEMBRO DE ESTA LIGA.", "error");
      } else {
        throw joinError;
      }
      return;
    }
    
    showToast(`TE HAS UNIDO A LA LIGA "${dbLeague.name}".`);
    
    // Refresh memory and view
    await syncFromSupabase();
    renderLeaguesView();
  } catch (err) {
    console.error("Error joining league in Supabase", err);
    showToast("ERROR AL UNIRSE A LA LIGA EN EL SERVIDOR.", "error");
  }
}

// Authentication & Recovery Temp Variables
let tempRecoveryData = null;async function handleRegister() {
  if (!supabaseClient) {
    showToast("ERROR DE CONEXIÓN CON EL SERVIDOR.", "error");
    return;
  }
  const nameVal = document.getElementById('reg-name').value;
  const parleyUserVal = document.getElementById('reg-parley-username').value;
  const prefix = document.getElementById('reg-cedula-prefix').value;
  const num = document.getElementById('reg-cedula').value;
  const dobVal = document.getElementById('reg-dob').value;
  const emailVal = document.getElementById('reg-email').value;
  const phoneVal = document.getElementById('reg-phone').value;
  const passVal = document.getElementById('reg-password').value;
  const passConfVal = document.getElementById('reg-password-confirm').value;
  
  const cedula = formatCedulaInput(prefix, num);
  
  // Validations
  if (!nameVal.trim() || !parleyUserVal.trim() || !num.trim() || !dobVal.trim() || !emailVal.trim() || !phoneVal.trim() || !passVal || !passConfVal) {
    showToast("TODOS LOS CAMPOS DEL REGISTRO SON OBLIGATORIOS Y DEBEN COMPLETARSE.", "error");
    return;
  }
  
  if (!nameVal.trim()) {
    showToast("EL NOMBRE COMPLETO ES REQUERIDO.", "error");
    return;
  }
  
  if (!parleyUserVal.trim()) {
    showToast("EL USUARIO DE PARLEY.COM.VE ES REQUERIDO.", "error");
    return;
  }
  
  // Strict Regular Expression Check for Venezuelan Cédula de Identidad
  const cedulaRegex = /^(V|E)-[0-9]{6,8}$/;
  if (!cedulaRegex.test(cedula)) {
    showToast("CÉDULA INVÁLIDA. DEBE TENER EL FORMATO V-XXXXXXXX O E-XXXXXXXX.", "error");
    return;
  }
  
  if (!dobVal) {
    showToast("LA FECHA DE NACIMIENTO ES REQUERIDA.", "error");
    return;
  }
  if (!isAdult(dobVal)) {
    showToast("LO SENTIMOS, DEBES SER MAYOR DE 18 AÑOS PARA REGISTRARSE.", "error");
    document.getElementById('age-gate-error').style.display = 'block';
    return;
  }
  
  // Strict Email Validation
  const emailClean = emailVal.trim();
  if (!emailClean) {
    showToast("EL CORREO ELECTRÓNICO ES REQUERIDO.", "error");
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailClean)) {
    showToast("CORREO ELECTRÓNICO CON FORMATO INVÁLIDO.", "error");
    return;
  }
  
  // Strict Mobile phone format validation
  if (!phoneVal.trim()) {
    showToast("EL NÚMERO DE TELÉFONO ES REQUERIDO.", "error");
    return;
  }
  const phoneClean = phoneVal.replace(/\D/g, '');
  const phoneRegex = /^04(12|14|24|16|26)[0-9]{7}$/;
  if (!phoneRegex.test(phoneClean)) {
    showToast("TELÉFONO MÓVIL VENEZOLANO INVÁLIDO. EJEMPLO: 04141234567.", "error");
    return;
  }
  
  if (passVal.length < 6) {
    showToast("LA CONTRASEÑA DEBE TENER AL MENOS 6 CARACTERES.", "error");
    return;
  }
  if (passVal !== passConfVal) {
    showToast("LAS CONTRASEÑAS NO COINCIDEN.", "error");
    return;
  }
  
  try {
    // Register in Supabase Auth (Postgres trigger on_auth_user_created will insert public.profiles row automatically)
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: emailClean,
      password: passVal,
      options: {
        data: {
          name: nameVal.trim(),
          cedula: cedula,
          parley_username: parleyUserVal.trim(),
          phone: phoneClean,
          dob: dobVal
        }
      }
    });
    
    if (authError) {
      showToast("ERROR EN EL REGISTRO: " + authError.message, "error");
      return;
    }
    
    if (authData.session) {
      showToast("¡REGISTRO EXITOSO! BIENVENIDO");
      // Sync state and login details
      await syncFromSupabase();
      closeAuthModal();
      
      // Trigger tutorial onboarding
      API.saveTutorialSeen(cedula, false);
      checkOnboardingTutorial();
      
      // Redraw app and navigate
      renderApp();
      navigateTo('inicio');
    } else {
      showToast("REGISTRO EXITOSO. Por favor confirma tu correo electrónico para iniciar sesión.", "info");
      closeAuthModal();
      openAuthModal('login');
    }
  } catch (err) {
    console.error("Registration error", err);
    showToast("ERROR AL CONECTAR CON EL SERVIDOR.", "error");
  }
}

// Recovery password flows are handled manually via support (redirection to parley.com.ve)

// Admin credentials checks
async function handleAdminLogin(password) {
  if (!supabaseClient) {
    showToast("ERROR DE CONEXIÓN CON EL SERVIDOR.", "error");
    return;
  }
  try {
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('cedula', 'V-12345678')
      .maybeSingle();
      
    if (!profile) {
      showToast("CUENTA DE ADMINISTRADOR NO CONFIGURADA EN EL SERVIDOR.", "error");
      return;
    }
    
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: profile.email,
      password: password
    });
    
    if (error) {
      showToast("CONTRASEÑA DE ADMINISTRADOR INCORRECTA.", "error");
      return;
    }
    
    STATE.adminMode = true;
    await syncFromSupabase();
    showToast("ACCESO DE ADMINISTRADOR CONCEDIDO.");
    renderApp();
    renderAdminView();
  } catch (err) {
    console.error("Admin login error", err);
    showToast("ERROR AL CONECTAR CON EL SERVIDOR.", "error");
  }
}

// Access Login Controller
async function handleLogin(cedulaPrefix, cedulaNum, password) {
  if (!supabaseClient) {
    showToast("ERROR DE CONEXIÓN CON EL SERVIDOR.", "error");
    return false;
  }
  const cedula = formatCedulaInput(cedulaPrefix, cedulaNum);
  
  if (!cedulaNum.trim() || !password) {
    showToast("POR FAVOR INGRESA TU CÉDULA Y CONTRASEÑA.", "error");
    return false;
  }
  
  try {
    // 1. Get user's email by Cédula
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('cedula', cedula)
      .maybeSingle();
      
    if (profileError || !profile) {
      showToast("CÉDULA NO REGISTRADA EN LA POLLA.", "error");
      return false;
    }
    
    // 2. Sign in with the fetched email and password
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: profile.email,
      password: password
    });
    
    if (authError) {
      if (authError.message.includes("Email not confirmed")) {
        showToast("POR FAVOR VERIFICA TU CORREO ELECTRÓNICO PARA ACTIVAR TU CUENTA.", "error");
      } else {
        showToast("CONTRASEÑA INCORRECTA.", "error");
      }
      return false;
    }
    
    showToast("INICIO DE SESIÓN EXITOSO.");
    
    // 3. Sync from Supabase
    await syncFromSupabase();
    
    closeAuthModal();
    renderApp();
    
    if (STATE.currentUser && STATE.currentUser.is_admin) {
      navigateTo('admin');
    } else {
      navigateTo('inicio');
    }
    return true;
  } catch (err) {
    console.error("Login error", err);
    showToast("ERROR AL CONECTAR CON EL SERVIDOR.", "error");
    return false;
  }
}

async function handleLogout() {
  if (!supabaseClient) {
    STATE.currentUser = null;
    STATE.adminMode = false;
    API.setCurrentUser(null);
    showToast("SESIÓN CERRADA LOCALMENTE.");
    renderApp();
    navigateTo('inicio');
    return;
  }
  try {
    await supabaseClient.auth.signOut();
  } catch (err) {
    console.error("Error signing out from Supabase", err);
  }
  
  STATE.currentUser = null;
  STATE.adminMode = false;
  API.setCurrentUser(null);
  
  // Reload profiles map to clear user specific info
  await syncFromSupabase();
  
  showToast("SESIÓN CERRADA.");
  renderApp();
  navigateTo('inicio');
}

// Share app content natively or via clipboard copy fallback
function shareApp() {
  const shareData = {
    title: 'Polla Mundial 2026',
    text: '¡Únete a la Polla Mundialista 2026 de Parley, pronostica los partidos y sube al podio de campeones! ⚽🏆',
    url: window.location.origin + window.location.pathname
  };

  if (navigator.share) {
    navigator.share(shareData)
      .then(() => showToast("¡QUINIELA COMPARTIDA EXITOSAMENTE!"))
      .catch(err => {
        if (err && err.name === 'AbortError') return;
        console.log('Error al compartir:', err);
      });
  } else {
    // Fallback: Copy link to clipboard
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(shareData.url)
          .then(() => showToast("¡ENLACE DE LA QUINIELA COPIADO AL PORTAPAPELES!"))
          .catch(err => showToast("ERROR AL COPIAR EL ENLACE.", "error"));
      } else {
        showToast("COMPARTIR NO COMPATIBLE EN ESTE NAVEGADOR.", "error");
      }
    } catch (err) {
      console.error("Clipboard write failed:", err);
      showToast("ERROR AL COPIAR EL ENLACE.", "error");
    }
  }
}

// User Profile Ticket View
function openTicketModal(user) {
  if (!user) {
    user = STATE.currentUser;
  }
  if (!user) return;
  
  STATE.activeTicketUser = user;
  
  const isMe = STATE.currentUser && STATE.currentUser.cedula === user.cedula;
  document.getElementById('ticket-modal-title-text').innerText = isMe ? "MI TICKET DE PRONÓSTICOS" : `TICKET DE ${user.name.toUpperCase()}`;
  
  const shareBtn = document.getElementById('btn-share-my-ticket');
  if (shareBtn) {
    shareBtn.style.display = isMe ? 'flex' : 'none';
  }
  
  document.getElementById('ticket-user-name').innerText = user.name;
  document.getElementById('ticket-user-id').innerText = user.id;
  document.getElementById('ticket-user-points').innerText = `${user.points} PTS`;
  
  // R3. Player UUID Privacy: Ticket Modal UI visibility
  const idContainer = document.getElementById('ticket-user-id-container');
  if (idContainer) {
    const isAdmin = (STATE.currentUser && STATE.currentUser.is_admin) || STATE.adminMode;
    idContainer.style.display = isAdmin ? 'block' : 'none';
  }
  
  const container = document.getElementById('my-ticket-predictions-container');
  container.innerHTML = "";
  
  STATE.matches.forEach(m => {
    const pred = user.predictions[m.match_no];
    let predText = "Sin pronóstico";
    let wildcardHTML = "";
    let ptsEarned = 0;
    
    if (pred && pred.home_score !== null && pred.away_score !== null) {
      predText = `${pred.home_score} - ${pred.away_score}`;
      if (pred.wildcard) wildcardHTML = ' <span class="vs-wildcard-star">🚨</span>';
      
      // Calculate single match points
      if (m.home_score !== null && m.away_score !== null) {
        let matchPoints = 0;
        if (pred.home_score === m.home_score && pred.away_score === m.away_score) {
          matchPoints = 6;
        } else {
          const r_win = m.home_score > m.away_score ? 'home' : (m.home_score < m.away_score ? 'away' : 'draw');
          const p_win = pred.home_score > pred.away_score ? 'home' : (pred.home_score < pred.away_score ? 'away' : 'draw');
          if (r_win === p_win) {
            matchPoints += 3;
            if (m.home_score !== m.away_score && (m.home_score - m.away_score) === (pred.home_score - pred.away_score)) {
              matchPoints += 2;
            }
          }
        }
        if (pred.wildcard) matchPoints *= 2;
        ptsEarned = matchPoints;
      }
    }
    
    const realText = m.home_score !== null && m.away_score !== null ? `${m.home_score} - ${m.away_score}` : "Por jugar";
    
    const item = document.createElement('div');
    item.className = "ticket-row-item";
    item.innerHTML = `
      <div class="ticket-team-row">
        <div class="ticket-team-col home" style="flex: 1; justify-content: flex-end; text-align: right; min-width: 0; display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600;">
          ${getFlagHTML(m.home_name)}
          <span style="margin-left: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.home_name}</span>
        </div>
        <span class="ticket-score-badge" style="font-weight: 800; font-size: 13px; color: var(--accent); margin: 0 10px; min-width: 60px; text-align: center; white-space: nowrap; flex-shrink: 0;">${predText}${wildcardHTML}</span>
        <div class="ticket-team-col away" style="flex: 1; justify-content: flex-start; text-align: left; min-width: 0; display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600;">
          <span style="margin-right: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.away_name}</span>
          ${getFlagHTML(m.away_name)}
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-top: 4px; flex-wrap: wrap; gap: 4px;">
        <span>Partido #${m.match_no} (${m.group ? `Grupo ${m.group}` : ''})</span>
        <span>Real: <strong style="color: #FFF;">${realText}</strong> | Ganado: <strong style="color: var(--accent);">${ptsEarned} PTS</strong></span>
      </div>
    `;
    container.appendChild(item);
  });
  
  document.getElementById('ticket-modal').classList.add('active');
}

function closeTicketModal() {
  document.getElementById('ticket-modal').classList.remove('active');
}

async function shareUserTicket() {
  const user = STATE.activeTicketUser || STATE.currentUser;
  if (!user) return;
  
  showToast("Generando imagen de tu ticket... ⏳", "info");
  
  try {
    // Load logos and banner
    const logoSrc = "./Icono Oficial de la App.png";
    const parleyLogoSrc = "./PARLEY LOGO - copia (2).png";
    const bannerSrc = "./MUNDIAL DE GANADORES.jpg";
    
    const hash = btoa(user.cedula);
    const shareUrl = `${window.location.origin}${window.location.pathname}?ticket=${hash}`;
    const qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`;
    
    const [logoImg, parleyLogoImg, qrImg, bannerImg] = await Promise.all([
      loadImage(logoSrc),
      loadImage(parleyLogoSrc),
      loadImage(qrCodeSrc),
      loadImage(bannerSrc)
    ]);

    // 5. Reinforce date logic
    const simDate = new Date(getCurrentTime());
    const year = simDate.getFullYear();
    const month = String(simDate.getMonth() + 1).padStart(2, '0');
    const day = String(simDate.getDate()).padStart(2, '0');
    const simDateStr = `${year}-${month}-${day}`; // "YYYY-MM-DD"

    // Get ALL matches of simulated today
    let matchesToShow = STATE.matches.filter(m => m.date.startsWith(simDateStr));
    let targetDayStr = simDateStr;

    if (matchesToShow.length === 0) {
      // Find nearest future date with matches
      const futureMatches = STATE.matches.filter(m => m.date.split(' ')[0] > simDateStr);
      if (futureMatches.length > 0) {
        const sortedFuture = [...futureMatches].sort((a, b) => a.date.localeCompare(b.date));
        targetDayStr = sortedFuture[0].date.split(' ')[0];
        matchesToShow = STATE.matches.filter(m => m.date.startsWith(targetDayStr));
      }
    }

    // Fallback if still empty
    if (matchesToShow.length === 0) {
      const sortedMatches = [...STATE.matches].sort((a, b) => a.date.localeCompare(b.date));
      if (sortedMatches.length > 0) {
        targetDayStr = sortedMatches[sortedMatches.length - 1].date.split(' ')[0];
        matchesToShow = STATE.matches.filter(m => m.date.startsWith(targetDayStr));
      }
    }

    matchesToShow.sort((a, b) => a.match_no - b.match_no);

    let displayDateText = "";
    const parts = targetDayStr.split('-');
    if (parts.length === 3) {
      const months = [
        "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
        "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
      ];
      const dVal = parseInt(parts[2], 10);
      const mIndex = parseInt(parts[1], 10) - 1;
      if (mIndex >= 0 && mIndex < 12) {
        displayDateText = ` (${dVal} DE ${months[mIndex]})`;
      }
    }

    // Dynamic height calculation
    const N = matchesToShow.length;
    const headerHeight = 485;
    const rowHeight = 85;
    const matchesHeight = N * rowHeight;
    const footerHeight = 200;
    const canvasHeight = headerHeight + matchesHeight + footerHeight;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    grad.addColorStop(0, '#13223F');
    grad.addColorStop(1, '#080E1A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, canvasHeight);
    
    // Decorative grid lines
    ctx.strokeStyle = 'rgba(255, 223, 0, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasHeight);
      ctx.stroke();
    }
    for (let j = 0; j < canvasHeight; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(800, j);
      ctx.stroke();
    }
    
    // Draw top central logo
    if (logoImg) {
      ctx.drawImage(logoImg, 400 - 45, 40, 90, 90);
    }
    
    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFDF00';
    ctx.font = '900 36px Outfit, sans-serif';
    ctx.fillText("LA POLLA MUNDIALISTA", 400, 175);
    
    // 1. Symmetrical App Icon on the sides of the title
    if (logoImg) {
      const titleText = "LA POLLA MUNDIALISTA";
      const textWidth = ctx.measureText(titleText).width;
      const iconSize = 45;
      const gap = 15;
      const leftX = 400 - (textWidth / 2) - iconSize - gap;
      const rightX = 400 + (textWidth / 2) + gap;
      const iconY = 175 - 35;
      ctx.drawImage(logoImg, leftX, iconY, iconSize, iconSize);
      ctx.drawImage(logoImg, rightX, iconY, iconSize, iconSize);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 22px Outfit, sans-serif';
    ctx.fillText("TICKET OFICIAL DE PRONÓSTICOS", 400, 210);
    
    // Profile Card background
    drawRoundedRect(ctx, 50, 245, 700, 155, 16);
    ctx.fillStyle = 'rgba(19, 34, 63, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Avatar circle
    ctx.beginPath();
    ctx.arc(110, 322, 42, 0, Math.PI * 2);
    ctx.fillStyle = '#FFDF00';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Avatar text (initials)
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'P';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.font = '900 30px Outfit, sans-serif';
    ctx.fillText(initials, 110, 322);
    
    // Profile info text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 24px Outfit, sans-serif';

    const isTicketUserAdmin = !!(user.is_admin || user.cedula === 'V-12345678');

    if (isTicketUserAdmin) {
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(user.name.toUpperCase(), 170, 310);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 15px Outfit, sans-serif';
      ctx.fillText(`ID JUGADOR: ${user.id}`, 170, 340);
    } else {
      ctx.textBaseline = 'middle';
      ctx.fillText(user.name.toUpperCase(), 170, 322);
    }
    ctx.textBaseline = 'alphabetic'; // Always restore afterwards
    // 2. Remove "Quiniela Patrocinada" text from the ticket profile card
    
    // Score Badge
    drawRoundedRect(ctx, 510, 275, 210, 95, 12);
    ctx.fillStyle = 'rgba(255, 223, 0, 0.08)';
    ctx.fill();
    ctx.strokeStyle = '#FFDF00';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFDF00';
    ctx.font = '900 34px Outfit, sans-serif';
    ctx.fillText(`${user.points} PTS`, 615, 325);
    
    ctx.fillStyle = '#94A3B8';
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.fillText("PUNTAJE ACUMULADO", 615, 350);
    
    // List Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 20px Outfit, sans-serif';
    ctx.fillText("PRONÓSTICOS REGISTRADOS" + displayDateText, 50, 455);
    ctx.fillStyle = '#FFDF00';
    ctx.fillRect(50, 468, 80, 4);
    
    // Pre-load all flag images for matches displayed
    const flagPromises = [];
    matchesToShow.forEach(m => {
      flagPromises.push(loadImage(`https://flagcdn.com/w80/${getFlagCode(m.home_name)}.png`));
      flagPromises.push(loadImage(`https://flagcdn.com/w80/${getFlagCode(m.away_name)}.png`));
    });
    const flagImages = await Promise.all(flagPromises);
    
    // Draw prediction rows
    let startY = 495;
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < matchesToShow.length; i++) {
      const m = matchesToShow[i];
      if (!m) continue;
      
      const pred = user.predictions[m.match_no];
      const hasPred = pred && pred.home_score !== null && pred.away_score !== null;
      const isWildcard = hasPred && pred.wildcard;
      
      const rowY = startY + i * rowHeight;
      
      // Zebra background
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(50, rowY, 700, 75);
      
      // Outline border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeRect(50, rowY, 700, 75);
      
      // Match meta info
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748B';
      ctx.font = '700 11px Outfit, sans-serif';
      ctx.fillText(`PARTIDO #${m.match_no} | ${m.group ? `GRUPO ${m.group}` : 'Fase Grupos'}`, 70, rowY + 20);
      
      // Draw Home flag
      const homeFlagImg = flagImages[i * 2];
      if (homeFlagImg) {
        ctx.drawImage(homeFlagImg, 315, rowY + 26, 35, 23);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(315, rowY + 26, 35, 23);
      }
      
      // Home Name
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 15px Outfit, sans-serif';
      ctx.fillText(m.home_name, 305, rowY + 45);
      
      // Score Badge Box
      drawRoundedRect(ctx, 360, rowY + 20, 80, 35, 6);
      ctx.fillStyle = 'rgba(7, 12, 20, 0.6)';
      ctx.fill();
      ctx.strokeStyle = hasPred ? '#FFDF00' : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      
      // Score Text / stylized S/P
      ctx.textAlign = 'center';
      if (hasPred) {
        ctx.fillStyle = '#FFDF00';
        ctx.font = '900 18px Outfit, sans-serif';
        ctx.fillText(`${pred.home_score} - ${pred.away_score}`, 400, rowY + 37);
      } else {
        // 4. Stylized, centered and serious S/P
        ctx.fillStyle = '#94A3B8';
        ctx.font = '800 16px Outfit, sans-serif';
        ctx.fillText("S/P", 400, rowY + 37);
      }
      
      // Comodín Badge
      if (isWildcard) {
        ctx.fillStyle = '#FF0000';
        ctx.font = '14px Segoe UI Emoji, Apple Color Emoji, sans-serif';
        ctx.fillText("🚨", 425, rowY + 38);
      }
      
      // Draw Away flag
      const awayFlagImg = flagImages[i * 2 + 1];
      if (awayFlagImg) {
        ctx.drawImage(awayFlagImg, 450, rowY + 26, 35, 23);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(450, rowY + 26, 35, 23);
      }
      
      // Away Name
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 15px Outfit, sans-serif';
      ctx.fillText(m.away_name, 495, rowY + 45);
    }
    
    // 6. Bottom Cintillo: Use the image "MUNDIAL DE GANADORES.jpg" as a banner at the bottom of the ticket
    const footerY = headerHeight + matchesHeight;
    if (bannerImg) {
      ctx.drawImage(bannerImg, 0, footerY, 800, footerHeight);
    }
    
    // Draw PARLEY logo from "./PARLEY LOGO - copia (2).png" properly instead of plain text if loaded
    if (parleyLogoImg) {
      ctx.drawImage(parleyLogoImg, 40, footerY + 35, 180, 50);
    } else {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 22px Outfit, sans-serif';
      ctx.fillText("PARLEY.COM.VE", 40, footerY + 65);
    }
    
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFDF00';
    ctx.font = '700 12px Outfit, sans-serif';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.strokeText("DISFRUTA CON LOS MEJORES", 40, footerY + 145);
    ctx.fillText("DISFRUTA CON LOS MEJORES", 40, footerY + 145);
    ctx.strokeText("JUEGA CON RESPONSABILIDAD | +18", 40, footerY + 125);
    ctx.fillText("JUEGA CON RESPONSABILIDAD | +18", 40, footerY + 125);
    
    // QR code background card
    drawRoundedRect(ctx, 630, footerY + 25, 130, 130, 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    if (qrImg) {
      ctx.drawImage(qrImg, 635, footerY + 30, 120, 120);
    }
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFDF00';
    ctx.font = '900 11px Outfit, sans-serif';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.strokeText("ESCANEA PARA JUGAR", 695, footerY + 175);
    ctx.fillText("ESCANEA PARA JUGAR", 695, footerY + 175);
    
    // Convert to blob and share
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error("Blob conversion failed.");
      }
      
      const file = new File([blob], `quiniela_${user.id}.png`, { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: `Mi Ticket - ${user.name}`,
          text: `⚽ ¡Mira mi ticket de pronósticos para el Mundial! Llevo acumulados ${user.points} PTS. ¿Crees que puedes superarme? ¡Juega gratis en Polla Mundialista!🏆 `
        }).then(() => {
          showToast("¡IMAGEN DEL TICKET COMPARTIDA! 🚀");
        }).catch((err) => {
          if (err && err.name === 'AbortError') return;
          downloadTicketImage(blob, user.id);
        });
      } else {
        downloadTicketImage(blob, user.id);
      }
    }, 'image/png');
    
  } catch (error) {
    console.error("Error drawing ticket canvas:", error);
    showToast("Error al generar imagen de ticket.", "error");
    
    const hash = btoa(user.cedula);
    const shareUrl = `${window.location.origin}${window.location.pathname}?ticket=${hash}`;
    copyTextToClipboard(shareUrl, `⚽ ¡Mira mi ticket de pronósticos para el Mundial! Llevo acumulados ${user.points} PTS.`);
  }
}

// Helper: Load Image dynamically with CORS support
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn("Failed to load image resource for canvas:", src);
      resolve(null);
    };
    img.src = src;
  });
}

// Helper: Canvas Rounded Rectangle
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper: Trigger browser download for desktop fallback
function downloadTicketImage(blob, userId) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quiniela_ticket_${userId}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("TICKET DESCARGADO EN IMAGEN. ¡YA PUEDES SUBIRLO A TUS REDES! 🚀");
}

function copyTextToClipboard(url, introText) {
  const fullText = `${introText}\n${url}`;
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(fullText).then(() => {
        showToast("¡ENLACE DE TICKET COPIADO AL PORTAPAPELES!");
      }).catch(err => {
        fallbackCopyText(fullText);
      });
    } else {
      fallbackCopyText(fullText);
    }
  } catch (err) {
    console.error("Clipboard write failed:", err);
    fallbackCopyText(fullText);
  }
}

function fallbackCopyText(fullText) {
  try {
    const el = document.createElement('textarea');
    el.value = fullText;
    el.style.position = 'fixed';
    el.style.top = '-9999px';
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand('copy');
    document.body.removeChild(el);
    if (success) {
      showToast("¡ENLACE DE TICKET COPIADO AL PORTAPAPELES!");
    } else {
      showToast("ERROR AL COPIAR EL ENLACE.", "error");
    }
  } catch (err) {
    console.error("Legacy copy failed:", err);
    showToast("ERROR AL COPIAR EL ENLACE.", "error");
  }
}

// Mobile touch gestures swipe navigation between spa sections
let touchstartX = 0;
let touchendX = 0;

function handleSwipeGesture(e) {
  // Avoid conflicts inside scrollable blocks or interactive components
  if (e.target.closest('.bracket-wrapper') || e.target.closest('.special-pred-grid') || e.target.closest('input') || e.target.closest('select') || e.target.closest('button')) {
    return;
  }

  const sectionsList = ['inicio', 'pronosticos', 'clasificacion', 'grupos'];
  if (STATE.adminMode) {
    sectionsList.push('admin');
  }
  
  const activeSection = document.querySelector('.app-section.active');
  if (!activeSection) return;
  const currentId = activeSection.id;
  const currentIndex = sectionsList.indexOf(currentId);
  if (currentIndex === -1) return;
  
  const swipeThreshold = 80; // minimum touch drag distance
  const diff = touchstartX - touchendX;
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swipe left -> Next tab
      if (currentIndex < sectionsList.length - 1) {
        navigateTo(sectionsList[currentIndex + 1]);
      }
    } else {
      // Swipe right -> Previous tab
      if (currentIndex > 0) {
        navigateTo(sectionsList[currentIndex - 1]);
      }
    }
  }
}

document.addEventListener('touchstart', e => {
  touchstartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', e => {
  touchendX = e.changedTouches[0].screenX;
  handleSwipeGesture(e);
}, { passive: true });

// Onboarding welcome tutorial slides controller
let currentTutorialSlide = 0;
function checkOnboardingTutorial() {
  if (!STATE.currentUser) return;
  const seen = API.getTutorialSeen(STATE.currentUser.cedula);
  if (!seen) {
    openTutorialModal();
  }
}

function openTutorialModal() {
  document.getElementById('tutorial-modal').classList.add('active');
  showTutorialSlide(0);
}

function closeTutorialModal() {
  document.getElementById('tutorial-modal').classList.remove('active');
  if (STATE.currentUser) {
    API.saveTutorialSeen(STATE.currentUser.cedula, true);
  }
}

function showTutorialSlide(index) {
  const slides = document.querySelectorAll('.tutorial-slide');
  const dots = document.querySelectorAll('.tutorial-dots .dot');
  
  slides.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));
  
  currentTutorialSlide = index;
  slides[index].classList.add('active');
  dots[index].classList.add('active');
  
  // Update buttons
  const btnNext = document.getElementById('btn-tutorial-next');
  if (index === slides.length - 1) {
    btnNext.innerText = "¡EMPEZAR A JUGAR!";
  } else {
    btnNext.innerText = "SIGUIENTE";
  }
}

function nextTutorialSlide() {
  const slides = document.querySelectorAll('.tutorial-slide');
  if (currentTutorialSlide < slides.length - 1) {
    showTutorialSlide(currentTutorialSlide + 1);
  } else {
    closeTutorialModal();
  }
}

// Grades a user prediction for VS display
function gradePrediction(pred, match) {
  if (match.home_score === null || match.away_score === null) {
    return { class: "neutral", text: "PENDIENTE" };
  }
  if (!pred || pred.home_score === null || pred.away_score === null) {
    return { class: "wrong", text: "✕ SIN PRED" };
  }
  
  const H_p = pred.home_score;
  const A_p = pred.away_score;
  const H_r = match.home_score;
  const A_r = match.away_score;
  
  let earned = 0;
  let isExact = false;
  
  if (H_p === H_r && A_p === A_r) {
    earned = 6;
    isExact = true;
  } else {
    const r_winner = H_r > A_r ? 'home' : (H_r < A_r ? 'away' : 'draw');
    const p_winner = H_p > A_p ? 'home' : (H_p < A_p ? 'away' : 'draw');
    
    if (r_winner === p_winner) {
      earned += 3;
      if (H_r !== A_r && (H_r - A_r) === (H_p - A_p)) {
        earned += 2;
      }
    }
  }
  
  if (pred.wildcard) {
    earned *= 2;
  }
  
  if (isExact) {
    return { class: "exact", text: `⭐ EXACTO (+${earned})` };
  } else if (earned > 0) {
    return { class: "correct", text: `✓ ACIERTO (+${earned})` };
  } else {
    return { class: "wrong", text: "✕ ERRADO (0)" };
  }
}

// Head-to-Head Compare Controller
async function openVSModal(cedulaB) {
  if (!STATE.currentUser) {
    showToast("INICIA SESIÓN PARA COMPARAR PREDICCIONES.", "error");
    return;
  }
  
  const userA = STATE.users.find(u => u.cedula === STATE.currentUser.cedula);
  const userB = STATE.users.find(u => u.cedula === cedulaB);
  
  if (!userA || !userB) return;

  // Load predictions and specials on-demand
  if (!userA.predictionsLoaded && !userA.is_mock) {
    try {
      const loadedDataA = await loadUserData(userA.id);
      if (loadedDataA) {
        Object.assign(userA, loadedDataA);
      }
    } catch (err) {
      console.error("Error loading user data A for compare modal:", err);
      showToast("ERROR AL CARGAR TUS DATOS DE PRONÓSTICOS.", "error");
      closeVSModal();
      return;
    }
  }

  if (!userB.predictionsLoaded && !userB.is_mock) {
    try {
      const loadedDataB = await loadUserData(userB.id);
      if (loadedDataB) {
        Object.assign(userB, loadedDataB);
      }
    } catch (err) {
      console.error("Error loading user data B for compare modal:", err);
      showToast("ERROR AL CARGAR DATOS DEL USUARIO A COMPARAR.", "error");
      closeVSModal();
      return;
    }
  }
  
  document.getElementById('vs-name-a').innerText = userA.name;
  document.getElementById('vs-name-b').innerText = userB.name;
  document.getElementById('vs-pts-a').innerText = `${userA.points} pts`;
  document.getElementById('vs-pts-b').innerText = `${userB.points} pts`;
  
  // Compare row render
  const container = document.getElementById('vs-comparisons-container');
  container.innerHTML = "";
  
  STATE.matches.forEach((m, index) => {
    const predA = userA.predictions[m.match_no];
    const predB = userB.predictions[m.match_no];
    const locked = isMatchLocked(m);
    
    // Grade predictions
    const gradeA = gradePrediction(predA, m);
    let gradeB = { class: "neutral", text: "PENDIENTE" };
    
    // Formatting predictions displays
    let displayA = "S/P";
    if (predA && predA.home_score !== null && predA.away_score !== null) {
      displayA = `${predA.home_score} - ${predA.away_score}`;
      if (predA.wildcard) displayA += ' <span class="vs-wildcard-star">🚨</span>';
    }
    
    let displayB = "S/P";
    if (predB && predB.home_score !== null && predB.away_score !== null) {
      if (locked || userB.cedula === userA.cedula) {
        displayB = `${predB.home_score} - ${predB.away_score}`;
        if (predB.wildcard) displayB += ' <span class="vs-wildcard-star">🚨</span>';
        gradeB = gradePrediction(predB, m);
      } else {
        displayB = "🔒 OCULTO";
        gradeB = { class: "neutral", text: "OCULTO" };
      }
    } else {
      if (locked) {
        gradeB = { class: "wrong", text: "✕ SIN PRED" };
      }
    }
    
    // Row elements
    const item = document.createElement('div');
    item.className = 'vs-compare-card';
    item.style.animationDelay = `${index * 0.02}s`;
    
    // Teams labels
    const homeFlag = getFlagHTML(m.home_name);
    const awayFlag = getFlagHTML(m.away_name);
    
    let realScoreText = "-";
    if (m.home_score !== null && m.away_score !== null) {
      realScoreText = `${m.home_score} - ${m.away_score}`;
    }
    
    item.innerHTML = `
      <div class="vs-match-info">
        <span>Partido ${m.match_no} (${m.stage.toUpperCase()})</span>
        <span style="color:var(--text-muted); font-weight:normal;">Grupo ${m.group}</span>
      </div>
      <div class="vs-teams-row">
        <div class="vs-team-display home">
          <span class="vs-country">${m.home_name.toUpperCase()}</span>
          ${homeFlag}
        </div>
        <div class="vs-real-badge">${realScoreText}</div>
        <div class="vs-team-display away">
          ${awayFlag}
          <span class="vs-country">${m.away_name.toUpperCase()}</span>
        </div>
      </div>
      <div class="vs-compare-predictions">
        <div class="vs-pred-side home-side">
          <span class="vs-pred-user-label">Tú</span>
          <span class="vs-pred-val">${displayA}</span>
          ${gradeA.text ? `<span class="vs-grade-tag ${gradeA.class}">${gradeA.text}</span>` : ''}
        </div>
        <div class="vs-compare-vs-text">VS</div>
        <div class="vs-pred-side away-side">
          <span class="vs-pred-user-label">${userB.name.split(' ')[0]}</span>
          <span class="vs-pred-val">${displayB}</span>
          ${gradeB.text ? `<span class="vs-grade-tag ${gradeB.class}">${gradeB.text}</span>` : ''}
        </div>
      </div>
    `;
    container.appendChild(item);
  });
  
  document.getElementById('vs-modal').classList.add('active');
}

function closeVSModal() {
  document.getElementById('vs-modal').classList.remove('active');
}

// Time synchronization and simulation functions
async function syncRealTime() {
  try {
    const start = Date.now();
    // Fetch headers of the current page to get network time
    const response = await fetch(window.location.href, { method: 'HEAD', cache: 'no-cache' });
    const serverDateStr = response.headers.get('Date');
    if (serverDateStr) {
      const serverTime = new Date(serverDateStr).getTime();
      const latency = (Date.now() - start) / 2;
      STATE.realTimeOffset = (serverTime + latency) - Date.now();
      console.log("Real time synced with server. Offset (ms):", STATE.realTimeOffset);
      return;
    }
  } catch (e) {
    console.warn("Failed to sync time with server. Trying public API...", e);
  }

  // Fallback to public worldtimeapi
  try {
    const start = Date.now();
    const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
    const data = await response.json();
    if (data && data.utc_datetime) {
      const serverTime = new Date(data.utc_datetime).getTime();
      const latency = (Date.now() - start) / 2;
      STATE.realTimeOffset = (serverTime + latency) - Date.now();
      console.log("Real time synced with WorldTimeAPI. Offset (ms):", STATE.realTimeOffset);
      return;
    }
  } catch (e) {
    console.warn("Failed to sync time with public API. Using device clock fallback.", e);
  }
  
  STATE.realTimeOffset = 0;
}

function getCurrentTime() {
  if (STATE.simulatorEnabled) {
    return STATE.simulatedTime;
  } else {
    return Date.now() + (STATE.realTimeOffset || 0);
  }
}

function backupRealState() {
  if (localStorage.getItem('parley_wc_simulator_backup_active') === 'true') {
    console.log("Real backup already exists. Skipping backup.");
    return;
  }
  
  localStorage.setItem('parley_wc_simulator_backup_active', 'true');
  localStorage.setItem('parley_wc_real_matches', JSON.stringify(STATE.matches));
  localStorage.setItem('parley_wc_real_users', JSON.stringify(STATE.users));
  localStorage.setItem('parley_wc_real_leagues', JSON.stringify(STATE.leagues));
  localStorage.setItem('parley_wc_real_tournament_finished', STATE.tournamentFinished ? 'true' : 'false');
  localStorage.setItem('parley_wc_real_group_standings_overrides', JSON.stringify(STATE.groupStandingsOverrides));
  console.log("Real state backed up successfully.");
}

function restoreRealState() {
  if (localStorage.getItem('parley_wc_simulator_backup_active') !== 'true') {
    console.log("No backup found to restore.");
    return;
  }
  
  const realMatches = localStorage.getItem('parley_wc_real_matches');
  const realUsers = localStorage.getItem('parley_wc_real_users');
  const realLeagues = localStorage.getItem('parley_wc_real_leagues');
  const realFinished = localStorage.getItem('parley_wc_real_tournament_finished') === 'true';
  const realOverrides = localStorage.getItem('parley_wc_real_group_standings_overrides');
  
  if (realMatches) {
    STATE.matches = JSON.parse(realMatches);
    saveMatchesToLocalStorage();
  }
  if (realUsers) {
    STATE.users = JSON.parse(realUsers);
    saveUsersToLocalStorage();
  }
  if (realLeagues) {
    STATE.leagues = JSON.parse(realLeagues);
    saveLeaguesToLocalStorage();
  }
  STATE.tournamentFinished = realFinished;
  API.saveTournamentFinished(realFinished);
  
  if (realOverrides) {
    STATE.groupStandingsOverrides = JSON.parse(realOverrides);
    localStorage.setItem('group_standings_overrides', realOverrides);
  }
  
  // Clear backup keys
  localStorage.removeItem('parley_wc_simulator_backup_active');
  localStorage.removeItem('parley_wc_real_matches');
  localStorage.removeItem('parley_wc_real_users');
  localStorage.removeItem('parley_wc_real_leagues');
  localStorage.removeItem('parley_wc_real_tournament_finished');
  localStorage.removeItem('parley_wc_real_group_standings_overrides');
  
  console.log("Real state restored successfully.");
  
  if (STATE.currentUser) {
    const stillExists = STATE.users.find(u => u.cedula === STATE.currentUser.cedula);
    if (!stillExists) {
      handleLogout();
    } else {
      STATE.currentUser = stillExists;
    }
  }
}

function toggleSimulator(enabled) {
  STATE.simulatorEnabled = enabled;
  localStorage.setItem('parley_wc_simulator_enabled', enabled ? 'true' : 'false');
  
  const statusLabel = document.getElementById('sim-status-label');
  const controlsWrapper = document.getElementById('sim-controls-wrapper');
  
  if (enabled) {
    if (statusLabel) {
      statusLabel.innerText = "SIMULADOR: ENCENDIDO";
      statusLabel.style.color = "var(--accent)";
    }
    if (controlsWrapper) {
      controlsWrapper.style.opacity = "1";
      controlsWrapper.style.pointerEvents = "auto";
    }
    
    backupRealState();
    updateDatetimePickerUI();
    showToast("MODO SIMULADOR ACTIVADO. Cambios temporales para testeo.", "warning");
  } else {
    if (statusLabel) {
      statusLabel.innerText = "SIMULADOR: APAGADO";
      statusLabel.style.color = "var(--text-secondary)";
    }
    if (controlsWrapper) {
      controlsWrapper.style.opacity = "0.5";
      controlsWrapper.style.pointerEvents = "none";
    }
    
    restoreRealState();
    showToast("MODO SIMULADOR DESACTIVADO. Datos reales restablecidos.");
  }
  
  recalculateAllPoints();
  renderApp();
  if (STATE.adminMode) {
    renderAdminView();
  }
}

function adjustSimulatedTime(minutes) {
  if (!STATE.simulatorEnabled) return;
  const newTimestamp = STATE.simulatedTime + (minutes * 60 * 1000);
  const minTime = new Date("2026-06-01T00:00:00-04:00").getTime();
  const maxTime = new Date("2026-06-30T23:59:59-04:00").getTime();
  const clampedTime = Math.max(minTime, Math.min(maxTime, newTimestamp));
  
  updateSimulatedTime(clampedTime);
  updateDatetimePickerUI();
}

function handleDatetimePickerChange(value) {
  if (!STATE.simulatorEnabled || !value) return;
  const newTimestamp = new Date(value).getTime();
  updateSimulatedTime(newTimestamp);
}

function updateDatetimePickerUI() {
  const picker = document.getElementById('sim-datetime-picker');
  if (picker && STATE.simulatedTime) {
    const d = new Date(STATE.simulatedTime);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISODate = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    picker.value = localISODate;
  }
}

// Admin Panel Controller: Simulated time settings
function updateSimulatedTime(timestamp) {
  STATE.simulatedTime = timestamp;
  API.saveSimulatedTime(timestamp);
  
  // Format simulated time string
  const dateObj = new Date(timestamp);
  const display = document.getElementById('sim-time-display');
  if (display) {
    display.innerText = dateObj.toLocaleString() + (STATE.simulatorEnabled ? " (SIMULADO)" : " (REAL)");
  }
  
  // Re-run lock check and UI update
  renderMatchesView();
  renderSpecialPredictionsView();
}

// Admin Controller: Mock User Generator (10-100 Competitors)
function generateMockUsers(count) {
  const mockNames = [
    "José Rodríguez", "María González", "Carlos Hernández", "Juan Martínez", "Luis Pérez",
    "Ana Gómez", "Carmen Sánchez", "Francisco Díaz", "Jesús Alvarez", "Manuel Ruiz",
    "Alejandro Sosa", "Margarita Silva", "Rafael Rojas", "Daniela Mendoza", "Andrés Castro",
    "Gabriela Ortiz", "Pedro Morales", "Lucía Jiménez", "Miguel Castillo", "Patricia Romero"
  ];
  
  const generatedMocks = [];
  
  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * mockNames.length);
    const mockName = `${mockNames[index]} #${Math.floor(Math.random() * 900 + 100)}`;
    const mockCedula = `V-${Math.floor(Math.random() * 20000000 + 10000000)}`;
    
    // Random birthdate for adults
    const randomYear = Math.floor(Math.random() * 30 + 1970);
    const randomMonth = String(Math.floor(Math.random() * 12 + 1)).padStart(2, '0');
    const randomDay = String(Math.floor(Math.random() * 28 + 1)).padStart(2, '0');
    const dob = `${randomYear}-${randomMonth}-${randomDay}`;
    
    const mockPredictions = {};
    
    // Populate predictions randomly
    STATE.matches.forEach(m => {
      // Plausible scores (mostly 0 to 3 goals)
      const hs = Math.floor(Math.random() * 4);
      const as = Math.floor(Math.random() * 4);
      mockPredictions[m.match_no] = {
        home_score: hs,
        away_score: as,
        wildcard: false
      };
    });
    
    // Assign between 1 and 3 wildcards randomly across all matches
    if (STATE.matches.length > 0) {
      const shuffledMatches = [...STATE.matches].sort(() => 0.5 - Math.random());
      const maxWcs = Math.floor(Math.random() * 3) + 1; // 1, 2 or 3 wildcards
      let assignedCount = 0;
      for (let mIdx = 0; mIdx < shuffledMatches.length; mIdx++) {
        if (assignedCount >= maxWcs) break;
        const m = shuffledMatches[mIdx];
        if (mockPredictions[m.match_no]) {
          mockPredictions[m.match_no].wildcard = true;
          assignedCount++;
        }
      }
    }
    
    // Special predictions selection: Select leader for each group A-L
    const groupLeadersPick = {};
    Object.entries(STATE.groups).forEach(([grp, list]) => {
      const randomTeam = list[Math.floor(Math.random() * list.length)];
      groupLeadersPick[grp] = randomTeam.id;
    });
    
    const mockUser = {
      cedula: mockCedula,
      id: generateUserID(),
      name: mockName,
      dob: dob,
      parley_username: "parley_" + mockName.toLowerCase().replace(/\s+/g, "_").replace(/#/g, ""),
      predictions: mockPredictions,
      special_predictions: {
        group_leaders: groupLeadersPick
      },
      points: 0,
      points_breakdown: { exacts: 0, simple_1x2: 0, exact_gd: 0, group_leaders_points: 0, badges_points: 0 },
      badges: [],
      is_mock: true
    };
    
    generatedMocks.push(mockUser);
  }
  
  // Filter out previous mocks
  STATE.users = STATE.users.filter(u => !u.is_mock);
  STATE.users.push(...generatedMocks);
  
  recalculateAllPoints();
  saveUsersToLocalStorage();
  showToast(`¡SE GENERARON ${count} COMPETIDORES SIMULADOS CON ÉXITO!`);
  renderApp();
}

// Admin Controller: Tournament score simulator
// Admin Controller: Tournament score simulator (restricted to Group Stage)
function simulateTournamentResults(mode) {
  STATE.matches.forEach(m => {
    // Generate realistic football scores
    const hs = Math.floor(Math.random() * 3);
    const as = Math.floor(Math.random() * 3);
    
    m.home_score = hs;
    m.away_score = as;
  });
  
  saveMatchesToLocalStorage();
  recalculateAllPoints();
  showToast("FASE DE GRUPOS SIMULADA CON ÉXITO.");
  renderApp();
}

// Admin Reset Data
function resetAllData() {
  const firstConfirm = confirm("¿Está seguro de que desea restablecer por completo la base de datos de la Polla Mundial?");
  if (!firstConfirm) return;

  const secondConfirm = confirm("⚠️ ATENCIÓN: Esta acción eliminará a todos los usuarios registrados, sus predicciones y ligas de forma irreversible. ¿Realmente desea continuar?");
  if (!secondConfirm) return;

  localStorage.removeItem('parley_wc_matches');
  localStorage.removeItem('parley_wc_users');
  localStorage.removeItem('parley_wc_leagues');
  localStorage.removeItem('parley_wc_sim_time');
  localStorage.removeItem('parley_wc_current_user');
  localStorage.removeItem('parley_wc_tournament_finished');
  localStorage.removeItem('group_standings_overrides');
  
  STATE.simulatedTime = new Date("2026-06-11T12:00:00-04:00").getTime();
  STATE.currentUser = null;
  STATE.adminMode = false;
  STATE.groupStandingsOverrides = {};
  STATE.tempOverrideTeams = [];
  
  initDatabase();
  showToast("BASE DE DATOS RESETEADA AL ESTADO INICIAL.");
  navigateTo('inicio');
}

// Navigation Controller
function navigateTo(sectionId) {
  if (sectionId !== 'shared-ticket-section') {
    sessionStorage.setItem('active_section', sectionId);
  }
  const sections = document.querySelectorAll('.app-section');
  sections.forEach(s => s.classList.remove('active'));
  
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active');
  }
  
  const navItems = document.querySelectorAll('.mobile-nav-bar .nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
    const onClickAttr = item.getAttribute('onclick');
    if (onClickAttr && onClickAttr.includes(sectionId)) {
      item.classList.add('active');
    }
  });
  
  const navBar = document.querySelector('.mobile-nav-bar');
  if (navBar) {
    navBar.style.display = (sectionId === 'shared-ticket-section') ? 'none' : 'flex';
  }
  
  // Load view content dynamically
  if (sectionId === 'inicio') renderDashboardView();
  else if (sectionId === 'pronosticos') renderMatchesView();
  else if (sectionId === 'clasificacion') renderLeaguesView();
  else if (sectionId === 'grupos') renderGroupsView();
  else if (sectionId === 'admin') renderAdminView();
  
  // Close any open slide panel/overlays
  closeAuthModal();
}

// View Renderer: Dashboard
function renderDashboardView() {
  if (!STATE.currentUser) {
    document.getElementById('logged-out-hero').style.display = 'flex';
    document.getElementById('logged-in-dashboard').style.display = 'none';
    return;
  }
  
  document.getElementById('logged-out-hero').style.display = 'none';
  document.getElementById('logged-in-dashboard').style.display = 'block';
  
  const user = STATE.users.find(u => u.cedula === STATE.currentUser.cedula);
  
  // Clear any existing celebration card
  const existingCelebration = document.getElementById('dashboard-celebration-card');
  if (existingCelebration) {
    existingCelebration.remove();
  }
  
  if (checkTournamentFinished()) {
    // Calculate rank (excluding the administrator)
    const sorted = sortUsersLeaderboard(STATE.users.filter(u => u.cedula !== "V-12345678"));
    const rank = sorted.findIndex(u => u.cedula === user.cedula) + 1;
    
    const card = document.createElement('div');
    card.id = 'dashboard-celebration-card';
    
    if (rank === 1) {
      card.className = 'winner-card gold-theme';
      card.innerHTML = `
        <span class="winner-trophy">🏆</span>
        <div class="winner-title">¡1ER LUGAR - CAMPEÓN GLOBAL!</div>
        <p style="font-size:14px; color:#FFF; font-weight:700; text-transform:uppercase;">¡FELICITACIONES CAMPEÓN! HAS CONQUISTADO LA POLLA MUNDIALISTA PARLEY 2026 CON UNA PREDICCIÓN EXCEPCIONAL.</p>
        <p style="font-size:12px; color:var(--accent); margin-top:10px; font-weight:bold;">ID DE USUARIO: ${user.id} | PUNTAJE: ${user.points} PTS</p>
      `;
    } else if (rank === 2) {
      card.className = 'winner-card silver-theme';
      card.innerHTML = `
        <span class="winner-trophy">🥈</span>
        <div class="winner-title">¡2DO LUGAR - SUBCAMPEÓN!</div>
        <p style="font-size:14px; color:#FFF; font-weight:700; text-transform:uppercase;">¡INCREÍBLE DESEMPEÑO! TE HAS LLEVADO EL SEGUNDO PUESTO EN EL PODIO DE GANADORES.</p>
        <p style="font-size:12px; color:#E2E8F0; margin-top:10px; font-weight:bold;">ID DE USUARIO: ${user.id} | PUNTAJE: ${user.points} PTS</p>
      `;
    } else if (rank === 3) {
      card.className = 'winner-card bronze-theme';
      card.innerHTML = `
        <span class="winner-trophy">🥉</span>
        <div class="winner-title">¡3ER LUGAR - PODIO COMPLETO!</div>
        <p style="font-size:14px; color:#FFF; font-weight:700; text-transform:uppercase;">¡GRAN CAMPAÑA! TE SUBES AL PODIO NACIONAL EN EL TERCER PUESTO DE HONOR.</p>
        <p style="font-size:12px; color:var(--accent-orange); margin-top:10px; font-weight:bold;">ID DE USUARIO: ${user.id} | PUNTAJE: ${user.points} PTS</p>
      `;
    } else {
      card.className = 'winner-card';
      card.style.background = 'rgba(255, 255, 255, 0.03)';
      card.style.borderColor = 'var(--border-sutil)';
      card.innerHTML = `
        <span style="font-size:40px;">👏</span>
        <div class="winner-title" style="color:#FFF;">¡GRACIAS POR PARTICIPAR!</div>
        <p style="font-size:13px; color:var(--text-secondary); text-transform:uppercase; line-height:1.4;">Felicitaciones por tu esfuerzo, constancia y gran ánimo deportivo a lo largo de toda la Fase de Grupos de la Polla.</p>
        <p style="font-size:12px; color:var(--text-muted); margin-top:10px; font-weight:bold;">TU POSICIÓN FINAL: #${rank} | PUNTAJE: ${user.points} PTS</p>
      `;
    }
    
    // Prepend to dashboard element
    const dashEl = document.getElementById('logged-in-dashboard');
    dashEl.insertBefore(card, dashEl.firstChild);
  }
  
  document.getElementById('dash-user-name').innerText = user.name;
  document.getElementById('dash-user-points').innerText = `${user.points} PUNTOS`;
  
  // Stats
  const exacts = user.points_breakdown ? (user.points_breakdown.exacts / 6) : 0;
  const correct1x2 = user.points_breakdown ? (user.points_breakdown.simple_1x2 / 3) : 0;
  
  document.getElementById('stat-exacts').innerText = exacts;
  document.getElementById('stat-1x2').innerText = correct1x2;
  
  // Streak calculations and rendering
  const streakData = calculateUserStreak(user);
  document.getElementById('dash-current-streak').innerText = `${streakData.currentStreak} PARTIDO${streakData.currentStreak === 1 ? '' : 'S'} CONSECUTIVO${streakData.currentStreak === 1 ? '' : 'S'}`;
  document.getElementById('dash-max-streak').innerText = `${streakData.maxStreak} 🔥`;
  
  // Render badges
  const badgesContainer = document.getElementById('dash-badges-container');
  const allAvailableBadges = [
    { id: "Ojo Clínico", icon: "👁️", desc: "Acertar 3 marcadores exactos" },
    { id: "Ganador Frecuente", icon: "🏆", desc: "Acertar 15 ganadores simples (1X2)" },
    { id: "Pronosticador Activo", icon: "⚡", desc: "Pronosticar más de 50 juegos" },
    { id: "Oráculo de Grupos", icon: "🔮", desc: "Acertar 6 líderes de grupo oficiales" },
    { id: "HAT-TRICK VIP", icon: "👑", desc: "Requisitos: 3 tickets ganadores en Parley VIP de al menos 3 logros cada ticket y sin repetir partidos (TODOS DEBEN SER JUEGOS DEL MUNDIAL)" }
  ];
  
  badgesContainer.innerHTML = "";
  allAvailableBadges.forEach(b => {
    const hasBadge = user.badges ? user.badges.includes(b.id) : false;
    const item = document.createElement('div');
    item.className = `badge-item ${hasBadge ? 'active' : ''}`;
    item.title = b.desc;
    item.innerHTML = `
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-name">${b.id}</div>
    `;
    item.onclick = () => openBadgeModal(b.id, b.icon, b.desc, hasBadge);
    badgesContainer.appendChild(item);
  });
}

// View Renderer: Matches Predictions
let activeMatchSubTab = 'group'; // default sub-tab
function setMatchSubTab(tabName) {
  activeMatchSubTab = tabName;
  const buttons = document.querySelectorAll('.toggle-tab-sub-btn');
  buttons.forEach(b => b.classList.remove('active'));
  
  event.target.classList.add('active');
  renderMatchesView();
}

function renderMatchesView() {
  const container = document.getElementById('matches-scroller');
  container.innerHTML = "";
  
  if (activeMatchSubTab === 'specials') {
    renderSpecialPredictionsView();
    return;
  }
  
  // Filter matches
  let filtered = STATE.matches;
  if (activeMatchSubTab === 'group') {
    filtered = STATE.matches.filter(m => m.stage === 'group');
  } else if (activeMatchSubTab === 'knockouts') {
    filtered = STATE.matches.filter(m => m.stage !== 'group');
  }
  
  // Resolve Brackets dynamic outcomes (advances team names)
  resolveBrackets(STATE.matches);
  
  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-secondary);">No hay partidos en esta etapa.</div>`;
    return;
  }
  
  // Generate HTML for each card
  filtered.forEach(m => {
    const locked = isMatchLocked(m);
    
    // User prediction values
    let predHomeVal = "";
    let predAwayVal = "";
    let wildcardActive = false;
    
    if (STATE.currentUser) {
      const pred = STATE.currentUser.predictions[m.match_no];
      if (pred) {
        predHomeVal = pred.home_score !== null ? pred.home_score : "";
        predAwayVal = pred.away_score !== null ? pred.away_score : "";
        wildcardActive = pred.wildcard || false;
      }
    }
    
    // Check if predictions are filled and page editing should lock automatically
    const isEditLocked = (predHomeVal !== "" && predAwayVal !== "");
    
    const card = document.createElement('div');
    card.className = `match-card ${locked ? 'locked' : ''}`;
    
    const homeFlag = getFlagHTML(m.home_name);
    const awayFlag = getFlagHTML(m.away_name);
    
    // Score display for locked matches / real outcomes
    let realScoreHTML = `
      <div class="score-inputs-wrapper" id="score-wrapper-${m.match_no}">
        <input type="number" min="0" class="score-input" value="${predHomeVal}" 
          onchange="saveUserPrediction(${m.match_no}, this.value, document.getElementById('away-score-${m.match_no}').value)"
          id="home-score-${m.match_no}" ${(locked || isEditLocked) ? 'disabled' : ''}>
        <span class="score-separator">-</span>
        <input type="number" min="0" class="score-input" value="${predAwayVal}"
          onchange="saveUserPrediction(${m.match_no}, document.getElementById('home-score-${m.match_no}').value, this.value)"
          id="away-score-${m.match_no}" ${(locked || isEditLocked) ? 'disabled' : ''}>
        ${(isEditLocked && !locked) ? `
          <button class="lock-toggle-btn" id="lock-btn-${m.match_no}" onclick="toggleEditLock(${m.match_no})" title="Desbloquear para editar" style="background: transparent; border: none; font-size: 15px; cursor: pointer; color: var(--accent); margin-left: 2px; display: inline-flex; align-items: center; justify-content: center; transition: var(--transition-smooth);">🔒</button>
        ` : ''}
      </div>
    `;
    
    const formatted = formatDateVZLA(m.date);
    
    let statusLabelHTML = "";
    if (m.home_score !== null && m.away_score !== null) {
      statusLabelHTML = `<span class="card-lock-status blocked" style="color:var(--accent); font-weight:800;">🏆 ${m.home_score} - ${m.away_score}</span>`;
    } else if (locked) {
      statusLabelHTML = `<span class="card-lock-status blocked">🔒 BLOQUEADO</span>`;
    } else {
      if (predHomeVal !== "" && predAwayVal !== "") {
        statusLabelHTML = `<span class="card-lock-status saved">🔒 GUARDADO</span>`;
      } else {
        statusLabelHTML = `<span class="card-lock-status pending">🔓 PENDIENTE</span>`;
      }
    }
    
    card.innerHTML = `
      <div class="match-meta">
        <span style="font-weight:800; font-size:13px; color:var(--accent);">PARTIDO #${m.match_no} - GRUPO ${m.group}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          ${statusLabelHTML}
          <span style="font-size:12px; font-weight:600; color:#FFF;">${formatted.date} • ${formatted.time}</span>
        </div>
      </div>
      <div class="match-teams-grid">
        <div class="team-container home">
          <span class="team-name-label">${m.home_name}</span>
          ${homeFlag}
        </div>
        ${realScoreHTML}
        <div class="team-container away">
          ${awayFlag}
          <span class="team-name-label">${m.away_name}</span>
        </div>
      </div>
      <div class="match-card-footer">
        <button class="wildcard-btn ${wildcardActive ? 'active' : ''}" onclick="toggleWildcard(${m.match_no})" title="Comodín Parley (Puntos Dobles)" ${locked ? 'disabled style="cursor:not-allowed"' : ''}>
          <span class="wildcard-alarm">🚨</span><span style="font-size:11px; font-weight:700; letter-spacing: 0.03em;">COMODÍN</span>
        </button>
        <span class="match-venue">📍 ${m.venue}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderSpecialPredictionsView() {
  const container = document.getElementById('matches-scroller');
  container.innerHTML = "";
  
  const card = document.createElement('div');
  card.className = "glass-card";
  
  const locked = isSpecialPredictionsLocked();
  
  // Prepare Selectors for 12 group leaders
  let groupsHTML = "";
  
  Object.entries(STATE.groups).forEach(([grpLetter, teamList]) => {
    let savedSelection = "";
    if (STATE.currentUser && STATE.currentUser.special_predictions && STATE.currentUser.special_predictions.group_leaders) {
      savedSelection = STATE.currentUser.special_predictions.group_leaders[grpLetter] || "";
    }
    
    let options = `<option value="">Seleccionar...</option>`;
    teamList.forEach(t => {
      options += `<option value="${t.id}" ${savedSelection === t.id ? 'selected' : ''}>${t.name}</option>`;
    });
    
    groupsHTML += `
      <div class="special-select-group">
        <span class="special-select-label">LÍDER GRUPO ${grpLetter}</span>
        <select class="special-select-input" onchange="saveTournamentSpecials('group', this.value, '${grpLetter}')" ${locked ? 'disabled' : ''}>
          ${options}
        </select>
      </div>
    `;
  });
  
  card.innerHTML = `
    <h3 style="margin-bottom:12px; color:var(--accent);">ESPECIALES DEL TORNEO</h3>
    <p style="font-size:13px; color:var(--text-secondary); margin-bottom:20px; line-height: 1.6;">
      ¿Quién clasificará como primero de su grupo? Elige qué país ocupará el <strong>1er lugar</strong> en cada uno de los grupos (A al L) al finalizar la Fase de Grupos.
      <br><br>
      🎯 <strong>¿Cómo sumas puntos?</strong>
      <br>• <strong>Recompensa:</strong> Consigue <strong>+5 PTS</strong> adicionales por cada líder de grupo que aciertes.
      <br>• <strong>Activación:</strong> Los puntos se sumarán automáticamente una vez concluido el último partido de cada respectivo grupo.
      <br><br>
      🔒 <strong>Cierre de Predicciones:</strong> Esta sección se bloqueará por completo el <strong>18 de junio de 2026 a las 10:00 AM</strong>. ¡Asegúrate de guardar tus líderes antes del límite!
      ${locked ? '<br><span class="lockout-badge" style="margin-top:6px;">🔒 PREDICCIONES CERRADAS</span>' : ''}
    </p>
    <div class="special-pred-card" style="margin-bottom:0">
      <div class="special-pred-title">🔮 EL ORÁCULO DE LOS GRUPOS (+5 PUNTOS POR ACIERTO)</div>
      <div class="special-pred-grid">
        ${groupsHTML}
      </div>
    </div>
  `;
  container.appendChild(card);
}

// View Renderer: Leagues and Global Leaderboard
let activeLeagueTab = 'global'; // default league tab
function setLeagueTab(tabName) {
  activeLeagueTab = tabName;
  const buttons = document.querySelectorAll('.league-tab-btn');
  buttons.forEach(b => b.classList.remove('active'));
  
  event.target.classList.add('active');
  renderLeaguesView();
}

// Simplify long names for display
function simplifyName(name) {
  if (!name) return "";
  if (name.length <= 20) return name;
  
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name.slice(0, 20);
  
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  
  const firstLast = `${firstName} ${lastName}`;
  if (firstLast.length <= 20) return firstLast;
  
  const abbreviatedLast = `${firstName} ${lastName.charAt(0)}.`;
  if (abbreviatedLast.length <= 20) return abbreviatedLast;
  
  return firstName.slice(0, 18) + "..";
}

function renderLeaguesView() {
  const publicPanel = document.getElementById('public-league-panel');
  const privatePanel = document.getElementById('private-league-panel');
  
  // Run points recalculation to make sure ratings are 100% correct
  recalculateAllPoints();
  
  // Sort users (excluding the administrator)
  const sortedUsers = sortUsersLeaderboard(STATE.users.filter(u => u.cedula !== "V-12345678"));
  
  if (activeLeagueTab === 'global') {
    publicPanel.style.display = 'block';
    privatePanel.style.display = 'none';
    
    // Render Podium
    const pod1 = sortedUsers[0];
    const pod2 = sortedUsers[1];
    const pod3 = sortedUsers[2];
    
    document.getElementById('pod-name-1').innerText = pod1 ? simplifyName(pod1.name) : "-";
    document.getElementById('pod-pts-1').innerText = pod1 ? `${pod1.points} pts` : "0 pts";
    document.getElementById('pod-avatar-1').innerText = pod1 ? pod1.name.slice(0, 2).toUpperCase() : "?";
    
    document.getElementById('pod-name-2').innerText = pod2 ? simplifyName(pod2.name) : "-";
    document.getElementById('pod-pts-2').innerText = pod2 ? `${pod2.points} pts` : "0 pts";
    document.getElementById('pod-avatar-2').innerText = pod2 ? pod2.name.slice(0, 2).toUpperCase() : "?";
    
    document.getElementById('pod-name-3').innerText = pod3 ? simplifyName(pod3.name) : "-";
    document.getElementById('pod-pts-3').innerText = pod3 ? `${pod3.points} pts` : "0 pts";
    document.getElementById('pod-avatar-3').innerText = pod3 ? pod3.name.slice(0, 2).toUpperCase() : "?";
    
    // Add Click listeners for Podium comparer
    document.getElementById('pod-spot-1').onclick = () => { if (pod1) openVSModal(pod1.cedula); };
    document.getElementById('pod-spot-2').onclick = () => { if (pod2) openVSModal(pod2.cedula); };
    document.getElementById('pod-spot-3').onclick = () => { if (pod3) openVSModal(pod3.cedula); };
    
    // Animate finished tournament celebration elements
    const finished = checkTournamentFinished();
    const podiumEl = document.querySelector('.podium-container');
    if (podiumEl) {
      if (finished) {
        podiumEl.classList.add('finished');
        document.getElementById('pod-spot-1').classList.add('celebrate');
        document.getElementById('pod-spot-2').classList.add('celebrate');
        document.getElementById('pod-spot-3').classList.add('celebrate');
      } else {
        podiumEl.classList.remove('finished');
        document.getElementById('pod-spot-1').classList.remove('celebrate');
        document.getElementById('pod-spot-2').classList.remove('celebrate');
        document.getElementById('pod-spot-3').classList.remove('celebrate');
      }
    }
    
    // Render ranking list
    const tbody = document.getElementById('global-leaderboard-body');
    tbody.innerHTML = "";
    
    // Only display top 50 in lists (puestos 4 al 50) to optimize DOM load
    const displayList = sortedUsers.slice(3, 50);
    
    displayList.forEach((user, idx) => {
      const position = idx + 4;
      const tr = document.createElement('tr');
      
      const isCurrentUser = STATE.currentUser && user.cedula === STATE.currentUser.cedula;
      if (isCurrentUser) {
        tr.className = "leaderboard-row user-row-highlight";
      } else {
        tr.className = "leaderboard-row";
      }
      tr.onclick = () => openVSModal(user.cedula);
      
      const badgeCount = user.badges ? user.badges.length : 0;
      
      const badgeBg = isCurrentUser ? "var(--accent)" : "rgba(255,255,255,0.05)";
      const badgeColor = isCurrentUser ? "#000" : "var(--text-primary)";
      const badgeWeight = isCurrentUser ? "800" : "normal";
      
      const nameHtml = isCurrentUser 
        ? `<span style="color:var(--accent);">${user.name}</span> <span style="font-size:11px; color:#FFF; font-weight:normal; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:10px; margin-left:4px;">Tú</span>`
        : `${user.name} ${user.is_mock ? '<span style="font-size:10px; color:var(--text-muted); font-weight:normal;">(Bot)</span>' : ''}`;
      
      const subHtml = isCurrentUser
        ? `<div style="font-size:11px; color:rgba(255,255,255,0.75);">${user.id} • ${badgeCount} insignias</div>`
        : `<div style="font-size:11px; color:var(--text-secondary);">${user.id} • ${badgeCount} insignias</div>`;
      
      const ptsHtml = isCurrentUser
        ? `<td style="text-align:right; font-weight:800; color:var(--accent); font-size:16px;">${user.points} pts</td>`
        : `<td style="text-align:right; font-weight:800; color:var(--accent); font-size:15px;">${user.points} pts</td>`;

      tr.innerHTML = `
        <td style="width:50px;"><div class="rank-badge" style="background:${badgeBg}; color:${badgeColor}; font-weight:${badgeWeight};">${position}</div></td>
        <td>
          <div style="font-weight:700;">${nameHtml}</div>
          ${subHtml}
        </td>
        ${ptsHtml}
      `;
      tbody.appendChild(tr);
    });

    // Si el usuario está logueado y está por debajo del Top 50, se muestra una fila especial al final
    if (STATE.currentUser) {
      const userIndex = sortedUsers.findIndex(u => u.cedula === STATE.currentUser.cedula);
      if (userIndex >= 50) {
        // Separador visual de puntos suspensivos
        const trEllipsis = document.createElement('tr');
        trEllipsis.style.pointerEvents = 'none';
        trEllipsis.innerHTML = `
          <td colspan="3" style="text-align:center; padding:12px 0; color:var(--text-muted); font-weight:bold; letter-spacing:4px;">•••</td>
        `;
        tbody.appendChild(trEllipsis);

        // Fila destacada del usuario actual (por debajo de la posición 50)
        const userRank = userIndex + 1;
        const u = sortedUsers[userIndex];
        const trUser = document.createElement('tr');
        trUser.className = "leaderboard-row user-row-highlight";
        trUser.onclick = () => openVSModal(u.cedula);
        
        const badgeCount = u.badges ? u.badges.length : 0;
        const fontSz = userRank > 999 ? '10px' : (userRank > 99 ? '11px' : '12px');
        
        trUser.innerHTML = `
          <td style="width:50px;"><div class="rank-badge" style="background:var(--accent); color:#000; font-weight:800; font-size:${fontSz};">${userRank}</div></td>
          <td>
            <div style="font-weight:700; color:var(--accent);">${u.name} <span style="font-size:11px; color:#FFF; font-weight:normal; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:10px; margin-left:4px;">Tú</span></div>
            <div style="font-size:11px; color:rgba(255,255,255,0.75);">${u.id} • ${badgeCount} insignias</div>
          </td>
          <td style="text-align:right; font-weight:800; color:var(--accent); font-size:16px;">${u.points} pts</td>
        `;
        tbody.appendChild(trUser);
      }
    }
  } else {
    // Private Leagues Mode
    publicPanel.style.display = 'none';
    privatePanel.style.display = 'block';
    
    const container = document.getElementById('private-leagues-list');
    container.innerHTML = "";
    
    if (!STATE.currentUser) {
      container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary);">INICIA SESIÓN PARA CREAR O UNIRSE A LIGAS PRIVADAS.</div>`;
      return;
    }
    
    // Get leagues this user is member of
    const userLeagues = STATE.leagues.filter(l => l.members.includes(STATE.currentUser.cedula));
    
    if (userLeagues.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--text-secondary); line-height:1.6;">
          NO FORMAS PARTE DE NINGUNA LIGA PRIVADA.
          <br>¡CREA TU PROPIA LIGA O ÚNETE A UNA INGRESANDO EL CÓDIGO!
        </div>
      `;
      return;
    }
    
    userLeagues.forEach(league => {
      const card = document.createElement('div');
      card.className = "glass-card";
      
      // Get member profiles & sort by score
      const membersData = sortUsersLeaderboard(STATE.users.filter(u => league.members.includes(u.cedula)));
                                     
      // Render members list
      let rowsHTML = "";
      membersData.forEach((member, mIdx) => {
        const medal = mIdx === 0 ? "🥇" : (mIdx === 1 ? "🥈" : (mIdx === 2 ? "🥉" : `${mIdx + 1}`));
        rowsHTML += `
          <tr class="leaderboard-row" onclick="openVSModal('${member.cedula}')">
            <td style="width:30px; font-weight:bold; font-size:13px;">${medal}</td>
            <td>
              <div style="font-weight:700;">${member.name}</div>
              <span style="font-size:11px; color:var(--text-secondary);">${member.id}</span>
            </td>
            <td style="text-align:right; font-weight:800; color:var(--accent);">${member.points} pts</td>
          </tr>
        `;
      });
      
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-sutil); padding-bottom:10px; margin-bottom:12px;">
          <div>
            <h3 style="color:var(--accent); font-size:18px;">${league.name}</h3>
            <span style="font-size:11px; color:var(--text-secondary);">CÓDIGO ÚNICO: <strong style="color:#FFF; cursor:pointer;" onclick="shareLeagueCode('${league.code}', '${league.name.replace(/'/g, "\\'")}')" title="Copiar/Compartir código">${league.code} 📋</strong></span>
          </div>
          <button class="btn-sim-action" onclick="shareLeagueCode('${league.code}', '${league.name.replace(/'/g, "\\'")}')" style="padding:6px 12px; font-size:11px; border: 1.5px solid #FFFFFF;">COMPARTIR CÓDIGO</button>
        </div>
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th style="width:30px;">Pos</th>
              <th>Jugador</th>
              <th style="text-align:right;">Puntos</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      `;
      container.appendChild(card);
    });
  }
}

// Helper: Share Private League Code (Web Share API on Mobile, clipboard on desktop)
function shareLeagueCode(code, name) {
  const shareText = `¡Únete a mi liga privada "${name}" en la Polla Mundialista usando el código: ${code}! Juega gratis y demuestra tus conocimientos aquí: ${window.location.origin}`;
  
  if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    navigator.share({
      title: `Invitación a Liga ${name}`,
      text: shareText,
      url: window.location.origin
    }).then(() => {
      showToast("¡ENLACE DE INVITACIÓN COMPARTIDO! 🚀");
    }).catch((err) => {
      if (err && err.name === 'AbortError') return;
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(code)
            .then(() => showToast("CÓDIGO DE LIGA COPIADO AL PORTAPAPELES. ¡COMPÁRTELO CON TUS AMIGOS! 🚀"))
            .catch(() => showToast("ERROR AL COPIAR EL CÓDIGO.", "error"));
        } else {
          showToast("COMPARTIR NO COMPATIBLE EN ESTE NAVEGADOR.", "error");
        }
      } catch (clipErr) {
        console.error("Clipboard fallback failed:", clipErr);
        showToast("ERROR AL COPIAR EL CÓDIGO.", "error");
      }
    });
  } else {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(code)
          .then(() => showToast("CÓDIGO DE LIGA COPIADO AL PORTAPAPELES. ¡COMPÁRTELO CON TUS AMIGOS! 🚀"))
          .catch(() => showToast("ERROR AL COPIAR EL CÓDIGO.", "error"));
      } else {
        showToast("COMPARTIR NO COMPATIBLE EN ESTE NAVEGADOR.", "error");
      }
    } catch (clipErr) {
      console.error("Clipboard write failed:", clipErr);
      showToast("ERROR AL COPIAR EL CÓDIGO.", "error");
    }
  }
}

// View Renderer: Groups standings
function renderGroupsView() {
  const container = document.getElementById('groups-grid-container');
  container.innerHTML = "";
  
  // Calculate dynamic standings from schedule
  const standings = calculateGroupStandings(STATE.matches);
  
  Object.entries(standings).forEach(([grpLetter, list]) => {
    const card = document.createElement('div');
    card.className = "group-card";
    
    let rowsHTML = "";
    list.forEach((t, idx) => {
      const flag = getFlagHTML(t.name);
      let colorStyle = 'var(--text-muted)';
      let ptsColorStyle = 'var(--text-primary)';
      if (idx < 2) {
        colorStyle = 'var(--accent)';
        ptsColorStyle = 'var(--accent)';
      } else if (idx === 2) {
        colorStyle = 'var(--accent-orange)';
        ptsColorStyle = 'var(--accent-orange)';
      }
      rowsHTML += `
        <tr>
          <td style="width:20px; font-weight:700; color:${colorStyle}">${idx + 1}</td>
          <td><div style="display:flex; align-items:center; gap:6px;">${flag} <span style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px;">${t.name}</span></div></td>
          <td style="text-align:center;">${t.played}</td>
          <td style="text-align:center; font-weight:700;">${t.gd > 0 ? `+${t.gd}` : t.gd}</td>
          <td style="text-align:right; font-weight:bold; color:${ptsColorStyle}">${t.pts}</td>
        </tr>
      `;
    });
    
    card.innerHTML = `
      <h3 class="group-title">Grupo ${grpLetter}</h3>
      <table class="group-table">
        <thead>
          <tr>
            <th style="width:20px;">#</th>
            <th>Equipo</th>
            <th style="text-align:center;">PJ</th>
            <th style="text-align:center;">DG</th>
            <th style="text-align:right;">Pts</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
    `;
    container.appendChild(card);
  });
}

// Search matches in admin panel
function filterAdminMatches(query) {
  renderAdminMatches(query.trim().toLowerCase());
}

function renderAdminMatches(searchQuery = "") {
  const container = document.getElementById('admin-matches-list');
  container.innerHTML = "";
  
  // Resolve Brackets standings and leader outcomes
  resolveBrackets(STATE.matches);
  
  let filtered = STATE.matches;
  if (searchQuery) {
    filtered = STATE.matches.filter(m => 
      m.home_name.toLowerCase().includes(searchQuery) ||
      m.away_name.toLowerCase().includes(searchQuery) ||
      String(m.match_no) === searchQuery ||
      m.stage.toLowerCase().includes(searchQuery)
    );
  }
  
  filtered.forEach(m => {
    const card = document.createElement('div');
    card.className = "match-card";
    card.style.padding = "12px";
    card.style.marginBottom = "10px";
    
    const homeVal = m.home_score !== null ? m.home_score : "";
    const awayVal = m.away_score !== null ? m.away_score : "";
    const formatted = formatDateVZLA(m.date);
    
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-secondary); margin-bottom:8px;">
        <span>Partido #${m.match_no} (${m.stage.toUpperCase()})</span>
        <span>${formatted.date} • ${formatted.time}</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:10px;">
        <span style="text-align:right; font-weight:bold; font-size:13px;">${m.home_name}</span>
        <div style="display:flex; gap:6px; align-items:center;">
          <input type="number" min="0" style="width:36px; height:36px; text-align:center; background:#070C14; border:1px solid var(--border-sutil); color:#FFF; font-weight:bold;"
            value="${homeVal}" onchange="saveAdminMatchScore(${m.match_no}, this.value, document.getElementById('admin-away-score-${m.match_no}').value)"
            id="admin-home-score-${m.match_no}">
          <span>-</span>
          <input type="number" min="0" style="width:36px; height:36px; text-align:center; background:#070C14; border:1px solid var(--border-sutil); color:#FFF; font-weight:bold;"
            value="${awayVal}" onchange="saveAdminMatchScore(${m.match_no}, document.getElementById('admin-home-score-${m.match_no}').value, this.value)"
            id="admin-away-score-${m.match_no}">
        </div>
        <span style="text-align:left; font-weight:bold; font-size:13px;">${m.away_name}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

async function saveAdminMatchScore(matchNo, hsVal, asVal) {
  const match = STATE.matches.find(m => m.match_no === matchNo);
  if (!match) return;
  
  match.home_score = hsVal === "" ? null : parseInt(hsVal, 10);
  match.away_score = asVal === "" ? null : parseInt(asVal, 10);
  
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('matches')
        .update({
          home_score: match.home_score,
          away_score: match.away_score
        })
        .eq('match_no', matchNo);
        
      if (error) {
        console.error("Error saving match score in Supabase", error);
        showToast("ERROR AL GUARDAR EL MARCADOR EN EL SERVIDOR.", "error");
      } else {
        showToast("MARCADOR ACTUALIZADO CON ÉXITO.");
        await syncFromSupabase();
        recalculateAllPoints();
      }
    } catch (err) {
      console.error("Exception in saveAdminMatchScore", err);
      showToast("ERROR AL GUARDAR EL MARCADOR EN EL SERVIDOR.", "error");
    }
  } else {
    recalculateAllPoints();
  }
  
  // Re-render views
  renderAdminMatches(document.getElementById('admin-search-input').value);
}

// Render Admin Control Dashboard
function renderAdminView() {
  if (!STATE.adminMode) {
    document.getElementById('admin-auth-panel').style.display = 'block';
    document.getElementById('admin-dashboard-panel').style.display = 'none';
    return;
  }
  
  document.getElementById('admin-auth-panel').style.display = 'none';
  document.getElementById('admin-dashboard-panel').style.display = 'block';
  
  // Update toggle checkbox and wrapper status
  const toggle = document.getElementById('sim-status-toggle');
  if (toggle) {
    toggle.checked = STATE.simulatorEnabled;
  }
  
  const statusLabel = document.getElementById('sim-status-label');
  if (statusLabel) {
    statusLabel.innerText = STATE.simulatorEnabled ? "SIMULADOR: ENCENDIDO" : "SIMULADOR: APAGADO";
    statusLabel.style.color = STATE.simulatorEnabled ? "var(--accent)" : "var(--text-secondary)";
  }
  
  const controlsWrapper = document.getElementById('sim-controls-wrapper');
  if (controlsWrapper) {
    controlsWrapper.style.opacity = STATE.simulatorEnabled ? "1" : "0.5";
    controlsWrapper.style.pointerEvents = STATE.simulatorEnabled ? "auto" : "none";
  }

  // Display simulated or real time in admin panel
  const displayTime = getCurrentTime();
  const dateObj = new Date(displayTime);
  const display = document.getElementById('sim-time-display');
  if (display) {
    display.innerText = dateObj.toLocaleString() + (STATE.simulatorEnabled ? " (SIMULADO)" : " (REAL)");
  }
  
  // Update picker UI
  updateDatetimePickerUI();
  
  // Set slider value
  const slider = document.getElementById('sim-time-slider');
  if (slider) {
    slider.value = STATE.simulatedTime;
  }
  
  // Handle tournament finished visual status
  const finished = checkTournamentFinished();
  const toggleBtn = document.getElementById('admin-toggle-finished-btn');
  if (toggleBtn) {
    toggleBtn.innerText = finished ? "🏆 REABRIR TORNEO" : "🏆 DECLARAR FINAL DEL TORNEO";
  }
  
  const existingBanner = document.getElementById('admin-finished-banner');
  if (existingBanner) existingBanner.remove();
  
  if (finished) {
    const banner = document.createElement('div');
    banner.id = 'admin-finished-banner';
    banner.className = 'glass-card';
    banner.style.borderColor = 'var(--accent)';
    banner.style.background = 'rgba(255, 223, 0, 0.05)';
    banner.style.marginBottom = '20px';
    banner.innerHTML = `
      <h4 style="color:var(--accent); font-size:16px; margin-bottom:6px;">🏆 TORNEO FINALIZADO</h4>
      <p style="font-size:12px; color:var(--text-secondary); line-height:1.4;">EL TORNEO HA CONCLUIDO. LAS APUESTAS Y RESULTADOS HAN SIDO CONSOLIDADOS CON ÉXITO. EL CONTROL DEL DESLIZADOR DE TIEMPO Y LAS ACCIONES SIMULADORAS HAN SIDO SUSPENDIDOS.</p>
    `;
    const adminDash = document.getElementById('admin-dashboard-panel');
    adminDash.insertBefore(banner, adminDash.firstChild);
    if (slider) slider.disabled = true;
    if (toggle) toggle.disabled = true;
    const picker = document.getElementById('sim-datetime-picker');
    if (picker) picker.disabled = true;
  } else {
    if (slider) slider.disabled = false;
    if (toggle) toggle.disabled = false;
    const picker = document.getElementById('sim-datetime-picker');
    if (picker) picker.disabled = false;
  }
  
  // Render lists
  renderAdminMatches();
  renderAdminUsersList();
  
  // Lock inputs if finished
  if (finished) {
    const matchInputs = document.querySelectorAll('#admin-matches-list input');
    matchInputs.forEach(input => input.disabled = true);
    
    const simActions = document.querySelectorAll('.btn-sim-action:not(#admin-toggle-finished-btn)');
    simActions.forEach(btn => btn.disabled = true);
  }
}

// Export user database to CSV
function exportUserDataToCSV() {
  if (!STATE.users || STATE.users.length === 0) {
    showToast("NO HAY USUARIOS PARA EXPORTAR.", "error");
    return;
  }
  
  const headers = ["Cedula", "Nombre", "Usuario Parley", "ID Unico", "Correo", "Telefono", "Fecha de Nacimiento", "Puntos Totales", "Exactos (Cant)", "1X2 Simples (Cant)", "Insignias"];
  
  const rows = STATE.users.map(u => {
    return [
      u.cedula,
      u.name,
      u.parley_username || "",
      u.id || "",
      u.email || "",
      u.phone || "",
      u.dob || "",
      u.points,
      u.exacts_count || 0,
      u.outcomes_count || 0,
      u.badges ? u.badges.join("; ") : ""
    ];
  });
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(val => {
      const stringVal = String(val);
      if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    }).join(","))
  ].join("\n");
  
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "Polla_Mundial_2026_Data.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast("DATA EXPORTADA EXITOSAMENTE A CSV.");
}



// User List renderers in Admin panel
function filterAdminUsers(query) {
  renderAdminUsersList(query.trim().toLowerCase());
}

function renderAdminUsersList(searchQuery = "") {
  const tbody = document.getElementById('admin-users-list-tbody');
  tbody.innerHTML = "";
  
  let filtered = STATE.users;
  if (searchQuery) {
    filtered = STATE.users.filter(u => 
      u.name.toLowerCase().includes(searchQuery) ||
      u.cedula.toLowerCase().includes(searchQuery) ||
      (u.email && u.email.toLowerCase().includes(searchQuery))
    );
  }
  
  filtered.forEach(u => {
    // Skip logged-in admin from deletion/reset lists
    if (STATE.currentUser && u.cedula === STATE.currentUser.cedula) return;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="cursor:pointer;" onclick="openAdminUserModal('${u.cedula}')">
        <div style="font-weight:700; color:var(--accent);">${u.name} ${u.is_mock ? '<span style="font-size:10px; color:var(--text-muted);">(Mock)</span>' : ''}</div>
        <div style="font-size:11px; color:var(--text-secondary);">${u.id} • Cédula: ${u.cedula}</div>
      </td>
      <td style="text-align:right; white-space:nowrap;">
        <button class="btn-admin-action" onclick="openAdminUserModal('${u.cedula}')" style="padding:4px 8px; font-size:10px; margin-right:4px; border-color:var(--text-secondary); color:var(--text-secondary);">Detalles</button>
        <button class="btn-admin-action" onclick="adminResetUserPassword('${u.cedula}')" style="padding:4px 8px; font-size:10px; margin-right:4px;">Reset Clave</button>
        <button class="btn-admin-action" onclick="adminDeleteUser('${u.cedula}')" style="padding:4px 8px; font-size:10px; border-color:var(--alert); color:var(--alert);">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function adminResetUserPassword(cedula) {
  showToast("LAS CONTRASEÑAS DEBEN GESTIONARSE DIRECTAMENTE EN EL PANEL DE SUPABASE (AUTH).", "error");
}

async function adminDeleteUser(cedula) {
  if (!supabaseClient) {
    showToast("ERROR DE CONEXIÓN CON EL SERVIDOR.", "error");
    return;
  }
  const user = STATE.users.find(u => u.cedula === cedula);
  if (!user) return;
  
  if (confirm(`¿ESTÁS SEGURO DE QUE DESEAS ELIMINAR AL USUARIO CON CÉDULA ${cedula}? SE PERDERÁN TODAS SUS PREDICCIONES.`)) {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', user.id);
        
      if (error) throw error;
      
      showToast("USUARIO ELIMINADO EN LA BASE DE DATOS. RECUERDA ELIMINARLO EN EL PANEL DE SUPABASE SI DESEAS LIBERAR SU CORREO.");
      
      await syncFromSupabase();
      
      renderAdminUsersList(document.getElementById('admin-user-search-input').value);
      renderLeaguesView();
    } catch (err) {
      console.error("Error deleting user", err);
      showToast("ERROR AL ELIMINAR EL USUARIO DEL SERVIDOR.", "error");
    }
  }
}

// Dialog sliding panels utilities
function openAuthModal(tabName = 'login') {
  document.getElementById('auth-overlay').classList.add('active');
  switchAuthTab(tabName);
  
  // Clear inputs
  document.getElementById('reg-name').value = "";
  document.getElementById('reg-parley-username').value = "";
  document.getElementById('reg-cedula').value = "";
  document.getElementById('reg-dob').value = "";
  document.getElementById('reg-email').value = "";
  document.getElementById('reg-phone').value = "";
  document.getElementById('reg-password').value = "";
  document.getElementById('reg-password-confirm').value = "";
  
  document.getElementById('login-cedula').value = "";
  document.getElementById('login-password').value = "";
  document.getElementById('age-gate-error').style.display = 'none';
  
  tempRecoveryData = null;
  recoveryCode = null;
}

function closeAuthModal() {
  document.getElementById('auth-overlay').classList.remove('active');
  document.getElementById('age-gate-error').style.display = 'none';
}

function switchAuthTab(tabName) {
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(t => t.classList.remove('active'));
  
  // Reset headers
  document.getElementById('auth-nav-tabs').style.display = 'flex';
  document.getElementById('auth-panel-title').innerText = "ACCESO QUINIELA";
  
  if (tabName === 'login') {
    document.getElementById('tab-login-btn').classList.add('active');
    document.getElementById('form-login-container').style.display = 'block';
    document.getElementById('form-register-container').style.display = 'none';
    document.getElementById('form-recover-container').style.display = 'none';
  } else if (tabName === 'register') {
    document.getElementById('tab-register-btn').classList.add('active');
    document.getElementById('form-login-container').style.display = 'none';
    document.getElementById('form-register-container').style.display = 'block';
    document.getElementById('form-recover-container').style.display = 'none';
  } else if (tabName === 'recover') {
    document.getElementById('auth-nav-tabs').style.display = 'none';
    document.getElementById('auth-panel-title').innerText = "RECUPERACIÓN";
    document.getElementById('form-login-container').style.display = 'none';
    document.getElementById('form-register-container').style.display = 'none';
    document.getElementById('form-recover-container').style.display = 'block';
  }
}

// Init App Core
function renderApp() {
  const headerUser = document.getElementById('header-user-profile');
  if (STATE.currentUser) {
    headerUser.style.display = 'flex';
    const initials = STATE.currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('user-avatar-initials').innerText = initials;
    document.getElementById('header-points-value').innerText = STATE.currentUser.points;
  } else {
    headerUser.style.display = 'none';
  }
  
  // Conditionally render ADMIN button on floating bottom bar
  const navAdmin = document.getElementById('nav-item-admin');
  if (navAdmin) {
    navAdmin.style.display = STATE.adminMode ? 'flex' : 'none';
  }
  
  // Refresh views
  renderDashboardView();
}

function initSessionShell() {
  const user = localStorage.getItem('parley_wc_current_user');
  const loggedOutHero = document.getElementById('logged-out-hero');
  const loggedInDashboard = document.getElementById('logged-in-dashboard');
  if (user) {
    if (loggedOutHero) loggedOutHero.style.display = 'none';
    if (loggedInDashboard) loggedInDashboard.style.display = 'block';
  } else {
    if (loggedOutHero) loggedOutHero.style.display = 'flex';
    if (loggedInDashboard) loggedInDashboard.style.display = 'none';
  }
}

window.onload = async () => {
  initSessionShell();
  await initDatabase();
  syncOfflineQueue();
  
  // Set datetime picker bounds (June 1, 2026 to June 30, 2026)
  const picker = document.getElementById('sim-datetime-picker');
  if (picker) {
    picker.min = "2026-06-01T00:00";
    picker.max = "2026-06-30T23:59";
  }
  
  // Set date slider bounds (June 1, 2026 to June 30, 2026) as fallback
  const slider = document.getElementById('sim-time-slider');
  if (slider) {
    slider.min = new Date("2026-06-01T00:00:00-04:00").getTime();
    slider.max = new Date("2026-06-30T23:59:59-04:00").getTime();
    
    // Format range display value during slide
    slider.oninput = function() {
      const val = parseInt(this.value, 10);
      const display = document.getElementById('sim-time-display');
      if (display) {
        display.innerText = new Date(val).toLocaleString() + (STATE.simulatorEnabled ? " (SIMULADO)" : " (REAL)");
      }
    };
    slider.onchange = function() {
      updateSimulatedTime(parseInt(this.value, 10));
    };
  }

  // Load simulator enabled status
  STATE.simulatorEnabled = localStorage.getItem('parley_wc_simulator_enabled') === 'true';
  const toggle = document.getElementById('sim-status-toggle');
  if (toggle) {
    toggle.checked = STATE.simulatorEnabled;
  }
  
  const statusLabel = document.getElementById('sim-status-label');
  if (statusLabel) {
    statusLabel.innerText = STATE.simulatorEnabled ? "SIMULADOR: ENCENDIDO" : "SIMULADOR: APAGADO";
    statusLabel.style.color = STATE.simulatorEnabled ? "var(--accent)" : "var(--text-secondary)";
  }
  
  const controlsWrapper = document.getElementById('sim-controls-wrapper');
  if (controlsWrapper) {
    controlsWrapper.style.opacity = STATE.simulatorEnabled ? "1" : "0.5";
    controlsWrapper.style.pointerEvents = STATE.simulatorEnabled ? "auto" : "none";
  }

  // Update datetime picker UI to match loaded simulatedTime
  updateDatetimePickerUI();

  // Start real-time sync with host/public API
  syncRealTime().then(() => {
    recalculateAllPoints();
    renderApp();
    if (STATE.adminMode) {
      renderAdminView();
    }
  });

  // Sync real-time periodically every minute to maintain correct network offset
  setInterval(syncRealTime, 60000);
  
  // Auto-format Cédula digits on user input
  document.getElementById('reg-cedula').addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, ''); // strip letters
  });
  document.getElementById('login-cedula').addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, ''); // strip letters
  });
  
  // Si viene con el hash #register, abrimos el modal de registro automáticamente
  if (window.location.hash === '#register') {
    window.history.replaceState("", document.title, window.location.pathname + window.location.search);
    openAuthModal('register');
  }
  
  renderApp();
  
  // Check if viewing a shared ticket in URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const ticketParam = urlParams.get('ticket');
  let loadedShared = false;
  if (ticketParam) {
    try {
      const decodedCedula = atob(ticketParam);
      const sharedUser = STATE.users.find(u => u.cedula === decodedCedula);
      if (sharedUser) {
        renderSharedTicketView(sharedUser);
        navigateTo('shared-ticket-section');
        loadedShared = true;
      }
    } catch (e) {
      console.error("Invalid ticket parameter", e);
    }
  }
  
  if (!loadedShared) {
    const activeSection = sessionStorage.getItem('active_section') || 'inicio';
    navigateTo(activeSection);
    // Onboarding gate checks only for active players
    checkOnboardingTutorial();
  }
};

function openBadgeModal(badgeId, badgeIcon, badgeDesc, hasBadge) {
  let points = 0;
  switch (badgeId) {
    case "Pronosticador Activo":
      points = 5;
      break;
    case "Ganador Frecuente":
      points = 10;
      break;
    case "Ojo Clínico":
      points = 15;
      break;
    case "Oráculo de Grupos":
      points = 15;
      break;
    case "HAT-TRICK VIP":
      points = 20;
      break;
    default:
      points = 0;
  }

  const emojiEl = document.getElementById("badge-modal-emoji");
  const titleEl = document.getElementById("badge-modal-title");
  const statusEl = document.getElementById("badge-modal-status");
  const descEl = document.getElementById("badge-modal-description");

  if (emojiEl) emojiEl.innerText = badgeIcon;
  if (titleEl) titleEl.innerText = badgeId;
  if (descEl) descEl.innerText = badgeDesc;

  if (statusEl) {
    statusEl.className = "badge-modal-status " + (hasBadge ? "conseguida" : "pendiente");
    statusEl.innerText = (hasBadge ? "CONSEGUIDA" : "PENDIENTE") + ` (+${points} PTS)`;
  }

  const modal = document.getElementById("badge-modal");
  if (modal) {
    modal.classList.add("active");
  }
}

function closeBadgeModal() {
  const modal = document.getElementById("badge-modal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// -------------------------------------------------------------------------
// FASE 2: VISTA DE COMPARTIR TICKET DE INVITADO (MODO LECTURA)
// -------------------------------------------------------------------------
function renderSharedTicketView(user) {
  const container = document.getElementById('shared-ticket-view');
  container.innerHTML = "";
  
  // 1. Banner Publicitario Promocional Animado
  const bannerDiv = document.createElement('div');
  bannerDiv.className = 'promo-share-banner';
  bannerDiv.innerHTML = `
    <div class="promo-title">⚽ LA POLLA MUNDIALISTA 🏆</div>
    <p class="promo-subtext">¿Crees que puedes superar los <strong>${user.points} PTS</strong> de <strong>${user.name}</strong>? Registra tu Quiniela <strong>totalmente GRATIS</strong> y demuestra tu nivel. Patrocinado por <strong>Parley.com.ve</strong></p>
    <button class="btn-promo-cta" onclick="openRegisterFromPromo()">¡JUGAR AHORA! 🚀</button>
  `;
  container.appendChild(bannerDiv);
  
  // 2. Card de Resumen del Ticket
  const summaryCard = document.createElement('div');
  summaryCard.className = 'glass-card';
  summaryCard.style.padding = '20px';
  summaryCard.style.marginBottom = '20px';
  summaryCard.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-sutil); padding-bottom:12px; margin-bottom:16px;">
      <h3 style="color:var(--accent); font-size:18px; margin:0;">TICKET DE JUGADOR</h3>
      <div style="background:rgba(255,223,0,0.1); color:var(--accent); font-size:11px; font-weight:800; padding:4px 8px; border-radius:10px; border:1px solid var(--accent);">MODO LECTURA</div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:13px; color:var(--text-secondary); font-weight:700;">Nombre: <strong style="color:#FFF;">${user.name}</strong></div>
        <div style="font-size:11px; color:var(--text-muted); font-weight:600; margin-top:4px;">ID de Quiniela: <strong style="color:var(--accent);">${user.id}</strong></div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:22px; font-weight:900; color:var(--accent);">${user.points} PTS</div>
        <div style="font-size:10px; color:var(--text-secondary); font-weight:700;">Puntaje Acumulado</div>
      </div>
    </div>
  `;
  container.appendChild(summaryCard);
  
  // 3. Contenedor de predicciones
  const listCard = document.createElement('div');
  listCard.className = 'glass-card';
  listCard.style.padding = '20px';
  listCard.innerHTML = `
    <h4 style="color:#FFF; font-size:15px; margin-bottom:16px; border-bottom:1px solid var(--border-sutil); padding-bottom:8px;">PRONÓSTICOS DE LA FASE DE GRUPOS</h4>
    <div id="shared-predictions-list" style="display:flex; flex-direction:column; gap:4px;"></div>
  `;
  container.appendChild(listCard);
  
  const listContainer = listCard.querySelector('#shared-predictions-list');
  
  STATE.matches.forEach(m => {
    const pred = user.predictions[m.match_no];
    let predText = "Sin pronóstico";
    let wildcardHTML = "";
    let ptsEarned = 0;
    
    if (pred && pred.home_score !== null && pred.away_score !== null) {
      predText = `${pred.home_score} - ${pred.away_score}`;
      if (pred.wildcard) wildcardHTML = ' <span class="vs-wildcard-star">🚨</span>';
      
      if (m.home_score !== null && m.away_score !== null) {
        let matchPoints = 0;
        if (pred.home_score === m.home_score && pred.away_score === m.away_score) {
          matchPoints = 6;
        } else {
          const r_win = m.home_score > m.away_score ? 'home' : (m.home_score < m.away_score ? 'away' : 'draw');
          const p_win = pred.home_score > pred.away_score ? 'home' : (pred.home_score < pred.away_score ? 'away' : 'draw');
          if (r_win === p_win) {
            matchPoints += 3;
            if (m.home_score !== m.away_score && (m.home_score - m.away_score) === (pred.home_score - pred.away_score)) {
              matchPoints += 2;
            }
          }
        }
        if (pred.wildcard) matchPoints *= 2;
        ptsEarned = matchPoints;
      }
    }
    
    const realText = m.home_score !== null && m.away_score !== null ? `${m.home_score} - ${m.away_score}` : "Por jugar";
    
    const item = document.createElement('div');
    item.className = "ticket-row-item";
    item.innerHTML = `
      <div class="ticket-team-row">
        <div class="ticket-team-col home" style="flex: 1; justify-content: flex-end; text-align: right; min-width: 0; display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600;">
          ${getFlagHTML(m.home_name)}
          <span style="margin-left: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.home_name}</span>
        </div>
        <span class="ticket-score-badge" style="font-weight: 800; font-size: 13px; color: var(--accent); margin: 0 10px; min-width: 60px; text-align: center; white-space: nowrap; flex-shrink: 0;">${predText}${wildcardHTML}</span>
        <div class="ticket-team-col away" style="flex: 1; justify-content: flex-start; text-align: left; min-width: 0; display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600;">
          <span style="margin-right: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.away_name}</span>
          ${getFlagHTML(m.away_name)}
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-top: 4px; flex-wrap: wrap; gap: 4px;">
        <span>Partido #${m.match_no} (${m.group ? `Grupo ${m.group}` : ''})</span>
        <span>Real: <strong style="color: #FFF;">${realText}</strong> | Ganado: <strong style="color: var(--accent);">${ptsEarned} PTS</strong></span>
      </div>
    `;
    listContainer.appendChild(item);
  });
}

function openRegisterFromPromo() {
  navigateTo('inicio');
  openAuthModal('register');
}

// ==========================================
// SECTION: ADVANCED ADMIN USER EDIT LOGIC
// ==========================================

function adminEnableEditUser() {
  const cedula = STATE.inspectedUserCedula;
  const user = STATE.users.find(u => u.cedula === cedula);
  if (!user) return;
  
  // Fill input values
  document.getElementById('admin-edit-name').value = user.name || "";
  document.getElementById('admin-edit-cedula').value = user.cedula || "";
  document.getElementById('admin-edit-phone').value = user.phone || "";
  document.getElementById('admin-edit-email').value = user.email || "";
  document.getElementById('admin-edit-dob').value = user.dob || "";
  
  const parleyUsernameEl = document.getElementById('admin-edit-parley-username');
  if (parleyUsernameEl) {
    parleyUsernameEl.value = user.parley_username || "";
  }
  
  // Hide view mode, show edit mode
  document.getElementById('admin-inspect-data-view').style.display = 'none';
  document.getElementById('admin-inspect-edit-form').style.display = 'grid';
  
  // Toggle buttons
  document.getElementById('btn-admin-edit-user').style.display = 'none';
  document.getElementById('btn-admin-save-user').style.display = 'inline-block';
  document.getElementById('btn-admin-cancel-user').style.display = 'inline-block';
}

function adminCancelUserEdit() {
  document.getElementById('admin-inspect-data-view').style.display = 'grid';
  document.getElementById('admin-inspect-edit-form').style.display = 'none';
  
  document.getElementById('btn-admin-edit-user').style.display = 'inline-block';
  document.getElementById('btn-admin-save-user').style.display = 'none';
  document.getElementById('btn-admin-cancel-user').style.display = 'none';
}

async function adminSaveUserChanges() {
  if (!supabaseClient) {
    showToast("ERROR DE CONEXIÓN CON EL SERVIDOR.", "error");
    return;
  }
  const oldCedula = STATE.inspectedUserCedula;
  const user = STATE.users.find(u => u.cedula === oldCedula);
  if (!user) return;
  
  const newName = document.getElementById('admin-edit-name').value.trim();
  const newCedula = document.getElementById('admin-edit-cedula').value.trim().toUpperCase();
  const newPhone = document.getElementById('admin-edit-phone').value.trim();
  const newEmail = document.getElementById('admin-edit-email').value.trim();
  const newDob = document.getElementById('admin-edit-dob').value;
  
  let newParleyUsername = "";
  const parleyUsernameEl = document.getElementById('admin-edit-parley-username');
  if (parleyUsernameEl) {
    newParleyUsername = parleyUsernameEl.value.trim();
  }
  
  if (!newName || !newCedula || !newEmail) {
    showToast("Por favor complete los campos obligatorios (Nombre, Cédula y Correo).", "error");
    return;
  }
  
  // Validate Cédula format V-12345678 or E-12345678
  const cedulaRegex = /^[VvEe]-\d+$/;
  if (!cedulaRegex.test(newCedula)) {
    showToast("Formato de Cédula inválido. Debe ser V-12345678 o E-12345678.", "error");
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    showToast("Formato de correo electrónico inválido.", "error");
    return;
  }
  
  // Check Cédula uniqueness if changed
  if (newCedula !== oldCedula) {
    const exists = STATE.users.some(u => u.cedula === newCedula);
    if (exists) {
      showToast("La Cédula ingresada ya está registrada por otro usuario.", "error");
      return;
    }
  }
  
  try {
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        name: newName,
        cedula: newCedula,
        phone: newPhone,
        email: newEmail,
        dob: newDob,
        parley_username: newParleyUsername
      })
      .eq('id', user.id);
      
    if (error) throw error;
    
    await syncFromSupabase();
    
    adminCancelUserEdit();
    
    STATE.inspectedUserCedula = newCedula;
    openAdminUserModal(newCedula);
    
    const searchInput = document.getElementById('admin-user-search-input');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    renderAdminUsersList(query);
    
    showToast("Datos del usuario actualizados correctamente. ✅", "success");
  } catch (err) {
    console.error("Error updating user profile in Supabase", err);
    showToast("ERROR AL GUARDAR CAMBIOS EN EL SERVIDOR.", "error");
  }
}

// ==========================================
// SECTION: DETAILED SCORE AUDITING LOGIC
// ==========================================

function adminToggleAuditLog() {
  const panel = document.getElementById('admin-inspect-audit-panel');
  if (panel.style.display === 'none') {
    const cedula = STATE.inspectedUserCedula;
    const user = STATE.users.find(u => u.cedula === cedula);
    if (!user) return;
    
    const auditText = generateUserAuditText(user);
    document.getElementById('admin-inspect-audit-text').textContent = auditText;
    
    panel.style.display = 'block';
    document.getElementById('btn-show-audit-log').innerText = "🔍 OCULTAR AUDITORÍA DE PUNTOS";
  } else {
    panel.style.display = 'none';
    document.getElementById('btn-show-audit-log').innerText = "🔍 VER AUDITORÍA DETALLADA DE PUNTOS";
  }
}

function adminCopyAuditReport() {
  const text = document.getElementById('admin-inspect-audit-text').textContent;
  if (!text) return;
  
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(() => {
        showToast("Informe probatorio copiado al portapapeles. 📋", "success");
      }).catch(err => {
        fallbackCopyAuditText(text);
      });
    } else {
      fallbackCopyAuditText(text);
    }
  } catch (err) {
    console.error("Clipboard write failed:", err);
    fallbackCopyAuditText(text);
  }
}

function fallbackCopyAuditText(text) {
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.top = '-9999px';
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand('copy');
    document.body.removeChild(el);
    if (success) {
      showToast("Informe probatorio copiado al portapapeles. 📋", "success");
    } else {
      showToast("Error al copiar al portapapeles.", "error");
    }
  } catch (err) {
    console.error("Legacy copy failed:", err);
    showToast("Error al copiar al portapapeles.", "error");
  }
}

function generateUserAuditText(user) {
  let text = `=========================================\n`;
  text += `   INFORME OFICIAL DE AUDITORÍA DE PUNTOS\n`;
  text += `=========================================\n`;
  text += `Usuario: ${user.name.toUpperCase()}\n`;
  text += `Cédula: ${user.cedula}\n`;
  text += `ID Jugador: ${user.id}\n`;
  text += `Fecha de Auditoría: ${new Date().toLocaleString()}\n`;
  text += `-----------------------------------------\n\n`;
  
  let totalPoints = 0;
  let exactsCount = 0;
  let winnerCount = 0;
  let predictionsCount = 0;
  let successfulWildcardsCount = 0;
  
  let matchReport = `--- 1. PARTIDOS INDIVIDUALES ---\n`;
  
  STATE.matches.forEach(match => {
    const pred = user.predictions[match.match_no];
    const hasPred = pred && pred.home_score !== null && pred.away_score !== null;
    const isPlayed = match.home_score !== null && match.away_score !== null;
    
    if (!isPlayed) {
      if (hasPred) {
        matchReport += `Partido #${match.match_no} (${match.home_name} vs ${match.away_name}):\n`;
        matchReport += `  - Pronóstico: [${pred.home_score} - ${pred.away_score}]${pred.wildcard ? ' 🚨' : ''}\n`;
        matchReport += `  - Estado: Pendiente por jugar (0 PTS)\n\n`;
      }
      return;
    }
    
    if (!hasPred) {
      matchReport += `Partido #${match.match_no} (${match.home_name} vs ${match.away_name}):\n`;
      matchReport += `  - Estado: Sin pronóstico registrado (0 PTS)\n\n`;
      return;
    }
    
    predictionsCount++;
    const H_p = pred.home_score;
    const A_p = pred.away_score;
    const H_r = match.home_score;
    const A_r = match.away_score;
    
    let matchPoints = 0;
    let detail = "";
    
    if (H_p === H_r && A_p === A_r) {
      matchPoints = 6;
      detail = "Marcador Exacto (+6 PTS)";
      exactsCount++;
      winnerCount++;
    } else {
      const r_win = H_r > A_r ? 'home' : (H_r < A_r ? 'away' : 'draw');
      const p_win = H_p > A_p ? 'home' : (H_p < A_p ? 'away' : 'draw');
      if (r_win === p_win) {
        matchPoints += 3;
        detail = "Ganador/Empate Simple (+3 PTS)";
        winnerCount++;
        
        if (H_r !== A_r && (H_r - A_r) === (H_p - A_p)) {
          matchPoints += 2;
          detail += " + Diferencia de Goles (+2 PTS)";
        }
      } else {
        matchPoints = 0;
        detail = "Sin aciertos (0 PTS)";
      }
    }
    
    let wildcardText = "";
    if (pred.wildcard) {
      wildcardText = ` * Comodín 🚨 (x2)`;
      matchPoints *= 2;
      if (matchPoints > 0) {
        successfulWildcardsCount++;
      }
    }
    
    totalPoints += matchPoints;
    
    matchReport += `Partido #${match.match_no} (${match.home_name} vs ${match.away_name}):\n`;
    matchReport += `  - Pronóstico: [${H_p} - ${A_p}], Real: [${H_r} - ${A_r}]\n`;
    matchReport += `  - Calificación: ${detail}${wildcardText} = ${matchPoints} PTS\n\n`;
  });
  
  text += matchReport;
  
  // B. Group Leaders
  let groupReport = `--- 2. LÍDERES DE GRUPO ---\n`;
  let groupLeadersPoints = 0;
  
  const { standings, leaders } = resolveBrackets(STATE.matches);
  
  Object.entries(leaders).forEach(([grpLetter, realLeaderCode]) => {
    const groupMatches = STATE.matches.filter(m => m.group === grpLetter);
    const allFinished = groupMatches.length > 0 && groupMatches.every(m => m.home_score !== null && m.away_score !== null);
    
    groupReport += `Grupo ${grpLetter}:\n`;
    if (!allFinished) {
      groupReport += `  - Estado: Partidos del grupo aún en juego (0 PTS)\n`;
    } else {
      const realTeam = standings[grpLetter].find(t => t.id === realLeaderCode);
      const realName = realTeam ? realTeam.name : "N/A";
      
      const userPickCode = user.special_predictions && user.special_predictions.group_leaders ? user.special_predictions.group_leaders[grpLetter] : null;
      let userPickName = "Ninguno";
      if (userPickCode) {
        const teamInGrp = standings[grpLetter].find(t => t.id === userPickCode);
        if (teamInGrp) userPickName = teamInGrp.name;
      }
      
      if (userPickCode && userPickCode === realLeaderCode) {
        groupLeadersPoints += 5;
        totalPoints += 5;
        groupReport += `  - Líder Real: ${realName}, Tu Predicción: ${userPickName}\n`;
        groupReport += `  - Calificación: ACERTADO (+5 PTS)\n`;
      } else {
        groupReport += `  - Líder Real: ${realName}, Tu Predicción: ${userPickName}\n`;
        groupReport += `  - Calificación: NO ACERTADO (0 PTS)\n`;
      }
    }
    groupReport += `\n`;
  });
  
  text += groupReport;
  
  // C. Badges
  let badgesReport = `--- 3. INSIGNIAS (BADGES) ---\n`;
  let badgesPoints = 0;
  
  if (exactsCount >= 3) {
    badgesReport += `  - OJO CLÍNICO (+15 PTS) [Activo: ${exactsCount} exactos (Requisito: 3+)]\n`;
    badgesPoints += 15;
  } else {
    badgesReport += `  - OJO CLÍNICO (0 PTS) [Inactivo: ${exactsCount} exactos (Requisito: 3+)]\n`;
  }
  
  if (winnerCount >= 15) {
    badgesReport += `  - GANADOR FRECUENTE (+10 PTS) [Activo: ${winnerCount} aciertos (Requisito: 15+)]\n`;
    badgesPoints += 10;
  } else {
    badgesReport += `  - GANADOR FRECUENTE (0 PTS) [Inactivo: ${winnerCount} aciertos (Requisito: 15+)]\n`;
  }
  
  if (predictionsCount >= 50) {
    badgesReport += `  - PRONOSTICADOR ACTIVO (+5 PTS) [Activo: ${predictionsCount} pronósticos (Requisito: 50+)]\n`;
    badgesPoints += 5;
  } else {
    badgesReport += `  - PRONOSTICADOR ACTIVO (0 PTS) [Inactivo: ${predictionsCount} pronósticos (Requisito: 50+)]\n`;
  }
  
  const leaderAciertos = groupLeadersPoints / 5;
  if (leaderAciertos >= 6) {
    badgesReport += `  - ORÁCULO DE GRUPOS (+15 PTS) [Activo: ${leaderAciertos} líderes (Requisito: 6+)]\n`;
    badgesPoints += 15;
  } else {
    badgesReport += `  - ORÁCULO DE GRUPOS (0 PTS) [Inactivo: ${leaderAciertos} líderes (Requisito: 6+)]\n`;
  }
  
  if (user.badges && user.badges.includes("HAT-TRICK VIP")) {
    badgesReport += `  - HAT-TRICK VIP (+20 PTS) [Activo: Otorgado manualmente por Admin]\n`;
    badgesPoints += 20;
  }
  
  totalPoints += badgesPoints;
  text += badgesReport + `\n`;
  
  text += `=========================================\n`;
  text += `   RESUMEN TOTAL DE CÓMPUTO AUDITABLE\n`;
  text += `=========================================\n`;
  text += `PUNTOS ACUMULADOS EN PARTIDOS:  ${totalPoints - groupLeadersPoints - badgesPoints} PTS\n`;
  text += `PUNTOS ACUMULADOS EN LÍDERES:   ${groupLeadersPoints} PTS\n`;
  text += `PUNTOS ACUMULADOS EN INSIGNIAS:  ${badgesPoints} PTS\n`;
  text += `-----------------------------------------\n`;
  text += `PUNTAJE GENERAL CALCULADO:      ${totalPoints} PTS\n`;
  text += `PUNTAJE REGISTRADO EN PERFIL:   ${user.points || 0} PTS\n`;
  text += `ESTADO DE CONSISTENCIA:        ${totalPoints === (user.points || 0) ? '✅ CONSISTENTE' : '⚠️ DISCREPANCIA RECALCULAR'}\n`;
  text += `=========================================\n`;
  
  return text;
}

// ==========================================
// SECTION: ADVANCED ADMIN GROUP OVERRIDE LOGIC
// ==========================================

function adminLoadOverrideGroupTeams(grp) {
  const container = document.getElementById('admin-override-teams-container');
  const saveBtn = document.getElementById('btn-admin-save-override');
  const clearBtn = document.getElementById('btn-admin-clear-override');
  
  if (!grp) {
    container.style.display = 'none';
    saveBtn.style.display = 'none';
    clearBtn.style.display = 'none';
    return;
  }
  
  // Calculate current computed standings (normal way, without temporary values)
  const standings = calculateGroupStandings(STATE.matches)[grp];
  if (!standings || standings.length === 0) {
    container.innerHTML = `<div style="color:var(--text-secondary); font-size:12px; text-align:center;">No hay equipos en este grupo.</div>`;
    container.style.display = 'flex';
    saveBtn.style.display = 'none';
    clearBtn.style.display = 'none';
    return;
  }
  
  // Load current override if any
  let currentOrder = [];
  if (STATE.groupStandingsOverrides && STATE.groupStandingsOverrides[grp]) {
    currentOrder = STATE.groupStandingsOverrides[grp];
  } else {
    currentOrder = standings.map(t => t.id);
  }
  
  // Sort teams based on currentOrder (which matches the override if present, or normal standings order)
  const orderedTeams = [...standings].sort((a, b) => {
    return currentOrder.indexOf(a.id) - currentOrder.indexOf(b.id);
  });
  
  STATE.tempOverrideTeams = orderedTeams.map(t => ({ id: t.id, name: t.name }));
  
  renderOverrideTeamsList();
  
  container.style.display = 'flex';
  saveBtn.style.display = 'inline-block';
  
  if (STATE.groupStandingsOverrides && STATE.groupStandingsOverrides[grp]) {
    clearBtn.style.display = 'inline-block';
  } else {
    clearBtn.style.display = 'none';
  }
}

function renderOverrideTeamsList() {
  const container = document.getElementById('admin-override-teams-container');
  container.innerHTML = "";
  
  STATE.tempOverrideTeams.forEach((team, index) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.padding = '8px';
    row.style.background = 'rgba(255,255,255,0.03)';
    row.style.border = '1px solid rgba(255,255,255,0.05)';
    row.style.borderRadius = '4px';
    row.style.fontSize = '13px';
    row.style.marginBottom = '4px';
    
    const nameSpan = document.createElement('span');
    nameSpan.innerHTML = `<strong style="color:var(--accent); font-family:monospace; margin-right:8px;">#${index + 1}</strong> ${team.name}`;
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.gap = '6px';
    
    // Up button
    const btnUp = document.createElement('button');
    btnUp.className = "btn-admin-action";
    btnUp.style.padding = "2px 6px";
    btnUp.style.fontSize = "11px";
    btnUp.style.margin = "0";
    btnUp.innerText = "▲";
    btnUp.disabled = index === 0;
    btnUp.onclick = () => {
      // Swap with previous
      const temp = STATE.tempOverrideTeams[index];
      STATE.tempOverrideTeams[index] = STATE.tempOverrideTeams[index - 1];
      STATE.tempOverrideTeams[index - 1] = temp;
      renderOverrideTeamsList();
    };
    
    // Down button
    const btnDown = document.createElement('button');
    btnDown.className = "btn-admin-action";
    btnDown.style.padding = "2px 6px";
    btnDown.style.fontSize = "11px";
    btnDown.style.margin = "0";
    btnDown.innerText = "▼";
    btnDown.disabled = index === STATE.tempOverrideTeams.length - 1;
    btnDown.onclick = () => {
      // Swap with next
      const temp = STATE.tempOverrideTeams[index];
      STATE.tempOverrideTeams[index] = STATE.tempOverrideTeams[index + 1];
      STATE.tempOverrideTeams[index + 1] = temp;
      renderOverrideTeamsList();
    };
    
    buttonsDiv.appendChild(btnUp);
    buttonsDiv.appendChild(btnDown);
    row.appendChild(nameSpan);
    row.appendChild(buttonsDiv);
    container.appendChild(row);
  });
}

function adminSaveGroupOverride() {
  const grp = document.getElementById('admin-override-group-select').value;
  if (!grp) return;
  
  if (!STATE.groupStandingsOverrides) {
    STATE.groupStandingsOverrides = {};
  }
  
  STATE.groupStandingsOverrides[grp] = STATE.tempOverrideTeams.map(t => t.id);
  saveGroupStandingsOverrides();
  
  // Recalculate points and update UI
  recalculateAllPoints();
  renderApp(); // This will refresh the rankings view and other panels
  
  // Reload select view
  adminLoadOverrideGroupTeams(grp);
  
  showToast(`Ajuste de posiciones para el Grupo ${grp} aplicado correctamente. ✅`, "success");
}

function adminClearGroupOverride() {
  const grp = document.getElementById('admin-override-group-select').value;
  if (!grp) return;
  
  if (STATE.groupStandingsOverrides && STATE.groupStandingsOverrides[grp]) {
    delete STATE.groupStandingsOverrides[grp];
    saveGroupStandingsOverrides();
    
    recalculateAllPoints();
    renderApp();
    
    adminLoadOverrideGroupTeams(grp);
    showToast(`Se ha eliminado el ajuste manual del Grupo ${grp}. Se usan posiciones automáticas. 🔄`, "info");
  }
}

function saveGroupStandingsOverrides() {
  localStorage.setItem('group_standings_overrides', JSON.stringify(STATE.groupStandingsOverrides));
}
