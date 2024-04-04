import { ExampleAttributes } from "../../database/models/example";

export interface ExampleUpdateBodyInterface {
	status?: ExampleAttributes["status"];
}
