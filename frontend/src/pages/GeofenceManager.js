import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import MapComponent from '../components/map/MapComponent';
import { geofencesAPI } from '../services/api';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  TagIcon,
  MapPinIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const GeofenceManager = () => {
  const [selectedGeofence, setSelectedGeofence] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    tags: '',
    color: '#FF0000',
    fillColor: '#FF0000',
    fillOpacity: 0.3,
    strokeWeight: 2
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showGeofenceList, setShowGeofenceList] = useState(true);

  const queryClient = useQueryClient();

  // Fetch geofences
  const { data: geofencesData, isLoading: isLoadingGeofences } = useQuery({
    queryKey: ['geofences'],
    queryFn: () => geofencesAPI.getGeofences(),
    select: (response) => response.data.data || []
  });

  // Fetch tags
  const { data: tagsData } = useQuery({
    queryKey: ['geofence-tags'],
    queryFn: () => geofencesAPI.getTags(),
    select: (response) => response.data.data || []
  });

  // Create geofence mutation
  const createGeofenceMutation = useMutation({
    mutationFn: geofencesAPI.createGeofence,
    onSuccess: () => {
      queryClient.invalidateQueries(['geofences']);
      queryClient.invalidateQueries(['geofence-tags']);
      toast.success('Geofence created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create geofence');
    }
  });

  // Update geofence mutation
  const updateGeofenceMutation = useMutation({
    mutationFn: ({ id, data }) => geofencesAPI.updateGeofence(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['geofences']);
      queryClient.invalidateQueries(['geofence-tags']);
      setIsEditModalOpen(false);
      setSelectedGeofence(null);
      toast.success('Geofence updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update geofence');
    }
  });

  // Delete geofence mutation
  const deleteGeofenceMutation = useMutation({
    mutationFn: geofencesAPI.deleteGeofence,
    onSuccess: () => {
      queryClient.invalidateQueries(['geofences']);
      queryClient.invalidateQueries(['geofence-tags']);
      toast.success('Geofence deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete geofence');
    }
  });

  // Handle geofence creation from map
  const handleGeofenceCreate = async (geofenceData) => {
    try {
      await createGeofenceMutation.mutateAsync(geofenceData);
    } catch (error) {
      console.error('Error creating geofence:', error);
    }
  };

  // Handle geofence deletion
  const handleGeofenceDelete = async (geofenceId) => {
    try {
      await deleteGeofenceMutation.mutateAsync(geofenceId);
    } catch (error) {
      console.error('Error deleting geofence:', error);
    }
  };

  // Open edit modal
  const openEditModal = (geofence) => {
    setSelectedGeofence(geofence);
    setEditForm({
      name: geofence.name,
      description: geofence.description || '',
      tags: geofence.tags ? geofence.tags.join(', ') : '',
      color: geofence.color || '#FF0000',
      fillColor: geofence.fillColor || '#FF0000',
      fillOpacity: geofence.fillOpacity || 0.3,
      strokeWeight: geofence.strokeWeight || 2
    });
    setIsEditModalOpen(true);
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGeofence) return;

    const updateData = {
      ...editForm,
      tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    try {
      await updateGeofenceMutation.mutateAsync({
        id: selectedGeofence._id,
        data: updateData
      });
    } catch (error) {
      console.error('Error updating geofence:', error);
    }
  };

  // Filter geofences based on search and tag
  const filteredGeofences = geofencesData?.filter(geofence => {
    const matchesSearch = geofence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (geofence.description && geofence.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = !selectedTag || (geofence.tags && geofence.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  }) || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MapPinIcon className="h-8 w-8 mr-3 text-blue-600" />
                Geofence Manager
              </h1>
              <p className="mt-2 text-gray-600">
                Create, manage, and monitor your geofences on the map
              </p>
            </div>
            <button
              onClick={() => setShowGeofenceList(!showGeofenceList)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showGeofenceList ? (
                <>
                  <EyeSlashIcon className="h-5 w-5 mr-2" />
                  Hide List
                </>
              ) : (
                <>
                  <EyeIcon className="h-5 w-5 mr-2" />
                  Show List
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Geofence List Sidebar */}
          {showGeofenceList && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Geofences</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {filteredGeofences.length}
                  </span>
                </div>

                {/* Search and Filter */}
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    placeholder="Search geofences..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Tags</option>
                    {tagsData?.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>

                {/* Geofence List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {isLoadingGeofences ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading...</p>
                    </div>
                  ) : filteredGeofences.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No geofences found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Draw on the map to create your first geofence
                      </p>
                    </div>
                  ) : (
                    filteredGeofences.map(geofence => (
                      <div
                        key={geofence._id}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedGeofence(geofence)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {geofence.name}
                            </h3>
                            {geofence.description && (
                              <p className="text-sm text-gray-600 mt-1 truncate">
                                {geofence.description}
                              </p>
                            )}
                            <div className="flex items-center mt-2 space-x-2">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {geofence.type}
                              </span>
                              <div
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: geofence.fillColor }}
                              />
                            </div>
                            {geofence.tags && geofence.tags.length > 0 && (
                              <div className="flex items-center mt-2">
                                <TagIcon className="h-3 w-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-500 truncate">
                                  {geofence.tags.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(geofence);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete "${geofence.name}"?`)) {
                                  handleGeofenceDelete(geofence._id);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Map */}
          <div className={showGeofenceList ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Interactive Map</h2>
                <p className="text-sm text-gray-600">
                  Use the drawing tools to create geofences. Right-click on existing geofences to delete them.
                </p>
              </div>
              
              <MapComponent
                geofences={filteredGeofences}
                onGeofenceCreate={handleGeofenceCreate}
                onGeofenceDelete={handleGeofenceDelete}
                height="600px"
              />
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && selectedGeofence && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Geofence
              </h3>
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Border Color
                    </label>
                    <input
                      type="color"
                      value={editForm.color}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fill Color
                    </label>
                    <input
                      type="color"
                      value={editForm.fillColor}
                      onChange={(e) => setEditForm({ ...editForm, fillColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fill Opacity
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={editForm.fillOpacity}
                      onChange={(e) => setEditForm({ ...editForm, fillOpacity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{editForm.fillOpacity}</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Border Width
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={editForm.strokeWeight}
                      onChange={(e) => setEditForm({ ...editForm, strokeWeight: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{editForm.strokeWeight}px</span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateGeofenceMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateGeofenceMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GeofenceManager;