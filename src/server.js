const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const advocateRoutes = require('./routes/advocateRoutes');
const userRoutes = require('./routes/clientRoutes');
const adminRoutes = require('./routes/adminRoutes');
const commonRoutes = require('./routes/commonRoutes');
const path = require('path');

connectDB();
require('./utils/cronJobs'); // Initialize cron jobs

const app = express();

// Secure HTTP Headers
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allow serving images from /uploads to frontend

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// Stripe Webhook needs raw body, not JSON
const paymentController = require('./controllers/paymentController');
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/test', (req, res) => {
  res.send('🔥 Backend reachable');
});
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'))); 
app.use('/api/user', userRoutes); 

app.use('/api/advocate', advocateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/common', commonRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));