// THROWAWAY: one development-only switcher shared by the three layouts.
export function mountPrototypeSwitcher(variants, onChange) {
  if (!import.meta.env.DEV) return;
  const bar = document.createElement('aside');
  bar.className = 'prototype-switcher';
  bar.setAttribute('aria-label', 'Comparer les variantes du prototype');
  document.body.append(bar);
  let current = new URL(location.href).searchParams.get('variant') || 'A';
  if (!variants.some((variant) => variant.key === current)) current = 'A';

  function selectVariant(key) {
    current = key;
    const url = new URL(location.href);
    url.searchParams.set('variant', key);
    history.replaceState(null, '', url);
    bar.innerHTML = `<span class="switcher-caption">PROTOTYPE</span>
      <button type="button" data-direction="-1" aria-label="Variante précédente">←</button>
      <div class="variant-options">${variants.map((variant) => `<button type="button" data-variant="${variant.key}" aria-pressed="${current === variant.key}"><span>${variant.key}</span> ${variant.name}</button>`).join('')}</div>
      <button type="button" data-direction="1" aria-label="Variante suivante">→</button>`;
    onChange(key);
  }
  function cycle(direction) {
    const index = variants.findIndex((variant) => variant.key === current);
    selectVariant(variants[(index + direction + variants.length) % variants.length].key);
  }
  bar.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button?.dataset.variant) selectVariant(button.dataset.variant);
    if (button?.dataset.direction) cycle(Number(button.dataset.direction));
  });
  document.addEventListener('keydown', (event) => {
    if (event.target.closest('input, textarea, select, [contenteditable], [role="slider"]')) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      cycle(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  selectVariant(current);
}
