const PowerLevelCurves = require('../Util/PowerLevelCurves');

class STWSurvivor {
    constructor(data) {
        this.templateId = data.templateId

        const parsedSurvivor = this.parseSTWSurvivorTemplateId(data.templateId);

        this.type = parsedSurvivor.type;
        this.leader = (this.type === 'manager')

        this.name = parsedSurvivor.name;
        this.tier = parsedSurvivor.tier;
        this.rarity = parsedSurvivor.rarity;

        this.managerSynergy = data.attributes.managerSynergy;

        this.level = data.attributes.level;

        this.squad = data.attributes.squad_id ? {
            id: data.attributes.squad_id,
            name: data.attributes.squad_id.split('_')[3],
            type: data.attributes.squad_id.split('_')[2],
            slotIdx: data.attributes.squad_slot_idx,
        } : null;

        this.personality = data.attributes.personality;

        this.powerLevel = this.calculatePowerLevel()
        this.leadBonus = this.getLeadBonus();
    }

    parseSTWSurvivorTemplateId() {
        const id = this.templateId.split(':')[1];
        const fields = id.split('_');

        let type;
        const rawType = fields.shift();
        if (rawType === 'worker') type = 'special';
        else if (rawType?.includes('manager')) type = 'manager';
        else type = 'basic';

        const tier = parseInt(fields.pop().slice(1), 10);
        const rarity = (type === 'manager' ? fields.shift() : fields.pop());
        const name = fields[0] ? fields.join('_') : undefined;

        return {
            type,
            tier,
            rarity,
            name,
        };
    }

    calculatePowerLevel() {
        const key = this.leader
            ? `manager_${this.rarity}_t0${this.tier}`
            : `default_${this.rarity}_t0${this.tier}`;

        const rating = PowerLevelCurves.survivorItemRating[key].eval(this.level)

        return rating;
    }

    getLeadBonus() {
        if (!this.managerSynergy || !this.squad) return 0;

        const STWLeadSynergy = {
            trainingteam: 'IsTrainer',
            fireteamalpha: 'IsSoldier',
            closeassaultsquad: 'IsMartialArtist',
            thethinktank: 'IsInventor',
            emtsquad: 'IsDoctor',
            corpsofengineering: 'IsEngineer',
            scoutingparty: 'IsExplorer',
            gadgeteers: 'IsGadgeteer',
        }

        const leaderMatch = this.managerSynergy.split('.')[2];
        if (STWLeadSynergy[this.squad.name] === leaderMatch) {
            return this.powerLevel;
        }
        return 0;
    }

    calcSurvivorBonus(leader) {
        if (this.leader) return 0;
        if (!leader.leader) return 0

        if (this.personality === leader.personality) {
            if (leader.rarity === 'sr') return 8;
            if (leader.rarity === 'vr') return 5;
            if (leader.rarity === 'r') return 4;
            if (leader.rarity === 'uc') return 3;
            if (leader.rarity === 'c') return 2;
        } else if (leader.rarity === 'sr') {
            if (this.powerLevel <= 2) return 0;
            return -2;
        }

        return 0;
    }
}

module.exports = STWSurvivor;