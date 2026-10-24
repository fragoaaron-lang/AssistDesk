const test = require('node:test');
const assert = require('node:assert/strict');
const { User, Department } = require('../models');
const { register } = require('../controllers/authController');

test('register rejects duplicate student numbers', async () => {
  const originalFindOne = User.findOne;
  const originalFindByPk = Department.findByPk;
  const originalCreate = User.create;

  try {
    User.findOne = async (query) => {
      if (query && query.where && Object.prototype.hasOwnProperty.call(query.where, 'email')) {
        return null;
      }
      if (query && query.where && Object.prototype.hasOwnProperty.call(query.where, 'student_number')) {
        return { id: 99, email: 'existing@student.test' };
      }
      return null;
    };
    Department.findByPk = async () => ({ id: 1, name: 'CS' });
    User.create = async () => {
      throw new Error('User.create should not be called when student number is already in use.');
    };

    const req = {
      body: {
        name: 'Student Name Middle Last',
        email: 'newstudent@example.com',
        password: 'Abcdefghijk1!',
        role: 'student',
        department_id: 1,
        student_number: '2026-12345',
      },
    };

    const res = {
      statusCode: null,
      data: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.data = payload;
        return this;
      },
    };

    await register(req, res);

    assert.equal(res.statusCode, 202);
    assert.match(res.data.message, /if eligible.*check your email/i);
  } finally {
    User.findOne = originalFindOne;
    Department.findByPk = originalFindByPk;
    User.create = originalCreate;
  }
});

test('registration accepts an 8-character password with all required character types', async () => {
  const originalFindOne = User.findOne;
  const originalFindByPk = Department.findByPk;

  try {
    User.findOne = async () => ({ id: 99, email: 'existing@student.test' });
    Department.findByPk = async () => ({ id: 1, name: 'CS' });

    const req = {
      body: {
        name: 'Student Name Middle Last',
        email: 'newstudent@example.com',
        password: 'Abcdef1!',
        role: 'student',
        department_id: 1,
        student_number: '2026-12345',
      },
    };
    const res = {
      statusCode: null,
      data: null,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.data = payload; return this; },
    };

    await register(req, res);

    assert.equal(res.statusCode, 202);
    assert.match(res.data.message, /if eligible.*check your email/i);
  } finally {
    User.findOne = originalFindOne;
    Department.findByPk = originalFindByPk;
  }
});

test('registration rejects passwords shorter than 8 characters', async () => {
  const originalFindOne = User.findOne;
  const originalFindByPk = Department.findByPk;
  let userLookupAttempted = false;

  try {
    User.findOne = async () => {
      userLookupAttempted = true;
      return null;
    };
    Department.findByPk = async () => ({ id: 1, name: 'CS' });

    const req = {
      body: {
        name: 'Student Name Middle Last',
        email: 'newstudent@example.com',
        password: 'Abc1!xy',
        role: 'student',
        department_id: 1,
        student_number: '2026-12345',
      },
    };
    const res = {
      statusCode: null,
      data: null,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.data = payload; return this; },
    };

    await register(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.data.message, /at least 8 characters/);
    assert.equal(userLookupAttempted, false);
  } finally {
    User.findOne = originalFindOne;
    Department.findByPk = originalFindByPk;
  }
});

test('staff registration does not require a department assignment', async () => {
  const originalFindOne = User.findOne;
  const originalFindByPk = Department.findByPk;
  let departmentLookupAttempted = false;

  try {
    User.findOne = async () => ({ id: 99, email: 'existing@staff.test' });
    Department.findByPk = async () => {
      departmentLookupAttempted = true;
      return null;
    };

    const req = {
      body: {
        name: 'Staff Name Middle Last',
        email: 'newstaff@example.com',
        password: 'Abcdefghijk1!',
        role: 'staff',
      },
    };
    const res = {
      statusCode: null,
      data: null,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.data = payload; return this; },
    };

    await register(req, res);

    assert.equal(res.statusCode, 202);
    assert.equal(departmentLookupAttempted, false);
  } finally {
    User.findOne = originalFindOne;
    Department.findByPk = originalFindByPk;
  }
});

test('student registration still requires a department assignment', async () => {
  const originalFindOne = User.findOne;
  const originalFindByPk = Department.findByPk;
  let userLookupAttempted = false;

  try {
    User.findOne = async () => {
      userLookupAttempted = true;
      return null;
    };
    Department.findByPk = async () => null;

    const req = {
      body: {
        name: 'Student Name Middle Last',
        email: 'newstudent@example.com',
        password: 'Abcdefghijk1!',
        role: 'student',
        student_number: '2026-12345',
      },
    };
    const res = {
      statusCode: null,
      data: null,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.data = payload; return this; },
    };

    await register(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.data.message, /select your department/i);
    assert.equal(userLookupAttempted, false);
  } finally {
    User.findOne = originalFindOne;
    Department.findByPk = originalFindByPk;
  }
});
