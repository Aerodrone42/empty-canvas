const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function analyze(path, frameWidth, frameHeight) {
  const image = await loadImage(path);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, image.width, image.height).data;

  const numFrames = image.width / frameWidth;
  console.log(`Analyzing ${path}: ${numFrames} frames`);

  for (let f = 0; f < numFrames; f++) {
    const startX = f * frameWidth;
    let minX = frameWidth, maxX = 0, minY = frameHeight, maxY = 0;
    let found = false;

    for (let y = 0; y < frameHeight; y++) {
      for (let x = 0; x < frameWidth; x++) {
        const alpha = data[((y * image.width) + (startX + x)) * 4 + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }
    if (found) {
      console.log(`  Frame ${f}: BBox [${minX}, ${minY}] to [${maxX}, ${maxY}], height: ${maxY - minY + 1}`);
    } else {
      console.log(`  Frame ${f}: Empty`);
    }
  }
}

async function run() {
  await analyze('public/assets/sprites/hero/vigile_muet_idle_spritesheet.png', 256, 192);
  await analyze('public/assets/sprites/hero/vigile_muet_jump_spritesheet.png', 256, 192);
}

run();
