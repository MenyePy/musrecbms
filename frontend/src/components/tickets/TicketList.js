import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {ToastContainer, toast} from 'react-toastify';

const TicketList = ({ userRole }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const handleError = (err) => toast.error(err, {position: "top-right", });
  const handleSuccess = (msg) =>toast.success(msg, {position: "top-right",});

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = userRole === 'support' ? 
        `/api/tickets/all${filter !== 'all' ? `?status=${filter}` : ''}` : 
        '/api/tickets/my-tickets';
      
      const response = await axios.get(
        `http://localhost:5000${endpoint}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setTickets(response.data);
    } catch (error) {
      handleError(error.response?.data?.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId, status, comment) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tickets/${ticketId}/status`,
        { status, comment },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchTickets();
    } catch (error) {
      handleError(error.response?.data?.message || 'Failed to update ticket');
    }
  };

  const handleAssign = async (ticketId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tickets/${ticketId}/assign`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      handleSuccess("Operation successful");
      fetchTickets();
    } catch (error) {
      handleError(error.response?.data?.message || 'Failed to assign ticket');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  return (
    <>
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {userRole === 'support' ? 'Support Tickets' : 'My Tickets'}
        </h2>
        {userRole === 'support' && (
          <select
            className="p-2 border rounded"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Tickets</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
          </select>
        )}
      </div>
      <div className="grid gap-6">
        {tickets.map((ticket) => (
          <div key={ticket._id} className="bg-white p-6 rounded-lg shadow">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">{ticket.subject}</h3>
              <p className="text-gray-600">
                Status: <span className="font-semibold">{ticket.status}</span>
              </p>
              {userRole === 'support' && (
                <p className="text-gray-600">
                  Submitted by: {ticket.user.username} ({ticket.user.email})
                </p>
              )}
              {ticket.assignedTo && (
                <p className="text-gray-600">
                  Assigned to: {ticket.assignedTo.username}
                </p>
              )}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Description:</h4>
              <p className="bg-gray-50 p-3 rounded">{ticket.body}</p>
            </div>
            {ticket.attachments?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Attachments:</h4>
                <div className="flex flex-wrap gap-2">
                  {ticket.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={`http://localhost:5000/${attachment.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {attachment.filename}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {userRole === 'support' && ticket.status !== 'archived' && (
              <div className="mt-4">
                <div className="mb-4">
                  <label className="block mb-2">Resolution Comment:</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    placeholder={!ticket.resolution ? "You can add a comment once the issue is resolved" : "Add a comment..."}
                    value={ticket.resolution?.comment || ''}
                    onChange={(e) => handleStatusUpdate(
                      ticket._id,
                      ticket.status,
                      e.target.value
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  {!ticket.assignedTo && (
                    <button
                      onClick={() => handleAssign(ticket._id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Assign to Me
                    </button>
                  )}
                  {ticket.status !== 'resolved' && (
                    <button
                      onClick={() => handleStatusUpdate(
                        ticket._id,
                        'resolved',
                        ticket.resolution?.comment
                      )}
                      className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                      Mark as Resolved
                    </button>
                  )}
                  {ticket.status === 'resolved' && (
                    <button
                      onClick={() => handleStatusUpdate(
                        ticket._id,
                        'archived',
                        ticket.resolution?.comment
                      )}
                      className="bg-gray-500 text-white px-4 py-2 rounded"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    <ToastContainer />
    </>
  );
};

export default TicketList;