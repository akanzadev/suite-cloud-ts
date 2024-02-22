/**
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType MapReduceScript
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
define(["require", "exports", "N/log", "N/search", "N/task"], function (require, exports, log, search, task) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.summarize = exports.map = exports.getInputData = void 0;
    log = __importStar(log);
    search = __importStar(search);
    task = __importStar(task);
    /**
     * @description Get all Inventory Items
     * @param {EntryPoints.MapReduce.getInputDataContext} context
     * @returns {Array<InventoryItem>}
     */
    function getInputData(context) {
        try {
            log.audit('getInputData', context);
            const inventoryItemSearch = search.load({ id: 'customsearch916' });
            const searchResult = inventoryItemSearch
                .run()
                .getRange({ start: 0, end: 1000 });
            log.debug('🚀 ~ file: TEK - Send Inventory Items (MR).ts:44 ~ searchResult:', searchResult);
            const rta = searchResult
                .map((result) => {
                return {
                    internalId: result
                        .getValue({ name: 'internalid' })
                        .toString(),
                    name: result.getValue({ name: 'itemid' }).toString(),
                    displayName: result
                        .getValue({ name: 'displayname' })
                        .toString(),
                    description: result
                        .getValue({ name: 'salesdescription' })
                        .toString(),
                    type: result.getText({ name: 'type' }).toString(),
                    basePrice: result
                        .getValue({ name: 'baseprice' })
                        .toString(),
                };
            })
                .filter((item) => Object.values(item).every((value) => value));
            // log.debug(
            //     '🚀 ~ file: TEK - Send Inventory Items (MR).ts:69 ~ rta:',
            //     rta
            // )
            return rta;
        }
        catch (e) {
            log.error('getInputData', e);
            return [];
        }
    }
    exports.getInputData = getInputData;
    /**
     * @description Map Inventory Items
     * @param {EntryPoints.MapReduce.mapContext} context
     * @returns {void}
     */
    function map(context) {
        log.audit('map', context);
        const item = JSON.parse(context.value);
        const response = { item, ok: true, error: null };
        try {
            context.write({ key: item.internalId, value: JSON.stringify(response) });
        }
        catch (e) {
            log.error('map', e);
            context.write({ key: item.internalId, value: JSON.stringify(response) });
        }
    }
    exports.map = map;
    // export function reduce(): void {}
    /**
     * @description Summarize Inventory Items
     * @param {EntryPoints.MapReduce.summarizeContext} context
     * @returns {void}
     */
    function summarize(context) {
        log.audit('summarize', context);
        try {
            const oks = [];
            const errors = [];
            context.output.iterator().each((key, value) => {
                const rta = JSON.parse(value);
                if (rta.ok)
                    oks.push(rta);
                else
                    errors.push(rta);
                return true;
            });
            log.debug('oks.length', oks.length);
            log.debug('errors.length', errors.length);
            const taskExecuted = task
                .create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: 'customscript952',
                deploymentId: 'customdeploy1',
                params: {
                    custscript1: JSON.stringify(oks),
                },
            })
                .submit();
            log.debug('🚀 ~ file: TEK - Send Inventory Items (MR).ts:135 ~ taskExecuted:', taskExecuted);
        }
        catch (e) {
            log.error('summarize', e);
        }
    }
    exports.summarize = summarize;
});
