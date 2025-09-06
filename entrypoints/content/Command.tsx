import React from "react";
import { Theme } from "../utils/ThemeDetector";

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
  theme: Theme;
  command: Command;
  selected: boolean;
  onSelect: (command: Command) => void;
}

export const CommandView: React.FC<CommandViewProps> = ({ theme, command, selected, onSelect }) => {
  const isDark = theme === 'dark';

  return (
    <li key={command.command}>
      <div
        onClick={() => onSelect(command)}
        className={`p-2.5 cursor-pointer transition-colors duration-200 ${
          selected
            ? "bg-rose-600/20 border-l-2 border-rose-500"
            : isDark ? "hover:bg-stone-700/50" : "hover:bg-gray-100"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <p className={`font-medium text-sm ${isDark ? 'text-stone-200' : 'text-gray-900'}`}>
            {command.title}
          </p>
          <span className={`text-xs font-mono px-1.5 py-0.5 rounded shrink-0 ${
            isDark
              ? 'bg-stone-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}>
            /{command.command}
          </span>
        </div>
        {command.description && (
          <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>
            {command.description}
          </p>
        )}
      </div>
    </li>
  );
};
