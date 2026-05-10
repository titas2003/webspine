const AdvocateCategory = require('../../models/AdvocateCategory');

/**
 * @desc    Fetch all advocate categories
 * @route   GET /api/common/categories
 * @access  Public
 */
const getAllCategories = async (req, res) => {
  try {
    const categories = await AdvocateCategory.find({}).sort({ order: 1, name: 1 });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error(`Error in getAllCategories: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

module.exports = {
  getAllCategories
};
