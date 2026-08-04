/*
 * Sovereign Messenger — Step 8
 * TasksView.tsx — Workspace view for Tasks module.
 * Backed by useTasks() hook.
 */

import React, { memo, type JSX } from "react";
import { useTasks } from "../../providers/useSovereignData";
import { ModuleStateBoundary } from "./ModuleStateBoundary";
import "./ModuleViews.css";

export const TasksView = memo(function TasksView(): JSX.Element {
    const { data: tasks, state } = useTasks();

    return (
        <div id="module-view-tasks" className="svr-module-view-root">
            <div className="svr-module-header">
                <span className="svr-module-header-icon">✅</span>
                <span className="svr-module-header-title">Vazifalar</span>
                {state === "ready" && (<span className="svr-module-header-count">{tasks.length} ta vazifa</span>)}
            </div>

            <ModuleStateBoundary state={state} surface="tasks">
                <div className="svr-tasks-list">
                    {tasks.map((task) => (
                        <div key={task.id} className="svr-task-card">
                            <div>
                                <div className="svr-task-title">{task.title}</div>
                                <div className="svr-task-assignee">
                                    Bajaruvchi: <strong>{task.assigneeName}</strong> • Topshirdi: {task.assignerName} • Muddat: {task.dueDate}
                                </div>
                            </div>
                            <span className={`svr-task-status-badge ${task.status}`}>
                                {task.statusLabel}
                            </span>
                        </div>
                    ))}
                </div>
            </ModuleStateBoundary>
        </div>
    );
});
