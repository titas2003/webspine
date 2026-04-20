const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const advocateRoutes = require('./routes/advocateRoutes');
const userRoutes = require('./routes/clientRoutes');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

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

app.use('/api/advocate', advocateRoutes); // New route path

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));