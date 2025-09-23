export function parseAccountArn(arn: string) {
	const parts = arn.split(":");
	const [appPrefix, region, orgIdStr, accountIdStr] = parts;

	const orgId = Number(orgIdStr);
	const accountId = Number(accountIdStr);

	return { appPrefix, region, orgId, accountId };
}
