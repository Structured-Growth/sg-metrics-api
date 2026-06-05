export interface ResolveEventsResponseInterface {
	data: {
		event: string;
		payloadSchema?: string;
		targetName: string;
		className?: string;
	}[];
}
