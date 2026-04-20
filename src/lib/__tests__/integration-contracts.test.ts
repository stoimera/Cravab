import {
  createAppointmentSchema,
  registerSchema,
  vapiWebhookSchema,
} from '@/lib/schemas'

describe('integration contract validation', () => {
  test('rejects invalid registration payloads', () => {
    const result = registerSchema.safeParse({
      email: 'owner@example.com',
      password: 'secret123',
      confirmPassword: 'different-secret',
      name: 'Demo Co',
      firstName: 'Jane',
      lastName: 'Doe',
    })

    expect(result.success).toBe(false)
  })

  test('accepts valid vapi webhook payload shape', () => {
    const result = vapiWebhookSchema.safeParse({
      type: 'call.ended',
      call: {
        id: 'call_123',
        status: 'completed',
        direction: 'inbound',
        metadata: { tenantId: 'tenant-a' },
      },
      timestamp: new Date().toISOString(),
    })

    expect(result.success).toBe(true)
  })

  test('requires appointment title and created_by', () => {
    const result = createAppointmentSchema.safeParse({
      client_id: '34f7447b-85c5-4d37-aa0d-710dfe5ff273',
      service_id: null,
      title: '',
      description: null,
      starts_at: new Date().toISOString(),
      ends_at: new Date().toISOString(),
      duration_minutes: 60,
      status: 'scheduled',
      priority: 'normal',
      address: null,
      city: null,
      state: null,
      zip_code: null,
      coordinates: null,
      eta_minutes: null,
      notes: null,
      created_by: '',
    })

    expect(result.success).toBe(false)
  })
})
