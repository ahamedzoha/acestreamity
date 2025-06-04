import { StreamApiResponse, StreamStats } from '../interfaces';

const API_BASE_URL = '/api';

export const streamApi = {
  async startStream(aceId: string): Promise<StreamApiResponse> {
    const cleanId = aceId.replace('acestream://', '');

    // Validate Ace Stream ID format (40 hex characters)
    if (cleanId.length !== 40 || !/^[a-f0-9]+$/i.test(cleanId)) {
      throw new Error(
        'Invalid Ace Stream ID format. Must be 40 hexadecimal characters.'
      );
    }

    const response = await fetch(`${API_BASE_URL}/streams/start/${cleanId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to start stream');
    }

    return data;
  },

  async stopStream(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/streams/stop/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to stop stream');
    }
  },

  async getStreamStatus(
    sessionId: string
  ): Promise<{ success: boolean; stats?: StreamStats }> {
    const response = await fetch(`${API_BASE_URL}/streams/status/${sessionId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch stream status');
    }

    return await response.json();
  },

  async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    services?: { aceStream?: { status: string } };
  }> {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error('Backend API is not responding');
    }

    return await response.json();
  },
};
