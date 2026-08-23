const http = require('http');

async function getIDToken(audience) {
  return new Promise((resolve, reject) => {
    const url = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${encodeURIComponent(audience)}`;
    const req = http.get(url, {
      headers: { 'Metadata-Flavor': 'Google' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data.trim());
        } else {
          reject(new Error(`Metadata server returned ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
  });
}

async function callControlPlane(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 8000,
      path: path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: data });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const devUrl = 'https://ais-dev-cdcginmurxf4cwctj6yhzo-1039531389342.asia-southeast1.run.app';
  const preUrl = 'https://ais-pre-cdcginmurxf4cwctj6yhzo-1039531389342.asia-southeast1.run.app';
  
  const candidates = [
    devUrl,
    preUrl,
    'https://aistudio.google.com/applet/8488633b-5f66-475d-a012-1e6dbc5c8753'
  ];

  for (const aud of candidates) {
    console.log(`Testing audience: ${aud}`);
    try {
      const token = await getIDToken(aud);
      const res = await callControlPlane('/api/db/migrate', token);
      console.log(`Result for ${aud}: status=${res.statusCode}, response=${res.data}`);
    } catch (err) {
      console.log(`Error testing ${aud}: ${err.message}`);
    }
    console.log('---');
  }
}

main();
