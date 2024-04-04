import { DefaultSearchParamsInterface } from "@structured-growth/microservice-sdk";
import { CategoryAttributes } from "../../database/models/category";

export interface CategorySearchParamsInterface extends Omit<DefaultSearchParamsInterface, "orgId" | "accountId"> {
	orgId?: number;
	status?: CategoryAttributes["status"][];
	/**
	 * Wildcards and exclusions are allowed:
	 *
	 * `title: ["Starts*", "-*ends"]`
	 */
	title?: string[];
	/**
	 * Wildcards and exclusions are allowed:
	 *
	 * `name: ["Starts*", "-*ends"]`
	 */
}
