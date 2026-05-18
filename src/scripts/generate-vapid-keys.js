// Run: node src/scripts/generate-vapid-keys.js
// Copy the output to .env.local and Vercel environment variables.
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + keys.publicKey);
