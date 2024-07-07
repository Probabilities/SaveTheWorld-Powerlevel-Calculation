class CurveTable {
    constructor(data) {
        this.keys = [];

        for (const value of data) {
            this.keys.push([value.KeyTime, value.KeyValue]);
        }
    }

    eval(key) {
        if (key < this.keys[0][0]) {
            return this.keys[0][1];
        }

        if (key >= this.keys[this.keys.length - 1][0]) {
            return this.keys[this.keys.length - 1][1];
        }

        const index = this.keys.findIndex((k) => k[0] > key);

        const prev = this.keys[index - 1];
        const next = this.keys[index];

        const fac = (key - prev[0]) / (next[0] - prev[0]);
        const final = prev[1] * (1 - fac) + next[1] * fac;

        return final;
    }
}

module.exports = CurveTable;
