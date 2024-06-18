export function getTimezoneOffset(dateString: string): number {
	const timezoneRegex = /([+-])(\d{2}):(\d{2})$/;
	const matches = dateString.match(timezoneRegex);

	if (matches) {
		const sign = matches[1] === "+" ? 1 : -1;
		const hours = parseInt(matches[2], 10);
		const minutes = parseInt(matches[3], 10);

		return sign * (hours * 60 + minutes);
	} else {
		throw new Error("Invalid date format");
	}
}
