const prisma = require('../config/db');
const { generateClassroomCode } = require('../utils/codeGenerator');

// @desc    Create a new classroom (Teacher only)
// @route   POST /api/classrooms
const createClassroom = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Classroom name is required.' });
    }

    // Generate unique classroom code
    let code = generateClassroomCode();
    let existing = await prisma.classroom.findUnique({ where: { code } });
    while (existing) {
      code = generateClassroomCode();
      existing = await prisma.classroom.findUnique({ where: { code } });
    }

    const classroom = await prisma.classroom.create({
      data: {
        name,
        description: description || '',
        code,
        teacherId: req.user.id,
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Record activity
    await prisma.history.create({
      data: {
        userId: req.user.id,
        action: 'CLASSROOM_CREATED',
        details: `Created classroom "${name}" with code ${code}`,
      },
    });

    return res.status(201).json({ message: 'Classroom created successfully!', classroom });
  } catch (error) {
    console.error('Error creating classroom:', error);
    return res.status(500).json({ message: 'Failed to create classroom.', error: error.message });
  }
};

// @desc    Get user's classrooms (Created for Teacher, Joined for Student)
// @route   GET /api/classrooms
const getClassrooms = async (req, res) => {
  try {
    if (req.user.role === 'TEACHER') {
      const classrooms = await prisma.classroom.findMany({
        where: { teacherId: req.user.id },
        include: {
          _count: {
            select: { members: true, documents: true, quizzes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(classrooms);
    } else {
      // Student: return classrooms student has joined
      const memberships = await prisma.classroomMember.findMany({
        where: { studentId: req.user.id },
        include: {
          classroom: {
            include: {
              teacher: { select: { id: true, name: true, email: true } },
              _count: { select: { members: true, documents: true, quizzes: true } },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      });
      const classrooms = memberships.map((m) => m.classroom);
      return res.status(200).json(classrooms);
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching classrooms.', error: error.message });
  }
};

// @desc    Get single classroom details with documents, quizzes, members
// @route   GET /api/classrooms/:id
const getClassroomById = async (req, res) => {
  try {
    const { id } = req.params;

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true, email: true, profileImage: true } },
        members: {
          include: {
            student: { select: { id: true, name: true, email: true, profileImage: true } },
          },
        },
        documents: {
          include: {
            uploader: { select: { id: true, name: true } },
          },
          orderBy: { uploadDate: 'desc' },
        },
        quizzes: {
          include: {
            creator: { select: { id: true, name: true } },
            attempts: { select: { id: true, studentId: true, score: true, maxScore: true, percentage: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found.' });
    }

    return res.status(200).json(classroom);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching classroom details.', error: error.message });
  }
};

// @desc    Update classroom (Teacher only)
// @route   PUT /api/classrooms/:id
const updateClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found.' });
    }

    if (classroom.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Only the classroom creator can edit this classroom.' });
    }

    const updated = await prisma.classroom.update({
      where: { id },
      data: {
        name: name || classroom.name,
        description: description !== undefined ? description : classroom.description,
      },
    });

    return res.status(200).json({ message: 'Classroom updated successfully.', classroom: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating classroom.', error: error.message });
  }
};

// @desc    Delete classroom (Teacher only)
// @route   DELETE /api/classrooms/:id
const deleteClassroom = async (req, res) => {
  try {
    const { id } = req.params;

    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found.' });
    }

    if (classroom.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Only the classroom teacher can delete this classroom.' });
    }

    await prisma.classroom.delete({ where: { id } });

    // Record activity
    await prisma.history.create({
      data: {
        userId: req.user.id,
        action: 'CLASSROOM_DELETED',
        details: `Deleted classroom "${classroom.name}"`,
      },
    });

    return res.status(200).json({ message: 'Classroom deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting classroom.', error: error.message });
  }
};

// @desc    Student joins classroom using code
// @route   POST /api/classrooms/join
const joinClassroom = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Classroom code is required.' });
    }

    const classroom = await prisma.classroom.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: { teacher: { select: { name: true } } },
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Invalid classroom code. Classroom not found.' });
    }

    // Check if already a member
    const existingMember = await prisma.classroomMember.findUnique({
      where: {
        classroomId_studentId: {
          classroomId: classroom.id,
          studentId: req.user.id,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ message: 'You have already joined this classroom.' });
    }

    const membership = await prisma.classroomMember.create({
      data: {
        classroomId: classroom.id,
        studentId: req.user.id,
      },
    });

    // Create notification for teacher
    await prisma.notification.create({
      data: {
        userId: classroom.teacherId,
        title: 'New Student Joined',
        message: `${req.user.name} joined your classroom "${classroom.name}".`,
        type: 'info',
      },
    });

    // Record activity
    await prisma.history.create({
      data: {
        userId: req.user.id,
        action: 'CLASSROOM_JOINED',
        details: `Joined classroom "${classroom.name}" (${classroom.code})`,
      },
    });

    return res.status(200).json({
      message: `Successfully joined ${classroom.name}!`,
      classroom,
      membership,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error joining classroom.', error: error.message });
  }
};

// @desc    Student leaves classroom
// @route   POST /api/classrooms/:id/leave
const leaveClassroom = async (req, res) => {
  try {
    const { id } = req.params;

    const membership = await prisma.classroomMember.findUnique({
      where: {
        classroomId_studentId: {
          classroomId: id,
          studentId: req.user.id,
        },
      },
    });

    if (!membership) {
      return res.status(404).json({ message: 'Membership not found.' });
    }

    await prisma.classroomMember.delete({ where: { id: membership.id } });

    return res.status(200).json({ message: 'Successfully left the classroom.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error leaving classroom.', error: error.message });
  }
};

// @desc    Teacher removes a student from classroom
// @route   DELETE /api/classrooms/:id/students/:studentId
const removeStudent = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found.' });
    }

    if (classroom.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Only the classroom teacher can remove students.' });
    }

    const membership = await prisma.classroomMember.findUnique({
      where: {
        classroomId_studentId: {
          classroomId: id,
          studentId,
        },
      },
    });

    if (!membership) {
      return res.status(404).json({ message: 'Student is not a member of this classroom.' });
    }

    await prisma.classroomMember.delete({ where: { id: membership.id } });

    return res.status(200).json({ message: 'Student removed from classroom.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error removing student.', error: error.message });
  }
};

module.exports = {
  createClassroom,
  getClassrooms,
  getClassroomById,
  updateClassroom,
  deleteClassroom,
  joinClassroom,
  leaveClassroom,
  removeStudent,
};
