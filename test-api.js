const http = require('http');

const data = JSON.stringify({
  email: 'newtechx@dehood.com',
  password: 'password123',
  name: 'New Tech',
  role: 'technician',
  phone: '0000',
  knowledgeLevel: 'Aprendiz',
  address: ''
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/users',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'userId=1'
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
