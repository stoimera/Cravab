import {
  canManageUsers,
  canReadTenantResource,
  canWriteTenantResource,
  isSameTenant,
} from '@/lib/security/tenant-access'

describe('tenant access security guards', () => {
  test('allows access only for same-tenant reads', () => {
    expect(isSameTenant('tenant-a', 'tenant-a')).toBe(true)
    expect(isSameTenant('tenant-a', 'tenant-b')).toBe(false)

    expect(
      canReadTenantResource({
        actorTenantId: 'tenant-a',
        targetTenantId: 'tenant-a',
        actorRole: 'worker',
      }),
    ).toBe(true)

    expect(
      canReadTenantResource({
        actorTenantId: 'tenant-a',
        targetTenantId: 'tenant-b',
        actorRole: 'admin',
      }),
    ).toBe(false)
  })

  test('enforces role boundaries for write operations', () => {
    expect(
      canWriteTenantResource({
        actorTenantId: 'tenant-a',
        targetTenantId: 'tenant-a',
        actorRole: 'admin',
      }),
    ).toBe(true)

    expect(
      canWriteTenantResource({
        actorTenantId: 'tenant-a',
        targetTenantId: 'tenant-a',
        actorRole: 'viewer',
      }),
    ).toBe(false)

    expect(
      canWriteTenantResource({
        actorTenantId: 'tenant-a',
        targetTenantId: 'tenant-b',
        actorRole: 'manager',
      }),
    ).toBe(false)
  })

  test('limits user-management operations to admin and manager', () => {
    expect(canManageUsers('admin')).toBe(true)
    expect(canManageUsers('manager')).toBe(true)
    expect(canManageUsers('worker')).toBe(false)
    expect(canManageUsers('viewer')).toBe(false)
  })
})
