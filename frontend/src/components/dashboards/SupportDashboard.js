import { useAuth } from "../../context/AuthContext";
import TicketList from '../tickets/TicketList';
import UserReportList from '../reports/UserReportList';
import { useState } from 'react';

const SupportDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('tickets');
  
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Support Dashboard</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Welcome, {user.username}</h3>
          
          <div className="mb-4 border-b">
            <nav className="-mb-px flex space-x-4">
              <button
                onClick={() => setActiveTab('tickets')}
                className={`py-2 px-4 ${activeTab === 'tickets' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                Active Tickets
              </button>
              <button
                onClick={() => setActiveTab('user-reports')}
                className={`py-2 px-4 ${activeTab === 'user-reports' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                User Reports
              </button>
            </nav>
          </div>

          <div>
            {activeTab === 'tickets' ? (
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-bold mb-2">Active Tickets</h4>
                <TicketList userRole="support" />
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded">
                <h4 className="font-bold mb-2">User Reports</h4>
                <UserReportList userRole="support" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default SupportDashboard;