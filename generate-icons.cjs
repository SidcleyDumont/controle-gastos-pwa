const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const svgPath = path.join(__dirname, 'public', 'icon-source.svg')
const svgBuffer = fs.readFileSync(svgPath)

const icons = [
  { file: 'pwa-64x64.png',             size: 64  },
  { file: 'pwa-192x192.png',           size: 192 },
  { file: 'pwa-512x512.png',           size: 512 },
  { file: 'maskable-icon-512x512.png', size: 512 },
  { file: 'apple-touch-icon-180x180.png', size: 180 },
]

async function generate() {
  for (const { file, size } of icons) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, 'public', file))
    console.log(`✅ ${file} (${size}x${size})`)
  }
  console.log('\n🎉 Todos os ícones gerados em public/')
}

generate().catch(console.error)
