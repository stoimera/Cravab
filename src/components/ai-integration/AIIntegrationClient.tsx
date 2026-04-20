'use client';

import { VapiIntegrationClient } from './VapiIntegrationClient';

interface AIIntegrationClientProps {
  tenantId: string;
}

export function AIIntegrationClient({ tenantId }: AIIntegrationClientProps) {
  return <VapiIntegrationClient tenantId={tenantId} />;
}