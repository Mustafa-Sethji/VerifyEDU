const prisma = require('../config/db');
const aiService = require('../services/aiService');

// @desc    Upload PDF study material & process with AI microservice
// @route   POST /api/documents/upload
const uploadDocument = async (req, res) => {
  try {
    const { classroomId } = req.body;
    const file = req.file;

    if (!classroomId) {
      return res.status(400).json({ message: 'classroomId is required.' });
    }

    if (!file) {
      return res.status(400).json({ message: 'No PDF file uploaded.' });
    }

    // Verify classroom existence
    const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found.' });
    }

    // Send file to AI microservice
    console.log(`Processing PDF "${file.originalname}" with AI Service...`);
    const aiResult = await aiService.processPdf(file.path, file.originalname);

    const { document_id, summary, keywords } = aiResult;

    // Save document details in SQLite database
    const docRecord = await prisma.document.create({
      data: {
        classroomId,
        uploadedBy: req.user.id,
        documentName: file.originalname,
        aiDocumentId: document_id,
        filePath: `/uploads/${file.filename}`,
        summary: summary || '',
        keywords: Array.isArray(keywords) ? JSON.stringify(keywords) : (keywords || ''),
      },
      include: {
        uploader: { select: { id: true, name: true, email: true } },
      },
    });

    // Record activity
    await prisma.history.create({
      data: {
        userId: req.user.id,
        action: 'DOCUMENT_UPLOADED',
        details: `Uploaded study material "${file.originalname}" to classroom "${classroom.name}"`,
      },
    });

    return res.status(201).json({
      message: 'PDF document uploaded and processed by AI successfully!',
      document: docRecord,
      aiResult,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ message: error.message || 'Failed to upload/process document.' });
  }
};

// @desc    Get all documents for a classroom
// @route   GET /api/documents/classroom/:classroomId
const getClassroomDocuments = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const documents = await prisma.document.findMany({
      where: { classroomId },
      include: {
        uploader: { select: { id: true, name: true, email: true } },
      },
      orderBy: { uploadDate: 'desc' },
    });

    return res.status(200).json(documents);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching documents.', error: error.message });
  }
};

// @desc    Get single document details
// @route   GET /api/documents/:id
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, name: true } },
        classroom: { select: { id: true, name: true } },
      },
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    return res.status(200).json(document);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching document.', error: error.message });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    await prisma.document.delete({ where: { id } });

    return res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting document.', error: error.message });
  }
};

module.exports = {
  uploadDocument,
  getClassroomDocuments,
  getDocumentById,
  deleteDocument,
};
