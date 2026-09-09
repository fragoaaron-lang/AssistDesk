const getImageMetrics = (imageSource) => new Promise((resolve, reject) => {
  const img = new Image();

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const maxDimension = 240;
    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const metrics = analyzeFacePixels(pixels, canvas.width, canvas.height);

    if (!metrics.boundingBox) {
      resolve({ ...metrics, averageRgb: { r: 0, g: 0, b: 0 }, faceCenter: null });
      return;
    }

    const { x, y, width, height } = metrics.boundingBox;
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let totalSamples = 0;

    for (let py = y; py < y + height; py += 1) {
      for (let px = x; px < x + width; px += 1) {
        const offset = (py * canvas.width + px) * 4;
        totalR += pixels[offset];
        totalG += pixels[offset + 1];
        totalB += pixels[offset + 2];
        totalSamples += 1;
      }
    }

    const averageRgb = totalSamples ? {
      r: totalR / totalSamples,
      g: totalG / totalSamples,
      b: totalB / totalSamples,
    } : { r: 0, g: 0, b: 0 };

    resolve({
      ...metrics,
      averageRgb,
      faceCenter: {
        x: (x + width / 2) / canvas.width,
        y: (y + height / 2) / canvas.height,
      },
    });
  };

  img.onerror = () => reject(new Error('Unable to read the selected image.'));
  img.src = imageSource;
});

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

export function validateFaceInImage(file, referenceSource = '') {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return Promise.resolve({ isFaceLike: false, reason: 'Please select an image file.' });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const imageSource = reader.result;
        const uploadMetrics = await getImageMetrics(imageSource);

        if (!uploadMetrics.isFaceLike) {
          resolve({
            isFaceLike: false,
            reason: 'Face verification failed. Please upload a clear photo showing your face before submitting maintenance proof.',
          });
          return;
        }

        if (!referenceSource) {
          resolve({
            ...uploadMetrics,
            isFaceLike: true,
            reason: 'Face verification passed.',
          });
          return;
        }

        const referenceMetrics = await getImageMetrics(referenceSource);
        if (!referenceMetrics.isFaceLike) {
          resolve({
            isFaceLike: false,
            reason: 'Your profile face could not be verified. Please update your profile photo and try again.',
          });
          return;
        }

        const colorDistance = Math.sqrt(
          Math.pow(uploadMetrics.averageRgb.r - referenceMetrics.averageRgb.r, 2)
          + Math.pow(uploadMetrics.averageRgb.g - referenceMetrics.averageRgb.g, 2)
          + Math.pow(uploadMetrics.averageRgb.b - referenceMetrics.averageRgb.b, 2),
        );
        const faceCenterDistance = uploadMetrics.faceCenter && referenceMetrics.faceCenter
          ? Math.hypot(
              uploadMetrics.faceCenter.x - referenceMetrics.faceCenter.x,
              uploadMetrics.faceCenter.y - referenceMetrics.faceCenter.y,
            )
          : 1;
        const aspectDifference = Math.abs(uploadMetrics.aspectRatio - referenceMetrics.aspectRatio);
        const skinDifference = Math.abs(uploadMetrics.skinPixels - referenceMetrics.skinPixels) / Math.max(referenceMetrics.skinPixels, 1);
        const score = 1 - (colorDistance / 510) * 0.4 - (faceCenterDistance * 0.6) - (aspectDifference * 0.3) - (skinDifference * 0.5);

        const matchesProfile = score > 0.48;

        resolve({
          ...uploadMetrics,
          isFaceLike: matchesProfile,
          reason: matchesProfile
            ? 'Face verification passed.'
            : 'Face recognition did not match your profile photo. Please upload a photo that matches the face on your profile.',
          score,
        });
      } catch (error) {
        resolve({ isFaceLike: false, reason: error.message || 'Unable to verify the selected image.' });
      }
    };

    reader.onerror = () => {
      resolve({ isFaceLike: false, reason: 'Unable to read the selected image.' });
    };

    reader.readAsDataURL(file);
  });
}
