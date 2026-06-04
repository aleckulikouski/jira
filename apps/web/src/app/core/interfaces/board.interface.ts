/** Data passed through the add-column flow at every layer */
export interface AddColumnData {
  projectId: string;
  name: string;
  afterColumnId?: string;
}
