import { describe, it, expect } from "vitest";
import { getTranslations, interpolate } from "./index.js";
import { zh } from "./locales/zh.js";
import { en } from "./locales/en.js";

describe("i18n", () => {
  it("should return english by default", () => {
    const t = getTranslations();
    expect(t).toBe(en);
    expect(t.systemPrompt.intro).toBe("You are a personal assistant running inside Moltbot.");
  });

  it("should return chinese when requested", () => {
    const t = getTranslations("zh");
    expect(t).toBe(zh);
    expect(t.systemPrompt.intro).toBe("您是运行在 Moltbot 内部的个人助手。");
  });

  it("should return english for unknown locale", () => {
    const t = getTranslations("fr");
    expect(t).toBe(en);
  });

  describe("interpolate", () => {
    it("should replace variables", () => {
      const result = interpolate("Hello {{name}}", { name: "World" });
      expect(result).toBe("Hello World");
    });

    it("should leave unknown variables as is", () => {
      const result = interpolate("Hello {{name}}", {});
      expect(result).toBe("Hello {{name}}");
    });
  });
});
