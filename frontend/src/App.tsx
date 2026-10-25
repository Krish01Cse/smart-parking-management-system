import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header, FilterPill } from './components/Header';
import { Toast, ToastMessage } from './components/Toast';
import { SlotModal } from './components/SlotModal';
import { ReservationModal } from './components/ReservationModal';
import { PaymentModal } from './components/PaymentModal';
import { UserModal } from './components/UserModal';
import { TestCaseModal } from './components/TestCaseModal';
import { DefectModal } from './components/DefectModal';

import { DashboardPage } from './pages/DashboardPage';
import { SlotsPage } from './pages/SlotsPage';
import { ParkingLocationMapView } from './components/ParkingLocationMapView';
import { ReservationsPage } from './pages/ReservationsPage';
import { UsersPage } from './pages/UsersPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { JiraOverviewPage } from './pages/JiraOverviewPage';
import { TestingPage } from './pages/TestingPage';
import { BugTrackingPage } from './pages/BugTrackingPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { AuthPage } from './pages/AuthPage';

import { api } from './api';
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

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('smart_parking_user');
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('smart_parking_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      id: 1,
      name: 'Alex Morgan',
      email: 'admin@smartparking.edu',
      phone: '+1 (555) 019-2834',
      role: 'Administrator'
    };
  });

  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const saved = localStorage.getItem('smart_parking_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === 'Customer') return 'slots';
      } catch {}
    }
    return 'slots';
  });

  // Global Data States
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [jiraOverview, setJiraOverview] = useState<JiraOverview | null>(null);
  const [testCasesResponse, setTestCasesResponse] = useState<TestCaseResponse | null>(null);
  const [defectsResponse, setDefectsResponse] = useState<DefectResponse | null>(null);

  // Modals
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ParkingSlot | null>(null);

  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [preSelectedSlot, setPreSelectedSlot] = useState<ParkingSlot | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeReservationForPayment, setActiveReservationForPayment] = useState<Reservation | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);

  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [editingDefect, setEditingDefect] = useState<Defect | null>(null);

  // Search & Filter Pill in Header
  const [activePill, setActivePill] = useState<string>('all');
  const [headerSearch, setHeaderSearch] = useState<string>('');

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load Initial Data
  const loadAllData = async () => {
    try {
      const [slotsData, reservationsData, usersData, paymentsData, metricsData, jiraData, testData, defectsData] =
        await Promise.all([
          api.getSlots(),
          api.getReservations(),
          api.getUsers(),
          api.getPayments(),
          api.getDashboardMetrics(),
          api.getJiraOverview(),
          api.getTestCases(),
          api.getDefects()
        ]);

      setSlots(slotsData);
      setReservations(reservationsData);
      setUsers(usersData);
      setPayments(paymentsData);
      setDashboardMetrics(metricsData);
      setJiraOverview(jiraData);
      setTestCasesResponse(testData);
      setDefectsResponse(defectsData);
    } catch (err: any) {
      console.error('Data load error:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers for Slots
  const handleSaveSlot = async (slotData: any) => {
    if (editingSlot) {
      const updated = await api.updateSlot(editingSlot.id, slotData);
      showToast('success', `Parking slot ${updated.slot_number} updated.`);
    } else {
      const created = await api.createSlot(slotData);
      showToast('success', `Parking slot ${created.slot_number} created.`);
    }
    loadAllData();
  };

  const handleSlotStatusChange = async (slot: ParkingSlot, newStatus: string) => {
    try {
      const updated = await api.updateSlotStatus(slot.id, newStatus);
      showToast('success', `Slot ${updated.slot_number} status changed to ${newStatus}.`);
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Handlers for Reservations
  const handleCreateReservation = async (reservationData: any) => {
    try {
      const created = await api.createReservation(reservationData);
      showToast('success', `Reservation confirmed! Booking ID: ${created.booking_id}`);
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
      throw err;
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    try {
      const res = await api.cancelReservation(reservationId);
      showToast('success', res.message);
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Handlers for Payments
  const handlePaymentSuccess = (payment: Payment) => {
    showToast('success', `Payment of $${payment.amount.toFixed(2)} recorded under ${payment.transaction_id}.`);
    loadAllData();
  };

  // Handlers for Tests
  const handleRunTestSuite = async () => {
    try {
      const res = await api.runTestSuite();
      showToast('success', res.message);
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleSaveTestCase = async (tcData: any) => {
    if (editingTestCase) {
      await api.updateTestCase(editingTestCase.id, tcData);
      showToast('success', `Test Case ${editingTestCase.test_case_id} updated.`);
    } else {
      const created = await api.createTestCase(tcData);
      showToast('success', `Test Case ${created.test_case_id} registered.`);
    }
    loadAllData();
  };

  const handleUpdateTestStatus = async (id: number, status: string) => {
    await api.updateTestCase(id, { status });
    loadAllData();
  };

  // Handlers for Defects
  const handleSaveDefect = async (defectData: any) => {
    if (editingDefect) {
      await api.updateDefect(editingDefect.id, defectData);
      showToast('success', `Defect ${editingDefect.bug_id} updated.`);
    } else {
      const created = await api.createDefect(defectData);
      showToast('success', `Defect ${created.bug_id} logged.`);
    }
    loadAllData();
  };

  const handleUpdateDefectStatus = async (id: number, status: string) => {
    await api.updateDefect(id, { status });
    loadAllData();
  };

  // Handlers for JIRA
  const handleUpdateJiraItem = async (itemKey: string, status: string) => {
    await api.updateJiraItem(itemKey, { status });
    showToast('info', `JIRA work item ${itemKey} moved to ${status}.`);
    loadAllData();
  };

  // User Auth Handlers
  const handleLogin = async (creds: any) => {
    const res = await api.loginUser(creds);
    setCurrentUser(res.user);
    setIsAuthenticated(true);
    localStorage.setItem('smart_parking_user', JSON.stringify(res.user));
    showToast('success', `Welcome back, ${res.user.name}!`);
  };

  const handleRegister = async (data: any) => {
    const res = await api.registerUser(data);
    setCurrentUser(res.user);
    setIsAuthenticated(true);
    localStorage.setItem('smart_parking_user', JSON.stringify(res.user));
    showToast('success', `Account created! Welcome, ${res.user.name}.`);
    loadAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem('smart_parking_user');
    setIsAuthenticated(false);
    showToast('info', 'You have been signed out.');
  };

  // Dynamic Header configuration based on active tab
  const getHeaderConfig = () => {
    switch (activeTab) {
      case 'slots':
        return {
          title: 'Parking Slots',
          subtitle: 'Module 1: Real-time slot management, occupancy status, and zone controls',
          pills: [
            { id: 'all', label: 'All Slots', count: slots.length },
            { id: 'Available', label: 'Available', count: slots.filter(s => s.status === 'Available').length },
            { id: 'Occupied', label: 'Occupied', count: slots.filter(s => s.status === 'Occupied').length },
            { id: 'Maintenance', label: 'Maintenance', count: slots.filter(s => s.status === 'Maintenance').length }
          ],
          action: currentUser.role === 'Administrator' ? {
            label: 'Add Parking Slot',
            onClick: () => {
              setEditingSlot(null);
              setIsSlotModalOpen(true);
            }
          } : {
            label: 'Book Parking Space',
            onClick: () => {
              setPreSelectedSlot(null);
              setIsReservationModalOpen(true);
            }
          }
        };
      case 'reservations':
        const filteredReservations = currentUser.role === 'Customer'
          ? reservations.filter(r =>
              (r.customer_email && r.customer_email.toLowerCase() === currentUser.email.toLowerCase()) ||
              (r.customer_name && r.customer_name.toLowerCase() === currentUser.name.toLowerCase())
            )
          : reservations;
        return {
          title: currentUser.role === 'Customer' ? 'My Reservations' : 'Reservations',
          subtitle: currentUser.role === 'Customer'
            ? 'View your active parking spaces, pay fees via Razorpay, or manage bookings'
            : 'Module 2: Vehicle reservation scheduling, schedule collision checks, and cancellations',
          pills: [
            { id: 'all', label: 'All Bookings', count: filteredReservations.length },
            { id: 'Confirmed', label: 'Confirmed', count: filteredReservations.filter(r => r.status === 'Confirmed').length },
            { id: 'Completed', label: 'Completed', count: filteredReservations.filter(r => r.status === 'Completed').length },
            { id: 'Cancelled', label: 'Cancelled', count: filteredReservations.filter(r => r.status === 'Cancelled').length }
          ],
          action: {
            label: 'New Reservation',
            onClick: () => {
              setPreSelectedSlot(null);
              setIsReservationModalOpen(true);
            }
          }
        };
      case 'dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'System overview, real-time occupancy rates, and recent transaction activity',
          pills: [
            { id: 'all', label: 'Total Spaces', count: slots.length },
            { id: 'active', label: 'Active Bookings', count: reservations.filter(r => r.status === 'Confirmed').length }
          ],
          action: {
            label: 'Book Parking Space',
            onClick: () => {
              setPreSelectedSlot(null);
              setIsReservationModalOpen(true);
            }
          }
        };
      case 'users':
        return {
          title: 'User Management',
          subtitle: 'Module 3: Role-based administration, customer profiles, and cryptographic password hashing',
          pills: [
            { id: 'all', label: 'All Users', count: users.length },
            { id: 'Administrator', label: 'Admins', count: users.filter(u => u.role === 'Administrator').length },
            { id: 'Customer', label: 'Customers', count: users.filter(u => u.role === 'Customer').length }
          ],
          action: {
            label: 'Register User',
            onClick: () => setIsUserModalOpen(true)
          }
        };
      case 'payments':
        const filteredPayments = currentUser.role === 'Customer'
          ? payments.filter(p =>
              (p.customer_name && p.customer_name.toLowerCase() === currentUser.name.toLowerCase()) ||
              reservations.some(r => r.id === p.reservation_id && (
                (r.customer_email && r.customer_email.toLowerCase() === currentUser.email.toLowerCase()) ||
                (r.customer_name && r.customer_name.toLowerCase() === currentUser.name.toLowerCase())
              ))
            )
          : payments;
        return {
          title: currentUser.role === 'Customer' ? 'My Payments' : 'Payments Ledger',
          subtitle: currentUser.role === 'Customer'
            ? 'Official Razorpay payment receipts and transaction records'
            : 'Module 4: Dynamic tariff engine, Razorpay payment gateway integration, and duplicate payment prevention',
          pills: [
            { id: 'all', label: 'All Transactions', count: filteredPayments.length },
            { id: 'Paid', label: 'Paid', count: filteredPayments.filter(p => p.status === 'Paid').length },
            { id: 'Pending', label: 'Pending', count: filteredPayments.filter(p => p.status === 'Pending').length },
            { id: 'Failed', label: 'Failed', count: filteredPayments.filter(p => p.status === 'Failed').length }
          ]
        };
      case 'reports':
        return {
          title: 'Reports & Analytics',
          subtitle: 'Visual occupancy distribution and vehicle category intelligence'
        };
      case 'jira':
        return {
          title: 'JIRA Project Overview',
          subtitle: 'SE-lab-LA (SCRUM): Epics, Sprints, User Stories, and Subtasks mapping'
        };
      case 'testing':
        return {
          title: 'Testing & Test Cases',
          subtitle: 'PBL verification matrix: Equivalence partitioning, boundary values, and automated live runner',
          action: {
            label: 'Add Test Case',
            onClick: () => {
              setEditingTestCase(null);
              setIsTestCaseModalOpen(true);
            }
          }
        };
      case 'bugs':
        return {
          title: 'Bug Tracking Register',
          subtitle: 'Defect logging and lifecycle status workflow (Open → In Progress → Fixed → Retested)',
          action: {
            label: 'Log New Defect',
            onClick: () => {
              setEditingDefect(null);
              setIsDefectModalOpen(true);
            }
          }
        };
      case 'docs':
        return {
          title: 'Project Documentation',
          subtitle: 'Full academic PBL submission specification, architecture diagram, and evaluator demo sequence'
        };
      default:
        return { title: 'ParkPulse™ Intelligent Parking System' };
    }
  };

  const headerConfig = getHeaderConfig();

  // If not logged in, render dedicated AuthPage
  if (!isAuthenticated) {
    return (
      <>
        <Toast toasts={toasts} onDismiss={dismissToast} />
        <AuthPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthenticated(true);
            localStorage.setItem('smart_parking_user', JSON.stringify(user));
            setActiveTab(user.role === 'Administrator' ? 'dashboard' : 'slots');
            showToast('success', `Welcome, ${user.name}! (${user.role} Portal)`);
            loadAllData();
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex">
      {/* Sidebar Dock (Fixed on left, matching screenshot) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setActivePill('all');
          setHeaderSearch('');
        }}
        onOpenSettings={() => setIsUserModalOpen(true)}
        userRole={currentUser.role}
      />

      {/* Main Content Area (Offset by sidebar width + margin) */}
      <main className="flex-1 ml-24 mr-4 my-4 sm:mr-6 sm:my-6 max-w-[1600px]">
        {/* Top Header with title and screenshot-style pill tab counters */}
        <Header
          title={headerConfig.title}
          subtitle={headerConfig.subtitle}
          filterPills={headerConfig.pills}
          activePill={activePill}
          onSelectPill={(pillId) => setActivePill(pillId)}
          searchValue={headerSearch}
          onSearchChange={(val) => setHeaderSearch(val)}
          actionButton={headerConfig.action}
          currentUser={currentUser}
          onUserClick={() => setIsUserModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Page Content View */}
        <div className="pb-12">
          {activeTab === 'dashboard' && (
            <DashboardPage
              metrics={dashboardMetrics}
              onNavigate={(tab) => setActiveTab(tab)}
              onBookSlot={() => {
                setPreSelectedSlot(null);
                setIsReservationModalOpen(true);
              }}
              onRunTests={handleRunTestSuite}
            />
          )}

          {activeTab === 'slots' && (
            <SlotsPage
              slots={slots}
              isAdmin={currentUser.role === 'Administrator'}
              onBookSlot={(slot) => {
                setPreSelectedSlot(slot);
                setIsReservationModalOpen(true);
              }}
              onAddSlot={() => {
                setEditingSlot(null);
                setIsSlotModalOpen(true);
              }}
              onEditSlot={(slot) => {
                setEditingSlot(slot);
                setIsSlotModalOpen(true);
              }}
              onStatusChange={handleSlotStatusChange}
            />
          )}

          {activeTab === 'map' && (
            <ParkingLocationMapView
              slots={slots}
              onBookSlot={(slot) => {
                setPreSelectedSlot(slot);
                setIsReservationModalOpen(true);
              }}
              isAdmin={currentUser.role === 'Administrator'}
            />
          )}

          {activeTab === 'reservations' && (
            <ReservationsPage
              isAdmin={currentUser.role === 'Administrator'}
              reservations={
                currentUser.role === 'Customer'
                  ? reservations.filter(r =>
                      (r.customer_email && r.customer_email.toLowerCase() === currentUser.email.toLowerCase()) ||
                      (r.customer_name && r.customer_name.toLowerCase() === currentUser.name.toLowerCase())
                    )
                  : reservations
              }
              onNewReservation={() => {
                setPreSelectedSlot(null);
                setIsReservationModalOpen(true);
              }}
              onCancelReservation={handleCancelReservation}
              onPayReservation={(res) => {
                setActiveReservationForPayment(res);
                setIsPaymentModalOpen(true);
              }}
            />
          )}

          {activeTab === 'users' && (
            <UsersPage
              users={users}
              onAddUser={() => setIsUserModalOpen(true)}
              onEditUser={(u) => setIsUserModalOpen(true)}
              onRefreshData={loadAllData}
              onShowToast={showToast}
              onLoginDemo={(email) => {
                api.loginUser({ email, password: 'Admin@123' }).then((res) => {
                  setCurrentUser(res.user);
                  showToast('success', `Switched to ${res.user.name} (${res.user.role}).`);
                });
              }}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsPage
              payments={
                currentUser.role === 'Customer'
                  ? payments.filter(p =>
                      (p.customer_name && p.customer_name.toLowerCase() === currentUser.name.toLowerCase()) ||
                      reservations.some(r => r.id === p.reservation_id && (
                        (r.customer_email && r.customer_email.toLowerCase() === currentUser.email.toLowerCase()) ||
                        (r.customer_name && r.customer_name.toLowerCase() === currentUser.name.toLowerCase())
                      ))
                    )
                  : payments
              }
              onViewReceipt={(p) => {
                const res = reservations.find(r => r.id === p.reservation_id);
                if (res) {
                  setActiveReservationForPayment(res);
                  setIsPaymentModalOpen(true);
                } else {
                  showToast('info', `Transaction ${p.transaction_id}: ₹${p.amount.toFixed(2)} via ${p.payment_method}.`);
                }
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPage metrics={dashboardMetrics} />
          )}

          {activeTab === 'jira' && (
            <JiraOverviewPage
              jira={jiraOverview}
              onUpdateItemStatus={handleUpdateJiraItem}
            />
          )}

          {activeTab === 'testing' && (
            <TestingPage
              testResponse={testCasesResponse}
              onRunSuite={handleRunTestSuite}
              onAddTestCase={() => {
                setEditingTestCase(null);
                setIsTestCaseModalOpen(true);
              }}
              onEditTestCase={(tc) => {
                setEditingTestCase(tc);
                setIsTestCaseModalOpen(true);
              }}
              onUpdateStatus={handleUpdateTestStatus}
            />
          )}

          {activeTab === 'bugs' && (
            <BugTrackingPage
              defectResponse={defectsResponse}
              onAddDefect={() => {
                setEditingDefect(null);
                setIsDefectModalOpen(true);
              }}
              onEditDefect={(d) => {
                setEditingDefect(d);
                setIsDefectModalOpen(true);
              }}
              onUpdateStatus={handleUpdateDefectStatus}
            />
          )}

          {activeTab === 'docs' && (
            <DocumentationPage />
          )}
        </div>
      </main>

      {/* Global Modals */}
      <SlotModal
        isOpen={isSlotModalOpen}
        onClose={() => {
          setIsSlotModalOpen(false);
          setEditingSlot(null);
        }}
        onSubmit={handleSaveSlot}
        editingSlot={editingSlot}
      />

      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => {
          setIsReservationModalOpen(false);
          setPreSelectedSlot(null);
        }}
        onSubmit={handleCreateReservation}
        slots={slots}
        preSelectedSlot={preSelectedSlot}
        currentUser={currentUser}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setActiveReservationForPayment(null);
        }}
        reservation={activeReservationForPayment}
        onPaymentSuccess={handlePaymentSuccess}
        processPaymentApi={api.processPayment}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={currentUser.id !== 0 ? currentUser : null}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
      />

      <TestCaseModal
        isOpen={isTestCaseModalOpen}
        onClose={() => {
          setIsTestCaseModalOpen(false);
          setEditingTestCase(null);
        }}
        onSubmit={handleSaveTestCase}
        editingCase={editingTestCase}
      />

      <DefectModal
        isOpen={isDefectModalOpen}
        onClose={() => {
          setIsDefectModalOpen(false);
          setEditingDefect(null);
        }}
        onSubmit={handleSaveDefect}
        editingDefect={editingDefect}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
