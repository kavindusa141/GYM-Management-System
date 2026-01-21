const Equipment = require("../models/Equipment");

// 1. Get All Equipment
exports.getAllEquipment = async (req, res) => {
  try {
    const items = await Equipment.findAll({
      order: [['name', 'ASC']]
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Add New Equipment
exports.addEquipment = async (req, res) => {
  try {
    const { name, category, status, purchase_date } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const newItem = await Equipment.create({
      name,
      category,
      status,
      purchase_date,
      last_maintenance: new Date() // Default to today
    });

    res.status(201).json({ message: "Equipment added!", newItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Update Equipment (Status or Maintenance Date)
exports.updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, last_maintenance } = req.body;

    const item = await Equipment.findByPk(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    await item.update({ name, status, last_maintenance });
    res.json({ message: "Equipment updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Delete Equipment
exports.deleteEquipment = async (req, res) => {
  try {
    await Equipment.destroy({ where: { equipment_id: req.params.id } });
    res.json({ message: "Equipment removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};