export class QrCodeType {
    constructor(version, level) {
        this.version = version;
        this.level = level;
    }
    version;
    level;

    getNotation() {
        return this.version + "-" + this.level;
    }
}

export class Module {
    constructor(block) {
        this.block = block;
        this.drew = false;
    }
    block;
    drew;
}
