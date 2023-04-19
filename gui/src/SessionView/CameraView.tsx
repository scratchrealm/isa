import { Button } from "@material-ui/core";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import { useVocalizations } from "../context-vocalizations";
import CameraViewArea from "./CameraViewArea";
import { colorForPointIndex } from "./PoseViewport";

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
}

const CameraView: FunctionComponent<Props> = ({width, height, video, canEditPose}) => {
	const topPanelHeight = 100
	const legendWidth = 50
	const viewAreaWidth = width - legendWidth
	const viewAreaHeight = height - topPanelHeight - 10
	const {selectedVocalization, removePose, setBox, vocalizations, setPose, addVocalizationLabel} = useVocalizations()
	const [annotatingBox, setAnnotatingBox] = useState(false)
	const handleClearPose = useCallback(() => {
		selectedVocalization && removePose(selectedVocalization?.vocalizationId)
	}, [selectedVocalization, removePose])

	const clearPoseEnabled = canEditPose && ((selectedVocalization?.pose?.points.length || 0) > 0)
	const annotateBoxEnabled = !annotatingBox

	const handleSelectRect = useCallback((box: {x: number, y: number, w: number, h: number}) => {
		if (annotatingBox) {
			setBox(box)
			setAnnotatingBox(false)
		}
	}, [setBox, annotatingBox])

	const previousVocalization = useMemo(() => {
		if (!selectedVocalization) return undefined
		const index = vocalizations.map(v => (v.vocalizationId)).indexOf(selectedVocalization.vocalizationId)
		if (index <= 0) return undefined
		return vocalizations[index - 1]
	}, [vocalizations, selectedVocalization])

	const handleUsePreviousPose = useCallback(() => {
		if (!previousVocalization) return
		if (!selectedVocalization) return
		setPose(selectedVocalization.vocalizationId, previousVocalization.pose)
		addVocalizationLabel(selectedVocalization.vocalizationId, 'accept')
	}, [previousVocalization, selectedVocalization, setPose, addVocalizationLabel])

	return (
		<div style={{position: 'absolute', width, height}}>
			{
				canEditPose && selectedVocalization ? (
					<h3>Pose for vocalization {selectedVocalization.vocalizationId}</h3>
				) : (
					<h3>No associated vocalization</h3>
				)
			}
			<div>
				<Button disabled={!clearPoseEnabled} onClick={handleClearPose}>Clear pose</Button>
				<Button disabled={!annotateBoxEnabled} onClick={() => setAnnotatingBox(true)}>Annotate box</Button>
				{annotatingBox && <span>Select a box</span>}
				<Button disabled={!(previousVocalization && previousVocalization.pose)} onClick={handleUsePreviousPose}>Use previous pose</Button>
			</div>
			<div style={{position: 'absolute', top: topPanelHeight, width: viewAreaWidth, height: viewAreaHeight}}>
				<CameraViewArea
					width={viewAreaWidth}
					height={viewAreaHeight}
					video={video}
					canEditPose={canEditPose}
					onSelectRect={handleSelectRect}
				/>
			</div>
			<div style={{position: 'absolute', top: topPanelHeight, left: viewAreaWidth, width: legendWidth, height: viewAreaHeight}}>
				<div><span style={{color: colorForPointIndex(0), fontSize: 25}}>&#x25cf;</span></div>
				<div>head</div>
				<div>&nbsp;</div>
				<div><span style={{color: colorForPointIndex(1), fontSize: 25}}>&#x25cf;</span></div>
				<div>tail</div>
			</div>
		</div>
	)
}

export default CameraView
