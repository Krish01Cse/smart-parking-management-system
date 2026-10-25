import {
  ParkingSlot,
  Reservation,
  User,
  Payment,
  DashboardMetrics,
  JiraOverview,
  TestCaseResponse,
  DefectResponse,
  TestCase,
  Defect
} from './types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Slots
  getSlots: (params?: { status?: string; vehicle_type?: string; zone?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.vehicle_type) q.append('vehicle_type', params.vehicle_type);
    if (params?.zone) q.append('zone', params.zone);
    if (params?.search) q.append('search', params.search);
    return fetch(`${BASE_URL}/slots?${q.toString()}`).then(res => handleResponse<ParkingSlot[]>(res));
  },
  getSlotsSummary: () => {
    return fetch(`${BASE_URL}/slots/summary`).then(res => handleResponse<{
      total: number;
      available: number;
      occupied: number;
      maintenance: number;
      cars: number;
      bikes: number;
    }>(res));
  },
  createSlot: (data: { slot_number: string; vehicle_type: string; location_zone: string; hourly_rate: number }) => {
    return fetch(`${BASE_URL}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<ParkingSlot>(res));
  },
  updateSlot: (id: number, data: Partial<ParkingSlot>) => {
    return fetch(`${BASE_URL}/slots/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<ParkingSlot>(res));
  },
  updateSlotStatus: (id: number, status: string, current_vehicle?: string | null) => {
    return fetch(`${BASE_URL}/slots/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, current_vehicle })
    }).then(res => handleResponse<ParkingSlot>(res));
  },
  deleteSlot: (id: number) => {
    return fetch(`${BASE_URL}/slots/${id}`, { method: 'DELETE' }).then(res => handleResponse<{ message: string }>(res));
  },

  // Reservations
  getReservations: (params?: { status?: string; vehicle_type?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.vehicle_type) q.append('vehicle_type', params.vehicle_type);
    if (params?.search) q.append('search', params.search);
    return fetch(`${BASE_URL}/reservations?${q.toString()}`).then(res => handleResponse<Reservation[]>(res));
  },
  createReservation: (data: {
    slot_id: number;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    vehicle_reg_number: string;
    vehicle_type: string;
    start_time: string;
    end_time: string;
  }) => {
    return fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Reservation>(res));
  },
  cancelReservation: (id: number) => {
    return fetch(`${BASE_URL}/reservations/${id}/cancel`, {
      method: 'POST'
    }).then(res => handleResponse<{ message: string; reservation: Reservation }>(res));
  },

  // Users & Auth
  getUsers: (params?: { search?: string; role?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.role) q.append('role', params.role);
    return fetch(`${BASE_URL}/users?${q.toString()}`).then(res => handleResponse<User[]>(res));
  },
  registerUser: (data: any) => {
    return fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<{ message: string; user: User }>(res));
  },
  loginUser: (creds: { email: string; password: string; required_role?: string }) => {
    return fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    }).then(res => handleResponse<{ message: string; token: string; user: User }>(res));
  },
  getSupabaseStatus: () => {
    return fetch(`${BASE_URL}/users/supabase-status`).then(res => handleResponse<{
      configured: boolean;
      project_url: string;
      auth_connected: boolean;
      auth_user_count: number;
      tables: {
        users: { exists: boolean; count: number };
        parking_slots: { exists: boolean; count: number };
        reservations: { exists: boolean; count: number };
        payments: { exists: boolean; count: number };
      };
    }>(res));
  },
  syncAllToSupabase: () => {
    return fetch(`${BASE_URL}/users/supabase-sync-all`, {
      method: 'POST'
    }).then(res => handleResponse<{
      success: boolean;
      message: string;
      counts: { users: string; slots: string; reservations: string; payments: string };
      cloud_status: any;
    }>(res));
  },
  updateUserRole: (id: number, role: 'Administrator' | 'Customer') => {
    return fetch(`${BASE_URL}/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    }).then(res => handleResponse<{ message: string; user: User }>(res));
  },
  updateUser: (id: number, data: Partial<User>) => {
    return fetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<User>(res));
  },

  // Payments
  getPayments: (params?: { status?: string; method?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.method) q.append('method', params.method);
    if (params?.search) q.append('search', params.search);
    return fetch(`${BASE_URL}/payments?${q.toString()}`).then(res => handleResponse<Payment[]>(res));
  },
  calculateFee: (hourly_rate: number, duration_hours: number) => {
    return fetch(`${BASE_URL}/payments/calculate-fee?hourly_rate=${hourly_rate}&duration_hours=${duration_hours}`)
      .then(res => handleResponse<{
        hourly_rate: number;
        duration_hours: number;
        subtotal: number;
        service_charge: number;
        total_amount: number;
        breakdown_text: string;
      }>(res));
  },
  processPayment: (data: { reservation_id: number; payment_method: string; simulate_failure?: boolean }) => {
    return fetch(`${BASE_URL}/payments/process-simulated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<{ success: boolean; message: string; payment: Payment }>(res));
  },
  getRazorpayConfig: () => {
    return fetch(`${BASE_URL}/payments/razorpay/config`).then(res => handleResponse<{
      key_id: string;
      currency: string;
      exchange_rate: number;
      is_test_mode: boolean;
    }>(res));
  },
  updateRazorpayConfig: (data: { key_id: string; key_secret: string }) => {
    return fetch(`${BASE_URL}/payments/razorpay/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<{ message: string; key_id: string }>(res));
  },
  createRazorpayOrder: (reservation_id: number) => {
    return fetch(`${BASE_URL}/payments/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservation_id })
    }).then(res => handleResponse<{
      order_id: string;
      amount: number;
      amount_inr: number;
      amount_usd: number;
      currency: string;
      key_id: string;
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      booking_id: string;
      slot_number: string;
    }>(res));
  },
  verifyRazorpayPayment: (data: {
    reservation_id: number;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    return fetch(`${BASE_URL}/payments/razorpay/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<{ success: boolean; message: string; payment: Payment }>(res));
  },

  // Dashboard
  getDashboardMetrics: () => {
    return fetch(`${BASE_URL}/dashboard/metrics`).then(res => handleResponse<DashboardMetrics>(res));
  },

  // JIRA Project
  getJiraOverview: () => {
    return fetch(`${BASE_URL}/jira/overview`).then(res => handleResponse<JiraOverview>(res));
  },
  updateJiraItem: (item_key: string, data: { status: string; title?: string; description?: string }) => {
    return fetch(`${BASE_URL}/jira/items/${item_key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<any>(res));
  },

  // Testing
  getTestCases: (params?: { module?: string; status?: string; test_type?: string }) => {
    const q = new URLSearchParams();
    if (params?.module) q.append('module', params.module);
    if (params?.status) q.append('status', params.status);
    if (params?.test_type) q.append('test_type', params.test_type);
    return fetch(`${BASE_URL}/testing/cases?${q.toString()}`).then(res => handleResponse<TestCaseResponse>(res));
  },
  createTestCase: (data: any) => {
    return fetch(`${BASE_URL}/testing/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<TestCase>(res));
  },
  updateTestCase: (id: number, data: any) => {
    return fetch(`${BASE_URL}/testing/cases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<TestCase>(res));
  },
  runTestSuite: () => {
    return fetch(`${BASE_URL}/testing/run-suite`, { method: 'POST' }).then(res => handleResponse<any>(res));
  },

  // Defects / Bug Tracking
  getDefects: (params?: { status?: string; severity?: string; module?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.severity) q.append('severity', params.severity);
    if (params?.module) q.append('module', params.module);
    return fetch(`${BASE_URL}/defects?${q.toString()}`).then(res => handleResponse<DefectResponse>(res));
  },
  createDefect: (data: any) => {
    return fetch(`${BASE_URL}/defects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Defect>(res));
  },
  updateDefect: (id: number, data: any) => {
    return fetch(`${BASE_URL}/defects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Defect>(res));
  },

  // Docs
  getDocs: () => {
    return fetch(`${BASE_URL}/docs`).then(res => handleResponse<any>(res));
  },

  // Machine Learning Predictive Analytics
  getMlAnalytics: () => {
    return fetch(`${BASE_URL}/ml/analytics`).then(res => handleResponse<{
      model_metadata: {
        model_name: string;
        model_version: string;
        last_trained: string;
        training_samples: number;
        metrics: {
          r2_score: number;
          mae: string;
          rmse: string;
          f1_score: number;
        };
      };
      live_summary: {
        total_slots: number;
        occupied_slots: number;
        current_occupancy_rate: number;
        predicted_peak_time: string;
        predicted_peak_occupancy: string;
        optimal_hourly_price: string;
        current_avg_price: string;
        projected_revenue_gain: string;
      };
      time_series_forecast: Array<{
        hour: number;
        time: string;
        actual: number | null;
        predicted: number;
        upper95: number;
        lower95: number;
      }>;
      price_elasticity_curve: Array<{
        price: string;
        numeric_price: number;
        expected_occupancy: number;
        projected_revenue: number;
      }>;
      zone_risk_matrix: Array<{
        zone: string;
        full_name: string;
        total_slots: number;
        occupied: number;
        available: number;
        occupancy_pct: number;
        risk_score: number;
        classification: string;
        color: string;
        recommendation: string;
      }>;
      duration_distribution: Array<{
        range: string;
        count: number;
      }>;
    }>(res));
  }
};
