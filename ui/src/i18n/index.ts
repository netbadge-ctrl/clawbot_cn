import { ReactiveController, ReactiveControllerHost } from "lit";
import type { Locale, Translations } from "./types";
export type { Locale, Translations };
import { en } from "./locales/en";
import { zh } from "./locales/zh";

export class I18nService implements ReactiveController {
    private host: ReactiveControllerHost;
    private _locale: Locale = 'zh';
    private _translations: Translations = zh;

    constructor(host: ReactiveControllerHost) {
        (this.host = host).addController(this);
    }

    hostConnected() { }
    hostDisconnected() { }

    get locale() {
        return this._locale;
    }

    set locale(value: Locale) {
        if (this._locale !== value) {
            this._locale = value;
            this._translations = value === 'zh' ? zh : en;
            this.host.requestUpdate();
        }
    }

    get t() {
        return this._translations;
    }
}

// Global instance for non-reactive usage if needed, 
// though typically we want component-level subscription or a global store.
// For this app's architecture, we might want a simple signal or just export a helper
// that components can subscribe to.
// Given existing patterns 'loadSettings' etc, let's stick to a simple singleton-like pattern 
// that 'app.ts' controls and passes down or exposes.

let currentLocale: Locale = 'zh';
let currentTranslations: Translations = zh;
const listeners = new Set<() => void>();

export function getLocale(): Locale {
    return currentLocale;
}

export function setLocale(locale: Locale) {
    if (currentLocale !== locale) {
        currentLocale = locale;
        currentTranslations = locale === 'zh' ? zh : en;
        listeners.forEach(l => l());
    }
}

export function t<K extends keyof Translations>(section: K): Translations[K] {
    return currentTranslations[section];
}

export function subscribeLocale(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
}
