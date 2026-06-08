export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
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

export interface CreateProjectData {
  name: string;
}

export interface BoardColumn {
  id: string;
  projectId: string;
  name: string;
  order: number;
  tickets?: Ticket[];
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

export type {
  ColumnCreatedPayload,
  ColumnUpdatedPayload,
  ColumnDeletedPayload,
  TicketCreatedPayload,
  TicketUpdatedPayload,
  TicketDeletedPayload,
  ColumnsReorderedPayload,
  DomainEvents,
} from './lib/domain-events.js';

export type {
  ServerToClientEvents,
  ClientToServerEvents,
} from './lib/socket-events.js';
