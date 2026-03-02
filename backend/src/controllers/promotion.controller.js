const Promotion = require('../models/Promotion');
const { Op } = require('sequelize');

exports.getAllPromotions = async (req, res) => {
    try {
        const promotions = await Promotion.findAll({ order: [['created_at', 'DESC']] });
        res.json(promotions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getActivePromotion = async (req, res) => {
    try {
        const now = new Date();
        const promotion = await Promotion.findOne({
            where: {
                isActive: true,
                startDate: { [Op.lte]: now },
                endDate: { [Op.gte]: now }
            },
            order: [['created_at', 'DESC']]
        });

        if (!promotion) {
            return res.status(200).json(null); // No active promotion
        }

        res.json(promotion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPromotion = async (req, res) => {
    try {
        const newPromo = await Promotion.create(req.body);
        res.status(201).json(newPromo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedRows] = await Promotion.update(req.body, { where: { id } });

        if (updatedRows === 0) {
            return res.status(404).json({ message: "Promotion not found." });
        }

        const updatedPromo = await Promotion.findByPk(id);
        res.json(updatedPromo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deletePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCount = await Promotion.destroy({ where: { id } });

        if (deletedCount === 0) {
            return res.status(404).json({ message: "Promotion not found." });
        }

        res.json({ message: "Promotion deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
