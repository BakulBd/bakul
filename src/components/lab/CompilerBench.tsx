'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  EXAMPLES,
  allocate,
  compile,
  evaluate,
  formatInstruction,
  verifyCompilation,
  type Node,
  type Token,
} from '@/lib/lab/compiler';
import { benchFragment, benchPath } from '@/lib/lab/catalogue';
import { haptic } from '@/lib/haptics';
import { Bay, CopyButton, num, Slider, Stat, TableWrap, VerifyBadge } from './Controls';

/**
 * COMPILER BENCH
 *
 * Four stages of a real compiler front end, each one's output shown as the next
 * one's input: source text -> tokens -> AST -> three-address IR -> register
 * allocation. Every panel is derived from the same `compile()` call, so the
 * stages cannot disagree with each other about what the program is.
 *
 * ── Why this is the honest version of "watch a compiler work" ────────────
 * There is no animation and no fake progress. `lib/lab/compiler.ts` is a
 * hand-written scanner, a recursive-descent parser, a lowering pass, and a
 * linear-scan register allocator, and what is drawn below is their actual
 * output. Type a malformed expression and the error carries the source position
 * the scanner or parser stopped at, which is why the caret under the input can
 * point at the offending column instead of saying "syntax error".
 *
 * ── Why the input is uncontrolled-ish and deferred ──────────────────────
 * The whole pipeline runs on every keystroke. That is fine — it is a few
 * hundred microseconds on an expression this size — but the four panels it
 * feeds are a lot of DOM to reconcile, and doing that synchronously inside the
 * keystroke is what makes a text field feel sticky on a low-end phone.
 * `useDeferredValue` lets React commit the character immediately and re-render
 * the panels at a lower priority, so typing never waits for the visualisation.
 * The caret in the field is never behind, because the field reads `source`
 * while everything expensive reads `deferred`.
 */

/**
 * The register budget.
 *
 * Four is the default in `allocate()` and is the interesting number: it is
 * enough for every example except the deepest, which is what makes spilling
 * demonstrable rather than theoretical. The slider exposes 1..8 so a visitor
 * can find the exact budget at which their own expression starts spilling.
 */
const MIN_REGS = 1;
const MAX_REGS = 8;

/** Defaults, in one place, because the URL writer deletes anything equal to them. */
const BENCH_ID = 'compiler';
const DEFAULT_SRC = EXAMPLES[0].src;
const DEFAULT_REGS = 4;

/**
 * The longest source a link may carry.
 *
 * Not a limit on what the compiler accepts — the field is unbounded. It only
 * caps what gets written into the address bar, because a query string long
 * enough to be truncated by a chat client produces a link that silently
 * compiles the wrong program, and half a shared expression is worse than none.
 */
const MAX_LINK_SRC = 120;

/** Token kinds, coloured by role rather than by syntax category. */
const TOKEN_TONE: Record<Token['kind'], string> = {
  ident: 'ident',
  number: 'number',
  op: 'op',
  assign: 'op',
  lparen: 'punct',
  rparen: 'punct',
  eof: 'eof',
};

/* ------------------------------------------------------------------ *
 * AST
 * ------------------------------------------------------------------ */

/**
 * The tree, as a nested list.
 *
 * `<ul>`/`<li>` rather than divs or an SVG diagram, because a tree *is* a
 * nested list and saying so gives a screen reader the structure for free —
 * depth, sibling counts and all. The connector lines are drawn with CSS
 * pseudo-elements on the list items, so the visual tree and the semantic tree
 * are the same markup rather than two things kept in sync.
 */
function AstNode({ node, label }: { node: Node; label?: string }) {
  const children: { node: Node; label: string }[] =
    node.type === 'binary'
      ? [
          { node: node.left, label: 'left' },
          { node: node.right, label: 'right' },
        ]
      : node.type === 'unary'
        ? [{ node: node.operand, label: 'operand' }]
        : [];

  const text =
    node.type === 'num'
      ? String(node.value)
      : node.type === 'var'
        ? node.name
        : node.op;

  return (
    <li className="lab-ast__li">
      <span className={`lab-ast__node is-${node.type}`}>
        <span className="lab-ast__text">{text}</span>
        <span className="lab-ast__type">{node.type}</span>
      </span>
      {label && <span className="sr-only">{label}</span>}
      {children.length > 0 && (
        <ul className="lab-ast__ul">
          {children.map((c, i) => (
            <AstNode key={i} node={c.node} label={c.label} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ *
 * BENCH
 * ------------------------------------------------------------------ */

export function CompilerBench() {
  const [source, setSource] = useState<string>(DEFAULT_SRC);
  const [budget, setBudget] = useState(DEFAULT_REGS);

  /*
   * ── Deep links ────────────────────────────────────────────────────────
   *
   * Read once after mount, never during render. The page is statically
   * generated, and reading the query string while rendering would either force a
   * `<Suspense>` boundary around the whole bench or hydrate with a different
   * expression than the server wrote. An effect runs after the first paint,
   * which is the correct time to apply something only the browser knows.
   *
   * The source is validated by *compiling it*, which is the only definition of
   * valid this bench has. A link carrying a syntax error is still honoured, on
   * purpose: pointing at a specific error message and column is one of the more
   * useful things to share about a compiler. What gets rejected is the case
   * where the link is not really about this bench — an empty `?src=`, or one
   * longer than the writer would ever have produced.
   */
  const [linked, setLinked] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const src = params.get('src');
    if (src !== null) {
      const trimmed = src.trim();
      if (trimmed.length > 0 && trimmed.length <= MAX_LINK_SRC) setSource(trimmed);
    }

    const regs = Number(params.get('regs'));
    if (Number.isInteger(regs) && regs >= MIN_REGS && regs <= MAX_REGS) setBudget(regs);

    setLinked(true);
  }, []);

  /*
   * ── Writing the link back ─────────────────────────────────────────────
   *
   * Edits the URL that is already there rather than building a new one, so
   * `?bench=compiler` — which belongs to the shell, not to this bench — survives
   * untouched. Values equal to the default are deleted rather than written,
   * which keeps the address bar clean for the state a visitor arrives in.
   *
   * Gated on `linked` so it cannot run before the mount effect has read the
   * incoming link and immediately overwrite it with the defaults. Compares the
   * finished string first, so it writes nothing when nothing changed — otherwise
   * every keystroke would push an identical entry through `history`.
   */
  useEffect(() => {
    if (!linked) return;

    const url = new URL(window.location.href);
    const trimmed = source.trim();

    if (trimmed === DEFAULT_SRC || trimmed.length === 0 || trimmed.length > MAX_LINK_SRC) {
      url.searchParams.delete('src');
    } else {
      url.searchParams.set('src', trimmed);
    }

    if (budget === DEFAULT_REGS) url.searchParams.delete('regs');
    else url.searchParams.set('regs', String(budget));

    const next = `${url.pathname}${url.search}${url.hash}`;
    const now = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== now) window.history.replaceState(null, '', next);
  }, [linked, source, budget]);

  /*
   * The origin, read in an effect for the same reason as above: it does not
   * exist during a static build, so it cannot be part of the first render. The
   * copy button is simply absent until it is known, which is honest — a copy
   * button that yields a relative path would be broken rather than incomplete.
   */
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  const trimmed = source.trim();
  const shareable = trimmed.length > 0 && trimmed.length <= MAX_LINK_SRC;
  const permalink = useMemo(() => {
    const path = benchPath(BENCH_ID);
    const q = new URLSearchParams();
    if (trimmed !== DEFAULT_SRC) q.set('src', trimmed);
    if (budget !== DEFAULT_REGS) q.set('regs', String(budget));
    const query = q.toString();
    const joined = query ? `${path}${path.includes('?') ? '&' : '?'}${query}` : path;
    return `${origin}${joined}#${benchFragment(BENCH_ID)}`;
  }, [origin, trimmed, budget]);

  const reset = useCallback(() => {
    setSource(DEFAULT_SRC);
    setBudget(DEFAULT_REGS);
    haptic('press');
  }, []);

  /*
   * The panels read the deferred value; the input reads `source`.
   *
   * See the note at the top of the file: this is what keeps typing responsive
   * while four panels' worth of DOM re-renders behind it.
   */
  const deferred = useDeferredValue(source);
  const result = useMemo(() => compile(deferred), [deferred]);

  /*
   * Allocation is re-run separately from `compile()`.
   *
   * `compile()` already allocates with the default budget, but the slider needs
   * a different one, and re-running the whole front end to change a register
   * count would be re-scanning and re-parsing text that did not change.
   * Allocation is a pure function of the IR, so it can be re-run alone.
   *
   * Reads `result.ir` rather than keeping its own copy: if the source did not
   * compile there is no IR, and the panel correctly has nothing to show.
   */
  const allocation = useMemo(() => {
    if (result.error || result.ir.length === 0) return null;
    return allocate(result.ir, budget);
  }, [result, budget]);

  const error = result.error;

  /*
   * ── The self-check ────────────────────────────────────────────────────
   *
   * Both of these pass `allocation` explicitly rather than letting the engine
   * fall back to the one `compile()` produced, because the slider means the
   * allocation on screen is usually *not* that one. A badge that verified the
   * default four-register allocation while the table showed a one-register
   * spilling allocation would be checking something the visitor cannot see —
   * which is the exact failure mode these checks exist to rule out.
   */
  const verification = useMemo(
    () => verifyCompilation(result, allocation),
    [result, allocation],
  );
  const run = useMemo(() => evaluate(result, allocation), [result, allocation]);

  /** Column the caret sits under, clamped into the string. */
  const caret = error ? Math.min(error.position, deferred.length) : -1;

  return (
    <div className="lab-bench">
      {/* ---------------- source ---------------- */}
      <Bay
        n="01"
        title="Source"
        note="One assignment. Identifiers, integers, + − × ÷ %, parentheses, unary minus."
        className="lab-bay--narrow"
      >
        <label className="lab-field__label" htmlFor="lab-src">
          Expression
        </label>
        <input
          id="lab-src"
          className="field lab-src"
          value={source}
          onChange={(e) => setSource(e.currentTarget.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          /* `text` with these off, not a `code` input — there is no such type,
             and a numeric keyboard would hide the operators on a phone. */
          inputMode="text"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'lab-src-error' : undefined}
        />

        {/*
          The caret line.

          Rendered in the same monospace face at the same size as the input, so
          column N in the string is column N on screen. This is the payoff for
          the scanner and parser carrying a source position on every error.
        */}
        {error && (
          <pre className="lab-caret" aria-hidden="true">
            {' '.repeat(Math.max(0, caret))}^
          </pre>
        )}

        {error ? (
          <p className="lab-error" id="lab-src-error" role="status">
            <span className="lab-error__stage">{error.stage}</span>
            {error.message}
          </p>
        ) : (
          <p className="lab-ok" role="status">
            Compiled — {num(result.tokens.length - 1)} tokens,{' '}
            {num(result.ir.length)} instructions
          </p>
        )}

        <div className="lab-seed">
          <div className="lab-seed__acts">
            <button type="button" className="lab-shuffle" onClick={reset}>
              Reset
            </button>
            {origin && shareable && (
              <CopyButton value={permalink} label="Copy link" done="Link copied" />
            )}
          </div>
          <p className="lab-note">
            {shareable
              ? 'The address bar carries this expression and register budget, so the link reproduces exactly what is on screen — including a syntax error, if that is the interesting part.'
              : `Expressions longer than ${MAX_LINK_SRC} characters are not written to the address bar, because a link that gets truncated in transit would compile something other than what was shared.`}
          </p>
        </div>

        <div className="lab-field">
          <span className="lab-field__label">Examples</span>
          <div className="lab-examples">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.src}
                type="button"
                className={`lab-example${ex.src === source ? ' is-on' : ''}`}
                onClick={() => {
                  setSource(ex.src);
                  haptic('press');
                }}
              >
                <code className="lab-example__src">{ex.src}</code>
                <span className="lab-example__shows">{ex.shows}</span>
              </button>
            ))}
          </div>
        </div>
      </Bay>

      {/* ---------------- tokens ---------------- */}
      <Bay
        n="02"
        title="Scan"
        note="The scanner is a single pass over the characters. Each token keeps its source offset, which is what lets an error point at a column."
        className="lab-bay--narrow"
      >
        <ol className="lab-tokens">
          {result.tokens
            /* EOF is real and the parser depends on it, but it has no text and
               rendering an empty chip would just look like a bug. */
            .filter((t) => t.kind !== 'eof')
            .map((t, i) => (
              <li key={i} className={`lab-token is-${TOKEN_TONE[t.kind]}`}>
                <code className="lab-token__text">{t.text}</code>
                <span className="lab-token__kind">{t.kind}</span>
              </li>
            ))}
        </ol>
        {result.tokens.length <= 1 && <p className="lab-empty">Nothing to scan.</p>}
      </Bay>

      {/* ---------------- ast ---------------- */}
      <Bay
        n="03"
        title="Parse"
        note="Recursive descent. Precedence and left-associativity are properties of the call structure, not of a table the parser consults."
      >
        {result.ast ? (
          <>
            <p className="lab-ast__target">
              <span className="lab-field__label">Assigns to</span>
              <code>{result.ast.target}</code>
            </p>
            <ul className="lab-ast">
              <AstNode node={result.ast.expr} />
            </ul>
          </>
        ) : (
          <p className="lab-empty">
            {error ? 'No tree — the input did not parse.' : 'Nothing to parse.'}
          </p>
        )}
      </Bay>

      {/* ---------------- ir + allocation ---------------- */}
      <Bay
        n="04"
        title="Lower & allocate"
        note="The tree is flattened to three-address instructions, then a linear scan assigns physical registers and reclaims each one as soon as its last reader has run."
      >
        <Slider
          label="Register budget"
          value={budget}
          min={MIN_REGS}
          max={MAX_REGS}
          onChange={setBudget}
          format={(v) => `${v} register${v === 1 ? '' : 's'}`}
          hint="Lower this until the allocator runs out. A spill is a value pushed to memory because no register was free — the reason this pass exists."
        />

        {allocation ? (
          <>
            <dl className="lab-stats">
              <Stat k="Instructions" v={num(allocation.code.length)} />
              <Stat k="Registers used" v={num(allocation.registersUsed)} tone="cyan" />
              <Stat k="Budget" v={num(budget)} />
              <Stat
                k="Spilled"
                v={allocation.spilled ? 'Yes' : 'No'}
                tone={allocation.spilled ? 'amber' : undefined}
              />
            </dl>

            {allocation.spilled && (
              <p className="lab-warn" role="status">
                This expression needs more than {budget} register
                {budget === 1 ? '' : 's'} at its peak, so a live value had to go to
                memory. Raise the budget to see the spill disappear.
              </p>
            )}

            <TableWrap>
              <table className="lab-table lab-table--ir">
                <caption className="sr-only">
                  Three-address instructions with assigned registers
                </caption>
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Instruction</th>
                    <th scope="col">Register</th>
                    <th scope="col">Freed</th>
                  </tr>
                </thead>
                <tbody>
                  {allocation.code.map((ins, i) => (
                    <tr key={i}>
                      <td className="is-mono lab-ir__n">{i}</td>
                      <td className="is-mono lab-ir__code">{formatInstruction(ins)}</td>
                      <td className="is-mono is-cyan">{ins.reg ?? '—'}</td>
                      <td className="is-mono is-amber">
                        {ins.freed.length > 0 ? ins.freed.join(' ') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>

            <p className="lab-note">
              The <strong>Freed</strong> column is the interesting one: a register reappears
              there the instruction its last reader runs, and the next instruction that needs
              one takes it back. That reuse is why{' '}
              <code>total = (a + b) * (c + d)</code> needs two registers rather than three.
            </p>

            {/*
              ── Proof, not assertion ──────────────────────────────────────
              Everything above this line is the compiler describing its own
              work. This is the part that could contradict it: the same
              expression is evaluated three ways — by walking the tree, by
              executing the instructions by name, and by executing them through
              the physical registers assigned in the table above — and the badge
              reports whether they agreed. A liveness bug in the allocator shows
              up here as a failed check while every panel above still looks
              perfectly reasonable.
            */}
            {run && (
              <div className="lab-probe">
                <p className="lab-probe__head">
                  <span className="lab-field__label">Executed with</span>
                  {run.bindings.length > 0 ? (
                    <span className="lab-probe__env">
                      {run.bindings.map((b) => (
                        <code key={b.name} className="lab-probe__bind">
                          {b.name} = {num(b.value)}
                        </code>
                      ))}
                    </span>
                  ) : (
                    <span className="lab-probe__env">
                      <code className="lab-probe__bind">no variables</code>
                    </span>
                  )}
                </p>
                <VerifyBadge verification={verification} label="Pipeline properties" />
                <p className="lab-note">
                  Fixed small primes, never 0, 1 or 2 — those are where arithmetic
                  coincidences hide, and a coincidence would turn a real disagreement into
                  a pass. Distinct values also make operand order observable, since{' '}
                  <code>a − b</code> and <code>b − a</code> can only agree when the two are
                  equal.
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="lab-empty">
            {error ? 'Nothing to lower — fix the expression above.' : 'Nothing to lower.'}
          </p>
        )}
      </Bay>
    </div>
  );
}
