import { command, arg, flag, summary } from 'paparam'
import path from 'bare-path'
import pkg from './package.json'

// True under `bare bin.mjs`, false in the built executable
const isDev = path.basename(Bare.argv[0], path.extname(Bare.argv[0])) === 'bare'

const cmd = command(
  pkg.name,
  summary(pkg.description),
  arg('[name]', 'Who to greet'),
  flag('--shout|-s', 'Print the greeting in uppercase')
)

cmd.parse(Bare.argv.slice(isDev ? 2 : 1))
if (cmd.flags.help) Bare.exit()

const greeting = `Hello, ${cmd.args.name || 'peer'}!`
console.log(`${cmd.flags.shout ? greeting.toUpperCase() : greeting} (${pkg.name} v${pkg.version})`)
