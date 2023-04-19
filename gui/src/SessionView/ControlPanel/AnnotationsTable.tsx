import { Hyperlink } from "@figurl/core-views";
import { FunctionComponent, useMemo } from "react";
import { NiceTable, NiceTableColumn, NiceTableRow } from "../../component-nice-table";
import { useVocalizations } from "../../context-vocalizations";
import { Vocalization, VocalizationState } from "../../context-vocalizations/VocalizationContext";

type Props ={
	width: number
	height: number
}

const columns: NiceTableColumn[] = [
    {
        key: 'vocalizationId',
        label: 'ID'
    },
    {
        key: 'labels',
        label: 'Labels'
    },
    {
        key: 'poseStatus',
        label: 'Pose'
    }
]

const AnnotationsTable: FunctionComponent<Props> = ({width, height}) => {
	const {vocalizations, selectedVocalization, setSelectedVocalizationId} = useVocalizations()
	const rows: NiceTableRow[] = useMemo(() => {
        return vocalizations.map((x, i) => {
			const handleClick = () => {
				setSelectedVocalizationId(x.vocalizationId)
			}
            return {
                key: x.vocalizationId,
                columnValues: {
                    vocalizationId: {
                        element: <Hyperlink onClick={handleClick}>{x.vocalizationId}</Hyperlink>
                    },
                    labels: {
                        text: x.labels.join(', ')
                        // element: <EditableTextField onChange={newLabel => setVocalizationLabel(x.vocalizationId, newLabel)} value={x.labels.join(', ')} />
                    },
                    poseStatus: x.pose ? 'yes' : ''
                }
            }
        })
    }, [vocalizations, setSelectedVocalizationId])
	// const handleDelete = useCallback((vocalizationId: string) => {
    //     removeVocalization(vocalizationId)
    // }, [removeVocalization])
	const selectedVocalizationIds = useMemo(() => (
		selectedVocalization ? [selectedVocalization.vocalizationId] : []
	), [selectedVocalization])
	return (
        <div>
            <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
                <NiceTable
                    columns={columns}
                    rows={rows}
                    // onDeleteRow={handleDelete}
                    selectedRowKeys={selectedVocalizationIds}
                    selectionMode="single"
                    onSelectedRowKeysChanged={(keys: string[]) => setSelectedVocalizationId(keys[0])}
                    stickyHeader={true}
                    rowStyle={{background: 'white'}}
                    selectedRowStyle={{}}
                />
            </div>
        </div>
	)
}

export const timeIntervalForVocalization = (s: VocalizationState | undefined, v: Vocalization) => {
    if (!s) return undefined
    return [
        v.startFrame / s.samplingFrequency,
        v.endFrame / s.samplingFrequency
    ] as [number, number]
}

export const formatTimeInterval = (x: [number, number] | undefined) => {
    if (x === undefined) return 'undefined'
    return `[${x[0].toFixed(7)}, ${x[1].toFixed(7)}]`
}

export default AnnotationsTable
