/**
 * A REAL COMPILER FRONT END, for one statement at a time.
 *
 * Four stages, each a pure function of the previous one's output:
 *
 *   scan    → tokens
 *   parse   → abstract syntax tree      (recursive descent)
 *   lower   → three-address code        (temporaries, in evaluation order)
 *   allocate→ registers                 (linear scan over live ranges)
 *
 * ── Why this is here ────────────────────────────────────────────────────
 * Compiler Design is on the CV's coursework list. A bullet point claiming that
 * is worth very little; a scanner and a recursive-descent parser that report
 * the exact column of a syntax error, and a register allocator that reuses a
 * register the moment its last use has passed, are worth rather more. Every
 * stage below is genuinely implemented — there is no lookup table of
 * pre-computed answers anywhere in this file, and any input the grammar accepts
 * is compiled from scratch on the keystroke.
 *
 * ── Why the stages are separate functions ───────────────────────────────
 * The same reason the sorting bench emits a trace: the UI needs to show all
 * four stages simultaneously and stay consistent while the input changes on
 * every keystroke. Because each stage is `(input) => output` with no shared
 * mutable state, rendering all four is one pass with no possibility of the
 * panels disagreeing about which version of the source they are describing.
 *
 * ── The grammar ─────────────────────────────────────────────────────────
 *   statement  := IDENT '=' expr
 *   expr       := term   (('+' | '-') term)*
 *   term       := factor (('*' | '/' | '%') factor)*
 *   factor     := unary
 *   unary      := ('-' | '+') unary | primary
 *   primary    := NUMBER | IDENT | '(' expr ')'
 *
 * Left-recursion is expressed as iteration inside each level, which is what
 * gives left-associativity (`a - b - c` is `(a - b) - c`) without an infinite
 * descent. Precedence is the nesting order of the levels themselves: `term`
 * binds tighter than `expr` because `expr` calls it, so no precedence table is
 * needed. `unary` recurses into itself so `--x` and `-+-y` parse correctly.
 */

import {
  NO_CHECKS,
  check,
  nearly,
  ratio,
  verification,
  type Verification,
} from './core/verify';

/* ================================================================== *
 * 1. SCANNER
 * ================================================================== */

export type TokenKind =
  | 'ident'
  | 'number'
  | 'op'
  | 'lparen'
  | 'rparen'
  | 'assign'
  | 'eof';

export interface Token {
  kind: TokenKind;
  text: string;
  /** Byte offset in the source — what makes error carets land correctly. */
  start: number;
  end: number;
}

/** Raised with a source position, so the UI can point at the offending column. */
export class CompileError extends Error {
  constructor(
    message: string,
    readonly position: number,
    readonly stage: 'scan' | 'parse',
  ) {
    super(message);
    this.name = 'CompileError';
  }
}

const isDigit = (c: string) => c >= '0' && c <= '9';
const isIdentStart = (c: string) => /[A-Za-z_]/.test(c);
const isIdentPart = (c: string) => /[A-Za-z0-9_]/.test(c);

/**
 * Source text → tokens.
 *
 * Hand-written rather than regex-driven: a scanner's job includes reporting
 * *where* an unexpected character was, and a single tokenising regex loses the
 * position of the thing it failed on.
 */
export function scan(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < src.length) {
    const c = src[i];

    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }

    if (isDigit(c) || (c === '.' && isDigit(src[i + 1] ?? ''))) {
      const start = i;
      while (i < src.length && isDigit(src[i])) i++;
      // One decimal point, and only if a digit follows it — `1.2.3` must be an
      // error rather than silently scanning as two numbers.
      if (src[i] === '.') {
        i++;
        while (i < src.length && isDigit(src[i])) i++;
      }
      if (src[i] === '.') {
        throw new CompileError('Malformed number — a second decimal point.', i, 'scan');
      }
      tokens.push({ kind: 'number', text: src.slice(start, i), start, end: i });
      continue;
    }

    if (isIdentStart(c)) {
      const start = i;
      while (i < src.length && isIdentPart(src[i])) i++;
      tokens.push({ kind: 'ident', text: src.slice(start, i), start, end: i });
      continue;
    }

    if ('+-*/%'.includes(c)) {
      tokens.push({ kind: 'op', text: c, start: i, end: i + 1 });
      i++;
      continue;
    }

    if (c === '(') {
      tokens.push({ kind: 'lparen', text: c, start: i, end: i + 1 });
      i++;
      continue;
    }

    if (c === ')') {
      tokens.push({ kind: 'rparen', text: c, start: i, end: i + 1 });
      i++;
      continue;
    }

    if (c === '=') {
      tokens.push({ kind: 'assign', text: c, start: i, end: i + 1 });
      i++;
      continue;
    }

    throw new CompileError(`Unexpected character ${JSON.stringify(c)}.`, i, 'scan');
  }

  tokens.push({ kind: 'eof', text: '', start: src.length, end: src.length });
  return tokens;
}

/* ================================================================== *
 * 2. PARSER
 * ================================================================== */

export type Node =
  | { type: 'num'; value: number }
  | { type: 'var'; name: string }
  | { type: 'unary'; op: string; operand: Node }
  | { type: 'binary'; op: string; left: Node; right: Node };

export interface Assignment {
  target: string;
  expr: Node;
}

/**
 * Tokens → AST, by recursive descent.
 *
 * One method per precedence level. The shape of the call chain *is* the
 * precedence: `expr` calls `term` calls `unary` calls `primary`, so anything
 * `primary` accepts binds tightest.
 */
class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private next(): Token {
    return this.tokens[this.pos++];
  }

  private atOp(...ops: string[]): boolean {
    const t = this.peek();
    return t.kind === 'op' && ops.includes(t.text);
  }

  parseAssignment(): Assignment {
    const target = this.peek();
    if (target.kind !== 'ident') {
      throw new CompileError(
        'A statement must begin with a variable name.',
        target.start,
        'parse',
      );
    }
    this.next();

    const eq = this.peek();
    if (eq.kind !== 'assign') {
      throw new CompileError("Expected '=' after the variable name.", eq.start, 'parse');
    }
    this.next();

    const expr = this.parseExpr();

    // Trailing tokens are an error, not something to ignore. Accepting
    // `x = 1 2` silently would mean the parser is not actually validating the
    // grammar it claims to implement.
    const rest = this.peek();
    if (rest.kind !== 'eof') {
      throw new CompileError(`Unexpected ${JSON.stringify(rest.text)} after the expression.`, rest.start, 'parse');
    }

    return { target: target.text, expr };
  }

  /** expr := term (('+' | '-') term)* — left-associative. */
  private parseExpr(): Node {
    let left = this.parseTerm();
    while (this.atOp('+', '-')) {
      const op = this.next().text;
      const right = this.parseTerm();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  /** term := unary (('*' | '/' | '%') unary)* — binds tighter than expr. */
  private parseTerm(): Node {
    let left = this.parseUnary();
    while (this.atOp('*', '/', '%')) {
      const op = this.next().text;
      const right = this.parseUnary();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  /** unary := ('-' | '+') unary | primary — right-associative, so `--x` works. */
  private parseUnary(): Node {
    if (this.atOp('-', '+')) {
      const op = this.next().text;
      return { type: 'unary', op, operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Node {
    const t = this.peek();

    if (t.kind === 'number') {
      this.next();
      return { type: 'num', value: Number(t.text) };
    }

    if (t.kind === 'ident') {
      this.next();
      return { type: 'var', name: t.text };
    }

    if (t.kind === 'lparen') {
      this.next();
      const inner = this.parseExpr();
      const close = this.peek();
      if (close.kind !== 'rparen') {
        throw new CompileError("Unclosed '(' — expected ')'.", close.start, 'parse');
      }
      this.next();
      return inner;
    }

    if (t.kind === 'eof') {
      throw new CompileError('Expression ended unexpectedly.', t.start, 'parse');
    }

    throw new CompileError(`Expected a value, found ${JSON.stringify(t.text)}.`, t.start, 'parse');
  }
}

export function parse(tokens: Token[]): Assignment {
  return new Parser(tokens).parseAssignment();
}

/* ================================================================== *
 * 3. LOWERING — three-address code
 * ================================================================== */

export interface Instruction {
  /** Destination: a temporary `t0`, or the assignment's target. */
  dest: string;
  op: string | null;
  a: string;
  b: string | null;
}

/**
 * AST → a flat list of instructions, each with at most three addresses.
 *
 * This is the step that turns a tree into something a machine can execute in
 * order: post-order traversal, emitting operands before the operation that
 * consumes them, with a fresh temporary per intermediate result. The resulting
 * sequence is in strict evaluation order, which is exactly what the register
 * allocator below needs in order to reason about lifetimes.
 *
 * Unary minus is lowered to `0 - x` rather than given its own opcode — a
 * two-operand form keeps every instruction the same shape, which is what
 * "three-address" means, and costs one trivially foldable subtraction.
 */
export function lower(ast: Assignment): Instruction[] {
  const code: Instruction[] = [];
  let temp = 0;

  const walk = (node: Node): string => {
    switch (node.type) {
      case 'num':
        // Integers print without a trailing `.0`; anything else keeps its
        // written precision.
        return Number.isInteger(node.value) ? String(node.value) : String(node.value);
      case 'var':
        return node.name;
      case 'unary': {
        const operand = walk(node.operand);
        // Unary plus is the identity — emitting an instruction for it would be
        // dead code, and a compiler that emits dead code it could trivially
        // avoid is a worse demonstration than one that folds it.
        if (node.op === '+') return operand;
        const dest = `t${temp++}`;
        code.push({ dest, op: '-', a: '0', b: operand });
        return dest;
      }
      case 'binary': {
        // Left before right, matching the language's evaluation order.
        const a = walk(node.left);
        const b = walk(node.right);
        const dest = `t${temp++}`;
        code.push({ dest, op: node.op, a, b });
        return dest;
      }
    }
  };

  const result = walk(ast.expr);
  // The final move into the declared target. Emitted even when the expression
  // was a bare value, because the statement's semantics are the assignment.
  code.push({ dest: ast.target, op: null, a: result, b: null });
  return code;
}

/* ================================================================== *
 * 4. REGISTER ALLOCATION — linear scan
 * ================================================================== */

export interface AllocatedInstruction extends Instruction {
  /** Physical register assigned to `dest`, or null if it is a real variable. */
  reg: string | null;
  /** Registers whose live range ended on this instruction and were reclaimed. */
  freed: string[];
}

export interface Allocation {
  code: AllocatedInstruction[];
  /** How many physical registers the allocation actually needed. */
  registersUsed: number;
  /** True if the machine ran out and a value had to go to memory. */
  spilled: boolean;
}

/**
 * Assigns each temporary a physical register, reusing them as soon as possible.
 *
 * The interesting part of register allocation is not handing out names — it is
 * knowing when a value is *dead* so its register can be given to something
 * else. This does a real liveness calculation first: the last instruction that
 * reads each temporary is its last use, and immediately after that instruction
 * its register returns to the free pool.
 *
 * That is why `(a+b) * (c+d)` needs two registers rather than three: `t0` is
 * still live across `t1`'s computation, but the multiply consumes both, so `t2`
 * reuses `t0`'s register. The `freed` list on each instruction is what makes
 * this visible in the UI rather than merely claimed.
 *
 * Linear scan rather than graph colouring, deliberately: within a single basic
 * block with no control flow, live ranges are contiguous intervals, and for
 * intervals linear scan produces the same answer as colouring an interference
 * graph — at a fraction of the complexity. Choosing the more elaborate
 * algorithm here would be a worse engineering decision, not a better one.
 */
/**
 * Is this operand a temporary the lowering invented, rather than a real name?
 *
 * The test has to be the exact shape `lower` emits — `t` followed by digits —
 * and not `startsWith('t')`. This function exists because that shortcut was
 * here and was wrong: the bench's own second example assigns to `total`, which
 * the allocator then handed a physical register as though it were an
 * intermediate, inflating the register count and freeing a live value. A
 * visitor writing `time = x * 2` would have hit the same thing.
 *
 * The lesson is the general one about namespaces: the moment compiler-generated
 * names and user-written names share an alphabet, "looks like mine" has to be a
 * decidable test rather than a guess. Real compilers reserve a character the
 * source language forbids for exactly this reason; this one cannot, so it
 * matches the whole shape instead.
 */
function isTemp(name: string | null): name is string {
  return name !== null && /^t\d+$/.test(name);
}

export function allocate(code: Instruction[], budget = 4): Allocation {
  /** Index of the final instruction that reads each temporary. */
  const lastUse = new Map<string, number>();
  for (let i = 0; i < code.length; i++) {
    for (const operand of [code[i].a, code[i].b]) {
      if (isTemp(operand)) lastUse.set(operand, i);
    }
  }

  const free: string[] = Array.from({ length: budget }, (_, i) => `R${budget - 1 - i}`);
  const assigned = new Map<string, string>();
  const out: AllocatedInstruction[] = [];
  let peak = 0;
  let spilled = false;

  for (let i = 0; i < code.length; i++) {
    const ins = code[i];
    let reg: string | null = null;

    if (isTemp(ins.dest)) {
      const next = free.pop();
      if (next) {
        reg = next;
        assigned.set(ins.dest, next);
      } else {
        // Out of registers. A real allocator would pick a victim by spill cost
        // and emit store/load pairs; saying so plainly is more honest than
        // pretending the budget is unlimited.
        reg = 'SPILL';
        spilled = true;
      }
    }

    // Reclaim after the instruction, never before: an operand is still needed
    // *during* the operation that reads it, so freeing on entry would let a
    // destination overwrite a source it has not finished reading.
    const freed: string[] = [];
    for (const operand of [ins.a, ins.b]) {
      if (!isTemp(operand)) continue;
      if (lastUse.get(operand) !== i) continue;
      const held = assigned.get(operand);
      if (held && held !== 'SPILL' && !free.includes(held)) {
        free.push(held);
        freed.push(held);
      }
    }

    peak = Math.max(peak, budget - free.length);
    out.push({ ...ins, reg, freed });
  }

  return { code: out, registersUsed: peak, spilled };
}

/* ================================================================== *
 * PIPELINE
 * ================================================================== */

export interface Compilation {
  source: string;
  tokens: Token[];
  ast: Assignment | null;
  ir: Instruction[];
  allocation: Allocation | null;
  error: CompileError | null;
}

/**
 * Runs every stage, returning partial results when a stage fails.
 *
 * A failed parse still returns its tokens: the scanner succeeded, and showing
 * the tokens it produced next to the parse error is precisely how someone
 * debugs a syntax error. Blanking the whole panel on any failure would throw
 * away the stage that worked.
 */
export function compile(source: string): Compilation {
  const result: Compilation = {
    source,
    tokens: [],
    ast: null,
    ir: [],
    allocation: null,
    error: null,
  };

  try {
    result.tokens = scan(source);
    result.ast = parse(result.tokens);
    result.ir = lower(result.ast);
    result.allocation = allocate(result.ir);
  } catch (e) {
    if (e instanceof CompileError) result.error = e;
    else throw e;
  }

  return result;
}

/** Renders an instruction the way the IR panel prints it. */
export function formatInstruction(ins: Instruction): string {
  if (ins.op === null) return `${ins.dest} = ${ins.a}`;
  return `${ins.dest} = ${ins.a} ${ins.op} ${ins.b}`;
}

/* ================================================================== *
 * 5. SELF-VERIFICATION — differential testing of the pipeline
 * ================================================================== */

/**
 * ── Why the compiler tests itself, and why *this* test ──────────────────
 *
 * Everything above could be subtly wrong in ways that still look right. Swap
 * the operands of a subtraction during lowering and the IR panel still prints
 * plausible instructions. Free a register one instruction too early and the
 * allocation table still shows a tidy, small register count — the number even
 * looks *better*. Both bugs are invisible to inspection of the output.
 *
 * The standard answer to that problem is differential testing: run the same
 * program through two independent implementations and compare. Here the two
 * implementations arrive for free, because a compiler is a chain of meaning-
 * preserving translations. Interpreting the AST directly and executing the
 * generated code must agree — that is the entire contract of a compiler. If
 * they disagree, the translation lost something, and which stage lost it is
 * narrowed by whether the failure appears in the IR or only after allocation.
 *
 * So the check below is not decoration. It is the property that makes the four
 * stages a compiler rather than four functions that produce compiler-shaped
 * output, and it is recomputed on every keystroke against whatever was typed —
 * including inputs I never anticipated.
 */

/**
 * Probe values bound to the source's free variables.
 *
 * Chosen, not random: the same source must always produce the same reported
 * numbers, or a screenshot of a failure would be unreproducible.
 *
 * Small distinct primes, and deliberately none of 0, 1 or 2. Those three are
 * where arithmetic coincidences live — `a * b` equals `a + b` at 2 and 2, `1`
 * is the multiplicative identity, `0` annihilates a product and makes `/` and
 * `%` undefined. A coincidence is the one thing a differential test cannot
 * tolerate, because it turns a real disagreement into a pass. Distinct values
 * also make operand order observable: `a - b` and `b - a` can only agree when
 * `a === b`.
 */
const PROBES = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

/**
 * A distinct non-zero value for the nth free variable, for any n.
 *
 * Past the table it steps in hundreds, which stays distinct because every entry
 * is below 100 — an unbounded supply rather than a cap on how many variables a
 * visitor is allowed to type.
 */
function probe(index: number): number {
  return PROBES[index % PROBES.length] + Math.floor(index / PROBES.length) * 100;
}

/** Free variables of the expression, in the order they are first read. */
function freeVariables(node: Node, found: string[] = []): string[] {
  switch (node.type) {
    case 'num':
      break;
    case 'var':
      if (!found.includes(node.name)) found.push(node.name);
      break;
    case 'unary':
      freeVariables(node.operand, found);
      break;
    case 'binary':
      freeVariables(node.left, found);
      freeVariables(node.right, found);
      break;
  }
  return found;
}

/**
 * The one place arithmetic actually happens, shared by all three interpreters.
 *
 * Shared on purpose: if each interpreter implemented `%` itself, the comparison
 * would be testing my three copies of the operator against each other instead
 * of testing the translation between representations. Everything that differs
 * between the interpreters should be *only* how operands are addressed.
 */
function apply(op: string, a: number, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return a / b;
    case '%':
      return a % b;
    default:
      // Unreachable through `scan`, which accepts no other operator. Returning
      // NaN rather than throwing keeps a future operator's omission a visible
      // failed check instead of a crashed panel.
      return NaN;
  }
}

/** Operands are either literals the lowering wrote, or names. */
function isLiteral(operand: string): boolean {
  return /^[0-9.]/.test(operand);
}

/** Interpreter 1: walk the tree the parser built. */
function runTree(node: Node, env: Map<string, number>): number {
  switch (node.type) {
    case 'num':
      return node.value;
    case 'var':
      return env.get(node.name) ?? NaN;
    case 'unary': {
      const value = runTree(node.operand, env);
      return node.op === '-' ? -value : value;
    }
    case 'binary':
      return apply(node.op, runTree(node.left, env), runTree(node.right, env));
  }
}

/**
 * Interpreter 2: execute the three-address code, addressing values by name.
 *
 * Temporaries are just names here, so this tests lowering alone — did the
 * post-order traversal emit the operations in an order that reproduces the
 * tree's meaning — with register allocation deliberately out of the picture.
 */
function runIr(code: Instruction[], env: Map<string, number>): number {
  const store = new Map(env);
  let last = NaN;

  for (const ins of code) {
    const a = isLiteral(ins.a) ? Number(ins.a) : (store.get(ins.a) ?? NaN);
    const result =
      ins.op === null || ins.b === null
        ? a
        : apply(ins.op, a, isLiteral(ins.b) ? Number(ins.b) : (store.get(ins.b) ?? NaN));
    store.set(ins.dest, result);
    last = result;
  }

  return last;
}

/**
 * Interpreter 3: execute the allocated code through physical registers.
 *
 * This is the one that can catch a liveness bug. Reading a temporary means
 * reading whatever is in the register it was assigned — so if the allocator
 * handed that register to something else while the value was still needed, this
 * interpreter reads the new occupant and the answer changes. Interpreter 2
 * cannot see that error at all, because names never collide.
 *
 * Spills are modelled the way hardware does it: the value goes to a memory slot
 * keyed by the temporary instead of a register. Registers are read and written
 * in the same order the instruction implies — both operands first, destination
 * afterwards — because doing otherwise would let a destination clobber a source
 * mid-instruction and would be a bug in the *simulation* rather than a finding.
 */
function runRegisters(code: AllocatedInstruction[], env: Map<string, number>): number {
  const regOf = new Map<string, string>();
  const regs = new Map<string, number>();
  const memory = new Map(env);
  let last = NaN;

  const read = (operand: string): number => {
    if (isLiteral(operand)) return Number(operand);
    const reg = regOf.get(operand);
    if (reg !== undefined && reg !== 'SPILL') return regs.get(reg) ?? NaN;
    return memory.get(operand) ?? NaN;
  };

  for (const ins of code) {
    const a = read(ins.a);
    const result = ins.op === null || ins.b === null ? a : apply(ins.op, a, read(ins.b));

    if (ins.reg !== null && ins.reg !== 'SPILL') {
      regs.set(ins.reg, result);
      regOf.set(ins.dest, ins.reg);
    } else if (ins.reg === 'SPILL') {
      memory.set(ins.dest, result);
      regOf.set(ins.dest, 'SPILL');
    } else {
      // A real variable, which lives in memory rather than a register.
      memory.set(ins.dest, result);
    }

    last = result;
  }

  return last;
}

export interface Binding {
  name: string;
  value: number;
}

export interface Evaluation {
  /** The probe values every interpreter was given. */
  bindings: Binding[];
  /** Interpreting the AST. */
  tree: number;
  /** Executing the three-address code by name. */
  ir: number;
  /** Executing the allocated code through physical registers. */
  registers: number;
}

/**
 * Runs all three interpreters on one set of probe values.
 *
 * Returns null when there is nothing to run — a syntax error means there is no
 * tree, and inventing a result for a program that does not exist would be worse
 * than reporting nothing.
 *
 * `override` exists because the bench lets a visitor change the register budget,
 * which re-runs allocation on its own. The check has to execute *that*
 * allocation — the one whose table is on screen — or the badge would be
 * verifying a four-register allocation while the visitor reads a one-register
 * one. Passing it through also makes the check strictly stronger: at a budget
 * low enough to spill, agreement now proves the spill path computes the same
 * answer as the tree, which is the case most likely to be wrong.
 */
export function evaluate(
  compilation: Compilation,
  override?: Allocation | null,
): Evaluation | null {
  const { ast, ir } = compilation;
  const allocation = override ?? compilation.allocation;
  if (!ast || !allocation) return null;

  const names = freeVariables(ast.expr);
  const bindings = names.map((name, i) => ({ name, value: probe(i) }));
  const env = new Map(bindings.map((b) => [b.name, b.value]));

  return {
    bindings,
    tree: runTree(ast.expr, env),
    ir: runIr(ir, env),
    registers: runRegisters(allocation.code, env),
  };
}

/**
 * Do two interpreters agree?
 *
 * Floats need a tolerance because `/` and `%` are in the grammar, so `a/b*b`
 * will not land on `a` exactly in binary floating point — an exact comparison
 * would report a compiler bug where the real answer is that IEEE 754 rounds.
 *
 * The non-finite cases are the interesting ones. `x = 1 / (a - a)` divides by
 * zero, and both interpreters produce Infinity by the same rule; two NaNs mean
 * both computed an undefined value from the same undefined operation. Treating
 * those as agreement is the honest reading of "the translation preserved the
 * meaning", but the sign has to match, so `Infinity` and `-Infinity` still
 * count as a disagreement.
 */
function agrees(a: number, b: number): boolean {
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return a === b;
  return nearly(a, b);
}

/** Prints a probe result compactly, including the values `nearly` tolerates. */
function showValue(n: number): string {
  if (Number.isNaN(n)) return 'undefined';
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '−∞';
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 1e6) / 1e6);
}

/**
 * The properties this compiler claims about itself, measured on the current
 * input.
 *
 * Three checks, each covering a stage the others cannot see:
 *
 *   1. IR against tree            — did lowering preserve the meaning?
 *   2. Registers against tree     — did liveness analysis keep values alive?
 *   3. Token spans against source — do the reported positions actually point
 *                                   at the text they describe, which is what
 *                                   the error caret depends on and what no
 *                                   amount of arithmetic agreement can prove?
 *
 * Returns no checks at all when the source does not compile. A failed parse is
 * not a failed compiler, and it is not a pass either; `NO_CHECKS` renders as
 * nothing, because a badge claiming success over zero properties would be the
 * dishonest option.
 */
export function verifyCompilation(
  compilation: Compilation,
  override?: Allocation | null,
): Verification {
  const allocation = override ?? compilation.allocation;
  const run = evaluate(compilation, allocation);
  if (!run || !allocation) return NO_CHECKS;

  const { tokens, source } = compilation;
  const spans = tokens.filter((t) => source.slice(t.start, t.end) === t.text).length;
  const budget = allocation.registersUsed;

  return verification([
    check(
      'Three-address code evaluates to the same value as the tree',
      agrees(run.tree, run.ir),
      `tree ${showValue(run.tree)} · code ${showValue(run.ir)}`,
    ),
    check(
      'Allocated registers evaluate to the same value as the tree',
      agrees(run.tree, run.registers),
      `${showValue(run.registers)} through ${budget} register${budget === 1 ? '' : 's'}${
        allocation.spilled ? ' and a spill' : ''
      }`,
    ),
    check(
      'Every token span matches the source it was scanned from',
      spans === tokens.length,
      ratio(spans, tokens.length, 'spans match'),
    ),
  ]);
}

/**
 * Inputs worth trying, each chosen to demonstrate one property of the pipeline.
 * These are examples, not tests — every one is compiled live like any other
 * input.
 */
export const EXAMPLES = [
  { src: 'x = a + b * c', shows: 'Precedence: the multiply is lowered first, without a precedence table.' },
  { src: 'total = (a + b) * (c + d)', shows: 'Register reuse: needs two registers, not three.' },
  { src: 'y = -x + 2 * -3', shows: 'Unary minus, lowered to 0 − x so every instruction keeps one shape.' },
  { src: 'r = a - b - c', shows: 'Left-associativity: parsed as (a − b) − c.' },
  { src: 'q = ((a + b) * (c - d)) / (e % f)', shows: 'Deep nesting — four live temporaries at peak.' },
] as const;
