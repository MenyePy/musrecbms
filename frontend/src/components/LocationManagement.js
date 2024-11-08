import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';

const LocationManagement = () => {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get('https://musrecbmsapi.vercel.app/api/locations/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocations(response.data);
    } catch (error) {
      setError('Failed to fetch locations. Please try again.');
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    if (!newLocation.trim()) return;

    try {
      setError(null);
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        'https://musrecbmsapi.vercel.app/api/locations/new',
        { name: newLocation.trim() },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setNewLocation('');
      fetchLocations();
    } catch (error) {
      setError(
        error.response?.status === 409 
          ? 'This location already exists.'
          : 'Failed to create location. Please try again.'
      );
      console.error('Failed to create location:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;

    try {
      setError(null);
      const token = localStorage.getItem('token');
      await axios.delete(`https://musrecbmsapi.vercel.app/api/locations/${locationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLocations();
    } catch (error) {
      setError(
        error.response?.status === 400 
          ? 'Cannot delete a location that is currently in use.'
          : 'Failed to delete location. Please try again.'
      );
      console.error('Failed to delete location:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Location Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Add and manage business locations
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <p className="text-sm font-medium text-gray-500">
            Total Locations: {locations.length}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add New Location Form */}
      <form onSubmit={handleCreateLocation} className="flex gap-4">
        <div className="flex-grow">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter new location name"
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !newLocation.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add Location
        </button>
      </form>

      {/* Locations Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((location) => (
          <div
            key={location._id}
            className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {location.name}
              </h3>
              <button
                onClick={() => handleDeleteLocation(location._id)}
                disabled={!location.available}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                title={location.available ? 'Delete location' : 'Cannot delete location in use'}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 flex items-center">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                location.available 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {location.available ? 'Available' : 'In Use'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {locations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No locations added yet.</p>
        </div>
      )}
    </div>
  );
};

export default LocationManagement;