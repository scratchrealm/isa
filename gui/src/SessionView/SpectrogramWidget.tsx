import { DefaultToolbarWidth, TimeScrollView, TimeScrollViewPanel, usePanelDimensions, useTimeseriesSelectionInitialization, useTimeRange, useTimeseriesMargins } from "@figurl/timeseries-views";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import SpectrogramClient from "./SpectrogramClient";
import colormap from 'colormap';

type Props ={
	width: number
	height: number
	spectrogram?: {
		uri: string
		samplingFrequency: number
		durationSec: number
		numFrequencies: number
	}
}

const timeseriesLayoutOpts: any = {}
const panelSpacing = 4
type PanelProps = {}

const SpectrogramWidget: FunctionComponent<Props> = ({width, height, spectrogram}) => {
	const [spectrogramClient, setSpectrogramClient] = useState<SpectrogramClient>()
	const [refreshCode, setRefreshCode] = useState(0)
	useEffect(() => {
		if (!spectrogram) return
		const spectrogramClient = new SpectrogramClient(spectrogram.uri, spectrogram.samplingFrequency, spectrogram.durationSec, spectrogram.numFrequencies)
		setSpectrogramClient(spectrogramClient)
	}, [spectrogram])
	if (!spectrogramClient) return <div>Loading spectrogram client</div>
	return (
		<SpectrogramWidgetChild
			width={width}
			height={height}
			spectrogramClient={spectrogramClient}
		/>
	)
}

type ChildProps = {
	width: number
	height: number
	spectrogramClient: SpectrogramClient
}

const SpectrogramWidgetChild: FunctionComponent<ChildProps> = ({width, height, spectrogramClient}) => {
	const nTimepoints = spectrogramClient.numTimepoints
	const samplingFrequency = spectrogramClient.samplingFrequency
	useTimeseriesSelectionInitialization(0, nTimepoints / samplingFrequency)
    const {visibleStartTimeSec, visibleEndTimeSec, setVisibleTimeRange} = useTimeRange()
	const [refreshCode, setRefreshCode] = useState(0)

	useEffect(() => {
		setVisibleTimeRange(0, Math.min(nTimepoints / samplingFrequency, 20))
	}, [nTimepoints, samplingFrequency, setVisibleTimeRange])

	useEffect(() => {
		spectrogramClient.onDataRecieved(() => {
			setRefreshCode(c => c + 1)
		})
	}, [spectrogramClient])

	const margins = useTimeseriesMargins(timeseriesLayoutOpts)
	const panelCount = 1
    const toolbarWidth = timeseriesLayoutOpts?.hideTimeAxis ? 0 : DefaultToolbarWidth
    const { panelWidth, panelHeight } = usePanelDimensions(width - toolbarWidth, height, panelCount, panelSpacing, margins)

	const imageDataInfo = useMemo(() => {
		if (visibleStartTimeSec === undefined) return undefined
		if (visibleEndTimeSec === undefined) return undefined
		let i1 = Math.floor(visibleStartTimeSec * samplingFrequency) - 1
		let i2 = Math.floor(visibleEndTimeSec * samplingFrequency) + 1
		const downsampleFactor = determinePower3DownsampleFactor(i2 - i1, panelWidth)

		const i1_ds = Math.floor(i1 / downsampleFactor)
		const i2_ds = Math.ceil(i2 / downsampleFactor)

		let nT_ds = i2_ds - i1_ds
		if (!nT_ds) return undefined
		
		let imageData: ImageData | undefined = undefined
		const data: number[] = []
		const nF = spectrogramClient.numFrequencies
		for (let ff = 0; ff < nF; ff++) {
			for (let it = 0; it < nT_ds; it++) {
				const val = spectrogramClient.getValue(downsampleFactor, i1_ds + it, nF - 1 - ff)
				const c = colorForSpectrogramValue(val)
				data.push(...c)
			}
		}
		const clampedData = Uint8ClampedArray.from(data)
		imageData = new ImageData(clampedData, nT_ds, nF)
		
		return {imageData, i1, i2}
    }, [spectrogramClient, samplingFrequency, visibleStartTimeSec, visibleEndTimeSec, nTimepoints, panelWidth, refreshCode])

	const paintPanel = useCallback((context: CanvasRenderingContext2D, props: PanelProps) => {
		if (!imageDataInfo) return
		if (visibleStartTimeSec === undefined) return
		if (visibleEndTimeSec === undefined) return
		const {imageData, i1, i2} = imageDataInfo
		if (!imageData) return
		context.clearRect(0, 0, panelWidth, panelHeight)
		const offscreenCanvas = document.createElement('canvas')
		offscreenCanvas.width = imageData.width
		offscreenCanvas.height = imageData.height
		const c = offscreenCanvas.getContext('2d')
		if (!c) return
		c.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height)
		c.putImageData(imageData, 0, 0)

		const p1 = (i1 / samplingFrequency - visibleStartTimeSec) / (visibleEndTimeSec - visibleStartTimeSec)
		const p2 = (i2 / samplingFrequency - visibleStartTimeSec) / (visibleEndTimeSec - visibleStartTimeSec)

		const rect = {
			x: p1 * panelWidth,
			y: 50,
			w: (p2 - p1) * panelWidth,
			h: panelHeight - 100
		}

		context.drawImage(offscreenCanvas, rect.x, rect.y, rect.w, rect.h)
	}, [imageDataInfo, visibleStartTimeSec, visibleEndTimeSec, samplingFrequency, panelWidth, panelHeight])
	const panels: TimeScrollViewPanel<PanelProps>[] = useMemo(() => {
        return [{
            key: `spectrogram`,
            label: ``,
            props: {} as PanelProps,
            paint: paintPanel
        }]
    }, [paintPanel])
	return (
		<TimeScrollView
			margins={margins}
			panels={panels}
			panelSpacing={panelSpacing}
			timeseriesLayoutOpts={timeseriesLayoutOpts}
			width={width}
			height={height}
		/>
	)
}

const determinePower3DownsampleFactor = (n: number, target: number) => {
	let factor = 1
	while (n / (factor * 3) > target) {
		factor *= 3
	}
	return factor
}

const colors = colormap({
    colormap: 'bone',
    nshades: 100,
    format: 'float',
    alpha: 1
})

const scale = 50

function colorForSpectrogramValue(v: number) {
	if (isNaN(v)) return [0, 0, 0, 0]
	const v2 = Math.min(99, Math.max(0, Math.floor(v / 255 * 100 * scale)))
	if (!v2) return [0, 0, 0, 0]
	const ret = colors[99 - v2]
	return ret.map(v => (Math.floor(v * 255)))
}

export default SpectrogramWidget
