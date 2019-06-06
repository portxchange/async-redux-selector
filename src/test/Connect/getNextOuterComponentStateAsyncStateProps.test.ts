import { asyncSelectorResult } from '../../Select/AsyncSelectorResult'
import { CommandExecutor } from '../../CommandExecutor'
import { asyncCommand, asyncAwaitingValue, AsyncValue, asyncValueReceived } from '../../AsyncValue'
import { getNextOuterComponentStateAsyncStateProps } from '../../Connect/getNextOuterComponentStateAsyncStateProps'
import { areSameReference } from '../../Equality'
import { Tracked, createTracked } from '../../Select/Tracked'
import { none, NonePartial, None } from '../../None'
import { getInnerComponentProps } from '../../Connect/getInnerComponentProps'
import { PickAsyncPropsWithOwnProps } from '../../Connect/PickAsyncProps'

describe('getNextState', () => {
  enum CommandType {
    SetLeft,
    SetRight
  }

  type SetLeft = Readonly<{ type: CommandType.SetLeft; value: AsyncValue<Command, Left> }>
  type SetRight = Readonly<{ type: CommandType.SetRight; value: AsyncValue<Command, Right> }>
  type Command = SetLeft | SetRight

  type AppStateInput = string
  type Left = number
  type Right = string
  type OuterPropsInput = number

  type AppState = Readonly<{
    appStateInput: AppStateInput
    left: AsyncValue<Command, Left>
    right: AsyncValue<Command, Right>
  }>

  type OuterProps = Readonly<{
    outerPropsInput: OuterPropsInput
  }>

  function executeCommand(appState: AppState, command: Command): AppState {
    switch (command.type) {
      case CommandType.SetLeft:
        return { ...appState, left: command.value }
      case CommandType.SetRight:
        return { ...appState, right: command.value }
    }
  }

  const appStateInputSelector = (appState: AppState) => appState.appStateInput
  const outerPropsInputSelector = (_appState: AppState, props: OuterProps) => props.outerPropsInput

  function getTrackedAppStateInput(appState: AppState): Tracked<AppState, {}> {
    return createTracked(appStateInputSelector, appState, {}, areSameReference)
  }

  function getTrackedOuterPropsInput(appState: AppState, outerProps: OuterProps): Tracked<AppState, OuterProps> {
    return createTracked(outerPropsInputSelector, appState, outerProps, areSameReference)
  }

  type InnerProps = Readonly<{
    appStateInput: AppStateInput
    left: Left | None
    right: Right | None
    outerPropsInput: OuterPropsInput
  }>

  function mapStateToAsyncProps(appState: AppState, props: OuterProps): PickAsyncPropsWithOwnProps<AppState, OuterProps, Command, InnerProps, 'left' | 'right'> {
    return {
      left: asyncSelectorResult(appState.left, [getTrackedAppStateInput(appState)]),
      right: asyncSelectorResult(appState.right, [getTrackedOuterPropsInput(appState, props)])
    }
  }

  function mapStateToSyncProps(appState: AppState, props: OuterProps): Pick<InnerProps, 'appStateInput' | 'outerPropsInput'> {
    return {
      appStateInput: appState.appStateInput,
      outerPropsInput: props.outerPropsInput
    }
  }

  type TestCase = {
    initialAppState: AppState
    nextAppState?: AppState
    initialOuterProps: OuterProps
    nextOuterProps?: OuterProps
    expectedCommands: CommandType[]
    expectedInnerProps?: NonePartial<InnerProps>
    expectedFinalAppState?: AppState
  }

  function executeTestCase(testCase: TestCase) {
    let appState: AppState = testCase.initialAppState
    let outerProps: OuterProps = testCase.initialOuterProps

    let commandsExecuted: Command[] = []
    const commandExecutor: CommandExecutor<Command> = (command: Command) => {
      commandsExecuted.push(command)
      appState = executeCommand(appState, command)
    }

    const getAppState = () => appState

    const initialState = getNextOuterComponentStateAsyncStateProps(commandExecutor, getAppState, outerProps, mapStateToAsyncProps, mapStateToAsyncProps(appState, outerProps))
    let nextState = initialState
    if (testCase.nextAppState !== undefined || testCase.nextOuterProps !== undefined) {
      appState = testCase.nextAppState || appState
      outerProps = testCase.nextOuterProps || outerProps
      nextState = getNextOuterComponentStateAsyncStateProps(commandExecutor, getAppState, outerProps, mapStateToAsyncProps, initialState)
    }

    if (testCase.expectedCommands !== undefined) {
      const typesOfCommandsExecuted = commandsExecuted.map(c => c.type)
      expect(typesOfCommandsExecuted).toEqual(expect.arrayContaining(testCase.expectedCommands))
      expect(typesOfCommandsExecuted).toHaveLength(testCase.expectedCommands.length)
    }

    if (testCase.expectedInnerProps !== undefined) {
      expect(
        getInnerComponentProps<AppState, OuterProps, Command, Pick<InnerProps, 'left' | 'right'>, Pick<InnerProps, 'appStateInput' | 'outerPropsInput'>, {}>(
          nextState,
          mapStateToSyncProps(appState, outerProps),
          {}
        )
      ).toEqual(testCase.expectedInnerProps)
    }
  }

  it('should execute all commands', () => {
    executeTestCase({
      initialAppState: {
        appStateInput: 'four',
        left: asyncCommand<Command>([{ type: CommandType.SetLeft, value: asyncAwaitingValue() }]),
        right: asyncCommand<Command>([{ type: CommandType.SetRight, value: asyncAwaitingValue() }])
      },
      initialOuterProps: {
        outerPropsInput: 8
      },
      expectedCommands: [CommandType.SetLeft, CommandType.SetRight],
      expectedFinalAppState: {
        appStateInput: 'four',
        left: asyncAwaitingValue(),
        right: asyncAwaitingValue()
      }
    })
  })

  it('should return `none` for every `AsyncCommand`', () => {
    executeTestCase({
      initialAppState: {
        appStateInput: 'four',
        left: asyncCommand([]),
        right: asyncCommand([])
      },
      initialOuterProps: {
        outerPropsInput: 12
      },
      expectedCommands: [],
      expectedInnerProps: {
        appStateInput: 'four',
        left: none,
        right: none,
        outerPropsInput: 12
      }
    })
  })

  it('should return `none` for every `AsyncAwaitingValue`', () => {
    executeTestCase({
      initialAppState: {
        appStateInput: 'four',
        left: asyncAwaitingValue(),
        right: asyncAwaitingValue()
      },
      initialOuterProps: {
        outerPropsInput: -3
      },
      expectedCommands: [],
      expectedInnerProps: {
        appStateInput: 'four',
        left: none,
        right: none,
        outerPropsInput: -3
      }
    })
  })

  it('should return a value for every `AsyncValueReceived`', () => {
    executeTestCase({
      initialAppState: {
        appStateInput: 'four',
        left: asyncValueReceived(4),
        right: asyncValueReceived('cat')
      },
      initialOuterProps: {
        outerPropsInput: 0
      },
      expectedCommands: [],
      expectedInnerProps: {
        appStateInput: 'four',
        left: 4,
        right: 'cat',
        outerPropsInput: 0
      }
    })
  })

  it('should ignore every `AsyncAwaitingValue` when the tracked input did not change', () => {
    executeTestCase({
      initialAppState: {
        appStateInput: 'four',
        left: asyncValueReceived(4),
        right: asyncValueReceived('cat')
      },
      nextAppState: {
        appStateInput: 'four',
        left: asyncAwaitingValue(),
        right: asyncAwaitingValue()
      },
      initialOuterProps: {
        outerPropsInput: 1
      },
      expectedCommands: [],
      expectedInnerProps: {
        appStateInput: 'four',
        left: 4,
        right: 'cat',
        outerPropsInput: 1
      }
    })
  })

  it('should return none for every `AsyncAwaitingValue` for which the tracked input changed (for tracked input from `AppState`)', () => {
    executeTestCase({
      initialAppState: {
        appStateInput: 'four',
        left: asyncValueReceived(4),
        right: asyncValueReceived('cat')
      },
      nextAppState: {
        appStateInput: 'five',
        left: asyncAwaitingValue(),
        right: asyncAwaitingValue()
      },
      initialOuterProps: {
        outerPropsInput: 111
      },
      expectedCommands: [],
      expectedInnerProps: {
        appStateInput: 'five',
        left: none,
        right: 'cat',
        outerPropsInput: 111
      }
    })
  })

  it('should return none for every `AsyncAwaitingValue` for which the tracked input changed (for tracked input from `OuterProps`)', () => {
    executeTestCase({
      initialAppState: {
        appStateInput: 'four',
        left: asyncValueReceived(4),
        right: asyncValueReceived('cat')
      },
      nextAppState: {
        appStateInput: 'four',
        left: asyncAwaitingValue(),
        right: asyncAwaitingValue()
      },
      initialOuterProps: {
        outerPropsInput: 111
      },
      nextOuterProps: {
        outerPropsInput: 112
      },
      expectedCommands: [],
      expectedInnerProps: {
        appStateInput: 'four',
        left: 4,
        right: none,
        outerPropsInput: 112
      }
    })
  })
})
