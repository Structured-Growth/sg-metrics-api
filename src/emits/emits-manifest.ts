import * as fs from "node:fs";
import * as path from "node:path";
import { EmitsManifestEntryInterface } from "../interfaces/emits-manifest.interface";

export const EMITS_MANIFEST_PATH = path.resolve(process.cwd(), ".docs/emits.v1.json");

export function readGeneratedEmitsManifest(): EmitsManifestEntryInterface[] {
	console.log("[emits-manifest] read:start", {
		cwd: process.cwd(),
		path: EMITS_MANIFEST_PATH,
		exists: fs.existsSync(EMITS_MANIFEST_PATH),
	});

	if (!fs.existsSync(EMITS_MANIFEST_PATH)) {
		console.log("[emits-manifest] read:missing", {
			path: EMITS_MANIFEST_PATH,
		});
		return [];
	}

	try {
		const content = fs.readFileSync(EMITS_MANIFEST_PATH, "utf8");
		const data = JSON.parse(content);
		const result = Array.isArray(data) ? data : [];
		console.log("[emits-manifest] read:success", {
			path: EMITS_MANIFEST_PATH,
			entries: result.length,
			sampleKeys: result.slice(0, 5).map((entry) => buildEmitKey(entry.className, entry.targetName, entry.event)),
		});
		return result;
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

	console.log("[emits-manifest] merge:start", {
		runtimeEntries: registeredEmits.length,
		manifestEntries: manifestEntries.length,
		runtimeKeys: registeredEmits.slice(0, 10).map((emit) => buildEmitKey(emit.className, emit.targetName, emit.event)),
		manifestKeys: manifestEntries
			.slice(0, 10)
			.map((entry) => buildEmitKey(entry.className, entry.targetName, entry.event)),
	});

	return registeredEmits.map((emit) => {
		const key = buildEmitKey(emit.className, emit.targetName, emit.event);
		const manifestEntry = manifestByKey.get(key);

		console.log("[emits-manifest] merge:item", {
			key,
			matched: !!manifestEntry,
			payloadSchemaName: manifestEntry?.payloadSchemaName,
			hasPayloadSchema: !!manifestEntry?.payloadSchema,
		});

		return manifestEntry ? { ...emit, ...manifestEntry } : emit;
	});
}

function buildEmitKey(className: string | undefined, targetName: string, event: string): string {
	return `${className || ""}:${targetName}:${event}`;
}
