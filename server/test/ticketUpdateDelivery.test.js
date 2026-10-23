const test = require('node:test');
const assert = require('node:assert/strict');
const models = require('../models');
const auditLog = require('../utils/auditLog');
const socket = require('../utils/socket');
const email = require('../utils/email');

const originalMethods = {
  findTicket: models.Ticket.findByPk,
  transaction: models.Ticket.sequelize.transaction,
  createUpdate: models.TicketUpdate.create,
  createNotification: models.Notification.create,
  findUser: models.User.findByPk,
  recordAudit: auditLog.recordAudit,
  notifyUser: socket.notifyUser,
  sendTicketUpdateEmail: email.sendTicketUpdateEmail,
};

const ticket = { id: 321, ticket_code: 'TCC-00321', user_id: 42, subject: 'Laptop issue', department_id: 3 };
const postedMessage = 'Progress update\n<script>alert("x")</script>';
const persistedUpdate = { id: 88, ticket_id: ticket.id, message: postedMessage, action: 'comment' };
const notifications = [];
const emails = [];

models.Ticket.findByPk = async () => ticket;
models.Ticket.sequelize.transaction = async () => ({
  async commit() {},
  async rollback() {},
});
models.TicketUpdate.create = async (values) => ({ ...values, id: persistedUpdate.id });
models.Notification.create = async (values) => { notifications.push(values); return values; };
models.User.findByPk = async () => ({ id: 42, name: 'Ticket requester', email: 'requester@example.edu' });
auditLog.recordAudit = async () => {};
socket.notifyUser = () => {};
email.sendTicketUpdateEmail = async (values) => { emails.push(values); };

const { addTicketUpdate } = require('../controllers/ticketController');

test('posted ticket updates are copied to the requester notification and emailed', async () => {
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  try {
    await addTicketUpdate({
      params: { id: String(ticket.id) },
      body: { message: postedMessage },
      user: { id: 7, role: 'admin', department_id: ticket.department_id },
    }, response);

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.message, postedMessage);
    assert.equal(notifications.at(-1).user_id, ticket.user_id);
    assert.match(notifications.at(-1).message, /Progress update/);
    assert.match(notifications.at(-1).message, /<script>alert\("x"\)<\/script>/);
    assert.deepEqual(emails.at(-1), {
      to: 'requester@example.edu',
      userName: 'Ticket requester',
      ticketSubject: ticket.subject,
      ticketId: ticket.ticket_code,
      updateMessage: postedMessage,
    });
  } finally {
    models.Ticket.findByPk = originalMethods.findTicket;
    models.Ticket.sequelize.transaction = originalMethods.transaction;
    models.TicketUpdate.create = originalMethods.createUpdate;
    models.Notification.create = originalMethods.createNotification;
    models.User.findByPk = originalMethods.findUser;
    auditLog.recordAudit = originalMethods.recordAudit;
    socket.notifyUser = originalMethods.notifyUser;
    email.sendTicketUpdateEmail = originalMethods.sendTicketUpdateEmail;
  }
});
