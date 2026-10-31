'use client';

import { WorkspaceFile, ToolResult } from '@converto/core';
import { workspaceDb, WorkspaceHistoryEntry } from './workspace-db';

export interface WorkspaceState {
  activeFiles: WorkspaceFile[];
  history: WorkspaceHistoryEntry[];
  undoStack: WorkspaceFile[][];
  redoStack: WorkspaceFile[][];
}

type Listener = () => void;

class WorkspaceManager {
  private activeFiles: WorkspaceFile[] = [];
  private history: WorkspaceHistoryEntry[] = [];
  private undoStack: WorkspaceFile[][] = [];
  private redoStack: WorkspaceFile[][] = [];
  private listeners: Set<Listener> = new Set();
  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      this.history = await workspaceDb.getHistory();
      const files = await workspaceDb.getAllFiles();
      if (files.length > 0) {
        this.activeFiles = files;
      }
      this.notify();
    } catch {
      // Ignore init errors
    }
  }

  public getActiveFiles(): WorkspaceFile[] {
    return [...this.activeFiles];
  }

  public getHistory(): WorkspaceHistoryEntry[] {
    return [...this.history];
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public async setActiveFiles(files: WorkspaceFile[]): Promise<void> {
    if (this.activeFiles.length > 0) {
      this.undoStack.push([...this.activeFiles]);
      this.redoStack = []; // Clear redo on new action
    }
    this.activeFiles = files;
    await workspaceDb.saveFiles(files);
    this.notify();
  }

  public async recordToolOperation(
    toolId: string,
    toolTitle: string,
    inputFiles: WorkspaceFile[],
    outputFiles: WorkspaceFile[],
    summary: string
  ): Promise<void> {
    // Push current active state to undo stack
    this.undoStack.push([...this.activeFiles]);
    this.redoStack = [];

    // Tag parent versions for chaining lineage
    outputFiles.forEach((out) => {
      if (inputFiles.length > 0) {
        out.parentVersionId = inputFiles[0].id;
      }
    });

    // Save outputs
    await workspaceDb.saveFiles(outputFiles);

    // Save history entry
    const entry: WorkspaceHistoryEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      toolId,
      toolTitle,
      summary,
      inputIds: inputFiles.map((f) => f.id),
      outputIds: outputFiles.map((f) => f.id),
    };

    await workspaceDb.addHistory(entry);
    this.history.unshift(entry);

    // Update active workspace files to result files
    this.activeFiles = outputFiles;
    this.notify();
  }

  public async undo(): Promise<void> {
    if (!this.canUndo()) return;
    const previous = this.undoStack.pop();
    if (previous) {
      this.redoStack.push([...this.activeFiles]);
      this.activeFiles = previous;
      this.notify();
    }
  }

  public async redo(): Promise<void> {
    if (!this.canRedo()) return;
    const next = this.redoStack.pop();
    if (next) {
      this.undoStack.push([...this.activeFiles]);
      this.activeFiles = next;
      this.notify();
    }
  }

  public async revertToHistoryEntry(entry: WorkspaceHistoryEntry): Promise<void> {
    const filesToRestore: WorkspaceFile[] = [];
    for (const id of entry.outputIds) {
      const file = await workspaceDb.getFile(id);
      if (file) filesToRestore.push(file);
    }

    if (filesToRestore.length > 0) {
      this.undoStack.push([...this.activeFiles]);
      this.redoStack = [];
      this.activeFiles = filesToRestore;
      this.notify();
    }
  }

  public async clearWorkspace(): Promise<void> {
    this.activeFiles = [];
    this.undoStack = [];
    this.redoStack = [];
    this.history = [];
    await workspaceDb.clearAllData();
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const workspaceManager = new WorkspaceManager();
