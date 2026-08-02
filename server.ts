const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req: any, res: any) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.on('error', (err: any) => {
    console.error('Server error:', err);
  });

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
}).catch((err: any) => {
  console.error('Error during app.prepare():', err);
  process.exit(1);
});
