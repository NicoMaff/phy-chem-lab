import type { ResourceMetadata } from '../../../../src/resource_metadata';

export const resource: ResourceMetadata = {
  id: 'external-style-test-activity',
  title: 'Activité avec style externe',
  description: 'Ressource de test réservée au refus des styles externes.',
  kind: 'student-activity',
  pedagogicalModel: 'Aucun modèle pédagogique distribué',
  entryPoint: './index.html',
  standaloneExport: {
    source: './index.html',
    requiresMathJax: false,
  },
};
