import { randomAlphaString } from "@figurl/core-utils";
import { Splitter } from "@figurl/core-views";
import { getFileData, readDir, useUrlState } from "@figurl/interface";
import { AnnotationContext, SetupTimeseriesSelection, useTimeseriesSelection } from "@figurl/timeseries-views";
import { FunctionComponent, KeyboardEventHandler, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useVocalizations } from "../context-vocalizations";
import ControlWidget from "./ControlWidget";
import SpectrogramWidget from "./SpectrogramWidget";
import { timeIntervalForVocalization } from "./VocalizationsTable";
import YAML from 'js-yaml'

type Props = {
	width: number
	height: number
}

const SessionView: FunctionComponent<Props> = ({width, height}) => {
    const [video, setVideo] = useState<{uri: string, width: number, height: number, samplingFrequency: number, numFrames: number}>()
	const [spectrogram, setSpectrogram] = useState<{uri: string, samplingFrequency: number, durationSec: number, numFrequencies: number}>()
    useEffect(() => {
        (async () => {
            const a = await getFileData('$dir/isa-session.yaml', () => {}, {responseType: 'text'})
            const isaSession: any = YAML.load(a)
            setVideo({
                uri: `$dir/${isaSession.video_fname}`,
                width: isaSession.video_width,
            	height: isaSession.video_height,
                samplingFrequency: isaSession.video_fps,
				numFrames: isaSession.video_num_frames
            })
			setSpectrogram({
				uri: `$dir/spectrogram_for_gui.zarr`,
				samplingFrequency: isaSession.spectrogram_sr_hz,
				durationSec: isaSession.audio_duration_sec,
				numFrequencies: isaSession.spectrogram_num_frequencies
			})
        })()
    }, [])

    if (!video) return <div>Loading video info</div>
	if (!spectrogram) return <div>Loading spectrogram info</div>
    return (
		<SetupTimeseriesSelection>
			<SessionViewChild
				width={width}
				height={height}
				video={video}
				spectrogram={spectrogram}
			/>
		</SetupTimeseriesSelection>
    )
}

type ChildProps = {
    width: number
    height: number
    spectrogram?: {
        uri: string,
        samplingFrequency: number
		durationSec: number
		numFrequencies: number
    }
    video?: {
        uri: string,
        width: number
        height: number
		numFrames: number
        samplingFrequency: number
    }
}

const SessionViewChild: FunctionComponent<ChildProps> = ({width, height, video, spectrogram}) => {
	const {vocalizations, vocalizationState, setSelectedVocalizationId, selectNextVocalization, selectPreviousVocalization, selectRandomVocalizationWithoutPose, addVocalizationLabel, removeVocalizationLabel, selectedVocalization, addVocalization} = useVocalizations()
	const {annotationDispatch} = useContext(AnnotationContext)
	const {urlState, updateUrlState} = useUrlState()
	const samplingFrequencies = useMemo(() => ({
		audio: spectrogram?.samplingFrequency || 1,
		video: video?.samplingFrequency || 1
	}), [spectrogram, video])

	const {setCurrentTime} = useTimeseriesSelection()
	useEffect(() => {
		setCurrentTime(0)
	}, [])

	useEffect(() => {
		if (!annotationDispatch) return
		annotationDispatch({
			type: 'setAnnotationState',
			annotationState: {
				annotations: vocalizations.map(v => {
					const timeIntervalSec = timeIntervalForVocalization(vocalizationState, v)
					if (timeIntervalSec === undefined) throw Error('unexpected')
					return {
						type: 'time-interval',
						annotationId: v.vocalizationId,
						label: '',
						timeIntervalSec,
						fillColor: v.labels.includes('accept') ? ((v.pose && v.pose.points.length >= 2) ? 'rgb(180, 255, 180)' : 'rgb(255, 255, 180)') : 'rgb(245, 240, 200)',
						strokeColor: v.labels.includes('accept') ? ((v.pose && v.pose.points.length >= 2) ? 'rgb(180, 255, 100)' : 'rgb(255, 255, 100)') : 'rgb(235, 230, 200)'
					}
				})
			}
		})
	}, [vocalizations, annotationDispatch, vocalizationState])
	
	const {currentTime, currentTimeInterval} = useTimeseriesSelection()
	const focusFrameInterval = useMemo(() => {
		if (!vocalizationState) return undefined
		if (!currentTimeInterval) return undefined
		return [
			Math.floor(currentTimeInterval[0] * vocalizationState.samplingFrequency),
			Math.ceil(currentTimeInterval[1] * vocalizationState.samplingFrequency)
		]
	}, [vocalizationState, currentTimeInterval])

	useEffect(() => {
		// when focus time changes, set vocalization ID
		if (currentTime === undefined) {
			setSelectedVocalizationId(undefined)
			return
		}
		if (vocalizationState === undefined) return
		const focusFrame = Math.floor(currentTime * vocalizationState.samplingFrequency)
		for (let v of vocalizations) {
			if ((v.startFrame <= focusFrame) && (focusFrame < v.endFrame)) {
				setSelectedVocalizationId(v.vocalizationId)
				return
			}
		}
		setSelectedVocalizationId(undefined)
	}, [currentTime, vocalizations, vocalizationState, setSelectedVocalizationId])

    const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback((e) => {
		if ((e.key === '>') && (e.shiftKey) && (!e.ctrlKey)) {
			selectNextVocalization()
		}
		if ((e.key === '<') && (e.shiftKey) && (!e.ctrlKey)) {
			selectPreviousVocalization()
		}
		if ((e.key === 'r') && (!e.shiftKey) && (!e.ctrlKey)) {
			selectRandomVocalizationWithoutPose()
		}
		if ((e.key === 'a') && (!e.shiftKey) && (!e.ctrlKey)) {
			if (selectedVocalization) {
				addVocalizationLabel(selectedVocalization.vocalizationId, 'accept')
			}
			else if (focusFrameInterval) {
				const id = randomAlphaString(10)
				addVocalization({
					vocalizationId: id,
					labels: ['accept'],
					startFrame: focusFrameInterval[0],
					endFrame: focusFrameInterval[1]
				})
			}
		}
		if ((e.key === 'u') && (!e.shiftKey) && (!e.ctrlKey)) {
			if (!selectedVocalization) return
			removeVocalizationLabel(selectedVocalization.vocalizationId, 'accept')
		}
		else if (e.key === 'd') {
			updateUrlState({dev: (urlState.dev !== true)})
		}
	}, [selectNextVocalization, selectPreviousVocalization, selectRandomVocalizationWithoutPose, addVocalizationLabel, selectedVocalization, removeVocalizationLabel, urlState, updateUrlState, addVocalization, focusFrameInterval])

	return (
		<div
			onKeyDown={handleKeyDown}
			tabIndex={0}
		>
			<Splitter
				width={width}
				height={height}
				direction="vertical"
				initialPosition={400}
				adjustable={true}
			>
				<SpectrogramWidget
					width={0}
					height={0}
					spectrogram={spectrogram}
				/>
                <ControlWidget
                    width={0}
                    height={0}
                    video={video}
                    samplingFrequencies={samplingFrequencies}
                />
			</Splitter>
		</div>
	)
}

export default SessionView
