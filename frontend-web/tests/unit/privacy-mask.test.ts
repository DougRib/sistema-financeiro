import { describe, it, expect } from "vitest";
import { maskValue } from "@/components/ui/PrivacyContext";

describe("maskValue", () => {
  it("returns original when hidden=false", () => {
    expect(maskValue("R$ 1.234,56", false)).toBe("R$ 1.234,56");
  });

  it("masks digits keeping R$ prefix", () => {
    expect(maskValue("R$ 1.234,56", true)).toBe("R$ •••");
  });

  it("preserves negative sign", () => {
    expect(maskValue("-R$ 100,00", true)).toBe("-R$ •••");
  });

  it("preserves positive sign", () => {
    expect(maskValue("+R$ 200,00", true)).toBe("+R$ •••");
  });

  it("handles no-prefix values", () => {
    expect(maskValue("1234", true)).toBe("•••");
  });
});
