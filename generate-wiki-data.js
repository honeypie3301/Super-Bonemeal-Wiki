import fs from 'fs';
import path from 'path';

const wikiDir = path.join(process.cwd(), 'wiki_assets', 'wiki');

// Ensure directory exists
if (!fs.existsSync(wikiDir)) {
  fs.mkdirSync(wikiDir, { recursive: true });
}

// Map files to display names, categories, and custom order
const articleMeta = {
  'Home.txt': { title: 'Home', category: 'Core Guide', order: 1 },
  'Items.txt': { title: 'Items & Mechanics', category: 'Features & Gear', order: 2 },
  'Versions.txt': { title: 'Version History', category: 'Changelog', order: 3 },
};

const catOrder = {
  'Core Guide': 1,
  'Features & Gear': 2,
  'Changelog': 3
};

function generateWikiManifest() {
  if (!fs.existsSync(wikiDir)) {
    console.error('Wiki directory not found:', wikiDir);
    return;
  }

  const files = fs.readdirSync(wikiDir);
  const manifest = [];

  for (const file of files) {
    if (file.endsWith('.txt')) {
      const slug = file.replace('.txt', '').toLowerCase();
      const meta = articleMeta[file] || { title: file.replace('.txt', ''), category: 'Other', order: 99 };
      
      manifest.push({
        slug,
        title: meta.title,
        filename: file,
        category: meta.category,
        order: meta.order
      });
    }
  }

  // Sort manifest based on category order, then item order
  manifest.sort((a, b) => {
    if (a.category !== b.category) {
      return (catOrder[a.category] || 99) - (catOrder[b.category] || 99);
    }
    return a.order - b.order;
  });

  const manifestPath = path.join(wikiDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Generated manifest.json with ${manifest.length} articles.`);
}

generateWikiManifest();
