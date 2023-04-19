import { useTimeseriesSelection } from "@figurl/timeseries-views";
import { FunctionComponent, useEffect, useMemo, useState } from "react";
import PoseViewport from "./PoseViewport";
import useWheelZoom from "./useWheelZoom";
import VideoViewCanvas from "../VideoView/VideoViewCanvas";
import VideoClient from "../VideoView/VideoClient";

type Props ={
	width: number
	height: number
	video: {
		uri: string,
		width: number
		height: number
		samplingFrequency: number
	}
	canEditPose: boolean
	onSelectRect?: (r: {x: number, y: number, w: number, h: number}) => void
}

const CameraViewArea: FunctionComponent<Props> = ({width, height, video, canEditPose, onSelectRect}) => {
	const {currentTime} = useTimeseriesSelection()
	const W = video.width * height < video.height * width ? video.width * height / video.height : width
	const H = video.width * height < video.height * width ? height : video.height * width / video.width
	const rect = useMemo(() => ({
		x: (width - W)  / 2,
		y: (height - H) / 2,
		w: W,
		h: H
	}), [W, H, width, height])
	const {affineTransform, handleWheel} = useWheelZoom(rect.x, rect.y, rect.w, rect.h)
	const [videoClient, setVideoClient] = useState<VideoClient>()
	useEffect(() => {
		const vc = new VideoClient(video.uri)
		setVideoClient(vc)
	}, [video.uri])
	return (
		<div style={{position: 'absolute', width, height}} onWheel={handleWheel}>
			<div className="video-frame" style={{position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h}}>
				<VideoViewCanvas
					width={rect.w}
					height={rect.h}
					currentTime={currentTime}
					videoClient={videoClient}
					affineTransform={affineTransform}
				/>
			</div>
			<div className="pose-viewport" style={{position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h}}>
				<PoseViewport
					width={rect.w}
					height={rect.h}
					videoWidth={video.width}
					videoHeight={video.height}
					canEditPose={canEditPose}
					videoSamplingFrequency={video.samplingFrequency}
					affineTransform={affineTransform}
					onSelectRect={onSelectRect}
				/>
			</div>
		</div>
	)
}

export default CameraViewArea
