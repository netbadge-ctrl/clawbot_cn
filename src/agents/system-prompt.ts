import type { ReasoningLevel, ThinkLevel } from "../auto-reply/thinking.js";
import { SILENT_REPLY_TOKEN } from "../auto-reply/tokens.js";
import { getTranslations, interpolate, type Locale } from "../i18n/index.js";
import { listDeliverableMessageChannels } from "../utils/message-channel.js";
import type { ResolvedTimeFormat } from "./date-time.js";
import type { EmbeddedContextFile } from "./pi-embedded-helpers.js";

/**
 * Controls which hardcoded sections are included in the system prompt.
 * - "full": All sections (default, for main agent)
 * - "minimal": Reduced sections (Tooling, Workspace, Runtime) - used for subagents
 * - "none": Just basic identity line, no sections
 */
export type PromptMode = "full" | "minimal" | "none";

function buildSkillsSection(params: {
  skillsPrompt?: string;
  isMinimal: boolean;
  readToolName: string;
  t: ReturnType<typeof getTranslations>;
}) {
  if (params.isMinimal) return [];
  const trimmed = params.skillsPrompt?.trim();
  if (!trimmed) return [];
  const { t, readToolName } = params;
  return [
    t.systemPrompt.skills.header,
    t.systemPrompt.skills.scan,
    interpolate(t.systemPrompt.skills.match, { readToolName }),
    t.systemPrompt.skills.multiple,
    t.systemPrompt.skills.none,
    t.systemPrompt.skills.constraints,
    trimmed,
    "",
  ];
}

function buildMemorySection(params: {
  isMinimal: boolean;
  availableTools: Set<string>;
  t: ReturnType<typeof getTranslations>;
}) {
  if (params.isMinimal) return [];
  if (!params.availableTools.has("memory_search") && !params.availableTools.has("memory_get")) {
    return [];
  }
  const { t } = params;
  return [t.systemPrompt.memory.header, t.systemPrompt.memory.instruction, ""];
}

function buildUserIdentitySection(
  ownerLine: string | undefined,
  isMinimal: boolean,
  t: ReturnType<typeof getTranslations>,
) {
  if (!ownerLine || isMinimal) return [];
  return [t.systemPrompt.userIdentity.header, ownerLine, ""];
}

function buildTimeSection(params: {
  userTimezone?: string;
  t: ReturnType<typeof getTranslations>;
}) {
  if (!params.userTimezone) return [];
  const { t } = params;
  return [
    t.systemPrompt.dateTime.header,
    interpolate(t.systemPrompt.dateTime.timeZone, { timeZone: params.userTimezone }),
    "",
  ];
}

function buildReplyTagsSection(isMinimal: boolean, t: ReturnType<typeof getTranslations>) {
  if (isMinimal) return [];
  return [
    t.systemPrompt.replyTags.header,
    t.systemPrompt.replyTags.instruction,
    t.systemPrompt.replyTags.current,
    t.systemPrompt.replyTags.specific,
    t.systemPrompt.replyTags.whitespace,
    t.systemPrompt.replyTags.stripped,
    "",
  ];
}

function buildMessagingSection(params: {
  isMinimal: boolean;
  availableTools: Set<string>;
  messageChannelOptions: string;
  inlineButtonsEnabled: boolean;
  runtimeChannel?: string;
  messageToolHints?: string[];
  t: ReturnType<typeof getTranslations>;
}) {
  if (params.isMinimal) return [];
  const { t, availableTools, messageChannelOptions, inlineButtonsEnabled, runtimeChannel } = params;
  return [
    t.systemPrompt.messaging.header,
    t.systemPrompt.messaging.replyCurrent,
    t.systemPrompt.messaging.crossSession,
    t.systemPrompt.messaging.noExec,
    availableTools.has("message")
      ? [
          "",
          t.systemPrompt.messaging.toolHeader,
          t.systemPrompt.messaging.proactive,
          t.systemPrompt.messaging.sendArgs,
          interpolate(t.systemPrompt.messaging.multiChannel, { channels: messageChannelOptions }),
          t.systemPrompt.messaging.silentReply,
          inlineButtonsEnabled
            ? t.systemPrompt.messaging.inlineButtons
            : runtimeChannel
              ? interpolate(t.systemPrompt.messaging.noButtons, { channel: runtimeChannel })
              : "",
          ...(params.messageToolHints ?? []),
        ]
          .filter(Boolean)
          .join("\n")
      : "",
    "",
  ];
}

function buildVoiceSection(params: { isMinimal: boolean; ttsHint?: string }) {
  if (params.isMinimal) return [];
  const hint = params.ttsHint?.trim();
  if (!hint) return [];
  return ["## Voice (TTS)", hint, ""];
}

function buildDocsSection(params: {
  docsPath?: string;
  isMinimal: boolean;
  readToolName: string;
  t: ReturnType<typeof getTranslations>;
}) {
  const docsPath = params.docsPath?.trim();
  if (!docsPath || params.isMinimal) return [];
  const { t } = params;
  return [
    t.systemPrompt.docs.header,
    interpolate(t.systemPrompt.docs.moltbotDocs, { path: docsPath }),
    t.systemPrompt.docs.mirror,
    t.systemPrompt.docs.source,
    t.systemPrompt.docs.community,
    t.systemPrompt.docs.hub,
    t.systemPrompt.docs.localFirst,
    t.systemPrompt.docs.status,
    "",
  ];
}

export function buildAgentSystemPrompt(params: {
  workspaceDir: string;
  defaultThinkLevel?: ThinkLevel;
  reasoningLevel?: ReasoningLevel;
  extraSystemPrompt?: string;
  ownerNumbers?: string[];
  reasoningTagHint?: boolean;
  toolNames?: string[];
  toolSummaries?: Record<string, string>;
  modelAliasLines?: string[];
  userTimezone?: string;
  userTime?: string;
  userTimeFormat?: ResolvedTimeFormat;
  contextFiles?: EmbeddedContextFile[];
  skillsPrompt?: string;
  heartbeatPrompt?: string;
  docsPath?: string;
  workspaceNotes?: string[];
  ttsHint?: string;
  /** Controls which hardcoded sections to include. Defaults to "full". */
  promptMode?: PromptMode;
  runtimeInfo?: {
    agentId?: string;
    host?: string;
    os?: string;
    arch?: string;
    node?: string;
    model?: string;
    defaultModel?: string;
    channel?: string;
    capabilities?: string[];
    repoRoot?: string;
  };
  messageToolHints?: string[];
  sandboxInfo?: {
    enabled: boolean;
    workspaceDir?: string;
    workspaceAccess?: "none" | "ro" | "rw";
    agentWorkspaceMount?: string;
    browserBridgeUrl?: string;
    browserNoVncUrl?: string;
    hostBrowserAllowed?: boolean;
    elevated?: {
      allowed: boolean;
      defaultLevel: "on" | "off" | "ask" | "full";
    };
  };
  /** Reaction guidance for the agent (for Telegram minimal/extensive modes). */
  reactionGuidance?: {
    level: "minimal" | "extensive";
    channel: string;
  };
  language?: Locale;
}) {
  const t = getTranslations(params.language);
  const coreToolSummaries: Record<string, string> = t.systemPrompt.tooling.extraTools;

  const toolOrder = [
    "read",
    "write",
    "edit",
    "apply_patch",
    "grep",
    "find",
    "ls",
    "exec",
    "process",
    "web_search",
    "web_fetch",
    "browser",
    "canvas",
    "nodes",
    "cron",
    "message",
    "gateway",
    "agents_list",
    "sessions_list",
    "sessions_history",
    "sessions_send",
    "session_status",
    "image",
  ];

  const rawToolNames = (params.toolNames ?? []).map((tool) => tool.trim());
  const canonicalToolNames = rawToolNames.filter(Boolean);
  // Preserve caller casing while deduping tool names by lowercase.
  const canonicalByNormalized = new Map<string, string>();
  for (const name of canonicalToolNames) {
    const normalized = name.toLowerCase();
    if (!canonicalByNormalized.has(normalized)) {
      canonicalByNormalized.set(normalized, name);
    }
  }
  const resolveToolName = (normalized: string) =>
    canonicalByNormalized.get(normalized) ?? normalized;

  const normalizedTools = canonicalToolNames.map((tool) => tool.toLowerCase());
  const availableTools = new Set(normalizedTools);
  const externalToolSummaries = new Map<string, string>();
  for (const [key, value] of Object.entries(params.toolSummaries ?? {})) {
    const normalized = key.trim().toLowerCase();
    if (!normalized || !value?.trim()) continue;
    externalToolSummaries.set(normalized, value.trim());
  }
  const extraTools = Array.from(
    new Set(normalizedTools.filter((tool) => !toolOrder.includes(tool))),
  );
  const enabledTools = toolOrder.filter((tool) => availableTools.has(tool));
  const toolLines = enabledTools.map((tool) => {
    const summary = coreToolSummaries[tool] ?? externalToolSummaries.get(tool);
    const name = resolveToolName(tool);
    return summary ? `- ${name}: ${summary}` : `- ${name}`;
  });
  for (const tool of extraTools.sort()) {
    const summary = coreToolSummaries[tool] ?? externalToolSummaries.get(tool);
    const name = resolveToolName(tool);
    toolLines.push(summary ? `- ${name}: ${summary}` : `- ${name}`);
  }

  const hasGateway = availableTools.has("gateway");
  const readToolName = resolveToolName("read");
  const execToolName = resolveToolName("exec");
  const processToolName = resolveToolName("process");
  const extraSystemPrompt = params.extraSystemPrompt?.trim();
  const ownerNumbers = (params.ownerNumbers ?? []).map((value) => value.trim()).filter(Boolean);
  const ownerLine =
    ownerNumbers.length > 0
      ? `Owner numbers: ${ownerNumbers.join(", ")}. Treat messages from these numbers as the user.`
      : undefined;
  const reasoningHint = params.reasoningTagHint ? t.systemPrompt.reasoningFormat.hint : undefined;
  const reasoningLevel = params.reasoningLevel ?? "off";
  const userTimezone = params.userTimezone?.trim();
  const skillsPrompt = params.skillsPrompt?.trim();
  const heartbeatPrompt = params.heartbeatPrompt?.trim();
  const heartbeatPromptLine = heartbeatPrompt
    ? interpolate(t.systemPrompt.heartbeats.prompt, { prompt: heartbeatPrompt })
    : interpolate(t.systemPrompt.heartbeats.prompt, { prompt: "(configured)" });
  const runtimeInfo = params.runtimeInfo;
  const runtimeChannel = runtimeInfo?.channel?.trim().toLowerCase();
  const runtimeCapabilities = (runtimeInfo?.capabilities ?? [])
    .map((cap) => String(cap).trim())
    .filter(Boolean);
  const runtimeCapabilitiesLower = new Set(runtimeCapabilities.map((cap) => cap.toLowerCase()));
  const inlineButtonsEnabled = runtimeCapabilitiesLower.has("inlinebuttons");
  const messageChannelOptions = listDeliverableMessageChannels().join("|");
  const promptMode = params.promptMode ?? "full";
  const isMinimal = promptMode === "minimal" || promptMode === "none";
  const skillsSection = buildSkillsSection({
    skillsPrompt,
    isMinimal,
    readToolName,
    t,
  });
  const memorySection = buildMemorySection({ isMinimal, availableTools, t });
  const docsSection = buildDocsSection({
    docsPath: params.docsPath,
    isMinimal,
    readToolName,
    t,
  });
  const workspaceNotes = (params.workspaceNotes ?? []).map((note) => note.trim()).filter(Boolean);

  // For "none" mode, return just the basic identity line
  if (promptMode === "none") {
    return t.systemPrompt.intro;
  }

  const lines = [
    t.systemPrompt.intro,
    "",
    t.systemPrompt.tooling.header,
    t.systemPrompt.tooling.availability,
    t.systemPrompt.tooling.caseSensitive,
    toolLines.length > 0
      ? toolLines.join("\n")
      : [
          t.systemPrompt.tooling.standardTools,
          `- grep: ${t.systemPrompt.tooling.extraTools.grep}`,
          `- find: ${t.systemPrompt.tooling.extraTools.find}`,
          `- ls: ${t.systemPrompt.tooling.extraTools.ls}`,
          `- apply_patch: ${t.systemPrompt.tooling.extraTools.apply_patch}`,
          `- ${execToolName}: ${t.systemPrompt.tooling.extraTools.exec}`,
          `- ${processToolName}: ${t.systemPrompt.tooling.extraTools.process}`,
          `- browser: ${t.systemPrompt.tooling.extraTools.browser}`,
          `- canvas: ${t.systemPrompt.tooling.extraTools.canvas}`,
          `- nodes: ${t.systemPrompt.tooling.extraTools.nodes}`,
          `- cron: ${t.systemPrompt.tooling.extraTools.cron}`,
          `- sessions_list: ${t.systemPrompt.tooling.extraTools.sessions_list}`,
          `- sessions_history: ${t.systemPrompt.tooling.extraTools.sessions_history}`,
          `- sessions_send: ${t.systemPrompt.tooling.extraTools.sessions_send}`,
        ].join("\n"),
    t.systemPrompt.tooling.docsDisclaimer,
    t.systemPrompt.tooling.subAgentAdvice,
    "",
    t.systemPrompt.toolCallStyle.header,
    t.systemPrompt.toolCallStyle.default,
    t.systemPrompt.toolCallStyle.narrate,
    t.systemPrompt.toolCallStyle.brief,
    t.systemPrompt.toolCallStyle.plain,
    "",
    t.systemPrompt.cli.header,
    t.systemPrompt.cli.description,
    t.systemPrompt.cli.gatewayManagement,
    t.systemPrompt.cli.helpAdvice,
    "",
    ...skillsSection,
    ...memorySection,
    // Skip self-update for subagent/none modes
    hasGateway && !isMinimal ? t.systemPrompt.selfUpdate.header : "",
    hasGateway && !isMinimal
      ? [
          t.systemPrompt.selfUpdate.explicitOnly,
          t.systemPrompt.selfUpdate.noImplicit,
          t.systemPrompt.selfUpdate.actions,
          t.systemPrompt.selfUpdate.restartPing,
        ].join("\n")
      : "",
    hasGateway && !isMinimal ? "" : "",
    "",
    // Skip model aliases for subagent/none modes
    params.modelAliasLines && params.modelAliasLines.length > 0 && !isMinimal
      ? t.systemPrompt.modelAliases.header
      : "",
    params.modelAliasLines && params.modelAliasLines.length > 0 && !isMinimal
      ? t.systemPrompt.modelAliases.instruction
      : "",
    params.modelAliasLines && params.modelAliasLines.length > 0 && !isMinimal
      ? params.modelAliasLines.join("\n")
      : "",
    params.modelAliasLines && params.modelAliasLines.length > 0 && !isMinimal ? "" : "",
    t.systemPrompt.workspace.header,
    interpolate(t.systemPrompt.workspace.directory, { dir: params.workspaceDir }),
    t.systemPrompt.workspace.instruction,
    ...workspaceNotes,
    "",
    ...docsSection,
    params.sandboxInfo?.enabled ? t.systemPrompt.sandbox.header : "",
    params.sandboxInfo?.enabled
      ? [
          t.systemPrompt.sandbox.intro,
          t.systemPrompt.sandbox.limited,
          t.systemPrompt.sandbox.subAgent,
          params.sandboxInfo.workspaceDir
            ? interpolate(t.systemPrompt.sandbox.workspace, {
                dir: params.sandboxInfo.workspaceDir,
              })
            : "",
          params.sandboxInfo.workspaceAccess
            ? interpolate(t.systemPrompt.sandbox.access, {
                access: params.sandboxInfo.workspaceAccess,
                mount: params.sandboxInfo.agentWorkspaceMount
                  ? ` (mounted at ${params.sandboxInfo.agentWorkspaceMount})`
                  : "",
              })
            : "",
          params.sandboxInfo.browserBridgeUrl ? t.systemPrompt.sandbox.browserBridge : "",
          params.sandboxInfo.browserNoVncUrl
            ? interpolate(t.systemPrompt.sandbox.observer, {
                url: params.sandboxInfo.browserNoVncUrl,
              })
            : "",
          params.sandboxInfo.hostBrowserAllowed === true
            ? t.systemPrompt.sandbox.hostControlAllowed
            : params.sandboxInfo.hostBrowserAllowed === false
              ? t.systemPrompt.sandbox.hostControlBlocked
              : "",
          params.sandboxInfo.elevated?.allowed ? t.systemPrompt.sandbox.elevatedAvailable : "",
          params.sandboxInfo.elevated?.allowed ? t.systemPrompt.sandbox.elevatedToggle : "",
          params.sandboxInfo.elevated?.allowed ? t.systemPrompt.sandbox.elevatedSend : "",
          params.sandboxInfo.elevated?.allowed
            ? interpolate(t.systemPrompt.sandbox.currentLevel, {
                level: params.sandboxInfo.elevated.defaultLevel,
              })
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "",
    params.sandboxInfo?.enabled ? "" : "",
    ...buildUserIdentitySection(ownerLine, isMinimal, t),
    ...buildTimeSection({
      userTimezone,
      t,
    }),
    t.systemPrompt.workspace.filesHeader,
    t.systemPrompt.workspace.filesInstruction,
    "",
    ...buildReplyTagsSection(isMinimal, t),
    ...buildMessagingSection({
      isMinimal,
      availableTools,
      messageChannelOptions,
      inlineButtonsEnabled,
      runtimeChannel,
      messageToolHints: params.messageToolHints,
      t,
    }),
    ...buildVoiceSection({ isMinimal, ttsHint: params.ttsHint }),
  ];

  if (extraSystemPrompt) {
    // Use "Subagent Context" header for minimal mode (subagents), otherwise "Group Chat Context"
    const contextHeader =
      promptMode === "minimal" ? "## Subagent Context" : "## Group Chat Context";
    lines.push(contextHeader, extraSystemPrompt, "");
  }
  if (params.reactionGuidance) {
    const { level, channel } = params.reactionGuidance;
    // Logic for reaction guidance is quite specific, might need further i18n structure if we want to fully support it
    // For now I'll use the provided structured texts in TranslationKeys
    const guidanceText =
      level === "minimal"
        ? [
            interpolate(t.systemPrompt.reactions.minimal.intro, { channel }),
            t.systemPrompt.reactions.minimal.instruction,
            ...t.systemPrompt.reactions.minimal.list,
            t.systemPrompt.reactions.minimal.guideline,
          ].join("\n")
        : [
            interpolate(t.systemPrompt.reactions.extensive.intro, { channel }),
            t.systemPrompt.reactions.extensive.instruction,
            ...t.systemPrompt.reactions.extensive.list,
            t.systemPrompt.reactions.extensive.guideline,
          ].join("\n");

    lines.push(t.systemPrompt.reactions.header, guidanceText, "");
  }
  if (reasoningHint) {
    lines.push(t.systemPrompt.reasoningFormat.header, reasoningHint, "");
  }

  const contextFiles = params.contextFiles ?? [];
  if (contextFiles.length > 0) {
    const hasSoulFile = contextFiles.some((file) => {
      const normalizedPath = file.path.trim().replace(/\\/g, "/");
      const baseName = normalizedPath.split("/").pop() ?? normalizedPath;
      return baseName.toLowerCase() === "soul.md";
    });
    lines.push(t.systemPrompt.projectContext.header, "", t.systemPrompt.projectContext.loaded);
    if (hasSoulFile) {
      lines.push(t.systemPrompt.projectContext.soul);
    }
    lines.push("");
    for (const file of contextFiles) {
      lines.push(`## ${file.path}`, "", file.content, "");
    }
  }

  // Skip silent replies for subagent/none modes
  if (!isMinimal) {
    lines.push(
      t.systemPrompt.silentReplies.header,
      interpolate(t.systemPrompt.silentReplies.instruction, { token: SILENT_REPLY_TOKEN }),
      "",
      t.systemPrompt.silentReplies.rules,
      t.systemPrompt.silentReplies.ruleEntire,
      interpolate(t.systemPrompt.silentReplies.ruleAppend, { token: SILENT_REPLY_TOKEN }),
      t.systemPrompt.silentReplies.ruleWrap,
      "",
      interpolate(t.systemPrompt.silentReplies.wrong1, { token: SILENT_REPLY_TOKEN }),
      interpolate(t.systemPrompt.silentReplies.wrong2, { token: SILENT_REPLY_TOKEN }),
      interpolate(t.systemPrompt.silentReplies.right, { token: SILENT_REPLY_TOKEN }),
      "",
    );
  }

  // Skip heartbeats for subagent/none modes
  if (!isMinimal) {
    lines.push(
      t.systemPrompt.heartbeats.header,
      heartbeatPromptLine,
      t.systemPrompt.heartbeats.instruction,
      t.systemPrompt.heartbeats.ack,
      t.systemPrompt.heartbeats.attention,
      "",
    );
  }

  lines.push(
    t.systemPrompt.runtime.header,
    buildRuntimeLine(runtimeInfo, runtimeChannel, runtimeCapabilities, params.defaultThinkLevel),
    interpolate(t.systemPrompt.runtime.reasoning, { level: reasoningLevel }),
  );

  return lines.filter(Boolean).join("\n");
}

export function buildRuntimeLine(
  runtimeInfo?: {
    agentId?: string;
    host?: string;
    os?: string;
    arch?: string;
    node?: string;
    model?: string;
    defaultModel?: string;
    repoRoot?: string;
  },
  runtimeChannel?: string,
  runtimeCapabilities: string[] = [],
  defaultThinkLevel?: ThinkLevel,
): string {
  return `Runtime: ${[
    runtimeInfo?.agentId ? `agent=${runtimeInfo.agentId}` : "",
    runtimeInfo?.host ? `host=${runtimeInfo.host}` : "",
    runtimeInfo?.repoRoot ? `repo=${runtimeInfo.repoRoot}` : "",
    runtimeInfo?.os
      ? `os=${runtimeInfo.os}${runtimeInfo?.arch ? ` (${runtimeInfo.arch})` : ""}`
      : runtimeInfo?.arch
        ? `arch=${runtimeInfo.arch}`
        : "",
    runtimeInfo?.node ? `node=${runtimeInfo.node}` : "",
    runtimeInfo?.model ? `model=${runtimeInfo.model}` : "",
    runtimeInfo?.defaultModel ? `default_model=${runtimeInfo.defaultModel}` : "",
    runtimeChannel ? `channel=${runtimeChannel}` : "",
    runtimeChannel
      ? `capabilities=${runtimeCapabilities.length > 0 ? runtimeCapabilities.join(",") : "none"}`
      : "",
    `thinking=${defaultThinkLevel ?? "off"}`,
  ]
    .filter(Boolean)
    .join(" | ")}`;
}
