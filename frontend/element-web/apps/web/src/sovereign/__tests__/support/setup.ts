/* Sovereign suite setup: a storage implementation for the preference and
 * draft services, which persist to localStorage. */
import { afterEach, beforeEach } from "vitest";

class MemoryStorage implements Storage {
    private map = new Map<string, string>();
    public get length(): number {
        return this.map.size;
    }
    public clear(): void {
        this.map.clear();
    }
    public getItem(key: string): string | null {
        return this.map.get(key) ?? null;
    }
    public key(index: number): string | null {
        return Array.from(this.map.keys())[index] ?? null;
    }
    public removeItem(key: string): void {
        this.map.delete(key);
    }
    public setItem(key: string, value: string): void {
        this.map.set(key, value);
    }
}

/*
 * jsdom implements layout-free elements: scrollTo and scrollHeight do not
 * exist. The timeline legitimately uses both, so the environment supplies
 * them rather than the component being written around a test gap.
 */
beforeEach(() => {
    Element.prototype.scrollTo = function scrollTo(options?: ScrollToOptions | number): void {
        if (typeof options === "object" && options !== null && typeof options.top === "number") {
            this.scrollTop = options.top;
        }
    };

    Object.defineProperty(globalThis, "localStorage", {
        value: new MemoryStorage(),
        configurable: true,
        writable: true,
    });
});

afterEach(() => {
    localStorage.clear();
});
