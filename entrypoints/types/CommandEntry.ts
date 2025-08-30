import { Command } from "../content/Command";

export interface CommandEntry {
  name: string;
  command: Command;
}

export type CommandList = CommandEntry[];
