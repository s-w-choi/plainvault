export const ROLES = ['ADMIN', 'DEVELOPER', 'VIEWER'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const API_KEY_STATUSES = ['ACTIVE', 'REVOKED'] as const;
export type ApiKeyStatus = (typeof API_KEY_STATUSES)[number];

export function isValidRole(value: unknown): value is Role {
  return typeof value === 'string' && ROLES.includes(value as Role);
}

export function isValidUserStatus(value: unknown): value is UserStatus {
  return typeof value === 'string' && USER_STATUSES.includes(value as UserStatus);
}
