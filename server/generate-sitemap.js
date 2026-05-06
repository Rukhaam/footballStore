// generate-sitemap.js
const fs = require('fs');

// IMPORTANT: Replace with your actual live domain and API URL
const SITE_URL = 'https://www.kineticstore.page'; 
const API_URL = 'https://kinetic-backend-bzdmh2b5bqagd0e8.centralindia-01.azurewebsites.net/api/store/collections'; 

async function generateSitemap() {
  try {
    console.log('Generating sitemap...');

    // 1. Define your static routes
    const staticRoutes = [
      '/',
      '/contact',
      '/orders',
      '/auth',
      '/category/all',
      '/category/home-kits',
      '/category/retro'
    ];

    // 2. Fetch your dynamic product routes from your backend
    // (Using native Node fetch, available in Node 18+)
    const response = await fetch(API_URL);
    const data = await response.json();
    const products = data.data || data || [];

    // Extract product slugs (Assuming you have a slug field or generate it)
    const productRoutes = products.map(product => {
      // If your API doesn't return a slug, replicate your slugify logic here:
      const slug = product.slug || product.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `/product/${slug}`;
    });

    // 3. Combine all routes
    const allRoutes = [...staticRoutes, ...productRoutes];

    // 4. Build the XML structure
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(route => {
    // Give the homepage highest priority, products high priority, others normal
    let priority = '0.8';
    let changefreq = 'weekly';
    
    if (route === '/') {
      priority = '1.0';
      changefreq = 'daily';
    } else if (route.includes('/product/')) {
      priority = '0.9';
    }

    return `
  <url>
    <loc>${SITE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('')}
</urlset>`;

    // 5. Write the file to your public folder
    // When you build your React app, everything in public/ gets served at the root URL
    fs.writeFileSync('./public/sitemap.xml', sitemap);
    
    console.log('✅ Sitemap successfully generated at public/sitemap.xml');
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
}

generateSitemap();