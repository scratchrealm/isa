import { serviceQuery } from "@figurl/interface"

const chunkSize = 10000

class SpectrogramClient {
    #onDataRecievedCallbacks: (() => void)[] = []
    #chunks: {[dsFactor: number]: {[chunkIndex: number]: Uint8Array}} = {}
    #fetchingChunks = new Set<string>()
    constructor(private uri: string, public samplingFrequency: number, public durationSec: number, public numFrequencies: number) {

    }
    onDataRecieved(cb: () => void) {
        this.#onDataRecievedCallbacks.push(cb)
    }
    public get numTimepoints() {
        return Math.ceil(this.durationSec * this.samplingFrequency)
    }
    getValue(dsFactor: number, t: number, f: number) {
        const chunkIndex = Math.floor(t / chunkSize)
        const chunk = (this.#chunks[dsFactor] || {})[chunkIndex]
        if (!chunk) {
            this._fetchChunk(dsFactor, chunkIndex) // initiate fetching of the chunk
            return NaN
        }
        const i = Math.floor(t) % chunkSize
        return chunk[i * this.numFrequencies + f]
    }
    async _fetchChunk(dsFactor: number, i: number) {
        const code = `${dsFactor}-${i}`
        if (this.#fetchingChunks.has(code)) return
        this.#fetchingChunks.add(code)
        const {result, binaryPayload} = await serviceQuery(
            'zarr',
            {
                type: 'get_array_chunk',
                path: this.uri,
                name: dsFactor === 1 ? '/spectrogram' : `/spectrogram_ds${dsFactor}`,
                slices: [
                    {
                        start: i * chunkSize,
                        stop: (i + 1) * chunkSize,
                        step: 1
                    },
                    {
                        start: 0,
                        stop: this.numFrequencies,
                        step: 1
                    }
                ]
            }
        )
        this.#fetchingChunks.delete(code)
        if (result.dtype !== 'uint8') {
            throw Error(`Unexpected data type for spectrogram zarr array: ${result.dataType}`)
        }
        if (!this.#chunks[dsFactor]) this.#chunks[dsFactor] = {}
        this.#chunks[dsFactor][i] = new Uint8Array(binaryPayload)
        this.#onDataRecievedCallbacks.forEach(cb => {cb()})
    }
}

export default SpectrogramClient