import { asyncSelectorResult, AsyncSelectorResults } from '../../Select/AsyncSelectorResult'
import { CommandExecutor } from '../../CommandExecutor'
import { asyncCommand, asyncAwaitingValue, AsyncValue, asyncValueReceived } from '../../AsyncValue'
import { getNextOuterComponentStateAsyncStateProps } from '../../Connect/getNextOuterComponentStateAsyncStateProps'
import { areSameReference } from '../../Equality'
import { Tracked, createTracked } from '../../Select/Tracked'
import { none, NonePartial } from '../../None'
import { getInnerComponentProps } from '../../Connect/getInnerComponentProps'

describe('getNextState', () => {
  enum CommandType {
    SetOutput,
    SetOther
  }

  type SetOutput = Readonly<{ type: CommandType.SetOutput; value: AsyncValue<Command, Output> }>
  type SetOther = Readonly<{ type: CommandType.SetOther; value: AsyncValue<Command, Other> }>
  type Command = SetOutput | SetOther

  type Input = string
  type Output = number
  type Other = boolean
  type OwnProp = number

  type AppState = Readonly<{
    input: Input
    output: AsyncValue<Command, Output>
    other: AsyncValue<Command, Other>
  }>

  type OwnProps = Readonly<{
    ownProp: OwnProp
  }>

  function executeCommand(appState: AppState, command: Command): AppState {
    switch (command.type) {
      case CommandType.SetOutput:
        return { ...appState, output: command.value }
      case CommandType.SetOther:
        return { ...appState, other: command.value }
    }
  }

  function getTrackedInput(appState: AppState): Tracked<AppState> {
    return createTracked(appState => appState.input, appState, areSameReference)
  }

  type Props = Readonly<{
    output: Output
    other: Other
    ownProp: OwnProp
  }>

  function mapStateToAsyncProps(appState: AppState, ownProps: OwnProps): AsyncSelectorResults<AppState, Command, Props> {
    return {
      output: asyncSelectorResult(appState.output, [getTrackedInput(appState)]),
      other: asyncSelectorResult(appState.other, []),
      ownProp: asyncSelectorResult<AppState, Command, OwnProp>(asyncValueReceived(ownProps.ownProp), [])
    }
  }

  type TestCase = {
    initialAppState: AppState
    nextAppState?: AppState
    ownProps: OwnProps
    expectedCommands: CommandType[]
    expectedProps?: NonePartial<Props>
    expectedFinalAppState?: AppState
  }

  function executeTestCase(testCase: TestCase) {
    let appState: AppState = testCase.initialAppState
    const ownProps: OwnProps = testCase.ownProps

    let commandsExecuted: Command[] = []
    const commandExecutor: CommandExecutor<Command> = (command: Command) => {
      commandsExecuted.push(command)
      appState = executeCommand(appState, command)
    }

    const getAppState = () => appState

    const initialState = getNextOuterComponentStateAsyncStateProps(commandExecutor, getAppState, ownProps, mapStateToAsyncProps, mapStateToAsyncProps(appState, ownProps))
    let nextState = initialState
    if (testCase.nextAppState !== undefined) {
      appState = testCase.nextAppState
      nextState = getNextOuterComponentStateAsyncStateProps(commandExecutor, getAppState, ownProps, mapStateToAsyncProps, initialState)
    }

    if (testCase.expectedCommands !== undefined) {
      const typesOfCommandsExecuted = commandsExecuted.map(c => c.type)
      expect(typesOfCommandsExecuted).toEqual(expect.arrayContaining(testCase.expectedCommands))
      expect(typesOfCommandsExecuted).toHaveLength(testCase.expectedCommands.length)
    }

    if (testCase.expectedProps !== undefined) {
      expect(getInnerComponentProps<AppState, Command, Props, {}, {}>(nextState, {}, {})).toEqual(testCase.expectedProps)
    }
  }

  it('should execute all commands', () => {
    executeTestCase({
      initialAppState: {
        input: 'four',
        output: asyncCommand<Command>([{ type: CommandType.SetOutput, value: asyncAwaitingValue() }]),
        other: asyncCommand<Command>([{ type: CommandType.SetOther, value: asyncAwaitingValue() }])
      },
      ownProps: {
        ownProp: 8
      },
      expectedCommands: [CommandType.SetOutput, CommandType.SetOther],
      expectedFinalAppState: {
        input: 'four',
        output: asyncAwaitingValue(),
        other: asyncAwaitingValue()
      }
    })
  })

  it('should return `none` for every `AsyncCommand`', () => {
    executeTestCase({
      initialAppState: {
        input: 'four',
        output: asyncCommand([]),
        other: asyncCommand([])
      },
      ownProps: {
        ownProp: 12
      },
      expectedCommands: [],
      expectedProps: {
        output: none,
        other: none,
        ownProp: 12
      }
    })
  })

  it('should return `none` for every `AsyncAwaitingValue`', () => {
    executeTestCase({
      initialAppState: {
        input: 'four',
        output: asyncAwaitingValue(),
        other: asyncAwaitingValue()
      },
      ownProps: {
        ownProp: -3
      },
      expectedCommands: [],
      expectedProps: {
        output: none,
        other: none,
        ownProp: -3
      }
    })
  })

  it('should return a value for every `AsyncAwaitingValue`', () => {
    executeTestCase({
      initialAppState: {
        input: 'four',
        output: asyncValueReceived(4),
        other: asyncValueReceived(true)
      },
      ownProps: {
        ownProp: 0
      },
      expectedCommands: [],
      expectedProps: {
        output: 4,
        other: true,
        ownProp: 0
      }
    })
  })

  it('should ignore every `AsyncAwaitingValue` when the tracked input did not change', () => {
    executeTestCase({
      initialAppState: {
        input: 'four',
        output: asyncValueReceived(4),
        other: asyncValueReceived(true)
      },
      nextAppState: {
        input: 'four',
        output: asyncAwaitingValue(),
        other: asyncAwaitingValue()
      },
      ownProps: {
        ownProp: 1
      },
      expectedCommands: [],
      expectedProps: {
        output: 4,
        other: true,
        ownProp: 1
      }
    })
  })

  it('should return none for every `AsyncAwaitingValue` for which the tracked input changed', () => {
    executeTestCase({
      initialAppState: {
        input: 'four',
        output: asyncValueReceived(4),
        other: asyncValueReceived(true)
      },
      nextAppState: {
        input: 'five',
        output: asyncAwaitingValue(),
        other: asyncAwaitingValue()
      },
      ownProps: {
        ownProp: 111
      },
      expectedCommands: [],
      expectedProps: {
        output: none,
        other: true,
        ownProp: 111
      }
    })
  })
})
