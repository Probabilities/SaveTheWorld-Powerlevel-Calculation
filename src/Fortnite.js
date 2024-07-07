const { request } = require('undici');
const fs = require('fs');

class AccountHandler {
    static updateValue(old_access_token, key, value) {
        const data = JSON.parse(fs.readFileSync('./device_auths.json', 'utf-8'))
        
        for(const account of data) {
            if(account.access_token == old_access_token) {
                account[key] = value
            }
        }

        fs.writeFileSync('./device_auths.json', JSON.stringify(data, null, 4))
    }
}

class FortniteApi {
    constructor(data) {
        this.secret = data.secret;
        this.accountId = data.account_id;
        this.deviceId = data.deviceId;
        this.access_token = data.access_token;
        this.username = data.username;
    }

    async refreshToken() {
        const req = await request('https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'basic ZWM2ODRiOGM2ODdmNDc5ZmFkZWEzY2IyYWQ4M2Y1YzY6ZTFmMzFjMjExZjI4NDEzMTg2MjYyZDM3YTEzZmM4NGQ='
            },
            body: new URLSearchParams({
                grant_type: 'device_auth',
                account_id: this.accountId,
                device_id: this.deviceId,
                secret: this.secret
            }).toString()
        }).catch(() => {
            return { failed: true, response: 'Failed to make the request.' }
        })

        const data = await this.parsebody(req)
        console.log(data)

        const error = await this.handleError(data, req);
        if(error?.retry) {
            return await this.refreshToken()
        }else if(error?.failed) {
            return { failed: true, response: error.response }
        }

        if(data?.access_token) {
            AccountHandler.updateValue(this.access_token, 'access_token', data.access_token)
            this.access_token = data.access_token
        }

        return data
    }
    
    async handleError(data, req, refreshToken = true) {
        switch(data?.errorCode) {
            // Errors to do with logging in
            case 'errors.com.epicgames.common.oauth.invalid_token':
            case 'errors.com.epicgames.common.authentication.token_verification_failed':
                if(!refreshToken) {
                    console.log('Invalid token. Please restart the program.')
                    process.exit(1)
                }
                
                await this.refreshToken();
                return { retry: true, reason: 'Token has been refreshed' }
            
            // Errors to do with friends or players
            case 'errors.com.epicgames.friends.duplicate_friendship':
                return { failed: true, response: 'You are already friends with this player.' }
            
            case 'errors.com.epicgames.friends.friend_request_already_sent':
                return { failed: true, response: 'You have already sent a friend request to this player. Please wait for our system to accept it.' }
        
            case 'errors.com.epicgames.friends.friendship_not_found':
                return { failed: true, response: 'You are not friends with this player.' }

            case 'errors.com.epicgames.friends.invalid_friendship':
                return { failed: true, response: 'Invalid friendship. Is this your account?' }

            case 'errors.com.epicgames.account.account_not_found':
                return { failed: true, response: 'Account not found.', key: 'NOT_FOUND' }

        }

        if(req?.statusCode == 200 || req?.statusCode == 201 || req?.statusCode == 204) {
            return data;
        }

        if(!data) {
            await new Promise((x) => setTimeout(x, 1000))
            return { retry: true, reason: 'NO DATA' }
        }

        return { failed: true, response: typeof data == 'object' ? JSON.stringify(data) : data }
    }

    async parsebody(req) {
        req = await req?.body?.text?.()
        try{
            req = JSON.parse(req);
        }catch{}

        if(req?.includes?.('502')) {
            console.log('[502] Bad Gateway. This is fortnite issue, wait for them to resolve it. Fast swap wont be very good right now.')
        }

        return req;
    }

    async queryProfile(profileId, operation, route) {
        const req = await request(`https://fngw-mcp-gc-livefn.ol.epicgames.com/fortnite/api/game/v2/profile/${this.accountId}/${route}/${operation}`, {
            method: 'POST',
            query: {
                profileId: profileId,
                rvn: -1
            },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `bearer ${this.access_token}`
            },
            body: JSON.stringify({})
        }).catch(() => {
            return { failed: true, response: 'Failed to make the request.' }
        })

        const data = await this.parsebody(req)

        const error = await this.handleError(data, req);
        if(error?.retry) {
            console.log('Retrying queryProfile.', error.reason)
            return await this.queryProfile(profileId, operation, route)
        }else if(error?.failed) {
            console.log(`QueryProfile failed.`, error)
            return { failed: true, response: error.response }
        }

        return data
    }
}

module.exports = FortniteApi;