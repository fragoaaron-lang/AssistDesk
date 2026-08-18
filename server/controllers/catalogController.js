const { Department, Service, Faq } = require('../models');

const parsePagination = (req) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  return { page, limit };
};

exports.getDepartments = async (req, res) => {
  try {
    const { page, limit } = parsePagination(req);
    const offset = (page - 1) * limit;
    const { count, rows } = await Department.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
    return res.json({ departments: rows, total: count, page, limit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch departments.' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, description, point_person, contact_number, location, office_hours } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Department name is required.' });
    }
    const department = await Department.create({
      name,
      description,
      point_person,
      contact_number,
      location,
      office_hours,
    });
    return res.status(201).json(department);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create department.' });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }
    await department.update(req.body);
    return res.json(department);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update department.' });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }
    await department.destroy();
    return res.json({ message: 'Department deleted.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete department.' });
  }
};

exports.getServices = async (req, res) => {
  try {
    const { page, limit } = parsePagination(req);
    const offset = (page - 1) * limit;
    const { count, rows } = await Service.findAndCountAll({
      limit,
      offset,
      include: [{ model: Department }],
      order: [['id', 'ASC']],
    });
    return res.json({ services: rows, total: count, page, limit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch services.' });
  }
};

exports.createService = async (req, res) => {
  try {
    const { department_id, name, requirements, processing_time } = req.body;
    if (!department_id || !name) {
      return res.status(400).json({ message: 'Department and service name are required.' });
    }
    const service = await Service.create({ department_id, name, requirements, processing_time });
    return res.status(201).json(service);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create service.' });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }
    await service.update(req.body);
    return res.json(service);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update service.' });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }
    await service.destroy();
    return res.json({ message: 'Service deleted.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete service.' });
  }
};

exports.getFaqs = async (req, res) => {
  try {
    const { page, limit } = parsePagination(req);
    const offset = (page - 1) * limit;
    const { count, rows } = await Faq.findAndCountAll({
      limit,
      offset,
      include: [{ model: Department }],
      order: [['id', 'ASC']],
    });
    return res.json({ faqs: rows, total: count, page, limit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch FAQs.' });
  }
};

exports.createFaq = async (req, res) => {
  try {
    const { department_id, question, answer, keywords } = req.body;
    if (!department_id || !question || !answer) {
      return res.status(400).json({ message: 'Department, question, and answer are required.' });
    }
    const faq = await Faq.create({ department_id, question, answer, keywords });
    return res.status(201).json(faq);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create FAQ.' });
  }
};

exports.updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await Faq.findByPk(id);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found.' });
    }
    await faq.update(req.body);
    return res.json(faq);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update FAQ.' });
  }
};

exports.deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await Faq.findByPk(id);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found.' });
    }
    await faq.destroy();
    return res.json({ message: 'FAQ deleted.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete FAQ.' });
  }
};
