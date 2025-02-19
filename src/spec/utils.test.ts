import {
    it,
    describe,
    expect,
    beforeEach,
    afterEach
} from 'vitest'
import { sleep } from '../utils'

describe('Sleep Function', () => {
    const second: number = 1000

    beforeEach(() => { })

    afterEach(() => { })

    it('should sleep for two seconds', async () => {
        const start = Date.now()
        await sleep(100)

        const end = Date.now()
        const elapsedTime = end - start
        
        expect(elapsedTime).toBeGreaterThanOrEqual(1000)
    })

    it('should abort the operation when context is cancelled immediatly', async () => {
        const controler = new AbortController()
        controler.abort()

        let errorMessage: string = ''
        try {
            await sleep(2*second, controler.signal)
        } catch (err: unknown) {
            if (err instanceof Error) {
                errorMessage = err.message
            } else {
                errorMessage = ''
            }
        }
        
        expect(errorMessage).toEqual('Operation aborted')
    })

    it.skip('should abort the operation when context is cancelled after a while', async () => {
        const controler = new AbortController()
        setTimeout(() => {
            console.log('Aborting...')
            controler.abort()
        }, 100)

        let errorMessage: string = ''
        try {
            await sleep(2*second, controler.signal)
        } catch (err: unknown) {
            if (err instanceof Error) {
                errorMessage = err.message
            } else {
                errorMessage = ''
            }
        }
        
        expect(errorMessage).toEqual('Operation aborted')
    })

    
})