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
