export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardColumn {
  id: string;
  projectId: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  columnId: string;
  assigneeId: string | null;
  title: string;
  description: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}
