/**
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType ScheduledScript
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
define(["require", "exports", "N/https", "N/log", "N/runtime", "N/format"], function (require, exports, https, log, runtime, format) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.execute = void 0;
    https = __importStar(https);
    log = __importStar(log);
    runtime = __importStar(runtime);
    format = __importStar(format);
    /**
     * @description Get all Inventory Items
     * @param {EntryPoints.MapReduce.getInputDataContext} context
     * @returns {void}
     */
    function execute(context) {
        try {
            log.debug('🚀 ~ file: TEK - Send Inventory (SCHL).ts:35 ~ execute ~ context:', context);
            const body = JSON.parse(runtime
                .getCurrentScript()
                .getParameter({ name: 'custscript1' })
                .toString());
            log.debug('🚀 ~ file: TEK - Send Inventory (SCHL).ts:44 ~ execute ~ body:', body);
            const price = format.format({
                value: '564.564,00',
                type: format.Type.CURRENCY,
            });
            log.debug('🚀 ~ file: TEK - Send Inventory (SCHL).ts:50 ~ execute ~ price:', price);
            format.parse({
                value: price,
                type: format.Type.CURRENCY,
            });
            const price2 = format.format({
                value: '564,564.00',
                type: format.Type.CURRENCY,
            });
            log.debug('🚀 ~ file: TEK - Send Inventory (SCHL).ts:60 ~ execute ~ price2:', price2);
            const response = https.get({
                url: 'https://google.com',
            });
            log.debug('🚀 ~ file: TEK - Send Inventory (SCHL).ts:65 ~ execute ~ response:', response);
        }
        catch (e) {
            log.error({ title: e.name, details: e.message });
        }
    }
    exports.execute = execute;
});
// const _sendInventoryItems = (items: InventoryItem[]): void => {
//     const headers: HeadersInit = {
//         'Content-Type': 'application/json',
//     }
//     const response = https.post({
//         url: 'https://google.com',
//         headers,
//         body: JSON.stringify(items),
//     })
// }
