require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdminAccount = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const adminExists = await User.findOne({ email: 'businessadmin@musrecbms.com' });
    
    if (adminExists) {
      console.log('Admin account already exists');
      process.exit(0);
    }

    await User.create({
      username: 'admin',
      email: 'businessadmin@musrecbms.com',
      password: 'adminpassword',
      nationalId: 'ADMIN001',
      dateOfBirth: new Date('1990-01-01'),
      role: 'admin'
    });

    console.log('Admin account created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin account:', error);
    process.exit(1);
  }
};

createAdminAccount();