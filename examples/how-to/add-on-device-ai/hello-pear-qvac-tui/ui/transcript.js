// Transcript rendering — conversation entries in, styled and wrapped lines out.
//
// Pure functions: nothing here reads app state, it all arrives in `opts`. You
// do not need this file to understand how the app works — only to change how
// the transcript looks. ui/app.js is the one to read.
const { style } = require('bare-tui')

// Word-wrap plain text to a column width. Measures visible cells, so it stays
// correct once the text has color in it. Never use .length or .slice on a
// styled string.
function wrap(text, w) {
  const out = []

  for (const para of String(text).split('\n')) {
    if (para === '') {
      out.push('')
      continue
    }

    let line = ''
    for (const word of para.split(/\s+/)) {
      if (!word) continue
      if (line && style.width(line) + 1 + style.width(word) > w) {
        out.push(line)
        line = word
      } else {
        line = line ? line + ' ' + word : word
      }
    }
    out.push(line)
  }

  return out
}

// Lines for one entry. `opts` is { width, accent, showThinking, ctxSize,
// spinner } — everything outside the entry that changes how it renders.
//
// Wrapping is the expensive part of a frame and a thinking model emits on the
// order of a thousand deltas per answer, so re-wrapping the whole transcript
// each time is quadratic in conversation length. Finished entries are wrapped
// once and cached against a signature of everything that affects them; the
// live entry is never cached, because its spinner animates.
//
// Add a field that changes how an entry looks, and add it to `sig` too — or
// the entry will keep showing its stale version.
function entryLines(e, opts, live) {
  if (live) return buildEntry(e, opts)

  const sig = [
    opts.width,
    opts.accent,
    opts.showThinking ? 1 : 0,
    opts.ctxSize,
    e.role,
    e.text.length,
    e.thinking ? e.thinking.length : 0,
    e.thoughtMs || 0,
    e.interrupted ? 1 : 0,
    e.truncated ? 1 : 0,
    e.color || ''
  ].join('|')

  if (e._sig !== sig) {
    e._lines = buildEntry(e, opts)
    e._sig = sig
  }

  return e._lines
}

function buildEntry(e, opts) {
  const w = opts.width
  const out = []
  const push = (s) => out.push(s)

  if (e.role === 'user') {
    const lines = wrap(e.text, w - 2)
    const mark = style().bold(true).foreground(opts.accent).render('❯')
    push(
      mark +
        ' ' +
        style()
          .bold(true)
          .render(lines[0] || '')
    )
    for (const l of lines.slice(1)) push('  ' + l)
    return out
  }

  if (e.role === 'system') {
    for (const l of wrap(e.text, w)) {
      push(
        style()
          .faint(true)
          .foreground(e.color || null)
          .render(l)
      )
    }
    return out
  }

  // assistant
  renderThinking(e, push, opts)

  if (!e.text && !e.thinking) {
    push(
      style().foreground(opts.accent).render(opts.spinner) +
        ' ' +
        style().italic(true).faint(true).render('thinking…')
    )
  } else if (e.text) {
    for (const l of wrap(e.text, w)) push(l)
  }

  if (e.interrupted) push(style().foreground('red').render('⎚ interrupted'))

  if (e.truncated) {
    push(
      style()
        .foreground('yellow')
        .render(`⚠ stopped at the ${opts.ctxSize || ''} token context limit`) +
        style().faint(true).render(' — raise --ctx, or start a new question')
    )
  }

  return out
}

// Reasoning streams live while the model works, then collapses to one line
// once the answer starts. ctrl+t expands it again.
function renderThinking(e, push, opts) {
  if (!e.thinking) return

  const streaming = !e.text
  if (streaming || opts.showThinking) {
    const head = streaming
      ? style().foreground(opts.accent).render(opts.spinner)
      : style().faint(true).render('✻')
    push(head + ' ' + style().italic(true).faint(true).render('thinking'))
    for (const l of wrap(e.thinking, opts.width - 2)) push('  ' + style().faint(true).render(l))
    if (!streaming) push('')
    return
  }

  const took = e.thoughtMs ? ` for ${(e.thoughtMs / 1000).toFixed(1)}s` : ''
  push(style().faint(true).render(`✻ thought${took} · ctrl+t to show`))
}

module.exports = { wrap, entryLines }
