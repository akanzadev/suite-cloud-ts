/**
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType MapReduceScript
 */

import { EntryPoints } from 'N/types'
import * as log from 'N/log'
import * as search from 'N/search'
import * as task from 'N/task'

interface InventoryItem {
    internalId: string
    name: string
    displayName: string
    description: string
    type: string
    basePrice: string
}

interface MapResult {
    item: InventoryItem
    ok: boolean
    error: string
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

        const inventoryItemSearch = search.load({ id: 'customsearch916' })

        const searchResult = inventoryItemSearch
            .run()
            .getRange({ start: 0, end: 1000 })
        log.debug(
            '🚀 ~ file: TEK - Send Inventory Items (MR).ts:44 ~ searchResult:',
            searchResult
        )

        const rta: InventoryItem[] = searchResult
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
                }
            })
            .filter((item) => Object.values(item).every((value) => value))

        // log.debug(
        //     '🚀 ~ file: TEK - Send Inventory Items (MR).ts:69 ~ rta:',
        //     rta
        // )

        return rta
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
        context.write({ key: item.internalId, value: JSON.stringify(response) })
    } catch (e) {
        log.error('map', e)
        context.write({ key: item.internalId, value: JSON.stringify(response) })
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

        const taskExecuted = task
            .create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: 'customscript952',
                deploymentId: 'customdeploy1',
                params: {
                    custscript1: JSON.stringify(oks),
                },
            })
            .submit()
        log.debug(
            '🚀 ~ file: TEK - Send Inventory Items (MR).ts:135 ~ taskExecuted:',
            taskExecuted
        )
    } catch (e) {
        log.error('summarize', e)
    }
}
