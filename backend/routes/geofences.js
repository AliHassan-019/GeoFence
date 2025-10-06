const express = require('express');
const router = express.Router();
const Geofence = require('../models/Geofence');
const { authenticateToken } = require('../middleware/auth');

// Get all geofences for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const geofences = await Geofence.find({ 
      createdBy: req.user.id,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: geofences,
      count: geofences.length
    });
  } catch (error) {
    console.error('Error fetching geofences:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching geofences',
      error: error.message
    });
  }
});

// Get all unique tags for user's geofences
router.get('/tags', authenticateToken, async (req, res) => {
  try {
    const tags = await Geofence.distinct('tags', {
      createdBy: req.user.id,
      isActive: true
    });

    res.json({
      success: true,
      data: tags.filter(tag => tag && tag.trim() !== ''),
      count: tags.length
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tags',
      error: error.message
    });
  }
});

// Get geofence by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const geofence = await Geofence.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    res.json({
      success: true,
      data: geofence
    });
  } catch (error) {
    console.error('Error fetching geofence:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching geofence',
      error: error.message
    });
  }
});

// Create a new geofence
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      coordinates,
      type,
      center,
      radius,
      color,
      fillColor,
      fillOpacity,
      strokeWeight,
      tags
    } = req.body;

    // Validation
    if (!name || !coordinates || coordinates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name and coordinates are required'
      });
    }

    if (type === 'polygon' && coordinates.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Polygon must have at least 3 coordinates'
      });
    }

    if (type === 'circle' && (!center || !radius)) {
      return res.status(400).json({
        success: false,
        message: 'Circle type requires center and radius'
      });
    }

    const geofence = new Geofence({
      name,
      description,
      coordinates,
      type: type || 'polygon',
      center,
      radius,
      color: color || '#FF0000',
      fillColor: fillColor || '#FF0000',
      fillOpacity: fillOpacity !== undefined ? fillOpacity : 0.3,
      strokeWeight: strokeWeight || 2,
      tags: tags || [],
      createdBy: req.user.id
    });

    await geofence.save();

    res.status(201).json({
      success: true,
      message: 'Geofence created successfully',
      data: geofence
    });
  } catch (error) {
    console.error('Error creating geofence:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating geofence',
      error: error.message
    });
  }
});

// Update a geofence
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      coordinates,
      type,
      center,
      radius,
      color,
      fillColor,
      fillOpacity,
      strokeWeight,
      tags,
      isActive
    } = req.body;

    const geofence = await Geofence.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    // Update fields
    if (name !== undefined) geofence.name = name;
    if (description !== undefined) geofence.description = description;
    if (coordinates !== undefined) geofence.coordinates = coordinates;
    if (type !== undefined) geofence.type = type;
    if (center !== undefined) geofence.center = center;
    if (radius !== undefined) geofence.radius = radius;
    if (color !== undefined) geofence.color = color;
    if (fillColor !== undefined) geofence.fillColor = fillColor;
    if (fillOpacity !== undefined) geofence.fillOpacity = fillOpacity;
    if (strokeWeight !== undefined) geofence.strokeWeight = strokeWeight;
    if (tags !== undefined) geofence.tags = tags;
    if (isActive !== undefined) geofence.isActive = isActive;

    await geofence.save();

    res.json({
      success: true,
      message: 'Geofence updated successfully',
      data: geofence
    });
  } catch (error) {
    console.error('Error updating geofence:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating geofence',
      error: error.message
    });
  }
});

// Delete a geofence (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const geofence = await Geofence.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    geofence.isActive = false;
    await geofence.save();

    res.json({
      success: true,
      message: 'Geofence deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting geofence:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting geofence',
      error: error.message
    });
  }
});

// Check if a point is inside any geofence
router.post('/check-point', authenticateToken, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const geofences = await Geofence.find({
      createdBy: req.user.id,
      isActive: true
    });

    const containingGeofences = geofences.filter(geofence => 
      geofence.containsPoint(lat, lng)
    );

    res.json({
      success: true,
      data: {
        point: { lat, lng },
        isInside: containingGeofences.length > 0,
        geofences: containingGeofences,
        count: containingGeofences.length
      }
    });
  } catch (error) {
    console.error('Error checking point:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking point',
      error: error.message
    });
  }
});

// Get geofences by tags
router.get('/tags/:tag', authenticateToken, async (req, res) => {
  try {
    const tag = req.params.tag;
    const geofences = await Geofence.find({
      createdBy: req.user.id,
      isActive: true,
      tags: { $in: [tag] }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: geofences,
      count: geofences.length,
      tag
    });
  } catch (error) {
    console.error('Error fetching geofences by tag:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching geofences by tag',
      error: error.message
    });
  }
});

module.exports = router;