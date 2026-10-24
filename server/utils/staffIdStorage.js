const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const MIME_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function getStaffIdStorageDirectory() {
  return process.env.STAFF_ID_STORAGE_DIR
    ? path.resolve(process.env.STAFF_ID_STORAGE_DIR)
    : path.join(__dirname, '..', 'private', 'staff-ids');
}

function resolveStorageKey(storageKey) {
  if (typeof storageKey !== 'string' || !/^\d+-[0-9a-f-]{36}\.(jpg|png|webp)$/.test(storageKey)) {
    throw new Error('Invalid staff ID storage key.');
  }
  const directory = getStaffIdStorageDirectory();
  const filePath = path.resolve(directory, storageKey);
  if (path.dirname(filePath) !== directory) throw new Error('Invalid staff ID storage path.');
  return filePath;
}

async function saveStaffIdDocument(userId, document) {
  const extension = MIME_EXTENSIONS[document?.type];
  if (!extension || typeof document.data !== 'string' || !document.data.startsWith(`data:${document.type};base64,`)) {
    throw new Error('Invalid staff ID image.');
  }

  const directory = getStaffIdStorageDirectory();
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const storageKey = `${Number(userId)}-${crypto.randomUUID()}.${extension}`;
  const filePath = resolveStorageKey(storageKey);
  const encodedImage = document.data.slice(document.data.indexOf(',') + 1);
  await fs.writeFile(filePath, Buffer.from(encodedImage, 'base64'), { flag: 'wx', mode: 0o600 });
  return storageKey;
}

async function readStaffIdDocument(storageKey, mimeType) {
  if (!MIME_EXTENSIONS[mimeType]) throw new Error('Invalid staff ID image type.');
  const image = await fs.readFile(resolveStorageKey(storageKey));
  return `data:${mimeType};base64,${image.toString('base64')}`;
}

async function readUserStaffIdDocument(user) {
  if (typeof user?.staff_id_document === 'string' && user.staff_id_document.startsWith('data:image/')) {
    return user.staff_id_document;
  }
  if (user?.staff_id_storage_key) {
    return readStaffIdDocument(user.staff_id_storage_key, user.staff_id_mime_type);
  }
  throw new Error('Staff ID document is unavailable.');
}

async function removeStaffIdDocument(storageKey) {
  if (!storageKey) return;
  try {
    await fs.unlink(resolveStorageKey(storageKey));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Staff ID file cleanup failed:', error.code || error.name || 'Error');
    }
  }
}

module.exports = {
  getStaffIdStorageDirectory,
  saveStaffIdDocument,
  readStaffIdDocument,
  readUserStaffIdDocument,
  removeStaffIdDocument,
};
