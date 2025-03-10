import {
  layer,
  map,
  rule,
  writeToProfile,
  FromKeyCode,
  Manipulator,
  withCondition,
  ToKeyCode,
  ifVar,
  mapDoubleTap,
  mapSimultaneous,
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

const modTapMap = {
  a: 'left_control',
  s: 'left_option',
  d: 'left_command',
  f: 'left_shift',
  j: 'right_shift',
  k: 'right_command',
  l: 'right_option',
  semicolon: 'right_control',
  g: 'Hyper',
  h: 'Hyper',
  n: 'Meh',
  b: 'Meh',
} as Record<FromKeyCode, ToKeyCode | string>

const hyperMap = {
  h: 'left_arrow',
  j: 'down_arrow',
  k: 'up_arrow',
  l: 'right_arrow',
  w: 'up_arrow',
  a: 'left_arrow',
  s: 'down_arrow',
  d: 'right_arrow',
} as Record<FromKeyCode, ToKeyCode>

const symbolMap1 = {
  b: '⌥⌃⇧', // meh
  g: '⌘⌥⌃⇧', // hyper
  f: '⇧',
  d: '⌘',
  s: '⌥',
  a: '⌃',
  n: '⌥⌃⇧',
  h: '⌘⌥⌃⇧',
  j: '⇧',
  k: '⌘',
  l: '⌥',
  semicolon: '⌃',
  spacebar: '␣',
  return_or_enter: '⏎',
  tab: '⇥',
  delete_or_backspace: '⌫',
  left_command: '⌘',
  right_command: '⌘',
  left_option: '⌥',
  right_option: '⌥',
  left_control: '⌃',
  right_control: '⌃',
  left_shift: '⇧',
  right_shift: '⇧',
  caps_lock: '⇪',
  up_arrow: '↑',
  down_arrow: '↓',
  left_arrow: '←',
  right_arrow: '→',
  page_up: '⇞',
  page_down: '⇟',
  home: '↖',
  end: '↘',
  escape: '⎋',
  period: '…',
  equal_sign: '—',
  grave_accent_and_tilde: '≈',
} as Record<FromKeyParam, string>

const modTap = (
  tap: FromKeyCode,
  mod: ToKeyCode | string,
  varName: string,
  timeout: number = 200,
): Manipulator => {
  const varOn = { set_variable: { name: varName, value: true } }
  const varOff = { set_variable: { name: varName, value: false } }

  const modKey =
    mod == 'Hyper'
      ? {
          key_code: 'left_command' as ToKeyCode,
          modifiers: ['option', 'control', 'shift'],
          lazy: true,
        }
      : {
          key_code: mod as ToKeyCode,
          lazy: true,
        }

  return {
    type: 'basic',
    from: {
      key_code: tap,
      modifiers: { optional: ['any'] },
    },
    to_if_alone: [{ key_code: tap as ToKeyCode, halt: true }, varOff],
    to_delayed_action: {
      to_if_canceled: [varOff, { key_code: tap as ToKeyCode }],
    },
    to_if_held_down: [varOn, modKey as any],
    to_after_key_up: [varOff],
    parameters: {
      'basic.to_delayed_action_delay_milliseconds': timeout,
      'basic.to_if_held_down_threshold_milliseconds': timeout,
    },
  }
}

const tapMod = (
  mod: FromKeyCode,
  tap: ToKeyCode,
  timeout: number = 100,
): Manipulator => {
  return {
    type: 'basic',
    from: {
      key_code: mod,
      modifiers: { optional: ['any'] },
    },
    to_if_alone: [{ key_code: tap }],
    to_if_held_down: [{ key_code: mod as ToKeyCode }],
    parameters: {
      'basic.to_if_alone_timeout_milliseconds': timeout,
      'basic.to_if_held_down_threshold_milliseconds': timeout,
    },
  }
}

const main = (profile: string) => {
  writeToProfile(profile, [
    // hyper key map must come before the home row mods
    rule('hyper keys').manipulators([
      ...Object.entries(hyperMap).map(([k, sym]) =>
        map(k as FromKeyCode, 'Hyper').to(sym as ToKeyCode),
      ),
    ]),

    rule('Home Row Modifiers').manipulators([
      withCondition(ifVar('layer-sym1', 0))([
        ...Object.entries(modTapMap).map(([k, mod]) =>
          modTap(k as FromKeyCode, mod, `${k}_held`),
        ),
      ]),
    ]),

    rule('thumbs').manipulators([
      tapMod('left_command', 'return_or_enter'),
      tapMod('right_command', 'delete_or_backspace'),
    ]),

    layer('z', 'layer-sym1').manipulators([
      ...Object.entries(symbolMap1).map(([k, sym]) =>
        map(k as FromKeyParam).toPaste(sym),
      ),
    ]),

    rule('double taps').manipulators([mapDoubleTap('j', 50).to('escape')]),

    rule('symbol chords').manipulators([
      mapSimultaneous(['n', 'm']).to('-', 'left_shift'),
      mapSimultaneous(['h', 'j']).to('-'),
      mapSimultaneous(['h', 'u']).to('/'),
      mapSimultaneous(['u', 'k']).to('\\'),
      mapSimultaneous(['t', 'g']).to('['),
      mapSimultaneous(['y', 'h']).to(']'),
      mapSimultaneous(['g', 'b']).to('[', 'left_shift'),
      mapSimultaneous(['h', 'n']).to(']', 'left_shift'),
    ]),
  ])
}

// run
run(binary(cmd), process.argv)
