import { createLocalApi } from './server';

createLocalApi({
  domain: process.env.AUTH0_DOMAIN ?? '',
  audience: process.env.AUTH0_AUDIENCE ?? '',
  allowedOrigins: process.env.ALLOWED_ORIGINS,
}).listen(4000, '127.0.0.1', () => console.log('Local API stand-in listening at http://localhost:4000 (not AWS API Gateway)'));
