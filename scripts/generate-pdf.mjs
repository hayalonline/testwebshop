import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, 'security_report.html');
const pdfPath  = resolve(__dirname, '..', 'SECURITY_AUDIT_REPORT.pdf');

console.log('🚀 Launching browser...');
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123 });

  console.log('📄 Loading HTML report (waiting for fonts)...');
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  // Extra wait for Google Fonts to render
  await new Promise(r => setTimeout(r, 1500));

  console.log('🖨️  Generating PDF...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    displayHeaderFooter: false,
  });

  console.log(`✅ PDF gegenereerd: ${pdfPath}`);
} finally {
  await browser.close();
}
