import fs from 'node:fs';
import defaults from '../data/content.json' with { type: 'json' };

fs.rmSync('dist',{recursive:true,force:true});
fs.mkdirSync('dist',{recursive:true});

// Admin
fs.cpSync('admin','dist/admin',{recursive:true});

// Uploaded media
if (fs.existsSync('public/uploads')) {
  fs.cpSync('public/uploads','dist/uploads',{recursive:true});
}

// Static site files
fs.copyFileSync('src/public.html','dist/index.html');
fs.copyFileSync('src/style.css','dist/style.css');

// Bake the current portfolio content directly into the deployed JavaScript.
// This avoids depending on /api/content, which does not exist on static hosting.
let js=fs.readFileSync('src/public.js','utf8');
js=js.replace(
  "const r=await fetch('/api/content');if(!r.ok)throw Error();const d=await r.json();",
  `const d=${JSON.stringify(defaults)};`
);
fs.writeFileSync('dist/public.js',js);

fs.copyFileSync('public/sample.png','dist/sample.jpg');
fs.writeFileSync(
  'dist/favicon.svg',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#4424ff"/><path d="M12 47 25 16h8l13 31h-9l-2-7H22l-2 7zm13-15h7l-3-10z" fill="white"/><path d="M45 17h7v30h-7z" fill="#a77aff"/></svg>'
);
