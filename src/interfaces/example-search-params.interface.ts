import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";

export interface ExampleSearchParamsInterface extends DefaultSearchParamsInterface {
	status: "active" | "inactive";
}
