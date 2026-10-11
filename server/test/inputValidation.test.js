const test = require('node:test');
const assert = require('node:assert/strict');
const { validateImageDataUrl } = require('../utils/inputValidation');

const pngData = `data:image/png;base64,${Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64')}`;

test('validates image data by actual signature and canonical base64', () => {
  const result = validateImageDataUrl(pngData, 'photo.png', 'image/png');
  assert.equal(result.data, pngData);
  assert.equal(result.type, 'image/png');
});

test('rejects active SVG and forged image MIME data', () => {
  assert.throws(() => validateImageDataUrl('data:image/svg+xml;base64,PHN2Zz4=', 'x.svg', 'image/svg+xml'), /JPEG, PNG, or WEBP/);
  assert.throws(() => validateImageDataUrl('data:image/png;base64,SGVsbG8=', 'x.png', 'image/png'), /does not match/);
  assert.throws(() => validateImageDataUrl(pngData, 'x.png', 'image/jpeg'), /content type/);
});

test('sanitizes attachment filenames and rejects payloads over the byte limit', () => {
  assert.equal(validateImageDataUrl(pngData, '..\\unsafe\u0000.png', 'image/png').name, '.._unsafe_.png');
  const data = Buffer.alloc(16, 1);
  const tooLarge = `data:image/png;base64,${Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), data]).toString('base64')}`;
  assert.throws(() => validateImageDataUrl(tooLarge, 'large.png', 'image/png', 8), /exceeds/);
});
