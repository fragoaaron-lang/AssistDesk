class InputValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputValidationError';
    this.status = 400;
  }
}

function validateImageDataUrl(dataUrl, fileName, declaredMimeType, maxBytes = 3 * 1024 * 1024) {
  const dataMatch = typeof dataUrl === 'string'
    ? dataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/)
    : null;
  if (!dataMatch || dataUrl.length > Math.ceil(maxBytes / 3) * 4 + 128
    || typeof fileName !== 'string' || fileName.length > 255) {
    throw new InputValidationError('Attachment must be a JPEG, PNG, or WEBP image no larger than 3 MB.');
  }

  const [, imageType, encodedImage] = dataMatch;
  const imageBytes = Buffer.from(encodedImage, 'base64');
  if (!imageBytes.length || imageBytes.length > maxBytes || imageBytes.toString('base64') !== encodedImage) {
    throw new InputValidationError('Attachment is malformed or exceeds the 3 MB limit.');
  }

  const hasValidMagic = imageType === 'jpeg'
    ? imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes[2] === 0xff
    : imageType === 'png'
      ? imageBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : imageBytes.toString('ascii', 0, 4) === 'RIFF' && imageBytes.toString('ascii', 8, 12) === 'WEBP';
  if (!hasValidMagic) throw new InputValidationError('Attachment content does not match its declared image type.');

  const mimeType = imageType === 'jpeg' ? 'image/jpeg' : `image/${imageType}`;
  if (declaredMimeType && declaredMimeType !== mimeType) {
    throw new InputValidationError('Attachment content type does not match its image data.');
  }

  return {
    data: dataUrl,
    name: fileName.replace(/[\\/\u0000-\u001f]/g, '_').slice(0, 255),
    type: mimeType,
  };
}

module.exports = { InputValidationError, validateImageDataUrl };
