const Fortnite = require('./src/Fortnite');
const PowerLevel = require('./src/PowerLevel');
const fs = require('fs');

const auths = JSON.parse(fs.readFileSync('./device_auths.json', 'utf-8'));
const account = auths[0]
const FNApi = new Fortnite(account);

(async() => {
    const data = await FNApi.queryProfile('campaign', 'QueryPublicProfile', 'public')
    
    const PL_ = new PowerLevel(data)
    const powerRating = PL_.calculatePowerLevel()
    console.log(`Normal Power Rating: ${powerRating}`)

    const ventureRating = PL_.calculateVenturePowerLevel()
    console.log(`Venture Power Rating: ${ventureRating}`)
})()