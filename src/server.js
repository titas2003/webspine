const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const advocateRoutes = require('./routes/advocateRoutes');
const userRoutes = require('./routes/clientRoutes');
const adminRoutes = require('./routes/adminRoutes');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

// Secure HTTP Headers
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allow serving images from /uploads to frontend

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/test', (req, res) => {
  res.send('🔥 Backend reachable');
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 
app.use('/api/user', userRoutes); 

app.use('/api/advocate', advocateRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));