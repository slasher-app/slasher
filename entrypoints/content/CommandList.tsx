import React from "react";
import { Command, CommandView } from "./Command";
import { CommandList } from "../types/CommandEntry";

interface CommandListProps {
  commands: CommandList;
  x: number;
  y: number;
  visible: boolean;
  selectedIndex: number;
  onSelect: (command: Command) => void;
}

export const CommandListView: React.FC<CommandListProps> = ({ commands, x, y, visible, selectedIndex, onSelect }) => {
  if (!visible) return null;

  return (
    <div
      className="bg-stone-800 border border-stone-700 rounded-lg shadow-lg"
      style={{
        position: "absolute",
        top: y + 5,
        left: x,
        zIndex: 10000,
      }}
    >
      <ul className="m-0 p-0 list-none">
        {commands.filter(entry => entry.command.url !== document.URL).map((commandEntry, idx) => (
          <CommandView key={commandEntry.name} command={commandEntry.command} selected={idx === selectedIndex} onSelect={() => onSelect(commandEntry.command)} />
        ))}
      </ul>
    </div>
  );
};
