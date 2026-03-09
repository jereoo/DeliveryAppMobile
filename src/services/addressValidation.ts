// ENFORCED BY CIO DIRECTIVE – CORRECT DIRECTORY – NOV 20 2025
/**
 * Address Validation Service for React Native Mobile App
 * Integrates with Django address validation API endpoints
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AddressValidationRequest {
  address: string;
  country_hint?: 'US' | 'CA';
}

export interface AddressValidationResponse {
  id: number;
  original_address: string;
  street_number?: string;
  street_name?: string;
  street_type?: string;
  unit?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  normalized_address?: string;
  validation_status: 'pending' | 'valid' | 'partial' | 'invalid';
  validation_source: string;
  confidence_score: number;
  latitude?: number;
  longitude?: number;
  formatted_address: string;
  is_valid: boolean;
  created_at: string;
}

export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface ValidationStatistics {
  total: number;
  valid: number;
  invalid: number;
  partial: number;
  pending: number;
  valid_percentage: number;
  success_rate: number;
}

class AddressValidationService {
  private baseUrl: string;
  private apiToken: string | null = null;

  constructor(baseUrl: string = process.env.BACKEND_URL || 'http://localhost:8000/api') {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  private async loadToken(): Promise<void> {
    try {
      this.apiToken = await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.apiToken) {
      await this.loadToken();
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': this.apiToken ? `Bearer ${this.apiToken}` : '',
    };
  }

  /**
   * Validate a full address using the Django backend
   */
  async validateAddress(request: AddressValidationRequest): Promise<AddressValidationResponse> {
    try {
      const headers = await this.getAuthHeaders();

      if (!this.apiToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseUrl}/address-validation/validate/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          address: request.address,
          country_hint: request.country_hint || 'US',
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }

        const errorData = await response.json();
        throw new Error(errorData.error || `Validation failed: ${response.status}`);
      }

      const data: AddressValidationResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Address validation error:', error);
      throw error;
    }
  }

  /**
   * Get validation statistics from the backend
   */
  async getValidationStatistics(): Promise<ValidationStatistics> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/address-validation/statistics/`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Statistics request failed: ${response.status}`);
      }

      const data: ValidationStatistics = await response.json();
      return data;
    } catch (error) {
      console.error('Statistics fetch error:', error);
      throw error;
    }
  }

  /**
   * Get list of validated addresses
   */
  async getValidatedAddresses(page: number = 1): Promise<{ results: AddressValidationResponse[], count: number }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}/address-validation/validated-addresses/?page=${page}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Address list request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Address list fetch error:', error);
      throw error;
    }
  }

  /**
   * Validate address and get confidence badge info
   */
  async validateAddressWithBadge(address: string, countryHint?: 'US' | 'CA'): Promise<{
    result: AddressValidationResponse;
    badge: {
      icon: '✓' | '⚠' | '✗';
      text: string;
      color: string;
      confidence: string;
    };
  }> {
    const result = await this.validateAddress({ address, country_hint: countryHint });

    let badge;
    switch (result.validation_status) {
      case 'valid':
        badge = {
          icon: '✓' as const,
          text: 'Valid Address',
          color: '#10B981', // green-500
          confidence: `${Math.round(result.confidence_score * 100)}% confidence`,
        };
        break;
      case 'partial':
        badge = {
          icon: '⚠' as const,
          text: 'Partial Match',
          color: '#F59E0B', // amber-500
          confidence: `${Math.round(result.confidence_score * 100)}% confidence`,
        };
        break;
      case 'invalid':
        badge = {
          icon: '✗' as const,
          text: 'Invalid Address',
          color: '#EF4444', // red-500
          confidence: `${Math.round(result.confidence_score * 100)}% confidence`,
        };
        break;
      default:
        badge = {
          icon: '⚠' as const,
          text: 'Pending Validation',
          color: '#6B7280', // gray-500
          confidence: 'Processing...',
        };
    }

    return { result, badge };
  }

  /**
   * Format address for display
   */
  formatAddressForDisplay(address: AddressValidationResponse): string {
    if (address.formatted_address) {
      return address.formatted_address;
    }

    // Build formatted address from components
    const parts: string[] = [];

    if (address.street_number && address.street_name) {
      parts.push(`${address.street_number} ${address.street_name}`);
      if (address.street_type) {
        parts[0] += ` ${address.street_type}`;
      }
    }

    if (address.unit) {
      parts[0] = parts[0] ? `${parts[0]}, Unit ${address.unit}` : `Unit ${address.unit}`;
    }

    if (address.city) {
      parts.push(address.city);
    }

    if (address.state_province) {
      parts.push(address.state_province);
    }

    if (address.postal_code) {
      parts.push(address.postal_code);
    }

    return parts.length > 0 ? parts.join(', ') : address.original_address;
  }

  /**
   * Check if address validation is available (user is authenticated)
   */
  async isValidationAvailable(): Promise<boolean> {
    await this.loadToken();
    return this.apiToken !== null;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<void> {
    await this.loadToken();
  }
}

// Singleton instance
export const addressValidationService = new AddressValidationService();

// Utility functions
export const getValidationBadgeColor = (status: string): string => {
  switch (status) {
    case 'valid': return '#10B981';
    case 'partial': return '#F59E0B';
    case 'invalid': return '#EF4444';
    default: return '#6B7280';
  }
};

export const getValidationBadgeIcon = (status: string): string => {
  switch (status) {
    case 'valid': return '✓';
    case 'partial': return '⚠';
    case 'invalid': return '✗';
    default: return '○';
  }
};

export const getValidationBadgeText = (status: string): string => {
  switch (status) {
    case 'valid': return 'Valid Address';
    case 'partial': return 'Partial Match';
    case 'invalid': return 'Invalid Address';
    case 'pending': return 'Validating...';
    default: return 'Unknown Status';
  }
};

export default addressValidationService;
