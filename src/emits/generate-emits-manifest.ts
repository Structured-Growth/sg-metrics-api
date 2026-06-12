import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";
import { createGenerator, Config } from "ts-json-schema-generator";
import { EmitsManifestEntryInterface } from "../interfaces/emits-manifest.interface";
import { EMITS_MANIFEST_PATH } from "./emits-manifest";

const DECORATOR_NAME = "Emits";
const TYPE_FORMAT_FLAGS =
	ts.TypeFormatFlags.NoTruncation |
	ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
	ts.TypeFormatFlags.UseFullyQualifiedType;

interface TsConfigLoadResult extends ts.ParsedCommandLine {
	configPath: string;
}

interface PayloadSchemaContext {
	counter: number;
	tempFilePaths: string[];
	tsconfigPath: string;
}

export function generateEmitsManifest(): EmitsManifestEntryInterface[] {
	const { options, fileNames, errors, configPath } = loadTsConfig();
	if (errors.length > 0) {
		throw new Error(formatDiagnostics(errors));
	}

	const program = ts.createProgram(fileNames, options);
	const checker = program.getTypeChecker();
	const entries: EmitsManifestEntryInterface[] = [];
	const payloadSchemaContext: PayloadSchemaContext = {
		counter: 0,
		tempFilePaths: [],
		tsconfigPath: configPath,
	};

	try {
		for (const sourceFile of program.getSourceFiles()) {
			if (!shouldScanSourceFile(sourceFile.fileName)) {
				continue;
			}

			ts.forEachChild(sourceFile, (node) => visitNode(node, sourceFile, checker, entries, payloadSchemaContext));
		}

		fs.mkdirSync(path.dirname(EMITS_MANIFEST_PATH), { recursive: true });
		fs.writeFileSync(EMITS_MANIFEST_PATH, JSON.stringify(entries, null, 2));
	} finally {
		for (const tempFilePath of payloadSchemaContext.tempFilePaths) {
			fs.rmSync(tempFilePath, { force: true });
		}
	}

	return entries;
}

function loadTsConfig(): TsConfigLoadResult {
	const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, "tsconfig.json");
	if (!configPath) {
		throw new Error("tsconfig.json not found");
	}

	const readResult = ts.readConfigFile(configPath, ts.sys.readFile);
	if (readResult.error) {
		throw new Error(formatDiagnostics([readResult.error]));
	}

	return {
		...ts.parseJsonConfigFileContent(readResult.config, ts.sys, path.dirname(configPath)),
		configPath,
	};
}

function visitNode(
	node: ts.Node,
	sourceFile: ts.SourceFile,
	checker: ts.TypeChecker,
	entries: EmitsManifestEntryInterface[],
	payloadSchemaContext: PayloadSchemaContext
): void {
	if (!ts.isClassDeclaration(node) || !node.name) {
		ts.forEachChild(node, (child) => visitNode(child, sourceFile, checker, entries, payloadSchemaContext));
		return;
	}

	const className = node.name.text;

	for (const member of node.members) {
		if (!ts.isMethodDeclaration(member) || !member.name || !ts.isIdentifier(member.name)) {
			continue;
		}

		const decorators = ts.canHaveDecorators(member) ? ts.getDecorators(member) || [] : [];
		for (const decorator of decorators) {
			const entry = extractEmitEntry(decorator, className, member.name.text, sourceFile, checker, payloadSchemaContext);
			if (entry) {
				entries.push(entry);
			}
		}
	}
}

function extractEmitEntry(
	decorator: ts.Decorator,
	className: string,
	targetName: string,
	sourceFile: ts.SourceFile,
	checker: ts.TypeChecker,
	payloadSchemaContext: PayloadSchemaContext
): EmitsManifestEntryInterface | null {
	if (!ts.isCallExpression(decorator.expression)) {
		return null;
	}

	const { expression, arguments: args, typeArguments } = decorator.expression;
	if (!ts.isIdentifier(expression) || expression.text !== DECORATOR_NAME) {
		return null;
	}

	const [eventArg] = args;
	if (!eventArg || !ts.isStringLiteralLike(eventArg)) {
		return null;
	}

	const payloadTypeNode = typeArguments?.[0];
	const payloadType = payloadTypeNode ? checker.getTypeFromTypeNode(payloadTypeNode) : null;

	return {
		className,
		targetName,
		event: eventArg.text,
		payloadSchemaName: payloadType ? resolvePayloadSchemaName(payloadTypeNode, payloadType, checker) : undefined,
		payloadSchema: payloadTypeNode
			? resolvePayloadSchema(payloadTypeNode, sourceFile, className, targetName, payloadSchemaContext)
			: undefined,
	};
}

function resolvePayloadSchema(
	typeNode: ts.TypeNode,
	sourceFile: ts.SourceFile,
	className: string,
	targetName: string,
	payloadSchemaContext: PayloadSchemaContext
): Record<string, unknown> {
	const generatedTypeName = buildGeneratedPayloadTypeName(className, targetName, payloadSchemaContext.counter++);
	const sourceDirectoryPath = path.dirname(sourceFile.fileName);
	const tempFilePath = path.join(sourceDirectoryPath, `.${generatedTypeName}.generated.ts`);
	const syntheticSource = `${sourceFile.getFullText()}\nexport type ${generatedTypeName} = ${typeNode.getText(
		sourceFile
	)};\n`;

	fs.writeFileSync(tempFilePath, syntheticSource, "utf8");
	payloadSchemaContext.tempFilePaths.push(tempFilePath);

	const config: Config = {
		path: tempFilePath,
		tsconfig: payloadSchemaContext.tsconfigPath,
		type: generatedTypeName,
		expose: "export",
		jsDoc: "none",
		topRef: false,
		skipTypeCheck: true,
		additionalProperties: false,
	};

	return createGenerator(config).createSchema(generatedTypeName) as Record<string, unknown>;
}

function resolvePayloadSchemaName(typeNode: ts.TypeNode, type: ts.Type, checker: ts.TypeChecker): string | undefined {
	const symbol = type.aliasSymbol || type.getSymbol();
	if (symbol?.getName()) {
		return symbol.getName();
	}

	const rendered = checker.typeToString(type, typeNode, TYPE_FORMAT_FLAGS);
	return rendered || undefined;
}

function shouldScanSourceFile(fileName: string): boolean {
	const normalizedFileName = path.normalize(fileName);
	const srcRoot = `${path.normalize(path.resolve(process.cwd(), "src"))}${path.sep}`;

	return normalizedFileName.startsWith(srcRoot) && !normalizedFileName.endsWith(".d.ts");
}

function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): string {
	return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
		getCanonicalFileName: (fileName) => fileName,
		getCurrentDirectory: () => process.cwd(),
		getNewLine: () => "\n",
	});
}

function buildGeneratedPayloadTypeName(className: string, targetName: string, counter: number): string {
	return `__EmitsPayload_${sanitizeIdentifier(className)}_${sanitizeIdentifier(targetName)}_${counter}`;
}

function sanitizeIdentifier(value: string): string {
	return value.replace(/[^A-Za-z0-9_]/g, "_");
}
