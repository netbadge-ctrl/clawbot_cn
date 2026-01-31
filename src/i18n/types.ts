export type Locale = "en" | "zh";

export type TranslationKeys = {
  systemPrompt: {
    intro: string;
    tooling: {
      header: string;
      availability: string;
      caseSensitive: string;
      standardTools: string;
      extraTools: {
        grep: string;
        find: string;
        ls: string;
        apply_patch: string;
        exec: string;
        process: string;
        browser: string;
        canvas: string;
        nodes: string;
        cron: string;
        sessions_list: string;
        sessions_history: string;
        sessions_send: string;
        gateway: string;
        agents_list: string;
        sessions_spawn: string;
        session_status: string;
        image: string;
        read: string;
        write: string;
        edit: string;
        web_search: string;
        web_fetch: string;
        message: string;
      };
      docsDisclaimer: string;
      subAgentAdvice: string;
    };
    toolCallStyle: {
      header: string;
      default: string;
      narrate: string;
      brief: string;
      plain: string;
    };
    replyTags: {
      header: string;
      instruction: string;
      current: string;
      specific: string;
      whitespace: string;
      stripped: string;
    };
    modelAliases: {
      header: string;
      instruction: string;
    };
    sandbox: {
      header: string;
      intro: string;
      limited: string;
      subAgent: string;
      workspace: string;
      access: string;
      browserBridge: string;
      observer: string;
      hostControlAllowed: string;
      hostControlBlocked: string;
      elevatedAvailable: string;
      elevatedToggle: string;
      elevatedSend: string;
      currentLevel: string;
    };
    reactions: {
      header: string;
      minimal: {
        intro: string;
        instruction: string;
        list: string[];
        guideline: string;
      };
      extensive: {
        intro: string;
        instruction: string;
        list: string[];
        guideline: string;
      };
    };
    reasoningFormat: {
      header: string;
      hint: string;
    };
    projectContext: {
      header: string;
      loaded: string;
      soul: string;
    };
    cli: {
      header: string;
      description: string;
      gatewayManagement: string;
      helpAdvice: string;
    };
    selfUpdate: {
      header: string;
      explicitOnly: string;
      noImplicit: string;
      actions: string;
      restartPing: string;
    };
    skills: {
      header: string;
      scan: string;
      match: string;
      multiple: string;
      none: string;
      constraints: string;
    };
    memory: {
      header: string;
      instruction: string;
    };
    userIdentity: {
      header: string;
    };
    dateTime: {
      header: string;
      timeZone: string;
    };
    workspace: {
      header: string;
      directory: string;
      instruction: string;
      filesHeader: string;
      filesInstruction: string;
    };
    docs: {
      header: string;
      moltbotDocs: string;
      mirror: string;
      source: string;
      community: string;
      hub: string;
      localFirst: string;
      status: string;
    };
    runtime: {
      header: string;
      reasoning: string;
    };
    silentReplies: {
      header: string;
      instruction: string;
      rules: string;
      ruleEntire: string;
      ruleAppend: string;
      ruleWrap: string;
      wrong1: string;
      wrong2: string;
      right: string;
    };
    heartbeats: {
      header: string;
      prompt: string;
      instruction: string;
      ack: string;
      attention: string;
    };
    messaging: {
      header: string;
      replyCurrent: string;
      crossSession: string;
      noExec: string;
      toolHeader: string;
      proactive: string;
      sendArgs: string;
      multiChannel: string;
      silentReply: string;
      inlineButtons: string;
      noButtons: string;
    };
  };
};
