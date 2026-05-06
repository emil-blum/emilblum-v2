#!/usr/bin/env node
'use strict';

// Scans assets/art/, reads real dimensions via sips, extracts titles from
// filenames, and writes assets/art/manifest.json.
//
// Usage: node generate-art-manifest.js
// Run this whenever you add or remove images from assets/art/.

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ART_DIR = path.join(__dirname, 'assets/art');
const OUT     = path.join(ART_DIR, 'manifest.json');

function getDimensions(filepath) {
  const result = execSync(`sips -g pixelWidth -g pixelHeight "${filepath}"`, { encoding: 'utf8' });
  const w = result.match(/pixelWidth:\s*(\d+)/)?.[1];
  const h = result.match(/pixelHeight:\s*(\d+)/)?.[1];
  if (!w || !h) throw new Error(`Could not read dimensions for ${filepath}`);
  return { w: parseInt(w, 10), h: parseInt(h, 10) };
}

function titleFromFilename(filename) {
  // "28_Emil-Art_Prioritise-Peace.avif" → "Prioritise Peace"
  const base = path.parse(filename).name;
  const afterPrefix = base.replace(/^\d+_Emil-Art_/, '');
  return afterPrefix.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}

const files = fs.readdirSync(ART_DIR)
  .filter(f => /\.(avif|gif)$/i.test(f))
  .sort();

const artworks = files.map(filename => {
  const filepath = path.join(ART_DIR, filename);
  const { w, h } = getDimensions(filepath);
  const title = titleFromFilename(filename);
  console.log(`  ${filename} → "${title}" (${w}×${h})`);
  return { src: `assets/art/${filename}`, alt: title, title, meta: '', w, h };
});

fs.writeFileSync(OUT, JSON.stringify(artworks, null, 2));
console.log(`\n✓ ${artworks.length} artworks written to assets/art/manifest.json`);
