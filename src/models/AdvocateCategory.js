const mongoose = require('mongoose');

/**
 * @desc  AdvocateCategory
 * Self-referencing tree model for dynamic advocate court categories.
 * Top-level categories have parent = null.
 * Subcategories reference their parent by ObjectId.
 *
 * Example tree:
 *   Lower / Divisional Court  (parent: null)
 *     ├── Civil Court          (parent: <above _id>)
 *     └── Criminal Court       (parent: <above _id>)
 *   High Court                 (parent: null)
 *     └── Division Bench       (parent: <above _id>)
 */
const advocateCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: null
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdvocateCategory',
    default: null,   // null = top-level category
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0       // For display ordering within the same level
  }
}, {
  timestamps: true,
  collection: 'AdvocateCategories'
});

// Auto-generate slug from name before saving if not provided
advocateCategorySchema.pre('save', async function () {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }
});

module.exports = mongoose.model('AdvocateCategory', advocateCategorySchema);
