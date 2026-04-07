export interface CustomFieldCreateBodyInterface {
	orgId: number;
	entity: string;
	title: string;
	name: string;
	schema: Record<string, unknown>;
	status: "active" | "inactive";
}
