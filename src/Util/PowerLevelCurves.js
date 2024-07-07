const HomebaseRatingMapping = require('../resources/HomebaseRatingMapping.json');
const SurvivorItemRating = require('../resources/SurvivorItemRating.json');
const CurveTable = require('./CurveTable');

function mapCurveTables(struc) {
    const entries1 = Object.entries(struc);
    const entries2 = entries1.map(([k, v]) => [k.toLowerCase(), Object.freeze(new CurveTable(v.Keys))]);

    const obj = Object.fromEntries(entries2);
    return Object.freeze(obj);
}

module.exports = {
    homebaseRating: Object.freeze(new CurveTable(HomebaseRatingMapping[0].ExportValue.UIMonsterRating.Keys)),
    survivorItemRating: mapCurveTables(SurvivorItemRating[0].ExportValue)
}