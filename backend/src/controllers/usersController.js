const db = require('../models');
const bcrypt = require('bcryptjs');

const User = db.users;

exports.create = async (req, res) => {
  try {
    console.log('Dados recebidos:', req.body);
    
    const { name, email, password, date_of_birth, region, grade_level, other_special_need, social_context } = req.body;

    if (!name || !email || !password || !date_of_birth) {
      return res.status(400).json({
        message: 'Nome, email, password e data de nascimento são obrigatórios'
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      date_of_birth,
      region: region || null,
      grade_level: grade_level || null,
      other_special_need: other_special_need || null,
      social_context: social_context || null
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    res.status(500).json({
      message: 'Erro ao criar utilizador',
      error: error.message,
      details: error.errors ? error.errors.map(e => e.message) : []
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Erro ao buscar utilizadores:', error);
    res.status(500).json({ message: 'Erro ao buscar utilizadores', error: error.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Erro ao buscar utilizador:', error);
    res.status(500).json({ message: 'Erro ao buscar utilizador', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, date_of_birth, region, grade_level, other_special_need, social_context } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    let updateData = { 
      name, 
      email, 
      date_of_birth, 
      region: region || null, 
      grade_level: grade_level || null, 
      other_special_need: other_special_need || null,
      social_context: social_context || null
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Erro ao atualizar utilizador:', error);
    res.status(500).json({ message: 'Erro ao atualizar utilizador', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    await user.destroy();
    res.status(200).json({ message: 'Utilizador eliminado com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar utilizador:', error);
    res.status(500).json({ message: 'Erro ao eliminar utilizador', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    console.log('Tentativa de login:', req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e password são obrigatórios' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const userResponse = user.toJSON();
    delete userResponse.password;

    console.log('Login bem-sucedido para:', email);
    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login', error: error.message });
  }
};