import {
  layer,
  map,
  rule,
  writeToProfile,
  FromKeyCode,
  Manipulator,
  ToKeyCode,
  KeyCode,
  mapDoubleTap,
  FromKeyParam,
} from 'karabiner.ts'

import { command, run, option, flag, string, binary } from 'cmd-ts'

const cmd = command({
  name: 'kbts',
  args: {
    dryRun: flag({
      long: 'dry-run',
      description: 'Print the config json into console',
    }),
    profile: option({
      type: {
        ...string,
        defaultValue: () => '--dry-run',
        defaultValueIsSerializable: true,
      },
      description: 'Karabiner-Elements Profile name',
      long: 'profile',
      short: 'p',
    }),
  },
  handler: (args) => {
    const profile =
      args.profile === '--dry-run' || args.dryRun ? '--dry-run' : args.profile
    main(profile)
  },
})

const homeRowModArr = [
  ['a', 'left_control'],
  ['s', 'left_option'],
  ['d', 'left_command'],
  ['f', 'left_shift'],
  ['j', 'right_shift'],
  ['k', 'right_command'],
  ['l', 'right_option'],
  ['semicolon', 'right_control'],
  ['g', 'Hyper'],
  ['h', 'Hyper'],
  // ['n', 'Meh'],
  // ['b', 'Meh'],
] as ReadonlyArray<[FromKeyCode, ToKeyCode]>

const hyperMapArr = [
  ['h', 'left_arrow'],
  ['j', 'down_arrow'],
  ['k', 'up_arrow'],
  ['l', 'right_arrow'],
  ['w', 'up_arrow'],
  ['a', 'left_arrow'],
  ['s', 'down_arrow'],
  ['d', 'right_arrow'],
  ['[', 'home'],
  [']', 'end'],
] as ReadonlyArray<[FromKeyCode, ToKeyCode]>

const symbolLayerArr = [
  ['spacebar', '␣'],
  ['return_or_enter', '⏎'],
  ['tab', '⇥'],
  ['delete_or_backspace', '⌫'],
  ['delete_forward', '⌦'],
  ['left_command', '⌘'],
  ['right_command', '⌘'],
  ['left_option', '⌥'],
  ['right_option', '⌥'],
  ['left_control', '⌃'],
  ['right_control', '⌃'],
  ['left_shift', '⇧'],
  ['right_shift', '⇧'],
  ['caps_lock', '⇪'],
  ['up_arrow', '↑'],
  ['down_arrow', '↓'],
  ['left_arrow', '←'],
  ['right_arrow', '→'],
  ['page_up', '⇞'],
  ['page_down', '⇟'],
  ['home', '↖'],
  ['end', '↘'],
  ['escape', '⎋'],
  ['period', '…'],
  ['equal_sign', '—'],
  ['grave_accent_and_tilde', '≈'],
] as ReadonlyArray<[FromKeyParam, string]>

type ModTapArgs = {
  from: KeyCode
  tap: KeyCode
  mod: KeyCode | KeyCode[] | 'Hyper' | 'Meh'
  timeout?: number
  prioritize?: 'tap' | 'mod'
}

const modTap = (args: ModTapArgs): Manipulator => {
  let argv = {
    timeout: 200,
    prioritize: 'tap',
    ...args,
  }

  let modKey = {} as any
  switch (argv.mod) {
    case 'Meh':
      modKey = {
        key_code: 'left_control',
        modifiers: ['option', 'shift'],
      }
      break
    case 'Hyper':
      modKey = {
        key_code: 'left_command',
        modifiers: ['option', 'control', 'shift'],
      }
      break
    default:
      if (Array.isArray(argv.mod)) {
        modKey = {
          key_code: argv.mod[0],
          modifiers: argv.mod
            .slice(1)
            .map((k) => k.replace(/^(right|left)_/, '')),
        }
      } else {
        modKey = {
          key_code: argv.mod,
        }
      }
      break
  }

  let manipulator = {
    type: 'basic',
    from: {
      key_code: argv.from,
      modifiers: { optional: ['any'] },
    },
  }

  if (argv.prioritize === 'tap') {
    // if prioritizing tap, then use combination of halt and delayed actions
    // to prevent accidental mod key presses when rolling keys
    return {
      ...manipulator,
      to_if_alone: [{ key_code: argv.tap, halt: true }],
      to_delayed_action: {
        to_if_canceled: [{ key_code: argv.tap }],
      },
      to_if_held_down: [{ ...modKey, lazy: true }],
      parameters: {
        'basic.to_delayed_action_delay_milliseconds': argv.timeout,
        'basic.to_if_held_down_threshold_milliseconds': argv.timeout,
      },
    } as Manipulator
  }

  return {
    ...manipulator,
    to: [modKey],
    to_if_alone: [{ key_code: argv.tap }],
    to_if_held_down: [modKey],
    parameters: {
      'basic.to_if_alone_timeout_milliseconds': argv.timeout,
      'basic.to_if_held_down_threshold_milliseconds': argv.timeout,
    },
  } as Manipulator
}

const main = (profile: string) => {
  writeToProfile(profile, [
    rule('simple key remaps').manipulators([
      map(',', 'left_option').to('tab', 'left_shift'),
      map('.', 'left_option').to('tab'),
    ]),

    // hyper key map must come before the home row mods
    rule('hyper keys').manipulators([
      ...hyperMapArr.map(([f, t]) => map(f, 'Hyper').to(t)),
      map(',', 'Hyper').to('tab', 'left_shift'),
      map('.', 'Hyper').to('tab'),
    ]),

    layer('z', 'layer-sym1').manipulators([
      ...symbolLayerArr.map(([fr, to]) => map(fr as FromKeyParam).toPaste(to)),
      map('i').to('\\', 'left_shift'),
      map('h').to('[', 'left_shift'),
      map('j').to(']', 'left_shift'),
      map('k').to('9', 'left_shift'),
      map('l').to('0', 'left_shift'),
      map(';').to('\\'),
      map("'").to('\\', 'left_shift'),
      map('n').to('-', 'left_shift'),
      map('m').to('-'),
      map(',').to(',', 'left_shift'),
      map('.').to('.', 'left_shift'),
    ]),

    rule('Home Row Modifiers').manipulators(
      homeRowModArr.map(([fr, to]) =>
        modTap({ from: fr, tap: fr, mod: to, prioritize: 'tap' }),
      ),
    ),

    rule('thumbs').manipulators([
      modTap({
        from: 'right_command',
        tap: 'return_or_enter',
        mod: 'left_command',
        prioritize: 'mod',
      }),
      modTap({
        from: 'left_command',
        tap: 'delete_or_backspace',
        mod: 'left_command',
        prioritize: 'mod',
      }),
      modTap({
        from: 'left_option',
        tap: 'escape',
        mod: 'left_option',
        prioritize: 'mod',
      }),
    ]),
    rule('double taps').manipulators([mapDoubleTap('j', 50).to('escape')]),

    // rule('symbol chords').manipulators([
    //   mapSimultaneous(['v', 'b']).to('['),
    //   mapSimultaneous(['n', 'm']).to(']'),
    //   mapSimultaneous(['c', 'v']).to('9', 'left_shift'),
    //   mapSimultaneous(['m', 'comma']).to('0', 'left_shift'),
    //   mapSimultaneous(['r', 't']).to('[', 'left_shift'),
    //   mapSimultaneous(['y', 'u']).to(']', 'left_shift'),
    // ]),
  ])
}

// run
run(binary(cmd), process.argv)
