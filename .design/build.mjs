import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const css = readFileSync('_base.css', 'utf8');
const shell = (body, extra = '') => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
${css}
${extra}
  </style>
</helmet>
${body}
</x-dc>
</body>
</html>
`;

for (const f of readdirSync('.').filter((n) => n.endsWith('.body.html'))) {
  const name = f.replace('.body.html', '');
  let raw = readFileSync(f, 'utf8');
  raw = raw.replace(/<!--INCLUDE:([\w.-]+)-->/g, (_, p) => readFileSync(p, 'utf8'));
  const [extra, body] = raw.includes('<!--CSS-->')
    ? [raw.split('<!--CSS-->')[1].split('<!--/CSS-->')[0], raw.split('<!--/CSS-->')[1]]
    : ['', raw];
  writeFileSync(`${name}.dc.html`, shell(body.trim(), extra.trim()));
  console.log(`built ${name}.dc.html`);
}
