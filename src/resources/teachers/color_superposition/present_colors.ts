import '../../../styles.css';
import './colors.css';
import { absorbLight, COLORED_OBJECTS, describeColor, diffuseLight, displayColor, mixLights, type LightChannels } from './model_colors';

type Experiment = 'mixing' | 'objects';
type Point = readonly [number, number];
interface ColorSession {
  experiment: Experiment;
  intensities: LightChannels;
  positions: Point[];
  selectedObject: string;
  showExplanations: boolean;
  showLabels: boolean;
}

const SESSION_KEY = 'phychem-teacher-colors-v1';
const SOURCE_NAMES = ['Rouge', 'Vert', 'Bleu'];
const ZONE_NAMES = ['rouge', 'verte', 'bleue'];
const SOURCE_LETTERS = ['R', 'V', 'B'];
const SOURCE_COLORS = ['#ff0000', '#00ff00', '#0000ff'];
const SPOT_RADIUS = 145;
const LAYOUTS: Record<string, readonly Point[]> = {
  overlap: [[430, 255], [570, 255], [500, 370]],
  separate: [[190, 310], [500, 310], [810, 310]],
  aligned: [[500, 310], [500, 310], [500, 310]],
};
const PRESETS: Record<string, LightChannels> = {
  white: [1, 1, 1], red: [1, 0, 0], green: [0, 1, 0], blue: [0, 0, 1],
  yellow: [1, 1, 0], cyan: [0, 1, 1], magenta: [1, 0, 1], off: [0, 0, 0],
};

function defaultSession(): ColorSession {
  return { experiment: 'mixing', intensities: [1, 1, 1], positions: [...LAYOUTS.overlap], selectedObject: 'yellow', showExplanations: true, showLabels: true };
}

function restoreSession(): ColorSession {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return defaultSession();
    const value = JSON.parse(stored);
    if ((value.experiment !== 'mixing' && value.experiment !== 'objects')
      || !Array.isArray(value.intensities) || value.intensities.length !== 3
      || !value.intensities.every((channel: unknown) => typeof channel === 'number' && Number.isFinite(channel) && channel >= 0 && channel <= 1)
      || !Array.isArray(value.positions) || value.positions.length !== 3
      || !value.positions.every((point: unknown) => Array.isArray(point) && point.length === 2 && point.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate)) && point[0] >= 150 && point[0] <= 850 && point[1] >= 195 && point[1] <= 410)
      || !COLORED_OBJECTS.some((object) => object.id === value.selectedObject)
      || typeof value.showLabels !== 'boolean' || typeof value.showExplanations !== 'boolean') return defaultSession();
    return value as ColorSession;
  } catch { return defaultSession(); }
}

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Élément manquant : ${id}`);
  return found as T;
}

const session = restoreSession();
const scene = document.getElementById('color-scene') as unknown as SVGSVGElement;
const observation = element('observation');
const status = element('color-status');
const tabs = [element<HTMLButtonElement>('mixing-tab'), element<HTMLButtonElement>('objects-tab')];
const presetSelectors = [element<HTMLSelectElement>('light-preset'), element<HTMLSelectElement>('fullscreen-light-preset')];
presetSelectors[1].innerHTML = presetSelectors[0].innerHTML;
element('light-controls').innerHTML = SOURCE_NAMES.map((name, index) => `
  <div class="color-light">
    <div class="color-light-header"><label for="intensity-${index}"><span class="color-swatch" style="background:${SOURCE_COLORS[index]}" aria-hidden="true"></span>${name}</label><output id="value-${index}" for="intensity-${index}"></output></div>
    <input id="intensity-${index}" type="range" min="0" max="100" step="1" aria-label="Intensité ${name.toLowerCase()}" />
  </div>`).join('');

function persistSession(): void {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
  catch { status.textContent = 'La conservation de la session est indisponible dans ce navigateur. Les réglages restent utilisables.'; }
}

function svgText(x: number, y: number, text: string, size = 20, fill = '#edf1f3', anchor = 'start'): string {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${text}</text>`;
}

function luminance(channels: LightChannels): number {
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function sourceChannels(index: number): LightChannels {
  return [index === 0 ? session.intensities[0] : 0, index === 1 ? session.intensities[1] : 0, index === 2 ? session.intensities[2] : 0];
}

function circle(index: number, attributes = ''): string {
  const [x, y] = session.positions[index];
  return `<circle cx="${x}" cy="${y}" r="${SPOT_RADIUS}" ${attributes}/>`;
}

function regionLabel(mask: number, activeMask: number): Point | undefined {
  let best: Point | undefined;
  let bestClearance = 27;
  for (let x = 160; x <= 840; x += 20) {
    for (let y = 180; y <= 550; y += 20) {
      let clearance = Infinity;
      for (let index = 0; index < 3; index++) {
        if (!(activeMask & (1 << index))) continue;
        const [cx, cy] = session.positions[index];
        const distance = Math.hypot(x - cx, y - cy);
        clearance = Math.min(clearance, mask & (1 << index) ? SPOT_RADIUS - distance : distance - SPOT_RADIUS);
      }
      if (clearance > bestClearance) { best = [x, y]; bestClearance = clearance; }
    }
  }
  return best;
}

function renderMixing(compact = false): string {
  const activeMask = session.intensities.reduce((mask, value, index) => mask | (value > 0 ? 1 << index : 0), 0);
  const definitions = session.positions.map((_, index) => `<clipPath id="spot-${index}">${circle(index)}</clipPath>`);
  const regions: string[] = [];
  const labels: string[] = [];
  for (let mask = 1; mask < 8; mask++) {
    if ((mask & activeMask) !== mask) continue;
    const included = [0, 1, 2].filter((index) => mask & (1 << index));
    const excluded = [0, 1, 2].filter((index) => (activeMask & (1 << index)) && !(mask & (1 << index)));
    const channels = mixLights(included.map(sourceChannels));
    definitions.push(`<mask id="region-${mask}" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="600"><rect width="1000" height="600" fill="white"/>${excluded.map((index) => circle(index, 'fill="black"')).join('')}</mask>`);
    let shape = circle(included[0], `fill="${displayColor(channels)}"`);
    for (const index of included.slice(1)) shape = `<g clip-path="url(#spot-${index})">${shape}</g>`;
    regions.push(`<g mask="url(#region-${mask})" data-region="${mask}" data-color="${displayColor(channels)}">${shape}</g>`);
    const point = regionLabel(mask, activeMask);
    const regionLuminance = luminance(channels);
    const blackContrast = (regionLuminance + 0.05) / 0.05;
    const whiteContrast = 1.05 / (regionLuminance + 0.05);
    if (point && session.showLabels) labels.push(svgText(point[0], point[1], describeColor(channels), 19, blackContrast >= whiteContrast ? '#000000' : '#ffffff', 'middle'));
  }
  const draggableZones = session.positions.map((_, index) => {
    if (session.intensities[index] === 0) return '';
    return `<g data-source="${index}" data-export-omit="true" role="button" tabindex="0" aria-label="Déplacer la zone ${ZONE_NAMES[index]}">${circle(index, 'class="focus-ring" fill="transparent" stroke="transparent" stroke-width="3" pointer-events="all"')}</g>`;
  }).join('');
  const left = compact ? Math.min(...session.positions.map(([x]) => x)) - SPOT_RADIUS - 15 : 40;
  const top = compact ? Math.min(...session.positions.map(([, y]) => y)) - SPOT_RADIUS - 65 : 50;
  return `<defs>${definitions.join('')}</defs>${svgText(left, top, compact ? 'Écran blanc · sans lumière ambiante' : 'Écran blanc dans une pièce sans éclairage ambiant', compact ? 20 : 22)}
    ${svgText(left, top + 38, session.intensities.map((value, index) => `${SOURCE_LETTERS[index]} : ${Math.round(value * 100)} %`).join('     ·     '), 19, '#bac6ce')}
    ${regions.join('')}<g pointer-events="none">${labels.join('')}</g>${draggableZones}
    ${activeMask === 0 ? svgText(500, 310, 'Aucune lumière : l’écran paraît noir.', 24, '#edf1f3', 'middle') : ''}`;
}

function renderObjects(compact = false): string {
  const light = session.intensities;
  if (compact) {
    return `${svgText(25, 40, `Éclairage : ${describeColor(light).toLowerCase()}`, 24)}
      ${svgText(25, 78, light.map((value, index) => `${SOURCE_LETTERS[index]} : ${Math.round(value * 100)} %`).join(' · '), 20, '#bac6ce')}
      ${svgText(25, 116, 'Gauche : lumière blanche', 20)}${svgText(25, 146, 'Droite : éclairage choisi', 20)}
      ${COLORED_OBJECTS.map((object, index) => {
        const x = 25 + (index % 2) * 250;
        const y = 200 + Math.floor(index / 2) * 190;
        const diffused = diffuseLight(light, object.reflectance);
        return `<g data-object="${object.id}" role="button" tabindex="0" aria-label="Examiner l’objet ${object.name.toLowerCase()}" aria-pressed="${session.selectedObject === object.id}">
          ${svgText(x, y, `Objet ${object.name.toLowerCase()}`, 22)}
          <rect x="${x}" y="${y + 18}" width="90" height="96" rx="4" fill="${displayColor(object.reflectance)}" stroke="#647580"/>
          <rect x="${x + 105}" y="${y + 18}" width="90" height="96" rx="4" fill="${displayColor(diffused)}" stroke="#647580" data-observed-color="${object.id}"/>
          <rect class="focus-ring" x="${x + 100}" y="${y + 13}" width="100" height="106" rx="6" fill="none" stroke="${session.selectedObject === object.id ? '#edf1f3' : 'transparent'}" stroke-width="3" data-export-omit="true"/>
          ${session.showLabels ? svgText(x + 150, y + 147, describeColor(diffused), 21, '#edf1f3', 'middle') : ''}
        </g>`;
      }).join('')}`;
  }
  return `${svgText(40, 46, `Éclairage : ${describeColor(light).toLowerCase()}`, 24)}
    ${svgText(40, 82, light.map((value, index) => `${SOURCE_LETTERS[index]} : ${Math.round(value * 100)} %`).join('     ·     '), 19, '#bac6ce')}
    ${svgText(40, 140, 'Sous lumière blanche · référence', 20)}
    ${svgText(40, 325, 'Sous l’éclairage choisi', 20)}
    ${COLORED_OBJECTS.map((object, index) => {
      const x = 55 + index * 128;
      const diffused = diffuseLight(light, object.reflectance);
      const selected = session.selectedObject === object.id;
      return `<g data-object="${object.id}" role="button" tabindex="0" aria-label="Examiner l’objet ${object.name.toLowerCase()}" aria-pressed="${selected}">
        <rect x="${x}" y="166" width="112" height="112" rx="4" fill="${displayColor(object.reflectance)}" stroke="#647580"/>
        ${svgText(x + 56, 304, object.name, 19, '#edf1f3', 'middle')}
        <rect x="${x}" y="350" width="112" height="112" rx="4" fill="${displayColor(diffused)}" stroke="#647580" data-observed-color="${object.id}"/>
        <rect class="focus-ring" x="${x - 5}" y="345" width="122" height="122" rx="6" fill="none" stroke="${selected ? '#edf1f3' : 'transparent'}" stroke-width="3" data-export-omit="true"/>
        ${session.showLabels ? svgText(x + 56, 502, describeColor(diffused), 18, '#edf1f3', 'middle') : ''}
      </g>`;
    }).join('')}
    ${svgText(40, 565, 'Objets idéaux : la lumière diffusée détermine la couleur apparente.', 20, '#bac6ce')}`;
}

function renderObservation(): void {
  observation.hidden = !session.showExplanations;
  if (session.experiment === 'mixing') {
    observation.innerHTML = `<h2>Les lumières s’additionnent</h2><p>Sur une même zone de l’écran : rouge + vert = jaune ; vert + bleu = cyan ; rouge + bleu = magenta. Trois composantes de même intensité donnent un blanc, plus ou moins lumineux.</p><p>Les taches représentent la lumière diffusée par un écran blanc. Les intensités sont linéaires ; leur affichage est converti en sRGB. Déplacer une source change uniquement les zones de recouvrement.</p>`;
    return;
  }
  const object = COLORED_OBJECTS.find((candidate) => candidate.id === session.selectedObject)!;
  const diffused = diffuseLight(session.intensities, object.reflectance);
  const absorbed = absorbLight(session.intensities, object.reflectance);
  observation.innerHTML = `<h2>Objet ${object.name.toLowerCase()} : ${describeColor(diffused).toLowerCase()} sous cet éclairage</h2><p>Sa couleur de référence indique les composantes qu’il peut diffuser. Une composante absente de l’éclairage ne peut pas être diffusée. Si aucune lumière n’est diffusée, l’objet paraît noir.</p><table class="color-component-table"><caption>Composantes pour l’objet ${object.name.toLowerCase()} · intensités relatives</caption><thead><tr><th scope="col">Lumière</th><th scope="col">Reçue</th><th scope="col">Diffusée</th><th scope="col">Absorbée</th></tr></thead><tbody>${SOURCE_NAMES.map((name, index) => `<tr><th scope="row">${name}</th><td>${Math.round(session.intensities[index] * 100)} %</td><td>${Math.round(diffused[index] * 100)} %</td><td>${Math.round(absorbed[index] * 100)} %</td></tr>`).join('')}</tbody></table>`;
}

function sceneMarkup(compact: boolean): { markup: string; viewBox: string } {
  let viewBox = '0 0 1000 600';
  if (compact && session.experiment === 'mixing') {
    const xs = session.positions.map(([x]) => x);
    const ys = session.positions.map(([, y]) => y);
    const x = Math.min(...xs) - SPOT_RADIUS - 25;
    const y = Math.min(...ys) - SPOT_RADIUS - 100;
    const width = Math.max(...xs) - x + SPOT_RADIUS + 25;
    const height = Math.max(...ys) - y + SPOT_RADIUS + 25;
    viewBox = `${x} ${y} ${width} ${height}`;
  } else if (compact) viewBox = '0 0 500 970';
  const markup = `<title>${session.experiment === 'mixing' ? 'Superposition de lumières rouge, verte et bleue' : 'Objets colorés sous différents éclairages'}</title><rect x="-1000" y="-1000" width="3000" height="3000" fill="#090d12"/><g font-family="Arial, sans-serif">${session.experiment === 'mixing' ? renderMixing(compact) : renderObjects(compact)}</g>`;
  return { markup, viewBox };
}

let compactScene = scene.clientWidth < 620;
function render(): void {
  const activeIndex = session.experiment === 'mixing' ? 0 : 1;
  tabs.forEach((tab, index) => { tab.setAttribute('aria-selected', String(index === activeIndex)); tab.tabIndex = index === activeIndex ? 0 : -1; });
  element('experiment-panel').setAttribute('aria-labelledby', tabs[activeIndex].id);
  element('scene-heading').textContent = activeIndex === 0 ? 'Synthèse additive' : 'Diffusion sélective';
  element('scene-hint').textContent = activeIndex === 0
    ? 'Faites glisser les zones colorées. Au clavier : sélectionnez une zone avec Tab, puis utilisez les flèches.'
    : 'Sélectionnez un objet pour examiner les composantes reçues, diffusées et absorbées.';
  element('position-controls').hidden = activeIndex !== 0;
  session.intensities.forEach((intensity, index) => {
    element<HTMLInputElement>(`intensity-${index}`).value = String(Math.round(intensity * 100));
    element<HTMLOutputElement>(`value-${index}`).value = `${Math.round(intensity * 100)} %`;
  });
  const selectedPreset = Object.entries(PRESETS).find(([, channels]) => channels.every((value, index) => value === session.intensities[index]))?.[0] ?? 'custom';
  presetSelectors.forEach((selector) => { selector.value = selectedPreset; });
  element<HTMLInputElement>('show-explanations').checked = session.showExplanations;
  element<HTMLInputElement>('show-labels').checked = session.showLabels;
  const rendered = sceneMarkup(compactScene);
  const viewBox = drag?.viewBox ?? rendered.viewBox;
  scene.setAttribute('viewBox', viewBox);
  scene.style.aspectRatio = viewBox.split(' ').slice(2).join(' / ');
  scene.dataset.compact = String(compactScene);
  scene.innerHTML = rendered.markup;
  renderObservation();
  persistSession();
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => { session.experiment = index === 0 ? 'mixing' : 'objects'; render(); });
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index;
    tabs[next].click(); tabs[next].focus();
  });
});
SOURCE_NAMES.forEach((_, index) => element<HTMLInputElement>(`intensity-${index}`).addEventListener('input', (event) => {
  const channels = [...session.intensities] as [number, number, number];
  channels[index] = Number((event.target as HTMLInputElement).value) / 100;
  session.intensities = channels;
  render();
}));
presetSelectors.forEach((selector) => selector.addEventListener('change', (event) => {
  const preset = PRESETS[(event.target as HTMLSelectElement).value];
  if (preset) { session.intensities = preset; render(); }
}));
document.querySelectorAll<HTMLButtonElement>('[data-layout]').forEach((button) => button.addEventListener('click', () => {
  session.positions = [...LAYOUTS[button.dataset.layout!]]; render();
}));
element<HTMLInputElement>('show-explanations').addEventListener('change', (event) => { session.showExplanations = (event.target as HTMLInputElement).checked; render(); });
element<HTMLInputElement>('show-labels').addEventListener('change', (event) => { session.showLabels = (event.target as HTMLInputElement).checked; render(); });
element('reset-session').addEventListener('click', () => { Object.assign(session, defaultSession()); lastPointerSource = -1; render(); status.textContent = 'Les réglages initiaux sont rétablis.'; });

function moveSource(index: number, x: number, y: number): void {
  session.positions[index] = [Math.max(150, Math.min(850, x)), Math.max(195, Math.min(410, y))];
  render();
}

let drag: { index: number; pointerId: number; offset: Point; viewBox: string } | undefined;
let lastPointerSource = -1;
function scenePoint(event: PointerEvent): DOMPoint | undefined {
  const matrix = scene.getScreenCTM();
  return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : undefined;
}
scene.addEventListener('pointerdown', (event) => {
  const point = scenePoint(event);
  if (session.experiment !== 'mixing' || !point || event.button !== 0) return;
  const candidates = session.positions.map(([x, y], index) => ({ index, distance: Math.hypot(point.x - x, point.y - y) }))
    .filter(({ index, distance }) => session.intensities[index] > 0 && distance <= SPOT_RADIUS)
    .sort((first, second) => {
      // Dans un recouvrement, choisir le centre le plus proche. À égalité,
      // alterner les sources pour pouvoir séparer des taches alignées.
      if (Math.abs(first.distance - second.distance) > 0.001) return first.distance - second.distance;
      const priority = (index: number) => (index - lastPointerSource + 2) % 3;
      return priority(first.index) - priority(second.index);
    });
  if (candidates.length === 0) return;
  event.preventDefault();
  const index = candidates[0].index;
  lastPointerSource = index;
  drag = { index, pointerId: event.pointerId, offset: [point.x - session.positions[index][0], point.y - session.positions[index][1]], viewBox: scene.getAttribute('viewBox')! };
  scene.dataset.dragging = 'true';
  scene.setPointerCapture(event.pointerId);
});
scene.addEventListener('pointermove', (event) => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const point = scenePoint(event);
  if (point) moveSource(drag.index, point.x - drag.offset[0], point.y - drag.offset[1]);
});
function endDrag(event: PointerEvent): void {
  if (drag?.pointerId === event.pointerId) {
    drag = undefined; delete scene.dataset.dragging;
    if (scene.hasPointerCapture(event.pointerId)) scene.releasePointerCapture(event.pointerId);
    render();
  }
}
scene.addEventListener('pointerup', endDrag);
scene.addEventListener('pointercancel', endDrag);
scene.addEventListener('lostpointercapture', () => {
  if (drag) { drag = undefined; delete scene.dataset.dragging; render(); }
});
function selectObject(target: Element): void {
  const objectId = target.closest('[data-object]')?.getAttribute('data-object');
  if (!objectId) return;
  session.selectedObject = objectId; render();
  scene.querySelector<SVGElement>(`[data-object="${objectId}"]`)?.focus();
}
scene.addEventListener('click', (event) => selectObject(event.target as Element));
scene.addEventListener('keydown', (event) => {
  const target = event.target as Element;
  if (target.closest('[data-object]') && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); selectObject(target); return; }
  const source = target.closest('[data-source]');
  if (!source || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  const index = Number(source.getAttribute('data-source'));
  const [x, y] = session.positions[index];
  const step = event.shiftKey ? 30 : 10;
  moveSource(index, x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0), y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0));
  scene.querySelector<SVGElement>(`[data-source="${index}"]`)?.focus();
});

element('fullscreen-scene').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await element('scene-shell').requestFullscreen();
  } catch { status.textContent = 'Le plein écran est indisponible. Vous pouvez agrandir la fenêtre du navigateur.'; }
});
document.addEventListener('fullscreenchange', () => { element('fullscreen-scene').textContent = document.fullscreenElement ? 'Quitter le plein écran' : 'Plein écran'; });

function serializeScene(): string {
  const exported = scene.cloneNode(true) as SVGSVGElement;
  const canonical = sceneMarkup(false);
  exported.innerHTML = canonical.markup;
  exported.setAttribute('viewBox', canonical.viewBox);
  exported.removeAttribute('style');
  exported.removeAttribute('data-compact');
  exported.setAttribute('width', '1000'); exported.setAttribute('height', '600');
  exported.setAttribute('role', 'img');
  exported.querySelectorAll('[data-export-omit]').forEach((node) => node.remove());
  exported.querySelectorAll('[tabindex]').forEach((node) => { node.removeAttribute('tabindex'); node.removeAttribute('role'); node.removeAttribute('aria-pressed'); });
  const description = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
  description.textContent = 'Modèle idéal RVB, sans lumière ambiante ni fluorescence. Les objets diffusent ou absorbent chaque composante. Intensités linéaires converties en sRGB pour l’affichage.';
  exported.prepend(description);
  return new XMLSerializer().serializeToString(exported);
}

function download(blob: Blob, extension: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `schema-couleurs-${session.experiment}.${extension}`; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = `Schéma ${extension.toUpperCase()} exporté.`;
}

element('export-svg').addEventListener('click', () => download(new Blob([serializeScene()], { type: 'image/svg+xml;charset=utf-8' }), 'svg'));
element<HTMLButtonElement>('export-png').addEventListener('click', async () => {
  const button = element<HTMLButtonElement>('export-png');
  button.disabled = true;
  // Le canvas sert uniquement à rasteriser l'export ; la scène reste un SVG.
  const url = URL.createObjectURL(new Blob([serializeScene()], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = 2000; canvas.height = 1200;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('La conversion PNG est indisponible.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('La conversion PNG a échoué.');
    download(blob, 'png');
  } catch { status.textContent = 'L’export PNG a échoué. Essayez l’export SVG.'; }
  finally { URL.revokeObjectURL(url); button.disabled = false; }
});

render();
new ResizeObserver(() => {
  const compact = scene.clientWidth < 620;
  if (compact !== compactScene) { compactScene = compact; render(); }
}).observe(scene);
