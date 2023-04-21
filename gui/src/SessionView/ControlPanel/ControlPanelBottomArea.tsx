import { Help } from "@material-ui/icons";
import { FunctionComponent } from "react";
import { Vocalization } from "../../context-vocalizations";
import { Command } from "./ControlPanel";

type Props ={
	width: number
	height: number
	onCommand: (c: Command) => void
	errorString: string
	saving: boolean
	dirty: boolean
	hasGithubUri: boolean
	selectedVocalization: Vocalization | undefined
	focusFrameInterval?: [number, number]
	label: string
}

const topRowHeight = 40
const rowHeight = 60
const rowHeight2 = 90

const labelHeight = 16
const spacing = 10
const labelFontSize = 12

const ControlPanelBottomArea: FunctionComponent<Props> = ({width, height, onCommand, errorString, saving, dirty, hasGithubUri, selectedVocalization, focusFrameInterval, label}) => {
	return (
		<div style={{position: 'absolute', width, height}}>
			<div style={{position: 'absolute'}}>
				<TopRow width={width} height={topRowHeight} label={label} onCommand={onCommand} />
			</div>
			<div style={{position: 'absolute', top: topRowHeight}}>
				<SelectedVocalizationRow width={width} height={rowHeight2} onCommand={onCommand} selectedVocalization={selectedVocalization} focusFrameInterval={focusFrameInterval} />
			</div>
			<div style={{position: 'absolute', top: topRowHeight + rowHeight2}}>
				<SaveAnnotationsRow width={width} height={rowHeight} onCommand={onCommand} dirty={dirty} saving={saving} hasGithubUri={hasGithubUri} />
			</div>
			<div style={{position: 'absolute', top: topRowHeight + rowHeight2 + rowHeight, fontSize: labelFontSize}}>
				<Help className="HelpButton" onClick={() => {onCommand('help')}} />
				<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
				{
					saving ? (
						<span>Saving...</span>
					) : errorString ? (
						<span style={{color: 'red'}}>{errorString}</span>
					) : (
						<span>Ready</span>
					)
				}
			</div>
		</div>
	)
}

const TopRow: FunctionComponent<{width: number, height: number, label: string, onCommand: (c: Command) => void}> = ({width, height, label, onCommand}) => {
	const elementWidths = [30, 70, 100, 70, 30, 40]
	const titles = ['select first vocalization', 'select previous vocalization (<)', '', 'select next vocalization (>)', 'select last vocalization', 'select random vocalization without pose (r)']
	const sumWidths = elementWidths.reduce((prev, cur) => (prev + cur), 0)
	const spacing = (width - sumWidths) / (elementWidths.length + 1)
	const elementPositions: number[] = []
	let x0 = spacing
	for (let i = 0; i < elementWidths.length; i++) {
		elementPositions.push(x0)
		x0 += elementWidths[i] + spacing
	}
	const bottomMargin = 15
	const topMargin = 0
	const buttonStyle: React.CSSProperties = {
		height: height - bottomMargin - topMargin,
		top: topMargin
	}
	const elementStyle: React.CSSProperties = {
		position: 'absolute',
		top: topMargin
	}
	return (
		<div style={{position: 'absolute', width, height}}>
			<div title={titles[0]} style={{left: elementPositions[0], ...elementStyle}}>
				<button onClick={() => onCommand('first')} style={{width: elementWidths[0], ...buttonStyle}}>{`<<`}</button>
			</div>
			<div title={titles[1]} style={{left: elementPositions[1], ...elementStyle}}>
				<button onClick={() => onCommand('prev')} style={{width: elementWidths[1], ...buttonStyle}}>{`< prev`}</button>
			</div>
			<div title={titles[2]} style={{left: elementPositions[2], width: elementWidths[2], ...elementStyle, top: topMargin + 4, textAlign: 'center'}}>
				<div style={{marginTop: 3, fontSize: 12}}>
					{label}
				</div>
			</div>
			<div title={titles[3]} onClick={() => onCommand('next')} style={{left: elementPositions[3], ...elementStyle}}>
				<button style={{width: elementWidths[3], ...buttonStyle}}>{`next >`}</button>
			</div>
			<div title={titles[4]} onClick={() => onCommand('last')} style={{left: elementPositions[4], ...elementStyle}}>
				<button style={{width: elementWidths[4], ...buttonStyle}}>{`>>`}</button>
			</div>
			<div title={titles[5]} onClick={() => onCommand('random-without-pose')} style={{left: elementPositions[5], ...elementStyle}}>
				<button style={{width: elementWidths[5], ...buttonStyle}}>{`- r -`}</button>
			</div>
		</div>
	)
}

const SaveAnnotationsRow: FunctionComponent<{width: number, height: number, onCommand: (c: Command) => void, dirty: boolean, saving: boolean, hasGithubUri: boolean}> = ({width, height, onCommand, dirty, saving, hasGithubUri}) => {
	const W = (width - spacing * 3) / 2
	const buttonStyle: React.CSSProperties = {
		height: 25,
		width: W
	}
	return (
		<div>
			<div style={{position: 'absolute', height: labelHeight, width, fontWeight: 'bold', fontSize: labelFontSize}}>
				Save annotations
			</div>
			<div style={{position: 'absolute', top: labelHeight, width}}>
				<div style={{position: 'absolute', left: spacing}}>
					<button disabled={((!dirty) || saving)} onClick={() => onCommand('save')} style={buttonStyle}>Save</button>
				</div>
				<div style={{position: 'absolute', left: spacing + W + spacing}}>
				<button onClick={() => onCommand('export-as-json')} style={buttonStyle}>Export as JSON</button>
				</div>
			</div>
		</div>
	)
}

const SelectedVocalizationRow: FunctionComponent<{width: number, height: number, onCommand: (c: Command) => void, selectedVocalization: Vocalization | undefined, focusFrameInterval?: [number, number]}> = ({width, height, onCommand, selectedVocalization, focusFrameInterval}) => {
	const W = (width - spacing * 5) / 4
	const W2 = (width - spacing * 3) / 2
	const buttonHeight = 25
	const buttonStyle: React.CSSProperties = {
		height: buttonHeight,
		width: W
	}
	const buttonStyle2: React.CSSProperties = {
		height: buttonHeight,
		width: W2
	}
	return (
		<div>
			<div style={{position: 'absolute', height: labelHeight, width, fontWeight: 'bold', fontSize: labelFontSize}}>
				Selected vocalization
			</div>
			<div style={{position: 'absolute', top: labelHeight, width}}>
				<div style={{position: 'absolute', left: spacing}}>
					<button disabled={!selectedVocalization || selectedVocalization.labels.includes('accept')} onClick={() => onCommand('accept-vocalization')} style={buttonStyle} title="Accept selected vocalization (a)">Accept</button>
				</div>
				<div style={{position: 'absolute', left: spacing + W + spacing}}>
					<button disabled={!selectedVocalization || !selectedVocalization.labels.includes('accept')} onClick={() => onCommand('unaccept-vocalization')} style={buttonStyle} title="Unaccept selected vocalization (u)">Unaccept</button>
				</div>
				<div style={{position: 'absolute', left: spacing + W + spacing + W + spacing}}>
					<button disabled={!focusFrameInterval} onClick={() => onCommand('add-vocalization')} style={buttonStyle}>Add</button>
				</div>
				<div style={{position: 'absolute', left: spacing + W + spacing + W + spacing + W + spacing}}>
					<button disabled={!selectedVocalization} onClick={() => onCommand('delete-vocalization')} style={buttonStyle}>Delete</button>
				</div>
			</div>
			<div style={{position: 'absolute', top: labelHeight + buttonHeight + 6, width}}>
				<div style={{position: 'absolute', left: spacing}}>
					<button onClick={() => onCommand('accept-all-vocalizations')} style={buttonStyle2}>Accept all</button>
				</div>
				<div style={{position: 'absolute', left: spacing + W2 + spacing}}>
					<button onClick={() => onCommand('unaccept-all-vocalizations')} style={buttonStyle2}>Unaccept all</button>
				</div>
			</div>
		</div>
	)
}

export default ControlPanelBottomArea
