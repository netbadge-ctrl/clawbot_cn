export type Locale = 'en' | 'zh';

export interface Translations {
    common: {
        health: string;
        ok: string;
        offline: string;
        loading: string;
        save: string;
        cancel: string;
        delete: string;
        edit: string;
        error: string;
        unknown: string;
        expandSidebar: string;
        collapseSidebar: string;
        gatewayDashboard: string;
        resources: string;
        docsTooltip: string;
        disconnectedFromGateway: string;
        disabledOnboarding: string;
    };
    nav: {
        overview: string;
        chat: string;
        channels: string;
        instances: string;
        sessions: string;
        cron: string;
        skills: string;
        nodes: string;
        config: string;
        debug: string;
        logs: string;
        docs: string;
    };
    overview: {
        title: string;
        subtitle: string;
        connect: string;
        disconnect: string;
    };
    chat: {
        title: string;
        subtitle: string;
        placeholder: string;
        send: string;
        thinking: string;
        refreshTooltip: string;
        thinkingTooltip: string;
        focusTooltip: string;
    };
    settings: {
        theme: string;
        language: string;
        splitRatio: string;
        themeSystem: string;
        themeLight: string;
        themeDark: string;
    };
    navSubtitles: {
        [key: string]: string;
    };
}
