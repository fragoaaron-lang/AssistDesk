export function analyzeFacePixels(pixels, width, height) {
  if (!pixels || width <= 0 || height <= 0) {
    return {
      isFaceLike: false,
      confidence: 0,
      skinPixels: 0,
      totalPixels: 0,
      boundingBox: null,
      aspectRatio: 0,
    };
  }

  const totalPixels = pixels.length / 4;
  let skinPixels = 0;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const a = pixels[index + 3];

    if (a < 128) continue;

    const maxChannel = Math.max(r, g, b);
    const minChannel = Math.min(r, g, b);
    const brightness = (r + g + b) / 3;
    const isSkinTone = (r > 95 && g > 40 && b > 20 && maxChannel - minChannel > 15 && Math.abs(r - g) > 15 && r > g && r > b)
      || (brightness > 70 && brightness < 210 && r > 85 && g > 45 && b > 25 && r > g && r > b);

    if (isSkinTone) {
      skinPixels += 1;
      const x = (index / 4) % width;
      const y = Math.floor((index / 4) / width);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (skinPixels === 0) {
    return {
      isFaceLike: false,
      confidence: 0,
      skinPixels: 0,
      totalPixels,
      boundingBox: null,
      aspectRatio: 0,
    };
  }

  const boxWidth = Math.max(1, maxX - minX + 1);
  const boxHeight = Math.max(1, maxY - minY + 1);
  const faceAreaRatio = (boxWidth * boxHeight) / (width * height);
  const aspectRatio = boxWidth / boxHeight;
  const skinRatio = skinPixels / totalPixels;
  const confidence = Math.min(
    1,
    ((faceAreaRatio * 2) + (skinRatio * 2) + (aspectRatio >= 0.6 && aspectRatio <= 1.7 ? 0.6 : 0)) / 4.6,
  );

  return {
    isFaceLike: skinRatio > 0.08 && faceAreaRatio > 0.03 && aspectRatio > 0.5 && aspectRatio < 1.7,
    confidence,
    skinPixels,
    totalPixels,
    boundingBox: { x: minX, y: minY, width: boxWidth, height: boxHeight },
    aspectRatio,
  };
}

export function validateFaceInImage(file) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return Promise.resolve({ isFaceLike: false, reason: 'Please select an image file.' });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 240;
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));

        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const result = analyzeFacePixels(imageData.data, canvas.width, canvas.height);

        resolve({
          ...result,
          reason: result.isFaceLike ? 'Face verification passed.' : 'Face verification failed. Please upload a clear photo showing your face before submitting maintenance proof.',
        });
      };

      img.onerror = () => {
        resolve({ isFaceLike: false, reason: 'Unable to read the selected image.' });
      };

      img.src = reader.result;
    };

    reader.onerror = () => {
      resolve({ isFaceLike: false, reason: 'Unable to read the selected image.' });
    };

    reader.readAsDataURL(file);
  });
}
