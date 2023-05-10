import { randomAlphaString } from "@figurl/core-utils";
import { getFileData, serviceQuery, storeFileData, storeGithubFileData, useUrlState } from "@figurl/interface";
import { useTimeseriesSelection } from "@figurl/timeseries-views";
import { FunctionComponent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useVocalizations, VocalizationContext } from "../../context-vocalizations";
import './ControlPanel.css';
import ControlPanelBottomArea from "./ControlPanelBottomArea";
import ControlPanelTopArea from "./ControlPanelTopArea";
import HelpWindow from "./HelpWindow";
import ModalWindow from "./ModalWindow";
import useModalDialog from "./useModalDialog";

type Props ={
	width: number
	height: number
}

export type Command = 'save' | 'export-as-json' | 'prev' | 'next' | 'first' | 'last' | 'random-without-pose' | 'accept-vocalization' | 'unaccept-vocalization' | 'accept-all-vocalizations' | 'unaccept-all-vocalizations' | 'add-vocalization' | 'delete-vocalization' | 'help'

type SaveState = {
	savedObjectJson?: string
}

const ControlPanel: FunctionComponent<Props> = ({width, height}) => {
	const [errorString, setErrorString] = useState<string>('')
	const {vocalizationState, selectedVocalization, addVocalizationLabel, removeVocalizationLabel, vocalizations, selectNextVocalization, selectPreviousVocalization, selectFirstVocalization, selectLastVocalization, selectRandomVocalizationWithoutPose, addVocalizationLabelToAll, removeVocalizationLabelFromAll, removeVocalization, addVocalization} = useVocalizations()
    const {vocalizationDispatch} = useContext(VocalizationContext)
    const {urlState, updateUrlState} = useUrlState()

	const numVocalizations = vocalizations.length
	const numAnnotatedVocalizations = useMemo(() => (
		vocalizations.filter(v => (v.labels.includes('accept') && v.pose)).length
	), [vocalizations])
	const label = `${numAnnotatedVocalizations}/${numVocalizations} annotated`

	const {currentTimeInterval} = useTimeseriesSelection()
	const focusFrameInterval = useMemo(() => {
		if (!vocalizationState) return undefined
		if (!currentTimeInterval) return undefined
		return [
			Math.floor(currentTimeInterval[0] * vocalizationState.samplingFrequency),
			Math.ceil(currentTimeInterval[1] * vocalizationState.samplingFrequency)
		] as [number, number]
	}, [vocalizationState, currentTimeInterval])

	const object = vocalizationState

	const [saving, setSaving] = useState<boolean>(false)

	const [saveState, setSaveState] = useState<SaveState>({})
	const dirty = useMemo(() => {
		if (JSONStringifyDeterministic(object || {}) === saveState.savedObjectJson) {
			return false
		}
		return true
	}, [object, saveState])

	const handleExportAsJson = useCallback(() => {
		if (!object) return
		const x = JSONStringifyDeterministic(object)
		downloadTextFile('vocalizations.json', x)
	}, [object])

	const handleSave = useCallback(() => {
		if (!object) return
		const x = JSONStringifyDeterministic(object)
		setSaving(true)
		setErrorString('')
		;(async () => {
			try {
				await serviceQuery('isa', {
					type: 'set_annotations',
					session_path: '$dir',
					annotations: object
				})
				setSaveState({
					savedObjectJson: x
				})
			}
			catch(err: any) {
				setErrorString(`Problem saving file data to Github: ${err.message}`)
				setSaving(false)
			}
			finally {
				setSaving(false)
			}
		})()
	}, [object])

	const {visible: helpVisible, handleOpen: handleOpenHelp, handleClose: handleCloseHelp} = useModalDialog()

	const handleCommand = useCallback((c: Command) => {
		if (c === 'export-as-json') {
			handleExportAsJson()
		}
		else if (c === 'save') {
			handleSave()
		}
		else if (c === 'accept-vocalization') {
			if (!selectedVocalization) return
			addVocalizationLabel(selectedVocalization.vocalizationId, 'accept')
		}
		else if (c === 'unaccept-vocalization') {
			if (!selectedVocalization) return
			removeVocalizationLabel(selectedVocalization.vocalizationId, 'accept')
		}
		else if (c === 'accept-all-vocalizations') {
			const okay = window.confirm('Are you sure you want to accept all vocalizations?')
			if (okay) {
				addVocalizationLabelToAll('accept')
			}
		}
		else if (c === 'unaccept-all-vocalizations') {
			const okay = window.confirm('Are you sure you want to unaccept all vocalizations?')
			if (okay) {
				removeVocalizationLabelFromAll('accept')
			}
		}
		else if (c === 'next') {
			selectNextVocalization()
		}
		else if (c === 'prev') {
			selectPreviousVocalization()
		}
		else if (c === 'first') {
			selectFirstVocalization()
		}
		else if (c === 'last') {
			selectLastVocalization()
		}
		else if (c === 'random-without-pose') {
			selectRandomVocalizationWithoutPose()
		}
		else if (c === 'add-vocalization') {
			if (!focusFrameInterval) return
			const id = randomAlphaString(10)
			addVocalization({
				vocalizationId: id,
				labels: ['accept'],
				startFrame: focusFrameInterval[0],
				endFrame: focusFrameInterval[1]
			})
		}
		else if (c === 'delete-vocalization') {
			if (selectedVocalization === undefined) return
			removeVocalization(selectedVocalization.vocalizationId)
		}
		else if (c === 'help') {
			handleOpenHelp()
		}
	}, [handleExportAsJson, addVocalizationLabel, removeVocalizationLabel, selectedVocalization, handleSave, selectNextVocalization, selectPreviousVocalization, selectFirstVocalization, selectLastVocalization, selectRandomVocalizationWithoutPose, addVocalizationLabelToAll, removeVocalizationLabelFromAll, removeVocalization, focusFrameInterval, addVocalization, handleOpenHelp])

	const margin = 10
	const spacing = 20
	const bottomHeight = Math.min(220, (height - 2 * margin - spacing) * 2 / 3)
	const topHeight = (height - 2 * margin - spacing) - bottomHeight
	return (
		<div
			className="ControlPanel"
			style={{position: 'absolute', width, height}}
		>
			<div style={{position: 'absolute', left: margin, top: margin, width: width - 2 * margin, height: topHeight}}>
				<ControlPanelTopArea width={width - 2 * margin} height={topHeight} />
			</div>
			<div style={{position: 'absolute', left: margin, top: margin + topHeight + spacing, width: width - 2 * margin, height: bottomHeight}}>
				<ControlPanelBottomArea width={width - 2 * margin} height={bottomHeight} onCommand={handleCommand} errorString={errorString} saving={saving} dirty={dirty} selectedVocalization={selectedVocalization} focusFrameInterval={focusFrameInterval} label={label} />
			</div>
			<ModalWindow
				open={helpVisible}
                onClose={handleCloseHelp}
			>
				<HelpWindow />
			</ModalWindow>
		</div>
	)
}

// Thanks: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
export const JSONStringifyDeterministic = ( obj: Object, space: string | number | undefined =undefined ) => {
    var allKeys: string[] = [];
    JSON.stringify( obj, function( key, value ){ allKeys.push( key ); return value; } )
    allKeys.sort();
    return JSON.stringify( obj, allKeys, space );
}

// Thanks: https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
function downloadTextFile(filename: string, text: string) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);
  
	element.style.display = 'none';
	document.body.appendChild(element);
  
	element.click();
  
	document.body.removeChild(element);
}

export default ControlPanel
