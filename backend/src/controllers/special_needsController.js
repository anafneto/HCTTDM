const db = require('../models');

const SpecialNeed = db.special_needs;

exports.create = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nome é obrigatório' });
    }

    const existingSpecialNeed = await SpecialNeed.findOne({ where: { name } });
    if (existingSpecialNeed) {
      return res.status(400).json({ message: 'Necessidade especial já existe' });
    }

    const specialNeed = await SpecialNeed.create({ name });

    res.status(201).json(specialNeed);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar necessidade especial', error: error.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const specialNeeds = await SpecialNeed.findAll({
      order: [['name', 'ASC']]
    });
    res.status(200).json(specialNeeds);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar necessidades especiais', error: error.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const specialNeed = await SpecialNeed.findByPk(id);

    if (!specialNeed) {
      return res.status(404).json({ message: 'Necessidade especial não encontrada' });
    }

    res.status(200).json(specialNeed);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar necessidade especial', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const specialNeed = await SpecialNeed.findByPk(id);
    if (!specialNeed) {
      return res.status(404).json({ message: 'Necessidade especial não encontrada' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Nome é obrigatório' });
    }

    const existingSpecialNeed = await SpecialNeed.findOne({ 
      where: { 
        name,
        id: { [db.Sequelize.Op.ne]: id }
      } 
    });
    
    if (existingSpecialNeed) {
      return res.status(400).json({ message: 'Necessidade especial com esse nome já existe' });
    }

    await specialNeed.update({ name });

    res.status(200).json(specialNeed);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar necessidade especial', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const specialNeed = await SpecialNeed.findByPk(id);

    if (!specialNeed) {
      return res.status(404).json({ message: 'Necessidade especial não encontrada' });
    }

    await specialNeed.destroy();
    res.status(200).json({ message: 'Necessidade especial eliminada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao eliminar necessidade especial', error: error.message });
  }
};