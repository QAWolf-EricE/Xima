/**
 * Application constants for Xima CCAAS test automation
 * Centralized configuration values and environment-specific settings
 */

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging', 
  PRODUCTION: 'production',
  QA: 'qa'
} as const;

export const DEFAULT_URLS = {
  STAGING: 'https://dev-bwhit.chronicallcloud-staging.com',
  PRODUCTION: 'https://app.ximasoftware.com',
  PORTAL: process.env.PORTAL_URL || '',
  WEBPHONE: 'https://voice.ximasoftware.com/webphone'
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  CALL_GENERATION: 'https://livecallgeneration.ximasoftware.com',
  STATE_MANAGEMENT: 'https://qawolf-automation.herokuapp.com/apis/statemachine',
  HANDSET_MANAGEMENT: 'https://dev-bwhit.chronicallcloud-staging.com/rest/test-api',
  CLEANUP_FAILURE: 'https://qawolf-automation.herokuapp.com/apis/cleanup-fail',
  STAGGER: 'https://qawolf-automation.herokuapp.com/stagger'
} as const;

// ============================================================================
// TIMEOUT CONFIGURATIONS (in milliseconds)
// ============================================================================

export const TIMEOUTS = {
  PAGE_LOAD: 30000,
  ELEMENT_WAIT: 10000,
  API_REQUEST: 30000,
  CALL_COMPLETION: 120000,
  STAGGER_MAX: 300000,
  LOGIN_REDIRECT: 15000,
  CHAT_OFFER: 30000,
  EMAIL_DELIVERY: 60000,
  REPORT_GENERATION: 120000
} as const;

export const POLLING = {
  STATE_CHECK_INTERVAL: 10000,
  CALL_STATUS_INTERVAL: 5000,
  MAX_POLL_ATTEMPTS: 24,
  SHORT_POLL_INTERVAL: 1000
} as const;

// ============================================================================
// USER ACCOUNT CONFIGURATIONS
// ============================================================================

export const DEFAULT_CREDENTIALS = {
  SUPERVISOR: {
    username: () => process.env.SUPERVISOR_USERNAME || '',
    password: () => process.env.SUPERVISOR_PASSWORD || ''
  },
  AGENT_1: {
    username: () => process.env.UC_AGENT_10_EXT_110 || '',
    password: () => process.env.UC_AGENT_10_EXT_110_PASSWORD || ''
  },
  AGENT_2: {
    username: () => process.env.UC_AGENT_20_EXT_120 || '',
    password: () => process.env.UC_AGENT_20_EXT_120_PASSWORD || ''
  },
  WEBRTC_AGENT_1: {
    username: () => process.env.WEBRTCAGENT_3_EMAIL || '',
    password: () => process.env.WEBRTC_PASSWORD || ''
  },
  TEST_MANAGER: {
    username: () => process.env.XIMA_AGENT_2_EMAIL || '',
    password: () => process.env.XIMA_AGENT_2_PASSWORD || ''
  },
  PORTAL_ADMIN: {
    username: () => process.env.PORTAL_ADMIN_EMAIL || '',
    password: () => process.env.PORTAL_DEFAULT_PASSWORD || ''
  }
} as const;

// ============================================================================
// PHONE NUMBERS AND EXTENSIONS
// ============================================================================

export const PHONE_NUMBERS = {
  AUTO_ATTENDANT: '4352005133',
  WEBRTC_DIRECT: '4352285495',
  BACKUP_NUMBER: '8016575831'
} as const;

export const TEST_EXTENSIONS = {
  UC_AGENT_102: '102',
  UC_AGENT_501: '501',
  WEBRTC_120: '120',
  WEBRTC_110: '110'
} as const;

// ============================================================================
// SKILL CONFIGURATIONS
// ============================================================================

export const TEST_SKILLS = {
  SKILL_2: 'Skill 2',
  SKILL_11: 'Skill 11', 
  SKILL_30: 'Skill 30',
  STANDARD_PARAM_SKILL: 'Standard Parameter Condition Skill',
  SIP_PARAM_SKILL: 'SIP Parameter Condition Skill',
  COLLECT_DIGITS_SKILL: 'Collect Digits'
} as const;

// ============================================================================
// CHANNEL CONFIGURATIONS
// ============================================================================

export const CHANNELS = {
  VOICE: 'VOICE',
  CHAT: 'CHAT',
  EMAIL: 'EMAIL',
  SMS: 'SMS'
} as const;

export const AGENT_STATUSES = {
  READY: 'Ready',
  NOT_READY: 'Not Ready', 
  LUNCH: 'Lunch',
  DO_NOT_DISTURB: 'Do Not Disturb',
  OFFLINE: 'Offline'
} as const;

// ============================================================================
// RECORDING CONFIGURATIONS
// ============================================================================

export const RECORDING_MODES = {
  DISABLED: 'Disabled',
  AUTOMATIC: 'Automatic',
  ON_DEMAND: 'On Demand', 
  COMPLIANCE: 'Compliance'
} as const;

// ============================================================================
// REPORT CONFIGURATIONS
// ============================================================================

export const REPORT_TYPES = {
  CRADLE_TO_GRAVE: 'Cradle to Grave',
  AGENT_PERFORMANCE: 'Agent Performance',
  CALL_SUMMARY: 'Call Summary',
  SKILL_SUMMARY: 'Skill Summary',
  REAL_TIME: 'Real Time'
} as const;

export const REPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv'
} as const;

// ============================================================================
// EMAIL TEST CONFIGURATIONS
// ============================================================================

export const TEST_EMAIL_ADDRESSES = {
  VERIFY_SCHEDULES: 'xima+verifyschedules1@qawolf.email',
  AGENT_67: () => process.env.WEBRTCAGENT_67_EMAIL || '',
  AGENT_3: () => process.env.WEBRTCAGENT_3_EMAIL || '',
  AGENT_20: () => process.env.WEBRTCAGENT_20_EMAIL || ''
} as const;

// ============================================================================
// CHAT TEST CONFIGURATIONS  
// ============================================================================

export const CHAT_BLOG_URLS = {
  SKILL_2: 'https://chattestxima.blogspot.com/2022/11/qa-wolf-skill-2.html',
  SKILL_30: 'https://chattestxima.blogspot.com/2024/10/qa-wolf-skill-30.html'
} as const;

// ============================================================================
// BROWSER CONFIGURATIONS
// ============================================================================

export const BROWSER_OPTIONS = {
  DEFAULT_ARGS: [
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream'
  ],
  DEFAULT_PERMISSIONS: [
    'camera',
    'clipboard-read', 
    'clipboard-write',
    'microphone'
  ],
  DEFAULT_TIMEZONE: 'America/Denver',
  DEFAULT_VIEWPORT: { width: 1920, height: 1080 }
} as const;

// ============================================================================
// TWILIO CONFIGURATIONS
// ============================================================================

export const TWILIO_CONFIG = {
  BASE_URLS: {
    PRIMARY_IVR: 'https://xima-primary-ivr-9108.twil.io',
    IN_HOURS_IVR: 'https://xima-in-hours-ivr-5651.twil.io',
    SET_PARAM_IVR: 'https://xima-set-parameter-ivr-6543.twil.io',
    STANDARD_IVR: 'https://xima-ivr-9663.twil.io'
  },
  CALL_TIMEOUT: 120,
  TRANSCRIPTION_DELAY: 30000
} as const;

// ============================================================================
// HANDSET CONFIGURATIONS
// ============================================================================

export const HANDSET_CONFIG = {
  EXTENSION_102: {
    username: 'ximatest+101@ximasoftware.com',
    password: 'P@ssw0rd',
    outboundProxy: 'SIP20.ringcentral.com',
    outboundProxyPort: 5090,
    protocol: 'TCP',
    extension: '102',
    authName: '802533505027',
    pbxAddress: 'sip.ringcentral.com',
    pbxSipPort: 5060
  },
  EXTENSION_501: {
    username: '18013004043',
    password: 'SbGJbPX',
    outboundProxy: 'SIP20.ringcentral.com', 
    outboundProxyPort: 5090,
    protocol: 'TCP',
    extension: '501',
    authName: 802817884026,
    pbxAddress: 'sip.ringcentral.com',
    pbxSipPort: 5060
  }
} as const;

// ============================================================================
// CSS SELECTORS (Common)
// ============================================================================

export const SELECTORS = {
  LOADING_SPINNER: 'xima-loading',
  ERROR_MESSAGE: '.error-message, .login-error',
  CONFIRMATION_DIALOG: '[data-cy="confirmation-dialog-okay-button"]',
  CLOSE_BUTTON: 'button[data-unit="close"]',
  APPLY_BUTTON: '[data-cy*="apply"], button:has-text("Apply")',
  CANCEL_BUTTON: 'button:has-text("Cancel")',
  OK_BUTTON: 'button:has-text("Ok")'
} as const;

// ============================================================================
// TEST DATA PATTERNS
// ============================================================================

export const TEST_DATA_PATTERNS = {
  REPORT_NAME_PREFIX: 'QA_Test_Report_',
  SCHEDULE_NAME_PREFIX: 'Testing Add Report',
  WALLBOARD_NAME_PREFIX: 'Test Wallboard_',
  CUSTOMER_EMAIL_DOMAIN: '@qawolf.email'
} as const;

// ============================================================================
// CLEANUP CONFIGURATIONS
// ============================================================================

export const CLEANUP_CONFIG = {
  MAX_CLEANUP_ATTEMPTS: 5,
  CLEANUP_TIMEOUT: 15000,
  MAX_CHAT_CLEANUP: 5,
  MAX_EMAIL_CLEANUP: 10
} as const;

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\d{10}$/,
  EXTENSION: /^\d{3,4}$/,
  TIME_FORMAT: /^(\d{1,2}):(\d{2}):(\d{2})\s?(AM|PM)$/i
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  LOGIN_FAILED: 'Login failed - check credentials',
  PAGE_LOAD_TIMEOUT: 'Page failed to load within timeout',
  ELEMENT_NOT_FOUND: 'Required element not found on page',
  API_REQUEST_FAILED: 'API request failed',
  CALL_CREATION_FAILED: 'Failed to create call',
  INVALID_RESPONSE: 'Invalid response received from server'
} as const;
