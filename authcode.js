const { request } = require('undici');
const fs = require('fs');

const auth_code = '';

(async() => {

    const response = await request('https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'basic ZWM2ODRiOGM2ODdmNDc5ZmFkZWEzY2IyYWQ4M2Y1YzY6ZTFmMzFjMjExZjI4NDEzMTg2MjYyZDM3YTEzZmM4NGQ=',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: auth_code,
        }).toString()
    })

    const data = await response.body.json()

    console.log(data)
    if(!data?.access_token) {
        console.log('Failed to get access token.')
        return
    }

    const current_auths = JSON.parse(fs.readFileSync('./device_auths.json', 'utf-8'))
    current_auths.push(data)
    fs.writeFileSync('./device_auths.json', JSON.stringify(current_auths, null, 4))
})()