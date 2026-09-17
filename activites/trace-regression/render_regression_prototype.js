// THROWAWAY UI PROTOTYPE. No persistence, no production entry point.
// Question: simultaneous workbench, graph-first workspace, or guided worksheet?
import '../../src/styles.css';
import './regression_prototype.css';
import { mountPrototypeSwitcher } from './prototype_switcher';

const root = document.querySelector('#regression-prototype');
const state = {
  variant: 'A', step: 1, showData: false, showPaste: false, selectedRow: null,
  title: 'Caractéristique d’un conducteur ohmique', xUnit: 'mA',
  model: 'affine', fitEnabled: true, example: 'ohm', nextId: 9,
  rows: [0, 5, 10, 15, 20, 25, 30, 35].map((value, index) => ({
    id: index + 1, x: String(value), y: String([0.12, 1.15, 2.26, 3.31, 4.58, 5.48, 6.7, 7.72][index]), included: true,
  })),
};

const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const format = (value, digits = 3) => Number.isFinite(value) ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value) : '—';
const parseNumber = (value) => {
  const normalized = value.trim().replace(',', '.');
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) && Number.isFinite(Number(normalized)) ? Number(normalized) : null;
};

function calculate() {
  const scale = state.xUnit === 'mA' ? 0.001 : 1;
  const points = state.rows.flatMap((row) => {
    const x = parseNumber(row.x), y = parseNumber(row.y);
    return x === null || y === null ? [] : [{ ...row, x: x * scale, y }];
  });
  const used = points.filter((point) => point.included);
  let fit = null, reason = '';
  if (!state.fitEnabled) reason = 'Ajoutez une droite pour modéliser vos mesures.';
  else if (used.length < 2) reason = 'Il faut au moins deux mesures complètes et incluses.';
  else {
    const meanX = used.reduce((sum, point) => sum + point.x, 0) / used.length;
    const meanY = used.reduce((sum, point) => sum + point.y, 0) / used.length;
    const denominator = used.reduce((sum, point) => sum + (state.model === 'affine' ? (point.x - meanX) ** 2 : point.x ** 2), 0);
    if (denominator === 0) reason = state.model === 'affine' ? 'Les abscisses sont identiques : la pente est indéterminée.' : 'Toutes les abscisses sont nulles : la pente est indéterminée.';
    else {
      const numerator = used.reduce((sum, point) => sum + (state.model === 'affine' ? (point.x - meanX) * (point.y - meanY) : point.x * point.y), 0);
      const slope = numerator / denominator;
      const intercept = state.model === 'affine' ? meanY - slope * meanX : 0;
      const residuals = used.map((point) => ({ id: point.id, value: point.y - (slope * point.x + intercept) }));
      const squaredError = residuals.reduce((sum, residual) => sum + residual.value ** 2, 0);
      const totalVariation = used.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0);
      if (![slope, intercept, squaredError, totalVariation].every(Number.isFinite)) reason = 'Ces valeurs dépassent la plage numérique de ce prototype.';
      else fit = { slope, intercept, displaySlope: slope * scale, rSquared: state.model === 'affine' && totalVariation > 0 ? 1 - squaredError / totalVariation : null, residuals };
    }
  }
  return { points, used, fit, reason, scale, incomplete: state.rows.length - points.length };
}

function renderHeader() {
  return `<header class="lab-header"><a href="../../index.html" class="lab-brand"><span class="brand-mark">φ</span> PhyChem <b>Lab</b></a>
    <div class="breadcrumb"><span>Activités</span><span>/</span><strong>Tracé & régression</strong></div>
    <span class="prototype-badge">Prototype · données temporaires</span></header>`;
}

function renderIntro(description) {
  return `<div class="intro"><div><p class="eyebrow">MESURES EXPÉRIMENTALES</p><h1>Tracé & régression<span>.</span></h1><p>${description}</p></div>
    <div class="intro-actions"><button type="button" data-action="new" class="quiet-button">Nouvelle série</button><button type="button" data-action="export" class="primary-button">Exporter le graphique <span aria-hidden="true">↗</span></button></div></div>`;
}

function renderTable() {
  return `<div class="measurements"><div class="section-heading"><div><span class="eyebrow">VOTRE SÉRIE</span><h2>Les mesures <span class="count" data-count></span></h2></div><button type="button" data-action="paste" class="icon-button" title="Coller des mesures">Coller ↙</button></div>
    <label class="field-label">Nom de la série<input class="series-name" data-field="title" value="${escape(state.title)}" /></label>
    <div class="table-wrap"><table><thead><tr><th scope="col"><span class="sr-only">Inclure</span>✓</th><th scope="col">I <span>(${state.xUnit})</span></th><th scope="col">U <span>(V)</span></th><th scope="col"><span class="sr-only">Supprimer</span></th></tr></thead>
    <tbody>${state.rows.map((row, index) => `<tr data-table-row="${row.id}" class="${row.included ? '' : 'excluded'} ${state.selectedRow === row.id ? 'selected' : ''}"><td><input type="checkbox" data-row="${row.id}" data-field="included" aria-label="Inclure la mesure ${index + 1}" ${row.included ? 'checked' : ''} /></td>
      <td><input aria-label="Intensité de la mesure ${index + 1}" inputmode="decimal" data-row="${row.id}" data-field="x" value="${escape(row.x)}" placeholder="—" /></td>
      <td><input aria-label="Tension de la mesure ${index + 1}" inputmode="decimal" data-row="${row.id}" data-field="y" value="${escape(row.y)}" placeholder="—" /></td>
      <td><button type="button" class="delete-row" data-delete="${row.id}" aria-label="Supprimer la mesure ${index + 1}">×</button></td></tr>`).join('')}</tbody></table></div>
    <button type="button" class="add-row" data-action="add">＋ Ajouter une mesure</button><p class="table-hint">Virgule ou point décimal · Décochez un point pour l’exclure de l’ajustement.</p>
    <div class="series-footer"><label>Intensité en <select data-field="unit" aria-label="Unité de l’intensité"><option ${state.xUnit === 'mA' ? 'selected' : ''}>mA</option><option ${state.xUnit === 'A' ? 'selected' : ''}>A</option></select></label><button type="button" data-action="csv" class="text-button">Exporter CSV ↓</button></div></div>`;
}

function renderControls() {
  return `<div class="fit-controls"><label class="fit-toggle"><input type="checkbox" data-field="fit" ${state.fitEnabled ? 'checked' : ''} /><span>Droite de régression</span></label>
    <div class="model-options" role="group" aria-label="Modèle de régression"><button type="button" data-model="affine" aria-pressed="${state.model === 'affine'}">Affine <span>ax + b</span></button><button type="button" data-model="origin" aria-pressed="${state.model === 'origin'}">Proportionnelle <span>ax</span></button></div></div>`;
}

function renderResults(result) {
  if (!result.fit) return `<div class="result-empty"><span class="eyebrow">MODÉLISATION</span><p>${escape(result.reason)}</p></div>`;
  const { fit } = result;
  return `<div class="result-equation"><span class="eyebrow">${state.model === 'affine' ? 'AJUSTEMENT AFFINE' : 'PASSAGE PAR L’ORIGINE'}</span><div class="equation">U = ${format(fit.displaySlope, 4)} I ${state.model === 'affine' ? `${fit.intercept < 0 ? '−' : '+'} ${format(Math.abs(fit.intercept), 4)}` : ''}</div><p>I en ${state.xUnit} · U en V</p></div>
    <div class="result-stat"><span>Pente <i>a</i></span><strong>${format(fit.slope, 2)} <small>Ω</small></strong><span>${format(fit.displaySlope, 4)} V/${state.xUnit}</span></div>
    <div class="result-stat"><span>Ordonnée <i>b</i></span><strong>${format(fit.intercept, 4)} <small>V</small></strong><span>${state.model === 'origin' ? 'Imposée à zéro' : 'À intensité nulle'}</span></div>
    <div class="result-stat"><span>Coefficient R²</span><strong>${fit.rSquared === null ? '—' : format(fit.rSquared, 5)}</strong><span>${state.model === 'origin' ? 'Non affiché pour ce modèle' : fit.rSquared === null ? 'Ordonnées constantes' : `${result.used.length} points utilisés`}</span></div>`;
}

function renderPlot(result) {
  const points = result.points.map((point) => ({ ...point, displayX: point.x / result.scale }));
  let xMin = Math.min(0, ...points.map((point) => point.displayX)), xMax = Math.max(0, ...points.map((point) => point.displayX));
  let yMin = Math.min(0, ...points.map((point) => point.y)), yMax = Math.max(0, ...points.map((point) => point.y));
  if (xMin === xMax) xMax = xMin + 1;
  if (yMin === yMax) yMax = yMin + 1;
  const padX = (xMax - xMin) * 0.1, padY = (yMax - yMin) * 0.12;
  xMin -= padX * 0.25; xMax += padX; yMin -= padY * 0.25; yMax += padY;
  const projectX = (x) => 85 + (x - xMin) / (xMax - xMin) * 750;
  const projectY = (y) => 432 - (y - yMin) / (yMax - yMin) * 365;
  function ticks(min, max) {
    const rough = (max - min) / 7;
    const power = 10 ** Math.floor(Math.log10(rough));
    const step = ([1, 2, 5, 10].find((candidate) => candidate * power >= rough) || 10) * power;
    const values = [];
    for (let value = Math.ceil(min / step) * step; value <= max + step * 1e-8 && values.length < 20; value += step) values.push(value);
    return values;
  }
  const xTicks = ticks(xMin, xMax), yTicks = ticks(yMin, yMax);
  let line = '';
  if (result.fit) {
    const min = Math.min(...result.used.map((point) => point.x));
    const max = Math.max(...result.used.map((point) => point.x));
    line = `<line x1="${projectX(min / result.scale)}" y1="${projectY(result.fit.slope * min + result.fit.intercept)}" x2="${projectX(max / result.scale)}" y2="${projectY(result.fit.slope * max + result.fit.intercept)}" stroke="#168578" stroke-width="2.5" />`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 510" role="img" aria-label="Graphique de la tension U en fonction de l’intensité I" class="scatter-plot">
    <title>${escape(state.title || 'Mesures expérimentales')}</title><desc>${points.length} mesures ; ${result.used.length} incluses dans l’ajustement. Les valeurs sont accessibles dans le tableau.</desc>
    <rect width="900" height="510" fill="#fffefa"/><defs><clipPath id="plot-bounds"><rect x="85" y="67" width="750" height="365" /></clipPath></defs>
    <g font-family="Arial, sans-serif" font-size="13" fill="#718078">
    ${xTicks.map((x) => `<line x1="${projectX(x)}" y1="67" x2="${projectX(x)}" y2="432" stroke="#e5e9e2"/><text x="${projectX(x)}" y="458" text-anchor="middle">${format(x, 5)}</text>`).join('')}
    ${yTicks.map((y) => `<line x1="85" y1="${projectY(y)}" x2="835" y2="${projectY(y)}" stroke="#e5e9e2"/><text x="68" y="${projectY(y) + 4}" text-anchor="end">${format(y, 5)}</text>`).join('')}
    <path d="M85 67 V432 H835" stroke="#9ba9a0" fill="none"/><text x="85" y="34" fill="#263e33" font-size="16" font-weight="600">Tension U (V)</text><text x="835" y="494" text-anchor="end" fill="#263e33" font-size="16" font-weight="600">Intensité I (${state.xUnit})</text></g>
    <g clip-path="url(#plot-bounds)">${line}${points.map((point) => `<g data-point="${point.id}" tabindex="0" role="button" aria-label="Mesure ${state.rows.findIndex((row) => row.id === point.id) + 1} : ${format(point.displayX)} ${state.xUnit}, ${format(point.y)} V${point.included ? '' : ', exclue'}" style="cursor:pointer"><title>${format(point.displayX)} ${state.xUnit} ; ${format(point.y)} V</title><circle cx="${projectX(point.displayX)}" cy="${projectY(point.y)}" r="14" fill="${state.selectedRow === point.id ? '#ffe1bd' : 'transparent'}"/><circle cx="${projectX(point.displayX)}" cy="${projectY(point.y)}" r="5.5" fill="${point.included ? '#df784c' : '#fffefa'}" stroke="${point.included ? '#bc582e' : '#a6afa8'}" stroke-width="2" /></g>`).join('')}</g>
    ${points.length ? '' : '<text x="460" y="240" text-anchor="middle" fill="#7d8b82" font-family="Arial, sans-serif" font-size="18">Vos mesures apparaîtront ici</text>'}</svg>`;
}

function renderGraph() {
  return `<section class="graph-panel"><div class="graph-heading"><div><span class="eyebrow">REPRÉSENTATION GRAPHIQUE</span><h2 data-graph-title>${escape(state.title || 'Mesures expérimentales')}</h2></div><span class="axis-label">U = f(I)</span></div><div data-plot></div><div class="graph-footer"><div class="legend"><span><i class="point-key"></i> Mesures</span><span><i class="line-key"></i> Ajustement</span></div><span data-plot-status></span></div></section>`;
}

function renderExampleSelect() {
  return `<label class="example-select">Exemple <select data-field="example"><option value="ohm" ${state.example === 'ohm' ? 'selected' : ''}>Conducteur ohmique</option><option value="offset" ${state.example === 'offset' ? 'selected' : ''}>Droite avec décalage</option><option value="outlier" ${state.example === 'outlier' ? 'selected' : ''}>Une mesure à examiner</option><option value="custom" ${state.example === 'custom' ? 'selected' : ''} disabled>Série personnelle</option></select></label>`;
}

function VariantA() {
  return `${renderIntro('Saisissez vos mesures. Faites apparaître la relation.')}<div class="workspace-toolbar"><span class="context-chip"><span class="status-dot"></span> Étude d’un conducteur ohmique</span>${renderExampleSelect()}</div>
    <div class="workbench"><aside class="data-panel">${renderTable()}</aside><div class="analysis-panel">${renderGraph()}<section class="model-panel"><div class="section-heading"><h2>Modéliser les mesures</h2><span class="small-note">Moindres carrés</span></div>${renderControls()}<div class="results" data-results></div><p class="model-note">Une droite ajustée décrit les mesures ; elle ne suffit pas à valider une loi physique.</p></section></div></div>`;
}

function VariantB() {
  return `<div class="focus-intro"><div><p class="eyebrow">EXPLORER LA RELATION</p><h1>Place au graphique<span>.</span></h1></div><div class="intro-actions">${renderExampleSelect()}<button type="button" class="primary-button" data-action="drawer">${state.showData ? 'Masquer les mesures' : 'Modifier les mesures'} <span aria-hidden="true">☷</span></button></div></div>
    <div class="focus-workspace ${state.showData ? 'drawer-open' : ''}"><div class="focus-chart">${renderGraph()}<div class="focus-result" data-results></div></div>${state.showData ? `<aside class="focus-drawer">${renderTable()}</aside>` : ''}</div>
    <div class="focus-command">${renderControls()}<button type="button" class="quiet-button" data-action="export">Exporter SVG ↗</button></div><p class="focus-hint">Sélectionnez un point pour retrouver sa mesure. La droite reste limitée aux abscisses utilisées.</p>`;
}

function VariantC() {
  return `<div class="guided-layout"><aside class="lesson-rail"><a href="../index.html" class="lesson-back">← Les activités</a><p class="eyebrow">CARNET EXPÉRIMENTAL</p><h1>Des mesures<br> à la relation<span>.</span></h1><p>Construisez le graphique de votre expérience, une étape à la fois.</p>
    <ol class="lesson-steps">${[['Saisir', 'Rassembler les mesures'], ['Représenter', 'Observer le nuage de points'], ['Modéliser', 'Ajuster et interpréter']].map(([title, description], index) => `<li><button type="button" data-step="${index + 1}" ${state.step === index + 1 ? 'aria-current="step"' : ''}><span>${index + 1}</span><div><strong>${title}</strong><small>${description}</small></div></button></li>`).join('')}</ol>
    <div class="lesson-summary"><span class="eyebrow">VOTRE EXPÉRIENCE</span><strong>${escape(state.title || 'Série personnelle')}</strong><p><span data-count></span> mesures · I (${state.xUnit}) → U (V)</p></div></aside>
    <section class="worksheet"><div class="worksheet-heading"><span class="eyebrow">ÉTAPE 0${state.step} / 03</span><span class="handwritten">À vous d’expérimenter</span></div>
    ${state.step === 1 ? `<h2>Commençons par vos mesures.</h2><p class="worksheet-description">Chaque ligne associe une intensité à une tension mesurée. Entrez vos valeurs ou utilisez un exemple.</p><div class="worksheet-example">${renderExampleSelect()}</div>${renderTable()}` : state.step === 2 ? `<h2>Quelle relation se dessine ?</h2><p class="worksheet-description">Observez la disposition des points : semblent-ils suivre une droite ? Cette droite passerait-elle par l’origine ?</p>${renderGraph()}<div class="observation"><span>À observer</span><p>Un nuage presque aligné peut suggérer un modèle affine. Le passage par l’origine demande une justification physique.</p></div>` : `<h2>Une droite pour décrire les mesures.</h2><p class="worksheet-description">Comparez les modèles affine et proportionnel, puis lisez la pente avec son unité.</p>${renderControls()}${renderGraph()}<div class="results" data-results></div><div class="observation"><span>À interpréter</span><p>Pour un conducteur ohmique, la pente de U en fonction de I correspond à une résistance. R² décrit l’ajustement, pas la validité de la loi.</p></div>`}
    <footer class="worksheet-navigation">${state.step > 1 ? `<button type="button" data-step="${state.step - 1}" class="quiet-button">← Précédent</button>` : '<span>Vos modifications restent en mémoire dans cette page.</span>'}${state.step < 3 ? `<button type="button" data-step="${state.step + 1}" class="primary-button">${state.step === 1 ? 'Tracer les points' : 'Choisir un modèle'} →</button>` : '<button type="button" data-action="export" class="primary-button">Exporter le graphique ↗</button>'}</footer></section></div>`;
}

function render() {
  root.innerHTML = `${renderHeader()}<main class="app regression-app variant-${state.variant}">${state.variant === 'A' ? VariantA() : state.variant === 'B' ? VariantB() : VariantC()}
    <details class="prototype-state"><summary>État du prototype <span>Question : quelle organisation facilite la saisie et l’analyse ?</span></summary><p>Code jetable · aucune sauvegarde · verdict à choisir après comparaison. Calculs en SI, affichage dans les unités choisies. Changer de variante conserve les mesures ; recharger les réinitialise.</p><pre data-state></pre></details></main>
    ${state.showPaste ? `<div class="paste-backdrop"><section class="paste-dialog" role="dialog" aria-modal="true" aria-labelledby="paste-title"><div class="section-heading"><h2 id="paste-title">Coller vos mesures</h2><button type="button" data-action="close-paste" class="icon-button" aria-label="Fermer">×</button></div><p>Deux colonnes, I (${state.xUnit}) puis U (V), séparées par des tabulations ou des points-virgules. Les valeurs remplaceront la série actuelle.</p><textarea id="paste-values" rows="7" aria-label="Mesures à importer" placeholder="0;0,12&#10;5;1,15&#10;10;2,26"></textarea><p id="paste-message" role="status"></p><button type="button" data-action="import" class="primary-button">Utiliser ces mesures</button></section></div>` : ''}<div class="notice" role="status" id="notice"></div>`;
  updateLive();
  if (state.showPaste) document.querySelector('#paste-values').focus();
}

function updateLive() {
  const result = calculate();
  root.querySelectorAll('[data-plot]').forEach((element) => { element.innerHTML = renderPlot(result); });
  // Step 2 deliberately shows the raw observations before the modeling step.
  if (state.variant === 'C' && state.step === 2) root.querySelector('[data-plot]').innerHTML = renderPlot({ ...result, fit: null });
  root.querySelectorAll('[data-results]').forEach((element) => { element.innerHTML = renderResults(result); });
  root.querySelectorAll('.legend .line-key').forEach((element) => { element.parentElement.hidden = !result.fit || (state.variant === 'C' && state.step === 2); });
  root.querySelectorAll('[data-field="example"]').forEach((element) => { element.value = state.example; });
  root.querySelectorAll('[data-count]').forEach((element) => { element.textContent = result.points.length; });
  root.querySelectorAll('[data-graph-title]').forEach((element) => { element.textContent = state.title || 'Mesures expérimentales'; });
  root.querySelectorAll('[data-plot-status]').forEach((element) => { element.textContent = `${result.used.length}/${result.points.length} points inclus${result.incomplete ? ` · ${result.incomplete} ligne(s) incomplète(s) ou invalide(s)` : ''}${result.used.length === 2 && result.fit ? ' · 2 points : dispersion non évaluable' : ''}`; });
  root.querySelectorAll('[data-table-row]').forEach((element) => {
    const row = state.rows.find((candidate) => candidate.id === Number(element.dataset.tableRow));
    element.classList.toggle('selected', state.selectedRow === row.id);
    element.classList.toggle('excluded', !row.included);
    element.querySelectorAll('input[data-field="x"], input[data-field="y"]').forEach((input) => {
      input.setAttribute('aria-invalid', String(input.value.trim() !== '' && parseNumber(input.value) === null));
    });
  });
  root.querySelector('[data-state]').textContent = JSON.stringify({ ...state, calculation: { ...result, units: { x: 'A', y: 'V', slope: 'Ω' } } }, null, 2);
}

function loadExample(example) {
  const xValues = [0, 5, 10, 15, 20, 25, 30, 35];
  const yValues = example === 'offset' ? [1, 2, 3, 4, 5, 6, 7, 8] : [0.12, 1.15, 2.26, 3.31, 4.58, 5.48, 6.7, 7.72];
  if (example === 'outlier') yValues[5] = 8.9;
  state.rows = xValues.map((x, index) => ({ id: index + 1, x: String(state.xUnit === 'A' ? x / 1000 : x), y: String(yValues[index]), included: true }));
  state.title = example === 'offset' ? 'Une droite avec une ordonnée à l’origine' : example === 'outlier' ? 'Une mesure à examiner' : 'Caractéristique d’un conducteur ohmique';
  state.example = example; state.nextId = 9; state.selectedRow = null;
}

function download(content, type, name) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

root.addEventListener('input', (event) => {
  const { field, row } = event.target.dataset;
  if (field === 'title') state.title = event.target.value;
  else if (row && ['x', 'y'].includes(field)) {
    state.rows.find((candidate) => candidate.id === Number(row))[field] = event.target.value;
    state.example = 'custom';
  } else return;
  updateLive();
});

root.addEventListener('change', (event) => {
  const { field, row } = event.target.dataset;
  if (field === 'included') { state.rows.find((candidate) => candidate.id === Number(row)).included = event.target.checked; updateLive(); }
  if (field === 'fit') { state.fitEnabled = event.target.checked; updateLive(); }
  if (field === 'unit') {
    const multiplier = event.target.value === 'A' ? 0.001 : 1000;
    state.rows.forEach((point) => { const value = parseNumber(point.x); if (value !== null) point.x = String(Number((value * multiplier).toPrecision(12))); });
    state.xUnit = event.target.value; render();
  }
  if (field === 'example') { loadExample(event.target.value); render(); }
});

root.addEventListener('click', (event) => {
  const point = event.target.closest('[data-point]');
  if (point) {
    state.selectedRow = Number(point.dataset.point);
    if (state.variant === 'B') { state.showData = true; render(); } else updateLive();
    root.querySelector(`[data-table-row="${state.selectedRow}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return;
  }
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.model) { state.model = button.dataset.model; state.fitEnabled = true; render(); }
  if (button.dataset.step) { state.step = Number(button.dataset.step); render(); }
  if (button.dataset.delete) { state.rows = state.rows.filter((row) => row.id !== Number(button.dataset.delete)); state.example = 'custom'; render(); }
  const action = button.dataset.action;
  if (action === 'add') { const id = state.nextId++; state.rows.push({ id, x: '', y: '', included: true }); render(); root.querySelector(`input[data-row="${id}"][data-field="x"]`).focus(); }
  if (action === 'new') { state.rows = [{ id: state.nextId++, x: '', y: '', included: true }]; state.example = 'custom'; state.title = ''; render(); }
  if (action === 'drawer') { state.showData = !state.showData; render(); }
  if (action === 'paste' || action === 'close-paste') { state.showPaste = action === 'paste'; render(); }
  if (action === 'import') {
    const lines = document.querySelector('#paste-values').value.trim().split(/\r?\n/).filter((line) => line.trim());
    const values = lines.map((line) => line.split(/\t|;/).map((cell) => cell.trim()));
    if (!values.length || values.some((cells) => cells.length !== 2 || cells.some((cell) => parseNumber(cell) === null))) { document.querySelector('#paste-message').textContent = 'Chaque ligne doit contenir deux nombres, séparés par une tabulation ou un point-virgule.'; return; }
    state.rows = values.map(([x, y]) => ({ id: state.nextId++, x, y, included: true })); state.example = 'custom'; state.showPaste = false; render();
  }
  if (action === 'export') {
    const result = calculate();
    const equation = result.fit ? `U = ${format(result.fit.displaySlope, 4)} I ${result.fit.intercept < 0 ? '−' : '+'} ${format(Math.abs(result.fit.intercept), 4)} ; I en ${state.xUnit}, U en V` : 'Sans ajustement';
    let svg = renderPlot(result).replace('viewBox="0 0 900 510"', 'viewBox="0 0 900 570" width="1200" height="760"');
    svg = svg.replace('</svg>', `<rect x="0" y="510" width="900" height="60" fill="#fffefa"/><text x="85" y="541" font-family="Arial, sans-serif" font-size="16" fill="#263e33">${escape(equation)}</text><text x="85" y="561" font-family="Arial, sans-serif" font-size="12" fill="#718078">PhyChem Lab · ${result.used.length} points inclus · ${escape(state.title)}</text></svg>`);
    download(svg, 'image/svg+xml;charset=utf-8', 'graphique-regression.svg');
    document.querySelector('#notice').textContent = 'Téléchargement du graphique SVG demandé.';
  }
  if (action === 'csv') { const result = calculate(); download(`I (${state.xUnit});U (V);Inclus\n${result.points.map((point) => `${String(point.x / result.scale).replace('.', ',')};${String(point.y).replace('.', ',')};${point.included ? 'oui' : 'non'}`).join('\n')}`, 'text/csv;charset=utf-8', 'mesures.csv'); document.querySelector('#notice').textContent = 'Téléchargement des mesures CSV demandé.'; }
});

root.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.showPaste) { state.showPaste = false; render(); }
  const point = event.target.closest('[data-point]');
  if (point && ['Enter', ' '].includes(event.key)) { event.preventDefault(); point.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  if (state.showPaste && event.key === 'Tab') {
    const items = [...root.querySelectorAll('.paste-dialog button, .paste-dialog textarea')];
    if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
  }
});

root.addEventListener('focusin', (event) => {
  if (event.target.dataset.row) { state.selectedRow = Number(event.target.dataset.row); updateLive(); }
});

mountPrototypeSwitcher([{ key: 'A', name: 'Atelier' }, { key: 'B', name: 'Graphique' }, { key: 'C', name: 'Parcours guidé' }], (variant) => {
  state.variant = variant;
  state.showPaste = false;
  render();
});
if (!import.meta.env.DEV) render();
