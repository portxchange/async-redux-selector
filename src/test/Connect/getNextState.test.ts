import { asyncSelectorResult, AsyncSelectorResults } from '../../AsyncSelectorResult'
import { CommandExecutor } from '../../CommandExecutor'
import { asyncCommand, asyncAwaitingValue, AsyncValue } from '../../AsyncValue'
import { getNextState } from '../../Connect/getNextState'
import { areSameReference } from '../../Equality'
import { Tracked, createTracked } from '../../Tracked'

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

  it('should execute all commands', () => {
    let appState: AppState = {
      input: 'four',
      output: asyncCommand<Command>([{ type: CommandType.SetOutput, value: asyncAwaitingValue() }]),
      other: asyncCommand<Command>([{ type: CommandType.SetOther, value: asyncAwaitingValue() }])
    }

    let commandsExecuted: Command[] = []
    const commandExecutor: CommandExecutor<Command> = (command: Command) => {
      commandsExecuted.push(command)
      appState = executeCommand(appState, command)
    }

    const getAppState = () => appState

    getNextState(commandExecutor, getAppState, mapStateToAsyncProps, {})

    const typesOfCommandsExecuted = commandsExecuted.map(c => c.type)
    expect(typesOfCommandsExecuted).toEqual(expect.arrayContaining([CommandType.SetOutput, CommandType.SetOther]))
    expect(typesOfCommandsExecuted).toHaveLength(2)

    const expected: AppState = {
      input: 'four',
      output: asyncAwaitingValue(),
      other: asyncAwaitingValue()
    }
    expect(appState).toEqual(expected)
  })
})
