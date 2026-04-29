const AdvocateCategory = require('../../models/AdvocateCategory');

// ---------------------------------------------------------------------------
// HELPER: Build a nested tree from a flat list
// ---------------------------------------------------------------------------
const buildTree = (items, parentId = null) => {
  return items
    .filter(item => {
      const itemParent = item.parent ? item.parent.toString() : null;
      const target = parentId ? parentId.toString() : null;
      return itemParent === target;
    })
    .sort((a, b) => a.order - b.order)
    .map(item => ({
      ...item.toObject(),
      children: buildTree(items, item._id)
    }));
};

// ---------------------------------------------------------------------------
// @desc    Create a Category or Subcategory
// @route   POST /api/admin/categories
// @body    { name, description?, parent?, order?, slug? }
//          parent: ObjectId of parent category — omit for top-level
// ---------------------------------------------------------------------------
exports.createCategory = async (req, res) => {
  try {
    const { name, description, parent, order, slug } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    // If a parent is specified, validate it exists
    if (parent) {
      const parentExists = await AdvocateCategory.findById(parent);
      if (!parentExists) {
        return res.status(404).json({ success: false, message: 'Parent category not found' });
      }
    }

    const category = await AdvocateCategory.create({
      name,
      description: description || null,
      parent: parent || null,
      order: order || 0,
      slug: slug || undefined // auto-generated in pre-save if not provided
    });

    res.status(201).json({
      success: true,
      message: parent ? 'Subcategory created successfully' : 'Category created successfully',
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A category with this slug already exists. Provide a unique slug.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get Full Category Tree (nested)
// @route   GET /api/admin/categories
// @query   flat=true (returns flat list instead of tree)
// ---------------------------------------------------------------------------
exports.getCategories = async (req, res) => {
  try {
    const { flat } = req.query;

    const categories = await AdvocateCategory.find({ isActive: true });

    if (flat === 'true') {
      return res.status(200).json({ success: true, count: categories.length, data: categories });
    }

    const tree = buildTree(categories);
    res.status(200).json({ success: true, count: tree.length, data: tree });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get a Single Category with its Direct Subcategories
// @route   GET /api/admin/categories/:id
// ---------------------------------------------------------------------------
exports.getCategoryById = async (req, res) => {
  try {
    const category = await AdvocateCategory.findById(req.params.id).populate('parent', 'name slug');
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const subcategories = await AdvocateCategory.find({ parent: category._id, isActive: true }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        subcategories
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Update a Category
// @route   PATCH /api/admin/categories/:id
// @body    { name?, description?, parent?, order?, isActive?, slug? }
// ---------------------------------------------------------------------------
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, parent, order, isActive, slug } = req.body;

    // Prevent circular reference (category cannot be its own parent)
    if (parent && parent.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'A category cannot be its own parent' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (parent !== undefined) updates.parent = parent || null;
    if (order !== undefined) updates.order = order;
    if (isActive !== undefined) updates.isActive = isActive;
    if (slug !== undefined) updates.slug = slug;

    const category = await AdvocateCategory.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    res.status(200).json({ success: true, message: 'Category updated', data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Slug already exists. Choose a different one.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Delete a Category (soft delete — sets isActive: false)
//          Also deactivates all child subcategories
// @route   DELETE /api/admin/categories/:id
// ---------------------------------------------------------------------------
exports.deleteCategory = async (req, res) => {
  try {
    const category = await AdvocateCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Soft-delete the category itself
    category.isActive = false;
    await category.save();

    // Soft-delete all direct and indirect children recursively
    const deactivateChildren = async (parentId) => {
      const children = await AdvocateCategory.find({ parent: parentId });
      for (const child of children) {
        child.isActive = false;
        await child.save();
        await deactivateChildren(child._id);
      }
    };
    await deactivateChildren(category._id);

    res.status(200).json({ success: true, message: 'Category and its subcategories deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
