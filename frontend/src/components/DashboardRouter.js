import { useAuth } from '../context/AuthContext';
import UserDashboard from './dashboards/UserDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import SupportDashboard from './dashboards/SupportDashboard';
import StaffDashboard from './dashboards/StaffDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'support':
      return <SupportDashboard />;
    case 'staff':
      return <StaffDashboard />;
    default:
      return <UserDashboard />;
  }
};

export default DashboardRouter;
