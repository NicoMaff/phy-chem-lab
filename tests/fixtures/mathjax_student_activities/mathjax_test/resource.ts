import type { ResourceMetadata } from '../../../../src/resource_metadata';

export const resource: ResourceMetadata = {
  id: 'mathjax-test-activity',
  title: 'Activité de test MathJax',
  description: 'Ressource de test réservée à la vérification de MathJax local.',
  kind: 'student-activity',
  pedagogicalModel: 'Aucun modèle pédagogique distribué',
  entryPoint: './index.html',
  standaloneExport: {
    source: './index.html',
    requiresMathJax: true,
  },
};
