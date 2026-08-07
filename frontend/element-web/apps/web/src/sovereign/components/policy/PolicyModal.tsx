/*
 * Sovereign Messenger — Sprint 1, Step 9 / Policy Modal
 * PolicyModal.tsx — Workspace Policy Modal component.
 *
 * Blueprint §5 Requirements:
 * - Rendered when a workspace is opened for the first time.
 * - Stores acceptance state in localStorage under key 'sovereign_policy_accepted'.
 * - Contains Government usage policy and Communication policy.
 * - Includes 'Qabul qilaman' button (no cancel button).
 * - Modal blocks interaction with workspace until accepted.
 */

import React, { useState, useEffect, useCallback, type JSX } from "react";
import { Icon } from "../ui";
import "./PolicyModal.css";

const STORAGE_KEY = "sovereign_policy_accepted";

export function PolicyModal(): JSX.Element | null {
    const [accepted, setAccepted] = useState<boolean>(true); // Default to true to prevent flash during SSR/initial render

    useEffect(() => {
        const isAccepted = localStorage.getItem(STORAGE_KEY) === "true";
        setAccepted(isAccepted);
    }, []);

    const handleAccept = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, "true");
        setAccepted(true);
    }, []);

    if (accepted) {
        return null;
    }

    return (
        <div id="sovereign-policy-backdrop" className="svr-policy-backdrop">
            <div id="sovereign-policy-modal" className="svr-policy-modal">
                <div className="svr-policy-header">
                    {/* TOK-13 / UI-8: institutional iconography, not an emoji. */}
                    <Icon name="building" size="lg" className="svr-policy-emblem" />
                    <div className="svr-policy-header-titles">
                        <span className="svr-policy-gov-title">
                            O'zbekiston Respublikasi Davlat Xizmati
                        </span>
                        <h2 className="svr-policy-modal-title">
                            Foydalanish va Muloqot Qoidalari
                        </h2>
                    </div>
                </div>

                <div className="svr-policy-body">
                    {/* Section 1: Government Usage Policy */}
                    <div className="svr-policy-section">
                        <div className="svr-policy-section-title">
                            <Icon name="document" size="sm" /> 1. Davlat foydalanish siyosati
                            (Workspace Policy)
                        </div>
                        <p className="svr-policy-section-text">
                            Usbu tizim O'zbekiston Respublikasi davlat organlari va tashkilotlarida axborot xavfsizligi hamda xizmat axborotlaridan foydalanish bo'yicha belgilangan me'yoriy-huquqiy hujjatlarga muvofiq faqat rasmiy xizmat vazifalarini bajarish uchun mo'ljallangan. Tizim resurslaridan asossiz foydalanish qat'iyan man etiladi.
                        </p>
                    </div>

                    {/* Section 2: Communication Policy */}
                    <div className="svr-policy-section">
                        <div className="svr-policy-section-title">
                            <Icon name="lock" size="sm" /> 2. Muloqot va axborot xavfsizligi
                            siyosati (Communication Policy)
                        </div>
                        <p className="svr-policy-section-text">
                            Tizim ichidagi barcha yozishmalar, yuborilgan hujjatlar, xabarlar va biriktirilgan fayllar rasmiy axborot hisoblanadi. Tizimdan shaxsiy maqsadlarda muloqot qilish, ruxsatsiz fayllar uzatish va maxfiy ma'lumotlarni uchinchi shaxslarga oshkor etish qonunan javobgarlikka sabab bo'ladi.
                        </p>
                    </div>
                </div>

                <div className="svr-policy-footer">
                    <button
                        id="sovereign-policy-accept-btn"
                        type="button"
                        className="svr-policy-accept-btn"
                        onClick={handleAccept}
                    >
                        Qabul qilaman
                    </button>
                </div>
            </div>
        </div>
    );
}
