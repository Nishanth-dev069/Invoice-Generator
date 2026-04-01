const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
};

// Strategic exact matches for color classes from old theme to new theme
const map = {
  'bg-brand-navy': 'bg-brand-forest',
  'text-brand-navy': 'text-brand-forest',
  'border-brand-navy': 'border-brand-forest',
  'ring-brand-navy': 'ring-brand-forest',
  'bg-brand-navy-light': 'bg-brand-sage',
  'bg-brand-orange': 'bg-brand-forest', // Old primary CTA becomes forest primary
  'text-brand-orange': 'text-brand-forest', // Text highlights become forest
  'border-brand-orange': 'border-brand-sage',
  'focus:ring-brand-orange': 'focus:ring-brand-sage',
  'ring-brand-orange': 'ring-brand-sage',
  'hover:bg-brand-orange-hover': 'hover:bg-brand-forest/90',
  'hover:text-brand-orange': 'hover:text-brand-sage',
  'text-brand-orange-hover': 'text-brand-forest/90',
  'bg-brand-orange-hover': 'bg-brand-forest/90',
  'brand-orange/50': 'brand-sage/50',
};

const files = [...walk('./app'), ...walk('./components')];
let updateCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Sort keys by length descending to prevent partial replacements (e.g. hover:bg-brand-orange-hover must run before bg-brand-orange)
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  
  keys.forEach(key => {
    if (content.includes(key)) {
      content = content.split(key).join(map[key]);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    updateCount++;
  }
});

console.log(`Global token swap complete. Modified ${updateCount} files.`);
