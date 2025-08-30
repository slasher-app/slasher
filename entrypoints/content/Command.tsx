import React from "react";
export class Command {
  constructor(
    readonly command: string,
    readonly title: string,
    readonly description: string,
    readonly replacement: string,
    readonly url: string
  ) {}
}

interface CommandViewProps {
  command: Command;
  selected: boolean;
  onSelect: (command: Command) => void;
}

export const CommandView: React.FC<CommandViewProps> = ({ command, selected, onSelect }) => {
  return (
    <li key={command.command}>
      <div
        onClick={() => onSelect(command)}
        className={`p-2.5 cursor-pointer transition-colors duration-200 ${
          selected
            ? "bg-rose-600/20 border-l-2 border-rose-500"
            : "hover:bg-stone-700/50"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-stone-200 text-sm">{command.title}</p>
          <span className="bg-stone-600 text-white text-xs font-mono px-1.5 py-0.5 rounded shrink-0">
            /{command.command}
          </span>
        </div>
        {command.description && (
          <p className="text-xs text-stone-400">{command.description}</p>
        )}
      </div>
    </li>
  );
};
