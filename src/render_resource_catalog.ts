import './styles.css';
import { findResourcesByKind } from './discover_resources';
import { renderCatalog } from './render_catalog';
import type { ResourceKind } from './resource_metadata';

export function renderResourceCatalog(kind: ResourceKind): void {
  const catalogContainer = document.querySelector<HTMLElement>('#resource-catalog');

  if (catalogContainer === null) {
    throw new Error('Resource catalog container is missing.');
  }

  renderCatalog(catalogContainer, findResourcesByKind(kind), kind);
}
