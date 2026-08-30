import type { ResourceMetadata, ResourceModule } from './resource_metadata';

const resourceModules = import.meta.glob<ResourceModule>('./resources/**/resource.ts', {
  eager: true,
});

export const discoveredResources = Object.values(resourceModules)
  .map(({ resource }) => resource)
  .sort((firstResource, secondResource) => firstResource.title.localeCompare(secondResource.title, 'fr'));

export function findResourcesByKind(kind: ResourceMetadata['kind']): ResourceMetadata[] {
  return discoveredResources.filter((resource) => resource.kind === kind);
}
