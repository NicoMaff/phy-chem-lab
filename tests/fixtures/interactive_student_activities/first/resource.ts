import type { ResourceMetadata } from '../../../../src/resource_metadata';

export const resource: ResourceMetadata = {
  id: 'first-test-activity',
  title: 'Première activité de test',
  description: 'Ressource de test réservée à la sélection interactive.',
  kind: 'student-activity',
  pedagogicalModel: 'Aucun modèle pédagogique distribué',
  entryPoint: './index.html',
  standaloneExport: {
    source: '../../student_activities/standalone_test/index.html',
    requiresMathJax: false,
  },
};
