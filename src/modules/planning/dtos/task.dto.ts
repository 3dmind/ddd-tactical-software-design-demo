export interface TaskDto {
  readonly archivedAt: string;
  readonly createdAt: string;
  readonly description: string;
  readonly discardedAt: string;
  readonly editedAt: string;
  readonly id: string;
  readonly isArchived: boolean;
  readonly isDiscarded: boolean;
  readonly isTickedOff: boolean;
  readonly resumedAt: string;
  readonly tickedOffAt: string;
}
