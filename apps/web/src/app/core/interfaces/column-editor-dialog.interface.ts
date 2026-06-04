import type { BoardColumn } from '@org/shared-types';

/** Data passed to the column editor dialog */
export interface ColumnEditorDialogData {
  column?: BoardColumn;
  afterColumnId?: string;
}

/** Result returned when the column editor dialog closes */
export interface ColumnEditorDialogResult {
  id?: string;
  name: string;
  afterColumnId?: string;
}
