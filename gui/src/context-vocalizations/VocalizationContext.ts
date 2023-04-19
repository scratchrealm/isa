import { randomAlphaString } from "@figurl/core-utils"
import { useTimeseriesSelection } from "@figurl/timeseries-views"
import React, { useCallback, useContext, useMemo } from "react"
import { timeIntervalForVocalization } from "../SessionView/VocalizationsTable"
import VocalizationAction from "./VocalizationAction"

export type VocalizationPose = {
    points: {x: number, y: number}[]
}

export type Vocalization = {
    vocalizationId: string
    labels: string[]
    startFrame: number
    endFrame: number
    pose?: VocalizationPose
    box?: {x: number, y: number, w: number, h: number}
}

export type VocalizationState = {
    samplingFrequency: number
    vocalizations: Vocalization[]
    box?: {x: number, y: number, w: number, h: number}
}

export const defaultVocalizationState: VocalizationState = {
    samplingFrequency: 1,
    vocalizations: []
}

export const vocalizationReducer = (s: VocalizationState, a: VocalizationAction): VocalizationState => {
    if (a.type === 'addVocalization') {
        return {
            ...s,
            vocalizations: sortVocalizations([...s.vocalizations, a.vocalization])
        }
    }
    else if (a.type === 'removeVocalization') {
        return {
            ...s,
            vocalizations: sortVocalizations(s.vocalizations.filter(x => (x.vocalizationId !== a.vocalizationId)))
        }
    }
    else if (a.type === 'setVocalizationLabel') {
        return {
            ...s,
            vocalizations: sortVocalizations(s.vocalizations.map(x => (x.vocalizationId === a.vocalizationId ? {...x, label: a.label} : x)))
        }
    }
    else if (a.type === 'setVocalizationState') {
        return {
            ...a.vocalizationState
        }
    }
    else if (a.type === 'addVocalizationLabel') {
        return {
            ...s,
            vocalizations: s.vocalizations.map(v => (v.vocalizationId === a.vocalizationId ? (addLabel(v, a.label)) : v))
        }
    }
    else if (a.type === 'addVocalizationLabelToAll') {
        return {
            ...s,
            vocalizations: s.vocalizations.map(v => ((addLabel(v, a.label))))
        }
    }
    else if (a.type === 'removeVocalizationLabelFromAll') {
        return {
            ...s,
            vocalizations: s.vocalizations.map(v => ((removeLabel(v, a.label))))
        }
    }
    else if (a.type === 'removeVocalizationLabel') {
        return {
            ...s,
            vocalizations: s.vocalizations.map(v => (v.vocalizationId === a.vocalizationId ? (removeLabel(v, a.label)) : v))
        }
    }
    else if (a.type === 'setPose') {
        return {
            ...s,
            vocalizations: s.vocalizations.map(v => (v.vocalizationId === a.vocalizationId) ? {...v, pose: a.pose} : v)
        }
    }
    else if (a.type === 'addPosePoint') {
        const s2 = {
            ...s,
            vocalizations: s.vocalizations.map(v => (v.vocalizationId === a.vocalizationId) ? {...v, pose: addPosePoint(v.pose, a.point)} : v)
        }
        // also accept it
        return vocalizationReducer(s2, {type: 'addVocalizationLabel', vocalizationId: a.vocalizationId, label: 'accept'})
    }
    else if (a.type === 'movePosePoint') {
        return {
            ...s,
            vocalizations: s.vocalizations.map(v => (v.vocalizationId === a.vocalizationId) ? {...v, pose: movePosePoint(v.pose, a.pointIndex, a.newPoint)} : v)
        }
    }
    else if (a.type === 'removePose') {
        return {
            ...s,
            vocalizations: s.vocalizations.map(v => (v.vocalizationId === a.vocalizationId ? ({...v, pose: undefined}) : v))
        }
    }
    else if (a.type === 'setBox') {
        return {
            ...s,
            box: a.box
        }
    }
    else return s
}

const addLabel = (v: Vocalization, label: string): Vocalization => {
    return {
        ...v,
        labels: v.labels.includes(label) ? v.labels : [...v.labels, label].sort()
    }
}

const removeLabel = (v: Vocalization, label: string): Vocalization => {
    return {
        ...v,
        labels: v.labels.filter(x => (x !== label))
    }
}

const sortVocalizations = (x: Vocalization[]) => {
    return [...x].sort((a, b) => (a.startFrame - b.startFrame))
}

const addPosePoint = (pose: VocalizationPose | undefined, point: {x: number, y: number}): VocalizationPose => {
    if (!pose) return {
        points: [point]
    }
    if (pose.points.length >= 2) return pose
    return {...pose, points: [...pose.points, point]}
}

const movePosePoint = (pose: VocalizationPose | undefined, pointIndex: number, newPoint: {x: number, y: number}) => {
    if (!pose) return undefined
    const newPoints = [...pose.points]
    if (pointIndex >= newPoints.length) return pose
    newPoints[pointIndex] = newPoint
    return {...pose, points: newPoints}
}

export type VocalizationSelection = {
    selectedVocalizationId: string | undefined
}

export type VocalizationSelectionAction = {
    type: 'setSelectedVocalization'
    vocalizationId: string | undefined
}

export const defaultVocalizationSelection: VocalizationSelection = {
    selectedVocalizationId: undefined
}

export const vocalizationSelectionReducer = (s: VocalizationSelection, a: VocalizationSelectionAction): VocalizationSelection => {
    if (a.type === 'setSelectedVocalization') {
        return {...s, selectedVocalizationId: a.vocalizationId}
    }
    else return s
}

const VocalizationContext = React.createContext<{
    vocalizationState?: VocalizationState,
    vocalizationDispatch?: (action: VocalizationAction) => void
    vocalizationSelection?: VocalizationSelection,
    vocalizationSelectionDispatch?: (action: VocalizationSelectionAction) => void
}>({})

export const useVocalizations = () => {
    const {vocalizationState, vocalizationDispatch, vocalizationSelection, vocalizationSelectionDispatch} = useContext(VocalizationContext)
    const {currentTime, setCurrentTime} = useTimeseriesSelection()
    const addVocalization = useCallback((vocalization: Vocalization) => {
        if (!vocalization.vocalizationId) {
            vocalization.vocalizationId = randomAlphaString(10)
        }
        vocalizationDispatch && vocalizationDispatch({
            type: 'addVocalization',
            vocalization
        })
    }, [vocalizationDispatch])
    const removeVocalization = useCallback((vocalizationId: string) => {
        vocalizationDispatch && vocalizationDispatch({
            type: 'removeVocalization',
            vocalizationId
        })
    }, [vocalizationDispatch])
    const setVocalizationLabel = useCallback((vocalizationId: string, label: string) => {
        vocalizationDispatch && vocalizationDispatch({
            type: 'setVocalizationLabel',
            vocalizationId,
            label
        })
    }, [vocalizationDispatch])
    const vocalizations: Vocalization[] = useMemo(() => (
        vocalizationState?.vocalizations || []
    ), [vocalizationState])
    const selectedVocalization: Vocalization | undefined = useMemo(() => (
        vocalizations.filter(v => (v.vocalizationId === vocalizationSelection?.selectedVocalizationId))[0] as (Vocalization | undefined)
    ), [vocalizations, vocalizationSelection?.selectedVocalizationId])
    const setSelectedVocalizationId = useCallback((id: string | undefined) => {
        vocalizationSelectionDispatch && vocalizationSelectionDispatch({
            type: 'setSelectedVocalization',
            vocalizationId: id
        })
        const sv = vocalizations.find(v => (v.vocalizationId === id))
        if (sv) {
            const timeIntervalSec = timeIntervalForVocalization(vocalizationState, sv)
            if (timeIntervalSec) {
                setCurrentTime(timeIntervalSec[0], {autoScrollVisibleTimeRange: true})
            }
        }
    }, [vocalizationSelectionDispatch, vocalizationState, setCurrentTime, vocalizations])
	const selectNextOrPrevVocalization = useCallback((which: 'next' | 'prev') => {
        let newIndex: number | undefined
        if (selectedVocalization) {
            const i = vocalizations.map(v => (v.vocalizationId)).indexOf(selectedVocalization.vocalizationId)
            if (which === 'next') {
                newIndex = i < 0 ? 0 : i + 1
            }
            else {
                newIndex = i < 0 ? 0 : i - 1
            }
            if (newIndex === undefined) return
            if (newIndex < 0) return
            if (newIndex >= vocalizations.length) return
            setSelectedVocalizationId(vocalizations[newIndex].vocalizationId)
        }
        else {
            if (currentTime === undefined) return
            if (vocalizationState === undefined) return
            const focusFrame = Math.floor(currentTime * vocalizationState.samplingFrequency)
            const a = which === 'next' ? (
                vocalizations.filter(v => (v.startFrame >= focusFrame))
            ) : (
                vocalizations.filter(v => (v.endFrame <= focusFrame))
            )
            if (a.length === 0) return
            if (which === 'next') {
                setSelectedVocalizationId(a[0].vocalizationId)
            }
            else {
                setSelectedVocalizationId(a[a.length - 1].vocalizationId)
            }
        }
	}, [selectedVocalization, vocalizations, setSelectedVocalizationId, currentTime, vocalizationState])
    const selectNextVocalization = useCallback(() => {
        selectNextOrPrevVocalization('next')
    }, [selectNextOrPrevVocalization])
    const selectPreviousVocalization = useCallback(() => {
        selectNextOrPrevVocalization('prev')
    }, [selectNextOrPrevVocalization])
    const selectFirstVocalization = useCallback(() => {
        setSelectedVocalizationId(vocalizations[0].vocalizationId)
	}, [vocalizations, setSelectedVocalizationId])
    const selectLastVocalization = useCallback(() => {
        setSelectedVocalizationId(vocalizations[vocalizations.length - 1].vocalizationId)
	}, [vocalizations, setSelectedVocalizationId])
    const selectRandomVocalizationWithoutPose = useCallback(() => {
        const candidates = vocalizations.filter(v => ((!v.pose) || (v.pose.points.length < 2)))
        if (candidates.length === 0) {
            console.warn('No candidate vocalizations without pose')
            return
        }
        const ii = randomInt(0, candidates.length)
        setSelectedVocalizationId(candidates[ii].vocalizationId)
    }, [vocalizations, setSelectedVocalizationId])
    const addVocalizationLabel = useCallback((vocalizationId: string, label: string) => {
        vocalizationDispatch && vocalizationDispatch({type: 'addVocalizationLabel', vocalizationId, label})
    }, [vocalizationDispatch])
    const addVocalizationLabelToAll = useCallback((label: string) => {
        vocalizationDispatch && vocalizationDispatch({type: 'addVocalizationLabelToAll', label})
    }, [vocalizationDispatch])
    const removeVocalizationLabelFromAll = useCallback((label: string) => {
        vocalizationDispatch && vocalizationDispatch({type: 'removeVocalizationLabelFromAll', label})
    }, [vocalizationDispatch])
    const removeVocalizationLabel = useCallback((vocalizationId: string, label: string) => {
        vocalizationDispatch && vocalizationDispatch({type: 'removeVocalizationLabel', vocalizationId, label})
    }, [vocalizationDispatch])
    const setPose = useCallback((vocalizationId: string, pose: VocalizationPose | undefined) => {
        vocalizationDispatch && vocalizationDispatch({type: 'setPose', vocalizationId, pose})
    }, [vocalizationDispatch])
    const addPosePoint = useCallback((vocalizationId: string, point: {x: number, y: number}) => {
        vocalizationDispatch && vocalizationDispatch({type: 'addPosePoint', vocalizationId, point})
    }, [vocalizationDispatch])
    const movePosePoint = useCallback((vocalizationId: string, pointIndex: number, newPoint: {x: number, y: number}) => {
        vocalizationDispatch && vocalizationDispatch({type: 'movePosePoint', vocalizationId, pointIndex, newPoint})
    }, [vocalizationDispatch])
    const removePose = useCallback((vocalizationId: string) => {
        vocalizationDispatch && vocalizationDispatch({type: 'removePose', vocalizationId})
    }, [vocalizationDispatch])
    const setBox = useCallback((box: {x: number, y: number, w: number, h: number}) => {
        vocalizationDispatch && vocalizationDispatch({type: 'setBox', box})
    }, [vocalizationDispatch])
    const box = vocalizationState?.box
    return useMemo(() => ({
        vocalizationState,
        vocalizations,
        addVocalization,
        removeVocalization,
        setVocalizationLabel,
        selectedVocalization,
        setSelectedVocalizationId,
        selectPreviousVocalization,
        selectNextVocalization,
        selectFirstVocalization,
        selectLastVocalization,
        selectRandomVocalizationWithoutPose,
        addVocalizationLabel,
        addVocalizationLabelToAll,
        removeVocalizationLabelFromAll,
        removeVocalizationLabel,
        setPose,
        addPosePoint,
        movePosePoint,
        removePose,
        setBox,
        box
    }), [vocalizations, addVocalization, addVocalizationLabelToAll, removeVocalizationLabelFromAll, removeVocalization, setVocalizationLabel, selectedVocalization, setSelectedVocalizationId, selectNextVocalization, selectPreviousVocalization, selectFirstVocalization, selectLastVocalization, selectRandomVocalizationWithoutPose, addVocalizationLabel, removeVocalizationLabel, vocalizationState, setPose, addPosePoint, movePosePoint, removePose, setBox, box])
}

function randomInt(min: number, max: number) { // [min, max)
    return Math.floor(Math.random() * (max - min) + min)
}

export default VocalizationContext