import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

const MapComponent = ({ 
  geofences = [], 
  onGeofenceCreate, 
  onGeofenceUpdate, 
  onGeofenceDelete,
  height = '500px',
  center = { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
  zoom = 10
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedGeofence, setSelectedGeofence] = useState(null);
  const [geofenceOverlays, setGeofenceOverlays] = useState([]);

  // Initialize map
  const initMap = useCallback((mapElement) => {
    if (!mapElement || map) return;

    const newMap = new window.google.maps.Map(mapElement, {
      center,
      zoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    setMap(newMap);
  }, [center, zoom, map]);

  // Initialize map when component mounts
  useEffect(() => {
    if (mapRef.current && !map) {
      initMap(mapRef.current);
    }
  }, [initMap, map]);

  // Initialize drawing manager
  useEffect(() => {
    if (!map || !window.google.maps.drawing) return;

    const manager = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: !!onGeofenceCreate, // Only show drawing tools if create callback is provided
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          window.google.maps.drawing.OverlayType.POLYGON,
          window.google.maps.drawing.OverlayType.CIRCLE,
          window.google.maps.drawing.OverlayType.RECTANGLE,
        ],
      },
      polygonOptions: {
        fillColor: '#FF0000',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FF0000',
        clickable: true,
        editable: true,
        zIndex: 1,
      },
      circleOptions: {
        fillColor: '#FF0000',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FF0000',
        clickable: true,
        editable: true,
        zIndex: 1,
      },
      rectangleOptions: {
        fillColor: '#FF0000',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FF0000',
        clickable: true,
        editable: true,
        zIndex: 1,
      },
    });

    manager.setMap(map);
    setDrawingManager(manager);

    // Handle overlay completion
    const handleOverlayComplete = (event) => {
      const overlay = event.overlay;
      const type = event.type;

      // Extract coordinates based on overlay type
      let coordinates = [];
      let center = null;
      let radius = null;

      if (type === window.google.maps.drawing.OverlayType.POLYGON) {
        const path = overlay.getPath();
        coordinates = path.getArray().map(latLng => ({
          lat: latLng.lat(),
          lng: latLng.lng()
        }));
      } else if (type === window.google.maps.drawing.OverlayType.CIRCLE) {
        center = {
          lat: overlay.getCenter().lat(),
          lng: overlay.getCenter().lng()
        };
        radius = overlay.getRadius();
        // For circles, we'll store the center as coordinates
        coordinates = [center];
      } else if (type === window.google.maps.drawing.OverlayType.RECTANGLE) {
        const bounds = overlay.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        coordinates = [
          { lat: ne.lat(), lng: ne.lng() },
          { lat: ne.lat(), lng: sw.lng() },
          { lat: sw.lat(), lng: sw.lng() },
          { lat: sw.lat(), lng: ne.lng() }
        ];
      }

      // Create geofence data
      const geofenceData = {
        name: `Geofence ${Date.now()}`,
        description: '',
        coordinates,
        type: type.toLowerCase(),
        center,
        radius,
        color: '#FF0000',
        fillColor: '#FF0000',
        fillOpacity: 0.3,
        strokeWeight: 2,
      };

      // Call the create callback
      if (onGeofenceCreate) {
        onGeofenceCreate(geofenceData, overlay);
      }

      // Clear drawing mode
      manager.setDrawingMode(null);
      setIsDrawingMode(false);
    };

    window.google.maps.event.addListener(manager, 'overlaycomplete', handleOverlayComplete);

    return () => {
      if (manager) {
        window.google.maps.event.clearInstanceListeners(manager);
        manager.setMap(null);
      }
    };
  }, [map, onGeofenceCreate]);

  // Render existing geofences
  useEffect(() => {
    if (!map || !geofences.length) return;

    // Clear existing overlays
    geofenceOverlays.forEach(overlay => {
      if (overlay.setMap) {
        overlay.setMap(null);
      }
    });

    const newOverlays = geofences.map(geofence => {
      let overlay;

      if (geofence.type === 'polygon') {
        overlay = new window.google.maps.Polygon({
          paths: geofence.coordinates,
          strokeColor: geofence.color || '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: geofence.strokeWeight || 2,
          fillColor: geofence.fillColor || '#FF0000',
          fillOpacity: geofence.fillOpacity || 0.3,
          clickable: true,
          editable: false,
        });
      } else if (geofence.type === 'circle') {
        overlay = new window.google.maps.Circle({
          center: geofence.center,
          radius: geofence.radius,
          strokeColor: geofence.color || '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: geofence.strokeWeight || 2,
          fillColor: geofence.fillColor || '#FF0000',
          fillOpacity: geofence.fillOpacity || 0.3,
          clickable: true,
          editable: false,
        });
      } else if (geofence.type === 'rectangle') {
        const bounds = new window.google.maps.LatLngBounds();
        geofence.coordinates.forEach(coord => {
          bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
        });
        
        overlay = new window.google.maps.Rectangle({
          bounds: bounds,
          strokeColor: geofence.color || '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: geofence.strokeWeight || 2,
          fillColor: geofence.fillColor || '#FF0000',
          fillOpacity: geofence.fillOpacity || 0.3,
          clickable: true,
          editable: false,
        });
      }

      if (overlay) {
        overlay.setMap(map);
        overlay.geofenceId = geofence._id;

        // Add click listener for selection
        overlay.addListener('click', () => {
          setSelectedGeofence(geofence);
        });

        // Add right-click listener for deletion
        overlay.addListener('rightclick', () => {
          if (onGeofenceDelete && window.confirm(`Delete geofence "${geofence.name}"?`)) {
            onGeofenceDelete(geofence._id);
          }
        });
      }

      return overlay;
    });

    setGeofenceOverlays(newOverlays);

    return () => {
      newOverlays.forEach(overlay => {
        if (overlay && overlay.setMap) {
          overlay.setMap(null);
        }
      });
    };
  }, [map, geofences, onGeofenceDelete]);

  // Toggle drawing mode
  const toggleDrawingMode = (mode) => {
    if (!drawingManager) return;

    if (isDrawingMode && drawingManager.getDrawingMode() === mode) {
      drawingManager.setDrawingMode(null);
      setIsDrawingMode(false);
    } else {
      drawingManager.setDrawingMode(mode);
      setIsDrawingMode(true);
    }
  };

  // Clear all drawings
  const clearDrawings = () => {
    geofenceOverlays.forEach(overlay => {
      if (overlay.setMap) {
        overlay.setMap(null);
      }
    });
    setGeofenceOverlays([]);
    setSelectedGeofence(null);
  };

  return (
    <div className="relative">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2 space-x-2">
        <button
          onClick={() => toggleDrawingMode(window.google.maps?.drawing?.OverlayType?.POLYGON)}
          className={`px-3 py-1 rounded text-sm font-medium ${
            isDrawingMode && drawingManager?.getDrawingMode() === window.google.maps?.drawing?.OverlayType?.POLYGON
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Polygon
        </button>
        <button
          onClick={() => toggleDrawingMode(window.google.maps?.drawing?.OverlayType?.CIRCLE)}
          className={`px-3 py-1 rounded text-sm font-medium ${
            isDrawingMode && drawingManager?.getDrawingMode() === window.google.maps?.drawing?.OverlayType?.CIRCLE
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Circle
        </button>
        <button
          onClick={() => toggleDrawingMode(window.google.maps?.drawing?.OverlayType?.RECTANGLE)}
          className={`px-3 py-1 rounded text-sm font-medium ${
            isDrawingMode && drawingManager?.getDrawingMode() === window.google.maps?.drawing?.OverlayType?.RECTANGLE
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Rectangle
        </button>
        <button
          onClick={clearDrawings}
          className="px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
        >
          Clear
        </button>
      </div>

      {/* Selected Geofence Info */}
      {selectedGeofence && (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-lg mb-2">{selectedGeofence.name}</h3>
          {selectedGeofence.description && (
            <p className="text-gray-600 text-sm mb-2">{selectedGeofence.description}</p>
          )}
          <div className="text-xs text-gray-500">
            <p>Type: {selectedGeofence.type}</p>
            <p>Coordinates: {selectedGeofence.coordinates.length}</p>
            {selectedGeofence.tags && selectedGeofence.tags.length > 0 && (
              <p>Tags: {selectedGeofence.tags.join(', ')}</p>
            )}
          </div>
          <button
            onClick={() => setSelectedGeofence(null)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Close
          </button>
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg overflow-hidden"
      />
    </div>
  );
};

// Map wrapper component
const MapWrapper = (props) => {
  const render = (status) => {
    switch (status) {
      case Status.LOADING:
        return (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Google Maps...</p>
            </div>
          </div>
        );
      case Status.FAILURE:
        return (
          <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
            <div className="text-center">
              <p className="text-red-600 font-semibold">Failed to load Google Maps</p>
              <p className="text-red-500 text-sm mt-2">Please check your API key and internet connection</p>
            </div>
          </div>
        );
      case Status.SUCCESS:
        return <MapComponent {...props} />;
      default:
        return null;
    }
  };

  return (
    <Wrapper
      apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      render={render}
      libraries={['drawing', 'geometry']}
    />
  );
};

export default MapWrapper;