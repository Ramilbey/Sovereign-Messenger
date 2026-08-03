/*
 * Sovereign Messenger — Step 8
 * CalendarView.tsx — Workspace view for Calendar module.
 * Backed by useCalendar() hook.
 */

import React, { memo, type JSX } from "react";
import { useCalendar } from "../../providers/useSovereignData";
import "./ModuleViews.css";

export const CalendarView = memo(function CalendarView(): JSX.Element {
    const events = useCalendar();

    return (
        <div id="module-view-calendar" className="svr-module-view-root">
            <div className="svr-module-header">
                <span className="svr-module-header-icon">📅</span>
                <span className="svr-module-header-title">Kalendar</span>
                <span className="svr-module-header-count">{events.length} ta tadbir</span>
            </div>

            <div className="svr-calendar-list">
                {events.map((event) => (
                    <div key={event.id} className="svr-calendar-card">
                        <div className="svr-calendar-time">{event.time}</div>
                        <div>
                            <div className="svr-calendar-event-title">{event.title}</div>
                            <div className="svr-calendar-location">📍 {event.location}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
