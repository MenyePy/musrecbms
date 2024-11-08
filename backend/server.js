const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const emailService = require('./services/EmailService');
require('dotenv').config();

const app = express();
const corsOptions = {
  origin: ['https://musrecbms.vercel.app', 'http://192.168.5.170:3000'], // specify allowed origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

app.use('/uploads', express.static('uploads'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/user-reports', require('./routes/userReport'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/revenue', require('./routes/revenue'));
app.use('/api/locations', require('./routes/location'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/business', require('./routes/business'));

app.get("/", (req, res) => {
  res.json("MUSREC Business Management System Backend (API)");
});

// if(process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "/frontend/build")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
//   })
// }

emailService.scheduleNotifications();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
