const { Department, Service, Faq } = require('../models');

const canonicalDepartments = [
  ['Basic Education Department', 'Basic Education Department'],
  ['Education Department', 'College of Education'],
  ['College of Nursing', 'College of Nursing'],
  ['CS', 'College of Computer Studies'],
  ['CBA', 'College of Business and Accountancy'],
  ['CHARM', 'College of Hospitality Management'],
  ['College of Criminology', 'College of Criminology'],
  ['College of Physical Therapy', 'College of Physical Therapy'],
  ['Maintenance Department', 'Maintenance Department'],
  ['Accounting Department', 'Accounting Department'],
  ['Registrar Department', 'Registrar Department'],
  ['Registrar Office', 'Registrar Office'],
  ['Library', 'Library'],
  ['Guidance', 'Guidance Office'],
  ['Office of Student Affairs', 'Office of Student Affairs'],
  ['Office of the Student Affairs', 'Office of the Student Affairs'],
  ['Clinic', 'Clinic'],
  ['IT Department', 'Information Technology Department'],
];

const parsePagination = (req) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  return { page, limit };
};

const isDepartmentScopedAdmin = (user) => user?.role === 'admin' && Number(user.department_id) > 0;
const isOwnDepartment = (user, departmentId) => !isDepartmentScopedAdmin(user)
  || Number(user.department_id) === Number(departmentId);

const findScopedCatalogItem = async (Model, id, req) => {
  const item = await Model.findByPk(id);
  if (!item) return { item: null, forbidden: false };
  if (isDepartmentScopedAdmin(req.user) && !isOwnDepartment(req.user, item.department_id)) {
    return { item, forbidden: true };
  }
  return { item, forbidden: false };
};

exports.getDepartments = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || canonicalDepartments.length;
    await Department.findOrCreate({
      where: { name: 'Education Department' },
      defaults: { name: 'Education Department', description: 'Handles education-related concerns and academic coordination.' },
    });
    await Department.findOrCreate({
      where: { name: 'Registrar Department' },
      defaults: { name: 'Registrar Department', description: 'Handles student records, enrollment, and official document requests.' },
    });
    const departmentRecords = await Department.findAll({
      ...(req.user?.role === 'admin' && Number(req.user.department_id) > 0
        ? { where: { id: req.user.department_id } }
        : {}),
      order: [['name', 'ASC']],
    });
    const displayNames = Object.fromEntries(canonicalDepartments);
    const rows = departmentRecords.map((department) => ({
      ...department.toJSON(),
      display_name: displayNames[department.name] || department.name,
    }));
    return res.json({ departments: rows, total: rows.length, page, limit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch departments.' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    if (isDepartmentScopedAdmin(req.user)) {
      return res.status(403).json({ message: 'Department-scoped administrators cannot create departments.' });
    }
    const { name, description, point_person, contact_number, location, office_hours, map_x, map_y } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Department name is required.' });
    }
    const parsedMapX = map_x === '' || map_x == null ? null : Number(map_x);
    const parsedMapY = map_y === '' || map_y == null ? null : Number(map_y);
    if ((parsedMapX != null && (!Number.isFinite(parsedMapX) || parsedMapX < 0 || parsedMapX > 100))
      || (parsedMapY != null && (!Number.isFinite(parsedMapY) || parsedMapY < 0 || parsedMapY > 100))) {
      return res.status(400).json({ message: 'Map coordinates must be percentages from 0 to 100.' });
    }
    const department = await Department.create({
      name,
      description,
      point_person,
      contact_number,
      location,
      office_hours,
      map_x: parsedMapX,
      map_y: parsedMapY,
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
    if (!isOwnDepartment(req.user, department.id)) {
      return res.status(403).json({ message: 'You may only edit your own department.' });
    }
    const updates = { ...req.body };
    for (const coordinate of ['map_x', 'map_y']) {
      if (Object.prototype.hasOwnProperty.call(updates, coordinate)) {
        const value = updates[coordinate];
        const parsed = value === '' || value == null ? null : Number(value);
        if (parsed != null && (!Number.isFinite(parsed) || parsed < 0 || parsed > 100)) {
          return res.status(400).json({ message: 'Map coordinates must be percentages from 0 to 100.' });
        }
        updates[coordinate] = parsed;
      }
    }
    await department.update(updates);
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
    if (!isOwnDepartment(req.user, department.id)) {
      return res.status(403).json({ message: 'You may only delete your own department.' });
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
      ...(isDepartmentScopedAdmin(req.user) ? { where: { department_id: req.user.department_id } } : {}),
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
    const targetDepartmentId = isDepartmentScopedAdmin(req.user) ? req.user.department_id : department_id;
    if (!isOwnDepartment(req.user, targetDepartmentId)) {
      return res.status(403).json({ message: 'You may only create services for your own department.' });
    }
    const department = await Department.findByPk(targetDepartmentId);
    if (!department) return res.status(400).json({ message: 'Selected department is invalid.' });
    const service = await Service.create({ department_id: targetDepartmentId, name, requirements, processing_time });
    return res.status(201).json(service);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create service.' });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { item: service, forbidden } = await findScopedCatalogItem(Service, id, req);
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }
    if (forbidden) return res.status(403).json({ message: 'You may only edit services in your own department.' });
    if (isDepartmentScopedAdmin(req.user) && req.body.department_id != null && !isOwnDepartment(req.user, req.body.department_id)) {
      return res.status(403).json({ message: 'You may only assign services to your own department.' });
    }
    await service.update({ ...req.body, ...(isDepartmentScopedAdmin(req.user) ? { department_id: req.user.department_id } : {}) });
    return res.json(service);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update service.' });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const { item: service, forbidden } = await findScopedCatalogItem(Service, id, req);
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }
    if (forbidden) return res.status(403).json({ message: 'You may only delete services in your own department.' });
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
      ...(isDepartmentScopedAdmin(req.user) ? { where: { department_id: req.user.department_id } } : {}),
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
    const targetDepartmentId = isDepartmentScopedAdmin(req.user) ? req.user.department_id : department_id;
    if (!isOwnDepartment(req.user, targetDepartmentId)) {
      return res.status(403).json({ message: 'You may only create FAQs for your own department.' });
    }
    const department = await Department.findByPk(targetDepartmentId);
    if (!department) return res.status(400).json({ message: 'Selected department is invalid.' });
    const faq = await Faq.create({ department_id: targetDepartmentId, question, answer, keywords });
    return res.status(201).json(faq);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create FAQ.' });
  }
};

exports.updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { item: faq, forbidden } = await findScopedCatalogItem(Faq, id, req);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found.' });
    }
    if (forbidden) return res.status(403).json({ message: 'You may only edit FAQs in your own department.' });
    if (isDepartmentScopedAdmin(req.user) && req.body.department_id != null && !isOwnDepartment(req.user, req.body.department_id)) {
      return res.status(403).json({ message: 'You may only assign FAQs to your own department.' });
    }
    await faq.update({ ...req.body, ...(isDepartmentScopedAdmin(req.user) ? { department_id: req.user.department_id } : {}) });
    return res.json(faq);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update FAQ.' });
  }
};

exports.deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { item: faq, forbidden } = await findScopedCatalogItem(Faq, id, req);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found.' });
    }
    if (forbidden) return res.status(403).json({ message: 'You may only delete FAQs in your own department.' });
    await faq.destroy();
    return res.json({ message: 'FAQ deleted.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete FAQ.' });
  }
};
