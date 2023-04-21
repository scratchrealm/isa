import { readDir, startListeningToParent } from "@figurl/interface";
import { SetupAnnotations } from "@figurl/timeseries-views";
import { FunctionComponent, useEffect, useState } from "react";
import { SetupVocalizations } from "./context-vocalizations";
import SessionView from "./SessionView/SessionView";
import useWindowDimensions from "./useWindowDimensions";

const urlSearchParams = new URLSearchParams(window.location.search)
const queryParams = Object.fromEntries(urlSearchParams.entries())

const MainWindow: FunctionComponent = () => {
    const { width, height } = useWindowDimensions()
    const [folderType, setFolderType] = useState<'session' | 'unknown'>()
    useEffect(() => {
        (async () => {
            const dir = await readDir(`$dir`)
            const isaSessionFileExists = dir.files.map(f => (f.name)).includes('isa-session.yaml')
            if (isaSessionFileExists) {
                setFolderType('session')
            }
            else {
                setFolderType('unknown')
            }
        })()
    }, [])
    if (folderType === undefined) {
        return <div>Checking folder type</div>
    }
    if (folderType === 'unknown') {
        return <div>Unknown folder type</div>
    }
    return (
        <SetupAnnotations>
            <SetupVocalizations>
                <SessionView
                    width={width}
                    height={height}
                />
            </SetupVocalizations>
        </SetupAnnotations>
    )
}

if (queryParams.figureId) {
    startListeningToParent()
}

export default MainWindow