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

interface LayoutState {
  position: { x: number; y: number };
  visible: boolean;
  selectedIndex: number;
  activeElement: HTMLInputElement | HTMLTextAreaElement | null;
}

const useCommands = () => {
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

  return commands;
};

const useSlashCommandDetection = () => {
  const [state, setState] = useState<LayoutState>({
    position: { x: 0, y: 0 },
    visible: false,
    selectedIndex: 0,
    activeElement: null,
  });

  const extractSlashCommand = (value: string): { found: boolean; command: string } => {
    const slashIndex = value.lastIndexOf("/");
    if (slashIndex === -1) {
      return { found: false, command: "" };
    }

    const afterSlash = value.slice(slashIndex + 1);
    const match = afterSlash.match(/^(\S*)/);
    const command = match?.[1] || "";

    return { found: true, command: command };
  };

  const updatePosition = (element: HTMLInputElement | HTMLTextAreaElement) => {
    const { left, top } = offset(element);
    return {
      x: left + window.scrollX,
      y: top + window.scrollY + 20,
    };
  };

  const handleInput = (event: Event) => {
    const target = event.target as HTMLElement;

    const isValidInput = (element: HTMLElement): element is HTMLInputElement | HTMLTextAreaElement => {
      switch (element.tagName) {
        case "TEXTAREA": return true;
        case "INPUT": {
          const inputElement = element as HTMLInputElement;
          const supportedTypes = ["text", "search", "url", "email", "tel"];
          return supportedTypes.includes(inputElement.type.toLowerCase());
        };
        default: return false;
      }
    };

    // if target is not valid or not focused, don't show the dropdown
    if (!target || !isValidInput(target) || target !== document.activeElement) {
      setState(prev => ({ ...prev, visible: false }));
      return;
    }

    const { found, command: _ } = extractSlashCommand(target.value);

    if (found) {
      const position = updatePosition(target);
      setState(prev => ({
        ...prev,
        position,
        visible: true,
        activeElement: target,
        selectedIndex: 0,
      }));
    } else {
      setState(prev => ({ ...prev, visible: false }));
    }
  };

  useEffect(() => {
    document.addEventListener("input", handleInput);
    return () => document.removeEventListener("input", handleInput);
  }, []);

  return { state, setState };
};

const useKeyboardNavigation = (
  visible: boolean,
  filteredCommands: CommandList,
  selectedIndex: number,
  setState: React.Dispatch<React.SetStateAction<LayoutState>>,
  onSelect: (command: Command) => void
) => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!visible || filteredCommands.length === 0) return;

    const { key } = event;

    switch (key) {
      case "ArrowDown":
        event.preventDefault();
        setState(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % filteredCommands.length }));
        break;

      case "ArrowUp":
        event.preventDefault();
        setState(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + filteredCommands.length) % filteredCommands.length }));
        break;

      case "Enter":
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].command);
        }
        break;

      case "Escape":
        setState(prev => ({ ...prev, visible: false }));
        break;
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, filteredCommands, selectedIndex, setState, onSelect]);
};


export const App = () => {
  const commands = useCommands();
  const { state, setState } = useSlashCommandDetection();

  useEffect(() => {
    setState(prev => ({ ...prev, selectedIndex: 0 }));
  }, [commands.length]);

  const setCursorPosition = (element: HTMLInputElement | HTMLTextAreaElement, position: number) => {
    try {
      // TextArea elements always support selection
      if (element instanceof HTMLTextAreaElement) {
        element.setSelectionRange(position, position);
        element.focus();
        return;
      }

      if (element instanceof HTMLInputElement) {
        const inputType = element.type.toLowerCase();
        const selectionSupportedTypes = ["text", "search", "password", "tel"];

        if (!selectionSupportedTypes.includes(inputType)) {
          // For input types like 'email', 'url', etc., just focus without setting cursor
          element.focus();
          return;
        }
      }

      // Set cursor position for supported elements
      element.setSelectionRange(position, position);
      element.focus();
    } catch (error) {
      console.warn("Failed to set cursor position:", error);
      element.focus();
    }
  };

  const handleSelect = (command: Command) => {
    const { activeElement } = state;
    if (!activeElement) return;

    const value = activeElement.value;
    const slashIndex = value.lastIndexOf("/");

    const cursorPlaceholder = "%caret%";
    const cursorOffsetInReplacement = command.replacement.indexOf(cursorPlaceholder);
    const cleanedReplacement = command.replacement.replace(cursorPlaceholder, "");

    const beforeSlash = value.slice(0, slashIndex);
    const afterCommand = value.slice(slashIndex).replace(/^\/\S*/, "");
    const newValue = beforeSlash + cleanedReplacement + afterCommand;

    const cursorPosition = cursorOffsetInReplacement !== -1
      ? beforeSlash.length + cursorOffsetInReplacement
      : (beforeSlash + cleanedReplacement).length;

    activeElement.value = newValue;
    setCursorPosition(activeElement, cursorPosition);

    setState(prev => ({
      ...prev,
      visible: false,
      selectedIndex: 0
    }));
  };

  useKeyboardNavigation(state.visible, commands, state.selectedIndex, setState, handleSelect);

  return <CommandListView commands={commands} x={state.position.x} y={state.position.y} visible={state.visible} selectedIndex={state.selectedIndex} onSelect={handleSelect} />;
};
