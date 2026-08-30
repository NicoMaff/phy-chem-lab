import type { ResourceKind, ResourceMetadata } from './resource_metadata';

const EMPTY_CATALOG_MESSAGES: Record<ResourceKind, string> = {
  'teacher-module': 'Aucun module enseignant n’est encore disponible.',
  'student-activity': 'Aucune activité élève n’est encore disponible.',
};

function createResourceCard(resource: ResourceMetadata): HTMLElement {
  const card = document.createElement('article');
  const heading = document.createElement('h2');
  const link = document.createElement('a');
  const description = document.createElement('p');
  const model = document.createElement('p');

  link.href = resource.entryPoint;
  link.textContent = resource.title;
  heading.append(link);
  description.textContent = resource.description;
  model.className = 'pedagogical-model';
  model.textContent = `Modèle pédagogique : ${resource.pedagogicalModel}`;
  card.append(heading, description, model);

  return card;
}

export function renderCatalog(container: HTMLElement, resources: ResourceMetadata[], kind: ResourceKind): void {
  if (resources.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'empty-catalog';
    emptyMessage.textContent = EMPTY_CATALOG_MESSAGES[kind];
    container.replaceChildren(emptyMessage);
    return;
  }

  container.replaceChildren(...resources.map(createResourceCard));
}
