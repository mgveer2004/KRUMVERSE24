// backend/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/user');
const Game = require('./models/game');
const Tournament = require('./models/tournament');

// Sample Data
const gamesData = [
    { name: 'Valorant', genre: 'FPS', category: 'FPS', imageUrl: 'https://images.unsplash.com/photo-1624138784181-2999e46ef284?w=500', description: '5v5 Tactical Shooter' },
    { name: 'PUBG Mobile', genre: 'Battle Royale', category: 'FPS', imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500', description: 'Survival Battle Royale' },
    { name: 'CS:GO 2', genre: 'FPS', category: 'FPS', imageUrl: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=500', description: 'Classic Competitive Shooter' }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Clear existing data
        await User.deleteMany({});
        await Game.deleteMany({});
        await Tournament.deleteMany({});
        console.log('🗑️  Cleared old data');

        // 2. Create Admin User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        const adminUser = await User.create({
            username: 'SuperAdmin',
            email: 'admin@krumverse.com',
            password: hashedPassword, // Manually hashed since we might bypass schema middleware
            role: 'admin',
            emailVerified: true
        });
        console.log('👤 Admin User Created: admin@krumverse.com / admin123');

        // 3. Create Games
        const createdGames = await Game.insertMany(gamesData);
        console.log(`🎮 Created ${createdGames.length} Games`);

        // 4. Create Tournaments
        const tournamentsData = [
            {
                name: 'Valorant Winter Cup',
                game: createdGames[0]._id,
                organizer: adminUser._id,
                startDate: new Date(Date.now() + 86400000), // Tomorrow
                maxParticipants: 16,
                registrationFee: 100,
                prizePool: '₹10,000',
                status: 'open',
                description: 'The ultimate 5v5 showdown.'
            },
            {
                name: 'PUBG Survival Series',
                game: createdGames[1]._id,
                organizer: adminUser._id,
                startDate: new Date(Date.now() + 172800000), // Day after tomorrow
                maxParticipants: 100,
                registrationFee: 50,
                prizePool: '₹25,000',
                status: 'open',
                description: 'Solo survival tournament.'
            },
            {
                name: 'CS2 Free Entry',
                game: createdGames[2]._id,
                organizer: adminUser._id,
                startDate: new Date(Date.now() + 604800000), // Next week
                maxParticipants: 32,
                registrationFee: 0,
                prizePool: '₹5,000',
                status: 'open',
                description: 'Free entry for beginners.'
            }
        ];

        await Tournament.insertMany(tournamentsData);
        console.log(`🏆 Created ${tournamentsData.length} Tournaments`);

        console.log('✨ SEEDING COMPLETE! You can now start the server.');
        process.exit();

    } catch (error) {
        console.error('❌ Seeding Error:', error);
        process.exit(1);
    }
};

seedDatabase();