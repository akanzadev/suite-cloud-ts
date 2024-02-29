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
define(["require", "exports", "N/log", "N/search", "N/file", "N/runtime", "N/task"], function (require, exports, log, search, file, runtime, task) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.summarize = exports.map = exports.getInputData = void 0;
    log = __importStar(log);
    search = __importStar(search);
    file = __importStar(file);
    runtime = __importStar(runtime);
    task = __importStar(task);
    /**
     * @description Get all Inventory Items
     * @param {EntryPoints.MapReduce.getInputDataContext} context
     * @returns {Array<InventoryItem>}
     */
    function getInputData(context) {
        try {
            log.audit('getInputData', context);
            const inventoryItemSearch = _getInventoryItems();
            return Object.values(inventoryItemSearch);
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
            context.write({ key: item.id, value: JSON.stringify(response) });
        }
        catch (e) {
            log.error('map', e);
            context.write({ key: item.id, value: JSON.stringify(response) });
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
            const itemsParsed = oks
                .map((ok) => ok.item)
                .map((item) => {
                return {
                    id: item.id,
                    name: item.name,
                    displayName: item.displayName,
                    description: item.description,
                    type: item.type,
                    basePrice: item.basePrice,
                    currencies: Object.values(item.currencies).map((currency) => {
                        return {
                            id: currency.id,
                            currency: currency.currency,
                            priceLevels: Object.values(currency.priceLevels).map((priceLevel) => {
                                return {
                                    id: priceLevel.id,
                                    priceLevel: priceLevel.priceLevel,
                                    priceIntervals: priceLevel.priceIntervals,
                                };
                            }),
                        };
                    }),
                };
            });
            log.debug('🚀 ~ file: TEK - Send Inventory Items (MR).ts:151 ~ itemsParsed:', itemsParsed[0]);
            const folderId = runtime
                .getCurrentScript()
                .getParameter({ name: 'custscript_tek_send_inv_items_folder' })
                .toString();
            log.debug('🚀 ~ file: TEK - Send Inventory Items (MR).ts:158 ~ folderId:', folderId);
            const fileId = _saveFile(JSON.stringify(itemsParsed), parseInt(folderId));
            const scriptId = runtime
                .getCurrentScript()
                .getParameter({ name: 'custscript_tek_send_inv_items_script_sch' })
                .toString();
            log.debug('🚀 ~ file: TEK - Send Inventory Items (MR).ts:165 ~ scriptId:', scriptId);
            const deploymentId = runtime
                .getCurrentScript()
                .getParameter({ name: 'custscript_tek_send_inv_items_deploy_sch' })
                .toString();
            log.debug('🚀 ~ file: TEK - Send Inventory Items (MR).ts:174 ~ deploymentId:', deploymentId);
            const taskExecuted = fileId &&
                task
                    .create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId,
                    deploymentId,
                    params: { custscript1: fileId.toString() },
                })
                    .submit();
            log.debug('🚀 ~ file: TEK - Send Inventory Items (MR).ts:135 ~ taskExecuted:', taskExecuted);
        }
        catch (e) {
            log.error('summarize', e);
        }
    }
    exports.summarize = summarize;
    /**
     * @description Get all Inventory Items
     * @returns {InventoryItems}
     */
    function _getInventoryItems() {
        const rta = {};
        try {
            let smallResult = false;
            let minInterval = 0;
            let maxInterval = 1000;
            const inventoryItemsSearch = search.load({
                id: 'customsearch_tek_inventory_items',
            });
            // const columns: search.Columns[] = []
            // const filters: search.CreateSearchFilterOptions[] = []
            const inventoryItemsResult = inventoryItemsSearch.run();
            let auxResult;
            while (!smallResult) {
                auxResult = inventoryItemsResult.getRange({
                    start: minInterval,
                    end: maxInterval,
                });
                if (auxResult != null) {
                    if (auxResult.length != 1000)
                        smallResult = true;
                    for (let i = 0; i < auxResult.length; i++) {
                        const columns = auxResult[i].columns;
                        // * Main
                        const id = auxResult[i].getValue(columns[0]).toString();
                        const name = auxResult[i].getValue(columns[1]).toString();
                        const displayName = auxResult[i]
                            .getValue(columns[2])
                            .toString();
                        const description = auxResult[i]
                            .getValue(columns[3])
                            .toString();
                        const type = auxResult[i].getValue(columns[4]).toString();
                        const basePrice = auxResult[i]
                            .getValue(columns[5])
                            .toString();
                        // Si el artículo de inventario aún no está en el objeto, inicialízalo
                        if (!rta[id]) {
                            rta[id] = {
                                id,
                                name,
                                displayName,
                                description,
                                type,
                                basePrice,
                                currencies: {},
                            };
                        }
                        // * MultiCurrency
                        const currencyId = auxResult[i]
                            .getValue(columns[6])
                            .toString();
                        const currencyText = auxResult[i]
                            .getValue(columns[7])
                            .toString();
                        const priceLevelId = auxResult[i]
                            .getValue(columns[8])
                            .toString();
                        const priceLevel = auxResult[i]
                            .getValue(columns[9])
                            .toString();
                        const unitPrice = auxResult[i]
                            .getValue(columns[10])
                            .toString();
                        const interval = auxResult[i]
                            .getValue(columns[11])
                            .toString();
                        // Si la moneda aún no está en el objeto de currencies, inicialízala
                        if (!rta[id].currencies[currencyId]) {
                            rta[id].currencies[currencyId] = {
                                id: currencyId,
                                currency: currencyText,
                                priceLevels: {},
                            };
                        }
                        // Si el nivel de precio aún no está en el objeto de priceLevels de la moneda, inicialízalo
                        if (!rta[id].currencies[currencyId].priceLevels[priceLevelId]) {
                            rta[id].currencies[currencyId].priceLevels[priceLevelId] = {
                                id: priceLevelId,
                                priceLevel: priceLevel,
                                priceIntervals: [{ interval, unitPrice }],
                            };
                        }
                        else {
                            rta[id].currencies[currencyId].priceLevels[priceLevelId].priceIntervals.push({ interval, unitPrice });
                        }
                    }
                    minInterval = maxInterval;
                    maxInterval = maxInterval + 1000;
                }
                else {
                    smallResult = true;
                }
            }
        }
        catch (e) {
            log.error('getInventoryItems', e);
        }
        return rta;
    }
    /**
     * @description Save File
     * @param {string} data
     * @param {number} folderId
     * @returns {number}
     */
    const _saveFile = (data, folderId) => {
        try {
            const nameFile = 'TEK - Inventory Items';
            const newFile = file.create({
                name: nameFile,
                fileType: file.Type.PLAINTEXT,
                contents: data,
                folder: folderId,
            });
            const filedId = newFile.save();
            log.debug('🚀 ~ file: TEK - Send Inventory Items (MR).ts:302 ~ saveFile ~ filedId:', filedId);
            return filedId;
        }
        catch (e) {
            log.error('saveFile', e);
        }
    };
});
