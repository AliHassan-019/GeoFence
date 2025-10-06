const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/geofence_app');
    console.log('Connected to MongoDB');

    // Get the Geofence collection
    const db = mongoose.connection.db;
    const collection = db.collection('geofences');

    // Get current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Drop any index on coordinates field
    try {
      await collection.dropIndex('coordinates_2dsphere');
      console.log('Dropped old coordinates_2dsphere index');
    } catch (error) {
      console.log('No coordinates_2dsphere index to drop:', error.message);
    }

    // Ensure geometry index exists
    try {
      await collection.createIndex({ geometry: '2dsphere' });
      console.log('Created geometry_2dsphere index');
    } catch (error) {
      console.log('Geometry index already exists or error:', error.message);
    }

    // Get updated indexes
    const updatedIndexes = await collection.indexes();
    console.log('Updated indexes:', JSON.stringify(updatedIndexes, null, 2));

    console.log('Index fix completed successfully');
  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixIndexes();