import type { ResourceMetadata } from '../../../../src/resource_metadata';

export const resource: ResourceMetadata = {
  id: 'standalone-test-activity',
  title: 'Activité de test autonome',
  description: 'Ressource de test réservée à la vérification des exports autonomes.',
  kind: 'student-activity',
  pedagogicalModel: 'Aucun modèle pédagogique distribué',
  entryPoint: './index.html',
  standaloneExport: {
    source: './index.html',
    requiresMathJax: false,
  },
};
