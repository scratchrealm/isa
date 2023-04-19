import { Splitter } from '@figurl/core-views';
import { useTimeseriesSelection } from '@figurl/timeseries-views';
import { FunctionComponent, useMemo } from 'react';
import { useVocalizations } from '../context-vocalizations';
import CameraView from './CameraView';
import ControlPanel from './ControlPanel/ControlPanel';

type Props = {
    width: number
    height: number
    video?: {
		uri: string,
		width: number
		height: number
		samplingFrequency: number
	}
    samplingFrequencies: {audio: number, video: number}
}

const ControlWidget: FunctionComponent<Props> = ({width, height, video, samplingFrequencies}) => {
    const {currentTime} = useTimeseriesSelection()
    const {selectedVocalization, vocalizationState} = useVocalizations()
    const canEditPose = useMemo(() => {
        if (!selectedVocalization) return false
        if (!vocalizationState) return false
        if (!video) return false
        if (currentTime === undefined) return false
        const vocalizationStartTime = selectedVocalization.startFrame / vocalizationState.samplingFrequency
        const focusVideoFrame = Math.floor(currentTime * video.samplingFrequency)
        const vocalizationStartVideoFrame = Math.floor(vocalizationStartTime * video.samplingFrequency)
        if (focusVideoFrame === vocalizationStartVideoFrame) {
            return true
        }
        return false
    }, [currentTime, selectedVocalization, video, vocalizationState])

    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={500}
            adjustable={false}
        >
            <ControlPanel
                width={0}
                height={0}
            />
            {
                video ? (
                    <CameraView
                        width={0}
                        height={0}
                        video={video}
                        canEditPose={canEditPose}
                    />
                ) : <div />
            }
        </Splitter>
    )
}


// Thanks: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
export const JSONStringifyDeterministic = ( obj: Object, space: string | number | undefined =undefined ) => {
    var allKeys: string[] = [];
    JSON.stringify( obj, function( key, value ){ allKeys.push( key ); return value; } )
    allKeys.sort();
    return JSON.stringify( obj, allKeys, space );
}

export default ControlWidget