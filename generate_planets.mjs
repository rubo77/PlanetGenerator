#!/usr/bin/env node
/**
 * Generate planet PNGs from the PlanetGenerator (GenGen) WebGL shader
 * using headless Chromium via Playwright.
 *
 * Usage:
 *   node generate_planets.mjs [count] [output_dir] [size]
 *
 * Examples:
 *   node generate_planets.mjs              # 10 planets, ./planets/, 512px
 *   node generate_planets.mjs 100          # 100 planets
 *   node generate_planets.mjs 50 ./out 256 # 50 planets, 256px, into ./out/
 *
 * Requirements:
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Each planet gets a deterministic seed and a parameter log file
 * (planets_params.log) so it can be reproduced exactly.
 */

import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COUNT = parseInt(process.argv[2] || '10', 10);
const OUTPUT_DIR = process.argv[3] || path.join(__dirname, 'planets');
const SIZE = parseInt(process.argv[4] || '512', 10);

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
};

function startServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(rootDir, urlPath);
      const ext = path.extname(filePath);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
        });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const server = await startServer(__dirname);
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/`;
  console.log(`[PLANETS] Server running at ${url}`);

  const browser = await chromium.launch({
    executablePath: process.env.HOME + '/.playwright-browsers/chromium-1194/chrome-linux/chrome',
    headless: true,
    args: [
      '--use-gl=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--enable-unsafe-swiftshader',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: SIZE + 100, height: SIZE + 100 },
  });

  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('[BROWSER ERROR]', msg.text());
    }
  });

  console.log(`[PLANETS] Loading page...`);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.genID !== '?', {
    timeout: 10000,
  });
  await page.waitForTimeout(1000);

  console.log(`[PLANETS] Generating ${COUNT} planets at ${SIZE}x${SIZE}...`);

  const logLines = [];
  const LOG_PATH = path.join(OUTPUT_DIR, 'planets_params.log');

  for (let i = 0; i < COUNT; i++) {
    const seed = `planet${i.toString(16).padStart(8, '0')}`;

    const params = await page.evaluate((s) => {
      window.genFromID(s);
      return {
        seed: s,
        angle: window.vAngle,
        rotspeed: window.vRotspeed,
        light: window.vLight,
        zLight: window.vZLight,
        modValue: window.vModValue,
        noiseOffset: window.vNoiseOffset,
        noiseScale: window.vNoiseScale,
        noiseScale2: window.vNoiseScale2,
        noiseScale3: window.vNoiseScale3,
        cloudNoise: window.vCloudNoise,
        cloudiness: window.vCloudiness,
        waterLevel: window.vWaterLevel,
        rivers: window.vRivers,
        temperature: window.vTemperature,
        ocean: window.vOcean,
        cold: window.vCold,
        temperate: window.vTemperate,
        warm: window.vWarm,
        hot: window.vHot,
        speckle: window.vSpeckle,
        clouds: window.vClouds,
        haze: window.vHaze,
        lightColor: window.vLightColor,
      };
    }, seed);

    await page.waitForTimeout(200);

    const dataUrl = await page.evaluate((sz) => {
      return new Promise((resolve) => {
        window.renderPlanet(sz);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(document.getElementById('c').toDataURL('image/png'));
          });
        });
      });
    }, SIZE);

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const outPath = path.join(
      OUTPUT_DIR,
      `planet_${String(i).padStart(3, '0')}.png`
    );
    fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));

    // Log parameters
    const fname = `planet_${String(i).padStart(3, '0')}.png`;
    logLines.push(`# ${fname}`);
    for (const [key, val] of Object.entries(params)) {
      const valStr = Array.isArray(val) ? `[${val.join(', ')}]` : val;
      logLines.push(`${key}=${valStr}`);
    }
    logLines.push('');

    if ((i + 1) % 10 === 0) {
      console.log(`  ${i + 1}/${COUNT} done`);
    }
  }

  console.log(`[PLANETS] All ${COUNT} planets saved to ${OUTPUT_DIR}`);
  fs.writeFileSync(LOG_PATH, logLines.join('\n'));
  console.log(`[PLANETS] Parameter log saved to ${LOG_PATH}`);

  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error('[PLANETS] Fatal error:', err);
  process.exit(1);
});
