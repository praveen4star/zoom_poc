import axios, { AxiosInstance } from 'axios';
import { generateRestApiToken } from './jwt-utils';

const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';

/**
 * Create a Zoom REST API client with JWT authentication
 */
function createZoomApiClient(): AxiosInstance {
  const token = generateRestApiToken();

  return axios.create({
    baseURL: ZOOM_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

export interface CreateSessionRequest {
  topic: string;
  type?: number; // 1 = instant session
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    audio_only?: boolean;
  };
}

export interface CreateSessionResponse {
  session_id: string;
  session_number: number;
  session_name: string;
  session_password: string;
  passcode: string;
  created_at: string;
  settings: {
    auto_recording: string;
  };
}

/**
 * Create a new video session using Zoom REST API
 */
export async function createVideoSession(
  request: CreateSessionRequest
): Promise<CreateSessionResponse> {
  const client = createZoomApiClient();

  const payload = {
    session_name: request.topic,
    settings: {
      auto_recording: 'cloud',
    },
  };

  try {
    const response = await client.post<CreateSessionResponse>(
      '/videosdk/sessions',
      payload
    );
    console.log(response.data);
    return response.data;
  } catch (error: any) {
    console.log(error);
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to create session: ${
          error.response?.data?.message || error.message
        }`
      );
    }
    throw error;
  }
}

/**
 * Get session details by ID
 */
export async function getSession(
  sessionId: string
): Promise<CreateSessionResponse> {
  const client = createZoomApiClient();

  try {
    const response = await client.get<CreateSessionResponse>(
      `/videosdk/sessions/${sessionId}`
    );
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to get session: ${
          error.response?.data?.message || error.message
        }`
      );
    }
    throw error;
  }
}

/**
 * Delete/end a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const client = createZoomApiClient();

  try {
    await client.delete(`/videosdk/sessions/${sessionId}`);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to delete session: ${
          error.response?.data?.message || error.message
        }`
      );
    }
    throw error;
  }
}
