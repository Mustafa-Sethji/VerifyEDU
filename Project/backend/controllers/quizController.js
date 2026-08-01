const prisma = require('../config/db');
const aiService = require('../services/aiService');

// @desc    Generate a new quiz from a document using AI microservice
// @route   POST /api/quizzes/generate
const generateQuiz = async (req, res) => {
  try {
    const { classroomId, documentId, title, numMcq = 5, numDescriptive = 2 } = req.body;

    if (!classroomId || !documentId) {
      return res.status(400).json({ message: 'classroomId and documentId are required.' });
    }

    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    console.log(`Generating quiz via AI for document "${document.documentName}" (AI ID: ${document.aiDocumentId})...`);
    
    // Call AI Microservice
    const aiQuizData = await aiService.generateQuiz(
      document.aiDocumentId,
      parseInt(numMcq, 10),
      parseInt(numDescriptive, 10)
    );

    const quizTitle = title || `Quiz on ${document.documentName}`;

    // Save Quiz in Database
    const newQuiz = await prisma.quiz.create({
      data: {
        classroomId,
        documentId,
        title: quizTitle,
        createdBy: req.user.id,
        numMcq: parseInt(numMcq, 10),
        numDescriptive: parseInt(numDescriptive, 10),
        questions: JSON.stringify(aiQuizData),
      },
      include: {
        creator: { select: { id: true, name: true } },
        document: { select: { id: true, documentName: true } },
      },
    });

    // Notify classroom members
    const members = await prisma.classroomMember.findMany({
      where: { classroomId },
      select: { studentId: true },
    });

    const notifications = members.map((m) => ({
      userId: m.studentId,
      title: 'New Quiz Available',
      message: `A new quiz "${quizTitle}" has been posted in your classroom.`,
      type: 'quiz',
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    // Record activity
    await prisma.history.create({
      data: {
        userId: req.user.id,
        action: 'QUIZ_GENERATED',
        details: `Generated quiz "${quizTitle}" for document "${document.documentName}"`,
      },
    });

    return res.status(201).json({
      message: 'Quiz generated successfully!',
      quiz: {
        ...newQuiz,
        questions: aiQuizData,
      },
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate quiz.' });
  }
};

// @desc    Get all quizzes for a classroom
// @route   GET /api/quizzes/classroom/:classroomId
const getClassroomQuizzes = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const quizzes = await prisma.quiz.findMany({
      where: { classroomId },
      include: {
        creator: { select: { id: true, name: true } },
        document: { select: { id: true, documentName: true } },
        attempts: {
          select: { id: true, studentId: true, score: true, maxScore: true, percentage: true, submittedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedQuizzes = quizzes.map((q) => ({
      ...q,
      questions: JSON.parse(q.questions || '{}'),
    }));

    return res.status(200).json(formattedQuizzes);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching quizzes.', error: error.message });
  }
};

// @desc    Get single quiz details
// @route   GET /api/quizzes/:id
const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        document: { select: { id: true, documentName: true, aiDocumentId: true } },
        classroom: { select: { id: true, name: true } },
        attempts: {
          where: { studentId: req.user.id },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const parsedQuestions = JSON.parse(quiz.questions || '{}');

    return res.status(200).json({
      ...quiz,
      questions: parsedQuestions,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching quiz.', error: error.message });
  }
};

module.exports = {
  generateQuiz,
  getClassroomQuizzes,
  getQuizById,
};
