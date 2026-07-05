import puppeteer from 'puppeteer';

async function debugDoubanPage() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    console.log('\n=== 测试电影页面 ===');
    await page.goto('https://movie.douban.com/subject/26754880/', { waitUntil: 'networkidle0' });
    
    const movieData = await page.evaluate(() => {
      const results = {};
      
      const summaryEl = document.querySelector('[property="v:summary"]');
      results['v:summary'] = summaryEl ? summaryEl.textContent.trim().substring(0, 200) : null;
      
      const relatedInfo = document.querySelector('.related-info');
      results['.related-info'] = relatedInfo ? relatedInfo.textContent.trim().substring(0, 200) : null;
      
      const allText = document.body.innerText;
      const match = allText.match(/剧情简介[\s\S]{0,50}/);
      results['剧情简介匹配'] = match ? match[0].substring(0, 200) : null;
      
      return results;
    });
    
    console.log(JSON.stringify(movieData, null, 2));
    
    console.log('\n=== 测试书籍页面 ===');
    await page.goto('https://book.douban.com/subject/26275998/', { waitUntil: 'networkidle0' });
    
    const bookData = await page.evaluate(() => {
      const results = {};
      
      const intro = document.querySelector('.intro, .summary');
      results['.intro/.summary'] = intro ? intro.textContent.trim().substring(0, 200) : null;
      
      const allText = document.body.innerText;
      const match = allText.match(/内容简介[\s\S]{0,100}/);
      results['内容简介匹配'] = match ? match[0].substring(0, 200) : null;
      
      return results;
    });
    
    console.log(JSON.stringify(bookData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugDoubanPage();
