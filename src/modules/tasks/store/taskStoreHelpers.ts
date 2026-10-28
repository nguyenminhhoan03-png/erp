import { CustomTaskStatus, Task } from "../types";

/**
 * Checks if a task is considered completed based on workflow statuses or fallback rules.
 */
export const isTaskDone = (task: Task, statuses: CustomTaskStatus[]): boolean => {
  const statusDef = statuses.find((s) => s.key === task.status);
  if (statusDef) {
    return statusDef.category === "DONE";
  }
  return task.status === "DONE" || task.status === "CANCELLED" || Boolean(task.closedAt);
};

/**
 * Counts the number of completed subtasks in a list of subtasks.
 */
export const countCompletedSubtasks = (subtasks: Task[], statuses: CustomTaskStatus[]): number => {
  return subtasks.filter((st) => isTaskDone(st, statuses)).length;
};

/**
 * Hydrates task subtasks from direct task subtasks + any tasks in the store pointing to task.id as parentId.
 */
export const hydrateTaskSubtasks = (
  task: Task,
  allTasks: Task[],
  statuses: CustomTaskStatus[]
): Task => {
  const directSubtasks = task.subTasks || [];
  const directIds = new Set(directSubtasks.map((st) => String(st.id)));
  const storeSubtasks = allTasks.filter((t) => String(t.parentId) === String(task.id));

  const mergedSubtasks = [
    ...directSubtasks.map((st) => allTasks.find((t) => String(t.id) === String(st.id)) || st),
    ...storeSubtasks.filter((st) => !directIds.has(String(st.id))),
  ];

  return {
    ...task,
    subTasks: mergedSubtasks,
    subtasksCount: mergedSubtasks.length,
    completedSubtasksCount: countCompletedSubtasks(mergedSubtasks, statuses),
  };
};

/**
 * Updates a task or its representation inside parent subtask arrays in an immutable collection of tasks.
 */
export const syncTaskInCollection = (
  tasks: Task[],
  updatedTask: Task,
  statuses: CustomTaskStatus[]
): Task[] => {
  const parentId = updatedTask.parentId || updatedTask.parent?.id;

  return tasks.map((t) => {
    if (t.id === updatedTask.id) {
      return {
        ...t,
        ...updatedTask,
      };
    }

    const isParent =
      (parentId && String(t.id) === String(parentId)) ||
      Boolean(t.subTasks && t.subTasks.some((st) => String(st.id) === String(updatedTask.id)));

    if (isParent) {
      const currentSubtasks = t.subTasks || [];
      const hasSubtask = currentSubtasks.some((st) => String(st.id) === String(updatedTask.id));
      const nextSubtasks = hasSubtask
        ? currentSubtasks.map((st) => (String(st.id) === String(updatedTask.id) ? { ...st, ...updatedTask } : st))
        : [...currentSubtasks, updatedTask];

      return {
        ...t,
        subTasks: nextSubtasks,
        subtasksCount: nextSubtasks.length,
        completedSubtasksCount: countCompletedSubtasks(nextSubtasks, statuses),
      };
    }

    return t;
  });
};

/**
 * Updates an activeTask (either matching id or inside its subtask list).
 */
export const syncActiveTask = (
  activeTask: Task | null,
  updatedTask: Task,
  statuses: CustomTaskStatus[]
): Task | null => {
  if (!activeTask) return null;

  if (activeTask.id === updatedTask.id) {
    return {
      ...activeTask,
      ...updatedTask,
    };
  }

  const parentId = updatedTask.parentId || updatedTask.parent?.id;
  const isParent =
    (parentId && String(activeTask.id) === String(parentId)) ||
    Boolean(activeTask.subTasks && activeTask.subTasks.some((st) => String(st.id) === String(updatedTask.id)));

  if (isParent) {
    const currentSubtasks = activeTask.subTasks || [];
    const hasSubtask = currentSubtasks.some((st) => String(st.id) === String(updatedTask.id));
    const nextSubtasks = hasSubtask
      ? currentSubtasks.map((st) => (String(st.id) === String(updatedTask.id) ? { ...st, ...updatedTask } : st))
      : [...currentSubtasks, updatedTask];

    return {
      ...activeTask,
      subTasks: nextSubtasks,
      subtasksCount: nextSubtasks.length,
      completedSubtasksCount: countCompletedSubtasks(nextSubtasks, statuses),
    };
  }

  return activeTask;
};

/**
 * Removes a task by ID from a task collection and from any subtask lists.
 */
export const removeTaskFromCollection = (
  tasks: Task[],
  deletedId: string,
  statuses: CustomTaskStatus[]
): Task[] => {
  return tasks
    .filter((t) => String(t.id) !== String(deletedId))
    .map((t) => {
      if (t.subTasks && t.subTasks.some((st) => String(st.id) === String(deletedId))) {
        const nextSubtasks = t.subTasks.filter((st) => String(st.id) !== String(deletedId));
        return {
          ...t,
          subTasks: nextSubtasks,
          subtasksCount: nextSubtasks.length,
          completedSubtasksCount: countCompletedSubtasks(nextSubtasks, statuses),
        };
      }
      return t;
    });
};

/**
 * Removes a task by ID from activeTask if matched, or from activeTask's subtasks.
 */
export const removeTaskFromActive = (
  activeTask: Task | null,
  deletedId: string,
  statuses: CustomTaskStatus[]
): Task | null => {
  if (!activeTask) return null;
  if (String(activeTask.id) === String(deletedId)) return null;

  if (activeTask.subTasks && activeTask.subTasks.some((st) => String(st.id) === String(deletedId))) {
    const nextSubtasks = activeTask.subTasks.filter((st) => String(st.id) !== String(deletedId));
    return {
      ...activeTask,
      subTasks: nextSubtasks,
      subtasksCount: nextSubtasks.length,
      completedSubtasksCount: countCompletedSubtasks(nextSubtasks, statuses),
    };
  }

  return activeTask;
};

/**
 * Helper to simultaneously update `tasks` and `activeTask` in Zustand state.
 */
export const applyTaskUpdate = (
  state: { tasks: Task[]; activeTask: Task | null; statuses: CustomTaskStatus[] },
  updatedTask: Task
) => {
  return {
    tasks: syncTaskInCollection(state.tasks, updatedTask, state.statuses),
    activeTask: syncActiveTask(state.activeTask, updatedTask, state.statuses),
  };
};

/**
 * Helper to simultaneously remove a task from `tasks` and `activeTask` in Zustand state.
 */
export const applyTaskRemoval = (
  state: { tasks: Task[]; activeTask: Task | null; statuses: CustomTaskStatus[]; isDetailOpen?: boolean },
  deletedId: string
) => {
  return {
    tasks: removeTaskFromCollection(state.tasks, deletedId, state.statuses),
    activeTask: removeTaskFromActive(state.activeTask, deletedId, state.statuses),
    isDetailOpen: state.activeTask?.id === deletedId ? false : state.isDetailOpen,
  };
};
