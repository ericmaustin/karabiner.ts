import {
  FromKeyParam,
  layer,
  map,
  rule,
  simlayer,
  toKey,
  ToKeyParam,
  withMapper,
  writeToProfile,
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

const left_hand_keys = '`12345qwertasdfgzxcvb'
  .split('')
  .concat([
    'tab',
    'escape',
    'left_shift',
    'left_control',
    'left_option',
    'left_command',
    'fn',
  ])

const right_hand_keys = "567890-=yuiiop[]\\hjkl;'bnm,./"
  .split('')
  .concat([
    'return_or_enter',
    'right_shift',
    'right_control',
    'right_option',
    'right_command',
    'up_arrow',
    'down_arrow',
    'left_arrow',
    'right_arrow',
  ])

const home_row_mod = (from: string, to: string) => {
  return map(from as FromKeyParam)
    .toIfHeldDown(to as ToKeyParam)
    .toIfAlone(from as ToKeyParam, undefined, {
      halt: true,
    })
    .toDelayedAction(toKey(from as ToKeyParam), toKey(from as ToKeyParam))
    .parameters({
      'basic.to_delayed_action_delay_milliseconds': 200,
      'basic.to_if_held_down_threshold_milliseconds': 200,
    })
}

const main = (profile: string) => {
  writeToProfile(profile, [
    simlayer('f', 'f_shift').manipulators([
      withMapper(right_hand_keys)((k) =>
        map(k as FromKeyParam).to(k as ToKeyParam, 'left_shift'),
      ),
    ]),

    simlayer('j', 'j_shift').manipulators([
      withMapper(left_hand_keys)((k) =>
        map(k as FromKeyParam).to(k as ToKeyParam, 'right_shift'),
      ),
    ]),

    simlayer('d', 'd_cmd').manipulators([
      withMapper(right_hand_keys)((k) =>
        map(k as FromKeyParam).to(k as ToKeyParam, 'left_command'),
      ),
    ]),

    simlayer('k', 'k_cmd').manipulators([
      withMapper(left_hand_keys)((k) =>
        map(k as FromKeyParam).to(k as ToKeyParam, 'right_command'),
      ),
    ]),

    simlayer('s', 's_opt').manipulators([
      withMapper(right_hand_keys)((k) =>
        map(k as FromKeyParam).to(k as ToKeyParam, 'left_option'),
      ),
    ]),

    simlayer('l', 'l_opt').manipulators([
      withMapper(left_hand_keys)((k) =>
        map(k as FromKeyParam).to(k as ToKeyParam, 'right_option'),
      ),
    ]),

    simlayer('a', 'a_ctrl').manipulators([
      withMapper(right_hand_keys)((k) =>
        map(k as FromKeyParam).to(k as ToKeyParam, 'left_control'),
      ),
    ]),

    simlayer(';', ';_ctrl').manipulators([
      withMapper(left_hand_keys)((k) =>
        map(k as FromKeyParam).to(k as ToKeyParam, 'right_control'),
      ),
    ]),

    layer('z').manipulators([
      map('h').to('left_arrow'),
      map('j').to('down_arrow'),
      map('k').to('up_arrow'),
      map('l').to('right_arrow'),
      map('spacebar').toPaste('_'),
      map('return_or_enter').toPaste('⏎'),
      map('tab').toPaste('⇥'),
      map('delete_or_backspace').toPaste('⌫'),
      map('left_command').toPaste('⌘'),
      map('right_command').toPaste('⌘'),
      map('left_option').toPaste('⌥'),
      map('right_option').toPaste('⌥'),
      map('left_control').toPaste('⌃'),
      map('right_control').toPaste('⌃'),
      map('left_shift').toPaste('⇧'),
      map('right_shift').toPaste('⇧'),
      map('caps_lock').toPaste('⇪'),
      map('up_arrow').toPaste('↑'),
      map('down_arrow').toPaste('↓'),
      map('left_arrow').toPaste('←'),
      map('right_arrow').toPaste('→'),
      map('page_up').toPaste('⇞'),
      map('page_down').toPaste('⇟'),
      map('home').toPaste('↖'),
      map('end').toPaste('↘'),
      map('escape').toPaste('⎋'),
      map('.').toPaste('…'),
      map('-').toPaste('—'),
      map('=').toPaste('≠'),
      map('`').toPaste('≈'),
    ]),

    //   // in karabiner-elements a 'rule' is a group of manipulators.
    //   // layer() and simlayer() are extended rule().
    //   rule('shell command').manipulators([
    //     // use to$() to run a shell command
    //     map('⎋', 'hyper').to$('rm -rf ~/wip'),
    //     // toapp() is shortcut for to$('open -a {app}.app')
    //     map('f', 'meh').toapp('finder'),
    //   ]),

    //   // There are multiple ways of using modifiers
    //   rule('Modifiers').manipulators([
    //     // You can use their key_code
    //     map('a', ['left_command', 'left_option']).to('b', ['fn']),
    //     // Or alias (easier to write if mapped to a layer)
    //     map('a', { left: '⌘⌥' }).to('b', 'fn'),
    //     // Or if it can be either left or right side:
    //     map('a', '⌘⌥').to('b', 'fn'),

    //     // 'Hyper' is ⌘⌥⌃⇧ and 'Meh' is ⌥⌃⇧
    //     // ⚠️ Note: Modifier alias (command|option|control|shift and ⌘⌥⌃⇧)
    //     //          can only be used as modifiers, but not as key_code
    //     map('right_command').toHyper(),
    //     map('⇪').toMeh().toIfAlone('⇪'),
    //     map('a', 'Hyper').to('b', 'Meh'),

    //     // Add optional modifiers after the mandatory modifiers. About optional modifiers:
    //     // https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/from/modifiers/#frommodifiersoptional
    //     map('a', '⌘', 'any').to('b'), // ⌘⇧a -> ⇧b
    //   ]),

    //   // Rules can have conditions which will be added to all manipulators.
    //   rule('Conditions', ifApp('^com.apple.finder$')).manipulators([
    //     // manipulators can also have multiple conditions
    //     // layer/simlayer are behind a 'variable_if' condition.
    //     // use unless() to switch {condition}_if to {condition}_unless
    //     map(0).to(1).condition(ifVar('vi-mode'), ifVar('stop').unless()),
    //   ]),

    //   // Optional parameters can be set when use
    //   // - from.simultaneous  - basic.simultaneous_threshold_milliseconds
    //   // - to_if_alone        - basic.to_if_alone_timeout_milliseconds
    //   // - to_if_held_down    - basic.to_if_held_down_threshold_milliseconds
    //   // - to_delayed_action  - basic.to_delayed_action_delay_milliseconds
    //   rule('Parameters').manipulators([
    //     map('left_option')
    //       .toIfAlone('r', '⌘')
    //       .parameters({ 'basic.to_if_alone_timeout_milliseconds': 500 }),
    //   ]),

    //   // There are some other useful abstractions over the json config.
    //   // [File an issue](https://github.com/evan-liu/karabiner.ts/issues) to suggest more.
    //   rule('Other abstractions').manipulators([
    //     // Move the mouse cursor to a position and (optionally) to a screen.
    //     map('↑', 'Meh').toMouseCursorPosition({ x: '100%', y: 0 }),
    //     map('→', 'Meh').toMouseCursorPosition({ x: '50%', y: '50%', screen: 1 }),
    //   ]),

    //   // There are also some useful utilities
    //   rule('Utility').manipulators([
    //     // For nested conditions inside rules/layers
    //     map(0).to(1).condition(ifVar('a')),
    //     // You can group them using withCondition()
    //     withCondition(ifVar('a'))([
    //       map(0).to(1),
    //       map(1).to(2).condition(ifApp('X').unless()), // And nest more conditions.
    //     ]),

    //     // Use withMapper() to apply the same mapping
    //     withMapper({ c: 'Calendar', f: 'Finder' })((k, v) =>
    //       map(k, 'Meh').toApp(v),
    //     ),

    //     // And some others like double-tap
    //     mapDoubleTap(1).to('w', '⌘'),
    //   ]),
  ])
}

// run
run(binary(cmd), process.argv)
