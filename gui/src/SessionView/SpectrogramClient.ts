class SpectrogramClient {
    #isInitialized: boolean = false
    constructor(uri: string, public samplingFrequency: number, public durationSec: number, public numFrequencies: number) {

    }
    async initialize() {
        this.#isInitialized = true
    }
    public get numTimepoints() {
        return Math.ceil(this.durationSec * this.samplingFrequency)
    }
    getValue(t: number, f: number) {
        return 0
    }
}

export default SpectrogramClient