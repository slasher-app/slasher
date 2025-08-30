import { Command } from "../content/Command";
import { CommandList } from "../types/CommandEntry";

export class CommandEventHandler {

  public async publishUpdate(commands: CommandList): Promise<void> {
    browser.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, {
            type: "COMMANDS_UPDATED",
            commands: commands.map((entry) => ({
              command: entry.name,
              title: entry.command.title,
              description: entry.command.description,
              replacement: entry.command.replacement,
              url: entry.command.url
            }))
          }).catch(() => {
            console.error("Error while publishing commands updated event!")
          });
        }
      });
    });
  }

  public onUpdate(callback: (commands: CommandList) => void): void {
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === "COMMANDS_UPDATED") {
        if (message.commands) {
          const commandsList: CommandList = message.commands.map((command: any) => ({
            name: command.command as string,
            command: new Command(command.command, command.title, command.description, command.replacement, command.url)
          }));
          callback(commandsList);
        }
      }
    });
  }

  public remove(callback: (commands: CommandList) => void): void {
    browser.runtime.onMessage.removeListener(callback);
  }
}
