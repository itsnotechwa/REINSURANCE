/**
 * API Client for Reinsurance Application
 * Connects to Flask backend with cookie-based authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an authenticated request
   */
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Important: include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return {};
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ============================================
  // Authentication endpoints
  // ============================================

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserProfile() {
    return this.request('/auth/profile', {
      method: 'GET',
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // ============================================
  // Claims endpoints
  // ============================================

  async uploadClaim(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}/claim/upload`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return {};
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  }

  async getClaims(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    const endpoint = `/claim/claims${query ? `?${query}` : ''}`;

    return this.request(endpoint, {
      method: 'GET',
    });
  }

  async getClaim(claimId: number) {
    return this.request(`/claim/claims/${claimId}`, {
      method: 'GET',
    });
  }

  async updateClaimStatus(claimId: number, status: string) {
    return this.request(`/claim/claims/${claimId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteClaim(claimId: number) {
    return this.request(`/claim/claims/${claimId}`, {
      method: 'DELETE',
    });
  }

  async getPrediction(claimId: number) {
    return this.request(`/claim/predictions/${claimId}`, {
      method: 'GET',
    });
  }

  // ============================================
  // Reports endpoints
  // ============================================

  async getClaimsReport(params?: {
    start_date?: string;
    end_date?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    const endpoint = `/claim/report${query ? `?${query}` : ''}`;

    return this.request(endpoint, {
      method: 'GET',
    });
  }

  async getFraudTrends(params?: {
    group_by?: string;
    start_date?: string;
    end_date?: string;
  }) {
    // This endpoint would need to be implemented in the backend
    // For now, return mock data
    return {
      trends: [
        { range: '$0-$5,000', fraud_count: 2, total_count: 45 },
        { range: '$5,001-$10,000', fraud_count: 3, total_count: 38 },
        { range: '$10,001-$50,000', fraud_count: 4, total_count: 32 },
        { range: '$50,001-$100,000', fraud_count: 2, total_count: 10 },
        { range: '$100,001+', fraud_count: 1, total_count: 2 },
      ],
    };
  }

  // ============================================
  // Model endpoints
  // ============================================

  async getModels() {
    return this.request('/ml/model-stats', {
      method: 'GET',
    });
  }

  async getModel(modelName: string) {
    // This would need backend implementation
    return this.getModels().then((models) =>
      models.find((m: any) => m.model_name === modelName)
    );
  }

  async retrainModel(data: { model_name: string; model_type: string }) {
    const endpoint =
      data.model_type === 'fraud' ? '/ml/train-fraud' : '/ml/train-reserve';
    return this.request(endpoint, {
      method: 'POST',
    });
  }

  // ============================================
  // Admin endpoints
  // ============================================

  async getUsers() {
    return this.request('/auth/users', {
      method: 'GET',
    });
  }

  async getUser(userId: number) {
    return this.request(`/auth/users/${userId}`, {
      method: 'GET',
    });
  }

  async updateUser(userId: number, data: {
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    password?: string;
  }) {
    return this.request(`/auth/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: number) {
    return this.request(`/auth/users/${userId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
