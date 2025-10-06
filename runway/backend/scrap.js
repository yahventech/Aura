// scrap_catalog_all.js
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");

async function scrapeJumiaKeyword(keyword) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  const baseUrl = `https://www.jumia.co.ke/catalog/?q=${encodeURIComponent(keyword)}`;
  console.log(`🔍 Start scraping keyword: "${keyword}"`);

  let pageNum = 1;
  while (true) {
    const url = `${baseUrl}&page=${pageNum}`;
    console.log(`   → Fetching page ${pageNum}: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }).catch(err => {
      console.error(`⚠️ Load error on page ${pageNum}: ${err.message}`);
      return;
    });

    // Check if product cards exist
    let html = await page.content();
    const $ = cheerio.load(html);

    const items = $("article.prd");
    if (!items.length) {
      console.log(`   ⚠️ No items found on page ${pageNum}. Stopping for this keyword.`);
      break;
    }

    items.each((i, el) => {
      const title = $(el).find(".name").text().trim();
      const price = $(el).find(".prc").text().trim();
      const image =
        $(el).find("img").attr("data-src") || $(el).find("img").attr("src");
      const href = $(el).find("a.core").attr("href");
      const link = href ? `https://www.jumia.co.ke${href}` : null;

      if (title && price) {
        results.push({
          keyword,
          title,
          price,
          image,
          link,
        });
      }
    });

    console.log(`   → Collected: ${results.length} items so far for "${keyword}"`);

    pageNum += 1;
    // small delay to reduce stress
    // small delay to reduce stress
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

  }

  await browser.close();
  return results;
}

async function run() {
  // List all keywords/categories you want to scrape
  const keywords = [
    "shoes",
    "phones",
    "laptops",
    "clothes",
    "bags",
    "watches",
    "headphones"
  ];

  let allResults = [];

  for (const kw of keywords) {
    const items = await scrapeJumiaKeyword(kw);
    console.log(`✅ Keyword "${kw}" scraped: ${items.length} items`);
    allResults = allResults.concat(items);
  }

  fs.writeFileSync("jumia_catalog_all.json", JSON.stringify(allResults, null, 2));
  console.log("📦 All done. Saved in jumia_catalog_all.json");
}

run();
