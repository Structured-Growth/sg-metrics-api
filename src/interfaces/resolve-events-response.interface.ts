export interface ResolveEventsResponseInterface {
	data: {
		event: string;
		targetName: string;
		className?: string;
		payloadSchemaName?: string;
		payloadSchema?: Record<string, unknown>;
	}[];
}
