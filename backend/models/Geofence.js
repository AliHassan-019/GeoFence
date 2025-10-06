const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  coordinates: [{
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  }],
  // GeoJSON geometry for geospatial queries
  geometry: {
    type: {
      type: String,
      enum: ['Point', 'Polygon'],
      default: 'Point'
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    }
  },
  type: {
    type: String,
    enum: ['polygon', 'circle', 'rectangle'],
    default: 'polygon'
  },
  center: {
    lat: {
      type: Number,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  radius: {
    type: Number,
    min: 0
  },
  color: {
    type: String,
    default: '#FF0000'
  },
  fillColor: {
    type: String,
    default: '#FF0000'
  },
  fillOpacity: {
    type: Number,
    default: 0.3,
    min: 0,
    max: 1
  },
  strokeWeight: {
    type: Number,
    default: 2,
    min: 1,
    max: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for geospatial queries
geofenceSchema.index({ geometry: '2dsphere' });
geofenceSchema.index({ createdBy: 1 });
geofenceSchema.index({ isActive: 1 });

// Pre-save middleware to generate GeoJSON geometry
geofenceSchema.pre('save', function(next) {
  if (this.isModified('coordinates') || this.isModified('type') || this.isModified('center') || this.isModified('radius')) {
    if (this.type === 'circle' && this.center) {
      // For circles, use Point geometry with center coordinates
      this.geometry = {
        type: 'Point',
        coordinates: [this.center.lng, this.center.lat]
      };
    } else if (this.type === 'polygon' && this.coordinates && this.coordinates.length >= 3) {
      // For polygons, use Polygon geometry
      // Convert coordinates to GeoJSON format [lng, lat] and close the polygon
      const geoCoords = this.coordinates.map(coord => [coord.lng, coord.lat]);
      // Ensure polygon is closed (first and last points are the same)
      if (geoCoords[0][0] !== geoCoords[geoCoords.length - 1][0] || 
          geoCoords[0][1] !== geoCoords[geoCoords.length - 1][1]) {
        geoCoords.push(geoCoords[0]);
      }
      this.geometry = {
        type: 'Polygon',
        coordinates: [geoCoords]
      };
    } else if (this.type === 'rectangle' && this.coordinates && this.coordinates.length >= 2) {
      // For rectangles, convert to polygon
      const geoCoords = this.coordinates.map(coord => [coord.lng, coord.lat]);
      // Close the rectangle if not already closed
      if (geoCoords[0][0] !== geoCoords[geoCoords.length - 1][0] || 
          geoCoords[0][1] !== geoCoords[geoCoords.length - 1][1]) {
        geoCoords.push(geoCoords[0]);
      }
      this.geometry = {
        type: 'Polygon',
        coordinates: [geoCoords]
      };
    }
  }
  next();
});

// Virtual for formatted coordinates
geofenceSchema.virtual('formattedCoordinates').get(function() {
  return this.coordinates.map(coord => [coord.lng, coord.lat]);
});

// Method to check if a point is inside the geofence (for polygon type)
geofenceSchema.methods.containsPoint = function(lat, lng) {
  if (this.type === 'circle' && this.center && this.radius) {
    const distance = this.calculateDistance(lat, lng, this.center.lat, this.center.lng);
    return distance <= this.radius;
  }
  
  if (this.type === 'polygon' && this.coordinates.length >= 3) {
    return this.pointInPolygon(lat, lng, this.coordinates);
  }
  
  return false;
};

// Helper method to calculate distance between two points
geofenceSchema.methods.calculateDistance = function(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper method for point-in-polygon test
geofenceSchema.methods.pointInPolygon = function(lat, lng, coordinates) {
  let inside = false;
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    if (((coordinates[i].lat > lat) !== (coordinates[j].lat > lat)) &&
        (lng < (coordinates[j].lng - coordinates[i].lng) * (lat - coordinates[i].lat) / (coordinates[j].lat - coordinates[i].lat) + coordinates[i].lng)) {
      inside = !inside;
    }
  }
  return inside;
};

module.exports = mongoose.model('Geofence', geofenceSchema);