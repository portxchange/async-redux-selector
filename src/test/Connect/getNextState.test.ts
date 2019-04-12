import { asyncSelectorResult, AsyncSelectorResults } from '../../AsyncSelectorResult'
import { CommandExecutor } from '../../CommandExecutor'
import { asyncCommand, asyncAwaitingValue, AsyncValue, asyncValueReceived } from '../../AsyncValue'
import { getNextState } from '../../Connect/getNextState'
import { areSameReference } from '../../Equality'
import { Tracked, createTracked } from '../../Tracked'
import { none, NonePartial } from '../../None'
import { getAsyncProps } from '../../Connect/getAsyncProps'

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

  type AppState = Readonly<{
    input: Input
    output: AsyncValue<Command, Output>
    other: AsyncValue<Command, Other>
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
  }>

  function mapStateToAsyncProps(appState: AppState): AsyncSelectorResults<AppState, Command, Props> {
    return {
      output: asyncSelectorResult(appState.output, [getTrackedInput(appState)]),
      other: asyncSelectorResult(appState.other, [])
    }
  }

  type TestCase = {
    initialAppState: AppState
    nextAppState?: AppState
    expectedCommands: CommandType[]
    expectedProps?: NonePartial<Props>
    expectedFinalAppState?: AppState
  }

  function executeTestCase(testCase: TestCase) {
    let appState: AppState = testCase.initialAppState

    let commandsExecuted: Command[] = []
    const commandExecutor: CommandExecutor<Command> = (command: Command) => {
      commandsExecuted.push(command)
      appState = executeCommand(appState, command)
    }

    const getAppState = () => appState

    const initialState = getNextState(commandExecutor, getAppState, mapStateToAsyncProps, {})
    let nextState = initialState
    if (testCase.nextAppState !== undefined) {
      appState = testCase.nextAppState
      nextState = getNextState(commandExecutor, getAppState, mapStateToAsyncProps, initialState)
    }

    if (testCase.expectedCommands !== undefined) {
      const typesOfCommandsExecuted = commandsExecuted.map(c => c.type)
      expect(typesOfCommandsExecuted).toEqual(expect.arrayContaining(testCase.expectedCommands))
      expect(typesOfCommandsExecuted).toHaveLength(testCase.expectedCommands.length)
    }

    if (testCase.expectedProps !== undefined) {
      expect(getAsyncProps<AppState, Command, Props>(nextState)).toEqual(testCase.expectedProps)
    }
  }

  it('should execute all commands', () => {
    executeTestCase({
      initialAppState: {
        input: 'four',
        output: asyncCommand<Command>([{ type: CommandType.SetOutput, value: asyncAwaitingValue() }]),
        other: asyncCommand<Command>([{ type: CommandType.SetOther, value: asyncAwaitingValue() }])
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
      expectedCommands: [],
      expectedProps: {
        output: none,
        other: none
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
      expectedCommands: [],
      expectedProps: {
        output: none,
        other: none
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
      expectedCommands: [],
      expectedProps: {
        output: 4,
        other: true
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
      expectedCommands: [],
      expectedProps: {
        output: 4,
        other: true
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
      expectedCommands: [],
      expectedProps: {
        output: none,
        other: true
      }
    })
  })
})
