import { joi, RegionEnum } from "@structured-growth/microservice-sdk";
import CustomField from "../../database/models/custom-field.sequelize";

async function createCustomField(
	orgId: number,
	entity: string,
	name: string,
	title: string,
	schema: Record<string, unknown>
): Promise<void> {
	const [customField] = await CustomField.findOrCreate({
		where: {
			orgId,
			entity,
			name,
		},
		defaults: {
			orgId,
			region: RegionEnum.US,
			entity,
			title,
			name,
			schema,
			status: "active",
		},
	});

	if (
		customField.title !== title ||
		customField.status !== "active" ||
		JSON.stringify(customField.schema) !== JSON.stringify(schema)
	) {
		await customField.update({
			title,
			schema,
			status: "active",
		});
	}
}

export async function seedMetricCustomFields(orgId: number): Promise<void> {
	await createCustomField(orgId, "Metric", "source", "Source", joi.string().min(2).describe());
	await createCustomField(
		orgId,
		"Metric",
		"a",
		"A",
		joi.alternatives().try(joi.string().min(1), joi.boolean()).describe()
	);
	await createCustomField(orgId, "Metric", "b", "B", joi.string().describe());
	await createCustomField(orgId, "Metric", "c", "C", joi.number().describe());
	await createCustomField(orgId, "Metric", "bool", "Bool", joi.boolean().describe());
	await createCustomField(orgId, "Metric", "string", "String", joi.string().describe());
	await createCustomField(orgId, "Metric", "date", "Date", joi.string().describe());
	await createCustomField(orgId, "Metric", "number", "Number", joi.number().describe());
	await createCustomField(orgId, "Metric", "notes", "Notes", joi.string().allow("").describe());
	await createCustomField(
		orgId,
		"Metric",
		"base",
		"Base",
		joi.alternatives().try(joi.boolean(), joi.number()).describe()
	);
	await createCustomField(orgId, "Metric", "m", "M", joi.string().describe());
	await createCustomField(orgId, "Metric", "n", "N", joi.number().describe());
	await createCustomField(orgId, "Metric", "added", "Added", joi.boolean().describe());
	await createCustomField(orgId, "Metric", "concurrent", "Concurrent", joi.string().describe());
	await createCustomField(orgId, "Metric", "stamp", "Stamp", joi.number().describe());
	await createCustomField(orgId, "Metric", "t", "T", joi.number().describe());
	await createCustomField(orgId, "Metric", "final", "Final", joi.boolean().describe());
}

export async function seedMetricCategoryCustomFields(orgId: number): Promise<void> {
	await createCustomField(orgId, "MetricCategory", "specUrl", "Spec URL", joi.string().describe());
	await createCustomField(orgId, "MetricCategory", "countryCode", "Country Code", joi.string().min(2).describe());
}

export async function seedMetricTypeCustomFields(orgId: number): Promise<void> {
	await createCustomField(orgId, "MetricType", "specUrl", "Spec URL", joi.string().describe());
	await createCustomField(orgId, "MetricType", "countryCode", "Country Code", joi.string().min(2).describe());
}

export async function seedReportCustomFields(orgId: number): Promise<void> {
	await createCustomField(orgId, "Report", "reportCode", "Report Code", joi.string().min(2).describe());
}
