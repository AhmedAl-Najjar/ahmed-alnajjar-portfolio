import fs from 'node:fs';
import path from 'node:path';
import defaultsRaw from '../data/content.json' with { type: 'json' };

const defaults = JSON.parse(JSON.stringify(defaultsRaw));
const mimeFor = ext => ({'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml'}[ext.toLowerCase()] || 'application/octet-stream');

for (const project of defaults.projects || []) {
  project.images = (project.images || []).map(src => {
    if (typeof src !== 'string' || !src.startsWith('/uploads/')) return src;
    const filePath = path.join('public', src);
    if (!fs.existsSync(filePath)) return src;
    const mime = mimeFor(path.extname(filePath));
    const base64 = fs.readFileSync(filePath).toString('base64');
    return `data:${mime};base64,${base64}`;
  });
}

fs.rmSync('dist',{recursive:true,force:true});
fs.mkdirSync('dist',{recursive:true});
fs.cpSync('admin','dist/admin',{recursive:true});
if (fs.existsSync('public/uploads')) {
  fs.mkdirSync('dist/uploads',{recursive:true});
  for (const file of fs.readdirSync('public/uploads')) {
    const src='public/uploads/'+file;
    const dest='dist/uploads/'+file;
    if (fs.statSync(src).isFile()) fs.copyFileSync(src,dest);
  }
}
for (const file of ['public.html','style.css']) fs.copyFileSync('src/'+file,'dist/'+(file==='public.html'?'index.html':file));
let js=fs.readFileSync('src/public.js','utf8');
js=js.replace("const r=await fetch('/api/content');if(!r.ok)throw Error();const d=await r.json();", `const fallback=${JSON.stringify(defaults)};const r=await fetch('/api/content');const d=r.ok?await r.json():fallback;`);
fs.writeFileSync('dist/public.js',js);
fs.copyFileSync('public/sample.png','dist/sample.jpg');
fs.writeFileSync('dist/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#4424ff"/><path d="M12 47 25 16h8l13 31h-9l-2-7H22l-2 7zm13-15h7l-3-10z" fill="white"/><path d="M45 17h7v30h-7z" fill="#a77aff"/></svg>');
