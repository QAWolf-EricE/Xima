/**
 * Core TypeScript interfaces for the Xima CCAAS test automation suite
 */

// ============================================================================
// USER TYPES
// ============================================================================

export enum UserType {
  SUPERVISOR = 'supervisor',
  AGENT = 'agent',
  WEBRTC_AGENT = 'webrtc_agent',
  TEST_MANAGER = 'test_manager',
  PORTAL_ADMIN = 'portal_admin',
  PORTAL_SUPERVISOR = 'portal_supervisor',
  PORTAL_AGENT = 'portal_agent'
}

export interface UserCredentials {
  username: string;
  password: string;
  email?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  extension?: string;
  webphoneUsername?: string;
  isActive: boolean;
  skills: string[];
  channels: ChannelType[];
}

// ============================================================================
// CALL AND COMMUNICATION TYPES  
// ============================================================================

export enum CallStatus {
  PENDING = 'pending',
  RINGING = 'ringing', 
  CONNECTED = 'connected',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ChannelType {
  VOICE = 'VOICE',
  CHAT = 'CHAT', 
  EMAIL = 'EMAIL',
  SMS = 'SMS'
}

export enum AgentStatus {
  READY = 'Ready',
  NOT_READY = 'Not Ready',
  LUNCH = 'Lunch',
  DO_NOT_DISTURB = 'Do Not Disturb',
  OFFLINE = 'Offline'
}

export interface Call {
  id: string;
  status: CallStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  fromNumber: string;
  toNumber: string;
  skills: string[];
  agentId?: string;
  recordings: Recording[];
}

export interface WebChat {
  id: string;
  customerName: string;
  customerEmail: string;
  skill: string;
  status: 'queued' | 'active' | 'completed' | 'missed';
  messages: ChatMessage[];
  agentId?: string;
  startTime: Date;
  endTime?: Date;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'agent';
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
}

export interface Email {
  id: string;
  from: string;
  to: string;
  cc?: string[];
  subject: string;
  body: string;
  attachments: EmailAttachment[];
  skill: string;
  status: 'pending' | 'assigned' | 'completed';
  agentId?: string;
  receivedTime: Date;
  completedTime?: Date;
}

export interface EmailAttachment {
  name: string;
  size: number;
  mimeType: string;
  content?: Buffer;
}

// ============================================================================
// RECORDING AND MONITORING TYPES
// ============================================================================

export enum RecordingMode {
  DISABLED = 'Disabled',
  AUTOMATIC = 'Automatic', 
  ON_DEMAND = 'On Demand',
  COMPLIANCE = 'Compliance'
}

export interface Recording {
  id: string;
  callId: string;
  agentId: string;
  startTime: Date;
  duration: number;
  fileUrl: string;
  transcription?: string;
  mode: RecordingMode;
}

export interface CallMonitoring {
  id: string;
  supervisorId: string;
  agentId: string;
  callId: string;
  mode: 'listen' | 'whisper' | 'join';
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
}

// ============================================================================
// REPORTING TYPES
// ============================================================================

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  parameters: ReportParameters;
  createdBy: string;
  createdAt: Date;
  lastRun?: Date;
  schedule?: ReportSchedule;
  isPublic: boolean;
}

export enum ReportType {
  CRADLE_TO_GRAVE = 'cradle_to_grave',
  AGENT_PERFORMANCE = 'agent_performance',
  CALL_SUMMARY = 'call_summary',
  SKILL_SUMMARY = 'skill_summary',
  REAL_TIME = 'real_time'
}

export interface ReportParameters {
  dateRange: DateRange;
  agents?: string[];
  skills?: string[];
  channels?: ChannelType[];
  criteria?: ReportCriteria[];
  groupBy?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportCriteria {
  name: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  values: string[];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  timezone?: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  isActive: boolean;
}

// ============================================================================
// SKILLS AND CONFIGURATION TYPES
// ============================================================================

export interface Skill {
  id: string;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  agents: string[];
}

export interface Extension {
  number: string;
  userId?: string;
  type: 'sip' | 'webrtc';
  isRegistered: boolean;
  lastActivity?: Date;
}

export interface Handset {
  id: string;
  extension: string;
  username: string;
  protocol: 'TCP' | 'UDP';
  registrationStatus: 'registered' | 'unregistered' | 'failed';
  outboundProxy: string;
  pbxAddress: string;
}

// ============================================================================
// IVR AND ROUTING TYPES  
// ============================================================================

export interface IVRFlow {
  id: string;
  name: string;
  steps: IVRStep[];
  conditions: IVRCondition[];
  isActive: boolean;
}

export interface IVRStep {
  id: string;
  type: 'menu' | 'announcement' | 'collect_digits' | 'transfer' | 'hangup';
  prompt: string;
  options?: IVROption[];
  timeout?: number;
  retries?: number;
}

export interface IVROption {
  digit: string;
  action: 'transfer_to_skill' | 'transfer_to_agent' | 'goto_step' | 'hangup';
  target: string;
}

export interface IVRCondition {
  type: 'time_of_day' | 'day_of_week' | 'holiday' | 'parameter';
  operator: 'equals' | 'between' | 'contains';
  value: string | string[];
  action: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ============================================================================
// TEST CONFIGURATION TYPES
// ============================================================================

export interface TestEnvironment {
  name: string;
  baseUrl: string;
  apiEndpoints: Record<string, string>;
  credentials: Record<UserType, UserCredentials>;
  features: TestFeatures;
}

export interface TestFeatures {
  callGeneration: boolean;
  handsetManagement: boolean;
  recordingPlayback: boolean;
  realtimeReporting: boolean;
  ivrTesting: boolean;
}

export interface BrowserOptions {
  headless?: boolean;
  slowMo?: number;
  args?: string[];
  permissions?: string[];
  timezoneId?: string;
  viewport?: { width: number; height: number };
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

export interface TestState {
  id: string;
  environment: string;
  currentState: string;
  expectedState?: string;
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

export interface StateTransition {
  from: string;
  to: string;
  condition?: string;
  timeout?: number;
}
