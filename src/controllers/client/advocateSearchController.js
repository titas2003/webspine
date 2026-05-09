const Advocate = require('../../models/Advocates');
const AdvocateCategory = require('../../models/AdvocateCategory');

// ---------------------------------------------------------------------------
// Safe projection — fields visible to clients in search results
// ---------------------------------------------------------------------------
const SAFE_PROJECTION = {
  advId: 1,
  name: 1,
  photo: 1,
  state: 1,
  yearsOfExperience: 1,
  feesPerSitting: 1,
  clientContribution: 1,
  courtDivision: 1,
  specialization: 1,
  address: 1,
  location: 1
};

// Fields to never return
const EXCLUDE_FIELDS = [
  'password', 'panNumber', 'aadharNumber', 'enrollmentNumber',
  'barId', 'verificationDocs', 'platformCharge', 'advocateContribution'
];

// ---------------------------------------------------------------------------
// HELPER: Resolve a slug OR ObjectId string to an ObjectId
// ---------------------------------------------------------------------------
const resolveCategory = async (value) => {
  if (!value) return null;

  // If it looks like a valid Mongo ObjectId, use it directly
  if (/^[0-9a-fA-F]{24}$/.test(value)) return value;

  // Otherwise, treat as slug
  const cat = await AdvocateCategory.findOne({
    slug: value.toLowerCase(),
    isActive: true
  });
  return cat ? cat._id : null;
};

// ---------------------------------------------------------------------------
// @desc    Search / filter advocates (authenticated clients & admins)
// @route   GET /api/user/advocates/search   (client — Verified only)
//          GET /api/admin/advocates/search   (admin — all statuses)
// @query   lat, lng, radius, specialization, court, name, minFee, maxFee,
//          page, limit, sortBy, vStatus (admin only)
// @access  Protected (client or admin)
// ---------------------------------------------------------------------------
exports.searchAdvocates = async (req, res) => {
  try {
    const {
      lat, lng, radius,
      specialization, court,
      name,
      minFee, maxFee,
      page: rawPage, limit: rawLimit,
      sortBy,
      vStatus: queryVStatus
    } = req.query;

    // Detect caller role: admin middleware sets req.admin, client sets req.user
    const isAdmin = !!req.admin;

    // -----------------------------------------------------------------------
    // 1. Pagination
    // -----------------------------------------------------------------------
    const page  = Math.max(parseInt(rawPage, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 20, 1), 50);
    const skip  = (page - 1) * limit;

    // -----------------------------------------------------------------------
    // 2. Build match filter
    // -----------------------------------------------------------------------
    const match = {};

    if (isAdmin) {
      // Admin can optionally filter by vStatus; if omitted, show all
      if (queryVStatus && ['Pending', 'Verified', 'Rejected'].includes(queryVStatus)) {
        match.vStatus = queryVStatus;
      }
    } else {
      // Clients can only see Verified advocates
      match.vStatus = 'Verified';
    }

    // Name — case-insensitive partial match
    if (name) {
      match.name = { $regex: name, $options: 'i' };
    }

    // Specialization (ObjectId or slug)
    if (specialization) {
      const specId = await resolveCategory(specialization);
      if (!specId) {
        return res.status(200).json({
          success: true,
          message: 'No advocates found for the given specialization',
          count: 0, page, totalPages: 0, data: []
        });
      }
      match.specialization = specId;
    }

    // Court Division (ObjectId or slug)
    if (court) {
      const courtId = await resolveCategory(court);
      if (!courtId) {
        return res.status(200).json({
          success: true,
          message: 'No advocates found for the given court',
          count: 0, page, totalPages: 0, data: []
        });
      }
      match.courtDivision = courtId;
    }

    // Fee range
    if (minFee || maxFee) {
      match.feesPerSitting = {};
      if (minFee) match.feesPerSitting.$gte = Number(minFee);
      if (maxFee) match.feesPerSitting.$lte = Number(maxFee);
    }

    // -----------------------------------------------------------------------
    // 3. Geo search vs regular search
    // -----------------------------------------------------------------------
    const hasGeo = lat && lng;

    if (hasGeo) {
      // ------ Aggregation with $geoNear (must be first pipeline stage) ------
      const radiusKm    = Number(radius) || 50;
      const radiusMetres = radiusKm * 1000;

      const pipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [Number(lng), Number(lat)]
            },
            distanceField: 'distance',          // metres
            maxDistance: radiusMetres,
            spherical: true,
            query: match                        // additional filters
          }
        },
        // Project safe fields + distance (admin also sees vStatus)
        {
          $project: {
            ...SAFE_PROJECTION,
            ...(isAdmin ? { vStatus: 1 } : {}),
            distance: 1
          }
        }
      ];

      // Sorting
      if (sortBy === 'fee_asc') {
        pipeline.push({ $sort: { feesPerSitting: 1 } });
      } else if (sortBy === 'fee_desc') {
        pipeline.push({ $sort: { feesPerSitting: -1 } });
      } else if (sortBy === 'name_asc') {
        pipeline.push({ $sort: { name: 1 } });
      } else {
        // Default: nearest first
        pipeline.push({ $sort: { distance: 1 } });
      }

      // Count total before pagination (facet)
      pipeline.push({
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      });

      const [result] = await Advocate.aggregate(pipeline);

      const total      = result.metadata[0]?.total || 0;
      const totalPages = Math.ceil(total / limit);

      // Populate category names on the plain objects
      let advocates = result.data;
      advocates = await Advocate.populate(advocates, [
        { path: 'courtDivision',  select: 'name slug' },
        { path: 'specialization', select: 'name slug' }
      ]);

      // Convert distance to km for readability
      advocates = advocates.map(a => ({
        ...a,
        distanceKm: a.distance ? +(a.distance / 1000).toFixed(2) : null
      }));

      return res.status(200).json({
        success: true,
        count: advocates.length,
        page,
        totalPages,
        totalResults: total,
        data: advocates
      });
    }

    // ------ Regular find (no geo) ------

    // Total count for pagination
    const total      = await Advocate.countDocuments(match);
    const totalPages = Math.ceil(total / limit);

    // Sort
    let sort = { name: 1 };  // default alphabetical
    if (sortBy === 'fee_asc')  sort = { feesPerSitting: 1 };
    if (sortBy === 'fee_desc') sort = { feesPerSitting: -1 };
    if (sortBy === 'name_asc') sort = { name: 1 };

    // Admin sees vStatus; client does not
    const selectFields = Object.keys(SAFE_PROJECTION).join(' ') + (isAdmin ? ' vStatus' : '');

    const advocates = await Advocate.find(match)
      .select(selectFields)
      .populate('courtDivision',  'name slug')
      .populate('specialization', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: advocates.length,
      page,
      totalPages,
      totalResults: total,
      data: advocates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
