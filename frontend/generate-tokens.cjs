const crypto = require('crypto');

function base64url(str) {
    return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function generateJwt(email) {
    const header = JSON.stringify({ alg: 'HS256' });
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 86400;
    const payload = JSON.stringify({ sub: email, iat: iat, exp: exp });

    const unsignedToken = base64url(header) + "." + base64url(payload);

    // Backend uses Decoders.BASE64.decode(jwtSecret)
    const secretB64 = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    const secret = Buffer.from(secretB64, 'base64');

    const signature = crypto.createHmac('sha256', secret).update(unsignedToken).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    return unsignedToken + "." + signature;
}

console.log("TOKEN_KARAN=" + generateJwt("karanthejkk@gmail.com"));
console.log("TOKEN_ADITHYA=" + generateJwt("adithya70755@gmail.com"));
