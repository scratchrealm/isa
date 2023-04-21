import { serviceQuery } from "@figurl/interface"

const chunkSize = 10000

class SpectrogramClient {
    #isInitialized: boolean = false
    #onDataRecievedCallbacks: (() => void)[] = []
    #chunks: {[chunkIndex: number]: Uint8Array} = {}
    #fetchingChunks = new Set<number>()
    constructor(private uri: string, public samplingFrequency: number, public durationSec: number, public numFrequencies: number) {

    }
    async initialize() {
        this.#isInitialized = true
    }
    onDataRecieved(cb: () => void) {
        this.#onDataRecievedCallbacks.push(cb)
    }
    public get numTimepoints() {
        return Math.ceil(this.durationSec * this.samplingFrequency)
    }
    getValue(t: number, f: number) {
        const chunkIndex = Math.floor(t / chunkSize)
        const chunk = this.#chunks[chunkIndex]
        if (!chunk) {
            this._fetchChunk(chunkIndex) // initiate fetching of the chunk
            return NaN
        }
        const i = Math.floor(t) % chunkSize
        return chunk[i * this.numFrequencies + f]
    }
    async _fetchChunk(i: number) {
        if (this.#fetchingChunks.has(i)) return
        this.#fetchingChunks.add(i)
        const {result, binaryPayload} = await serviceQuery(
            'zarr',
            {
                type: 'get_array_chunk',
                path: this.uri,
                name: '/spectrogram',
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
        this.#fetchingChunks.delete(i)
        if (result.dtype !== 'uint8') {
            throw Error(`Unexpected data type for spectrogram zarr array: ${result.dataType}`)
        }
        this.#chunks[i] = new Uint8Array(binaryPayload)
        this.#onDataRecievedCallbacks.forEach(cb => {cb()})
    }
}

export default SpectrogramClient