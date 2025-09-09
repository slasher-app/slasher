import { useEffect, useState, useMemo } from "react";
import { CommandListView } from "./CommandList";
import { Command } from "./Command";
import { offset } from "caret-pos";
import { CommandRepository } from "../utils/CommandRepository";
import { CommandEventHandler } from "../utils/CommandEventHandler";
import { Theme, detectTheme } from "../utils/ThemeDetector";
import { CommandList } from "../types/CommandEntry";
import { isMatch } from "micromatch";

const commandRepository = new CommandRepository();
const commandEventHandler = new CommandEventHandler();

interface LayoutState {
  position: { x: number; y: number };
  visible: boolean;
  selectedIndex: number;
  activeElement: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null;
  search: string;
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

const useThemeDetection = (): Theme => {
  const [theme, setTheme] = useState<Theme>(detectTheme());

  useEffect(() => {
    const handleThemeChange = () => {
      const currentTheme = detectTheme();
      setTheme(currentTheme);
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    const darkMedia = window.matchMedia("(prefers-color-scheme: dark)");
    darkMedia.addEventListener("change", handleThemeChange);

    return () => {
      observer.disconnect();
      darkMedia.removeEventListener("change", handleThemeChange);
    };
  }, []);

  return theme;
}

const useSlashCommandDetection = () => {
  const [state, setState] = useState<LayoutState>({
    position: { x: 0, y: 0 },
    visible: false,
    selectedIndex: 0,
    activeElement: null,
    search: ""
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

  const updatePosition = (element: HTMLInputElement | HTMLTextAreaElement | HTMLElement) => {
    const { left, top } = offset(element);
    return {
      x: left + window.scrollX,
      y: top + window.scrollY + 20,
    };
  };

  const handleInput = (event: Event) => {
    const target = event.target as HTMLElement;

    const isValidInput = (element: HTMLElement): element is HTMLInputElement | HTMLTextAreaElement | HTMLElement => {
      if (element.contentEditable === "true") {
        return true;
      }

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

    console.log(isValidInput(target))

    // if target is not valid or not focused, don't show the dropdown
    if (!target || !isValidInput(target) || target !== document.activeElement) {
      setState(prev => ({ ...prev, visible: false, search: "" }));
      return;
    }

    const value = target.contentEditable === "true" ? target.textContent || "" : (target as HTMLInputElement | HTMLTextAreaElement).value;
    const { found, command } = extractSlashCommand(value);

    if (found) {
      const position = updatePosition(target);
      setState(prev => ({
        ...prev,
        position,
        visible: true,
        activeElement: target,
        selectedIndex: 0,
        search: command
      }));
    } else {
      setState(prev => ({ ...prev, visible: false, search: "" }));
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
  const theme = useThemeDetection();

  const searchedCommands = useMemo(() => {
      if (!state.search.trim()) {
        return commands;
      }

      const query = state.search.toLowerCase();
      return commands.filter(({ command }) =>
        command.command.toLowerCase().startsWith(query) ||
        command.title.toLowerCase().includes(query)
      );
    }, [commands, state.search]);

  useEffect(() => {
    setState(prev => ({ ...prev, selectedIndex: 0 }));
  }, [searchedCommands.length]);

  const setCursorPosition = (element: HTMLInputElement | HTMLTextAreaElement | HTMLElement, position: number) => {
    try {
      if (element.contentEditable === "true") {
        const range = document.createRange();
        const selection = window.getSelection();

        if (element.firstChild) {
          const textNode = element.firstChild;
          const maxPosition = Math.min(position, textNode.textContent?.length || 0);
          range.setStart(textNode, maxPosition);
          range.setEnd(textNode, maxPosition);
        }

        selection?.removeAllRanges();
        selection?.addRange(range);
        element.focus();
        return;
      }

      // Handle input and textarea elements
      if (element instanceof HTMLTextAreaElement) {
        element.setSelectionRange(position, position);
        element.focus();
        return;
      }

      if (element instanceof HTMLInputElement) {
        const inputType = element.type.toLowerCase();
        const selectionSupportedTypes = ["text", "search", "password", "tel"];

        if (!selectionSupportedTypes.includes(inputType)) {
          element.focus();
          return;
        }
      }

      (element as HTMLInputElement).setSelectionRange(position, position);
      element.focus();
    } catch (error) {
      console.warn("Failed to set cursor position:", error);
      element.focus();
    }
  };

  const handleSelect = (command: Command) => {
    const { activeElement } = state;
    if (!activeElement) return;

    const value = activeElement.contentEditable === "true"
      ? activeElement.textContent || ""
      : (activeElement as HTMLInputElement | HTMLTextAreaElement).value;
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

    if (activeElement.contentEditable === "true") {
      activeElement.textContent = newValue;
    } else {
      (activeElement as HTMLInputElement | HTMLTextAreaElement).value = newValue;
    }
    setCursorPosition(activeElement, cursorPosition);

    setState(prev => ({
      ...prev,
      visible: false,
      selectedIndex: 0,
      search: ""
    }));
  };

  useKeyboardNavigation(state.visible, searchedCommands, state.selectedIndex, setState, handleSelect);

  return <CommandListView theme={theme} commands={searchedCommands} x={state.position.x} y={state.position.y} visible={state.visible} selectedIndex={state.selectedIndex} onSelect={handleSelect} />;
};
