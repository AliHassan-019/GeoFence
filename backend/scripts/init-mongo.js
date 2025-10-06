// MongoDB initialization script for Docker
db = db.getSiblingDB('geofence');

// Create collections
db.createCollection('users');
db.createCollection('sessions');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "googleId": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "createdAt": 1 });
db.users.createIndex({ "lastLogin": 1 });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });

db.sessions.createIndex({ "expires": 1 }, { expireAfterSeconds: 0 });
db.sessions.createIndex({ "session.userId": 1 });

print('Database initialized successfully with collections and indexes');