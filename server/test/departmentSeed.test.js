const test = require('node:test');
const assert = require('node:assert/strict');
const { DEPARTMENT_SEED_DATA, seedDepartments } = require('../seed-departments');

test('department seed includes all source rows with unique names and valid map coordinates', () => {
  assert.equal(DEPARTMENT_SEED_DATA.length, 25);
  assert.equal(new Set(DEPARTMENT_SEED_DATA.map(({ name }) => name)).size, DEPARTMENT_SEED_DATA.length);
  DEPARTMENT_SEED_DATA.forEach((department) => {
    assert.ok(department.name);
    assert.ok(department.map_x >= 0 && department.map_x <= 100, `${department.name} map_x`);
    assert.ok(department.map_y >= 0 && department.map_y <= 100, `${department.name} map_y`);
    assert.equal(Object.hasOwn(department, 'id'), false, 'target database assigns IDs');
  });
});

test('department seeder creates missing rows and updates exact-name matches without clearing fields', async () => {
  const existing = new Map();
  const createdRows = [];
  const updates = [];
  existing.set('Basic Education Department', {
    update: async (values) => { updates.push(values); },
  });
  const Department = {
    findOne: async ({ where }) => existing.get(where.name) || null,
    create: async (values) => { createdRows.push(values); },
  };

  const result = await seedDepartments({ Department });
  assert.equal(result.total, 25);
  assert.equal(result.created, 24);
  assert.equal(result.updated, 1);
  assert.equal(createdRows.some(({ name }) => name === 'Basic Education Department'), false);
  assert.equal(updates[0].office_hours, '6:30 AM to 2:30 PM');
  assert.equal(Object.hasOwn(updates[0], 'point_person'), false);
  assert.equal(Object.hasOwn(updates[0], 'created_at'), false);
});
