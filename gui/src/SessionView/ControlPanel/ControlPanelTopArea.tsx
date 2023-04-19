import { FunctionComponent } from "react";
import AnnotationsTable from "./AnnotationsTable";

type Props ={
	width: number
	height: number
}

const ControlPanelTopArea: FunctionComponent<Props> = ({width, height}) => {
	return (
		<div>
			<AnnotationsTable
				width={width}
				height={height}
			/>
		</div>
	)
}

export default ControlPanelTopArea
