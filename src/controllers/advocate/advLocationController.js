const Advocate = require('../../models/Advocates');

// ---------------------------------------------------------------------------
// @desc    Update advocate's GPS location
// @route   PATCH /api/advocate/location
// @body    { latitude, longitude, address? }
// @access  Protected (advocate)
// ---------------------------------------------------------------------------
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Both latitude and longitude are required'
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }

    const updates = {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]   // GeoJSON: [lng, lat]
      }
    };

    if (address !== undefined) {
      updates.address = address;
    }

    const advocate = await Advocate.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('advId name location address');

    if (!advocate) {
      return res.status(404).json({
        success: false,
        message: 'Advocate not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        advId: advocate.advId,
        location: advocate.location,
        address: advocate.address
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
