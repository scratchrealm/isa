import { DefaultToolbarWidth, TimeScrollView, TimeScrollViewPanel, usePanelDimensions, useTimeseriesSelectionInitialization, useTimeRange, useTimeseriesMargins } from "@figurl/timeseries-views";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import SpectrogramClient from "./SpectrogramClient";

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
	useEffect(() => {
		if (!spectrogram) return
		const spectrogramClient = new SpectrogramClient(spectrogram.uri, spectrogram.samplingFrequency, spectrogram.durationSec, spectrogram.numFrequencies)
		spectrogramClient.initialize().then(() => {
			setSpectrogramClient(spectrogramClient)
		}).catch((err) => {
			console.error(err)
			console.error('Problem initializing spectrogram client')
		})
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

	useEffect(() => {
		setVisibleTimeRange(0, Math.min(nTimepoints / samplingFrequency, 20))
	}, [nTimepoints, samplingFrequency, setVisibleTimeRange])

	const margins = useTimeseriesMargins(timeseriesLayoutOpts)
	const panelCount = 1
    const toolbarWidth = timeseriesLayoutOpts?.hideTimeAxis ? 0 : DefaultToolbarWidth
    const { panelWidth, panelHeight } = usePanelDimensions(width - toolbarWidth, height, panelCount, panelSpacing, margins)

	const imageDataInfo = useMemo(() => {
		if (visibleStartTimeSec === undefined) return undefined
		if (visibleEndTimeSec === undefined) return undefined
		let i1 = Math.floor(visibleStartTimeSec * samplingFrequency) - 1
		let i2 = Math.floor(visibleEndTimeSec * samplingFrequency) + 1
		const downsampleFactor = Math.max(1, Math.floor((i2 - i1) / (panelWidth)))
		i1 = Math.floor(i1 / downsampleFactor) * downsampleFactor
		i2 = Math.ceil(i2 / downsampleFactor) * downsampleFactor
		let nT = i2 - i1
		if (!nT) return undefined
		let nTDownsampled = nT / downsampleFactor
		if (!nTDownsampled) return undefined
		
		let imageData: ImageData | undefined = undefined
		const data: number[] = []
		const nF = spectrogramClient.numFrequencies
		for (let ii = 0; ii < nF; ii++) {
			for (let it = 0; it < nTDownsampled; it++) {
				let max0 = 0
				for (let aa = 0; aa < downsampleFactor; aa++) {
					const jj = i1 + it * downsampleFactor + aa
					if ((0 <= jj) && (jj < nTimepoints)) {
						max0 = Math.max(max0, spectrogramClient.getValue(jj, nF - 1 - ii))
					}
				}
				const c = colorForSpectrogramValue(max0)
				data.push(...c)
			}
		}
		const clampedData = Uint8ClampedArray.from(data)
		imageData = new ImageData(clampedData, nTDownsampled, nF)
		
		return {imageData, i1, i2}
    }, [spectrogramClient, samplingFrequency, visibleStartTimeSec, visibleEndTimeSec, nTimepoints, panelWidth])

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

const colorForSpectrogramValue = (v: number) => {
	return v > 0 ? [0, 0, 0, v * 10] : [0, 0, 0, 0]
}

export default SpectrogramWidget
