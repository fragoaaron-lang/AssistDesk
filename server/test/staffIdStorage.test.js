const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const {
  saveStaffIdDocument,
  readStaffIdDocument,
  removeStaffIdDocument,
} = require('../utils/staffIdStorage');

const pngData = `data:image/png;base64,${Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64')}`;

test('stores faculty/staff ID images in a private folder and removes them after review', async () => {
  const originalDirectory = process.env.STAFF_ID_STORAGE_DIR;
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'assistdesk-staff-ids-'));
  process.env.STAFF_ID_STORAGE_DIR = temporaryDirectory;

  try {
    const storageKey = await saveStaffIdDocument(42, { data: pngData, type: 'image/png' });
    assert.match(storageKey, /^42-[0-9a-f-]{36}\.png$/);
    assert.equal(await readStaffIdDocument(storageKey, 'image/png'), pngData);
    await removeStaffIdDocument(storageKey);
    await assert.rejects(fs.access(path.join(temporaryDirectory, storageKey)), { code: 'ENOENT' });
    await assert.rejects(readStaffIdDocument('../outside.png', 'image/png'), /Invalid staff ID storage key/);
  } finally {
    if (originalDirectory === undefined) delete process.env.STAFF_ID_STORAGE_DIR;
    else process.env.STAFF_ID_STORAGE_DIR = originalDirectory;
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});
