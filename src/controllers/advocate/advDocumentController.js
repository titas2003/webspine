const Document = require('../../models/Document');
const Appointment = require('../../models/Appointment');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// @desc    List documents by category
// @route   GET /api/advocate/documents?category=my_docs&clientId=&appointmentId=
// ---------------------------------------------------------------------------
exports.listDocuments = async (req, res) => {
  try {
    const { category, clientId, appointmentId } = req.query;

    const filter = { advocateId: req.user._id };
    if (category) filter.category = category;
    if (clientId) filter.clientId = clientId;
    if (appointmentId) filter.appointmentId = appointmentId;

    const docs = await Document.find(filter)
      .populate('clientId', 'name email')
      .populate('appointmentId', 'scheduledAt status meetingType')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: docs.length, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Upload a file document
// @route   POST /api/advocate/documents/upload
// @body    FormData: file + title + category + clientId? + appointmentId?
// ---------------------------------------------------------------------------
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title, category, clientId, appointmentId } = req.body;

    if (!title || !category) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'title and category are required' });
    }

    const validCategories = ['my_docs', 'client_docs', 'generic'];
    if (!validCategories.includes(category)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: `category must be one of: ${validCategories.join(', ')}` });
    }

    // If client_docs, clientId is required
    if (category === 'client_docs' && !clientId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'clientId is required for client_docs' });
    }

    // If appointmentId provided, validate it belongs to this advocate
    if (appointmentId) {
      const appt = await Appointment.findOne({ _id: appointmentId, advocateId: req.user._id });
      if (!appt) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: 'Appointment not found or does not belong to you' });
      }
    }

    const doc = await Document.create({
      advocateId: req.user._id,
      category,
      title: title.trim(),
      clientId: clientId || null,
      appointmentId: appointmentId || null,
      filePath: req.file.path,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    res.status(201).json({ success: true, message: 'Document uploaded successfully', data: doc });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Create or update a text note
// @route   POST /api/advocate/documents/note
// @body    { title, content, clientId?, appointmentId?, noteId? }
//          If noteId is provided → update that note, else create new.
// ---------------------------------------------------------------------------
exports.saveNote = async (req, res) => {
  try {
    const { title, content, clientId, appointmentId, noteId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'title and content are required' });
    }

    // If appointmentId provided, validate ownership
    if (appointmentId) {
      const appt = await Appointment.findOne({ _id: appointmentId, advocateId: req.user._id });
      if (!appt) {
        return res.status(404).json({ success: false, message: 'Appointment not found or does not belong to you' });
      }
    }

    let note;
    if (noteId) {
      // Update existing note
      note = await Document.findOneAndUpdate(
        { _id: noteId, advocateId: req.user._id, category: 'note' },
        { title: title.trim(), content, clientId: clientId || null, appointmentId: appointmentId || null },
        { new: true }
      );
      if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    } else {
      // Create new note
      note = await Document.create({
        advocateId: req.user._id,
        category: 'note',
        title: title.trim(),
        content,
        clientId: clientId || null,
        appointmentId: appointmentId || null
      });
    }

    res.status(200).json({ success: true, message: 'Note saved successfully', data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get a single document's metadata
// @route   GET /api/advocate/documents/:id
// ---------------------------------------------------------------------------
exports.getDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, advocateId: req.user._id })
      .populate('clientId', 'name email')
      .populate('appointmentId', 'scheduledAt status meetingType');

    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Download / stream a file document
// @route   GET /api/advocate/documents/:id/download
// ---------------------------------------------------------------------------
exports.downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, advocateId: req.user._id });
    if (!doc || !doc.filePath) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const absolutePath = path.resolve(doc.filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'File missing on server' });
    }

    res.download(absolutePath, doc.originalName || path.basename(absolutePath));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Delete a document (file or note)
// @route   DELETE /api/advocate/documents/:id
// ---------------------------------------------------------------------------
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format first
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID' });
    }

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Ensure the advocate owns this document
    if (doc.advocateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this document' });
    }

    // Delete physical file if it exists
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      try { fs.unlinkSync(doc.filePath); } catch (_) {}
    }

    await doc.deleteOne();

    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get list of clients who had appointments with this advocate
//          (Used to populate the Client Docs folder view)
// @route   GET /api/advocate/documents/clients
// ---------------------------------------------------------------------------
exports.getMyClients = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      advocateId: req.user._id,
      status: { $in: ['accepted', 'completed'] }
    })
      .populate('clientId', 'name email phone')
      .sort({ scheduledAt: -1 });

    // Deduplicate clients
    const seen = new Set();
    const clients = [];
    for (const appt of appointments) {
      if (appt.clientId && !seen.has(String(appt.clientId._id))) {
        seen.add(String(appt.clientId._id));
        clients.push(appt.clientId);
      }
    }

    res.status(200).json({ success: true, count: clients.length, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get appointments for this advocate (for dropdown selection in forms)
// @route   GET /api/advocate/documents/appointments
// ---------------------------------------------------------------------------
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      advocateId: req.user._id,
      status: { $in: ['accepted', 'completed'] }
    })
      .populate('clientId', 'name')
      .select('scheduledAt status meetingType notes clientId')
      .sort({ scheduledAt: -1 });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
