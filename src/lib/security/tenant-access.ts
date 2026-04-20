export type UserRole = 'admin' | 'manager' | 'worker' | 'viewer'

export interface AccessContext {
  actorTenantId: string
  targetTenantId: string
  actorRole: UserRole
}

export function isSameTenant(actorTenantId: string, targetTenantId: string): boolean {
  return actorTenantId.trim() !== '' && actorTenantId === targetTenantId
}

export function canReadTenantResource(context: AccessContext): boolean {
  return isSameTenant(context.actorTenantId, context.targetTenantId)
}

export function canWriteTenantResource(context: AccessContext): boolean {
  if (!isSameTenant(context.actorTenantId, context.targetTenantId)) return false
  return context.actorRole === 'admin' || context.actorRole === 'manager' || context.actorRole === 'worker'
}

export function canManageUsers(actorRole: UserRole): boolean {
  return actorRole === 'admin' || actorRole === 'manager'
}
