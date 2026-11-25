/*
 * Preserved hero QA — originally hero-06c2-occlusion.js
 * GDRI wordmark versus cat silhouette and card crop measurements.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");

(async () => {
  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage();
  await page.goto("http://localhost:3100/");
  const result = await page.evaluate(async () => {
    const img = new Image();
    img.src = "/work/hero/cat-poster-v2.png";
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const band = (from, to) => {
      let minX = width, maxX = -1;
      for (let y = Math.floor(height * from); y < Math.floor(height * to); y += 1) {
        for (let x = 0; x < width; x += 1) {
          const a = data[(y * width + x) * 4 + 3];
          if (a > 40) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
        }
      }
      return { minX: minX / width, maxX: maxX / width };
    };
    return {
      width,
      height,
      // Vertical band occupied by the GDRI wordmark inside the 4:5 card.
      logoBand: band(0.37, 0.60),
      fullBand: band(0, 1),
    };
  });
  console.log(JSON.stringify(result, null, 1));

  // Screen-space check at the three representative phone widths.
  const cases = [
    { w: 375, cardLeft: -4.35, cardW: 157.5, logoLeftFrac: 0.181122, logoRightFrac: 0.813776, catLeft: -0.15, catW: 375.3 },
    { w: 430, cardLeft: -8.51, cardW: 180.59, logoLeftFrac: 0.181122, logoRightFrac: 0.813776, catLeft: 6.12, catW: 417.8 },
    { w: 767, cardLeft: -15.6, cardW: 220, logoLeftFrac: 0.181122, logoRightFrac: 0.813776, catLeft: 174.62, catW: 417.8 },
  ];
  for (const c of cases) {
    const logoLeft = c.cardLeft + c.logoLeftFrac * c.cardW;
    const logoRight = c.cardLeft + c.logoRightFrac * c.cardW;
    const silhouetteLeft = c.catLeft + result.logoBand.minX * c.catW;
    console.log(
      `${c.w}: GDRI ${logoLeft.toFixed(2)}-${logoRight.toFixed(2)} | cat silhouette left in band ${silhouetteLeft.toFixed(2)} | clear margin ${(silhouetteLeft - logoRight).toFixed(2)}`
    );
  }
  await browser.close();
})();
