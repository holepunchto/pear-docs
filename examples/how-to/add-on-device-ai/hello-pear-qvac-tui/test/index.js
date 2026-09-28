const { test } = require('brittle')
const { PassThrough, Writable } = require('bare-stream')
const { Program, style } = require('bare-tui')
const { App } = require('../ui/app.js')
const { wrap } = require('../ui/transcript.js')

// A stand-in for lib/inference.js: records what the UI asked for and lets the
// test push tokens back. No worker, no model, no GPU.
function fakeInference() {
  const calls = { asked: [], cancelled: [] }
  return {
    calls,
    ask(history) {
      calls.asked.push(history)
      return calls.asked.length
    },
    cancel(id) {
      calls.cancelled.push(id)
    }
  }
}

function drive(app, msgs) {
  for (const msg of msgs) {
    const [next, cmd] = app.update(msg)
    app = next
    if (typeof cmd === 'function') cmd() // run the Cmd the way the Program would
  }
  return app
}

const resize = { type: 'resize', width: 80, height: 24 }
const keyMsg = (name) => ({
  type: 'key',
  name,
  sequence: name.length === 1 ? name : '',
  is: (...n) => n.includes(name)
})
const screen = (app) => style.stripAnsi(app.view())

test('starts in loading and shows download progress', (t) => {
  const app = drive(new App({ inference: fakeInference() }), [
    resize,
    { type: 'qvac.progress', percentage: 42 }
  ])

  t.is(app.phase, 'loading')
  t.ok(screen(app).includes('loading'), 'header reports loading')
  t.ok(screen(app).includes('42%'), 'progress bar renders the percentage')
})

test('becomes ready once the model loads', (t) => {
  const app = drive(new App({ inference: fakeInference() }), [
    resize,
    { type: 'qvac.loaded', model: 'LLAMA_3_2_1B_INST_Q4_0' }
  ])

  t.is(app.phase, 'idle')
  t.ok(app.input.focused, 'input takes focus')
  t.ok(screen(app).includes('ready'), 'header reports ready')
})

test('submitting asks the worker and streams the answer back', (t) => {
  const inference = fakeInference()
  let app = new App({ inference })

  app = drive(app, [resize, { type: 'qvac.loaded', model: 'test-model' }])
  app.input.setValue('why is the sky blue')
  app = drive(app, [keyMsg('enter')])

  t.is(app.phase, 'busy', 'goes busy on submit')
  t.is(inference.calls.asked.length, 1, 'asked the worker exactly once')
  t.alike(
    inference.calls.asked[0],
    [{ role: 'user', content: 'why is the sky blue' }],
    'sent the conversation as history'
  )

  const id = app.askId
  app = drive(app, [
    { type: 'qvac.delta', id, text: 'Rayleigh ' },
    { type: 'qvac.delta', id, text: 'scattering.' },
    { type: 'qvac.end', id }
  ])

  t.is(app.phase, 'idle', 'returns to idle when the answer ends')
  t.ok(screen(app).includes('Rayleigh scattering.'), 'answer is in the transcript')
})

test('late deltas from a superseded answer are ignored', (t) => {
  let app = new App({ inference: fakeInference() })
  app = drive(app, [resize, { type: 'qvac.loaded', model: 'test-model' }])
  app.input.setValue('first')
  app = drive(app, [keyMsg('enter')])

  const id = app.askId
  app = drive(app, [
    { type: 'qvac.end', id },
    { type: 'qvac.delta', id, text: 'GHOST' }
  ])

  t.absent(screen(app).includes('GHOST'), 'a delta after end never lands')
})

test('esc interrupts a running answer and cancels the request', (t) => {
  const inference = fakeInference()
  let app = new App({ inference })

  app = drive(app, [resize, { type: 'qvac.loaded', model: 'test-model' }])
  app.input.setValue('count to a million')
  app = drive(app, [keyMsg('enter')])

  const id = app.askId
  app = drive(app, [{ type: 'qvac.delta', id, text: 'one…' }, keyMsg('esc')])

  t.is(app.phase, 'idle', 'back to idle')
  t.alike(inference.calls.cancelled, [id], 'cancelled that exact request')
  t.ok(screen(app).includes('interrupted'), 'transcript is marked interrupted')
})

test('typing is inert while the model is answering', (t) => {
  let app = new App({ inference: fakeInference() })
  app = drive(app, [resize, { type: 'qvac.loaded', model: 'test-model' }])
  app.input.setValue('hello')
  app = drive(app, [keyMsg('enter')])

  app = drive(app, [{ type: 'key', name: 'x', sequence: 'x', is: (...n) => n.includes('x') }])
  t.is(app.input.value, '', 'keystrokes do not reach the field while busy')
})

test('chrome is measured, so the view always fits the terminal', (t) => {
  for (const height of [12, 24, 40]) {
    const app = drive(new App({ inference: fakeInference() }), [
      { type: 'resize', width: 80, height },
      { type: 'qvac.loaded', model: 'test-model' }
    ])
    t.is(style.height(app.view()), height, `view is exactly ${height} lines tall`)
  }
})

test('wrap measures visible cells, not bytes', (t) => {
  const styled = style().bold(true).foreground('red').render('hello')
  const lines = wrap(styled + ' world', 20)
  t.is(lines.length, 1, 'ANSI codes do not count toward the width')
})

test('runs headlessly through a real Program', async (t) => {
  const input = new PassThrough()
  const chunks = []
  const output = new Writable({
    write(data, enc, cb) {
      chunks.push(data.toString())
      cb()
    }
  })
  output.columns = 80
  output.rows = 24

  const app = new App({ inference: fakeInference(), model: 'test-model' })
  const program = new Program(app, { input, output, isTTY: true, width: 80, height: 24, fps: 0 })

  const running = program.run()
  program.send({ type: 'qvac.loaded', model: 'test-model' })
  program.send({ type: 'app.notice', text: 'hello from the updater' })
  program.quit()
  await running

  const painted = style.stripAnsi(chunks.join(''))
  t.ok(painted.includes('hello-pear-qvac'), 'painted the header')
  t.ok(painted.includes('hello from the updater'), 'notices reach the transcript')
})

test('survives a terminal that reports no size', (t) => {
  const app = drive(new App({ inference: fakeInference() }), [
    { type: 'resize', width: 0, height: 0 },
    { type: 'qvac.loaded', model: 'test-model' }
  ])

  t.execution(() => app.view(), 'renders instead of throwing on a 0x0 terminal')
})

test('narrow terminals still render', (t) => {
  const app = drive(new App({ inference: fakeInference() }), [
    { type: 'resize', width: 30, height: 10 },
    { type: 'qvac.loaded', model: 'test-model' }
  ])
  app.entries.push({ role: 'assistant', text: 'a fairly long answer that must wrap somewhere' })
  app._sync()

  t.is(style.height(app.view()), 10, 'still exactly fills the height')
})

test('a model that never loads leaves the app in a failed state', (t) => {
  const app = drive(new App({ inference: fakeInference() }), [
    resize,
    { type: 'qvac.error', message: 'Unknown model: NOPE' }
  ])

  t.is(app.phase, 'failed', 'does not pretend to be ready')
  t.absent(app.input.focused, 'the field never takes focus')

  const painted = screen(app)
  t.ok(painted.includes('failed'), 'header says failed')
  t.ok(painted.includes('Unknown model: NOPE'), 'shows why')
})

// ── update banner ─────────────────────────────────────────────────────────

const ready = () => [resize, { type: 'qvac.loaded', model: 'test-model' }]

test('the update banner costs no rows until there is an update', (t) => {
  const app = drive(new App({ inference: fakeInference() }), ready())
  t.is(app.updater.view(), '', 'renders nothing while idle')
  t.is(style.height(app.view()), 24, 'view still fills exactly 24 rows')
})

test('an available update appears without breaking the layout', (t) => {
  const app = drive(new App({ inference: fakeInference() }), [
    ...ready(),
    { type: 'update.ready', version: '1.2.3' }
  ])

  t.ok(app.updater.visible(), 'banner is showing')
  t.ok(screen(app).includes('1.2.3'), 'names the version')
  t.is(style.height(app.view()), 24, 'still exactly 24 rows — the body gave up the space')
})

test('enter sends a question rather than applying a staged update', (t) => {
  // bare-tui-updater accepts on 'enter' as well as its accept key, so a naive
  // integration would apply the update instead of sending the question.
  const inference = fakeInference()
  let applied = false

  let app = new App({
    inference,
    onApplyUpdate: () => {
      applied = true
      return Promise.resolve()
    }
  })
  app = drive(app, [...ready(), { type: 'update.ready', version: '1.2.3' }])

  app.input.setValue('a real question')
  app = drive(app, [keyMsg('enter')])

  t.absent(applied, 'enter did not apply the update')
  t.is(inference.calls.asked.length, 1, 'enter sent the question')
  t.ok(app.updater.visible(), 'banner is still there, waiting')
})

test('typing a word containing the default accept key is not swallowed', (t) => {
  let app = new App({ inference: fakeInference(), onApplyUpdate: () => Promise.resolve() })
  app = drive(app, [...ready(), { type: 'update.ready', version: '1.2.3' }])

  for (const ch of 'update') {
    app = drive(app, [{ type: 'key', name: ch, sequence: ch, is: (...n) => n.includes(ch) }])
  }

  t.is(app.input.value, 'update', 'every character reached the field')
  t.ok(app.updater.visible(), 'banner untouched')
})

test('the accept chord applies the update', async (t) => {
  let applied = false
  let app = new App({
    inference: fakeInference(),
    onApplyUpdate: () => {
      applied = true
      return Promise.resolve()
    }
  })
  app = drive(app, [...ready(), { type: 'update.ready', version: '1.2.3' }])

  const [next, cmd] = app.update(keyMsg('ctrl+r'))
  app = next
  t.ok(cmd, 'accepting produces a Cmd')

  const msg = await cmd()
  t.ok(applied, 'called through to app.applyUpdate()')

  app = drive(app, [msg])
  t.ok(screen(app).toLowerCase().includes('restart'), 'prompts for a restart')
})

test('esc dismisses the banner when idle but interrupts when busy', (t) => {
  let app = new App({ inference: fakeInference(), onApplyUpdate: () => Promise.resolve() })
  app = drive(app, [...ready(), { type: 'update.ready', version: '1.2.3' }])

  app.input.setValue('something')
  app = drive(app, [keyMsg('enter')]) // now busy, banner still visible
  app = drive(app, [keyMsg('esc')])

  t.is(app.phase, 'idle', 'esc interrupted the answer')
  t.ok(app.updater.visible(), 'and left the banner alone')

  app = drive(app, [keyMsg('esc')]) // idle now
  t.absent(app.updater.visible(), 'a second esc dismisses the banner')
})

// ── thinking models & truncation ──────────────────────────────────────────

function ask(app, text) {
  app.input.setValue(text)
  return drive(app, [keyMsg('enter')])
}

test('reasoning is kept out of the answer and out of the history', (t) => {
  const inference = fakeInference()
  let app = drive(new App({ inference }), ready())

  app = ask(app, 'why?')
  const id = app.askId
  app = drive(app, [
    { type: 'qvac.thinking', id, text: 'the user wants a reason. ' },
    { type: 'qvac.thinking', id, text: 'I should be brief.' },
    { type: 'qvac.delta', id, text: 'Because.' },
    { type: 'qvac.end', id, stopReason: 'eos' }
  ])

  const answer = app.entries[app.entries.length - 1]
  t.is(answer.text, 'Because.', 'answer holds content only')
  t.is(answer.thinking, 'the user wants a reason. I should be brief.', 'reasoning kept aside')

  // Second turn: the history sent to the model must not replay the reasoning.
  app = ask(app, 'again?')
  const sent = inference.calls.asked[1]
  const assistant = sent.find((m) => m.role === 'assistant')
  t.is(assistant.content, 'Because.', 'history carries the answer')
  t.absent(
    sent.some((m) => m.content.includes('I should be brief')),
    'history never replays reasoning — that is what exhausts the context window'
  )
})

test('reasoning collapses once the answer starts, and ctrl+t expands it', (t) => {
  let app = drive(new App({ inference: fakeInference() }), ready())
  app = ask(app, 'why?')
  const id = app.askId

  app = drive(app, [{ type: 'qvac.thinking', id, text: 'weighing the options' }])
  t.ok(screen(app).includes('weighing the options'), 'reasoning streams live while it thinks')

  app = drive(app, [
    { type: 'qvac.delta', id, text: 'Answer.' },
    { type: 'qvac.end', id, stopReason: 'eos' }
  ])
  t.absent(screen(app).includes('weighing the options'), 'collapses when the answer arrives')
  t.ok(screen(app).includes('thought'), 'leaves a one-line summary')

  app = drive(app, [keyMsg('ctrl+t')])
  t.ok(screen(app).includes('weighing the options'), 'ctrl+t brings it back')
})

test('an answer cut off at the context limit says so', (t) => {
  let app = drive(new App({ inference: fakeInference() }), [
    resize,
    { type: 'qvac.loaded', model: 'test-model', ctxSize: 8192 }
  ])
  app = ask(app, 'tell me everything')
  const id = app.askId

  app = drive(app, [
    { type: 'qvac.delta', id, text: 'It started mid-sen' },
    { type: 'qvac.end', id, stopReason: 'length' }
  ])

  const painted = screen(app)
  t.ok(app.entries[app.entries.length - 1].truncated, 'marked truncated')
  t.ok(painted.includes('context limit'), 'tells the user why it stopped')
  t.ok(painted.includes('8192'), 'names the limit it hit')
})

test('a normal finish carries no warning', (t) => {
  let app = drive(new App({ inference: fakeInference() }), ready())
  app = ask(app, 'hi')
  const id = app.askId
  app = drive(app, [
    { type: 'qvac.delta', id, text: 'Hello.' },
    { type: 'qvac.end', id, stopReason: 'eos' }
  ])

  t.absent(app.entries[app.entries.length - 1].truncated, 'not truncated')
  t.absent(screen(app).includes('context limit'), 'no warning')
})
