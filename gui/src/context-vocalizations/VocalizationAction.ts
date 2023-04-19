import { Vocalization, VocalizationPose, VocalizationState } from "./VocalizationContext"

type VocalizationAction = {
    type: 'addVocalization'
    vocalization: Vocalization
} | {
    type: 'removeVocalization'
    vocalizationId: string
} | {
    type: 'setVocalizationLabel'
    vocalizationId: string
    label: string
} | {
    type: 'setVocalizationState'
    vocalizationState: VocalizationState
} | {
    type: 'addVocalizationLabel'
    vocalizationId: string
    label: string
} | {
    type: 'addVocalizationLabelToAll'
    label: string
} | {
    type: 'removeVocalizationLabelFromAll'
    label: string
} | {
    type: 'removeVocalizationLabel'
    vocalizationId: string
    label: string
} | {
    type: 'setPose'
    vocalizationId: string
    pose: VocalizationPose | undefined
} | {
    type: 'removePose'
    vocalizationId: string
} | {
    type: 'addPosePoint'
    vocalizationId: string
    point: {x: number, y: number}
} | {
    type: 'movePosePoint'
    vocalizationId: string
    pointIndex: number
    newPoint: {x: number, y: number}
} | {
    type: 'setBox',
    box?: {x: number, y: number, w: number, h: number}
}

export default VocalizationAction