import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { createBrandPrompts } from "../../prompts";

// Run one confirm() with a fresh in-memory stdin/stdout, feeding `answer`.
async function runConfirm(answer: string, color = false): Promise<boolean> {
  const input = new PassThrough();
  const output = new PassThrough();
  output.resume();
  const prompts = createBrandPrompts({ color, input, output });
  const pending = prompts.confirm("Deploy?");
  input.write(`${answer}\n`);
  return pending;
}

// Run one select() with a fresh in-memory stdin/stdout, capturing the choices block.
async function runSelect(
  answer: string,
  choices: readonly string[],
  color = false
): Promise<{ index: number; blocks: string[] }> {
  const input = new PassThrough();
  const output = new PassThrough();
  output.resume();
  const blocks: string[] = [];
  const prompts = createBrandPrompts({ color, input, output, write: block => blocks.push(block) });
  const pending = prompts.select("Pick", choices);
  input.write(`${answer}\n`);
  const index = await pending;
  return { index, blocks };
}

describe("createBrandPrompts.confirm", () => {
  it("resolves true only on an explicit yes", async () => {
    expect(await runConfirm("y")).toBe(true);
    expect(await runConfirm("yes")).toBe(true);
    expect(await runConfirm("YES")).toBe(true);
  });

  it("resolves false on no / empty / anything else", async () => {
    expect(await runConfirm("n")).toBe(false);
    expect(await runConfirm("")).toBe(false);
    expect(await runConfirm("maybe")).toBe(false);
  });

  it("works in styled (color) mode too", async () => {
    expect(await runConfirm("y", true)).toBe(true);
    expect(await runConfirm("n", true)).toBe(false);
  });
});

describe("createBrandPrompts.select", () => {
  it("resolves the chosen zero-based index", async () => {
    const { index, blocks } = await runSelect("2", ["a", "b", "c"]);
    expect(index).toBe(1);
    // Choices block lists every option (plain numbered form).
    expect(blocks.join("\n")).toContain("1) a");
    expect(blocks.join("\n")).toContain("3) c");
  });

  it("falls back to 0 for empty or out-of-range input", async () => {
    const empty = await runSelect("", ["a", "b"]);
    const tooHigh = await runSelect("9", ["a", "b"]);
    const zero = await runSelect("0", ["a", "b"]);
    expect(empty.index).toBe(0);
    expect(tooHigh.index).toBe(0);
    expect(zero.index).toBe(0);
  });

  it("renders the styled choices block in color mode", async () => {
    const { index, blocks } = await runSelect("1", ["a", "b"], true);
    expect(index).toBe(0);
    expect(blocks.join("\n")).toContain("◆");
    expect(blocks.join("\n")).toContain("Pick");
  });
});
