const prisma = require('../config/db');
const aiService = require('../services/aiService');

// @desc    Submit quiz attempt and evaluate with AI service
// @route   POST /api/quizzes/:id/submit
const submitQuizAttempt = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const { mcqAnswers = [], descriptiveAnswers = [] } = req.body;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        document: true,
        classroom: true,
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const quizQuestions = JSON.parse(quiz.questions || '{}');
    const mcqQuestions = quizQuestions.mcq || [];
    const descriptiveQuestions = quizQuestions.descriptive || [];

    let totalPoints = 0;
    let maxPoints = 0;
    const evaluations = [];
    console.log('DEBUG MCQ RAW:', JSON.stringify(mcqQuestions, null, 2));
    // 1. Evaluate Multiple Choice Questions (10 points each)
    mcqQuestions.forEach((q, idx) => {
  maxPoints += 10;
  const studentChoice = mcqAnswers[idx];

  const normalize = (s) =>
    (s || '').toString().trim().toLowerCase().replace(/[.,;:!?'"]+$/, '');

  const resolveCorrectIndex = (q) => {
    if (!q.options || !q.options.length) return -1;
    const ans = (q.correct_answer || '').toString().trim();

    // 1. Exact/normalized text match
    let i = q.options.findIndex((opt) => normalize(opt) === normalize(ans));
    if (i !== -1) return i;

    // 2. Letter-based answer: "A", "B)", "Option C", etc.
    const letterMatch = ans.match(/^\(?([A-Da-d])\)?[.:\-]?$/) || ans.match(/option\s*([A-Da-d])/i);
    if (letterMatch) {
      const letterIdx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
      if (letterIdx >= 0 && letterIdx < q.options.length) return letterIdx;
    }

    // 3. Loose containment match as a last resort
    i = q.options.findIndex(
      (opt) => normalize(opt).includes(normalize(ans)) || normalize(ans).includes(normalize(opt))
    );
    return i;
  };

  const correctIndex = resolveCorrectIndex(q);
  const isCorrect = studentChoice === correctIndex;
  const pointsEarned = isCorrect ? 10 : 0;
  totalPoints += pointsEarned;

  evaluations.push({
    type: 'mcq',
    question: q.question,
    options: q.options,
    correctOption: correctIndex,
    correctAnswerText: q.correct_answer,
    studentChoice,
    isCorrect,
    pointsEarned,
    maxPoints: 10,
    explanation: q.explanation || '',
  });
});

    // 2. Evaluate Descriptive Questions with AI service (20 points each)
    const aiDocumentId = quiz.document?.aiDocumentId;

    for (let i = 0; i < descriptiveQuestions.length; i++) {
      const q = descriptiveQuestions[i];
      const studentAns = descriptiveAnswers[i] || '';
      maxPoints += 20;

      let aiEval = {
        similarity: 0,
        keyword_score: 0,
        concept_score: 0,
        understanding_score: 0,
        feedback: 'No answer provided.',
      };

      if (studentAns.trim() && aiDocumentId) {
        try {
          aiEval = await aiService.evaluateAnswer(
            aiDocumentId,
            q.question,
            studentAns,
            q.reference_answer || q.key_concepts?.join(', ') || ''
          );
        } catch (err) {
          console.error(`AI evaluation failed for descriptive Q${i + 1}:`, err);
        }
      }

      // Calculate score based on understanding_score (0 - 100%)
      const scorePct = (aiEval.understanding_score || 0) / 100;
      const pointsEarned = parseFloat((scorePct * 20).toFixed(1));
      totalPoints += pointsEarned;

      evaluations.push({
        type: 'descriptive',
        question: q.question,
        studentAnswer: studentAns,
        referenceAnswer: q.reference_answer || '',
        keyConcepts: q.key_concepts || [],
        aiEvaluation: aiEval,
        pointsEarned,
        maxPoints: 20,
      });
    }

    const percentage = maxPoints > 0 ? parseFloat(((totalPoints / maxPoints) * 100).toFixed(1)) : 0;

    // Store Quiz Attempt in DB
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: req.user.id,
        score: totalPoints,
        maxScore: maxPoints,
        percentage,
        answers: JSON.stringify({ mcqAnswers, descriptiveAnswers }),
        evaluations: JSON.stringify(evaluations),
      },
      include: {
        quiz: { select: { title: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify teacher
    await prisma.notification.create({
      data: {
        userId: quiz.createdBy,
        title: 'Quiz Submission',
        message: `${req.user.name} completed "${quiz.title}" with a score of ${percentage}%.`,
        type: 'result',
      },
    });

    // Record activity
    await prisma.history.create({
      data: {
        userId: req.user.id,
        action: 'QUIZ_ATTEMPTED',
        details: `Completed quiz "${quiz.title}" - Score: ${percentage}%`,
      },
    });

    return res.status(201).json({
      message: 'Quiz submitted and evaluated successfully!',
      attemptId: attempt.id,
      score: totalPoints,
      maxScore: maxPoints,
      percentage,
      evaluations,
    });
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    return res.status(500).json({ message: 'Failed to submit quiz attempt.', error: error.message });
  }
};

// @desc    Get detailed result for a specific attempt
// @route   GET /api/results/attempt/:attemptId
const getAttemptResult = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            classroom: { select: { id: true, name: true } },
            document: { select: { id: true, documentName: true } },
          },
        },
        student: { select: { id: true, name: true, email: true, profileImage: true } },
      },
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt result not found.' });
    }

    return res.status(200).json({
      ...attempt,
      answers: JSON.parse(attempt.answers || '{}'),
      evaluations: JSON.parse(attempt.evaluations || '[]'),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching quiz attempt result.', error: error.message });
  }
};

// @desc    Get user's previous attempts
// @route   GET /api/results/my-attempts
const getMyAttempts = async (req, res) => {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId: req.user.id },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            classroom: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return res.status(200).json(attempts);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching attempt history.', error: error.message });
  }
};

module.exports = {
  submitQuizAttempt,
  getAttemptResult,
  getMyAttempts,
};



