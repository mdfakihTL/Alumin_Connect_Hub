// Re-export all API modules
export { apiClient, handleApiError } from './client';
export type { ApiError } from './client';

export { authApi } from './auth';
export { postsApi } from './posts';
export { eventsApi } from './events';
export { groupsApi } from './groups';
export { connectionsApi } from './connections';
export { messagesApi } from './messages';
export { supportApi } from './support';
export { notificationsApi } from './notifications';
export { usersApi } from './users';
export { universitiesApi } from './universities';
export { documentsApi } from './documents';
export { mentorsApi } from './mentors';
export { adminApi } from './admin';
export { superadminApi } from './superadmin';

// Re-export types
export * from './types';

