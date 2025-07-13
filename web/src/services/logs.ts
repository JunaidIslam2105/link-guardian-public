import api, { ApiResponse } from './api';

// Access log interfaces
export interface AccessLog {
  id: number;
  link_id: number;
  accessed_at: string;
  ip_address: string;
  user_agent: string;
  referer?: string;
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
}

// Log service class
class LogService {  /**
   * Get access logs with optional filtering
   * @param linkId - Optional link ID to filter logs by
   * @param limit - Optional limit for number of logs to return
   * @returns Promise with array of access logs
   */
  async getLogs(linkId?: string, limit?: number): Promise<AccessLog[]> {
    try {
      const params: Record<string, string> = {};
      if (linkId) params.link_id = linkId;
      if (limit) params.limit = limit.toString();

      const response = await api.get<{ logs: AccessLog[], message: string, count: number }>('/logs', { params });
      return response.data.logs || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch access logs';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get access logs for a specific user
   * @param userID - User ID to fetch logs for
   * @param limit - Optional limit for number of logs to return
   * @returns Promise with array of access logs
   */
  async getLogsByUser(userID: string, limit?: number): Promise<AccessLog[]> {
    try {
      const params: Record<string, string> = { user_id: userID };
      if (limit) params.limit = limit.toString();

      const response = await api.get<{ logs: AccessLog[], message: string, count: number }>('/logs/user', { params });
      return response.data.logs || [];
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch user access logs';
      throw new Error(errorMessage);
    }
  }
}

// Create and export a singleton instance
const logService = new LogService();
export default logService;
