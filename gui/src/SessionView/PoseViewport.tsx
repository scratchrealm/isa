import { AffineTransform } from "@figurl/spike-sorting-views";
import { FunctionComponent, useCallback, useMemo } from "react";
import { Scene2dObject, Scene2d } from "../component-scene2d";
import { useVocalizations } from "../context-vocalizations";

type Props ={
	width: number
	height: number
	videoWidth: number
	videoHeight: number
	canEditPose: boolean
    videoSamplingFrequency: number
	affineTransform: AffineTransform
	onSelectRect?: (r: {x: number, y: number, w: number, h: number}) => void
}

const PoseViewport: FunctionComponent<Props> = ({width, height, videoWidth, videoHeight, canEditPose, onSelectRect, videoSamplingFrequency, affineTransform}) => {
	const {selectedVocalization, addPosePoint, movePosePoint, box} = useVocalizations()
	const selectedPose = useMemo(() => (selectedVocalization?.pose), [selectedVocalization])

	const objects: Scene2dObject[] = useMemo(() => {
		const ret: Scene2dObject[] = []
		if (selectedPose) {
			selectedPose.points.forEach((pp, ii) => {
				const qq = {x: (pp.x + 0.5) / videoWidth * width, y: (pp.y + 0.5) / videoHeight * height}
				ret.push({
					type: 'marker',
					draggable: canEditPose ? true : false,
					objectId: `pt-${ii}`,
					x: qq.x,
					y: qq.y,
					attributes: {fillColor: colorForPointIndex(ii), radius: 5}
				})
				if (ii > 0) {
					ret.push({
						type: 'connector',
						objectId: `connector-${ii}`,
						objectId1: `pt-${ii - 1}`,
						objectId2: `pt-${ii}`,
						attributes: {color: 'yellow', dash: []}
					})
				}
			})
		}
		if (box) {
			const r = box
			const qq00 = {x: (r.x + 0.5) / videoWidth * width, y: (r.y + 0.5) / videoHeight * height}
			const qq11 = {x: (r.x + r.w + 0.5) / videoWidth * width, y: (r.y + r.h + 0.5) / videoHeight * height}
			ret.push({
				type: 'rectangle',
				objectId: 'box',
				x: qq00.x,
				y: qq00.y,
				w: qq11.x - qq00.x,
				h: qq11.y - qq00.y,
				attributes: {color: 'green', width: 2}
			})
		}
		return ret
	}, [selectedPose, width, height, videoWidth, videoHeight, canEditPose, box])

	const handleClick = useCallback((p: {x: number, y: number}, e: React.MouseEvent) => {
		if (!canEditPose) return
		const x = Math.floor(p.x / width * videoWidth)
		const y = Math.floor(p.y / height * videoHeight)
		if ((selectedPose?.points.length || 0) < 2) {
			addPosePoint(selectedVocalization?.vocalizationId || '', {
				x,
				y
			})
		}
    }, [selectedVocalization, addPosePoint, selectedPose, width, height, videoWidth, videoHeight, canEditPose])

	const handleDragObject = useCallback((objectId: string, p: {x: number, y: number}, e: React.MouseEvent) => {
		if (!canEditPose) return
		const x = Math.floor(p.x / width * videoWidth)
		const y = Math.floor(p.y / height * videoHeight)
		const pointIndex = parseInt(objectId.slice(`pt-`.length))
		movePosePoint(selectedVocalization?.vocalizationId || '', pointIndex, {x, y})
    }, [selectedVocalization, width, height, videoWidth, videoHeight, movePosePoint, canEditPose])

	const handleSelectRect = useCallback((r: {x: number, y: number, w: number, h: number}) => {
		const x = Math.floor(r.x / width * videoWidth)
		const y = Math.floor(r.y / height * videoHeight)
		const w = Math.floor(r.w / width * videoWidth)
		const h = Math.floor(r.h / height * videoHeight)
		onSelectRect && onSelectRect({x, y, w, h})
	}, [onSelectRect, width, height, videoWidth, videoHeight])

	return (
		<Scene2d
			width={width}
			height={height}
			objects={objects}
			onDragObject={handleDragObject}
			onSelectRect={handleSelectRect}
			onClick={handleClick}
			affineTransform={affineTransform}
		/>
	)
}

export const colorForPointIndex = (ii: number) => {
	if (ii === 0) return 'orange'
	else if (ii === 1) return 'lightgreen'
	else return 'blue'
}

export default PoseViewport
