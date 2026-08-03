/*
 * Sovereign Messenger — Step 8
 * TasksView.tsx — Workspace view for Tasks module.
 * Backed by useTasks() hook.
 */

import React, { memo, type JSX } from "react";
import { useTasks } from "../../providers/useSovereignData";
import "./ModuleViews.css";

export const TasksView = memo(function TasksView(): JSX.Element {
    const tasks = useTasks();

    return (
        <div id="module-view-tasks" className="svr-module-view-root">
            <div className="svr-module-header">
                <span className="svr-module-header-icon">✅</span>
                <span className="svr-module-header-title">Vazifalar</span>
                <span className="svr-module-header-count">{tasks.length} ta vazifa</span>
            </div>

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
        </div>
    );
});
