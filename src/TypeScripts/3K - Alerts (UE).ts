/**
 *
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @NScriptType UserEventScript
 */

import { EntryPoints } from "N/types";
import * as log from "N/log";

export function afterSubmit(
  context: EntryPoints.UserEvent.afterSubmitContext
): void {}

export function beforeSubmit(
  context: EntryPoints.UserEvent.beforeSubmitContext
): void {}

export function beforeLoad(
  context: EntryPoints.UserEvent.beforeLoadContext
): void {
  log.debug({ title: "Context", details: context.type });

  const recordObj = context.newRecord;
  const status = recordObj.getValue("custrecord_3k_master_ts_desc");

  log.debug({ title: "Status", details: status });
}
