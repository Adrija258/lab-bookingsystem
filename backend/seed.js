/**
 * Database Seeder
 * Populates the database with sample data for testing
 * Run: node seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Models
const User = require('./models/User');
const Equipment = require('./models/Equipment');
const Booking = require('./models/Booking');

// ========================
// SAMPLE DATA
// ========================

const users = [
  {
    name: 'Admin User',
    email: 'admin@lab.com',
    password: 'Lab@Admin2026',
    role: 'admin'
  },
  {
    name: 'Alice Johnson',
    email: 'student@lab.com',
    password: 'Lab@Student2026',
    role: 'student'
  },
  {
    name: 'Bob Smith',
    email: 'bob@lab.com',
    password: 'Lab@Student2026',
    role: 'student'
  },
  {
    name: 'Carol Davis',
    email: 'carol@lab.com',
    password: 'Lab@Student2026',
    role: 'student'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Equipment.deleteMany({});
    await Booking.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const createdUsers = await User.create(users);
    const admin = createdUsers.find(u => u.role === 'admin');
    const students = createdUsers.filter(u => u.role === 'student');
    console.log(`👤 Created ${createdUsers.length} users`);

    // Equipment data
    const equipmentData = [
      {
        name: 'Digital Oscilloscope',
        description: 'Tektronix 2-channel digital storage oscilloscope. Bandwidth: 100 MHz. Used for measuring electrical signals and waveforms.',
        category: 'Electronics',
        quantity: 3,
        availability: true,
        location: 'Electronics Lab A',
        addedBy: admin._id
      },
      {
        name: 'Gas Chromatograph',
        description: 'Agilent GC system for separating and analyzing compounds in a gas mixture. Essential for organic chemistry experiments.',
        category: 'Chemistry',
        quantity: 2,
        availability: true,
        location: 'Chemistry Lab B',
        addedBy: admin._id
      },
      {
        name: 'Fluorescence Microscope',
        description: 'Olympus fluorescence microscope with UV light source. Magnification up to 1000x. Suitable for cell biology research.',
        category: 'Biology',
        quantity: 2,
        availability: true,
        location: 'Biology Lab C',
        addedBy: admin._id
      },
      {
        name: 'Signal Generator',
        description: 'Function/arbitrary waveform generator. Frequency range: 1 μHz to 30 MHz. Outputs: sine, square, ramp, pulse.',
        category: 'Electronics',
        quantity: 5,
        availability: true,
        location: 'Electronics Lab A',
        addedBy: admin._id
      },
      {
        name: 'Centrifuge',
        description: 'High-speed refrigerated centrifuge. Max speed: 20,000 RPM. Temperature range: -10°C to +40°C.',
        category: 'Biology',
        quantity: 3,
        availability: true,
        location: 'Biology Lab C',
        addedBy: admin._id
      },
      {
        name: 'Laser Diffraction System',
        description: 'Optical diffraction apparatus for measuring the wavelength of light and studying wave properties.',
        category: 'Physics',
        quantity: 4,
        availability: true,
        location: 'Physics Lab D',
        addedBy: admin._id
      },
      {
        name: 'Raspberry Pi Cluster',
        description: 'Cluster of 8 Raspberry Pi 4 units for parallel computing experiments, OS development, and IoT projects.',
        category: 'Computer',
        quantity: 2,
        availability: true,
        location: 'Computer Lab E',
        addedBy: admin._id
      },
      {
        name: 'Spectrophotometer',
        description: 'UV-Vis spectrophotometer for measuring light absorbance. Wavelength range: 190-1100 nm.',
        category: 'Chemistry',
        quantity: 2,
        availability: false,
        location: 'Chemistry Lab B',
        addedBy: admin._id
      },
      {
        name: 'Universal Testing Machine',
        description: 'Tensile and compression testing machine. Max load capacity: 100 kN. Used for material strength testing.',
        category: 'Mechanical',
        quantity: 1,
        availability: true,
        location: 'Mechanical Lab F',
        addedBy: admin._id
      },
      {
        name: 'PCR Thermal Cycler',
        description: 'Polymerase Chain Reaction machine for DNA amplification. 96-well block. Gradient function supported.',
        category: 'Biology',
        quantity: 2,
        availability: true,
        location: 'Biology Lab C',
        addedBy: admin._id
      }
    ];

    const createdEquipment = await Equipment.create(equipmentData);
    console.log(`🔬 Created ${createdEquipment.length} equipment items`);

    // Sample bookings
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const bookings = [
      {
        userId: students[0]._id,
        equipmentId: createdEquipment[0]._id,
        date: tomorrow,
        timeSlot: '09:00-10:00',
        status: 'pending',
        purpose: 'Measuring voltage across RC circuit for Electronics lab report'
      },
      {
        userId: students[0]._id,
        equipmentId: createdEquipment[2]._id,
        date: tomorrow,
        timeSlot: '11:00-12:00',
        status: 'approved',
        purpose: 'Cell imaging for microbiology project',
        adminNote: 'Approved. Please handle with care.'
      },
      {
        userId: students[1]._id,
        equipmentId: createdEquipment[1]._id,
        date: tomorrow,
        timeSlot: '14:00-15:00',
        status: 'pending',
        purpose: 'Organic compound analysis for thesis'
      },
      {
        userId: students[1]._id,
        equipmentId: createdEquipment[5]._id,
        date: dayAfter,
        timeSlot: '10:00-11:00',
        status: 'approved',
        purpose: 'Wavelength measurement experiment',
        adminNote: 'Approved for Physics project.'
      },
      {
        userId: students[2]._id,
        equipmentId: createdEquipment[4]._id,
        date: dayAfter,
        timeSlot: '13:00-14:00',
        status: 'rejected',
        purpose: 'Sample separation',
        adminNote: 'Slot already reserved for maintenance.'
      }
    ];

    await Booking.create(bookings);
    console.log(`📅 Created ${bookings.length} sample bookings`);

    console.log('\n✨ ===========================');
    console.log('   DATABASE SEEDED SUCCESSFULLY');
    console.log('   ===========================');
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('   Admin:   admin@lab.com   / Lab@Admin2026');
    console.log('   Student: student@lab.com / Lab@Student2026');
    console.log('   Student: bob@lab.com     / Lab@Student2026');
    console.log('\n🚀 Start the server: npm run dev\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedDB();
