import puppeteer from 'puppeteer';

async function debugMoviePage() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://movie.douban.com/subject/26754880/', { waitUntil: 'networkidle0' });
    
    const html = await page.evaluate(() => {
      // 查找包含"剧情简介"的元素
      const bodyText = document.body.innerText;
      const lines = bodyText.split('\n').filter(line => line.trim());
      
      // 找到包含剧情简介的行及其后的内容
      let found = false;
      let description = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('剧情简介')) {
          found = true;
          continue;
        }
        if (found) {
          if (lines[i].length > 10) {
            description.push(lines[i]);
          }
          if (description.length >= 3) break;
        }
      }
      
      return {
        hasPlotSummary: bodyText.includes('剧情简介'),
        description: description.join('\n').substring(0, 500),
        first500Chars: bodyText.substring(0, 500)
      };
    });
    
    console.log(JSON.stringify(html, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugMoviePage();
