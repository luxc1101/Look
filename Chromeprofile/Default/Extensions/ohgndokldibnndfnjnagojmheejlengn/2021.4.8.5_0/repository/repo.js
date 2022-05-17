class Repo {

    constructor(type) {
        this.isCitavi5 = false;
        this.version = "6.0.0.0";
        this.version_major = 6;
        this._type = type;
    }

    get type() {
        return this._type;
    }

    get isLocal() {
        return this instanceof LocalRepo;
    }
    get isWeb() {
        return this instanceof WebRepo;
    }
}