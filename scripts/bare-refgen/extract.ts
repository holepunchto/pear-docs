// scripts/bare-refgen/extract.ts
//
// Turn a module's entry `.d.ts` into a BareExport[] using the TypeScript
// Compiler API. Signatures are rendered from the declaration AST (the .d.ts IS
// the signature — no bodies), the checker is used to enumerate module exports
// (so re-exports and `export =` resolve), and JSDoc tags feed descriptions /
// params / returns / throws when a declaration carries them. Nothing invented.

import ts from 'typescript';
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

export function extractModule(entryDts: string, moduleName?: string): BareExport[] {
  const program = ts.createProgram([entryDts], COMPILER_OPTIONS);
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(entryDts);
  if (!sf) throw new Error(`could not load ${entryDts}`);

  const moduleSymbol = checker.getSymbolAtLocation(sf);
  let { symbols, exclude } = moduleSymbol
    ? moduleApiSymbols(checker, sf, moduleSymbol)
    : { symbols: [] as ts.Symbol[], exclude: new Set<ts.Symbol>() };

  // Ambient fallback: some packages declare their API inside
  // `declare module '<name>' { … }` (e.g. bare-mdns-discovery). The source file
  // then has no top-level exports — read the ambient module's symbol instead.
  if (symbols.length === 0) {
    const ambient = ambientModuleDecl(sf, moduleName);
    const ambientSym = ambient ? checker.getSymbolAtLocation(ambient.name) : undefined;
    if (ambientSym) ({ symbols, exclude } = moduleApiSymbols(checker, sf, ambientSym));
  }

  const seen = new Set<ts.Symbol>();
  const exports: BareExport[] = [];
  for (const sym of symbols) {
    const resolved = resolveAlias(checker, sym);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    const ex = buildExport(checker, sym, resolved, '', 0, false, exclude);
    if (ex) exports.push(ex);
  }
  return exports;
}

/**
 * Top-level API symbols. For a named-export module that's just its exports. For
 * `export = X` it's X itself plus any DISTINCT classes/interfaces X's namespace
 * re-exports (e.g. bare-stream's Readable/Writable) promoted to siblings —
 * `exclude` then keeps those from also rendering as members of X. Static
 * helper functions/vars stay as members of X. Also promotes local classes/
 * interfaces that are never exported at all but are reachable from X's own
 * signatures (e.g. bare-broadcast-channel's `connect(): Port<T>`, where `Port`
 * has no export of its own) — see `reachableLocalSiblings`.
 */
function moduleApiSymbols(
  checker: ts.TypeChecker,
  sf: ts.SourceFile,
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
  for (const r of reachableLocalSiblings(checker, sf, [target, ...siblings])) {
    siblings.push(r);
    exclude.add(r);
  }
  return { symbols: [target, ...siblings], exclude };
}

/**
 * Local top-level class/interface declarations in the entry file that were
 * never discovered as an export of X (directly or via its namespace) but ARE
 * referenced — directly or transitively — from an already-discovered
 * declaration's signature (a param type, return type, or heritage clause).
 * Bare's `interface Foo {} + declare class Foo {}` merge pattern applies to
 * these too, so a class used only as a return type (never itself exported)
 * would otherwise vanish entirely instead of being documented as a sibling.
 */
function reachableLocalSiblings(
  checker: ts.TypeChecker,
  sf: ts.SourceFile,
  roots: ts.Symbol[],
): ts.Symbol[] {
  const localTopLevel = new Map<ts.Symbol, ts.Symbol>();
  for (const stmt of sf.statements) {
    if (!ts.isClassDeclaration(stmt) && !ts.isInterfaceDeclaration(stmt)) continue;
    if (!stmt.name) continue;
    const sym = checker.getSymbolAtLocation(stmt.name);
    if (!sym) continue;
    const resolved = resolveAlias(checker, sym);
    localTopLevel.set(resolved, resolved);
  }

  const included = new Set(roots);
  const found: ts.Symbol[] = [];
  const queue = [...roots];
  const visitedDecls = new Set<ts.Declaration>();

  function visit(node: ts.Node): void {
    if (ts.isTypeReferenceNode(node) || ts.isExpressionWithTypeArguments(node)) {
      const nameNode = ts.isTypeReferenceNode(node) ? node.typeName : node.expression;
      const sym = checker.getSymbolAtLocation(nameNode);
      if (sym) {
        const resolved = resolveAlias(checker, sym);
        const local = localTopLevel.get(resolved);
        if (local && !included.has(local)) {
          included.add(local);
          found.push(local);
          queue.push(local);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  while (queue.length > 0) {
    const sym = queue.shift()!;
    for (const decl of sym.declarations ?? []) {
      if (visitedDecls.has(decl)) continue;
      visitedDecls.add(decl);
      visit(decl);
    }
  }

  return found;
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
function nonCallableSignature(checker: ts.TypeChecker, displayName: string, decl: ts.Declaration): string {
  if (ts.isTypeAliasDeclaration(decl)) {
    const tp = decl.typeParameters?.length
      ? `<${decl.typeParameters.map((t) => t.getText()).join(', ')}>`
      : '';
    return `type ${decl.name.text}${tp} = ${decl.type.getText()}`;
  }
  if (ts.isInterfaceDeclaration(decl)) {
    return interfaceShapeText(checker, decl);
  }
  if (ts.isEnumDeclaration(decl)) {
    return stripKeywords(decl.getText());
  }
  return memberSignature(displayName, decl);
}

/**
 * An interface's full member shape — own members plus anything picked up
 * through `extends` (e.g. `SidecarEvents extends DuplexEvents` carries
 * `close`/`error` that `interface SidecarEvents { … }`'s own source text
 * never shows). Walks the checker's flattened property list for coverage,
 * but renders each member from ITS OWN declaration's source text (not
 * `checker.typeToString`) — a cross-package inherited member would otherwise
 * print as an absolute `import("/tmp/…/index").Type` path instead of the
 * plain name a hand-written signature would use.
 */
function interfaceShapeText(checker: ts.TypeChecker, decl: ts.InterfaceDeclaration): string {
  const sym = checker.getSymbolAtLocation(decl.name);
  const type = sym ? checker.getDeclaredTypeOfSymbol(sym) : null;
  if (!sym || !type) return stripKeywords(decl.getText());

  const lines: string[] = [];
  for (const prop of checker.getPropertiesOfType(type)) {
    const name = prop.getName();
    if (name.startsWith('__')) continue; // well-known symbols (Symbol.iterator, …)
    const d = prop.declarations?.[0];
    if (d && (ts.isPropertySignature(d) || ts.isPropertyDeclaration(d) || ts.isMethodSignature(d))) {
      lines.push(`  ${stripKeywords(d.getText()).replace(/[;,]$/, '')}`);
    } else {
      const pType = checker.getTypeOfSymbolAtLocation(prop, decl);
      lines.push(`  ${name}: ${checker.typeToString(pType, decl, ts.TypeFormatFlags.NoTruncation)}`);
    }
  }
  const tp = decl.typeParameters?.length
    ? `<${decl.typeParameters.map((t) => t.getText()).join(', ')}>`
    : '';
  return [`interface ${decl.name.text}${tp} {`, ...lines, '}'].join('\n');
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
    // `@throws {TYPE} condition` — TS parses the brace group as the tag's own
    // `typeExpression`, not as text inside `comment` (unlike `@param`, whose
    // description text and type share one grammar slot only for other tags).
    const fromType = ts.isJSDocThrowsTag(tag) ? tag.typeExpression?.type?.getText().trim() || null : null;
    const raw = commentText(tag.comment) ?? '';
    if (fromType) {
      out.push({ type: fromType, condition: raw });
    } else {
      // No parsed typeExpression (e.g. a manifest-authored string) — fall
      // back to splitting a leading `{TYPE}` off the comment text itself.
      const m = raw.match(/^\s*\{([^}]+)\}\s*(.*)$/);
      out.push(m ? { type: m[1].trim(), condition: m[2].trim() } : { type: null, condition: raw });
    }
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
    // `@param name - description` — unlike `@throws {TYPE} …`, TypeScript
    // doesn't parse the `- ` separator out of a plain (untyped) `@param`
    // tag's comment; it's left as literal leading text (emit-tsdoc.ts
    // writes exactly this style: `@param ${p} - ${desc}`).
    if (t) return t.replace(/^-\s*/, '');
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
    signatures.push(nonCallableSignature(checker, displayName, valueDecl));
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
      const child = buildExport(checker, ref.sym, ref.sym, key, depth + 1, ref.isStatic, exclude);
      if (child) members.push(child);
    }
    members = sortMembers(members);
  }

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
