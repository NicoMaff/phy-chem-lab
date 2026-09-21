import type { ResourceMetadata } from '../../../../src/resource_metadata';

export const resource: ResourceMetadata = {
  id: 'external-svg-test-activity',
  title: 'Activité avec image SVG externe',
  description: 'Ressource de test réservée au refus des images SVG externes.',
  kind: 'student-activity',
  pedagogicalModel: 'Aucun modèle pédagogique distribué',
  entryPoint: './index.html',
  standaloneExport: {
    source: './index.html',
    requiresMathJax: false,
  },
};
