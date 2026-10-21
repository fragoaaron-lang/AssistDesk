const test = require('node:test');
const assert = require('node:assert/strict');
const { getGlobalCampusTicketCounts } = require('../utils/campusMap');

test('campus map counts tickets across submitters, departments, priorities, and statuses', async () => {
  const expectedCounts = [
    { department_id: 2, priority: 'urgent', status: 'open', ticket_count: '3' },
    { department_id: 7, priority: 'low', status: 'resolved', ticket_count: '1' },
  ];
  let capturedOptions;
  const Ticket = {
    unscoped() {
      return {
        findAll(options) {
          capturedOptions = options;
          return Promise.resolve(expectedCounts);
        },
      };
    },
  };
  const sequelize = {
    fn: (...args) => ({ fn: args[0], args: args.slice(1) }),
    col: (name) => ({ column: name }),
  };

  const result = await getGlobalCampusTicketCounts(Ticket, sequelize);

  assert.deepEqual(result, expectedCounts);
  assert.deepEqual(capturedOptions.group, ['department_id', 'priority', 'status']);
  assert.equal(capturedOptions.raw, true);
  assert.equal(Object.hasOwn(capturedOptions, 'where'), false);
  assert.equal(capturedOptions.attributes.includes('department_id'), true);
  assert.equal(capturedOptions.attributes.includes('priority'), true);
  assert.equal(capturedOptions.attributes.includes('status'), true);
});