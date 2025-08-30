import { useEffect, useState } from "react";
import { CommandListView } from "./CommandList";
import { Command } from "./Command";
import { offset } from "caret-pos";
import { CommandRepository } from "../utils/CommandRepository";
import { CommandEventHandler } from "../utils/CommandEventHandler";
import { CommandList } from "../types/CommandEntry";
import { isMatch } from "micromatch";

const commandRepository = new CommandRepository();
const commandEventHandler = new CommandEventHandler();

export const App = () => {

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeElement, setActiveElement] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [commands, setCommands] = useState<CommandList>([]);

  const normalizePattern = (pattern: string) => {
    if (/[*?[\]{}]/.test(pattern) || pattern.includes("://")) {
      return pattern;
    }

    // Only normalize simple domain patterns like "github.com" -> "https://github.com/"
    return `https://${pattern}/`;
  };

  const setFilteredCommands = (commands: CommandList) => {
    setCommands(commands.filter(({ command }) => isMatch(document.URL, normalizePattern(command.url))));
  };

  const loadCommands = async () => {
    const storedCommands = await commandRepository.findAll();
    if (storedCommands && storedCommands.length > 0) {
      setFilteredCommands(storedCommands);
    }
  };

  useEffect(() => {
    loadCommands();
    commandEventHandler.onUpdate(setFilteredCommands);
    return () => {
      commandEventHandler.remove(setFilteredCommands);
    };
  }, []);

  useEffect(() => {
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;

      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        const value = target.value;
        const slashIndex = value.lastIndexOf("/");

        if (slashIndex !== -1 && document.activeElement === target && commands.length > 0) {
          const { left, top } = offset(target);
          setPosition({
            x: left + window.scrollX,
            y: top + window.scrollY + 20, // small offset below caret
          });

          setVisible(true);
          setActiveElement(target);
        } else {
          setVisible(false);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % commands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSelect(commands[selectedIndex].command);
      } else if (e.key === "Escape") {
        setVisible(false);
      }
    };

    addEventListener("input", handleInput);
    addEventListener("keydown", handleKeyDown);
    return () => {
      removeEventListener("input", handleInput);
      removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, selectedIndex, activeElement, commands]);

  const handleSelect = (command: Command) => {
    if (!activeElement) return;

    // TODO: Fix this for contenteditable elements
    const value = activeElement.value;
    const slashIndex = value.lastIndexOf("/");

    const cursorPlaceholder = "%caret%";
    const cursorOffsetInInsert = command.replacement.indexOf(cursorPlaceholder);

    const cleanedInsert = command.replacement.replace(cursorPlaceholder, "");

    const beforeSlash = value.slice(0, slashIndex);
    const afterCommand = value.slice(slashIndex).replace(/^\/\S*/, ""); // skip rest of slash command
    const newValue = beforeSlash + cleanedInsert + afterCommand;

    const cursorPos = cursorOffsetInInsert !== -1 ? beforeSlash.length + cursorOffsetInInsert : (beforeSlash + cleanedInsert).length;
    activeElement.value = newValue;

    activeElement.setSelectionRange(cursorPos, cursorPos);
    activeElement.focus();

    setVisible(false);
    setSelectedIndex(0);
  };

  return <CommandListView commands={commands} x={position.x} y={position.y} visible={visible} selectedIndex={selectedIndex} onSelect={handleSelect} />;
};
