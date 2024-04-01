import {BelongsToAccountInterface, BelongsToOrgInterface} from "@structured-growth/microservice-sdk";
import { ExampleAttributes } from "../../database/models/example";

export interface ExampleCreateBodyInterface extends BelongsToAccountInterface, BelongsToOrgInterface {
	status: ExampleAttributes["status"];
}
