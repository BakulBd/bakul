'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMachine } from '@/store/machine';
import { sections } from '@/lib/data/sections';
import { profile } from '@/lib/data/profile';
import { scrollToSection } from '@/hooks/useScrollEngine';
import { audio } from '@/lib/audio/engine';

/**
 * Cmd/Ctrl + K quick navigation (§5).
 *
 * Also the entry point for the debug Easter egg: typing `sudo override` here
 * triggers the kernel panic. That keeps the egg discoverable by someone who
 * would think to try it, without exposing it to a casual visitor.
 */

interface Command {
  id: string;
  label: string;
  hint: string;
  run: () => void;
}

export function CommandPalette() {
  const open = useMachine((s) => s.paletteOpen);
  const setOpen = useMachine((s) => s.setPaletteOpen);
  const setDebug = useMachine((s) => s.setDebug);
  const toggleAudio = useMachine((s) => s.toggleAudio);
  const resetSystem = useMachine((s) => s.resetSystem);
  const audioEnabled = useMachine((s) => s.audioEnabled);

  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const commands = useMemo<Command[]>(
    () => [
      ...sections.map((s) => ({
        id: `goto-${s.id}`,
        label: `Go to ${s.label}`,
        hint: s.hint,
        run: () => scrollToSection(s.id),
      })),
      {
        id: 'cv',
        label: 'Download CV',
        hint: 'PDF résumé',
        run: () => window.open(profile.contact.cv, '_blank'),
      },
      {
        id: 'github',
        label: 'Open GitHub',
        hint: profile.contact.githubHandle,
        run: () => window.open(profile.contact.github, '_blank', 'noopener'),
      },
      {
        id: 'linkedin',
        label: 'Open LinkedIn',
        hint: profile.contact.linkedinHandle,
        run: () => window.open(profile.contact.linkedin, '_blank', 'noopener'),
      },
      {
        id: 'email',
        label: 'Send email',
        hint: profile.contact.email,
        run: () => {
          window.location.href = `mailto:${profile.contact.email}`;
        },
      },
      {
        id: 'audio',
        label: audioEnabled ? 'Disable sound' : 'Enable sound',
        hint: 'Procedural machine audio',
        // Resume the AudioContext synchronously in this same click handler,
        // not via the SystemControls effect alone — WebKit/iOS requires the
        // gesture and the resume to share a call stack (see SystemControls).
        run: () => {
          audio.setEnabled(!audioEnabled);
          toggleAudio();
        },
      },
      {
        id: 'reset',
        label: 'Reset system',
        hint: 'Restore all parameters to defaults',
        run: resetSystem,
      },
    ],
    [audioEnabled, toggleAudio, resetSystem],
  );

  const isOverride = query.trim().toLowerCase() === 'sudo override';

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q),
    );
  }, [commands, query]);

  /* ---- Global shortcut ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useMachine.getState().paletteOpen);
      }
      if (e.key === 'Escape' && useMachine.getState().paletteOpen) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  /* ---- Focus management ---- */
  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement;
      setQuery('');
      setIndex(0);
      // Wait a frame so the input exists before we reach for it.
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      restoreFocus.current?.focus?.();
    }
  }, [open]);

  if (!open) return null;

  const execute = (cmd: Command) => {
    setOpen(false);
    cmd.run();
  };

  const triggerOverride = () => {
    setOpen(false);
    // The glitch sound plays from DebugConsole's own entry effect, which
    // fires for every path into debug mode — this only needs to flip the
    // switch, not duplicate the cue.
    setDebug(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => (i + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => (i - 1 + Math.max(1, results.length)) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOverride) triggerOverride();
      else if (results[index]) execute(results[index]);
    }
  };

  return (
    <div
      className="no-print fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: 'rgba(9,10,15,0.82)', backdropFilter: 'blur(6px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick navigation"
        className="panel w-full max-w-[560px]"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search sections and actions…"
          aria-label="Search sections and actions"
          aria-controls="palette-results"
          spellCheck={false}
          autoComplete="off"
          className="w-full border-0 border-b border-[#24272f] bg-transparent px-5 py-4 font-[family-name:var(--font-fira)] text-sm text-[color:var(--color-ceramic)] outline-none placeholder:text-[color:var(--color-ash-dim)]"
        />

        {isOverride ? (
          <div className="p-5">
            <button
              type="button"
              onClick={triggerOverride}
              className="btn w-full justify-center"
              style={{ borderColor: 'var(--color-alert)', color: 'var(--color-alert)' }}
            >
              ⚠ Execute debug override
            </button>
            <p className="t-label mt-3 normal-case tracking-normal">
              Enters maintenance mode. Everything is reversible.
            </p>
          </div>
        ) : (
          <ul id="palette-results" role="listbox" className="m-0 max-h-[46vh] list-none overflow-y-auto p-2">
            {results.length === 0 && (
              <li className="t-label px-3 py-4">No matches</li>
            )}
            {results.map((cmd, i) => (
              <li key={cmd.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === index}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => execute(cmd)}
                  className="flex w-full items-center justify-between gap-4 px-3 py-2.5 text-left"
                  style={{
                    background: i === index ? 'rgba(36,39,47,0.9)' : 'transparent',
                    borderLeft: `2px solid ${i === index ? 'var(--color-cyan)' : 'transparent'}`,
                  }}
                >
                  <span
                    className="t-mono text-xs"
                    style={{ color: i === index ? 'var(--color-cyan)' : 'var(--color-ceramic)' }}
                  >
                    {cmd.label}
                  </span>
                  <span className="t-label shrink-0 normal-case tracking-normal">{cmd.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-[#24272f] px-5 py-3">
          <span className="t-label">↑ ↓ navigate · ↵ select · esc close</span>
          <span className="t-label">{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
