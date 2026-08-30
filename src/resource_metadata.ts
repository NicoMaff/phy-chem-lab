export const RESOURCE_KINDS = ['teacher-module', 'student-activity'] as const;

export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export interface ResourceMetadata {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly kind: ResourceKind;
  readonly pedagogicalModel: string;
  readonly entryPoint: string;
}

export interface ResourceModule {
  readonly resource: ResourceMetadata;
}
