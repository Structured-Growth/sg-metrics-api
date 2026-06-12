import * as fs from "node:fs";
import * as path from "node:path";
import { EmitsManifestEntryInterface } from "../interfaces/emits-manifest.interface";

export const EMITS_MANIFEST_PATH = path.resolve(process.cwd(), ".docs/emits.v1.json");

export function readGeneratedEmitsManifest(): EmitsManifestEntryInterface[] {
	if (!fs.existsSync(EMITS_MANIFEST_PATH)) {
		return [];
	}

	try {
		const content = fs.readFileSync(EMITS_MANIFEST_PATH, "utf8");
		const data = JSON.parse(content);
		return Array.isArray(data) ? data : [];
	} catch (error) {
		console.warn(`Failed to read emits manifest at ${EMITS_MANIFEST_PATH}:`, error);
		return [];
	}
}

export function mergeRegisteredEmitsWithManifest<T extends { className?: string; targetName: string; event: string }>(
	registeredEmits: T[],
	manifestEntries: EmitsManifestEntryInterface[]
): Array<T & Partial<EmitsManifestEntryInterface>> {
	const manifestByKey = new Map(
		manifestEntries.map((entry) => [buildEmitKey(entry.className, entry.targetName, entry.event), entry] as const)
	);

	return registeredEmits.map((emit) => {
		const manifestEntry = manifestByKey.get(buildEmitKey(emit.className, emit.targetName, emit.event));
		return manifestEntry ? { ...emit, ...manifestEntry } : emit;
	});
}

function buildEmitKey(className: string | undefined, targetName: string, event: string): string {
	return `${className || ""}:${targetName}:${event}`;
}
