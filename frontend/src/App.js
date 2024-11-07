
import 'react-toastify/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import Register from './components/Register';
import Login from './components/Login';
import DashboardRouter from './components/DashboardRouter';
import CreateSupport from './components/CreateSupport';
import PrivateRoute from './components/PrivateRoute';
import RevenueDashboard from './components/RevenueDashboard';
import UnpaidBusinesses from './components/UnpaidBusinesses';
import { NotificationProvider } from './context/NotificationContext';
import ManageSupportUsers from './components/ManageSupportUsers';
import CreateUserReport from './components/reports/CreateUserReport';
import BusinessRegistration from './components/business/BusinessRegistration';
import BusinessApplications from './components/business/BusinessApplications';
import Profile from './components/Profile';
import LocationManagement from './components/LocationManagement';
import { PaymentSuccess, PaymentFailure } from './components/payment/PaymentResult';
import ResetPassword from './components/ResetPassword';
import CreateTicket from './components/tickets/CreateTicket';

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navigation />
          <div className="container mx-auto py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route
                path="/profile"
                element={
                  <PrivateRoute allowedRoles={['user', 'support', 'staff', 'admin']}>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute allowedRoles={['user', 'support', 'staff', 'admin']}>
                    <DashboardRouter />
                  </PrivateRoute>
                }
              />
              <Route
                path="/create-support"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <CreateSupport />
                  </PrivateRoute>
                }
              />
              <Route
                path="/register-business"
                element={
                  <PrivateRoute allowedRoles={['user']}>
                    <BusinessRegistration />
                  </PrivateRoute>
                }
              />
              <Route
                path="/business-applications"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <BusinessApplications />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/create-user-report" 
                element={
                  <PrivateRoute>
                    <CreateUserReport />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/create-ticket" 
                element={
                  <PrivateRoute>
                    <CreateTicket />
                  </PrivateRoute>
                } 
              />
              <Route path="/revenue-dashboard" element={<PrivateRoute allowedRoles={['admin']}><RevenueDashboard /></PrivateRoute>} />
              <Route path="/unpaid-businesses" element={<PrivateRoute allowedRoles={['admin']}><UnpaidBusinesses /></PrivateRoute>} />
              <Route path="/manage-support" element={<PrivateRoute allowedRoles={['admin']}><ManageSupportUsers  /></PrivateRoute>} />
              <Route path="/locations" element={<PrivateRoute allowedRoles={['admin']}><LocationManagement  /></PrivateRoute>} />
              <Route 
                path="/create-user-report" 
                element={
                  <PrivateRoute>
                    <CreateUserReport />
                  </PrivateRoute>
                } 
              />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/failure" element={<PaymentFailure />} />
            </Routes>
          </div>
        </div>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;