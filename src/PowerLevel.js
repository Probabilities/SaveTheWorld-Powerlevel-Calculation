const STWSurvivor = require('./Structures/STWSurvivor');
const PowerLevelCurves = require('./Util/PowerLevelCurves');

class PowerLevel {
    constructor(profile) {
        const profile_items = profile.profileChanges[0]?.profile?.items;

        const items = []

        for (const [itemId, item] of Object.entries(profile_items)) {
            const type = item.templateId.split(':')[0]

            switch (type) {
                case 'Worker':
                    items.push(new STWSurvivor(item))
                    break
                default:
                    items.push({
                        id: itemId,
                        templateId: item.templateId,
                        quantity: item.quantity,
                        attributes: item.attributes
                    })
                    break
            }
        }

        this.items = items
    }

    calculatePowerLevel() {
        const totalFORTStats = Object.values(this.FORTStats()).reduceRight((prev, cur) => prev + cur);
        return PowerLevelCurves.homebaseRating.eval(totalFORTStats * 4);
    }

    calculateVenturePowerLevel() {
        const totalFORTStats = Object.values(this.researchFORTStats(true)).reduce((prev, cur) => prev + cur);
        return PowerLevelCurves.homebaseRating.eval(totalFORTStats * 4);
    }

    FORTStats() {
        const FORTStats = {
            fortitude: 0,
            offense: 0,
            resistance: 0,
            tech: 0,
        };

        for (const FORTStat of [this.survivorFORTStats(), this.researchFORTStats()]) {
            Object.keys(FORTStat).forEach((k) => {
                FORTStats[k] += FORTStat[k];
            });
        }

        return FORTStats;
    }

    getSurvivorSquads() {
        const _squads = {
            trainingteam: [],
            fireteamalpha: [],
            closeassaultsquad: [],
            thethinktank: [],
            emtsquad: [],
            corpsofengineering: [],
            scoutingparty: [],
            gadgeteers: [],
        }

        const survivors = this.items.filter((i) => i instanceof STWSurvivor)

        for (const survivor of survivors.filter((s) => !!s.squad)) {
            _squads[survivor.squad.name].push(survivor);
        }

        return _squads
    }

    survivorFORTStats() {
        const survivorFORTStats = {
            fortitude: 0,
            offense: 0,
            resistance: 0,
            tech: 0,
        }

        for (const survivorSquad of Object.values(this.getSurvivorSquads())) {
            const leadSurvivor = survivorSquad.find((x) => x.squad.slotIdx === 0)

            for (const survivor of survivorSquad) {
                let totalBonus = survivor.powerLevel

                if (survivor.squad.slotIdx === 0) totalBonus += survivor.leadBonus
                else if (leadSurvivor) totalBonus += survivor.calcSurvivorBonus(leadSurvivor)

                switch (survivor.squad.type) {
                    case 'medicine':
                        survivorFORTStats.fortitude += totalBonus
                        break
                    case 'arms':
                        survivorFORTStats.offense += totalBonus
                        break
                    case 'synthesis':
                        survivorFORTStats.tech += totalBonus
                        break
                    case 'scavenging':
                        survivorFORTStats.resistance += totalBonus
                        break
                }
            }
        }

        return survivorFORTStats
    }

    researchFORTStats(isVentures) {
        const FORTStats = {
            fortitude: 0,
            offense: 0,
            resistance: 0,
            tech: 0,
        };
    
        for (const value of this.items) {
            if (value.templateId.startsWith('Stat:')) {
                if ((isVentures && value.templateId.includes('phoenix')) || (!isVentures && !value.templateId.includes('phoenix'))) {
                    if (value.templateId.includes('fortitude')) FORTStats.fortitude += value.quantity;
                    else if (value.templateId.includes('resistance')) FORTStats.resistance += value.quantity;
                    else if (value.templateId.includes('technology')) FORTStats.tech += value.quantity;
                    else if (value.templateId.includes('offense')) FORTStats.offense += value.quantity;
                }
            }
        }
    
        return FORTStats;
    }
    
}

module.exports = PowerLevel;