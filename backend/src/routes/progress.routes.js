const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress.controller');
const { verifyToken, isTrainer } = require('../middleware/auth.middleware');

// Log Progress (Trainer only)
router.post('/', verifyToken, isTrainer, progressController.logProgress);

// Get Member Progress (Trainer or Member - for now restricting/allowing based on usage)
// A member should be able to see their own progress.
// Trainer should see their assigned member's progress.
// For MVP, let's allow authenticated users, controller logic can refine or we rely on frontend.
router.get('/member/:memberId', verifyToken, progressController.getMemberProgress);
router.put('/:logId', verifyToken, isTrainer, progressController.updateProgressLog);
router.delete('/:logId', verifyToken, isTrainer, progressController.deleteProgressLog);

module.exports = router;
