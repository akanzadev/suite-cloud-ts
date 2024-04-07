/**
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType MapReduceScript
 */

import { EntryPoints } from 'N/types'
import * as log from 'N/log'
import * as search from 'N/search'
import * as file from 'N/file'
import * as runtime from 'N/runtime'
import * as task from 'N/task'

class Schedule {
    private _scriptId: string
    private _deploymentId: string
    private _params: { [key: string]: string | number | boolean }

    constructor(
        scriptId: string,
        deploymentId: string,
        params: { [key: string]: string | number | boolean }
    ) {
        this._scriptId = scriptId
        this._deploymentId = deploymentId
        this._params = params
    }

    public execute(): void {
        task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: this._scriptId,
            deploymentId: this._deploymentId,
            params: this._params,
        }).submit()
    }
}

interface PriceInterval {
    interval: string
    unitPrice: string
}

interface PriceLevel {
    id: string
    name: string
    priceIntervals: PriceInterval[]
}
interface Currency {
    id: string
    name: string
    priceLevels: {
        [priceLevelId: string]: PriceLevel
    }
}

interface InventoryItem {
    id: string
    name: string
    displayName: string
    description: string
    type: string
    basePrice: string
    currencies: {
        [currencyId: string]: Currency
    }
}

interface InventoryItems {
    [itemId: string]: InventoryItem
}

interface MapResult {
    item: InventoryItem
    ok: boolean
    error: string | null
}

/**
 * @description Get all Inventory Items
 * @param {EntryPoints.MapReduce.getInputDataContext} context
 * @returns {Array<InventoryItem>}
 */
export function getInputData(
    context: EntryPoints.MapReduce.getInputDataContext
): Array<InventoryItem> {
    try {
        log.audit('getInputData', context)

        const inventoryItemSearch = _getInventoryItems()

        return Object.values(inventoryItemSearch)
    } catch (e) {
        log.error('getInputData', e)
        return []
    }
}

/**
 * @description Map Inventory Items
 * @param {EntryPoints.MapReduce.mapContext} context
 * @returns {void}
 */
export function map(context: EntryPoints.MapReduce.mapContext): void {
    log.audit('map', context)
    const item: InventoryItem = JSON.parse(context.value)

    const response: MapResult = { item, ok: true, error: null }

    try {
        context.write({ key: item.id, value: JSON.stringify(response) })
    } catch (e) {
        log.error('map', e)
        context.write({ key: item.id, value: JSON.stringify(response) })
    }
}

// export function reduce(): void {}

/**
 * @description Summarize Inventory Items
 * @param {EntryPoints.MapReduce.summarizeContext} context
 * @returns {void}
 */
export function summarize(
    context: EntryPoints.MapReduce.summarizeContext
): void {
    log.audit('summarize', context)
    try {
        const oks: MapResult[] = []
        const errors: MapResult[] = []

        context.output.iterator().each((key, value) => {
            const rta: MapResult = JSON.parse(value)
            if (rta.ok) oks.push(rta)
            else errors.push(rta)
            return true
        })

        log.debug('oks.length', oks.length)
        log.debug('errors.length', errors.length)

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
                    currencies: Object.values(item.currencies).map(
                        (currency) => {
                            return {
                                id: currency.id,
                                name: currency.name,
                                priceLevels: Object.values(
                                    currency.priceLevels
                                ).map((priceLevel) => {
                                    return {
                                        id: priceLevel.id,
                                        name: priceLevel.name,
                                        priceIntervals:
                                            priceLevel.priceIntervals,
                                    }
                                }),
                            }
                        }
                    ),
                }
            })

        const itemsParsed2 = oks.map((ok) => {
            const {
                id,
                name,
                displayName,
                description,
                type,
                basePrice,
                currencies,
            } = ok.item

            const parsedCurrencies = Object.values(currencies).map(
                (currency) => {
                    const { id, name, priceLevels } = currency

                    const parsedPriceLevels = Object.values(priceLevels).map(
                        (priceLevel) => {
                            const { id, name, priceIntervals } = priceLevel
                            return { id, name, priceIntervals }
                        }
                    )

                    return {
                        id,
                        name,
                        priceLevels: parsedPriceLevels,
                    }
                }
            )

            return {
                id,
                name,
                displayName,
                description,
                type,
                basePrice,
                currencies: parsedCurrencies,
            }
        })

        const itemsParsed3 = oks.map(({ item }) => ({
            ...item,
            currencies: Object.values(item.currencies).map(
                ({ id, name, priceLevels }) => ({
                    id,
                    name,
                    priceLevels: Object.values(priceLevels).map(
                        ({ id, name, priceIntervals }) => ({
                            id,
                            name,
                            priceIntervals,
                        })
                    ),
                })
            ),
        }))

        log.debug(
            '🚀 ~ file: TEK - Send Inventory Items (MR).ts:151 ~ itemsParsed:',
            itemsParsed[0]
        )
        log.debug(
            '🚀 ~ file: TEK - Send Inventory Items (MR).ts:151 ~ itemsParsed2:',
            itemsParsed2[0]
        )
        log.debug(
            '🚀 ~ file: TEK - Send Inventory Items (MR).ts:151 ~ itemsParsed3:',
            itemsParsed3[0]
        )

        const folderId = runtime
            .getCurrentScript()
            .getParameter({ name: 'custscript_tek_send_inv_items_folder' })
            .toString()
        log.debug(
            '🚀 ~ file: TEK - Send Inventory Items (MR).ts:158 ~ folderId:',
            folderId
        )

        const fileId = _saveFile(
            JSON.stringify(itemsParsed),
            parseInt(folderId)
        )

        const scriptId = runtime
            .getCurrentScript()
            .getParameter({ name: 'custscript_tek_send_inv_items_script_sch' })
            .toString()
        log.debug(
            '🚀 ~ file: TEK - Send Inventory Items (MR).ts:165 ~ scriptId:',
            scriptId
        )

        const deploymentId = runtime
            .getCurrentScript()
            .getParameter({ name: 'custscript_tek_send_inv_items_deploy_sch' })
            .toString()
        log.debug(
            '🚀 ~ file: TEK - Send Inventory Items (MR).ts:174 ~ deploymentId:',
            deploymentId
        )

        if (!fileId) throw new Error('No se pudo guardar el archivo')

        new Schedule(scriptId, deploymentId, {
            custscript_tek_send_inv_file_id: fileId.toString(),
        }).execute()

        // const taskExecuted =
        //     fileId &&
        //     task
        //         .create({
        //             taskType: task.TaskType.SCHEDULED_SCRIPT,
        //             scriptId,
        //             deploymentId,
        //             params: { custscript_tek_send_inv_file_id: fileId.toString() },
        //         })
        //         .submit()
    } catch (e) {
        log.error('summarize', e)
    }
}

/**
 * @description Get all Inventory Items
 * @returns {InventoryItems}
 */
function _getInventoryItems(): InventoryItems {
    const rta: InventoryItems = {}

    try {
        let smallResult = false
        let minInterval = 0
        let maxInterval = 1000

        const inventoryItemsSearch = search.load({
            id: 'customsearch_tek_inventory_items',
        })

        // const columns: search.Columns[] = []

        // const filters: search.CreateSearchFilterOptions[] = []

        const inventoryItemsResult = inventoryItemsSearch.run()

        let auxResult
        while (!smallResult) {
            auxResult = inventoryItemsResult.getRange({
                start: minInterval,
                end: maxInterval,
            })
            if (auxResult != null) {
                if (auxResult.length != 1000) smallResult = true
                for (let i = 0; i < auxResult.length; i++) {
                    const columns = auxResult[i].columns
                    // * Main
                    const id = auxResult[i].getValue(columns[0]).toString()
                    const name = auxResult[i].getValue(columns[1]).toString()
                    const displayName = auxResult[i]
                        .getValue(columns[2])
                        .toString()
                    const description = auxResult[i]
                        .getValue(columns[3])
                        .toString()
                    const type = auxResult[i].getValue(columns[4]).toString()
                    const basePrice = auxResult[i]
                        .getValue(columns[5])
                        .toString()

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
                        }
                    }

                    // * MultiCurrency
                    const currencyId = auxResult[i]
                        .getValue(columns[6])
                        .toString()
                    const currencyText = auxResult[i]
                        .getValue(columns[7])
                        .toString()
                    const priceLevelId = auxResult[i]
                        .getValue(columns[8])
                        .toString()
                    const priceLevelText = auxResult[i]
                        .getValue(columns[9])
                        .toString()
                    const unitPrice = auxResult[i]
                        .getValue(columns[10])
                        .toString()
                    const interval = auxResult[i]
                        .getValue(columns[11])
                        .toString()

                    // Si la moneda aún no está en el objeto de currencies, inicialízala
                    if (!rta[id].currencies[currencyId]) {
                        rta[id].currencies[currencyId] = {
                            id: currencyId,
                            name: currencyText,
                            priceLevels: {},
                        }
                    }

                    // Si el nivel de precio aún no está en el objeto de priceLevels de la moneda, inicialízalo
                    if (
                        !rta[id].currencies[currencyId].priceLevels[
                            priceLevelId
                        ]
                    ) {
                        rta[id].currencies[currencyId].priceLevels[
                            priceLevelId
                        ] = {
                            id: priceLevelId,
                            name: priceLevelText,
                            priceIntervals: [{ interval, unitPrice }],
                        }
                    } else {
                        rta[id].currencies[currencyId].priceLevels[
                            priceLevelId
                        ].priceIntervals.push({ interval, unitPrice })
                    }
                }

                minInterval = maxInterval
                maxInterval = maxInterval + 1000
            } else {
                smallResult = true
            }
        }
    } catch (e) {
        log.error('getInventoryItems', e)
    }

    return rta
}

/**
 * @description Save File
 * @param {string} data
 * @param {number} folderId
 * @returns {number}
 */
const _saveFile = (data: string, folderId: number) => {
    try {
        const nameFile = 'TEK - Inventory Items'

        const newFile = file.create({
            name: nameFile,
            fileType: file.Type.PLAINTEXT,
            contents: data,
            folder: folderId,
        })

        const filedId = newFile.save()
        log.debug(
            '🚀 ~ file: TEK - Send Inventory Items (MR).ts:302 ~ saveFile ~ filedId:',
            filedId
        )

        return filedId
    } catch (e) {
        log.error('saveFile', e)
    }
}
