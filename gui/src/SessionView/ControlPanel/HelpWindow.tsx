import { Table, TableBody, TableCell, TableRow } from "@material-ui/core";
import { FunctionComponent } from "react";

type Props ={
}

const HelpWindow: FunctionComponent<Props> = () => {
	return (
		<div>
			<h3>TODO: instructions go here</h3>
			<h3>Keyboard shortcuts</h3>
			<Table>
				<TableBody>
					<TableRow>
						<TableCell>{`<`}</TableCell>
						<TableCell>Select previous vocalization</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>{`>`}</TableCell>
						<TableCell>Select next vocalization</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>{`r`}</TableCell>
						<TableCell>Select random vocalization without a pose</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>{`a`}</TableCell>
						<TableCell>Accept the selected vocalization or add and accept a new vocalization based on the selected time interval</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>{`u`}</TableCell>
						<TableCell>Unaccept current vocalization</TableCell>
					</TableRow>
				</TableBody>
			</Table>
			<h3>Pose view</h3>
			<p>Shift+mouse-wheel to zoom</p>
			<p>Mouse-click to define pose positions</p>
			<p>Mouse-click and drag to edit pose positions</p>
		</div>
	)
}

export default HelpWindow
