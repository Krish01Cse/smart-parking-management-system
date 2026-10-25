export interface ParkingSlot {
  id: number;
  slot_number: string;
  vehicle_type: 'Car' | 'Bike';
  location_zone: string;
  hourly_rate: number;
  status: 'Available' | 'Occupied' | 'Maintenance';
  current_vehicle?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Reservation {
  id: number;
  booking_id: string;
  slot_id: number;
  user_id?: number | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  vehicle_reg_number: string;
  vehicle_type: 'Car' | 'Bike';
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_amount: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  created_at?: string;
  slot_number?: string;
  location_zone?: string;
  slot_rate?: number;
  payment_status?: string | null;
  transaction_id?: string | null;
  payment_method?: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'Administrator' | 'Customer';
  created_at?: string;
}

export interface Payment {
  id: number;
  transaction_id: string;
  reservation_id: number;
  amount: number;
  hourly_rate: number;
  duration_hours: number;
  payment_method: string;
  status: 'Pending' | 'Paid' | 'Failed';
  notes?: string | null;
  created_at?: string;
  booking_id?: string;
  customer_name?: string;
  vehicle_reg_number?: string;
  vehicle_type?: string;
  slot_number?: string;
  location_zone?: string;
}

export interface DashboardMetrics {
  total_slots: number;
  available_slots: number;
  occupied_slots: number;
  maintenance_slots: number;
  occupancy_rate: number;
  total_users: number;
  active_reservations: number;
  completed_reservations: number;
  cancelled_reservations: number;
  today_reservations: number;
  total_revenue: number;
  pending_payments: number;
  zone_stats: {
    location_zone: string;
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
  }[];
  vehicle_distribution: {
    vehicle_type: string;
    count: number;
  }[];
  recent_reservations: Reservation[];
  recent_transactions: Payment[];
}

export interface JiraEpic {
  id: number;
  epic_key: string;
  title: string;
  description: string;
  status: string;
}

export interface JiraSprint {
  id: number;
  sprint_name: string;
  goal: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface JiraItem {
  id: number;
  item_key: string;
  epic_key: string;
  parent_key?: string | null;
  item_type: 'Story' | 'Task' | 'Subtask';
  title: string;
  description: string;
  sprint_name: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Verified';
}

export interface JiraOverview {
  project_name: string;
  methodology: string;
  total_epics: number;
  total_sprints: number;
  total_work_items: number;
  completed_work_items: number;
  completion_rate: number;
  epics: JiraEpic[];
  sprints: JiraSprint[];
  items: JiraItem[];
}

export interface TestCase {
  id: number;
  test_case_id: string;
  module: string;
  test_scenario: string;
  test_data: string;
  expected_result: string;
  actual_result: string;
  status: 'Pass' | 'Fail' | 'Pending';
  test_type?: string;
  executed_at?: string | null;
}

export interface TestCaseResponse {
  summary: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    pass_rate: number;
  };
  cases: TestCase[];
}

export interface Defect {
  id: number;
  bug_id: string;
  bug_description: string;
  steps_to_reproduce: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Low';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Fixed' | 'Retested/Closed';
  resolution?: string;
  related_module: string;
  retest_result?: string;
  created_at?: string;
}

export interface DefectResponse {
  summary: {
    total: number;
    open: number;
    in_progress: number;
    fixed: number;
    closed: number;
  };
  defects: Defect[];
}
