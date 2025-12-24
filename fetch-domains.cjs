const https = require('https');

const options = {
    hostname: 'api.resend.com',
    path: '/domains',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer re_fdXz1xQm_HusjuCPriNuBYwQYJTN7Zix1',
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(data);
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.end();
