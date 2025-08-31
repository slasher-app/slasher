import { ChangeEvent, useState, useEffect } from "react";
import { Command } from "../content/Command";
import { CommandRepository } from "../utils/CommandRepository";
import { CommandEventHandler } from "../utils/CommandEventHandler";
import { CommandList, CommandEntry } from "../types/CommandEntry";


const commandRepository = new CommandRepository();
const commandEventHandler = new CommandEventHandler();

function App() {
  const [commands, setCommands] = useState<CommandList>([]);
  const [form, setForm] = useState({
    title: "",
    command: "",
    description: "",
    replacement: "",
    url: ""
  });

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCommand, setEditingCommand] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const loadCommands = async () => {
    const storedCommands = await commandRepository.findAll();
    if (storedCommands && storedCommands.length > 0) {
      setCommands(storedCommands);
    }
  };

  const updateCommands = async () => {
    await commandRepository.saveAll(commands);
    await commandEventHandler.publishUpdate(commands);
  };

  useEffect(() => {
    loadCommands();
  }, []);

  useEffect(() => {
    if (commands.length > 0) {
      updateCommands();
    }
  }, [commands]);

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleAdd = () => {
    if (!form.title || !form.command || !form.replacement) return;

    if (editingCommand) {
      const newCommands = [...commands];
      const existingIndex = newCommands.findIndex(entry => entry.name === editingCommand);
      const updatedCommand = new Command(form.command, form.title, form.description, form.replacement, form.url);
      const updatedEntry: CommandEntry = { name: form.command, command: updatedCommand };

      if (existingIndex !== -1) {
        if (editingCommand !== form.command) {
          // Remove old entry if command name changed and add at the end
          newCommands.splice(existingIndex, 1);
          newCommands.push(updatedEntry);
        } else {
          // Update existing entry in place to maintain order
          newCommands[existingIndex] = updatedEntry;
        }
      }
      setCommands(newCommands);
      setEditingCommand(null);
    } else {
      // Always add new commands at the end
      const newCommand = new Command(form.command, form.title, form.description, form.replacement, form.url);
      const newEntry: CommandEntry = { name: form.command, command: newCommand };
      setCommands(commands => [...commands, newEntry]);
    }

    setForm({ title: "", command: "", description: "", replacement: "", url: "" });
    setIsFormVisible(false);
  };

  const handleDelete = async (command: Command) => {
    setCommands(commands => commands.filter(entry => entry.name !== command.command));
    await commandRepository.delete(command);
  };

  const handleCancel = () => {
    setForm({ title: "", command: "", description: "", replacement: "", url: "" });
    setIsFormVisible(false);
    setEditingCommand(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newCommands = [...commands];
    const draggedItem = newCommands[draggedIndex];

    // Remove the dragged item
    newCommands.splice(draggedIndex, 1);

    // Insert at the new position
    newCommands.splice(dropIndex, 0, draggedItem);

    setCommands(newCommands);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="w-[450px] h-[600px] bg-gradient-to-br from-stone-950 to-stone-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-700 pt-4 pb-4 pl-2 shadow-sm">
        <div className="flex items-center">
          <div>
            <img src="/icon/128.png" alt="Slasher Logo" className="h-14" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-stone-100"><i>Slasher</i></h1>
            <p className="text-xs text-stone-400">Slash commands everywhere!</p>
          </div>
        </div>
      </div>

      {/* Add Command Button */}
      <div className="p-4 bg-stone-800 border-b border-stone-700">
        <button
          onClick={() => {
            setIsFormVisible(!isFormVisible);
            if (isFormVisible) {
              setEditingCommand(null);
              setForm({ title: "", command: "", description: "", replacement: "", url: "" });
            }
          }}
          className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-medium text-xs py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          Add New Slash Command
        </button>
      </div>

      {/* Add Command Form */}
      {isFormVisible && (
        <div className="p-4 bg-stone-800 border-b border-stone-700 animate-in slide-in-from-top duration-200">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-1">Title</label>
                <input
                  name="title"
                  placeholder="e.g., Email"
                  value={form.title}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-stone-700 border-0 text-stone-100 rounded-lg focus:border focus:border-red-500 focus:outline-none text-xs"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-1">Command</label>
                <input
                  name="command"
                  placeholder="e.g., mail"
                  value={form.command}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-stone-700 border-0 text-stone-100 rounded-lg focus:border focus:border-red-500 focus:outline-none text-[11px] font-mono"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-1">URL</label>
                <input
                  name="url"
                  placeholder="e.g., https://github.com"
                  value={form.url}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-stone-700 border-0 text-stone-100 rounded-lg focus:border focus:border-red-500 focus:outline-none text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Description (optional)</label>
              <input
                name="description"
                placeholder="Brief description of what this command does"
                value={form.description}
                onChange={handleFormChange}
                className="w-full px-3 py-2 bg-stone-700 border-0 text-stone-100 rounded-lg focus:border focus:border-red-500 focus:outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Replacement Text</label>
              <textarea
                name="replacement"
                placeholder="The text that will replace your command"
                value={form.replacement}
                onChange={handleFormChange}
                rows={3}
                className="w-full h-20 px-3 py-2 bg-stone-700 border-0 text-stone-100 rounded-lg focus:border focus:border-red-500 focus:outline-none text-xs"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAdd}
                disabled={!form.title || !form.command || !form.replacement}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-stone-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {editingCommand ? "Update Command" : "Save Command"}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-stone-400 hover:text-stone-200 hover:bg-stone-700 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commands List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {commands.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-stone-200 mb-1">No commands yet</h3>
            <p className="text-stone-400 text-xs">Create your first slash command to get started.</p>
          </div>
        ) : (
          commands.map((entry, idx) => (
            <div
              key={entry.name}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={`overflow-auto bg-stone-800 rounded-lg border py-2.5 pr-3 pl-3 shadow-sm transition-all duration-200 select-none relative group ${
                draggedIndex === idx
                  ? "opacity-50 scale-95 border-stone-600 cursor-grabbing"
                  : dragOverIndex === idx && draggedIndex !== null
                  ? "border-rose-500 shadow-lg shadow-rose-500/20 scale-[1.02] cursor-pointer"
                  : "border-stone-700 hover:shadow-md hover:scale-[1.01] cursor-grab hover:cursor-grab"
              }`}
            >
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
                <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 20 20">
                  <path d="M3 8h14M3 12h14" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-stone-200 truncate">{entry.command.title}</p>
                        <span className="bg-stone-600 text-white text-[11px] font-mono px-2 py-1 rounded-md shrink-0">
                          /{entry.command.command}
                        </span>
                      </div>
                      {entry.command.description && (
                        <p className="text-xs text-stone-400">{entry.command.description}</p>
                      )}
                    </div>
                    <div className="flex items-center ml-2 shrink-0">
                      <button
                        onClick={() => {
                          setForm({
                            title: entry.command.title,
                            command: entry.command.command,
                            description: entry.command.description,
                            replacement: entry.command.replacement,
                            url: entry.command.url
                          });
                          setEditingCommand(entry.command.command);
                          setIsFormVisible(true);
                        }}
                        className="p-1.5 text-stone-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors mr-1"
                        title="Edit command"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(entry.command)}
                        className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
                        title="Delete command"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-stone-700 rounded-lg p-2 border border-stone-600">
                <pre className="text-[11px] text-white font-mono leading-relaxed whitespace-pre-wrap break-words">
                  {entry.command.replacement}
                </pre>
              </div>
              <p className="pt-1 text-[10px] text-stone-400 text-right">{entry.command.url}</p>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-stone-800 border-t border-stone-700">
        <p className="text-[10px] text-stone-400 text-center">
          {commands.length} command{commands.length !== 1 ? "s" : ""} saved
        </p>
      </div>
    </div>
  );
}

export default App;
