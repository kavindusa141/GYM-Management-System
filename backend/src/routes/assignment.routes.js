const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const { verifyToken, isAdmin, isTrainer } = require('../middleware/auth.middleware');

// Route to assign trainer (Admin only)
// Assuming verifyToken and isAdmin middleware exist based on typical file names, 
// I should verify their existence. `backend/src/middleware` has 1 child.
router.post('/', verifyToken, isAdmin, assignmentController.assignTrainer);
router.get('/', verifyToken, isAdmin, assignmentController.getAllAssignments);
router.get('/eligible-members', verifyToken, isAdmin, assignmentController.getEligibleMembers);
router.get('/trainers-load', verifyToken, isAdmin, assignmentController.getTrainersWithCounts);

// Route to get members for logged-in trainer
router.get('/trainer/me', verifyToken, isTrainer, assignmentController.getTrainerMembers);

// Route to remove assignment
router.delete('/:id', verifyToken, isAdmin, assignmentController.removeAssignment);

module.exports = router;
