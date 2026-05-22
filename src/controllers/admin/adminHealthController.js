const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { verifyMailer } = require('../../utils/mailer');

/**
 * Helper to calculate directory size recursively
 */
const getDirSize = async (dirPath) => {
  let size = 0;
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += await getDirSize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        size += stats.size;
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error reading dir size for ${dirPath}:`, err);
    }
  }
  return size;
};

/**
 * Format bytes to readable string
 */
const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * @desc    Get complete system health and details
 * @route   GET /api/admin/system/health
 * @access  Protected (Admin only)
 */
exports.getSystemHealth = async (req, res) => {
  try {
    // 1. Spine Core API Health
    // We can hardcode the core route prefixes since we know the architecture
    const apiHealth = {
      status: 'operational',
      routes: [
        { path: '/api/admin', module: 'Admin Management', status: 'Active' },
        { path: '/api/user', module: 'Client Services', status: 'Active' },
        { path: '/api/advocate', module: 'Advocate Services', status: 'Active' },
        { path: '/api/common', module: 'Shared Services', status: 'Active' }
      ]
    };

    // 2. MongoDB Cluster Health
    let dbHealth = { status: 'down', details: null };
    if (mongoose.connection.readyState === 1) { // connected
      const stats = await mongoose.connection.db.stats();
      dbHealth = {
        status: 'operational',
        details: {
          dataSize: formatBytes(stats.dataSize),
          storageSize: formatBytes(stats.storageSize),
          collections: stats.collections,
          objects: stats.objects,
          indexes: stats.indexes
        }
      };
    }

    // 3. Media Storage Health
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const storageSizeBytes = await getDirSize(uploadsDir);
    const storageHealth = {
      status: 'operational',
      details: {
        totalSize: formatBytes(storageSizeBytes),
        path: '/uploads',
        // Example "free space" or quota logic (simulated for UI purposes since we don't track server disk space easily without native bindings)
        quota: '50 GB',
        usagePercentage: storageSizeBytes > 0 ? ((storageSizeBytes / (50 * 1024 * 1024 * 1024)) * 100).toFixed(2) + '%' : '0%'
      }
    };

    // 4. Notification Engine Health
    const mailStatus = await verifyMailer();
    const mailHealth = {
      status: mailStatus.success ? 'operational' : 'down',
      details: {
        provider: 'Nodemailer (Gmail)',
        email: mailStatus.email || 'Not configured',
        error: mailStatus.error || null
      }
    };

    res.status(200).json({
      success: true,
      data: {
        api: apiHealth,
        db: dbHealth,
        storage: storageHealth,
        mail: mailHealth
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
