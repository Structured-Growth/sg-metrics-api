export interface EmitsManifestEntryInterface {
	className: string;
	targetName: string;
	event: string;
	payloadSchemaName?: string;
	payloadSchema?: Record<string, unknown>;
}
