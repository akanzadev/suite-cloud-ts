/**
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType ScheduledScript
 */

import { EntryPoints } from 'N/types'
// import * as https from 'N/https'
import * as log from 'N/log'
import * as runtime from 'N/runtime'
// import * as format from 'N/format'

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
 * @returns {void}
 */
export function execute(context: EntryPoints.Scheduled.executeContext): void {
    try {
        log.debug(
            '🚀 ~ file: TEK - Send Inventory (SCHL).ts:35 ~ execute ~ context:',
            context
        )
        const body: MapResult[] = JSON.parse(
            runtime
                .getCurrentScript()
                .getParameter({ name: 'custscript_tek_send_inv_file_id' })
                .toString()
        )
        log.debug(
            '🚀 ~ file: TEK - Send Inventory (SCHL).ts:44 ~ execute ~ body:',
            body
        )

        // const price = format.format({
        //     value: '564.564,00',
        //     type: format.Type.CURRENCY,
        // })
        // log.debug(
        //     '🚀 ~ file: TEK - Send Inventory (SCHL).ts:50 ~ execute ~ price:',
        //     price
        // )
        // format.parse({
        //     value: price,
        //     type: format.Type.CURRENCY,
        // })

        // const price2 = format.format({
        //     value: '564,564.00',
        //     type: format.Type.CURRENCY,
        // })
        // log.debug(
        //     '🚀 ~ file: TEK - Send Inventory (SCHL).ts:60 ~ execute ~ price2:',
        //     price2
        // )

        // const response = https.get({
        //     url: 'https://google.com',
        // })
        // log.debug(
        //     '🚀 ~ file: TEK - Send Inventory (SCHL).ts:65 ~ execute ~ response:',
        //     response
        // )
    } catch (e) {
        log.error('execute', e)
    }
}

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
