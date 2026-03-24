type ValidationPayload = {
	valid: boolean;
	message?: string;
	errors?: Record<string, unknown>;
};

const originalFetch = global.fetch.bind(global);

let payload: ValidationPayload = {
	valid: true,
};

export function installCustomFieldValidationMock(): void {
	global.fetch = (async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
		const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
		const validationUrl = `${process.env.ACCOUNT_API_URL}/v1/resolver/validate`;

		if (url === validationUrl) {
			return new Response(JSON.stringify(payload), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			});
		}

		return originalFetch(input as never, init);
	}) as typeof global.fetch;
}

export function restoreCustomFieldValidationMock(): void {
	global.fetch = originalFetch;
	payload = {
		valid: true,
	};
}

export function setCustomFieldValidationPayload(nextPayload: ValidationPayload): void {
	payload = nextPayload;
}
