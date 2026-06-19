/**
 * @file `@moku-labs/common/cli` — branded interactive prompts (`confirm` y/N and
 * `select` one-of-N) styled with the brand `◆` marker, the dim hint, and the cyan `›`
 * caret, so a guided flow in any Moku CLI looks the same. Built on `node:readline`; the
 * input/output streams and the choices-block sink are injectable so tests drive prompts
 * without a real TTY. Off a color TTY (CI/pipes) every prompt degrades to a plain form.
 */
import { createInterface } from "node:readline";
import { makePalette, type Palette, supportsColor, supportsTruecolor, visibleWidth } from "./ansi";

/** Default prompt rail width — matches the brand console so hints align with other rows. */
const DEFAULT_WIDTH = 66;

/** Matches an explicit affirmative answer (`y`/`yes`, case-insensitive). */
const YES_PATTERN = /^y(es)?$/i;

/**
 * Options for {@link createBrandPrompts}. All optional: the defaults read `process.stdin`
 * and write to stdout with auto-detected color, while tests inject streams + a capturing
 * choices-block sink.
 *
 * @example
 * const prompts = createBrandPrompts({ color: false });
 */
export type BrandPromptsOptions = {
  /** Force color on/off. Defaults to `supportsColor()` (TTY + `NO_COLOR` unset). */
  color?: boolean;
  /** Force 24-bit truecolor on/off. Defaults to `supportsTruecolor()` (`COLORTERM`). */
  truecolor?: boolean;
  /** Prompt rail width the styled hint right-aligns to. Defaults to `66`. */
  width?: number;
  /** Readable stream the answer is read from. Defaults to `process.stdin`. */
  input?: NodeJS.ReadableStream;
  /** Writable stream readline echoes to. Defaults to `process.stdout`. */
  output?: NodeJS.WritableStream;
  /** Sink for the multi-line `select` choices block. Defaults to `console.log`. */
  write?: (block: string) => void;
};

/**
 * The branded prompts surface: a y/N {@link BrandPrompts.confirm} and a one-of-N
 * {@link BrandPrompts.select}.
 *
 * @example
 * const prompts = createBrandPrompts();
 * if (await prompts.confirm("Deploy?")) deploy();
 */
export type BrandPrompts = {
  /**
   * Ask a yes/no question; resolves `true` only on an explicit `y`/`yes` (default `No`).
   *
   * @param question - The yes/no question to display.
   * @returns Resolves `true` when the user answered yes.
   * @example
   * await prompts.confirm("Deploy dist/ to Cloudflare Pages?");
   */
  confirm(question: string): Promise<boolean>;
  /**
   * Present `choices` numbered from 1 and resolve the chosen zero-based index (empty or
   * out-of-range falls back to `0`).
   *
   * @param question - The prompt to display.
   * @param choices - The selectable option labels.
   * @returns Resolves the chosen zero-based index.
   * @example
   * await prompts.select("Trigger?", ["Auto on push", "Manual only"]);
   */
  select(question: string, choices: readonly string[]): Promise<number>;
};

/**
 * Create {@link BrandPrompts} bound to a color mode + streams. Styling matches the brand
 * console (the `◆` marker, dim hints, cyan caret); off a color TTY every prompt uses the
 * plain `question [y/N]` / `question [1-N]` form.
 *
 * @param options - Optional color/width overrides and injectable streams/sink (see
 *   {@link BrandPromptsOptions}).
 * @returns The branded prompts.
 * @example
 * const prompts = createBrandPrompts();
 * const i = await prompts.select("Workflow?", ["Auto", "Manual"]);
 */
export function createBrandPrompts(options: BrandPromptsOptions = {}): BrandPrompts {
  const color = options.color ?? supportsColor();
  const truecolor = options.truecolor ?? (color && supportsTruecolor());
  const palette: Palette = makePalette(color, truecolor);
  const width = options.width ?? DEFAULT_WIDTH;
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  // biome-ignore lint/suspicious/noConsole: interactive prompt writes the question + choices to stdout.
  const write = options.write ?? ((block: string) => console.log(block));

  /**
   * Build the y/N prompt string: the styled `◆ question … y / N ›` rail on a color TTY,
   * else the plain `question [y/N] ` form.
   *
   * @param question - The yes/no question to display.
   * @returns The readline prompt string.
   * @example
   * confirmPrompt("Deploy?");
   */
  const confirmPrompt = (question: string): string => {
    if (!color) return `${question} [y/N] `;
    const left = `  ${palette.pink("◆")} ${question}`;
    const right = `${palette.dim("y / N")} ${palette.cyan("›")} `;
    const gap = Math.max(1, width - visibleWidth(left) - visibleWidth(right));
    return `${left}${" ".repeat(gap)}${right}`;
  };

  /**
   * Build the select choices block: the styled `◆ question` head + dim-numbered rows on a
   * color TTY, else the plain `  N) label` list.
   *
   * @param question - The prompt shown above the choices (styled mode only).
   * @param choices - The selectable option labels.
   * @returns The multi-line choices block.
   * @example
   * choicesBlock("Pick", ["a", "b"]);
   */
  const choicesBlock = (question: string, choices: readonly string[]): string => {
    if (!color) return choices.map((choice, index) => `  ${index + 1}) ${choice}`).join("\n");
    const head = `  ${palette.pink("◆")} ${question}`;
    const rows = choices.map(
      (choice, index) => `      ${palette.dim(String(index + 1))}  ${choice}`
    );
    return [head, ...rows].join("\n");
  };

  /**
   * Build the select input prompt: the dim `pick 1–N ›` hint on a color TTY, else the
   * plain `question [1-N] ` form.
   *
   * @param question - The prompt (used only by the plain fallback).
   * @param count - The number of choices.
   * @returns The readline prompt string.
   * @example
   * selectPrompt("Pick", 3);
   */
  const selectPrompt = (question: string, count: number): string => {
    if (!color) return `${question} [1-${count}] `;
    const hint = palette.dim(`pick 1–${count}`);
    const caret = palette.cyan("›");
    return `    ${hint} ${caret} `;
  };

  return {
    /**
     * Ask a yes/no question; resolves `true` only on an explicit `y`/`yes`.
     *
     * @param question - The yes/no question to display.
     * @returns Resolves `true` when the user answered yes.
     * @example
     * await prompts.confirm("Deploy?");
     */
    confirm(question) {
      return new Promise<boolean>(resolve => {
        const readline = createInterface({ input, output });
        readline.question(confirmPrompt(question), answer => {
          readline.close();
          resolve(YES_PATTERN.test(answer.trim()));
        });
      });
    },
    /**
     * Present `choices` numbered from 1 and resolve the chosen zero-based index.
     *
     * @param question - The prompt to display.
     * @param choices - The selectable option labels.
     * @returns Resolves the chosen zero-based index (`0` for empty/out-of-range).
     * @example
     * await prompts.select("Pick", ["a", "b"]);
     */
    select(question, choices) {
      return new Promise<number>(resolve => {
        const readline = createInterface({ input, output });
        write(choicesBlock(question, choices));
        readline.question(selectPrompt(question, choices.length), answer => {
          readline.close();
          const picked = Number.parseInt(answer.trim(), 10);
          const valid = Number.isInteger(picked) && picked >= 1 && picked <= choices.length;
          resolve(valid ? picked - 1 : 0);
        });
      });
    }
  };
}
