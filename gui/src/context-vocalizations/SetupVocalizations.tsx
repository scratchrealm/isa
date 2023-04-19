import { FunctionComponent, PropsWithChildren, useMemo, useReducer } from "react";
import VocalizationsContext, { defaultVocalizationSelection, defaultVocalizationState, vocalizationReducer, vocalizationSelectionReducer } from "./VocalizationContext";

const SetupVocalizations: FunctionComponent<PropsWithChildren> = (props) => {
	const [vocalizationState, vocalizationDispatch] = useReducer(vocalizationReducer, defaultVocalizationState)
	const [vocalizationSelection, vocalizationSelectionDispatch] = useReducer(vocalizationSelectionReducer, defaultVocalizationSelection)
    const value = useMemo(() => ({vocalizationState, vocalizationDispatch, vocalizationSelection, vocalizationSelectionDispatch}), [vocalizationState, vocalizationDispatch, vocalizationSelection, vocalizationSelectionDispatch])
	// const {urlState} = useUrlState()
	// const first = useRef<boolean>(true)
	// useEffect(() => {
	// 	if (!first.current) return
	// 	const uri = urlState.vocalizations
	// 	if (uri) {
	// 		getFileData(uri, () => {}).then((x) => {
	// 			vocalizationDispatch({type: 'setVocalizationState', vocalizationState: x})
	// 		}).catch((err: Error) => {
	// 			console.warn('Problem getting vocalization state')
	// 			console.warn(err)
	// 		})
	// 	}
	// 	first.current = false
	// }, [urlState.vocalizations, first])
    return (
        <VocalizationsContext.Provider value={value}>
            {props.children}
        </VocalizationsContext.Provider>
    )
}

export default SetupVocalizations
