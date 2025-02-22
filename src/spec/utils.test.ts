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
        const sleepMilliseconds = 100

        const start = Date.now()
        await sleep(sleepMilliseconds)
        const end = Date.now()

        // safe margin to github actions pipeline
        expect(end - start).toBeGreaterThanOrEqual(sleepMilliseconds - 10)
    })

    it('should abort the operation when context is cancelled immediatly', async () => {
        const controler = new AbortController()
        controler.abort()

        const promise = sleep(2*second, controler.signal)
    
        await expect(promise).rejects.toThrow('Operation aborted')
    })

    it('should abort the operation when context is cancelled after a while', async () => {
        const controler = new AbortController()
        setTimeout(() => controler.abort(), 100)

        const promise = sleep(2*second, controler.signal)
        
        await expect(promise).rejects.toThrow('Operation aborted')
    })

    
})