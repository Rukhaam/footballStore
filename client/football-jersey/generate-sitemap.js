import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES Modules (Vite/React environments)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://www.kineticstore.page'; 

// Fetch BOTH products and collections for a complete sitemap
const PRODUCTS_API_URL = 'https://footballstore-f2bp.onrender.com/api/store/jerseys';
const COLLECTIONS_API_URL = 'https://footballstore-f2bp.onrender.com/api/store/collections';

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

    // 2. Fetch Dynamic Product Routes
    const productsResponse = await fetch(PRODUCTS_API_URL);
    const productsData = await productsResponse.json();
    const products = productsData.data || productsData || [];

    const productRoutes = products.map(product => {
      const name = product.productName || '';
      const slug = product.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `/product/${slug}`;
    });

    // 3. Fetch Dynamic Collection Routes
    const collectionsResponse = await fetch(COLLECTIONS_API_URL);
    const collectionsData = await collectionsResponse.json();
    const collections = collectionsData.data || collectionsData || [];

    const collectionRoutes = collections.map(collection => {
      const name = collection.collectionName || collection.name || '';
      const slug = collection.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `/collection/${slug}`;
    });

    // 4. Combine all routes together
    const allRoutes = [...staticRoutes, ...productRoutes, ...collectionRoutes];

    // 5. Build the XML structure
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(route => {
    // Determine priority based on route type
    let priority = '0.8';
    let changefreq = 'weekly';
    
    if (route === '/') {
      priority = '1.0';
      changefreq = 'daily';
    } else if (route.includes('/product/') || route.includes('/collection/')) {
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

    // 6. Write the file to your public folder
    const targetPath = path.join(__dirname, 'public', 'sitemap.xml');
    fs.writeFileSync(targetPath, sitemap);
    
    console.log('✅ Sitemap successfully generated at public/sitemap.xml');
    console.log(`🔗 Total URLs Indexed: ${allRoutes.length}`);

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
}

generateSitemap();
