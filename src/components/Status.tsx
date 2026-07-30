import type { ReactNode } from 'react';

/**
 * API stability badge used at the top of reference pages (and inline in tables).
 * Replaces the hand-copied `<mark style={{…}}>` markup so the palette lives in
 * one place. The inline styles intentionally match the previous markup verbatim,
 * so rendering is unchanged; only the duplication is gone.
 */
const COLORS = {
  stable: '#7dde9a',
  unstable: '#ff4242',
  experimental: '#8484ff',
  deprecated: '#f0e57a',
  removed: '#ff4242',
  upcoming: '#f0d264',
} as const;

export type StatusLevel = keyof typeof COLORS;

export function Status({ level, children }: { level: StatusLevel; children?: ReactNode }) {
  return (
    <mark
      style={{
        backgroundColor: COLORS[level],
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.85em',
        fontWeight: 500,
      }}
    >
      {children ?? level}
    </mark>
  );
}
