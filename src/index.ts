import {
  layer,
  map,
  rule,
  writeToProfile,
  Manipulator,
  ToKeyCode,
  KeyCode,
  FromKeyParam,
  FromModifierParam,
  ToKeyParam,
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
  // spacebar to shift
  ['spacebar', 'left_shift'],
  // left hand
  // hyper, ctrl, option, command, meh
  ['a', 'Hyper'],
  ['s', 'left_control'],
  ['d', 'left_option'],
  ['f', 'left_command'],
  ['g', 'Meh'],
  // right hand
  // meh, command, option, ctrl, hyper
  ['h', 'Meh'],
  ['j', 'right_command'],
  ['k', 'right_option'],
  ['l', 'right_control'],
  ['semicolon', 'Hyper'],
] as ReadonlyArray<[KeyCode, KeyCode | 'Hyper' | 'Meh']>

const symbolMapArr = [
  // homerow brackets
  ['h', '('],
  ['j', ')'],
  ['k', '['],
  ['l', ']'],
  [';', '{'],
  ["'", '}'],
  ['.', ':'],
  // semantic symbols
  ['h', '#'], // h for hash
  ['m', '$'], // m for money
  ['/', '\\'], // / for backslash
  ['a', '+'], // a for add
  ['s', '*'], // s for star
  ['d', '-'], // d for dash
  ['f', '='], // f for ... fequals
  ['b', '|'], // b for bar
  ['g', '&'], // g for gr-and
  ['t', '`'], // t for tick
  ['e', '!'], // e for exclamation
  ['p', '%'], // p for percent
  ['c', '^'], // c for carrot
  ['u', '_'], // u for underscore
] as ReadonlyArray<[FromKeyParam, string]>

const pasteMapArr = [
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

const movementLayerArr = [
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
  [',', 'back_tab'],
  ['.', 'tab'],
] as ReadonlyArray<[FromKeyParam, string]>

const shiftedKeyMap = {
  '!': '1',
  '@': '2',
  '#': '3',
  $: '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  _: '-',
  '+': '=',
  ':': ';',
  '"': "'",
  '{': '[',
  '}': ']',
  '|': '\\',
  '<': ',',
  '>': '.',
  '?': '/',
  '~': '`',
  back_tab: 'tab',
} as Record<string, ToKeyParam>

type ModTapArgs = {
  from: KeyCode
  tap: KeyCode
  mod: KeyCode | KeyCode[] | 'Hyper' | 'Meh'
  timeout?: number
  prioritize?: 'tap' | 'mod'
}

const getKeyMap = (
  fr: FromKeyParam,
  to: string,
  mod?: FromModifierParam | undefined,
) => {
  if (shiftedKeyMap[to] !== undefined) {
    return map(fr, mod).to(shiftedKeyMap[to], 'left_shift')
  }
  return map(fr, mod).to(to as ToKeyCode)
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

  const tapKeyMap = { key_code: argv.tap }

  if (argv.prioritize === 'tap') {
    // if prioritizing tap, then use combination of halt and delayed actions
    // to prevent accidental mod key presses when rolling keys
    return {
      ...manipulator,
      to_if_alone: [{ ...tapKeyMap, halt: true }],
      to_delayed_action: {
        to_if_canceled: [tapKeyMap],
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
    to_if_alone: [tapKeyMap],
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
      getKeyMap(',', 'back_tab', 'left_option'),
      getKeyMap('.', 'tab', 'left_option'),
    ]),

    // hyper key map must come before the home row mods
    rule('hyper keys').manipulators(
      movementLayerArr.map(([fr, to]) => getKeyMap(fr, to, 'Hyper')),
    ),

    rule('option keys').manipulators(
      symbolMapArr.map(([fr, to]) => getKeyMap(fr, to, 'left_option')),
    ),

    layer('z', 'layer-sym1').manipulators(
      pasteMapArr.map(([fr, to]) => map(fr as FromKeyParam).toPaste(to)),
    ),

    rule('Home Row Modifiers').manipulators([
      ...homeRowModArr.map(([fr, to]) =>
        modTap({ from: fr, tap: fr, mod: to, prioritize: 'tap' }),
      ),
      modTap({
        from: 'spacebar',
        tap: 'spacebar',
        mod: 'left_shift',
        prioritize: 'mod',
        timeout: 100,
      }),
    ]),

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
    // rule('double taps').manipulators([mapDoubleTap('j', 50).to('escape')]),

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
