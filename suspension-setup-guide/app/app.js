const pages = [...document.querySelectorAll('.page')];
const pageIds = new Set(pages.map(page => page.id));
let currentPage = 'settings';
let previousPage = 'settings';
let toastTimer;

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function showPage(pageId, options = {}) {
  const target = pageIds.has(pageId) ? pageId : 'settings';
  if (target !== currentPage) previousPage = currentPage;
  currentPage = target;

  pages.forEach(page => page.classList.toggle('active-page', page.id === target));
  document.title = `${document.getElementById(target)?.dataset.pageTitle || 'Suspension Setup Guide'} · Suspension Setup Guide`;
  window.scrollTo({ top: 0, behavior: options.instant ? 'auto' : 'smooth' });

  if (options.updateHash !== false) {
    const hash = target === 'settings' ? '#settings' : `#${target}`;
    if (location.hash !== hash) history.pushState({ page: target }, '', hash);
  }
}

function closeToSettings() {
  showPage('settings');
}

document.querySelectorAll('[data-open-page]').forEach(button => {
  button.addEventListener('click', () => showPage(button.dataset.openPage));
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closeToSettings));
document.querySelectorAll('[data-back]').forEach(button => {
  button.addEventListener('click', () => {
    if (previousPage && previousPage !== currentPage) showPage(previousPage);
    else showPage('settings');
  });
});

window.addEventListener('popstate', () => {
  const route = location.hash.replace('#', '') || 'settings';
  showPage(pageIds.has(route) ? route : 'settings', { updateHash: false, instant: true });
});

const settingsSearch = document.getElementById('settingsSearch');
const searchGroups = [...document.querySelectorAll('.searchable-group')];
const searchEmpty = document.getElementById('searchEmpty');
const localSearchIntro = document.getElementById('localSearchIntro');
const localSearchResults = document.getElementById('localSearchResults');
const localSearchTitle = document.getElementById('localSearchTitle');
const garageResultSection = document.getElementById('garageResultSection');
const garageResultList = document.getElementById('garageResultList');
const appResultSection = document.getElementById('appResultSection');
const appResultList = document.getElementById('appResultList');
const localSearchNoResults = document.getElementById('localSearchNoResults');

function localSearchTokens(query) {
  return String(query || '').toLowerCase().split(/\s+/).map(token => token.trim()).filter(Boolean);
}

function matchesLocalSearch(text, query) {
  const haystack = String(text || '').toLowerCase();
  const tokens = localSearchTokens(query);
  return tokens.length > 0 && tokens.every(token => haystack.includes(token));
}

function localVehicleSearchText(vehicle) {
  const rear = vehicle?.setup?.rear || {};
  const front = vehicle?.setup?.front || {};
  return [
    vehicle?.profileName, vehicle?.make, vehicle?.model, vehicle?.year, vehicle?.type,
    vehicle?.rearShockBrand, vehicle?.rearShockModel, vehicle?.frontForkBrand, vehicle?.frontForkModel,
    vehicle?.notes,
    rear.style, rear.preload, rear.compression, rear.rebound, rear.lsc, rear.hsc, rear.notes,
    rear.sagPercent, rear.loadedSagMm,
    front.style, front.preload, front.compression, front.rebound, front.notes,
    front.sagPercent, front.loadedSagMm
  ].filter(value => value !== null && value !== undefined && value !== '').join(' ');
}

function localRecordSearchText(record) {
  return [
    record?.vehicleName, record?.setupName, record?.suspensionArea,
    record?.targetStyle, record?.targetLabel, record?.staticSagMm, record?.loadedSagMm, record?.sagPercent,
    record?.compressionSetting, record?.reboundSetting, record?.lscSetting, record?.hscSetting,
    record?.tuningType, record?.tuningSymptom, record?.tuningAction, record?.tuningOutcome,
    record?.testRoute, record?.settingBefore, record?.settingAfter,
    record?.dampingGoal, record?.dampingGoalLabel, record?.dampingGoalSuccess,
    record?.dampingNewIssue, record?.dampingNextAction, record?.notes
  ].filter(value => value !== null && value !== undefined && value !== '').join(' ');
}

function localGarageVehicleCard(vehicle) {
  const rear = vehicle?.setup?.rear || {};
  const front = vehicle?.setup?.front || {};
  const name = vehicle.profileName || [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ') || 'Saved vehicle';

  const rearParts = [
    rear.sagPercent !== null && rear.sagPercent !== undefined ? `SAG ${formatNumber(rear.sagPercent)}%` : '',
    rear.preload ? `Preload ${rear.preload}` : '',
    rear.compression ? `Compression ${rear.compression}` : '',
    rear.rebound ? `Rebound ${rear.rebound}` : ''
  ].filter(Boolean);

  const frontParts = [
    front.sagPercent !== null && front.sagPercent !== undefined ? `SAG ${formatNumber(front.sagPercent)}%` : '',
    front.preload ? `Preload ${front.preload}` : '',
    front.compression ? `Compression ${front.compression}` : '',
    front.rebound ? `Rebound ${front.rebound}` : ''
  ].filter(Boolean);

  return `
    <article class="local-result-card">
      <div class="local-result-card-heading">
        <div>
          <span class="local-result-type">Saved bike</span>
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml([vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ') || vehicleTypeLabel(vehicle.type))}</p>
        </div>
        <button type="button" class="text-button" data-local-open-vehicle="${escapeHtml(vehicle.id)}">Open setup</button>
      </div>
      <div class="local-setting-lines">
        <div><span>Rear</span><strong>${escapeHtml(rearParts.join(' · ') || 'No current rear setup')}</strong></div>
        <div><span>Front</span><strong>${escapeHtml(frontParts.join(' · ') || 'No current front setup')}</strong></div>
      </div>
      ${vehicle.notes ? `<p class="local-result-note">${escapeHtml(vehicle.notes)}</p>` : ''}
    </article>`;
}

function localGarageHistoryCard(record) {
  const title = record.vehicleName || 'Saved vehicle';
  const setup = record.setupName || record.tuningSymptom || 'Suspension test';
  const score = record.beforeScore !== null && record.beforeScore !== undefined &&
                record.afterScore !== null && record.afterScore !== undefined
    ? `Score ${formatNumber(record.beforeScore)} → ${formatNumber(record.afterScore)}`
    : '';

  return `
    <article class="local-result-card history">
      <div class="local-result-card-heading">
        <div>
          <span class="local-result-type">Test History</span>
          <h4>${escapeHtml(title)}</h4>
          <p>${escapeHtml(setup)}</p>
        </div>
        <button type="button" class="text-button" data-local-open-history>Open history</button>
      </div>
      <div class="local-result-tags">
        ${record.suspensionArea ? `<span>${escapeHtml(record.suspensionArea)}</span>` : ''}
        ${record.tuningOutcome ? `<span>${escapeHtml(record.tuningOutcome)}</span>` : ''}
        ${record.dampingGoalLabel ? `<span>${escapeHtml(record.dampingGoalLabel)}</span>` : ''}
        ${score ? `<span>${escapeHtml(score)}</span>` : ''}
      </div>
      ${record.tuningAction ? `<p class="local-result-note">${escapeHtml(record.tuningAction)}</p>` : ''}
      ${record.dampingNextAction ? `<p class="local-result-note">${escapeHtml(record.dampingNextAction)}</p>` : ''}
      ${record.notes ? `<p class="local-result-note">${escapeHtml(record.notes)}</p>` : ''}
    </article>`;
}

function localAppCard(row) {
  const page = row.dataset.openPage;
  const title = row.querySelector('.row-copy strong')?.textContent?.trim() || 'App section';
  const description = row.querySelector('.row-copy small')?.textContent?.trim() || '';
  return `
    <article class="local-result-card app-help">
      <div class="local-result-card-heading">
        <div>
          <span class="local-result-type">App help</span>
          <h4>${escapeHtml(title)}</h4>
          <p>${escapeHtml(description)}</p>
        </div>
        <button type="button" class="text-button" data-local-open-page="${escapeHtml(page)}">Open</button>
      </div>
    </article>`;
}

function bindLocalSearchActions() {
  document.querySelectorAll('[data-local-open-vehicle]').forEach(button => {
    button.addEventListener('click', () => startCompleteWithVehicle(button.dataset.localOpenVehicle));
  });
  document.querySelectorAll('[data-local-open-history]').forEach(button => {
    button.addEventListener('click', () => showPage('records'));
  });
  document.querySelectorAll('[data-local-open-page]').forEach(button => {
    button.addEventListener('click', () => showPage(button.dataset.localOpenPage));
  });
}

function renderLocalSearch() {
  const query = settingsSearch.value.trim();

  if (!query) {
    localSearchIntro.classList.remove('hidden');
    localSearchResults.classList.add('hidden');
    searchGroups.forEach(group => group.classList.remove('hidden'));
    searchGroups.forEach(group => group.querySelectorAll('.settings-row').forEach(row => row.classList.remove('hidden')));
    return;
  }

  localSearchIntro.classList.add('hidden');
  localSearchResults.classList.remove('hidden');
  searchGroups.forEach(group => group.classList.add('hidden'));

  const garageCards = [];
  vehicles.forEach(vehicle => {
    if (matchesLocalSearch(localVehicleSearchText(vehicle), query)) {
      garageCards.push(localGarageVehicleCard(vehicle));
    }
  });
  records.forEach(record => {
    if (matchesLocalSearch(localRecordSearchText(record), query)) {
      garageCards.push(localGarageHistoryCard(record));
    }
  });

  const appCards = [];
  document.querySelectorAll('.settings-row[data-open-page]').forEach(row => {
    const searchable = `${row.textContent} ${row.dataset.search || ''}`;
    if (matchesLocalSearch(searchable, query)) appCards.push(localAppCard(row));
  });

  garageResultList.innerHTML = garageCards.join('');
  appResultList.innerHTML = appCards.join('');

  garageResultSection.classList.toggle('hidden', garageCards.length === 0);
  appResultSection.classList.toggle('hidden', appCards.length === 0);
  localSearchNoResults.classList.toggle('hidden', garageCards.length + appCards.length > 0);

  localSearchTitle.textContent = `${garageCards.length + appCards.length} local result${garageCards.length + appCards.length === 1 ? '' : 's'} for “${query}”`;
  bindLocalSearchActions();
}

settingsSearch.addEventListener('input', renderLocalSearch);

document.getElementById('clearLocalSearch')?.addEventListener('click', () => {
  settingsSearch.value = '';
  settingsSearch.focus();
  renderLocalSearch();
});

searchEmpty.classList.add('hidden');

function refreshLocalSearchIfActive() {
  if (typeof settingsSearch !== 'undefined' && settingsSearch?.value?.trim()) renderLocalSearch();
}

const adjusters = {
  preload: {
    badge: 'SAG foundation',
    symbol: 'P',
    title: 'Spring preload',
    summary: 'Changes how much the spring is already compressed before the vehicle is loaded.',
    controls: 'SAG and where the suspension sits in its travel. Preload can be adjusted by a C-spanner collar, threaded ring, fork-top nut or hydraulic hand wheel.',
    more: 'Usually raises the ride position and reduces SAG. It does not change the actual spring rate.',
    less: 'Usually lowers the ride position and increases SAG.',
    warning: 'Set preload from measured SAG. If the correct SAG cannot be reached within the approved adjustment range, the spring itself may be unsuitable.'
  },
  compression: {
    badge: 'Bump absorption',
    symbol: 'C',
    title: 'Compression damping',
    summary: 'Controls how easily the suspension compresses when the wheel hits a bump.',
    controls: 'Resistance while the shock or fork is moving inward. It is often a top clicker or a clicker on a remote reservoir.',
    more: 'Usually gives firmer, slower compression. Too much may feel harsh and stop the wheel absorbing bumps.',
    less: 'Usually gives softer, faster compression. Too little may allow excessive dive or bottoming.',
    warning: 'Do not use compression clicks to disguise incorrect SAG or an unsuitable spring rate. Confirm which clicker it is before turning it.'
  },
  rebound: {
    badge: 'Return control',
    symbol: 'R',
    title: 'Rebound damping',
    summary: 'Controls how quickly the suspension extends again after it has compressed.',
    controls: 'The return speed after a bump. The adjuster is often near the bottom of a shock or fork leg.',
    more: 'Usually slows the return. Too much can make the suspension pack down over repeated bumps.',
    less: 'Usually speeds up the return. Too little can cause bouncing or kick the rider or passenger upward after a bump.',
    warning: 'Test on the same section of road. Change only one or two clicks and record whether the kick, bounce or control improves.'
  },
  lsc: {
    badge: 'Chassis support',
    symbol: 'L',
    title: 'Low-speed compression',
    summary: 'Controls damping during slower shock-shaft movement—not low vehicle speed.',
    controls: 'Body movement during braking, acceleration, cornering, rolling terrain and gradual load transfer.',
    more: 'Usually gives more support and less chassis movement, but too much may reduce comfort and grip.',
    less: 'Usually gives freer movement and a softer feel, but too little may allow excessive squat, dive or wallow.',
    warning: 'On some shocks the centre screw and outer nut control different circuits. Confirm the exact arrangement in the manual.'
  },
  hsc: {
    badge: 'Sharp impacts',
    symbol: 'H',
    title: 'High-speed compression',
    summary: 'Controls damping when the shock shaft moves quickly—not when the vehicle is travelling fast.',
    controls: 'Rapid movement caused by potholes, square edges, rocks, jumps and hard landings.',
    more: 'Usually gives more resistance to sharp or heavy impacts. Too much may feel very harsh.',
    less: 'Usually lets the suspension move more freely on sharp impacts. Too little may increase bottoming.',
    warning: 'High-speed adjusters may use turns rather than clicks. Make very small changes and follow the suspension manual.'
  },
  fork: {
    badge: 'Front suspension',
    symbol: 'F',
    title: 'Top of a front fork',
    summary: 'The large top nut and smaller centre clicker can perform different jobs depending on the fork.',
    controls: 'A large outer nut may adjust spring preload. A smaller centre screw may control compression or rebound. Some forks place one function in each leg.',
    more: 'The effect depends entirely on the labelled function: more preload changes SAG; more damping slows the related movement.',
    less: 'Less preload increases SAG; less damping allows the related movement to happen more freely.',
    warning: 'Never identify a fork-top control by size alone. Check the labels and model manual before turning the nut or clicker.'
  }
};

function openAdjuster(key) {
  const data = adjusters[key];
  if (!data) return;
  document.getElementById('adjusterBadge').textContent = data.badge;
  document.getElementById('adjusterTitle').textContent = data.title;
  document.getElementById('adjusterSymbol').textContent = data.symbol;
  document.getElementById('adjusterSummary').textContent = data.summary;
  document.getElementById('adjusterControls').textContent = data.controls;
  document.getElementById('adjusterMore').textContent = data.more;
  document.getElementById('adjusterLess').textContent = data.less;
  document.getElementById('adjusterWarning').textContent = data.warning;
  showPage('adjusterDetail');
}

document.querySelectorAll('[data-adjuster]').forEach(button => {
  button.addEventListener('click', () => openAdjuster(button.dataset.adjuster));
});

// Measurement units ---------------------------------------------------------
const UNIT_PREFERENCE_KEY = 'suspensionSetupGuide.units.v1';
const MM_PER_INCH = 25.4;
const POUNDS_PER_KG = 2.2046226218;
const unitDefinitions = {
  metric: {
    lengthUnit: 'mm',
    massUnit: 'kg',
    lengthWord: 'millimetres',
    summary: 'Metric · millimetres and kilograms',
    shortcut: 'mm · kg'
  },
  imperial: {
    lengthUnit: 'in',
    massUnit: 'lb',
    lengthWord: 'inches',
    summary: 'Imperial · inches and pounds',
    shortcut: 'in · lb'
  }
};

function loadUnitSystem() {
  try {
    return localStorage.getItem(UNIT_PREFERENCE_KEY) === 'imperial' ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
}

let unitSystem = loadUnitSystem();

function parseNumeric(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function displayLengthToMm(value, system = unitSystem) {
  const number = parseNumeric(value);
  if (number === null) return null;
  return system === 'imperial' ? number * MM_PER_INCH : number;
}

function mmToDisplayLength(value, system = unitSystem) {
  const number = parseNumeric(value);
  if (number === null) return null;
  return system === 'imperial' ? number / MM_PER_INCH : number;
}

function displayMassToKg(value, system = unitSystem) {
  const number = parseNumeric(value);
  if (number === null) return null;
  return system === 'imperial' ? number / POUNDS_PER_KG : number;
}

function kgToDisplayMass(value, system = unitSystem) {
  const number = parseNumeric(value);
  if (number === null) return null;
  return system === 'imperial' ? number * POUNDS_PER_KG : number;
}

function trimFixed(value, decimals) {
  if (!Number.isFinite(value)) return '';
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}

function formatDisplayValue(value, kind, system = unitSystem) {
  const converted = kind === 'length' ? mmToDisplayLength(value, system) : kgToDisplayMass(value, system);
  if (converted === null) return '';
  const decimals = kind === 'length' && system === 'imperial' ? 2 : 1;
  return trimFixed(converted, decimals);
}

function formatMeasurement(value, kind, system = unitSystem) {
  const number = formatDisplayValue(value, kind, system);
  if (number === '') return '—';
  const unit = kind === 'length' ? unitDefinitions[system].lengthUnit : unitDefinitions[system].massUnit;
  return `${number} ${unit}`;
}

const unitBoundInputs = [
  { id: 'travel', kind: 'length' },
  { id: 'l1', kind: 'length' },
  { id: 'l2', kind: 'length' },
  { id: 'l3', kind: 'length' },
  { id: 'riderWeight', kind: 'mass' },
  { id: 'passengerWeight', kind: 'mass' },
  { id: 'luggageWeight', kind: 'mass' },
  { id: 'recordStaticSag', kind: 'length' },
  { id: 'recordLoadedSag', kind: 'length' },
  { id: 'guidedRiderWeight', kind: 'mass' },
  { id: 'guidedPassengerWeight', kind: 'mass' },
  { id: 'guidedLuggageWeight', kind: 'mass' },
  { id: 'guidedTravel', kind: 'length' },
  { id: 'guidedL1', kind: 'length' },
  { id: 'guidedL2', kind: 'length' },
  { id: 'guidedL3', kind: 'length' },
  { id: 'completeRearTravel', kind: 'length' },
  { id: 'completeRearL1', kind: 'length' },
  { id: 'completeRearL2', kind: 'length' },
  { id: 'completeRearL3', kind: 'length' },
  { id: 'completeFrontTravel', kind: 'length' },
  { id: 'completeFrontL1', kind: 'length' },
  { id: 'completeFrontL2', kind: 'length' },
  { id: 'completeFrontL3', kind: 'length' },
  { id: 'completeFrontLeftL1', kind: 'length' },
  { id: 'completeFrontLeftL2', kind: 'length' },
  { id: 'completeFrontLeftL3', kind: 'length' },
  { id: 'completeFrontRightL1', kind: 'length' },
  { id: 'completeFrontRightL2', kind: 'length' },
  { id: 'completeFrontRightL3', kind: 'length' }
];

function canonicalFromDisplay(value, kind, system = unitSystem) {
  return kind === 'length' ? displayLengthToMm(value, system) : displayMassToKg(value, system);
}

function setUnitBoundValue(id, canonicalValue, kind) {
  const input = document.getElementById(id);
  if (!input) return;
  const number = parseNumeric(canonicalValue);
  if (number === null) {
    input.value = '';
    delete input.dataset.canonical;
    return;
  }
  input.dataset.canonical = String(number);
  input.value = formatDisplayValue(number, kind);
}

function getUnitBoundValue(id, kind) {
  const input = document.getElementById(id);
  if (!input) return null;
  const cached = parseNumeric(input.dataset.canonical);
  if (cached !== null) return cached;
  return canonicalFromDisplay(input.value, kind);
}

function clearUnitBoundValuesWithin(root) {
  unitBoundInputs.forEach(({ id }) => {
    const input = document.getElementById(id);
    if (input && root.contains(input)) delete input.dataset.canonical;
  });
}

unitBoundInputs.forEach(({ id, kind }) => {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener('input', () => {
    const canonical = canonicalFromDisplay(input.value, kind);
    if (canonical === null) delete input.dataset.canonical;
    else input.dataset.canonical = String(canonical);
  });
});

function convertVisibleInputs(oldSystem, newSystem) {
  unitBoundInputs.forEach(({ id, kind }) => {
    const input = document.getElementById(id);
    if (!input || input.value.trim() === '') return;
    const cached = parseNumeric(input.dataset.canonical);
    const canonical = cached !== null ? cached : canonicalFromDisplay(input.value, kind, oldSystem);
    if (canonical === null) return;
    input.dataset.canonical = String(canonical);
    input.value = formatDisplayValue(canonical, kind, newSystem);
  });
}

function updateUnitUi() {
  const units = unitDefinitions[unitSystem];
  document.documentElement.dataset.units = unitSystem;
  document.getElementById('unitShortcut').textContent = units.shortcut;
  document.getElementById('unitSettingSummary').textContent = units.summary;
  document.getElementById('sagLengthWord').textContent = units.lengthWord;
  document.getElementById('travelLabel').textContent = `Total WHEEL suspension travel (${units.lengthUnit})`;
  document.getElementById('travel').placeholder = unitSystem === 'metric' ? 'Example: 150' : 'Example: 5.91';
  document.querySelectorAll('[data-length-unit]').forEach(element => { element.textContent = units.lengthUnit; });
  document.getElementById('riderWeightLabel').textContent = `Rider (${units.massUnit})`;
  document.getElementById('passengerWeightLabel').textContent = `Passenger (${units.massUnit})`;
  document.getElementById('luggageWeightLabel').textContent = `Luggage (${units.massUnit})`;
  document.getElementById('recordStaticSagLabel').textContent = `Static SAG (${units.lengthUnit})`;
  document.getElementById('recordLoadedSagLabel').textContent = `Loaded SAG (${units.lengthUnit})`;
  document.getElementById('guidedRiderWeightLabel').textContent = `Rider (${units.massUnit})`;
  document.getElementById('guidedPassengerWeightLabel').textContent = `Passenger (${units.massUnit})`;
  document.getElementById('guidedLuggageWeightLabel').textContent = `Luggage (${units.massUnit})`;
  document.getElementById('guidedTravelLabel').textContent = `Total WHEEL suspension travel (${units.lengthUnit})`;
  document.getElementById('guidedTravel').placeholder = unitSystem === 'metric' ? 'Example: 150' : 'Example: 5.91';
  ['Rear', 'Front'].forEach(area => {
    document.getElementById(`complete${area}TravelLabel`).textContent = `${area} WHEEL travel (${units.lengthUnit})`;
    document.getElementById(`complete${area}L1Label`).textContent = `L1 fully extended (${units.lengthUnit})`;
    document.getElementById(`complete${area}L2Label`).textContent = `L2 vehicle only (${units.lengthUnit})`;
    document.getElementById(`complete${area}L3Label`).textContent = `L3 riding load (${units.lengthUnit})`;
  });
  ['Left', 'Right'].forEach(side => {
    document.getElementById(`completeFront${side}L1Label`).textContent = `L1 (${units.lengthUnit})`;
    document.getElementById(`completeFront${side}L2Label`).textContent = `L2 (${units.lengthUnit})`;
    document.getElementById(`completeFront${side}L3Label`).textContent = `L3 (${units.lengthUnit})`;
  });

  document.querySelectorAll('[data-set-units]').forEach(button => {
    const selected = button.dataset.setUnits === unitSystem;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function setUnitSystem(nextSystem) {
  if (!unitDefinitions[nextSystem] || nextSystem === unitSystem) return;
  const oldSystem = unitSystem;
  convertVisibleInputs(oldSystem, nextSystem);
  unitSystem = nextSystem;
  try { localStorage.setItem(UNIT_PREFERENCE_KEY, unitSystem); } catch { /* Preference remains active for this session. */ }
  updateUnitUi();
  renderSagResults();
  renderRecords();
  updateGuidedSagPreview();
  renderGuidedReview();
  renderCompleteSag('rear');
  renderCompleteSag('front');
  showToast(unitSystem === 'metric' ? 'Metric units selected.' : 'Imperial units selected.');
}

document.querySelectorAll('[data-set-units]').forEach(button => {
  button.addEventListener('click', () => setUnitSystem(button.dataset.setUnits));
});

// SAG calculator ------------------------------------------------------------
const sagType = document.getElementById('sagType');
const sagArea = document.getElementById('sagArea');
const customTarget = document.getElementById('customTarget');

const sagProfiles = {
  track: {
    label: 'Race track / road race',
    shortLabel: 'Track / road race',
    rear: [23, 27],
    front: [23, 27],
    description: 'A firmer performance starting band. Less SAG keeps the chassis higher but gives the wheel less extension travel into dips.'
  },
  sport: {
    label: 'Sport road / firm',
    shortLabel: 'Sport / firm',
    rear: [27, 30],
    front: [25, 30],
    description: 'A firm road starting band between road-race and normal street guidance.'
  },
  street: {
    label: 'Street / normal riding',
    shortLabel: 'Street / normal',
    rear: [28, 33],
    front: [28, 33],
    description: 'A balanced starting band for normal road riding, commuting and touring.'
  },
  comfort: {
    label: 'Plush / maximum comfort',
    shortLabel: 'Plush / comfort',
    rear: [32, 33],
    front: [30, 33],
    description: 'The upper end of normal road guidance. More SAG can feel more settled, but reduces remaining bump travel and ground clearance.'
  },
  adventure: {
    label: 'Adventure / mixed terrain',
    shortLabel: 'Adventure',
    rear: [28, 32],
    front: [25, 30],
    description: 'Centred around approximately 30% to balance road stability, wheel movement and mixed-surface grip.'
  },
  offroad: {
    label: 'Off-road / MX',
    shortLabel: 'Off-road / MX',
    rear: [30, 33],
    front: [25, 28],
    description: 'Typical off-road starting guidance uses more rear SAG than front SAG.'
  }
};

function sagProfileFor(style, area = 'rear', customMin = null, customMax = null) {
  if (style === 'custom') {
    return {
      key: 'custom',
      label: 'Manufacturer or custom range',
      shortLabel: 'Custom',
      min: Number(customMin),
      max: Number(customMax),
      description: 'Use the exact specification supplied for this vehicle, shock or fork.'
    };
  }
  const profile = sagProfiles[style] || sagProfiles.street;
  const [min, max] = profile[area === 'front' ? 'front' : 'rear'];
  return { key: style, ...profile, min, max };
}

function targetRangeText(profile) {
  return `${formatNumber(profile.min)}–${formatNumber(profile.max)}%`;
}

function sagMeaning(percent, travelMm) {
  const compressionRemainingPercent = Math.max(0, 100 - percent);
  const compressionRemainingMm = Math.max(0, travelMm - (travelMm * percent / 100));
  return {
    extensionPercent: percent,
    compressionRemainingPercent,
    compressionRemainingMm,
    sentence: `${formatNumber(percent)}% means the suspension is sitting ${formatNumber(percent)}% into its total travel under the normal riding load. About ${formatNumber(compressionRemainingPercent)}% remains for further compression over bumps.`
  };
}

function sagPositionHtml(percent, travelMm) {
  const meaning = sagMeaning(percent, travelMm);
  const safePercent = Math.max(0, Math.min(100, percent));
  return `
    <div class="sag-position" style="--sag-position:${safePercent}%">
      <div class="sag-position-labels">
        <span><strong>${formatNumber(meaning.extensionPercent)}%</strong> extension reserve</span>
        <span><strong>${formatNumber(meaning.compressionRemainingPercent)}%</strong> bump travel left</span>
      </div>
      <div class="sag-position-track" role="img" aria-label="${formatNumber(percent)} percent SAG, ${formatNumber(meaning.compressionRemainingPercent)} percent compression travel remaining">
        <span></span><i></i>
      </div>
      <p>${meaning.sentence} That leaves approximately <strong>${formatMeasurement(meaning.compressionRemainingMm, 'length')}</strong> of compression travel from the loaded position.</p>
    </div>`;
}

function updateSagTargetSummary() {
  const summary = document.getElementById('sagTargetSummary');
  if (!summary) return;
  customTarget.classList.toggle('hidden', sagType.value !== 'custom');
  const profile = sagProfileFor(
    sagType.value,
    sagArea.value,
    document.getElementById('targetMin').value,
    document.getElementById('targetMax').value
  );
  const rangeValid = Number.isFinite(profile.min) && Number.isFinite(profile.max) && profile.min < profile.max;
  summary.innerHTML = `
    <span class="target-chip">${escapeHtml(profile.shortLabel)}</span>
    <div><strong>${rangeValid ? targetRangeText(profile) : 'Enter a valid range'}</strong><p>${escapeHtml(profile.description)}</p></div>`;
  if (lastSagResult) {
    const currentArea = sagArea.value;
    const currentStyle = sagType.value;
    const currentMin = profile.min;
    const currentMax = profile.max;
    if (rangeValid) {
      lastSagResult = {
        ...lastSagResult,
        area: currentArea,
        style: currentStyle,
        label: profile.label,
        min: currentMin,
        max: currentMax,
        guidance: sagGuidance(lastSagResult.percent, currentMin, currentMax)
      };
      renderSagResults();
    }
  }
}

sagType.addEventListener('change', updateSagTargetSummary);
sagArea.addEventListener('change', updateSagTargetSummary);
document.getElementById('targetMin').addEventListener('input', updateSagTargetSummary);
document.getElementById('targetMax').addEventListener('input', updateSagTargetSummary);

let lastSagResult = null;
let lastSagAfterResult = null;

function formatNumber(value) {
  return Number.isFinite(value) ? trimFixed(value, 1) : '—';
}

function sagGuidance(percent, min, max) {
  if (percent < min) return { className: 'low', heading: 'Loaded SAG is below the selected range', text: 'The suspension is sitting high in its travel. Where the manual allows, reduce preload in small steps and remeasure. If the target cannot be reached, the spring may be too firm for this load.' };
  if (percent > max) return { className: 'high', heading: 'Loaded SAG is above the selected range', text: 'The suspension is sitting low in its travel. Where the manual allows, increase preload in small steps and remeasure. If the target cannot be reached, the spring may be too soft for this load.' };
  return { className: 'good', heading: 'Loaded SAG is within the selected starting range', text: 'Record the preload position. If the ride is still harsh, kicking or bouncing, investigate spring rate and damping rather than chasing SAG with more preload.' };
}


function preloadControlFor(area, vehicle) {
  if (area === 'front') {
    return {
      name: 'Top main preload nut / collar',
      increase: 'Move one small increment toward + / more preload. On many forks this is clockwise, but only use that direction when the fork markings or manual confirm it.',
      decrease: 'Move one small increment toward − / less preload. On many forks this is counter-clockwise, but only use that direction when the fork markings or manual confirm it.',
      unavailable: false
    };
  }

  const type = vehicle?.rearPreloadType || 'unknown';
  const controls = {
    'c-spanner': {
      name: 'Main spring preload collar (C-spanner)',
      increase: 'Move the collar so it compresses the spring slightly more. Use one small collar movement, lock it correctly, then remeasure.',
      decrease: 'Move the collar so it compresses the spring slightly less. Use one small collar movement, lock it correctly, then remeasure.',
      unavailable: false
    },
    hydraulic: {
      name: 'Hydraulic preload hand wheel',
      increase: 'Turn one small increment toward + / HARD / more preload, using the marking specified for this shock, then remeasure.',
      decrease: 'Turn one small increment toward − / SOFT / less preload, using the marking specified for this shock, then remeasure.',
      unavailable: false
    },
    stepped: {
      name: 'Stepped spring preload collar',
      increase: 'Move one notch toward the firmer or higher-load position, then remeasure.',
      decrease: 'Move one notch toward the softer or lower-load position, then remeasure.',
      unavailable: false
    },
    electronic: {
      name: 'Electronic preload / load setting',
      increase: 'Select the next higher load or preload setting, then remeasure.',
      decrease: 'Select the next lower load or preload setting, then remeasure.',
      unavailable: false
    },
    fixed: {
      name: 'No external spring preload adjuster',
      increase: 'Do not use damping clickers to imitate a preload change. A spring or internal preload change requires the correct workshop procedure.',
      decrease: 'Do not use damping clickers to imitate a preload change. A spring or internal preload change requires the correct workshop procedure.',
      unavailable: true
    },
    unknown: {
      name: 'Main spring preload adjuster',
      increase: 'Move one small increment in the marked + / more-preload direction, then remeasure. Confirm the direction in the shock or vehicle manual first.',
      decrease: 'Move one small increment in the marked − / less-preload direction, then remeasure. Confirm the direction in the shock or vehicle manual first.',
      unavailable: false
    }
  };
  return controls[type] || controls.unknown;
}

function sagCorrectionPlan(percent, min, max, travelMm, area = 'rear', vehicle = null) {
  const currentSagMm = travelMm * percent / 100;
  const minSagMm = travelMm * min / 100;
  const maxSagMm = travelMm * max / 100;
  const midpointPercent = (min + max) / 2;
  const midpointSagMm = travelMm * midpointPercent / 100;
  const control = preloadControlFor(area, vehicle);

  if (percent > max) {
    return {
      state: 'increase',
      badge: 'Adjust preload only',
      heading: 'Increase spring preload (+)',
      control,
      targetText: `To enter the selected range, reduce loaded SAG by about ${formatMeasurement(currentSagMm - maxSagMm, 'length')} or more. The midpoint is approximately ${formatMeasurement(midpointSagMm, 'length')} (${formatNumber(midpointPercent)}%).`,
      preloadAction: control.increase,
      springWarning: control.unavailable
        ? 'This suspension has no external preload adjustment recorded. Do not compensate with compression or rebound damping.'
        : 'If the target still cannot be reached within the manufacturer’s allowed preload range, the spring may be too soft for this load.'
    };
  }

  if (percent < min) {
    return {
      state: 'decrease',
      badge: 'Adjust preload only',
      heading: 'Decrease spring preload (−)',
      control,
      targetText: `To enter the selected range, increase loaded SAG by about ${formatMeasurement(minSagMm - currentSagMm, 'length')} or more. The midpoint is approximately ${formatMeasurement(midpointSagMm, 'length')} (${formatNumber(midpointPercent)}%).`,
      preloadAction: control.decrease,
      springWarning: control.unavailable
        ? 'This suspension has no external preload adjustment recorded. Do not compensate with compression or rebound damping.'
        : 'If the target still cannot be reached within the manufacturer’s allowed preload range, the spring may be too firm for this load.'
    };
  }

  return {
    state: 'hold',
    badge: 'SAG is in range',
    heading: 'Keep the preload setting',
    control,
    targetText: `Loaded SAG is already inside the selected ${formatNumber(min)}–${formatNumber(max)}% starting range.`,
    preloadAction: 'Record this preload position. Do not change it merely to alter ride firmness.',
    springWarning: 'If the ride is still harsh, kicking, bouncing or bottoming, diagnose damping and spring rate as a separate step.'
  };
}

function baselineDisplay(value) {
  return value ? `Current: ${escapeHtml(value)}` : 'Starting position not entered';
}

function dampingDecisionCard(title, location, value) {
  return `
    <div class="adjustment-control hold">
      <span class="decision-icon">0</span>
      <div>
        <strong>${escapeHtml(title)} — no change</strong>
        <p>${escapeHtml(location)} does not set SAG. Keep it at the recorded starting position.</p>
        <small>${baselineDisplay(value)}</small>
      </div>
    </div>`;
}

function sagCorrectionHtml({ percent, min, max, travelMm, area = 'rear', vehicle = null, baseline = {} }) {
  const plan = sagCorrectionPlan(percent, min, max, travelMm, area, vehicle);
  const preloadSymbol = plan.state === 'increase' ? '+' : plan.state === 'decrease' ? '−' : '0';
  const preloadClass = plan.state === 'hold' ? 'hold' : 'change';
  const compressionName = area === 'front' ? 'Compression clicker' : 'Top / reservoir compression clicker';
  const reboundName = area === 'front' ? 'Rebound clicker' : 'Lower rebound clicker';

  const extraCards = [
    dampingDecisionCard(compressionName, 'Compression damping', baseline.compression),
    dampingDecisionCard(reboundName, 'Rebound damping', baseline.rebound)
  ];

  if (baseline.lsc) {
    extraCards.push(dampingDecisionCard('Low-speed compression', 'Low-speed compression damping', baseline.lsc));
  }
  if (baseline.hsc) {
    extraCards.push(dampingDecisionCard('High-speed compression', 'High-speed compression damping', baseline.hsc));
  }

  return `
    <section class="adjustment-plan ${plan.state}">
      <div class="adjustment-plan-heading">
        <span class="target-chip">${escapeHtml(plan.badge)}</span>
        <div>
          <p class="kicker">How to correct this SAG result</p>
          <h3>${escapeHtml(plan.heading)}</h3>
        </div>
      </div>

      <div class="adjustment-control ${preloadClass}">
        <span class="decision-icon">${preloadSymbol}</span>
        <div>
          <strong>${escapeHtml(plan.control.name)}</strong>
          <p>${escapeHtml(plan.preloadAction)}</p>
          <small>${baselineDisplay(baseline.preload)}</small>
        </div>
      </div>

      <div class="adjustment-control-grid">
        ${extraCards.join('')}
      </div>

      <div class="correction-goal">
        <strong>Measurement goal</strong>
        <p>${escapeHtml(plan.targetText)}</p>
      </div>

      <div class="correction-rule">
        <strong>One change, then remeasure</strong>
        <p>${escapeHtml(plan.springWarning)}</p>
      </div>
    </section>`;
}


function readAfterSag(prefix, travelMm) {
  const l1Mm = getUnitBoundValue(`${prefix}L1`, 'length');
  const l2Mm = getUnitBoundValue(`${prefix}L2`, 'length');
  const l3Mm = getUnitBoundValue(`${prefix}L3`, 'length');
  const values = [l1Mm, l2Mm, l3Mm];
  const supplied = values.filter(value => value !== null).length;

  if (supplied === 0) return { status: 'empty' };
  if (supplied < 3 || values.some(value => !Number.isFinite(value) || value < 0)) return { status: 'partial' };
  if (!(l1Mm >= l2Mm && l1Mm >= l3Mm)) return { status: 'reversed' };

  const staticSagMm = l1Mm - l2Mm;
  const loadedSagMm = l1Mm - l3Mm;
  return {
    status: 'valid',
    travelMm,
    l1Mm,
    l2Mm,
    l3Mm,
    staticSagMm,
    loadedSagMm,
    sagPercent: loadedSagMm / travelMm * 100
  };
}

function sagDistanceFromTarget(percent, min, max) {
  if (percent < min) return min - percent;
  if (percent > max) return percent - max;
  return 0;
}

function sagRecalculationHtml({ prefix, initial }) {
  const unit = unitDefinitions[unitSystem].lengthUnit;
  return `
    <section class="sag-recalculate" data-recalc-prefix="${prefix}">
      <div class="sag-recalculate-heading">
        <div>
          <p class="kicker">After changing preload</p>
          <h3>Remeasure and recalculate</h3>
          <p>Your original measurements stay above. Enter the new measurements after the preload adjustment.</p>
        </div>
        <span class="target-chip">Initial ${formatNumber(initial.percent)}%</span>
      </div>

      <div class="before-after-summary">
        <div><span>Initial L1</span><strong>${formatMeasurement(initial.l1Mm, 'length')}</strong></div>
        <div><span>Initial L2</span><strong>${formatMeasurement(initial.l2Mm, 'length')}</strong></div>
        <div><span>Initial L3</span><strong>${formatMeasurement(initial.l3Mm, 'length')}</strong></div>
        <div><span>Initial loaded SAG</span><strong>${formatMeasurement(initial.loadedSagMm, 'length')} · ${formatNumber(initial.percent)}%</strong></div>
      </div>

      <div class="after-measurement-grid">
        <label><span>New L1 — fully extended</span><span class="input-with-unit"><input id="${prefix}L1" data-recalc-length type="number" inputmode="decimal" min="0" step="0.1"><em>${unit}</em></span></label>
        <label><span>New L2 — vehicle only</span><span class="input-with-unit"><input id="${prefix}L2" data-recalc-length type="number" inputmode="decimal" min="0" step="0.1"><em>${unit}</em></span></label>
        <label><span>New L3 — normal riding load</span><span class="input-with-unit"><input id="${prefix}L3" data-recalc-length type="number" inputmode="decimal" min="0" step="0.1"><em>${unit}</em></span></label>
      </div>

      <div class="form-buttons sag-recalculate-buttons">
        <button type="button" class="primary-button" id="${prefix}Button">Recalculate new SAG</button>
        <button type="button" class="text-button" id="${prefix}Clear">Clear new measurements</button>
      </div>

      <div id="${prefix}Result" class="sag-after-result" aria-live="polite">Enter the three new measurements, then press Recalculate.</div>
    </section>`;
}

function renderAfterSagResult({ prefix, initial, after, min, max, area, vehicle = null, baseline = {} }) {
  const box = document.getElementById(`${prefix}Result`);
  if (!box) return;

  if (after.status === 'partial') {
    box.className = 'sag-after-result warning';
    box.innerHTML = '<strong>Complete all three new measurements</strong><p>Enter new L1, L2 and L3 before recalculating.</p>';
    return;
  }
  if (after.status === 'reversed') {
    box.className = 'sag-after-result warning';
    box.innerHTML = '<strong>Check the new measurements</strong><p>New L1 should normally be the largest measurement.</p>';
    return;
  }
  if (after.status !== 'valid') {
    box.className = 'sag-after-result';
    box.textContent = 'Enter the three new measurements, then press Recalculate.';
    return;
  }

  const guidance = sagGuidance(after.sagPercent, min, max);
  const beforeDistance = sagDistanceFromTarget(initial.percent, min, max);
  const afterDistance = sagDistanceFromTarget(after.sagPercent, min, max);
  const movement = afterDistance < beforeDistance ? 'closer' : afterDistance > beforeDistance ? 'farther' : 'same';
  const movementText = movement === 'closer'
    ? 'The adjustment moved SAG closer to the selected target.'
    : movement === 'farther'
      ? 'The adjustment moved SAG farther from the selected target.'
      : 'The adjustment left SAG the same distance from the selected target.';
  const percentChange = after.sagPercent - initial.percent;
  const sagChangeMm = after.loadedSagMm - initial.loadedSagMm;

  box.className = `sag-after-result ${guidance.className}`;
  box.innerHTML = `
    <p class="kicker">New result</p>
    <h3>${formatNumber(initial.percent)}% → ${formatNumber(after.sagPercent)}%</h3>
    <div class="result-metrics">
      <div class="metric"><strong>${formatMeasurement(after.staticSagMm, 'length')}</strong><span>New static SAG</span></div>
      <div class="metric"><strong>${formatMeasurement(after.loadedSagMm, 'length')}</strong><span>New loaded SAG</span></div>
      <div class="metric"><strong>${percentChange >= 0 ? '+' : ''}${formatNumber(percentChange)}%</strong><span>Percentage change</span></div>
    </div>
    <div class="sag-comparison-line"><span>Loaded SAG change</span><strong>${sagChangeMm >= 0 ? '+' : ''}${formatMeasurement(sagChangeMm, 'length')}</strong></div>
    <div class="result-status ${guidance.className}"><strong>${escapeHtml(guidance.heading)}</strong><p>${escapeHtml(movementText)} ${escapeHtml(guidance.text)}</p></div>
    ${sagPositionHtml(after.sagPercent, after.travelMm)}
    ${sagCorrectionHtml({ percent: after.sagPercent, min, max, travelMm: after.travelMm, area, vehicle, baseline })}`;
}

function bindSagRecalculation({ prefix, initial, min, max, area, vehicle = null, baseline = {}, onAfter = null }) {
  const button = document.getElementById(`${prefix}Button`);
  const clear = document.getElementById(`${prefix}Clear`);
  if (!button || !clear) return;

  document.querySelectorAll(`[data-recalc-prefix="${prefix}"] [data-recalc-length]`).forEach(input => {
    input.addEventListener('input', () => {
      const canonical = canonicalFromDisplay(input.value, 'length');
      if (canonical === null) delete input.dataset.canonical;
      else input.dataset.canonical = String(canonical);
    });
  });

  button.addEventListener('click', () => {
    const after = readAfterSag(prefix, initial.travelMm);
    renderAfterSagResult({ prefix, initial, after, min, max, area, vehicle, baseline });
    if (typeof onAfter === 'function') onAfter(after.status === 'valid' ? after : null);
  });

  clear.addEventListener('click', () => {
    [`${prefix}L1`, `${prefix}L2`, `${prefix}L3`].forEach(id => setUnitBoundValue(id, null, 'length'));
    const box = document.getElementById(`${prefix}Result`);
    if (box) {
      box.className = 'sag-after-result';
      box.textContent = 'Enter the three new measurements, then press Recalculate.';
    }
    if (typeof onAfter === 'function') onAfter(null);
  });
}

function renderSagResults() {
  const results = document.getElementById('sagResults');
  if (!lastSagResult) {
    results.innerHTML = '<p class="kicker">Result</p><h2>Enter the four measurements</h2><p>Your static SAG, loaded SAG and loaded percentage will appear here.</p>';
    return;
  }

  const { l1Mm, l2Mm, l3Mm, staticSagMm, loadedSagMm, percent, min, max, guidance, travelMm, label, style, area } = lastSagResult;
  const initial = { l1Mm, l2Mm, l3Mm, staticSagMm, loadedSagMm, percent, travelMm };
  results.innerHTML = `
    <p class="kicker">Result</p>
    <h2>${formatNumber(percent)}% loaded SAG</h2>
    <p class="result-subtitle">${escapeHtml(area === 'front' ? 'Front forks' : 'Rear shock')} · ${escapeHtml(label || 'Selected target')}</p>
    <div class="result-metrics">
      <div class="metric"><strong>${formatMeasurement(staticSagMm, 'length')}</strong><span>Static SAG</span></div>
      <div class="metric"><strong>${formatMeasurement(loadedSagMm, 'length')}</strong><span>Loaded SAG</span></div>
      <div class="metric"><strong>${formatNumber(min)}–${formatNumber(max)}%</strong><span>Selected range</span></div>
    </div>
    ${sagPositionHtml(percent, travelMm)}
    <div class="result-status ${guidance.className}"><strong>${guidance.heading}</strong><p>${guidance.text}</p></div>
    ${sagCorrectionHtml({ percent, min, max, travelMm, area, vehicle: null, baseline: {} })}
    ${sagRecalculationHtml({ prefix: 'sagAfter', initial })}
    <div class="form-buttons"><button type="button" class="text-button" id="copySagToRecord">Add initial result to setup record</button></div>`;

  bindSagRecalculation({
    prefix: 'sagAfter',
    initial,
    min,
    max,
    area,
    vehicle: null,
    baseline: {},
    onAfter: after => { lastSagAfterResult = after; }
  });

  document.getElementById('copySagToRecord').addEventListener('click', () => {
    setUnitBoundValue('recordStaticSag', staticSagMm, 'length');
    setUnitBoundValue('recordLoadedSag', loadedSagMm, 'length');
    document.getElementById('recordSagPercent').value = formatNumber(percent);
    setField('recordSuspensionArea', area);
    setField('recordTargetStyle', style);
    setField('recordTargetLabel', label);
    setField('recordTargetMin', min);
    setField('recordTargetMax', max);
    setField('recordTravelMm', travelMm);
    setField('recordInitialTravelMm', travelMm);
    setField('recordInitialL1Mm', l1Mm);
    setField('recordInitialL2Mm', l2Mm);
    setField('recordInitialL3Mm', l3Mm);
    if (lastSagAfterResult) {
      setField('recordAfterTravelMm', lastSagAfterResult.travelMm);
      setField('recordAfterL1Mm', lastSagAfterResult.l1Mm);
      setField('recordAfterL2Mm', lastSagAfterResult.l2Mm);
      setField('recordAfterL3Mm', lastSagAfterResult.l3Mm);
      setField('recordAfterStaticSagMm', lastSagAfterResult.staticSagMm);
      setField('recordAfterLoadedSagMm', lastSagAfterResult.loadedSagMm);
      setField('recordAfterSagPercent', lastSagAfterResult.sagPercent);
    }
    showPage('records');
  });
}

document.getElementById('sagForm').addEventListener('submit', event => {
  event.preventDefault();
  const l1Mm = getUnitBoundValue('l1', 'length');
  const l2Mm = getUnitBoundValue('l2', 'length');
  const l3Mm = getUnitBoundValue('l3', 'length');
  const travelMm = getUnitBoundValue('travel', 'length');
  const results = document.getElementById('sagResults');

  if (![l1Mm, l2Mm, l3Mm, travelMm].every(value => Number.isFinite(value) && value >= 0) || travelMm <= 0) {
    lastSagResult = null;
    results.innerHTML = '<div class="result-status warning"><strong>Check the measurements</strong><p>Enter positive numbers for L1, L2, L3 and total suspension travel.</p></div>';
    return;
  }
  if (!(l1Mm >= l2Mm && l1Mm >= l3Mm)) {
    lastSagResult = null;
    results.innerHTML = '<div class="result-status warning"><strong>The measurements look reversed</strong><p>L1 should normally be the largest measurement because the suspension is fully extended.</p></div>';
    return;
  }

  const staticSagMm = l1Mm - l2Mm;
  const loadedSagMm = l1Mm - l3Mm;
  const percent = loadedSagMm / travelMm * 100;
  const profile = sagProfileFor(
    sagType.value,
    sagArea.value,
    document.getElementById('targetMin').value,
    document.getElementById('targetMax').value
  );
  const { min, max } = profile;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    lastSagResult = null;
    results.innerHTML = '<div class="result-status warning"><strong>Check the target range</strong><p>The minimum target must be lower than the maximum target.</p></div>';
    return;
  }

  lastSagResult = {
    l1Mm,
    l2Mm,
    l3Mm,
    staticSagMm,
    loadedSagMm,
    travelMm,
    percent,
    min,
    max,
    area: sagArea.value,
    style: sagType.value,
    label: profile.label,
    guidance: sagGuidance(percent, min, max)
  };
  renderSagResults();
});

document.getElementById('clearSag').addEventListener('click', () => {
  const form = document.getElementById('sagForm');
  form.reset();
  clearUnitBoundValuesWithin(form);
  document.getElementById('sagArea').value = 'rear';
  document.getElementById('sagType').value = 'street';
  customTarget.classList.add('hidden');
  lastSagResult = null;
  lastSagAfterResult = null;
  updateSagTargetSummary();
  renderSagResults();
});

// Setup records -------------------------------------------------------------
const STORAGE_KEY = 'suspensionSetupGuide.records.v6';
const LEGACY_STORAGE_KEYS = ['suspensionSetupGuide.records.v5', 'suspensionSetupGuide.records.v4', 'suspensionSetupGuide.records.v3', 'suspensionSetupGuide.records.v2', 'suspensionSetupGuide.records.v1'];
let storageAvailable = true;

function normaliseRecord(item, fallbackUnit = 'metric') {
  if (!item || typeof item !== 'object') return null;
  const sourceUnit = item.unitSystem === 'imperial' ? 'imperial' : item.unitSystem === 'metric' ? 'metric' : fallbackUnit === 'imperial' ? 'imperial' : 'metric';
  const canonical = (canonicalKey, legacyKey, kind) => {
    const saved = parseNumeric(item[canonicalKey]);
    if (saved !== null) return saved;
    const legacy = parseNumeric(item[legacyKey]);
    if (legacy === null) return null;
    return kind === 'length' ? displayLengthToMm(legacy, sourceUnit) : displayMassToKg(legacy, sourceUnit);
  };

  return {
    schemaVersion: 6,
    id: String(item.id || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`)),
    vehicleName: String(item.vehicleName || ''),
    setupName: String(item.setupName || ''),
    riderWeightKg: canonical('riderWeightKg', 'riderWeight', 'mass'),
    passengerWeightKg: canonical('passengerWeightKg', 'passengerWeight', 'mass'),
    luggageWeightKg: canonical('luggageWeightKg', 'luggageWeight', 'mass'),
    preloadSetting: String(item.preloadSetting || ''),
    compressionSetting: String(item.compressionSetting || ''),
    reboundSetting: String(item.reboundSetting || ''),
    hscSetting: String(item.hscSetting || ''),
    lscSetting: String(item.lscSetting || ''),
    staticSagMm: canonical('staticSagMm', 'staticSag', 'length'),
    loadedSagMm: canonical('loadedSagMm', 'loadedSag', 'length'),
    sagPercent: parseNumeric(item.sagPercent),
    suspensionArea: String(item.suspensionArea || ''),
    targetStyle: String(item.targetStyle || ''),
    targetLabel: String(item.targetLabel || ''),
    targetMinPercent: parseNumeric(item.targetMinPercent),
    targetMaxPercent: parseNumeric(item.targetMaxPercent),
    travelMm: canonical('travelMm', 'travel', 'length'),
    tuningType: String(item.tuningType || ''),
    tuningSymptom: String(item.tuningSymptom || ''),
    tuningAction: String(item.tuningAction || ''),
    tuningOutcome: String(item.tuningOutcome || ''),
    testRoute: String(item.testRoute || ''),
    settingBefore: String(item.settingBefore || ''),
    settingAfter: String(item.settingAfter || ''),
    beforeScore: parseNumeric(item.beforeScore),
    afterScore: parseNumeric(item.afterScore),
    initialTravelMm: parseNumeric(item.initialTravelMm),
    initialL1Mm: parseNumeric(item.initialL1Mm),
    initialL2Mm: parseNumeric(item.initialL2Mm),
    initialL3Mm: parseNumeric(item.initialL3Mm),
    afterTravelMm: parseNumeric(item.afterTravelMm),
    afterL1Mm: parseNumeric(item.afterL1Mm),
    afterL2Mm: parseNumeric(item.afterL2Mm),
    afterL3Mm: parseNumeric(item.afterL3Mm),
    afterStaticSagMm: parseNumeric(item.afterStaticSagMm),
    afterLoadedSagMm: parseNumeric(item.afterLoadedSagMm),
    afterSagPercent: parseNumeric(item.afterSagPercent),
    dampingGoal: String(item.dampingGoal || ''),
    dampingGoalLabel: String(item.dampingGoalLabel || ''),
    dampingGoalSuccess: String(item.dampingGoalSuccess || ''),
    dampingNewIssue: String(item.dampingNewIssue || ''),
    dampingNextAction: String(item.dampingNextAction || ''),
    notes: String(item.notes || ''),
    updatedAt: String(item.updatedAt || new Date().toISOString())
  };
}

function parseRecordPayload(raw) {
  if (!raw) return [];
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const items = Array.isArray(parsed) ? parsed : parsed?.records;
  const fallbackUnit = !Array.isArray(parsed) && parsed?.unitSystem === 'imperial' ? 'imperial' : 'metric';
  if (!Array.isArray(items)) return [];
  return items.map(item => normaliseRecord(item, fallbackUnit)).filter(Boolean);
}

function loadRecords() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return parseRecordPayload(current);
    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy) return parseRecordPayload(legacy);
    }
    return [];
  } catch {
    storageAvailable = false;
    return [];
  }
}

let records = loadRecords();

function saveRecords() {
  if (storageAvailable) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      storageAvailable = false;
    }
  }
  renderRecords();
  populateDampingRecordSelect();
  if (!storageAvailable) showToast('Saved for this session only. Hosting the app enables permanent browser storage.');
  return true;
  refreshLocalSearchIfActive();
}

function getField(id) {
  return document.getElementById(id).value.trim();
}

function setField(id, value = '') {
  document.getElementById(id).value = value;
}

function recordFromForm() {
  return {
    schemaVersion: 6,
    id: getField('recordId') || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    vehicleName: getField('vehicleName'),
    setupName: getField('setupName'),
    riderWeightKg: getUnitBoundValue('riderWeight', 'mass'),
    passengerWeightKg: getUnitBoundValue('passengerWeight', 'mass'),
    luggageWeightKg: getUnitBoundValue('luggageWeight', 'mass'),
    preloadSetting: getField('preloadSetting'),
    compressionSetting: getField('compressionSetting'),
    reboundSetting: getField('reboundSetting'),
    hscSetting: getField('hscSetting'),
    lscSetting: getField('lscSetting'),
    staticSagMm: getUnitBoundValue('recordStaticSag', 'length'),
    loadedSagMm: getUnitBoundValue('recordLoadedSag', 'length'),
    sagPercent: parseNumeric(getField('recordSagPercent')),
    suspensionArea: getField('recordSuspensionArea'),
    targetStyle: getField('recordTargetStyle'),
    targetLabel: getField('recordTargetLabel'),
    targetMinPercent: parseNumeric(getField('recordTargetMin')),
    targetMaxPercent: parseNumeric(getField('recordTargetMax')),
    travelMm: parseNumeric(getField('recordTravelMm')),
    tuningType: getField('recordTuningType'),
    tuningSymptom: getField('recordTuningSymptom'),
    tuningAction: getField('recordTuningAction'),
    tuningOutcome: getField('recordTuningOutcome'),
    testRoute: getField('recordTestRoute'),
    settingBefore: getField('recordSettingBefore'),
    settingAfter: getField('recordSettingAfter'),
    beforeScore: parseNumeric(getField('recordBeforeScore')),
    afterScore: parseNumeric(getField('recordAfterScore')),
    initialTravelMm: parseNumeric(getField('recordInitialTravelMm')),
    initialL1Mm: parseNumeric(getField('recordInitialL1Mm')),
    initialL2Mm: parseNumeric(getField('recordInitialL2Mm')),
    initialL3Mm: parseNumeric(getField('recordInitialL3Mm')),
    afterTravelMm: parseNumeric(getField('recordAfterTravelMm')),
    afterL1Mm: parseNumeric(getField('recordAfterL1Mm')),
    afterL2Mm: parseNumeric(getField('recordAfterL2Mm')),
    afterL3Mm: parseNumeric(getField('recordAfterL3Mm')),
    afterStaticSagMm: parseNumeric(getField('recordAfterStaticSagMm')),
    afterLoadedSagMm: parseNumeric(getField('recordAfterLoadedSagMm')),
    afterSagPercent: parseNumeric(getField('recordAfterSagPercent')),
    dampingGoal: getField('recordDampingGoal'),
    dampingGoalLabel: getField('recordDampingGoalLabel'),
    dampingGoalSuccess: getField('recordDampingGoalSuccess'),
    dampingNewIssue: getField('recordDampingNewIssue'),
    dampingNextAction: getField('recordDampingNextAction'),
    notes: getField('recordNotes'),
    updatedAt: new Date().toISOString()
  };
}

function clearRecordForm() {
  const form = document.getElementById('recordForm');
  form.reset();
  clearUnitBoundValuesWithin(form);
  setField('recordId');
}

document.getElementById('recordForm').addEventListener('submit', event => {
  event.preventDefault();
  const record = recordFromForm();
  if (!record.vehicleName) {
    document.getElementById('vehicleName').focus();
    showToast('Enter the vehicle name first.');
    return;
  }
  if (!record.setupName) {
    document.getElementById('setupName').focus();
    showToast('Give this setup a name first.');
    return;
  }
  const index = records.findIndex(item => item.id === record.id);
  const editing = index >= 0;
  if (editing) records[index] = record;
  else records.unshift(record);
  if (saveRecords()) {
    clearRecordForm();
    showToast(editing ? 'Setup updated.' : 'Setup saved.');
  }
});

document.getElementById('newRecord').addEventListener('click', clearRecordForm);

function exportRecords() {
  const payload = {
    app: 'Suspension Setup Guide',
    formatVersion: 6,
    exportedAt: new Date().toISOString(),
    unitSystem,
    canonicalUnits: { length: 'millimetres', mass: 'kilograms' },
    records
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `suspension-setup-records-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(records.length ? 'Records exported.' : 'Empty records backup exported.');
}

document.getElementById('exportRecords').addEventListener('click', exportRecords);

function editRecord(id) {
  const record = records.find(item => item.id === id);
  if (!record) return;
  const textMapping = {
    recordId: 'id',
    vehicleName: 'vehicleName',
    setupName: 'setupName',
    preloadSetting: 'preloadSetting',
    compressionSetting: 'compressionSetting',
    reboundSetting: 'reboundSetting',
    hscSetting: 'hscSetting',
    lscSetting: 'lscSetting',
    recordNotes: 'notes',
    recordSuspensionArea: 'suspensionArea',
    recordTargetStyle: 'targetStyle',
    recordTargetLabel: 'targetLabel',
    recordTuningType: 'tuningType',
    recordTuningSymptom: 'tuningSymptom',
    recordTuningAction: 'tuningAction',
    recordTuningOutcome: 'tuningOutcome',
    recordTestRoute: 'testRoute',
    recordSettingBefore: 'settingBefore',
    recordSettingAfter: 'settingAfter',
    recordDampingGoal: 'dampingGoal',
    recordDampingGoalLabel: 'dampingGoalLabel',
    recordDampingGoalSuccess: 'dampingGoalSuccess',
    recordDampingNewIssue: 'dampingNewIssue',
    recordDampingNextAction: 'dampingNextAction'
  };
  Object.entries(textMapping).forEach(([fieldId, key]) => setField(fieldId, record[key] ?? ''));
  setUnitBoundValue('riderWeight', record.riderWeightKg, 'mass');
  setUnitBoundValue('passengerWeight', record.passengerWeightKg, 'mass');
  setUnitBoundValue('luggageWeight', record.luggageWeightKg, 'mass');
  setUnitBoundValue('recordStaticSag', record.staticSagMm, 'length');
  setUnitBoundValue('recordLoadedSag', record.loadedSagMm, 'length');
  setField('recordSagPercent', record.sagPercent === null ? '' : formatNumber(record.sagPercent));
  setField('recordTargetMin', record.targetMinPercent === null ? '' : record.targetMinPercent);
  setField('recordTargetMax', record.targetMaxPercent === null ? '' : record.targetMaxPercent);
  setField('recordTravelMm', record.travelMm === null ? '' : record.travelMm);
  setField('recordBeforeScore', record.beforeScore === null ? '' : record.beforeScore);
  setField('recordAfterScore', record.afterScore === null ? '' : record.afterScore);
  showPage('records');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRecord(id) {
  if (!confirm('Delete this setup record?')) return;
  records = records.filter(item => item.id !== id);
  if (saveRecords()) showToast('Setup deleted.');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function renderRecords() {
  const list = document.getElementById('recordList');
  if (!list) return;
  document.getElementById('recordCount').textContent = `${records.length} ${records.length === 1 ? 'record' : 'records'}`;
  if (!records.length) {
    list.innerHTML = '<div class="empty-state">No test-history entries yet. Save the current baseline before changing anything.</div>';
    return;
  }

  list.innerHTML = '';
  records.forEach(record => {
    const card = document.createElement('article');
    card.className = 'record-card';
    const load = [
      record.riderWeightKg !== null && `Rider ${formatMeasurement(record.riderWeightKg, 'mass')}`,
      record.passengerWeightKg !== null && `Passenger ${formatMeasurement(record.passengerWeightKg, 'mass')}`,
      record.luggageWeightKg !== null && `Luggage ${formatMeasurement(record.luggageWeightKg, 'mass')}`
    ].filter(Boolean).join(' · ');
    const sagParts = [
      record.loadedSagMm !== null && `Loaded SAG ${formatMeasurement(record.loadedSagMm, 'length')}`,
      record.sagPercent !== null && `${formatNumber(record.sagPercent)}%`
    ].filter(Boolean).join(' · ');
    const targetText = record.targetLabel
      ? `${record.suspensionArea === 'front' ? 'Front forks' : 'Rear shock'} · ${record.targetLabel}${record.targetMinPercent !== null && record.targetMaxPercent !== null ? ` ${formatNumber(record.targetMinPercent)}–${formatNumber(record.targetMaxPercent)}%` : ''}`
      : '';
    const tuningText = record.tuningType
      ? `${record.tuningType}${record.tuningAction ? ` · ${record.tuningAction}` : ''}${record.tuningOutcome ? ` · ${record.tuningOutcome}` : ''}`
      : '';
    const tuningScores = record.beforeScore !== null && record.afterScore !== null
      ? `Symptom ${formatNumber(record.beforeScore)} → ${formatNumber(record.afterScore)}`
      : '';
    const sagComparisonText = record.sagPercent !== null && record.afterSagPercent !== null
      ? `SAG ${formatNumber(record.sagPercent)}% → ${formatNumber(record.afterSagPercent)}%`
      : '';
    const dampingGoalText = record.dampingGoalLabel ? `Goal: ${record.dampingGoalLabel}` : '';
    const safeId = escapeHtml(record.id);
    card.innerHTML = `
      <h3>${escapeHtml(record.setupName)}</h3>
      <p class="meta">${escapeHtml(record.vehicleName)}</p>
      ${load ? `<p class="meta">${escapeHtml(load)}</p>` : ''}
      ${sagParts ? `<p class="meta">${escapeHtml(sagParts)}</p>` : ''}
      ${targetText ? `<p class="meta">${escapeHtml(targetText)}</p>` : ''}
      ${tuningText ? `<p class="meta tuning-record-line">${escapeHtml(tuningText)}</p>` : ''}
      ${tuningScores ? `<p class="meta">${escapeHtml(tuningScores)}</p>` : ''}
      ${sagComparisonText ? `<p class="meta tuning-record-line">${escapeHtml(sagComparisonText)}</p>` : ''}
      ${dampingGoalText ? `<p class="meta">${escapeHtml(dampingGoalText)}</p>` : ''}
      ${record.dampingNextAction ? `<p class="meta">${escapeHtml(record.dampingNextAction)}</p>` : ''}
      ${record.testRoute ? `<p class="meta">Test: ${escapeHtml(record.testRoute)}</p>` : ''}
      ${record.notes ? `<p class="meta">${escapeHtml(record.notes.slice(0, 160))}${record.notes.length > 160 ? '…' : ''}</p>` : ''}
      <div class="record-actions"><button type="button" data-tune-record="${safeId}">Fine-tune damping</button><button type="button" data-edit="${safeId}">Edit</button><button type="button" data-delete="${safeId}">Delete</button></div>`;
    list.appendChild(card);
  });
  list.querySelectorAll('[data-tune-record]').forEach(button => button.addEventListener('click', () => startDampingWithRecord(button.dataset.tuneRecord)));
  list.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => editRecord(button.dataset.edit)));
  list.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => deleteRecord(button.dataset.delete)));
}


// Vehicle profiles ----------------------------------------------------------
const VEHICLE_STORAGE_KEY = 'suspensionSetupGuide.vehicles.v1';
let vehicleStorageAvailable = true;

function vehicleId() {
  return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function normaliseVehicleSetupArea(area) {
  const value = area && typeof area === 'object' ? area : {};
  return {
    style: String(value.style || 'street'), travelMm: parseNumeric(value.travelMm), l1Mm: parseNumeric(value.l1Mm), l2Mm: parseNumeric(value.l2Mm), l3Mm: parseNumeric(value.l3Mm),
    staticSagMm: parseNumeric(value.staticSagMm), loadedSagMm: parseNumeric(value.loadedSagMm), sagPercent: parseNumeric(value.sagPercent),
    preload: String(value.preload || ''), compression: String(value.compression || ''), rebound: String(value.rebound || ''), lsc: String(value.lsc || ''), hsc: String(value.hsc || ''),
    convention: String(value.convention || 'clicks-out'),
    leftL1Mm: parseNumeric(value.leftL1Mm), leftL2Mm: parseNumeric(value.leftL2Mm), leftL3Mm: parseNumeric(value.leftL3Mm),
    rightL1Mm: parseNumeric(value.rightL1Mm), rightL2Mm: parseNumeric(value.rightL2Mm), rightL3Mm: parseNumeric(value.rightL3Mm),
    notes: String(value.notes || ''), updatedAt: String(value.updatedAt || '')
  };
}

function normaliseVehicle(item) {
  if (!item || typeof item !== 'object') return null;
  const adjusters = item.adjusters && typeof item.adjusters === 'object' ? item.adjusters : {};
  const setup = item.setup && typeof item.setup === 'object' ? item.setup : {};
  return {
    id: String(item.id || vehicleId()),
    profileName: String(item.profileName || ''),
    type: String(item.type || 'other'),
    make: String(item.make || ''),
    model: String(item.model || ''),
    year: String(item.year || ''),
    rearShockBrand: String(item.rearShockBrand || ''),
    rearShockModel: String(item.rearShockModel || ''),
    rearPreloadType: String(item.rearPreloadType || 'unknown'),
    frontForkBrand: String(item.frontForkBrand || ''),
    frontForkModel: String(item.frontForkModel || ''),
    adjusters: {
      rearPreload: Boolean(adjusters.rearPreload),
      rearCompression: Boolean(adjusters.rearCompression),
      rearRebound: Boolean(adjusters.rearRebound),
      rearLsc: Boolean(adjusters.rearLsc),
      rearHsc: Boolean(adjusters.rearHsc),
      frontPreload: Boolean(adjusters.frontPreload),
      frontCompression: Boolean(adjusters.frontCompression),
      frontRebound: Boolean(adjusters.frontRebound)
    },
    setup: { name: String(setup.name || ''), rear: normaliseVehicleSetupArea(setup.rear), front: normaliseVehicleSetupArea(setup.front) },
    notes: String(item.notes || ''),
    updatedAt: String(item.updatedAt || new Date().toISOString())
  };
}

function loadVehicles() {
  try {
    const raw = localStorage.getItem(VEHICLE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normaliseVehicle).filter(Boolean);
  } catch {
    vehicleStorageAvailable = false;
    return [];
  }
}

let vehicles = loadVehicles();

function saveVehicles() {
  if (vehicleStorageAvailable) {
    try {
      localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehicles));
    } catch {
      vehicleStorageAvailable = false;
    }
  }
  renderVehicles();
  populateGuidedVehicleSelect();
  populateDampingVehicleSelect();
  populateCompleteVehicleSelect();
  if (!vehicleStorageAvailable) showToast('Vehicle profiles are saved for this session only.');
  return true;
  refreshLocalSearchIfActive();
}

function vehicleFromForm() {
  const existingId = getField('vehicleId');
  const existing = vehicles.find(item => item.id === existingId);
  return normaliseVehicle({
    id: existingId || vehicleId(),
    profileName: getField('vehicleProfileName'),
    type: getField('vehicleType'),
    make: getField('vehicleMake'),
    model: getField('vehicleModel'),
    year: getField('vehicleYear'),
    rearShockBrand: getField('rearShockBrand'),
    rearShockModel: getField('rearShockModel'),
    rearPreloadType: getField('rearPreloadType'),
    frontForkBrand: getField('frontForkBrand'),
    frontForkModel: getField('frontForkModel'),
    adjusters: {
      rearPreload: document.getElementById('rearHasPreload').checked,
      rearCompression: document.getElementById('rearHasCompression').checked,
      rearRebound: document.getElementById('rearHasRebound').checked,
      rearLsc: document.getElementById('rearHasLsc').checked,
      rearHsc: document.getElementById('rearHasHsc').checked,
      frontPreload: document.getElementById('frontHasPreload').checked,
      frontCompression: document.getElementById('frontHasCompression').checked,
      frontRebound: document.getElementById('frontHasRebound').checked
    },
    setup: existing?.setup || { name: '', rear: {}, front: {} },
    notes: getField('vehicleNotes'),
    updatedAt: new Date().toISOString()
  });
}

function resetVehicleForm() {
  document.getElementById('vehicleForm').reset();
  setField('vehicleId', '');
  document.getElementById('rearHasPreload').checked = true;
  document.getElementById('vehicleProfileName').focus();
}

function editVehicle(id) {
  const vehicle = vehicles.find(item => item.id === id);
  if (!vehicle) return;
  setField('vehicleId', vehicle.id);
  setField('vehicleProfileName', vehicle.profileName);
  setField('vehicleType', vehicle.type);
  setField('vehicleMake', vehicle.make);
  setField('vehicleModel', vehicle.model);
  setField('vehicleYear', vehicle.year);
  setField('rearShockBrand', vehicle.rearShockBrand);
  setField('rearShockModel', vehicle.rearShockModel);
  setField('rearPreloadType', vehicle.rearPreloadType);
  setField('frontForkBrand', vehicle.frontForkBrand);
  setField('frontForkModel', vehicle.frontForkModel);
  setField('vehicleNotes', vehicle.notes);
  document.getElementById('rearHasPreload').checked = vehicle.adjusters.rearPreload;
  document.getElementById('rearHasCompression').checked = vehicle.adjusters.rearCompression;
  document.getElementById('rearHasRebound').checked = vehicle.adjusters.rearRebound;
  document.getElementById('rearHasLsc').checked = vehicle.adjusters.rearLsc;
  document.getElementById('rearHasHsc').checked = vehicle.adjusters.rearHsc;
  document.getElementById('frontHasPreload').checked = vehicle.adjusters.frontPreload;
  document.getElementById('frontHasCompression').checked = vehicle.adjusters.frontCompression;
  document.getElementById('frontHasRebound').checked = vehicle.adjusters.frontRebound;
  showPage('vehicles');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteVehicle(id) {
  if (!confirm('Delete this vehicle profile? Saved setup records will not be deleted.')) return;
  vehicles = vehicles.filter(item => item.id !== id);
  saveVehicles();
  showToast('Vehicle deleted.');
}

function vehicleTypeLabel(value) {
  return ({
    'road-motorcycle': 'Road motorcycle',
    'can-am-spyder': 'Can-Am Spyder / road trike',
    'dirt-bike': 'Dirt bike / enduro',
    adventure: 'Adventure motorcycle',
    track: 'Track / race motorcycle',
    atv: 'ATV / side-by-side',
    other: 'Other'
  })[value] || 'Other';
}

function rearPreloadLabel(value) {
  return ({
    unknown: 'Preload type not identified',
    'c-spanner': 'C-spanner / threaded collar',
    hydraulic: 'Hydraulic preload',
    stepped: 'Stepped preload collar',
    electronic: 'Electronic preload',
    fixed: 'No external preload'
  })[value] || 'Preload type not identified';
}

function fittedAdjusterLabels(vehicle) {
  const a = vehicle.adjusters;
  return [
    a.rearPreload && 'Rear preload',
    a.rearCompression && 'Rear compression',
    a.rearRebound && 'Rear rebound',
    a.rearLsc && 'Rear LSC',
    a.rearHsc && 'Rear HSC',
    a.frontPreload && 'Front preload',
    a.frontCompression && 'Front compression',
    a.frontRebound && 'Front rebound'
  ].filter(Boolean);
}

function renderVehicles() {
  const list = document.getElementById('vehicleList');
  if (!list) return;
  document.getElementById('vehicleCount').textContent = `${vehicles.length} ${vehicles.length === 1 ? 'vehicle' : 'vehicles'}`;
  if (!vehicles.length) {
    list.innerHTML = '<div class="empty-state">No vehicle profiles yet. Add the first vehicle above, or use the guided setup without saving one.</div>';
    return;
  }
  list.innerHTML = '';
  vehicles
    .slice()
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .forEach(vehicle => {
      const card = document.createElement('article');
      card.className = 'record-card vehicle-card';
      const identity = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ');
      const suspension = [vehicle.rearShockBrand, vehicle.rearShockModel].filter(Boolean).join(' ');
      const fitted = fittedAdjusterLabels(vehicle);
      const rearSetup = vehicle.setup.rear; const frontSetup = vehicle.setup.front;
      const rearSummary = [rearSetup.sagPercent !== null && `SAG ${formatNumber(rearSetup.sagPercent)}%`, rearSetup.preload && `Preload ${rearSetup.preload}`, rearSetup.compression && `C ${rearSetup.compression}`, rearSetup.rebound && `R ${rearSetup.rebound}`].filter(Boolean).join(' · ');
      const frontSummary = [frontSetup.sagPercent !== null && `SAG ${formatNumber(frontSetup.sagPercent)}%`, frontSetup.preload && `Preload ${frontSetup.preload}`, frontSetup.compression && `C ${frontSetup.compression}`, frontSetup.rebound && `R ${frontSetup.rebound}`].filter(Boolean).join(' · ');
      card.innerHTML = `
        <div class="record-card-heading">
          <div><h3>${escapeHtml(vehicle.profileName)}</h3><p class="meta">${escapeHtml(identity || vehicleTypeLabel(vehicle.type))}</p></div>
          <span class="profile-chip">${escapeHtml(vehicleTypeLabel(vehicle.type))}</span>
        </div>
        ${suspension ? `<p class="meta">Rear shock: ${escapeHtml(suspension)} · ${escapeHtml(rearPreloadLabel(vehicle.rearPreloadType))}</p>` : ''}
        <p class="meta">${escapeHtml(fitted.length ? fitted.join(' · ') : 'Adjusters not identified yet')}</p>
        <div class="vehicle-setup-summary"><div><span>Rear current setup</span><strong>${escapeHtml(rearSummary || 'Not saved yet')}</strong></div><div><span>Front current setup</span><strong>${escapeHtml(frontSummary || 'Not saved yet')}</strong></div></div>
        <div class="record-actions">
          <button type="button" data-complete-vehicle="${escapeHtml(vehicle.id)}">Complete setup</button>
          <button type="button" data-use-vehicle="${escapeHtml(vehicle.id)}">Guided SAG</button>
          <button type="button" data-edit-vehicle="${escapeHtml(vehicle.id)}">Edit</button>
          <button type="button" data-delete-vehicle="${escapeHtml(vehicle.id)}">Delete</button>
        </div>`;
      list.appendChild(card);
    });

  list.querySelectorAll('[data-complete-vehicle]').forEach(button => button.addEventListener('click', () => startCompleteWithVehicle(button.dataset.completeVehicle)));
  list.querySelectorAll('[data-use-vehicle]').forEach(button => button.addEventListener('click', () => startGuidedWithVehicle(button.dataset.useVehicle)));
  list.querySelectorAll('[data-edit-vehicle]').forEach(button => button.addEventListener('click', () => editVehicle(button.dataset.editVehicle)));
  list.querySelectorAll('[data-delete-vehicle]').forEach(button => button.addEventListener('click', () => deleteVehicle(button.dataset.deleteVehicle)));
}

document.getElementById('vehicleForm')?.addEventListener('submit', event => {
  event.preventDefault();
  const vehicle = vehicleFromForm();
  if (!vehicle.profileName) {
    showToast('Give the vehicle profile a name.');
    document.getElementById('vehicleProfileName').focus();
    return;
  }
  const index = vehicles.findIndex(item => item.id === vehicle.id);
  if (index >= 0) vehicles[index] = vehicle;
  else vehicles.unshift(vehicle);
  saveVehicles();
  resetVehicleForm();
  showToast(index >= 0 ? 'Vehicle updated.' : 'Vehicle saved.');
});
document.getElementById('newVehicle')?.addEventListener('click', resetVehicleForm);


const completeDampingSymptoms = {
  'compression-harsh': {
    control: 'compression',
    direction: 'decrease',
    title: 'Harsh as the bump is hit',
    observe: 'Use the same safe pothole or bump at approximately the same speed. Score the sharp impact while the suspension moves inward.',
    target: 'The first impact should feel less sharp without creating extra dive, wallow or bottoming.',
    tooFar: 'New dive, wallow, bottoming or vague control means too much compression damping was removed.'
  },
  'compression-soft': {
    control: 'compression',
    direction: 'increase',
    title: 'Dives, wallows or bottoms',
    observe: 'Repeat the same dip, braking load or broad compression. Score how much travel is used while the suspension moves inward.',
    target: 'Gain support and reduce bottoming without making potholes or sharp bumps harsh.',
    tooFar: 'New sharpness, deflection or reduced grip means too much compression damping was added.'
  },
  'rebound-fast': {
    control: 'rebound',
    direction: 'increase',
    title: 'Kicks or bounces after the bump',
    observe: 'Watch and feel what happens after the wheel has crossed the bump. Score the upward kick or second bounce.',
    target: 'The suspension should return once and settle calmly without launching the rider or passenger.',
    tooFar: 'Packing down or becoming harsher through repeated bumps means too much rebound damping was added.'
  },
  'rebound-slow': {
    control: 'rebound',
    direction: 'decrease',
    title: 'Packs down over repeated bumps',
    observe: 'Use the same ripple, corrugation or repeated-bump section. Score whether ride height drops and harshness builds.',
    target: 'The suspension should recover between bumps and maintain ride height.',
    tooFar: 'New kick, bounce or an uncontrolled fast return means too much rebound damping was removed.'
  },
  'hsc-harsh': {
    control: 'hsc',
    fallback: 'compression',
    direction: 'decrease',
    title: 'Harsh on a sharp edge or pothole',
    observe: 'Use one safe, repeatable square edge, pothole or rock. Score sharp deflection at the impact.',
    target: 'Reduce sharp-impact harshness without increasing hard bottoming.',
    tooFar: 'More bottoming on rapid impacts means too much HSC was removed.'
  },
  'hsc-soft': {
    control: 'hsc',
    fallback: 'compression',
    direction: 'increase',
    title: 'Bottoms on a sharp impact',
    observe: 'Use a safe repeatable sharp impact or landing. Score the severity of bottoming.',
    target: 'Increase bottoming resistance without creating a locked or sharp feeling.',
    tooFar: 'New harshness or deflection means too much HSC was added.'
  },
  'lsc-soft': {
    control: 'lsc',
    fallback: 'compression',
    direction: 'increase',
    title: 'Too much squat, dive or wallow',
    observe: 'Repeat the same smooth braking, acceleration or cornering load. Score chassis movement.',
    target: 'Gain support without reducing grip or comfort through normal movement.',
    tooFar: 'New stiffness or loss of grip means too much LSC was added.'
  },
  'lsc-harsh': {
    control: 'lsc',
    fallback: 'compression',
    direction: 'decrease',
    title: 'Too firm during gradual load transfer',
    observe: 'Repeat the same smooth corner, braking load or rolling terrain. Score comfort and grip.',
    target: 'Allow freer movement without creating excessive dive or wallow.',
    tooFar: 'New dive or wallow means too much LSC was removed.'
  }
};

function completeControlLabel(area, control) {
  if (area === 'rear') {
    return {
      compression: 'Top small compression clicker — shock body or reservoir, marked COMP/C',
      rebound: 'Lower small rebound clicker — near the bottom shock eye, marked REB/R',
      lsc: 'Low-speed compression adjuster — marked LSC',
      hsc: 'High-speed compression adjuster — marked HSC'
    }[control];
  }
  return {
    compression: 'Fork compression adjuster — follow the COMP/C marking',
    rebound: 'Fork rebound adjuster — follow the REB/R marking'
  }[control];
}

function completeControlValue(area, control) {
  const prefix = completeAreaPrefix(area);
  const suffix = {
    compression: 'Compression',
    rebound: 'Rebound',
    lsc: 'Lsc',
    hsc: 'Hsc'
  }[control];
  return suffix ? getField(`${prefix}${suffix}`) : '';
}

function completeConvention(area) {
  return document.getElementById(`${completeAreaPrefix(area)}Convention`).value;
}

function completeSuggestedDampingSetting(area, current, direction) {
  const convention = completeConvention(area);
  const match = String(current || '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  const number = match ? Number(match[0]) : null;
  const increase = direction === 'increase';
  const directionText = increase
    ? 'toward + / HARD / more damping'
    : 'toward − / SOFT / less damping';

  if (number === null || convention === 'unknown' || convention === 'marked-scale') {
    const amount = convention === 'turns-out' ? 'one-eighth turn' : 'one click or one marked step';
    return {
      exact: '',
      display: `${amount} ${directionText}`,
      instruction: `Move only ${amount} ${directionText}. Confirm the physical turning direction from the actual markings or manufacturer manual.`
    };
  }

  const step = convention === 'turns-out' ? 0.125 : 1;
  const next = increase ? Math.max(0, number - step) : number + step;
  const nextText = trimFixed(next, convention === 'turns-out' ? 3 : 0);
  const unit = convention === 'turns-out' ? 'turns out' : 'clicks out';

  return {
    exact: nextText,
    display: `${current} → ${nextText} ${unit}`,
    instruction: `${increase ? 'Close' : 'Open'} the adjuster by ${convention === 'turns-out' ? 'one-eighth turn' : 'one click'}: ${current} → ${nextText} ${unit}. This is ${directionText}.`
  };
}

function renderCompleteSagHelp(area, values) {
  const prefix = completeAreaPrefix(area);
  const box = document.getElementById(`${prefix}SagHelp`);
  if (!box) return;

  if (values.status !== 'valid') {
    box.className = 'complete-inline-help';
    box.textContent = 'Complete the SAG calculation to receive the exact preload correction.';
    return;
  }

  const vehicle = selectedCompleteVehicle();
  const profile = sagProfileFor(values.style, area);
  const baseline = {
    preload: getField(`${prefix}Preload`),
    compression: getField(`${prefix}Compression`),
    rebound: getField(`${prefix}Rebound`),
    lsc: area === 'rear' ? getField(`${prefix}Lsc`) : '',
    hsc: area === 'rear' ? getField(`${prefix}Hsc`) : ''
  };

  box.className = 'complete-inline-help active';
  box.innerHTML = sagCorrectionHtml({
    percent: values.sagPercent,
    min: profile.min,
    max: profile.max,
    travelMm: values.travelMm,
    area,
    vehicle,
    baseline
  });
}

function renderCompleteDampingAdvice(area) {
  const prefix = completeAreaPrefix(area);
  const symptomKey = document.getElementById(`${prefix}Symptom`).value;
  const score = parseNumeric(document.getElementById(`${prefix}SymptomScore`).value);
  const box = document.getElementById(`${prefix}DampingHelp`);
  const symptom = completeDampingSymptoms[symptomKey];

  if (!symptom) {
    box.className = 'complete-inline-help warning';
    box.innerHTML = '<strong>Choose one ride symptom first.</strong><span>The app will identify whether compression or rebound should be tested.</span>';
    return;
  }

  let control = symptom.control;
  let current = completeControlValue(area, control);
  let fallbackUsed = false;

  if (!current && symptom.fallback) {
    control = symptom.fallback;
    current = completeControlValue(area, control);
    fallbackUsed = true;
  }

  if (!current) {
    box.className = 'complete-inline-help warning';
    box.innerHTML = `<strong>Enter the current ${escapeHtml(control.toUpperCase())} setting first.</strong><span>Do not turn a different clicker merely because the correct setting is missing.</span>`;
    return;
  }

  const advice = completeSuggestedDampingSetting(area, current, symptom.direction);
  const otherControl = control === 'rebound' ? 'compression' : 'rebound';
  const otherValue = completeControlValue(area, otherControl);
  const sign = symptom.direction === 'increase' ? '+' : '−';
  const action = symptom.direction === 'increase' ? 'Increase damping' : 'Decrease damping';

  box.className = 'complete-inline-help active';
  box.innerHTML = `
    <section class="complete-advice-output">
      <div class="damping-diagnosis">
        <span class="target-chip">${area === 'rear' ? 'Rear shock' : 'Front forks'}</span>
        <div><h3>${escapeHtml(symptom.title)}</h3><p>${escapeHtml(symptom.observe)}</p></div>
      </div>

      ${fallbackUsed ? `<div class="result-status warning"><strong>No separate ${escapeHtml(symptom.control.toUpperCase())} value is recorded</strong><p>The main compression setting is being used as a cautious fallback. The model manual takes priority.</p></div>` : ''}

      <div class="adjustment-control change">
        <span class="decision-icon">${sign}</span>
        <div>
          <strong>${escapeHtml(action)} — ${escapeHtml(completeControlLabel(area, control))}</strong>
          <p>${escapeHtml(advice.instruction)}</p>
          <small>Initial setting: ${escapeHtml(current)}${score !== null ? ` · Symptom score: ${formatNumber(score)}/5` : ''}</small>
        </div>
      </div>

      <div class="adjustment-control hold">
        <span class="decision-icon">0</span>
        <div>
          <strong>${escapeHtml(completeControlLabel(area, otherControl))} — no change</strong>
          <p>Hold the other main clicker at its saved starting position during this test.</p>
          <small>${otherValue ? `Keep at ${escapeHtml(otherValue)}` : 'Starting position not entered'}</small>
        </div>
      </div>

      <div class="fine-tune-target">
        <div><strong>What improvement looks like</strong><p>${escapeHtml(symptom.target)}</p></div>
        <div><strong>What means you went too far</strong><p>${escapeHtml(symptom.tooFar)}</p></div>
      </div>

      <div class="correction-rule">
        <strong>Measure it properly</strong>
        <p>Use the same load, tyre pressures, safe section, speed and line. Change only this one adjuster, repeat the section, then score the same symptom again.</p>
      </div>
    </section>`;
}

function startCompleteDampingTest(area) {
  const vehicle = selectedCompleteVehicle();
  if (!vehicle) {
    showToast('Choose a saved vehicle first.');
    return;
  }

  populateDampingVehicleSelect(vehicle.id);
  document.getElementById('dampingArea').value = area;
  applyDampingVehicle(vehicle);

  const prefix = completeAreaPrefix(area);
  const symptom = document.getElementById(`${prefix}Symptom`).value;
  const score = document.getElementById(`${prefix}SymptomScore`).value;

  if (symptom) {
    const radio = document.querySelector(`input[name="dampingSymptom"][value="${symptom}"]`);
    if (radio) {
      radio.checked = true;
      dampingSelectedSymptom = symptom;
      updateDampingMeasureGuide();
    }
  }
  if (score) document.getElementById('dampingBeforeScore').value = score;

  setDampingStep(1);
  showPage('damping');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// Complete vehicle setup ---------------------------------------------------
let completeSagCache = { rear: null, front: null };
function completeAreaPrefix(area) { return area === 'front' ? 'completeFront' : 'completeRear'; }
function populateCompleteVehicleSelect(selectedId = null) {
  const select=document.getElementById('completeVehicleSelect'); if(!select) return;
  const current=selectedId ?? select.value ?? ''; select.innerHTML='<option value="">Choose a saved vehicle</option>';
  vehicles.slice().sort((a,b)=>a.profileName.localeCompare(b.profileName)).forEach(v=>{const o=document.createElement('option');o.value=v.id;o.textContent=v.profileName;select.appendChild(o);});
  select.value=vehicles.some(v=>v.id===current)?current:''; updateCompleteVehicleSummary();
}
function selectedCompleteVehicle(){const id=document.getElementById('completeVehicleSelect')?.value;return vehicles.find(v=>v.id===id)||null;}
function setCompleteAreaFields(area,setup){const p=completeAreaPrefix(area),v=normaliseVehicleSetupArea(setup);document.getElementById(`${p}Style`).value=v.style;setUnitBoundValue(`${p}Travel`,v.travelMm,'length');setUnitBoundValue(`${p}L1`,v.l1Mm,'length');setUnitBoundValue(`${p}L2`,v.l2Mm,'length');setUnitBoundValue(`${p}L3`,v.l3Mm,'length');setField(`${p}Preload`,v.preload);setField(`${p}Compression`,v.compression);setField(`${p}Rebound`,v.rebound);if(area==='rear'){setField(`${p}Lsc`,v.lsc);setField(`${p}Hsc`,v.hsc);}else{setUnitBoundValue('completeFrontLeftL1',v.leftL1Mm,'length');setUnitBoundValue('completeFrontLeftL2',v.leftL2Mm,'length');setUnitBoundValue('completeFrontLeftL3',v.leftL3Mm,'length');setUnitBoundValue('completeFrontRightL1',v.rightL1Mm,'length');setUnitBoundValue('completeFrontRightL2',v.rightL2Mm,'length');setUnitBoundValue('completeFrontRightL3',v.rightL3Mm,'length');}document.getElementById(`${p}Convention`).value=v.convention;setField(`${p}Notes`,v.notes);completeSagCache[area]=v.sagPercent!==null?v:null;renderCompleteSag(area);}
function updateCompleteVehicleSummary(){const v=selectedCompleteVehicle(),b=document.getElementById('completeVehicleSummary');if(!b)return;if(!v){b.className='selection-summary';b.textContent='Create or choose a vehicle before saving its complete setup.';setField('completeSetupName','');setCompleteAreaFields('rear',{});setCompleteAreaFields('front',{});return;}const identity=[v.make,v.model,v.year].filter(Boolean).join(' ');b.className='selection-summary success';b.innerHTML=`<strong>${escapeHtml(v.profileName)}</strong><span>${escapeHtml(identity||vehicleTypeLabel(v.type))}</span><small>Rear and front values below are stored together under this one vehicle.</small>`;setField('completeSetupName',v.setup.name);setCompleteAreaFields('rear',v.setup.rear);setCompleteAreaFields('front',v.setup.front);
  ['rear','front'].forEach(area => {
    const prefix = completeAreaPrefix(area);
    document.getElementById(`${prefix}Symptom`).value = '';
    document.getElementById(`${prefix}SymptomScore`).value = '';
    const help = document.getElementById(`${prefix}DampingHelp`);
    if (help) {
      help.className = 'complete-inline-help';
      help.textContent = area === 'rear'
        ? 'Choose a symptom to identify the correct rear clicker, direction and one-step test.'
        : 'Choose a symptom to identify the COMP/C or REB/R adjuster and one-step test.';
    }
  });
}
function startCompleteWithVehicle(id){populateCompleteVehicleSelect(id);showPage('complete');window.scrollTo({top:0,behavior:'smooth'});}
function completeSagValues(area){const p=completeAreaPrefix(area),travelMm=getUnitBoundValue(`${p}Travel`,'length'),l1Mm=getUnitBoundValue(`${p}L1`,'length'),l2Mm=getUnitBoundValue(`${p}L2`,'length'),l3Mm=getUnitBoundValue(`${p}L3`,'length'),vals=[travelMm,l1Mm,l2Mm,l3Mm],supplied=vals.filter(v=>v!==null).length;if(supplied===0)return{status:'empty'};if(supplied<4||vals.some(v=>!Number.isFinite(v)||v<0)||travelMm<=0)return{status:'partial'};if(!(l1Mm>=l2Mm&&l1Mm>=l3Mm))return{status:'reversed'};const staticSagMm=l1Mm-l2Mm,loadedSagMm=l1Mm-l3Mm;return{status:'valid',style:document.getElementById(`${p}Style`).value,travelMm,l1Mm,l2Mm,l3Mm,staticSagMm,loadedSagMm,sagPercent:loadedSagMm/travelMm*100};}
function renderCompleteSag(area) {
  const prefix = completeAreaPrefix(area);
  const box = document.getElementById(`${prefix}SagResult`);
  if (!box) return;
  const values = completeSagValues(area);

  if (values.status === 'empty') {
    const cached = completeSagCache[area];
    if (cached?.sagPercent !== null && cached?.sagPercent !== undefined) {
      const profile = sagProfileFor(cached.style, area);
      const guidance = sagGuidance(cached.sagPercent, profile.min, profile.max);
      box.className = `complete-sag-result ${guidance.className}`;
      box.innerHTML = `<strong>Saved ${area} SAG: ${formatNumber(cached.sagPercent)}%</strong><span>${formatMeasurement(cached.loadedSagMm, 'length')} loaded · Target ${targetRangeText(profile)}</span>`;
      renderCompleteSagHelp(area, { status: 'valid', ...cached });
    } else {
      box.className = 'complete-sag-result';
      box.textContent = `Enter travel and L1, L2 and L3 to calculate the current ${area} SAG.`;
      renderCompleteSagHelp(area, values);
    }
    return;
  }

  if (values.status === 'partial') {
    box.className = 'complete-sag-result warning';
    box.innerHTML = '<strong>Complete all four measurements</strong><span>Travel, L1, L2 and L3 are required.</span>';
    renderCompleteSagHelp(area, values);
    return;
  }

  if (values.status === 'reversed') {
    box.className = 'complete-sag-result warning';
    box.innerHTML = '<strong>Check the measurements</strong><span>L1 should normally be the largest value.</span>';
    renderCompleteSagHelp(area, values);
    return;
  }

  const profile = sagProfileFor(values.style, area);
  const guidance = sagGuidance(values.sagPercent, profile.min, profile.max);
  completeSagCache[area] = values;
  box.className = `complete-sag-result ${guidance.className}`;
  box.innerHTML = `
    <strong>${formatNumber(values.sagPercent)}% loaded SAG — ${escapeHtml(guidance.heading)}</strong>
    <span>Static ${formatMeasurement(values.staticSagMm, 'length')} · Loaded ${formatMeasurement(values.loadedSagMm, 'length')} · Target ${targetRangeText(profile)}</span>
    <small>${escapeHtml(guidance.text)}</small>`;
  renderCompleteSagHelp(area, values);
}

function completeAreaFromFields(area){const p=completeAreaPrefix(area),sag=completeSagValues(area),saved=normaliseVehicleSetupArea(selectedCompleteVehicle()?.setup?.[area]||{});return normaliseVehicleSetupArea({style:document.getElementById(`${p}Style`).value,travelMm:sag.status==='valid'?sag.travelMm:saved.travelMm,l1Mm:sag.status==='valid'?sag.l1Mm:saved.l1Mm,l2Mm:sag.status==='valid'?sag.l2Mm:saved.l2Mm,l3Mm:sag.status==='valid'?sag.l3Mm:saved.l3Mm,staticSagMm:sag.status==='valid'?sag.staticSagMm:saved.staticSagMm,loadedSagMm:sag.status==='valid'?sag.loadedSagMm:saved.loadedSagMm,sagPercent:sag.status==='valid'?sag.sagPercent:saved.sagPercent,preload:getField(`${p}Preload`),compression:getField(`${p}Compression`),rebound:getField(`${p}Rebound`),lsc:area==='rear'?getField(`${p}Lsc`):'',hsc:area==='rear'?getField(`${p}Hsc`):'',convention:document.getElementById(`${p}Convention`).value,leftL1Mm:area==='front'?getUnitBoundValue('completeFrontLeftL1','length'):null,leftL2Mm:area==='front'?getUnitBoundValue('completeFrontLeftL2','length'):null,leftL3Mm:area==='front'?getUnitBoundValue('completeFrontLeftL3','length'):null,rightL1Mm:area==='front'?getUnitBoundValue('completeFrontRightL1','length'):null,rightL2Mm:area==='front'?getUnitBoundValue('completeFrontRightL2','length'):null,rightL3Mm:area==='front'?getUnitBoundValue('completeFrontRightL3','length'):null,notes:getField(`${p}Notes`),updatedAt:new Date().toISOString()});}
document.getElementById('completeVehicleSelect')?.addEventListener('change', updateCompleteVehicleSummary);
document.querySelectorAll('[data-complete-calculate]').forEach(button => {
  button.addEventListener('click', () => renderCompleteSag(button.dataset.completeCalculate));
});
document.querySelectorAll('[data-complete-damping-advice]').forEach(button => {
  button.addEventListener('click', () => renderCompleteDampingAdvice(button.dataset.completeDampingAdvice));
});
document.querySelectorAll('[data-open-complete-tune]').forEach(button => {
  button.addEventListener('click', () => startCompleteDampingTest(button.dataset.openCompleteTune));
});['rear','front'].forEach(area=>{const p=completeAreaPrefix(area);[`${p}Travel`,`${p}L1`,`${p}L2`,`${p}L3`].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>{completeSagCache[area]=null;}));document.getElementById(`${p}Style`)?.addEventListener('change',()=>renderCompleteSag(area));});
document.getElementById('completeSetupForm')?.addEventListener('submit',e=>{e.preventDefault();const v=selectedCompleteVehicle();if(!v){showToast('Choose a saved vehicle first.');return;}const r=completeSagValues('rear'),f=completeSagValues('front');if(['partial','reversed'].includes(r.status)||['partial','reversed'].includes(f.status)){showToast('Complete or clear unfinished SAG measurements before saving.');return;}v.setup={name:getField('completeSetupName')||'Current setup',rear:completeAreaFromFields('rear'),front:completeAreaFromFields('front')};v.updatedAt=new Date().toISOString();saveVehicles();updateCompleteVehicleSummary();showToast('Complete front and rear setup saved to this vehicle.');});
populateCompleteVehicleSelect();


function twinFrontSagSide(side) {
  const travelMm = getUnitBoundValue('completeFrontTravel', 'length');
  const l1Mm = getUnitBoundValue(`completeFront${side}L1`, 'length');
  const l2Mm = getUnitBoundValue(`completeFront${side}L2`, 'length');
  const l3Mm = getUnitBoundValue(`completeFront${side}L3`, 'length');

  if ([l1Mm, l2Mm, l3Mm].every(value => value === null)) return { status: 'empty' };
  if (!Number.isFinite(travelMm) || travelMm <= 0) return { status: 'no-travel' };
  if ([l1Mm, l2Mm, l3Mm].some(value => value === null || !Number.isFinite(value))) return { status: 'partial' };
  if (!(l1Mm >= l2Mm && l1Mm >= l3Mm)) return { status: 'reversed' };

  const staticSagMm = l1Mm - l2Mm;
  const loadedSagMm = l1Mm - l3Mm;
  return {
    status: 'valid',
    staticSagMm,
    loadedSagMm,
    sagPercent: loadedSagMm / travelMm * 100
  };
}

function compareTwinFrontSag() {
  const box = document.getElementById('twinFrontSagResult');
  if (!box) return;

  const left = twinFrontSagSide('Left');
  const right = twinFrontSagSide('Right');

  if (left.status === 'no-travel' || right.status === 'no-travel') {
    box.className = 'complete-inline-help warning';
    box.innerHTML = '<strong>Enter the front WHEEL travel first.</strong><span>The same wheel-travel figure is used for both sides.</span>';
    return;
  }

  if (left.status !== 'valid' || right.status !== 'valid') {
    box.className = 'complete-inline-help warning';
    box.innerHTML = '<strong>Complete L1, L2 and L3 for both sides.</strong><span>Use matching left/right reference points and exactly the same loading condition.</span>';
    return;
  }

  const differenceMm = Math.abs(left.loadedSagMm - right.loadedSagMm);
  const differencePercent = Math.abs(left.sagPercent - right.sagPercent);
  const close = differencePercent <= 2;

  box.className = `complete-inline-help active ${close ? 'twin-good' : 'twin-warning'}`;
  box.innerHTML = `
    <div class="twin-result-grid">
      <div><span>Left loaded SAG</span><strong>${formatMeasurement(left.loadedSagMm, 'length')} · ${formatNumber(left.sagPercent)}%</strong></div>
      <div><span>Right loaded SAG</span><strong>${formatMeasurement(right.loadedSagMm, 'length')} · ${formatNumber(right.sagPercent)}%</strong></div>
      <div><span>Left/right difference</span><strong>${formatMeasurement(differenceMm, 'length')} · ${formatNumber(differencePercent)} percentage points</strong></div>
    </div>
    <p>${close
      ? 'The two sides are close by this app’s workshop consistency check.'
      : 'The two sides differ noticeably. Recheck measurement points, tyre pressures, preload positions, ride height and component condition before changing damping.'}</p>
    <small>The 2-point flag is only an app consistency check, not a Can-Am or suspension-manufacturer tolerance.</small>`;
}

function clearTwinFrontSag() {
  ['Left', 'Right'].forEach(side => {
    ['L1', 'L2', 'L3'].forEach(measure => {
      setUnitBoundValue(`completeFront${side}${measure}`, null, 'length');
    });
  });
  const box = document.getElementById('twinFrontSagResult');
  if (box) {
    box.className = 'complete-inline-help';
    box.textContent = 'Optional consistency check. It does not replace the normal front SAG setup.';
  }
}

document.getElementById('compareTwinFrontSag')?.addEventListener('click', compareTwinFrontSag);
document.getElementById('clearTwinFrontSag')?.addEventListener('click', clearTwinFrontSag);

// Guided setup --------------------------------------------------------------
const guidedSteps = [...document.querySelectorAll('[data-wizard-step]')];
let guidedStep = 1;
let guidedArea = 'rear';
let guidedLatestAfterSag = null;

function populateGuidedVehicleSelect(selectedId = null) {
  const select = document.getElementById('guidedVehicleSelect');
  if (!select) return;
  const current = selectedId || select.value || 'manual';
  select.innerHTML = '<option value="manual">Enter a vehicle without saving a profile</option>';
  vehicles
    .slice()
    .sort((a, b) => a.profileName.localeCompare(b.profileName))
    .forEach(vehicle => {
      const option = document.createElement('option');
      option.value = vehicle.id;
      option.textContent = vehicle.profileName;
      select.appendChild(option);
    });
  select.value = vehicles.some(item => item.id === current) ? current : 'manual';
  updateGuidedVehicleChoice();
}

function selectedGuidedVehicle() {
  const id = document.getElementById('guidedVehicleSelect')?.value;
  return vehicles.find(item => item.id === id) || null;
}

function applyVehicleAdjustersToGuide(vehicle) {
  if (!vehicle) return;
  const a = vehicle.adjusters;
  const isRear = guidedArea === 'rear';
  const setup = isRear ? vehicle.setup.rear : vehicle.setup.front;
  document.getElementById('guidedHasPreload').checked = isRear ? a.rearPreload : a.frontPreload;
  document.getElementById('guidedHasCompression').checked = isRear ? a.rearCompression : a.frontCompression;
  document.getElementById('guidedHasRebound').checked = isRear ? a.rearRebound : a.frontRebound;
  document.getElementById('guidedHasLsc').checked = isRear ? a.rearLsc : false;
  document.getElementById('guidedHasHsc').checked = isRear ? a.rearHsc : false;
  setField('guidedPreload', setup.preload); setField('guidedCompression', setup.compression); setField('guidedRebound', setup.rebound); setField('guidedLsc', setup.lsc); setField('guidedHsc', setup.hsc);
  document.getElementById('guidedSagStyle').value = setup.style || suggestedSagStyleForVehicle(vehicle);
  setUnitBoundValue('guidedTravel', setup.travelMm, 'length'); setUnitBoundValue('guidedL1', setup.l1Mm, 'length'); setUnitBoundValue('guidedL2', setup.l2Mm, 'length'); setUnitBoundValue('guidedL3', setup.l3Mm, 'length');
  updateBaselineFields(); updateGuidedSagPreview();
}

function updateGuidedVehicleChoice() {
  const vehicle = selectedGuidedVehicle();
  const manual = document.getElementById('guidedManualVehicle');
  const summary = document.getElementById('guidedVehicleSummary');
  if (!manual || !summary) return;
  manual.classList.toggle('hidden', Boolean(vehicle));
  summary.classList.toggle('hidden', !vehicle);
  if (vehicle) {
    const identity = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ');
    const rear = [vehicle.rearShockBrand, vehicle.rearShockModel].filter(Boolean).join(' ');
    summary.innerHTML = `<strong>${escapeHtml(vehicle.profileName)}</strong><span>${escapeHtml(identity || vehicleTypeLabel(vehicle.type))}</span>${rear ? `<small>Rear shock: ${escapeHtml(rear)}</small>` : ''}`;
    document.getElementById('guidedSagStyle').value = suggestedSagStyleForVehicle(vehicle);
    applyVehicleAdjustersToGuide(vehicle);
    updateGuidedTargetSummary();
  } else {
    summary.innerHTML = '';
  }
  renderGuidedReview();
}

function startGuidedWithVehicle(id) {
  populateGuidedVehicleSelect(id);
  guidedLatestAfterSag = null;
  guidedStep = 1;
  setGuidedStep(1);
  showPage('guided');
}

document.getElementById('guidedVehicleSelect')?.addEventListener('change', updateGuidedVehicleChoice);

function setGuidedArea(area) {
  guidedArea = area === 'front' ? 'front' : 'rear';
  document.querySelectorAll('[data-guided-area]').forEach(button => {
    const active = button.dataset.guidedArea === guidedArea;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.getElementById('guidedAreaHint').textContent =
    guidedArea === 'rear'
      ? 'Record only the adjusters actually fitted to the rear shock.'
      : 'Record only the adjusters fitted to the front forks. High- and low-speed fields are hidden unless a specialist fork uses them.';
  const vehicle = selectedGuidedVehicle();
  if (vehicle) applyVehicleAdjustersToGuide(vehicle);
  if (guidedArea === 'front') {
    document.getElementById('guidedHasLsc').checked = false;
    document.getElementById('guidedHasHsc').checked = false;
  }
  updateBaselineFields();
  updateGuidedTargetSummary();
  renderGuidedReview();
}

document.querySelectorAll('[data-guided-area]').forEach(button => {
  button.addEventListener('click', () => setGuidedArea(button.dataset.guidedArea));
});

function updateBaselineFields() {
  const map = [
    ['preload', 'guidedHasPreload', 'guidedPreload'],
    ['compression', 'guidedHasCompression', 'guidedCompression'],
    ['rebound', 'guidedHasRebound', 'guidedRebound'],
    ['lsc', 'guidedHasLsc', 'guidedLsc'],
    ['hsc', 'guidedHasHsc', 'guidedHsc']
  ];
  map.forEach(([key, checkId, fieldId]) => {
    const enabled = document.getElementById(checkId).checked;
    const wrapper = document.querySelector(`[data-baseline="${key}"]`);
    const field = document.getElementById(fieldId);
    wrapper?.classList.toggle('disabled', !enabled);
    if (field) field.disabled = !enabled;
  });
}

['guidedHasPreload', 'guidedHasCompression', 'guidedHasRebound', 'guidedHasLsc', 'guidedHasHsc'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', () => {
    updateBaselineFields();
    renderGuidedReview();
  });
});

function guidedVehicleNameValue() {
  const vehicle = selectedGuidedVehicle();
  return vehicle?.profileName || getField('guidedVehicleName');
}


function suggestedSagStyleForVehicle(vehicle) {
  if (!vehicle) return 'street';
  if (vehicle.type === 'track') return 'track';
  if (vehicle.type === 'dirt-bike' || vehicle.type === 'atv') return 'offroad';
  if (vehicle.type === 'adventure') return 'adventure';
  return 'street';
}

function currentGuidedSagProfile() {
  return sagProfileFor(document.getElementById('guidedSagStyle').value, guidedArea);
}

function updateGuidedTargetSummary() {
  const summary = document.getElementById('guidedTargetSummary');
  if (!summary) return;
  const profile = currentGuidedSagProfile();
  summary.innerHTML = `
    <span class="target-chip">${escapeHtml(profile.shortLabel)}</span>
    <div><strong>${targetRangeText(profile)} for the ${guidedArea === 'front' ? 'front forks' : 'rear shock'}</strong><p>${escapeHtml(profile.description)}</p></div>`;
  updateGuidedSagPreview();
}

function guidedSagExplanationHtml(sag) {
  if (sag.status !== 'valid') return '';
  const profile = currentGuidedSagProfile();
  const guidance = sagGuidance(sag.sagPercent, profile.min, profile.max);
  const vehicle = selectedGuidedVehicle();
  const baseline = {
    preload: activeBaselineValue('guidedHasPreload', 'guidedPreload'),
    compression: activeBaselineValue('guidedHasCompression', 'guidedCompression'),
    rebound: activeBaselineValue('guidedHasRebound', 'guidedRebound'),
    lsc: activeBaselineValue('guidedHasLsc', 'guidedLsc'),
    hsc: activeBaselineValue('guidedHasHsc', 'guidedHsc')
  };
  const initial = {
    l1Mm: sag.l1Mm,
    l2Mm: sag.l2Mm,
    l3Mm: sag.l3Mm,
    staticSagMm: sag.staticSagMm,
    loadedSagMm: sag.loadedSagMm,
    percent: sag.sagPercent,
    travelMm: sag.travelMm
  };
  return `
    <p class="kicker">What ${formatNumber(sag.sagPercent)}% means</p>
    <h3>${escapeHtml(guidance.heading)}</h3>
    ${sagPositionHtml(sag.sagPercent, sag.travelMm)}
    <div class="result-status ${guidance.className}"><strong>${escapeHtml(profile.label)} target: ${targetRangeText(profile)}</strong><p>${escapeHtml(guidance.text)}</p></div>
    ${sagCorrectionHtml({ percent: sag.sagPercent, min: profile.min, max: profile.max, travelMm: sag.travelMm, area: guidedArea, vehicle, baseline })}
    ${sagRecalculationHtml({ prefix: 'guidedAfter', initial })}
    <p class="fine-print">Treat this as a starting guide. A model-specific manufacturer figure and adjuster direction override the general guidance.</p>`;
}

function guidedSagValues() {
  const travelMm = getUnitBoundValue('guidedTravel', 'length');
  const l1Mm = getUnitBoundValue('guidedL1', 'length');
  const l2Mm = getUnitBoundValue('guidedL2', 'length');
  const l3Mm = getUnitBoundValue('guidedL3', 'length');
  const values = [travelMm, l1Mm, l2Mm, l3Mm];
  const supplied = values.filter(value => value !== null).length;
  if (supplied === 0) return { status: 'empty' };
  if (supplied < 4 || values.some(value => !Number.isFinite(value) || value < 0) || travelMm <= 0) return { status: 'partial' };
  if (!(l1Mm >= l2Mm && l1Mm >= l3Mm)) return { status: 'reversed' };
  const staticSagMm = l1Mm - l2Mm;
  const loadedSagMm = l1Mm - l3Mm;
  return {
    status: 'valid',
    travelMm,
    l1Mm,
    l2Mm,
    l3Mm,
    staticSagMm,
    loadedSagMm,
    sagPercent: loadedSagMm / travelMm * 100
  };
}

function updateGuidedSagPreview() {
  const box = document.getElementById('guidedSagPreview');
  if (!box) return;
  const sag = guidedSagValues();
  box.className = 'selection-summary';
  if (sag.status === 'empty') {
    box.textContent = 'SAG is optional. Enter all four measurements to calculate it.';
  } else if (sag.status === 'partial') {
    box.classList.add('warning');
    box.textContent = 'Enter all four measurements, or clear them all to save without SAG.';
  } else if (sag.status === 'reversed') {
    box.classList.add('warning');
    box.textContent = 'The measurements look reversed. L1 should normally be the largest.';
  } else {
    const profile = currentGuidedSagProfile();
    const guidance = sagGuidance(sag.sagPercent, profile.min, profile.max);
    box.classList.add(guidance.className === 'good' ? 'success' : 'warning');
    box.innerHTML = `
      <strong>${formatNumber(sag.sagPercent)}% loaded SAG · ${escapeHtml(guidance.heading)}</strong>
      <span>Static ${formatMeasurement(sag.staticSagMm, 'length')} · Loaded ${formatMeasurement(sag.loadedSagMm, 'length')} · Target ${targetRangeText(profile)}</span>
      <small>${escapeHtml(sagMeaning(sag.sagPercent, sag.travelMm).sentence)}</small>`;
  }
  renderGuidedReview();
}

['guidedTravel', 'guidedL1', 'guidedL2', 'guidedL3'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateGuidedSagPreview);
});
document.getElementById('guidedSagStyle')?.addEventListener('change', updateGuidedTargetSummary);

function activeBaselineValue(checkId, fieldId) {
  return document.getElementById(checkId).checked ? getField(fieldId) : '';
}

function renderGuidedReview() {
  const review = document.getElementById('guidedReview');
  if (!review) return;
  const vehicle = guidedVehicleNameValue() || 'Vehicle not entered';
  const setup = getField('guidedSetupName') || 'Baseline setup';
  const load = [
    getUnitBoundValue('guidedRiderWeight', 'mass') !== null && `Rider ${formatMeasurement(getUnitBoundValue('guidedRiderWeight', 'mass'), 'mass')}`,
    getUnitBoundValue('guidedPassengerWeight', 'mass') !== null && `Passenger ${formatMeasurement(getUnitBoundValue('guidedPassengerWeight', 'mass'), 'mass')}`,
    getUnitBoundValue('guidedLuggageWeight', 'mass') !== null && `Luggage ${formatMeasurement(getUnitBoundValue('guidedLuggageWeight', 'mass'), 'mass')}`
  ].filter(Boolean).join(' · ') || 'Load not entered';
  const baseline = [
    activeBaselineValue('guidedHasPreload', 'guidedPreload') && `Preload: ${activeBaselineValue('guidedHasPreload', 'guidedPreload')}`,
    activeBaselineValue('guidedHasCompression', 'guidedCompression') && `Compression: ${activeBaselineValue('guidedHasCompression', 'guidedCompression')}`,
    activeBaselineValue('guidedHasRebound', 'guidedRebound') && `Rebound: ${activeBaselineValue('guidedHasRebound', 'guidedRebound')}`,
    activeBaselineValue('guidedHasLsc', 'guidedLsc') && `LSC: ${activeBaselineValue('guidedHasLsc', 'guidedLsc')}`,
    activeBaselineValue('guidedHasHsc', 'guidedHsc') && `HSC: ${activeBaselineValue('guidedHasHsc', 'guidedHsc')}`
  ].filter(Boolean);
  const sag = guidedSagValues();
  const profile = currentGuidedSagProfile();
  const sagText = sag.status === 'valid'
    ? `${formatMeasurement(sag.loadedSagMm, 'length')} loaded · ${formatNumber(sag.sagPercent)}%`
    : sag.status === 'empty' ? 'Not measured' : 'Measurements need checking';
  const explanation = document.getElementById('guidedSagExplanation');
  if (explanation) {
    explanation.classList.toggle('hidden', sag.status !== 'valid');
    explanation.innerHTML = sag.status === 'valid' ? guidedSagExplanationHtml(sag) : '';
    if (sag.status === 'valid') {
      const vehicleProfile = selectedGuidedVehicle();
      const guidedBaseline = {
        preload: activeBaselineValue('guidedHasPreload', 'guidedPreload'),
        compression: activeBaselineValue('guidedHasCompression', 'guidedCompression'),
        rebound: activeBaselineValue('guidedHasRebound', 'guidedRebound'),
        lsc: activeBaselineValue('guidedHasLsc', 'guidedLsc'),
        hsc: activeBaselineValue('guidedHasHsc', 'guidedHsc')
      };
      bindSagRecalculation({
        prefix: 'guidedAfter',
        initial: {
          l1Mm: sag.l1Mm, l2Mm: sag.l2Mm, l3Mm: sag.l3Mm,
          staticSagMm: sag.staticSagMm, loadedSagMm: sag.loadedSagMm,
          percent: sag.sagPercent, travelMm: sag.travelMm
        },
        min: profile.min,
        max: profile.max,
        area: guidedArea,
        vehicle: vehicleProfile,
        baseline: guidedBaseline,
        onAfter: after => { guidedLatestAfterSag = after; }
      });
    }
  }

  review.innerHTML = `
    <div><span>Vehicle</span><strong>${escapeHtml(vehicle)}</strong></div>
    <div><span>Setup</span><strong>${escapeHtml(setup)}</strong></div>
    <div><span>Load</span><strong>${escapeHtml(load)}</strong></div>
    <div><span>Suspension</span><strong>${guidedArea === 'rear' ? 'Rear shock' : 'Front forks'}</strong></div>
    <div><span>Target</span><strong>${escapeHtml(profile.label)} · ${targetRangeText(profile)}</strong></div>
    <div><span>Baseline</span><strong>${escapeHtml(baseline.length ? baseline.join(' · ') : 'No adjuster positions entered')}</strong></div>
    <div><span>SAG</span><strong>${escapeHtml(sagText)}</strong></div>`;
}

[
  'guidedVehicleName', 'guidedSetupName', 'guidedRiderWeight', 'guidedPassengerWeight',
  'guidedLuggageWeight', 'guidedPreload', 'guidedCompression', 'guidedRebound',
  'guidedLsc', 'guidedHsc'
].forEach(id => document.getElementById(id)?.addEventListener('input', renderGuidedReview));

function validateGuidedStep(step) {
  if (step === 1 && !guidedVehicleNameValue()) {
    showToast('Choose a saved vehicle or enter a vehicle name.');
    document.getElementById('guidedVehicleName').focus();
    return false;
  }
  if (step === 2 && !getField('guidedSetupName')) {
    showToast('Give this setup a name.');
    document.getElementById('guidedSetupName').focus();
    return false;
  }
  if (step === 4) {
    const sag = guidedSagValues();
    if (sag.status === 'partial' || sag.status === 'reversed') {
      showToast('Complete or clear the SAG measurements before continuing.');
      return false;
    }
  }
  return true;
}

function setGuidedStep(step) {
  guidedStep = Math.min(5, Math.max(1, step));
  guidedSteps.forEach(section => section.classList.toggle('active', Number(section.dataset.wizardStep) === guidedStep));
  document.querySelectorAll('[data-progress-step]').forEach(item => {
    const number = Number(item.dataset.progressStep);
    item.classList.toggle('active', number === guidedStep);
    item.classList.toggle('complete', number < guidedStep);
  });
  document.getElementById('guidedPrevious').classList.toggle('hidden', guidedStep === 1);
  document.getElementById('guidedNext').classList.toggle('hidden', guidedStep === 5);
  document.getElementById('guidedSave').classList.toggle('hidden', guidedStep !== 5);
  document.getElementById('guidedStepText').textContent = `Step ${guidedStep} of 5`;
  if (guidedStep === 5) renderGuidedReview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('guidedPrevious')?.addEventListener('click', () => setGuidedStep(guidedStep - 1));
document.getElementById('guidedNext')?.addEventListener('click', () => {
  if (!validateGuidedStep(guidedStep)) return;
  setGuidedStep(guidedStep + 1);
});

function resetGuidedForm() {
  document.getElementById('guidedForm').reset();
  clearUnitBoundValuesWithin(document.getElementById('guidedForm'));
  guidedArea = 'rear';
  setGuidedArea('rear');
  populateGuidedVehicleSelect();
  document.getElementById('guidedHasPreload').checked = true;
  document.getElementById('guidedSagStyle').value = 'street';
  updateBaselineFields();
  updateGuidedTargetSummary();
  guidedStep = 1;
  setGuidedStep(1);
  updateGuidedSagPreview();
  renderGuidedReview();
}

document.getElementById('guidedForm')?.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateGuidedStep(1) || !validateGuidedStep(2) || !validateGuidedStep(4)) return;
  const sag = guidedSagValues();
  const profile = currentGuidedSagProfile();
  const record = normaliseRecord({
    schemaVersion: 6,
    id: vehicleId(),
    vehicleName: guidedVehicleNameValue(),
    setupName: getField('guidedSetupName'),
    riderWeightKg: getUnitBoundValue('guidedRiderWeight', 'mass'),
    passengerWeightKg: getUnitBoundValue('guidedPassengerWeight', 'mass'),
    luggageWeightKg: getUnitBoundValue('guidedLuggageWeight', 'mass'),
    preloadSetting: activeBaselineValue('guidedHasPreload', 'guidedPreload'),
    compressionSetting: activeBaselineValue('guidedHasCompression', 'guidedCompression'),
    reboundSetting: activeBaselineValue('guidedHasRebound', 'guidedRebound'),
    hscSetting: activeBaselineValue('guidedHasHsc', 'guidedHsc'),
    lscSetting: activeBaselineValue('guidedHasLsc', 'guidedLsc'),
    staticSagMm: sag.status === 'valid' ? sag.staticSagMm : null,
    loadedSagMm: sag.status === 'valid' ? sag.loadedSagMm : null,
    sagPercent: sag.status === 'valid' ? sag.sagPercent : null,
    suspensionArea: guidedArea,
    targetStyle: document.getElementById('guidedSagStyle').value,
    targetLabel: profile.label,
    targetMinPercent: profile.min,
    targetMaxPercent: profile.max,
    travelMm: sag.status === 'valid' ? sag.travelMm : null,
    initialTravelMm: sag.status === 'valid' ? sag.travelMm : null,
    initialL1Mm: sag.status === 'valid' ? sag.l1Mm : null,
    initialL2Mm: sag.status === 'valid' ? sag.l2Mm : null,
    initialL3Mm: sag.status === 'valid' ? sag.l3Mm : null,
    afterTravelMm: guidedLatestAfterSag?.travelMm ?? null,
    afterL1Mm: guidedLatestAfterSag?.l1Mm ?? null,
    afterL2Mm: guidedLatestAfterSag?.l2Mm ?? null,
    afterL3Mm: guidedLatestAfterSag?.l3Mm ?? null,
    afterStaticSagMm: guidedLatestAfterSag?.staticSagMm ?? null,
    afterLoadedSagMm: guidedLatestAfterSag?.loadedSagMm ?? null,
    afterSagPercent: guidedLatestAfterSag?.sagPercent ?? null,
    notes: `${guidedArea === 'rear' ? 'Rear shock' : 'Front forks'} baseline.${getField('guidedNotes') ? ` ${getField('guidedNotes')}` : ''}`,
    updatedAt: new Date().toISOString()
  });
  const selectedVehicle = selectedGuidedVehicle();
  if (selectedVehicle) {
    const currentArea = selectedVehicle.setup[guidedArea];
    selectedVehicle.setup.name = getField('guidedSetupName') || selectedVehicle.setup.name || 'Current setup';
    selectedVehicle.setup[guidedArea] = normaliseVehicleSetupArea({style: document.getElementById('guidedSagStyle').value,travelMm: sag.status === 'valid' ? sag.travelMm : currentArea.travelMm,l1Mm: sag.status === 'valid' ? sag.l1Mm : currentArea.l1Mm,l2Mm: sag.status === 'valid' ? sag.l2Mm : currentArea.l2Mm,l3Mm: sag.status === 'valid' ? sag.l3Mm : currentArea.l3Mm,staticSagMm: guidedLatestAfterSag?.staticSagMm ?? (sag.status === 'valid' ? sag.staticSagMm : currentArea.staticSagMm),loadedSagMm: guidedLatestAfterSag?.loadedSagMm ?? (sag.status === 'valid' ? sag.loadedSagMm : currentArea.loadedSagMm),sagPercent: guidedLatestAfterSag?.sagPercent ?? (sag.status === 'valid' ? sag.sagPercent : currentArea.sagPercent),preload: activeBaselineValue('guidedHasPreload','guidedPreload'),compression: activeBaselineValue('guidedHasCompression','guidedCompression'),rebound: activeBaselineValue('guidedHasRebound','guidedRebound'),lsc: activeBaselineValue('guidedHasLsc','guidedLsc'),hsc: activeBaselineValue('guidedHasHsc','guidedHsc'),convention: currentArea.convention,notes: getField('guidedNotes'),updatedAt: new Date().toISOString()});
    selectedVehicle.updatedAt = new Date().toISOString(); saveVehicles();
  }
  records.unshift(record); saveRecords();
  showToast(selectedVehicle ? 'Setup saved to the vehicle and test history.' : 'Baseline saved to test history.');
  resetGuidedForm();
  showPage('records');
});

document.getElementById('guidedLoadType')?.addEventListener('change', event => {
  const type = event.target.value;
  const passenger = document.getElementById('guidedPassengerWeight');
  const luggage = document.getElementById('guidedLuggageWeight');
  if (type === 'solo') {
    setUnitBoundValue('guidedPassengerWeight', null, 'mass');
    setUnitBoundValue('guidedLuggageWeight', null, 'mass');
  } else if (type === 'two-up') {
    setUnitBoundValue('guidedLuggageWeight', null, 'mass');
  }
  passenger.disabled = type === 'solo';
  luggage.disabled = type === 'solo' || type === 'two-up';
  renderGuidedReview();
});

renderVehicles();
populateGuidedVehicleSelect();
setGuidedArea('rear');
updateBaselineFields();
setGuidedStep(1);
updateGuidedTargetSummary();
updateGuidedSagPreview();
updateSagTargetSummary();



// Damping fine-tune ---------------------------------------------------------
const dampingSteps = [...document.querySelectorAll('[data-damping-step]')];
let dampingStep = 1;
let dampingSelectedSymptom = '';
let dampingLatestResult = null;

const dampingGoals = {
  comfort: {
    label: 'Plush comfort',
    success: 'The suspension absorbs the chosen bump with less sharpness while remaining supported and controlled.',
    focus: 'Prioritise comfort and grip. Do not remove so much damping that the vehicle wallows, bottoms or bounces.'
  },
  balanced: {
    label: 'Balanced street riding',
    success: 'The suspension absorbs bumps, supports braking and cornering, then returns calmly without kick or pack-down.',
    focus: 'Seek the middle ground between comfort, chassis support and stability.'
  },
  sport: {
    label: 'Firm sport-road support',
    success: 'The chassis remains supported during braking and cornering without becoming harsh over ordinary road bumps.',
    focus: 'Prioritise support and control, but retain enough movement for grip on imperfect roads.'
  },
  adventure: {
    label: 'Adventure grip and recovery',
    success: 'The wheels follow rough terrain, recover between bumps and avoid sharp deflection, kick or pack-down.',
    focus: 'Prioritise traction, suspension recovery and usable travel over an artificially firm feel.'
  },
  track: {
    label: 'Track control and stability',
    success: 'The chassis remains stable and supported at speed while using travel without bottoming, chatter or packing.',
    focus: 'Prioritise repeatable support and controlled return. Tyres, temperature and track conditions must remain comparable.'
  },
  custom: {
    label: 'Custom goal',
    success: 'The chosen symptom improves without creating a new comfort, grip or stability problem.',
    focus: 'Describe one clear, measurable result before changing an adjuster.'
  }
};

const dampingSymptoms = {
  'compression-harsh': {
    title: 'Harsh as the bump is hit',
    control: 'compression',
    direction: 'decrease',
    phase: 'Compression — impact',
    measure: 'Score the sharpness felt at the first impact, while the suspension is moving inward.',
    success: 'Reduce the initial sharpness without creating extra dive, wallow or bottoming.',
    opposite: 'Too far creates excessive movement, dive or bottoming.',
    why: 'Compression resistance may be too high for this bump and speed.'
  },
  'compression-soft': {
    title: 'Soft, dives or bottoms',
    control: 'compression',
    direction: 'increase',
    phase: 'Compression — support',
    measure: 'Score how much the suspension dives, squats, wallows or uses too much travel in the same long dip or load.',
    success: 'Gain support and reduce bottoming without making sharp bumps harsh.',
    opposite: 'Too far creates impact harshness or reduced grip.',
    why: 'Compression resistance may be too low for this load and movement.'
  },
  'rebound-fast': {
    title: 'Kicks or bounces after the bump',
    control: 'rebound',
    direction: 'increase',
    phase: 'Rebound — fast return',
    measure: 'Score the upward kick or extra bounce after the wheel has passed the bump.',
    success: 'Calm the return so the vehicle settles once without packing down.',
    opposite: 'Too far prevents recovery and creates pack-down over repeated bumps.',
    why: 'The spring may be extending too quickly after compression.'
  },
  'rebound-slow': {
    title: 'Packs down over repeated bumps',
    control: 'rebound',
    direction: 'decrease',
    phase: 'Rebound — slow return',
    measure: 'Score whether the suspension sits lower and becomes progressively harsher through a repeated-bump section.',
    success: 'Restore recovery between bumps without creating a kick or second bounce.',
    opposite: 'Too far creates a fast return, kick or bouncing.',
    why: 'The suspension may not be extending quickly enough before the next bump.'
  },
  'lsc-soft': {
    title: 'Excessive squat, dive or wallow',
    control: 'lsc',
    fallback: 'compression',
    direction: 'increase',
    phase: 'Low-speed compression — support',
    measure: 'Score chassis movement during the same smooth braking, acceleration or cornering load.',
    success: 'Increase support without reducing grip or making normal movement harsh.',
    opposite: 'Too far reduces compliance and grip.',
    why: 'Slow suspension movement may need more compression support.'
  },
  'lsc-harsh': {
    title: 'Too firm through gradual load transfer',
    control: 'lsc',
    fallback: 'compression',
    direction: 'decrease',
    phase: 'Low-speed compression — compliance',
    measure: 'Score comfort and grip during the same smooth corner, braking load or rolling terrain.',
    success: 'Allow freer chassis movement without creating excessive wallow or dive.',
    opposite: 'Too far removes support.',
    why: 'Slow suspension movement may be over-controlled.'
  },
  'hsc-harsh': {
    title: 'Harsh on potholes or square edges',
    control: 'hsc',
    fallback: 'compression',
    direction: 'decrease',
    phase: 'High-speed compression — sharp impact',
    measure: 'Score the sharpness or deflection from the same safe pothole, rock or square edge.',
    success: 'Reduce sharp-impact harshness without increasing hard bottoming.',
    opposite: 'Too far reduces resistance on large rapid impacts.',
    why: 'Rapid suspension movement may have too much compression resistance.'
  },
  'hsc-soft': {
    title: 'Bottoms on a sharp impact',
    control: 'hsc',
    fallback: 'compression',
    direction: 'increase',
    phase: 'High-speed compression — bottoming resistance',
    measure: 'Score the severity of bottoming on one safe, repeatable sharp impact or landing.',
    success: 'Increase resistance to bottoming without creating a sharp or locked feeling.',
    opposite: 'Too far creates harshness and deflection.',
    why: 'Rapid suspension movement may have too little compression resistance.'
  }
};

function dampingGoalProfile() {
  const key = document.getElementById('dampingGoal')?.value || 'balanced';
  const profile = dampingGoals[key] || dampingGoals.balanced;
  const custom = getField('dampingCustomGoal');
  return {
    key,
    ...profile,
    success: key === 'custom' && custom ? custom : profile.success
  };
}

function updateDampingGoalSummary() {
  const profile = dampingGoalProfile();
  const box = document.getElementById('dampingGoalSummary');
  const customWrap = document.getElementById('dampingCustomGoalWrap');
  customWrap?.classList.toggle('hidden', profile.key !== 'custom');
  if (box) {
    box.innerHTML = `
      <span class="target-chip">${escapeHtml(profile.label)}</span>
      <div><strong>What success looks like</strong><p>${escapeHtml(profile.success)}</p><small>${escapeHtml(profile.focus)}</small></div>`;
  }
}

function dampingSelectedVehicle() {
  const id = document.getElementById('dampingVehicleSelect')?.value;
  return vehicles.find(vehicle => vehicle.id === id) || null;
}

function dampingSelectedRecord() {
  const id = document.getElementById('dampingRecordSelect')?.value;
  return records.find(record => record.id === id) || null;
}

function populateDampingVehicleSelect(selectedId = null) {
  const select = document.getElementById('dampingVehicleSelect');
  if (!select) return;
  const current = selectedId ?? select.value ?? '';
  select.innerHTML = '<option value="">No saved vehicle selected</option>';
  vehicles
    .slice()
    .sort((a, b) => a.profileName.localeCompare(b.profileName))
    .forEach(vehicle => {
      const option = document.createElement('option');
      option.value = vehicle.id;
      option.textContent = vehicle.profileName;
      select.appendChild(option);
    });
  select.value = vehicles.some(vehicle => vehicle.id === current) ? current : '';
}

function populateDampingRecordSelect(selectedId = null) {
  const select = document.getElementById('dampingRecordSelect');
  if (!select) return;
  const current = selectedId ?? select.value ?? '';
  select.innerHTML = '<option value="">Enter the current settings manually</option>';
  records.forEach(record => {
    const option = document.createElement('option');
    option.value = record.id;
    option.textContent = `${record.vehicleName || 'Vehicle'} — ${record.setupName || 'Setup'}`;
    select.appendChild(option);
  });
  select.value = records.some(record => record.id === current) ? current : '';
}

function startDampingWithRecord(id) {
  populateDampingRecordSelect(id);
  const record = records.find(item => item.id === id);
  if (record) applyDampingRecord(record);
  setDampingStep(1);
  showPage('damping');
}

function dampingAvailability() {
  return {
    compression: document.getElementById('dampingHasCompression').checked,
    rebound: document.getElementById('dampingHasRebound').checked,
    lsc: document.getElementById('dampingHasLsc').checked,
    hsc: document.getElementById('dampingHasHsc').checked
  };
}

function applyDampingVehicle(vehicle) {
  if (!vehicle) return;
  setField('dampingVehicleName', vehicle.profileName);
  const area = document.getElementById('dampingArea').value;
  const a = vehicle.adjusters;
  const setup = vehicle.setup[area];
  document.getElementById('dampingHasCompression').checked = area === 'rear' ? a.rearCompression : a.frontCompression;
  document.getElementById('dampingHasRebound').checked = area === 'rear' ? a.rearRebound : a.frontRebound;
  document.getElementById('dampingHasLsc').checked = area === 'rear' ? a.rearLsc : false;
  document.getElementById('dampingHasHsc').checked = area === 'rear' ? a.rearHsc : false;
  setField('dampingCompression', setup.compression); setField('dampingRebound', setup.rebound); setField('dampingLsc', setup.lsc); setField('dampingHsc', setup.hsc);
  document.getElementById('dampingConvention').value = setup.convention || 'clicks-out';
  updateDampingBaselineFields();
}

function applyDampingRecord(record) {
  if (!record) return;
  setField('dampingVehicleName', record.vehicleName);
  document.getElementById('dampingArea').value = record.suspensionArea === 'front' ? 'front' : 'rear';
  setField('dampingCompression', record.compressionSetting);
  setField('dampingRebound', record.reboundSetting);
  setField('dampingLsc', record.lscSetting);
  setField('dampingHsc', record.hscSetting);
  document.getElementById('dampingHasCompression').checked = Boolean(record.compressionSetting);
  document.getElementById('dampingHasRebound').checked = Boolean(record.reboundSetting);
  document.getElementById('dampingHasLsc').checked = Boolean(record.lscSetting);
  document.getElementById('dampingHasHsc').checked = Boolean(record.hscSetting);
  const vehicle = vehicles.find(item => item.profileName === record.vehicleName);
  populateDampingVehicleSelect(vehicle?.id || '');
  if (vehicle) {
    applyDampingVehicle(vehicle);
    setField('dampingCompression', record.compressionSetting);
    setField('dampingRebound', record.reboundSetting);
    setField('dampingLsc', record.lscSetting);
    setField('dampingHsc', record.hscSetting);
  }
  if (record.dampingGoal && dampingGoals[record.dampingGoal]) {
    document.getElementById('dampingGoal').value = record.dampingGoal;
  }
  updateDampingGoalSummary();
  updateDampingBaselineFields();
}

function updateDampingBaselineFields() {
  ['compression', 'rebound', 'lsc', 'hsc'].forEach(key => {
    const capital = key === 'lsc' ? 'Lsc' : key === 'hsc' ? 'Hsc' : key[0].toUpperCase() + key.slice(1);
    const checked = document.getElementById(`dampingHas${capital}`).checked;
    const wrapper = document.querySelector(`[data-damping-field="${key}"]`);
    const input = document.getElementById(`damping${capital}`);
    wrapper?.classList.toggle('disabled', !checked);
    if (input) input.disabled = !checked;
  });
}

function currentDampingValue(control) {
  const id = {
    compression: 'dampingCompression',
    rebound: 'dampingRebound',
    lsc: 'dampingLsc',
    hsc: 'dampingHsc'
  }[control];
  return id ? getField(id) : '';
}

function dampingControlDetails(control, area) {
  const front = area === 'front';
  return {
    compression: {
      short: 'Compression',
      name: front ? 'Fork compression clicker marked COMP or C' : 'Top or reservoir compression clicker marked COMP or C',
      movement: 'inward movement as the bump is hit'
    },
    rebound: {
      short: 'Rebound',
      name: front ? 'Fork rebound clicker marked REB or R' : 'Lower shock or end-eye rebound clicker marked REB or R',
      movement: 'extension after the bump'
    },
    lsc: {
      short: 'Low-speed compression',
      name: 'Low-speed compression adjuster marked LSC',
      movement: 'slow chassis movement during braking, acceleration and cornering'
    },
    hsc: {
      short: 'High-speed compression',
      name: 'High-speed compression adjuster marked HSC',
      movement: 'rapid movement over sharp edges, rocks and hard impacts'
    }
  }[control];
}

function resolveDampingSymptom() {
  const symptom = dampingSymptoms[dampingSelectedSymptom];
  if (!symptom) return null;
  const availability = dampingAvailability();
  let control = symptom.control;
  let fallbackUsed = false;
  if (!availability[control] && symptom.fallback && availability[symptom.fallback]) {
    control = symptom.fallback;
    fallbackUsed = true;
  }
  return { ...symptom, control, available: Boolean(availability[control]), fallbackUsed };
}

function parseFirstNumber(value) {
  const match = String(value || '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function dampingStepSize(convention) {
  return convention === 'turns-out' ? 0.125 : 1;
}

function suggestedDampingSetting(current, direction) {
  const convention = document.getElementById('dampingConvention').value;
  const number = parseFirstNumber(current);
  const increase = direction === 'increase';
  const turn = increase ? 'clockwise / toward + or HARD' : 'counter-clockwise / toward − or SOFT';
  const stepText = convention === 'turns-out' ? 'one-eighth turn' : 'one click';

  if (number === null || convention === 'unknown' || convention === 'marked-scale') {
    return {
      exact: '',
      display: `${stepText} ${turn}`,
      instruction: `Move only ${stepText} ${turn}. Follow the actual markings or model manual when the scale is not recorded as clicks or turns out.`
    };
  }

  const step = dampingStepSize(convention);
  const next = increase ? Math.max(0, number - step) : number + step;
  const nextText = trimFixed(next, convention === 'turns-out' ? 3 : 0);
  const unit = convention === 'turns-out' ? 'turns out' : 'clicks out';
  return {
    exact: nextText,
    display: `${current || number} → ${nextText} ${unit}`,
    instruction: `${increase ? 'Close' : 'Open'} the adjuster by ${stepText}: ${current || number} → ${nextText} ${unit}. This means ${turn}.`
  };
}

function updateDampingMeasureGuide() {
  const box = document.getElementById('dampingMeasureGuide');
  const selected = document.querySelector('input[name="dampingSymptom"]:checked');
  dampingSelectedSymptom = selected?.value || dampingSelectedSymptom;
  const symptom = dampingSymptoms[dampingSelectedSymptom];
  if (!box || !symptom) {
    if (box) box.textContent = 'Choose a symptom to see exactly what the test is trying to improve.';
    return;
  }
  box.innerHTML = `
    <span class="target-chip">${escapeHtml(symptom.phase)}</span>
    <div><strong>What to measure</strong><p>${escapeHtml(symptom.measure)}</p><small>Target: ${escapeHtml(symptom.success)}</small></div>`;
}

function dampingOtherControlCard(control, chosenControl) {
  if (control === chosenControl || !dampingAvailability()[control]) return '';
  const detail = dampingControlDetails(control, document.getElementById('dampingArea').value);
  const value = currentDampingValue(control);
  return `
    <div class="adjustment-control hold">
      <span class="decision-icon">0</span>
      <div>
        <strong>${escapeHtml(detail.name)} — no change</strong>
        <p>Keep this control at its initial position while measuring the selected symptom.</p>
        <small>${value ? `Initial: ${escapeHtml(value)}` : 'Initial position not entered'}</small>
      </div>
    </div>`;
}

function renderDampingPlan() {
  const output = document.getElementById('dampingPlan');
  if (!output) return;
  const symptom = resolveDampingSymptom();
  const goal = dampingGoalProfile();
  if (!symptom) {
    output.innerHTML = '<div class="empty-state">Choose one symptom in Step 3.</div>';
    return;
  }

  const area = document.getElementById('dampingArea').value;
  const detail = dampingControlDetails(symptom.control, area);
  const current = currentDampingValue(symptom.control);
  const suggestion = suggestedDampingSetting(current, symptom.direction);
  const sign = symptom.direction === 'increase' ? '+' : '−';
  const action = symptom.direction === 'increase' ? 'Increase damping' : 'Decrease damping';

  if (!symptom.available) {
    output.innerHTML = `
      <div class="result-status warning">
        <strong>The required adjuster is not recorded as fitted</strong>
        <p>Do not turn an unrelated control. Confirm the suspension manual or ask a suspension technician to identify the correct adjuster.</p>
      </div>`;
    return;
  }

  output.innerHTML = `
    <div class="damping-diagnosis">
      <span class="target-chip">${escapeHtml(symptom.phase)}</span>
      <div><h3>${escapeHtml(symptom.title)}</h3><p>${escapeHtml(symptom.why)}</p></div>
    </div>

    <div class="goal-in-plan">
      <span>Fine-tuning goal</span><strong>${escapeHtml(goal.label)}</strong>
      <p>${escapeHtml(goal.success)}</p>
    </div>

    ${symptom.fallbackUsed ? `<div class="result-status warning"><strong>No separate specialist adjuster recorded</strong><p>The app is cautiously using the main compression clicker. The model manual takes priority.</p></div>` : ''}

    <div class="adjustment-control change">
      <span class="decision-icon">${sign}</span>
      <div>
        <strong>${escapeHtml(action)} — ${escapeHtml(detail.name)}</strong>
        <p>This changes resistance during ${escapeHtml(detail.movement)}.</p>
        <small>${current ? `Initial setting: ${escapeHtml(current)}` : 'Enter the initial setting before testing'}</small>
      </div>
    </div>

    <div class="damping-exact-action">
      <p class="kicker">One-step test</p>
      <h3>${escapeHtml(suggestion.display)}</h3>
      <p>${escapeHtml(suggestion.instruction)}</p>
    </div>

    <div class="fine-tune-target">
      <div><strong>What you want</strong><p>${escapeHtml(symptom.success)}</p></div>
      <div><strong>What means you went too far</strong><p>${escapeHtml(symptom.opposite)}</p></div>
    </div>

    <div class="adjustment-control-grid">
      ${['compression', 'rebound', 'lsc', 'hsc'].map(control => dampingOtherControlCard(control, symptom.control)).join('')}
    </div>

    <div class="correction-rule">
      <strong>Test, score and stop</strong>
      <p>Repeat the same section once. Enter the actual new setting and the new 0–5 symptom score before making another change.</p>
    </div>`;

  setField('dampingAfterSetting', suggestion.exact || current);
  updateDampingCompareSummary();
}

function updateDampingCompareSummary() {
  const box = document.getElementById('dampingCompareSummary');
  const symptom = resolveDampingSymptom();
  if (!box || !symptom) return;
  const goal = dampingGoalProfile();
  const detail = dampingControlDetails(symptom.control, document.getElementById('dampingArea').value);
  const current = currentDampingValue(symptom.control) || 'not entered';
  const suggestion = suggestedDampingSetting(currentDampingValue(symptom.control), symptom.direction);
  box.innerHTML = `
    <strong>${escapeHtml(symptom.title)}</strong>
    <span>${escapeHtml(detail.name)}</span>
    <small>Goal: ${escapeHtml(goal.label)} · Measure: ${escapeHtml(symptom.success)}</small>`;
  document.getElementById('dampingInitialSettingDisplay').textContent = current;
  document.getElementById('dampingSuggestedSettingDisplay').textContent = suggestion.display;
  if (!getField('dampingAfterSetting')) setField('dampingAfterSetting', suggestion.exact || current);
}

function dampingIssueLabel(value) {
  return {
    none: 'No new problem',
    harshness: 'New harshness or loss of grip',
    bottoming: 'New dive, wallow or bottoming',
    kick: 'New kick or bouncing',
    packing: 'New pack-down',
    stability: 'Reduced stability or control'
  }[value] || value;
}

function calculateDampingResult() {
  const symptom = resolveDampingSymptom();
  const goal = dampingGoalProfile();
  const before = parseNumeric(document.getElementById('dampingBeforeScore').value);
  const after = parseNumeric(document.getElementById('dampingAfterScore').value);
  const afterSetting = getField('dampingAfterSetting');
  const newIssue = document.getElementById('dampingNewIssue').value;
  if (!symptom || before === null || after === null || !afterSetting) return null;

  let outcome;
  if (newIssue !== 'none' || after > before) outcome = 'Worse';
  else if (after < before) outcome = 'Better';
  else outcome = 'Unchanged';

  let nextAction;
  if (outcome === 'Worse') {
    nextAction = 'Return to the recorded initial setting. Do not continue farther in this direction.';
  } else if (outcome === 'Unchanged') {
    nextAction = 'Return to the initial setting and reassess the diagnosis before changing another control.';
  } else if (after <= 1) {
    nextAction = 'Keep the new setting. The chosen symptom is now absent or very slight.';
  } else {
    nextAction = 'Keep this as the new baseline. Save the result before considering one more small step in the same direction.';
  }

  return {
    symptom,
    goal,
    before,
    after,
    afterSetting,
    newIssue,
    outcome,
    nextAction,
    initialSetting: currentDampingValue(symptom.control),
    suggestion: suggestedDampingSetting(currentDampingValue(symptom.control), symptom.direction)
  };
}

function renderDampingOutcome(result) {
  const box = document.getElementById('dampingOutcome');
  if (!box) return;
  if (!result) {
    box.className = 'damping-outcome';
    box.textContent = 'Enter the new setting and after-test score, then press Recalculate.';
    document.getElementById('dampingSave').classList.add('hidden');
    return;
  }

  const issueText = result.newIssue === 'none' ? '' : `<div class="new-issue-warning"><strong>New problem:</strong> ${escapeHtml(dampingIssueLabel(result.newIssue))}</div>`;
  box.className = `damping-outcome ${result.outcome.toLowerCase()}`;
  box.innerHTML = `
    <p class="kicker">Fine-tune result</p>
    <h3>${escapeHtml(result.outcome)}: score ${formatNumber(result.before)} → ${formatNumber(result.after)}</h3>
    <div class="damping-result-metrics">
      <div><span>Initial setting</span><strong>${escapeHtml(result.initialSetting || 'Not entered')}</strong></div>
      <div><span>Setting tested</span><strong>${escapeHtml(result.afterSetting)}</strong></div>
      <div><span>Goal</span><strong>${escapeHtml(result.goal.label)}</strong></div>
    </div>
    ${issueText}
    <div class="result-status ${result.outcome === 'Better' ? 'good' : 'warning'}">
      <strong>${escapeHtml(result.nextAction)}</strong>
      <p>Target: ${escapeHtml(result.symptom.success)}</p>
    </div>`;
  document.getElementById('dampingSave').classList.remove('hidden');
}

function invalidateDampingResult() {
  dampingLatestResult = null;
  renderDampingOutcome(null);
}

function setDampingStep(step) {
  dampingStep = Math.max(1, Math.min(5, step));
  dampingSteps.forEach(section => section.classList.toggle('active', Number(section.dataset.dampingStep) === dampingStep));
  document.querySelectorAll('[data-damping-progress]').forEach(item => {
    const number = Number(item.dataset.dampingProgress);
    item.classList.toggle('active', number === dampingStep);
    item.classList.toggle('complete', number < dampingStep);
  });
  document.getElementById('dampingPrevious').classList.toggle('hidden', dampingStep === 1);
  document.getElementById('dampingNext').classList.toggle('hidden', dampingStep === 5);
  document.getElementById('dampingSave').classList.toggle('hidden', dampingStep !== 5 || !dampingLatestResult);
  document.getElementById('dampingStepText').textContent = `Step ${dampingStep} of 5`;
  if (dampingStep === 4) renderDampingPlan();
  if (dampingStep === 5) {
    updateDampingCompareSummary();
    renderDampingOutcome(dampingLatestResult);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateDampingStep(step) {
  if (step === 1) {
    if (!getField('dampingVehicleName')) {
      showToast('Enter or choose the vehicle first.');
      document.getElementById('dampingVehicleName').focus();
      return false;
    }
    const available = dampingAvailability();
    if (!available.compression && !available.rebound && !available.lsc && !available.hsc) {
      showToast('Select at least one fitted damping adjuster.');
      return false;
    }
  }

  if (step === 2) {
    if (dampingGoalProfile().key === 'custom' && !getField('dampingCustomGoal')) {
      showToast('Describe the custom fine-tuning goal.');
      document.getElementById('dampingCustomGoal').focus();
      return false;
    }
    if (!getField('dampingTestRoute')) {
      showToast('Describe the repeatable test section.');
      document.getElementById('dampingTestRoute').focus();
      return false;
    }
  }

  if (step === 3) {
    const selected = document.querySelector('input[name="dampingSymptom"]:checked');
    if (!selected) {
      showToast('Choose the clearest ride symptom.');
      return false;
    }
    dampingSelectedSymptom = selected.value;
    if (parseNumeric(document.getElementById('dampingBeforeScore').value) === null) {
      showToast('Enter the initial symptom score.');
      document.getElementById('dampingBeforeScore').focus();
      return false;
    }
    const resolved = resolveDampingSymptom();
    if (!resolved?.available) {
      showToast('The required adjuster is not recorded as fitted.');
      return false;
    }
    if (!currentDampingValue(resolved.control)) {
      showToast(`Enter the initial ${dampingControlDetails(resolved.control, document.getElementById('dampingArea').value).short} setting.`);
      return false;
    }
  }
  return true;
}

function resetDampingForm() {
  document.getElementById('dampingForm').reset();
  dampingSelectedSymptom = '';
  dampingLatestResult = null;
  populateDampingRecordSelect();
  populateDampingVehicleSelect();
  document.getElementById('dampingHasCompression').checked = true;
  document.getElementById('dampingHasRebound').checked = true;
  document.getElementById('dampingHasLsc').checked = false;
  document.getElementById('dampingHasHsc').checked = false;
  document.getElementById('dampingGoal').value = 'balanced';
  document.getElementById('dampingNewIssue').value = 'none';
  updateDampingBaselineFields();
  updateDampingGoalSummary();
  updateDampingMeasureGuide();
  setDampingStep(1);
  renderDampingOutcome(null);
}

document.getElementById('dampingRecordSelect')?.addEventListener('change', event => {
  const record = records.find(item => item.id === event.target.value);
  if (record) applyDampingRecord(record);
  invalidateDampingResult();
});

document.getElementById('dampingVehicleSelect')?.addEventListener('change', event => {
  const vehicle = vehicles.find(item => item.id === event.target.value);
  if (vehicle) applyDampingVehicle(vehicle);
  invalidateDampingResult();
});

document.getElementById('dampingArea')?.addEventListener('change', () => {
  const vehicle = dampingSelectedVehicle();
  if (vehicle) applyDampingVehicle(vehicle);
  invalidateDampingResult();
});

['Compression', 'Rebound', 'Lsc', 'Hsc'].forEach(capital => {
  document.getElementById(`dampingHas${capital}`)?.addEventListener('change', () => {
    updateDampingBaselineFields();
    invalidateDampingResult();
  });
});

document.getElementById('dampingGoal')?.addEventListener('change', () => {
  updateDampingGoalSummary();
  invalidateDampingResult();
});
document.getElementById('dampingCustomGoal')?.addEventListener('input', () => {
  updateDampingGoalSummary();
  invalidateDampingResult();
});

document.querySelectorAll('input[name="dampingSymptom"]').forEach(input => {
  input.addEventListener('change', event => {
    dampingSelectedSymptom = event.target.value;
    updateDampingMeasureGuide();
    invalidateDampingResult();
  });
});

['dampingCompression', 'dampingRebound', 'dampingLsc', 'dampingHsc', 'dampingBeforeScore', 'dampingAfterSetting', 'dampingAfterScore', 'dampingNewIssue'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', invalidateDampingResult);
  document.getElementById(id)?.addEventListener('change', invalidateDampingResult);
});

document.getElementById('dampingPrevious')?.addEventListener('click', () => setDampingStep(dampingStep - 1));
document.getElementById('dampingNext')?.addEventListener('click', () => {
  if (!validateDampingStep(dampingStep)) return;
  setDampingStep(dampingStep + 1);
});

document.getElementById('dampingRecalculate')?.addEventListener('click', () => {
  const result = calculateDampingResult();
  if (!result) {
    showToast('Enter the new setting and after-test score first.');
    return;
  }
  dampingLatestResult = result;
  renderDampingOutcome(result);
});

document.getElementById('dampingResetAfter')?.addEventListener('click', () => {
  setField('dampingAfterSetting', '');
  document.getElementById('dampingAfterScore').value = '';
  document.getElementById('dampingNewIssue').value = 'none';
  invalidateDampingResult();
});

document.getElementById('dampingForm')?.addEventListener('submit', event => {
  event.preventDefault();
  if (!dampingLatestResult) {
    showToast('Recalculate the fine-tune result before saving.');
    return;
  }

  const result = dampingLatestResult;
  const detail = dampingControlDetails(result.symptom.control, document.getElementById('dampingArea').value);
  const finalSettings = {
    compression: getField('dampingCompression'),
    rebound: getField('dampingRebound'),
    lsc: getField('dampingLsc'),
    hsc: getField('dampingHsc')
  };

  if (result.outcome === 'Better') {
    finalSettings[result.symptom.control] = result.afterSetting;
  }

  const record = normaliseRecord({
    schemaVersion: 6,
    id: vehicleId(),
    vehicleName: getField('dampingVehicleName'),
    setupName: `Fine-tune — ${result.symptom.title}`,
    compressionSetting: finalSettings.compression,
    reboundSetting: finalSettings.rebound,
    lscSetting: finalSettings.lsc,
    hscSetting: finalSettings.hsc,
    suspensionArea: document.getElementById('dampingArea').value,
    tuningType: detail.name,
    tuningSymptom: result.symptom.title,
    tuningAction: `${result.symptom.direction === 'increase' ? 'Increase' : 'Decrease'} ${detail.short}`,
    tuningOutcome: result.outcome,
    testRoute: getField('dampingTestRoute'),
    settingBefore: result.initialSetting,
    settingAfter: result.afterSetting,
    beforeScore: result.before,
    afterScore: result.after,
    dampingGoal: result.goal.key,
    dampingGoalLabel: result.goal.label,
    dampingGoalSuccess: result.goal.success,
    dampingNewIssue: result.newIssue,
    dampingNextAction: result.nextAction,
    notes: getField('dampingNotes'),
    updatedAt: new Date().toISOString()
  });

  const selectedVehicle = dampingSelectedVehicle() || vehicles.find(vehicle => vehicle.profileName === getField('dampingVehicleName'));
  if (selectedVehicle && result.outcome === 'Better') {
    const area = document.getElementById('dampingArea').value, currentSetup = normaliseVehicleSetupArea(selectedVehicle.setup[area]);
    selectedVehicle.setup[area] = normaliseVehicleSetupArea({...currentSetup,compression: finalSettings.compression,rebound: finalSettings.rebound,lsc: finalSettings.lsc,hsc: finalSettings.hsc,convention: document.getElementById('dampingConvention').value,notes: getField('dampingNotes') || currentSetup.notes,updatedAt: new Date().toISOString()});
    selectedVehicle.updatedAt = new Date().toISOString(); saveVehicles();
  }
  records.unshift(record); saveRecords();
  showToast(selectedVehicle && result.outcome === 'Better' ? 'Better setting saved to the vehicle; test also added to history.' : `Fine-tune test saved to history — ${result.outcome.toLowerCase()}.`);
  resetDampingForm();
  showPage('records');
});

populateDampingRecordSelect();
populateDampingVehicleSelect();
updateDampingBaselineFields();
updateDampingGoalSummary();
updateDampingMeasureGuide();
setDampingStep(1);

const openPosterFullSize = () => window.open('assets/suspension-adjusters-guide.png', '_blank', 'noopener,noreferrer');
document.getElementById('openPoster')?.addEventListener('click', openPosterFullSize);
document.getElementById('openPosterText')?.addEventListener('click', openPosterFullSize);

document.getElementById('aboutExport')?.addEventListener('click', exportRecords);
document.getElementById('aboutImport')?.addEventListener('click', () => document.getElementById('importFile')?.click());
document.getElementById('importFile')?.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const imported = parseRecordPayload(parsed);
    if (!imported.length && (Array.isArray(parsed) ? parsed.length : parsed?.records?.length)) throw new Error('no-valid-records');
    const valid = imported.filter(item => item.vehicleName && item.setupName);
    if (!valid.length && imported.length) throw new Error('no-valid-records');
    const byId = new Map(records.map(item => [item.id, item]));
    valid.forEach(item => byId.set(item.id, item));
    records = [...byId.values()].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    if (saveRecords()) showToast(`${valid.length} ${valid.length === 1 ? 'record' : 'records'} imported.`);
  } catch {
    showToast('That file is not a valid records backup.');
  }
});

document.getElementById('clearAllRecords')?.addEventListener('click', () => {
  if (!records.length) {
    showToast('There are no saved records to clear.');
    return;
  }
  if (!confirm('Delete every saved suspension setup from this browser?')) return;
  records = [];
  if (saveRecords()) showToast('All setup records cleared.');
});

// Installable web app -------------------------------------------------------
let deferredInstallPrompt = null;
const installButton = document.getElementById('installApp');
const installStatus = document.getElementById('installStatus');
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installButton) installButton.disabled = false;
  if (installStatus) installStatus.textContent = 'This device is ready to install the guide as an app.';
});
installButton?.addEventListener('click', async () => {
  if (!deferredInstallPrompt) {
    showToast('Use the browser menu to install this app.');
    return;
  }
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  if (choice.outcome === 'accepted') showToast('App installation started.');
  deferredInstallPrompt = null;
  installButton.disabled = true;
});
window.addEventListener('appinstalled', () => {
  if (installStatus) installStatus.textContent = 'Suspension Setup Guide is installed on this device.';
  showToast('Suspension Setup Guide installed.');
});

updateUnitUi();
renderSagResults();
renderRecords();
const initialRoute = location.hash.replace('#', '') || 'settings';
showPage(pageIds.has(initialRoute) ? initialRoute : 'settings', { updateHash: false, instant: true });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
