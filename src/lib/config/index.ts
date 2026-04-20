import { logger } from '@/lib/logger'
// Centralized Configuration Management
// Main configuration export with validation and error handling

export { config, env, validateRequiredEnv, checkEnvironment } from './env'
export type { Config, Env } from './env'

// Re-export API configuration
export { API_CONFIG } from '../api-config'

// Configuration validation on import
import { checkEnvironment } from './env'

// Check environment on startup
if (typeof window === 'undefined') {
  // Only run on server side
  const envCheck = checkEnvironment()
  
  if (envCheck.warnings.length > 0) {
    logger.warn('⚠️  Environment Configuration Warnings:')
    envCheck.warnings.forEach(warning => logger.warn(`  - ${warning}`))
  }
  
  if (envCheck.info.length > 0) {
    logger.info('ℹ️  Environment Configuration Info:')
    envCheck.info.forEach(info => logger.info(`  - ${info}`))
  }
  
  if (!envCheck.isValid) {
    logger.error('❌ Environment Configuration Errors:')
    envCheck.issues.forEach(issue => logger.error(`  - ${issue}`))
  }
}
