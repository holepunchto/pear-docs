// scripts/bare-refgen/extract.ts
//
// Turn a module's entry `.d.ts` into a BareExport[] using the TypeScript
// Compiler API. Signatures are rendered from the declaration AST (the .d.ts IS
// the signature — no bodies), the checker is used to enumerate module exports
// (so re-exports and `export =` resolve), and JSDoc tags feed descriptions /
// params / returns / throws when a declaration carries them. Nothing invented.

import ts from 'typescript';
import { relative } from 'node:path';
import type { BareExport, BareKind, BareParam, BareReturns, BareThrows } from './model';

const COMPILER_OPTIONS: ts.CompilerOptions = {
  noEmit: true,
  skipLibCheck: true,
  allowJs: true,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
};

/** Keys TypeScript uses internally that never represent public API. */
const CONSTRUCTOR_NAME = ts.InternalSymbolName.Constructor; // "__constructor"

export function extractModule(entryDts: string, pkgRoot: string, moduleName?: string): BareExport[] {
  const program = ts.createProgram([entryDts], COMPILER_OPTIONS);
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(entryDts);
  if (!sf) throw new Error(`could not load ${entryDts}`);

  const moduleSymbol = checker.getSymbolAtLocation(sf);
  let { symbols, exclude } = moduleSymbol
    ? moduleApiSymbols(checker, moduleSymbol)
    : { symbols: [] as ts.Symbol[], exclude: new Set<ts.Symbol>() };

  // Ambient fallback: some packages declare their API inside
  // `declare module '<name>' { … }` (e.g. bare-mdns-discovery). The source file
  // then has no top-level exports — read the ambient module's symbol instead.
  if (symbols.length === 0) {
    const ambient = ambientModuleDecl(sf, moduleName);
    const ambientSym = ambient ? checker.getSymbolAtLocation(ambient.name) : undefined;
    if (ambientSym) ({ symbols, exclude } = moduleApiSymbols(checker, ambientSym));
  }

  const seen = new Set<ts.Symbol>();
  const exports: BareExport[] = [];
  for (const sym of symbols) {
    const resolved = resolveAlias(checker, sym);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    const ex = buildExport(checker, sym, resolved, '', 0, false, exclude, pkgRoot);
    if (ex) exports.push(ex);
  }
  return exports;
}

/** Declaration site relative to the package root (for a GitHub blob link). */
function sourceOf(decl: ts.Declaration, pkgRoot: string): { file: string; line: number } | null {
  const sf = decl.getSourceFile();
  if (!sf) return null;
  const file = relative(pkgRoot, sf.fileName);
  if (file.startsWith('..')) return null; // outside the package (a dependency)
  const line = sf.getLineAndCharacterOfPosition(decl.getStart()).line + 1;
  return { file, line };
}

/**
 * Top-level API symbols. For a named-export module that's just its exports. For
 * `export = X` it's X itself plus any DISTINCT classes/interfaces X's namespace
 * re-exports (e.g. bare-stream's Readable/Writable) promoted to siblings —
 * `exclude` then keeps those from also rendering as members of X. Static
 * helper functions/vars stay as members of X.
 */
function moduleApiSymbols(
  checker: ts.TypeChecker,
  moduleSymbol: ts.Symbol,
): { symbols: ts.Symbol[]; exclude: Set<ts.Symbol> } {
  const exportEquals = moduleSymbol.exports?.get(ts.InternalSymbolName.ExportEquals);
  if (!exportEquals) {
    return { symbols: checker.getExportsOfModule(moduleSymbol), exclude: new Set() };
  }
  const target = resolveAlias(checker, exportEquals);
  const siblings: ts.Symbol[] = [];
  const exclude = new Set<ts.Symbol>();
  target.exports?.forEach((m) => {
    const r = resolveAlias(checker, m);
    if (r === target) return; // self-reference (`export { X }` inside X)
    const kind = symbolKind(r);
    if (kind === 'class' || kind === 'interface') {
      siblings.push(r);
      exclude.add(r);
    }
  });
  return { symbols: [target, ...siblings], exclude };
}

/**
 * The ambient module declaration to extract from, when the file itself exports
 * nothing: prefer one whose quoted name matches the package, else the sole one.
 * Body-less shorthand declarations (`declare module 'x'`) carry no API and are
 * ignored — the caller then reports 0 exports and the driver skips the module.
 */
function ambientModuleDecl(sf: ts.SourceFile, moduleName?: string): ts.ModuleDeclaration | null {
  const ambients = sf.statements.filter(
    (s): s is ts.ModuleDeclaration => ts.isModuleDeclaration(s) && ts.isStringLiteral(s.name) && !!s.body,
  );
  if (ambients.length === 0) return null;
  const exact = moduleName
    ? ambients.find((a) => (a.name as ts.StringLiteral).text === moduleName)
    : undefined;
  return exact ?? (ambients.length === 1 ? ambients[0] : null);
}

function resolveAlias(checker: ts.TypeChecker, sym: ts.Symbol): ts.Symbol {
  return sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym;
}

const KIND_PRECEDENCE: BareKind[] = [
  'class',
  'function',
  'namespace',
  'interface',
  'typeAlias',
  'variable',
];

function declKind(decl: ts.Declaration): BareKind | null {
  if (ts.isFunctionDeclaration(decl) || ts.isCallSignatureDeclaration(decl)) return 'function';
  if (ts.isClassDeclaration(decl)) return 'class';
  if (ts.isInterfaceDeclaration(decl)) return 'interface';
  if (ts.isTypeAliasDeclaration(decl)) return 'typeAlias';
  if (ts.isModuleDeclaration(decl)) return 'namespace';
  if (ts.isVariableDeclaration(decl) || ts.isEnumDeclaration(decl)) return 'variable';
  if (ts.isMethodSignature(decl) || ts.isMethodDeclaration(decl)) return 'method';
  if (ts.isPropertySignature(decl) || ts.isPropertyDeclaration(decl)) return 'property';
  if (ts.isConstructorDeclaration(decl) || ts.isConstructSignatureDeclaration(decl)) return 'constructor';
  if (ts.isGetAccessorDeclaration(decl) || ts.isSetAccessorDeclaration(decl)) return 'accessor';
  return null;
}

function symbolKind(sym: ts.Symbol): BareKind {
  const kinds = new Set((sym.declarations ?? []).map(declKind).filter(Boolean) as BareKind[]);
  for (const k of KIND_PRECEDENCE) if (kinds.has(k)) return k;
  return [...kinds][0] ?? 'variable';
}

// ---- signature rendering -------------------------------------------------

function paramText(p: ts.ParameterDeclaration): string {
  const dots = p.dotDotDotToken ? '...' : '';
  const name = p.name.getText();
  const opt = p.questionToken ? '?' : '';
  const type = p.type ? `: ${p.type.getText()}` : '';
  const def = p.initializer ? ` = ${p.initializer.getText()}` : '';
  return `${dots}${name}${opt}${type}${def}`;
}

function typeParamsText(node: ts.SignatureDeclaration): string {
  const tps = node.typeParameters;
  return tps && tps.length ? `<${tps.map((t) => t.getText()).join(', ')}>` : '';
}

/** `name(params): ret` for a callable declaration (constructor → `new Name`). */
function callableSignature(displayName: string, node: ts.SignatureDeclaration): string {
  const isCtor = ts.isConstructorDeclaration(node) || ts.isConstructSignatureDeclaration(node);
  const name = isCtor ? `new ${displayName}` : displayName;
  const params = node.parameters.map(paramText).join(', ');
  const ret = node.type && !isCtor ? `: ${node.type.getText()}` : '';
  return `${name}${typeParamsText(node)}(${params})${ret}`;
}

/** `name: type` for a property/variable declaration. */
function memberSignature(displayName: string, decl: ts.Declaration): string {
  const typeNode = (decl as ts.PropertySignature | ts.PropertyDeclaration | ts.VariableDeclaration)
    .type;
  return typeNode ? `${displayName}: ${typeNode.getText()}` : displayName;
}

function stripKeywords(text: string): string {
  return text.replace(/^\s*(export\s+)?(declare\s+)?/, '').trim();
}

/** Signature for a non-callable export: full shape for types, `name: type` else. */
function nonCallableSignature(displayName: string, decl: ts.Declaration): string {
  if (ts.isTypeAliasDeclaration(decl)) {
    const tp = decl.typeParameters?.length
      ? `<${decl.typeParameters.map((t) => t.getText()).join(', ')}>`
      : '';
    return `type ${decl.name.text}${tp} = ${decl.type.getText()}`;
  }
  if (ts.isInterfaceDeclaration(decl) || ts.isEnumDeclaration(decl)) {
    return stripKeywords(decl.getText());
  }
  return memberSignature(displayName, decl);
}

// ---- params / returns / jsdoc -------------------------------------------

function paramsOf(node: ts.SignatureDeclaration): BareParam[] {
  return node.parameters.map((p) => ({
    name: p.name.getText(),
    type: p.type ? p.type.getText() : 'any',
    optional: !!p.questionToken || !!p.initializer,
    default: p.initializer ? p.initializer.getText() : null,
    description: jsDocParamComment(p),
  }));
}

function returnsOf(node: ts.SignatureDeclaration): BareReturns | null {
  if (!node.type) return null;
  const tag = ts.getJSDocReturnTag(node);
  return { type: node.type.getText(), description: commentText(tag?.comment) };
}

function throwsOf(node: ts.Node): BareThrows[] {
  const out: BareThrows[] = [];
  for (const tag of ts.getAllJSDocTags(node, (t): t is ts.JSDocTag => t.tagName.text === 'throws')) {
    const raw = commentText(tag.comment) ?? '';
    // `{TYPE} condition` → split the leading brace group off as the type.
    const m = raw.match(/^\s*\{([^}]+)\}\s*(.*)$/);
    out.push(m ? { type: m[1].trim(), condition: m[2].trim() } : { type: null, condition: raw });
  }
  return out;
}

function commentText(
  comment: string | ts.NodeArray<ts.JSDocComment> | undefined,
): string | null {
  if (!comment) return null;
  if (typeof comment === 'string') return comment.trim() || null;
  const text = comment.map((c) => c.text).join('').trim();
  return text || null;
}

function nodeDescription(decl: ts.Declaration): string | null {
  for (const jd of ts.getJSDocCommentsAndTags(decl)) {
    if (ts.isJSDoc(jd)) {
      const t = commentText(jd.comment);
      if (t) return t;
    }
  }
  return null;
}

function jsDocParamComment(p: ts.ParameterDeclaration): string | null {
  for (const tag of ts.getJSDocParameterTags(p)) {
    const t = commentText(tag.comment);
    if (t) return t;
  }
  return null;
}

function deprecationOf(decls: ts.Declaration[]): string | null {
  for (const d of decls) {
    const tag = ts
      .getAllJSDocTags(d, (t): t is ts.JSDocTag => t.tagName.text === 'deprecated')
      .at(0);
    if (tag) return commentText(tag.comment) ?? '';
  }
  return null;
}

// ---- members -------------------------------------------------------------

function isPrivate(decl: ts.Declaration): boolean {
  const mods = ts.canHaveModifiers(decl) ? ts.getModifiers(decl) : undefined;
  return !!mods?.some(
    (m) => m.kind === ts.SyntaxKind.PrivateKeyword || m.kind === ts.SyntaxKind.ProtectedKeyword,
  );
}

interface MemberRef {
  sym: ts.Symbol;
  isStatic: boolean;
}

/** Instance members (`sym.members`) + static/namespace members (`sym.exports`). */
function collectMembers(
  checker: ts.TypeChecker,
  sym: ts.Symbol,
  exclude: Set<ts.Symbol>,
): MemberRef[] {
  const out: MemberRef[] = [];
  const push = (table: ts.SymbolTable | undefined, isStatic: boolean) => {
    table?.forEach((m, key) => {
      if (String(key).startsWith('__') && key !== CONSTRUCTOR_NAME) return; // internals
      if (m.flags & ts.SymbolFlags.TypeParameter) return; // generic params (class Foo<T>)
      const resolved = resolveAlias(checker, m);
      if (resolved === sym) return; // self-reference (`export { X }` inside X)
      if (exclude.has(resolved)) return; // promoted to a top-level sibling
      out.push({ sym: resolved, isStatic });
    });
  };
  push(sym.members, false);
  push(sym.exports, true);
  return out;
}

// ---- build ---------------------------------------------------------------

const MAX_DEPTH = 3;

function buildExport(
  checker: ts.TypeChecker,
  original: ts.Symbol,
  sym: ts.Symbol,
  parentKey: string,
  depth: number,
  isStatic: boolean,
  exclude: Set<ts.Symbol>,
  pkgRoot: string,
): BareExport | null {
  const name = original.getName() === ts.InternalSymbolName.ExportEquals
    ? sym.getName()
    : original.getName();
  if (!name || name.startsWith('__')) {
    if (name !== CONSTRUCTOR_NAME) return null;
  }

  const decls = (sym.declarations ?? []).filter((d) => !isPrivate(d));
  if (decls.length === 0) return null;

  const kind = symbolKind(sym);
  const isCtor = name === CONSTRUCTOR_NAME;
  const container = parentKey.split('.').pop() ?? parentKey;
  // Statics render Node-style (`EventEmitter.on(...)`); instances render bare.
  const displayName = isCtor
    ? container
    : isStatic && parentKey
      ? `${container}.${name}`
      : name;
  const key = isCtor
    ? `${parentKey}.constructor`
    : parentKey
      ? `${parentKey}.${name}`
      : name;

  // Signatures: one per callable declaration, else a single member signature.
  const signatures: string[] = [];
  let params: BareParam[] = [];
  let returns: BareReturns | null = null;
  const throws: BareThrows[] = [];

  const callableDecls = decls.filter(
    (d): d is ts.SignatureDeclaration =>
      ts.isFunctionDeclaration(d) ||
      ts.isMethodSignature(d) ||
      ts.isMethodDeclaration(d) ||
      ts.isConstructorDeclaration(d) ||
      ts.isConstructSignatureDeclaration(d) ||
      ts.isCallSignatureDeclaration(d),
  );

  if (callableDecls.length > 0) {
    for (const d of callableDecls) signatures.push(callableSignature(displayName, d));
    // Params/returns from the first (canonical) overload — matches the heading;
    // throws are collected from all overloads.
    const primary = callableDecls[0];
    params = paramsOf(primary);
    returns = returnsOf(primary);
    for (const d of callableDecls) throws.push(...throwsOf(d));
  } else {
    const valueDecl =
      decls.find((d) => ts.isTypeAliasDeclaration(d) || ts.isInterfaceDeclaration(d)) ??
      decls.find((d) => ts.isPropertySignature(d) || ts.isPropertyDeclaration(d) || ts.isVariableDeclaration(d)) ??
      decls[0];
    signatures.push(nonCallableSignature(displayName, valueDecl));
  }

  const description = decls.map(nodeDescription).find(Boolean) ?? null;
  const deprecated = deprecationOf(decls);

  // Recurse into class/interface/namespace members (bounded depth).
  let members: BareExport[] = [];
  const isContainer = kind === 'class' || kind === 'interface' || kind === 'namespace';
  if (isContainer && depth < MAX_DEPTH) {
    const seen = new Set<ts.Symbol>();
    for (const ref of collectMembers(checker, sym, exclude)) {
      if (seen.has(ref.sym)) continue;
      seen.add(ref.sym);
      const child = buildExport(checker, ref.sym, ref.sym, key, depth + 1, ref.isStatic, exclude, pkgRoot);
      if (child) members.push(child);
    }
    members = sortMembers(members);
  }

  const primaryDecl = callableDecls[0] ?? decls[0];

  return {
    key,
    name: displayName,
    kind,
    static: isStatic,
    signatures,
    description,
    deprecated,
    params,
    returns,
    throws,
    source: sourceOf(primaryDecl, pkgRoot),
    members,
  };
}

/** Constructor first, then everything else alphabetically. */
function sortMembers(members: BareExport[]): BareExport[] {
  return [...members].sort((a, b) => {
    if (a.kind === 'constructor') return -1;
    if (b.kind === 'constructor') return 1;
    return a.name.localeCompare(b.name);
  });
}

// Debug entry: `tsx scripts/bare-refgen/extract.ts <entry.d.ts>`
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const entry = process.argv[2];
  if (!entry) throw new Error('usage: extract.ts <entry.d.ts>');
  console.log(JSON.stringify(extractModule(entry, process.argv[3] ?? process.cwd()), null, 2));
}
