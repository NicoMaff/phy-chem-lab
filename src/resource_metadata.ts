export const RESOURCE_KINDS = ['teacher-module', 'student-activity'] as const;

export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export interface StandaloneExport {
  readonly source: string;
  readonly requiresMathJax: boolean;
}

export interface ResourceMetadata {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly kind: ResourceKind;
  readonly pedagogicalModel: string;
  readonly entryPoint: string;
  readonly standaloneExport?: StandaloneExport;
}

export interface ResourceModule {
  readonly resource: ResourceMetadata;
}
