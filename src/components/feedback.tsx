'use client';

import { useEffect, useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { sendGTMEvent } from '@next/third-parties/google';
import { cn } from '@/lib/cn';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';

type Vote = 'yes' | 'no';

function voteKey(pageUrl: string) {
  return `pear-docs:feedback:${pageUrl}`;
}

/**
 * "Was this helpful?" — fires a GTM `dataLayer` event (`doc_feedback`, see
 * GTM_ID in src/app/layout.tsx) rather than persisting anywhere server-side:
 * this is a static export (`output: 'export'`) with no API routes to write
 * to. `localStorage` only remembers that *this browser* already voted on
 * *this page*, so a refresh doesn't re-offer the buttons or double-fire the
 * event; it is not read back anywhere, so a cleared/private-mode browser
 * just gets asked again — harmless.
 */
export function PageFeedback({ pageUrl }: { pageUrl: string }) {
  const [vote, setVote] = useState<Vote | null>(null);

  // Re-sync on mount and on `storage` events, so a vote cast in another tab
  // (same page open twice) is reflected here too — same pattern as
  // DocsVersionProvider's `popstate` re-sync (src/components/version/index.tsx).
  useEffect(() => {
    const sync = () => {
      try {
        const stored = window.localStorage.getItem(voteKey(pageUrl));
        setVote(stored === 'yes' || stored === 'no' ? stored : null);
      } catch {
        // localStorage unavailable (private mode, disabled storage) — non-fatal.
      }
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [pageUrl]);

  function cast(value: Vote) {
    if (vote) return;
    setVote(value);
    try {
      window.localStorage.setItem(voteKey(pageUrl), value);
    } catch {
      // Non-fatal — the vote still fires below, it just may be re-askable.
    }
    sendGTMEvent({
      event: 'doc_feedback',
      doc_feedback_value: value,
      doc_feedback_page: pageUrl,
    });
  }

  if (vote) {
    return (
      <p className="text-sm text-fd-muted-foreground" aria-live="polite">
        Thanks for the feedback!
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-fd-muted-foreground">
      <span>Was this helpful?</span>
      <button
        type="button"
        aria-label="Yes, this page was helpful"
        onClick={() => cast('yes')}
        className={cn(buttonVariants({ color: 'ghost', size: 'icon-sm' }))}
      >
        <ThumbsUp className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="No, this page was not helpful"
        onClick={() => cast('no')}
        className={cn(buttonVariants({ color: 'ghost', size: 'icon-sm' }))}
      >
        <ThumbsDown className="size-3.5" />
      </button>
    </div>
  );
}
