// const express = require('express');
// const dotenv = require('dotenv');
// const cors = require('cors'); // ✅ ADD THIS
// const connectDB = require('./config/db');
// const authRoutes = require('./routes/authRoutes');

// dotenv.config();
// connectDB();

// const app = express();

// // ✅ CORS middleware (must be before routes)
// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true
// }));

// app.use(express.json());
// app.use('/api/auth', authRoutes);

// app.get('/test', (req, res) => {
//   res.send('Server working');
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
connectDB();

const app = express();

// ✅ CORS middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// ✅ Parse JSON
app.use(express.json());

// ✅ Test route
app.get('/test', (req, res) => {
  res.send('🔥 Backend reachable');
});

// ✅ Auth routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));