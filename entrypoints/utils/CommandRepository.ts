import { Command } from "../content/Command";
import { CommandList } from "../types/CommandEntry";

export class CommandRepository {

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    const result = await browser.storage.local.get(["commands"]);
    if (!result.commands) {
      await browser.storage.local.set({ commands: [] });
    }
  }

  public async saveAll(commands: CommandList): Promise<void> {
    const commandsArray = commands.map((entry) => ({
      name: entry.name,
      command: entry.command.command,
      title: entry.command.title,
      description: entry.command.description,
      replacement: entry.command.replacement,
      url: entry.command.url
    }));

    await browser.storage.local.set({ commands: commandsArray });
  }

  public async findAll(): Promise<CommandList> {
    const result = await browser.storage.local.get(["commands"]);
    const commandsArray = result.commands || [];

    return commandsArray.map((item: any) => ({
      name: item.name,
      command: new Command(item.command, item.title, item.description, item.replacement, item.url)
    }));
  }

  public async delete(command: Command): Promise<void> {
    const commands = await this.findAll();
    const filteredCommands = commands.filter(entry => entry.name !== command.command);
    await this.saveAll(filteredCommands);
  }
}
