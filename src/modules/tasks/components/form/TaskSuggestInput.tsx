"use client";

import * as React from "react";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Task } from "../../types";
import { getStatusConfig } from "../../constants";
import { useTaskStore } from "../../store/taskStore";
import { cn } from "@/lib/utils";

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export interface TaskSuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectTask?: (task: Task) => void;
  tasks?: Task[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TaskSuggestInput({
  value,
  onChange,
  onSelectTask,
  tasks: propTasks,
  placeholder = "Nhập tên việc hoặc mã task ...",
  className,
  disabled,
}: TaskSuggestInputProps) {
  const storeTasks = useTaskStore((s) => s.tasks);
  const tasks = propTasks && propTasks.length > 0 ? propTasks : storeTasks;

  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const suggestions = React.useMemo(() => {
    const trimmed = (value || "").trim();
    if (!trimmed || trimmed.length < 1) return [];

    const normalizedFull = removeVietnameseTones(trimmed);
    const tokens = trimmed.split(/\s+/).map((t) => t.toLowerCase());
    const lastToken = tokens[tokens.length - 1] || "";
    const normalizedLast = removeVietnameseTones(lastToken);

    return tasks
      .filter((task) => {
        const code = (task.code || "").toLowerCase();
        const title = (task.title || "").toLowerCase();
        const normalizedTitle = removeVietnameseTones(title);

        if (code.includes(lastToken) || (normalizedLast && code.includes(normalizedLast))) {
          return true;
        }

        for (const token of tokens) {
          if (token.length >= 2 && code.includes(token)) {
            return true;
          }
        }

        if (title.includes(trimmed.toLowerCase()) || normalizedTitle.includes(normalizedFull)) {
          return true;
        }

        return false;
      })
      .slice(0, 6);
  }, [value, tasks]);

  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [suggestions]);

  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleSelect = (task: Task) => {
    const trimmed = (value || "").trim();
    const tokens = trimmed.split(/\s+/);
    const lastToken = tokens[tokens.length - 1] || "";
    const taskLabel = `[${task.code}] ${task.title}`;

    let nextValue = taskLabel;
    if (tokens.length > 1) {
      const lowerLast = lastToken.toLowerCase();
      const lowerCode = (task.code || "").toLowerCase();
      if (lowerCode.includes(lowerLast)) {
        const prefix = trimmed.slice(0, trimmed.length - lastToken.length).trimEnd();
        nextValue = `${prefix} ${taskLabel}`.trim();
      }
    }

    onChange(nextValue);
    if (onSelectTask) {
      onSelectTask(task);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (suggestions[highlightedIndex]) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 w-full">
      <Input
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        className={cn("h-9 text-xs bg-background", className)}
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-popover/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl overflow-hidden p-1 space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border/40">
            <span>Gợi ý nhiệm vụ</span>
            <span>{suggestions.length} kết quả</span>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {suggestions.map((st, idx) => {
              const statusCfg = getStatusConfig(st.status);
              const isSelected = idx === highlightedIndex;

              return (
                <button
                  key={st.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(st);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    "w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors group cursor-pointer",
                    isSelected ? "bg-muted text-foreground" : "hover:bg-muted/60 text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-bold text-primary shrink-0 group-hover:underline">
                      {st.code}
                    </span>
                    <span className="truncate text-foreground font-medium">
                      {st.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {st.projectName && (
                      <span className="text-[10px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded border border-border/40">
                        {st.projectName}
                      </span>
                    )}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border",
                        statusCfg.badgeBg,
                        statusCfg.badgeText,
                        statusCfg.borderColor
                      )}
                    >
                      <span className={cn("h-1 w-1 rounded-full shrink-0", statusCfg.dotColor)} />
                      <span className="truncate max-w-[70px]">{statusCfg.label}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
