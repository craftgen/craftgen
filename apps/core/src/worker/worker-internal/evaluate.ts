// @ts-ignore
import unescapeJS from "unescape-js";

import { JSLibraries, libraryReservedIdentifiers } from "../js-library";
import DOM_APIS from "./dom";
import indirectEval from "./eval";

export const ScriptTemplate = "<<string>>";
const beginsWithLineBreakRegex = /^\s+|\s+$/;
export type EvalContext = Record<string, any>;

export enum EvaluationScriptType {
  ASYNC_ANONYMOUS_FUNCTION = "ASYNC_ANONYMOUS_FUNCTION",
}

export const EvaluationScripts: Record<EvaluationScriptType, string> = {
  [EvaluationScriptType.ASYNC_ANONYMOUS_FUNCTION]: `
        async function $$closedFn (script) {
            const $$userFunction = script;
            const $$result = $$userFunction?.apply(THIS_CONTEXT, ARGUMENTS);
            return await $$result;
        }

        $$closedFn(${ScriptTemplate})
    `,
};

export function evaluateAsync(userScript: string, evalArguments: any[]) {
  resetWorkerGlobalScope();
  const { script } = getUserScriptToEvaluate(userScript);
  setEvalContext(evalArguments);

  // TODO: Error handling.
  const result = indirectEval(script);
  return result;
}

function getScriptToEval(
  userScript: string,
  type: EvaluationScriptType,
): string {
  // Using replace here would break scripts with replacement patterns (ex: $&, $$)
  const buffer = EvaluationScripts[type].split(ScriptTemplate);
  return `${buffer[0]}${userScript}${buffer[1]}`;
}

function getUserScriptToEvaluate(userScript: string) {
  const unescapedJS = sanitizeScript(userScript);
  if (!unescapedJS.length) return { script: "" };

  const script = getScriptToEval(
    unescapedJS,
    EvaluationScriptType.ASYNC_ANONYMOUS_FUNCTION,
  );
  return { script };
}

function sanitizeScript(js: string) {
  // We remove any line breaks from the beginning of the script because that
  // makes the final function invalid. We also unescape any escaped characters
  // so that eval can happen
  const trimmedJS = js.replace(beginsWithLineBreakRegex, "");
  return (self as any).evaluationVersion > 1
    ? trimmedJS
    : unescapeJS(trimmedJS);
}

const topLevelWorkerAPIs = Object.keys(self).reduce((acc, key: string) => {
  acc[key] = true;
  return acc;
}, {} as any);

function resetWorkerGlobalScope() {
  for (const key of Object.keys(self)) {
    if (topLevelWorkerAPIs[key] || DOM_APIS[key]) continue;
    //TODO: Remove this once we have a better way to handle this
    if (["evaluationVersion", "window", "document", "location"].includes(key))
      continue;
    if (JSLibraries.find((lib) => lib.accessor.includes(key))) continue;
    if (libraryReservedIdentifiers[key]) continue;

    try {
      // @ts-expect-error: Types are not available
      delete self[key];
    } catch (e) {
      // @ts-expect-error: Types are not available
      self[key] = undefined;
    }
  }
}

// TODO: Pass arguments
// TODO: Pass context
export function setEvalContext(evalArguments: any[]) {
  const EVAL_CONTEXT: EvalContext = {};

  ///// Adding callback data
  EVAL_CONTEXT.ARGUMENTS = evalArguments;

  //// Adding contextual data not part of data tree
  // EVAL_CONTEXT.THIS_CONTEXT = context?.thisContext || {};
  EVAL_CONTEXT.THIS_CONTEXT = {};

  Object.assign(self, EVAL_CONTEXT);
}
