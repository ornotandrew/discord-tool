/**
 * Shared types for Discord Tool client↔server communication
 */

// ============================================================================
// Audio Queue
// ============================================================================

export interface AudioQueueItem {
  id: string;
  type: 'file' | 'tts';
  path?: string;      // for file type
  text?: string;      // for tts type
  voice?: string;     // for tts type
}

// ============================================================================
// Config
// ============================================================================

export interface Config {
  botToken: string;
  guilds?: Record<string, string>;
  defaultTtsVoice?: string;
}

// ============================================================================
// Client Requests (Discriminated Union)
// ============================================================================

export type ClientRequest =
  | StatusRequest
  | QueueRequest
  | PlayRequest
  | TtsRequest
  | SkipRequest
  | PauseRequest
  | ResumeRequest
  | ClearRequest
  | GuildChannelsRequest
  | LeaveRequest;

export interface StatusRequest {
  type: 'status';
}

export interface QueueRequest {
  type: 'queue';
}

export interface PlayRequest {
  type: 'play';
  file: string;
}

export interface TtsRequest {
  type: 'tts';
  text: string;
  voice?: string;
}

export interface SkipRequest {
  type: 'skip';
}

export interface PauseRequest {
  type: 'pause';
}

export interface ResumeRequest {
  type: 'resume';
}

export interface ClearRequest {
  type: 'clear';
}

export interface GuildChannelsRequest {
  type: 'guild-channels';
}

export interface LeaveRequest {
  type: 'leave';
}

// ============================================================================
// Server Responses (Discriminated Union)
// ============================================================================

export type ServerResponse =
  | StatusResponse
  | QueueResponse
  | PlayResponse
  | TtsResponse
  | SkipResponse
  | PauseResponse
  | ResumeResponse
  | ClearResponse
  | GuildChannelsResponse
  | LeaveResponse
  | ErrorResponse;

// StatusResponse <- StatusRequest
export interface StatusResponse {
  type: 'status';
  connected: boolean;
  guild?: {
    id: string | null;
    name: string | null;
  };
  channel?: {
    id: string | null;
    name: string | null;
  };
  currentTrack: AudioQueueItem | null;
  queueLength: number;
  paused: boolean;
}

// QueueResponse <- QueueRequest
export interface QueueResponse {
  type: 'queue';
  queue: AudioQueueItem[];
}

// PlayResponse <- PlayRequest
export interface PlayResponse {
  type: 'play';
  success: boolean;
  message: string;
  item: AudioQueueItem;
}

// TtsResponse <- TtsRequest
export interface TtsResponse {
  type: 'tts';
  success: boolean;
  message: string;
  item: AudioQueueItem;
}

// SkipResponse <- SkipRequest
export interface SkipResponse {
  type: 'skip';
  success: boolean;
  message: string;
}

// PauseResponse <- PauseRequest
export interface PauseResponse {
  type: 'pause';
  success: boolean;
  message: string;
}

// ResumeResponse <- ResumeRequest
export interface ResumeResponse {
  type: 'resume';
  success: boolean;
  message: string;
}

// ClearResponse <- ClearRequest
export interface ClearResponse {
  type: 'clear';
  success: boolean;
  message: string;
}

// GuildChannelsResponse <- GuildChannelsRequest
export interface GuildChannelsResponse {
  type: 'guild-channels';
  channels: GuildChannel[];
}

export interface GuildChannel {
  id: string;
  name: string;
  users: ChannelUser[];
}

export interface ChannelUser {
  id: string;
  username: string;
  nick: string | null;
}

// LeaveResponse <- LeaveRequest
export interface LeaveResponse {
  type: 'leave';
  success: boolean;
  message: string;
}

// ErrorResponse (for any request that fails)
export interface ErrorResponse {
  type: 'error';
  error: string;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isClientRequest(obj: unknown): obj is ClientRequest {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    typeof (obj as { type: unknown }).type === 'string'
  );
}

export function isServerResponse(obj: unknown): obj is ServerResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    typeof (obj as { type: unknown }).type === 'string'
  );
}