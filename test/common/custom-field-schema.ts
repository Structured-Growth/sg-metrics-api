export const customFieldAlternativesSchema = {
	type: "alternatives",
	matches: [
		{
			schema: {
				type: "string",
				allow: [null, ""],
			},
		},
		{
			schema: {
				type: "number",
				allow: [null],
			},
		},
		{
			schema: {
				type: "boolean",
				allow: [null],
			},
		},
	],
};
