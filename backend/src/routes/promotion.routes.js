const express = require('express');
const router = express.Router();
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');
const {
    getAllPromotions,
    getActivePromotion,
    createPromotion,
    updatePromotion,
    deletePromotion
} = require('../controllers/promotion.controller');

// Public route to get the current active promotion for the landing page
router.get('/active', getActivePromotion);

// Admin only routes
router.get('/', verifyToken, allowRoles('ADMIN'), getAllPromotions);
router.post('/', verifyToken, allowRoles('ADMIN'), createPromotion);
router.put('/:id', verifyToken, allowRoles('ADMIN'), updatePromotion);
router.delete('/:id', verifyToken, allowRoles('ADMIN'), deletePromotion);

module.exports = router;
