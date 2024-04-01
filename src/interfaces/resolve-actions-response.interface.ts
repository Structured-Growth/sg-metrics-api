export interface ResolveActionsResponseInterface {
	data: {
		action: string;
		route: string;
		resources: {
			resource: string;
			arnPattern: string;
		}[];
	}[];
}
