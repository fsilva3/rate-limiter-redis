import {
    it,
    describe,
    expect,
    beforeEach,
    vi,
    afterEach
} from 'vitest'
import TokenBucket from '../token-bucket'
import { Token } from '../types'
import { sleep } from '../utils'

describe('TokenBucket Test', () => {
    const second = 1000
    const tokenPattern = /^[a-z0-9]{5,15}$/

    beforeEach(async () => {})

    afterEach(async () => {
        vi.restoreAllMocks()
    })

    it('should create an instance of TokenBucket class and filling the tokens on Redis', async () => {
        const bucket = await TokenBucket.create({ capacity: 10, interval: (10*second) })

        const count = await bucket.getTotalTokens()
        await bucket.clearTokens()
        
        expect(bucket).toBeInstanceOf(TokenBucket)
        expect(count).toBe(10)
    })

    it('should take a token from the bucket', async () => {
        const date = new Date(2025, 1, 18, 13)
        vi.setSystemTime(date)

        const interval = (10*second)
        const bucket = await TokenBucket.create({ capacity: 10, interval })
        const token = await bucket.take()

        await bucket.clearTokens()

        expect(token?.value).toMatch(tokenPattern)
        expect(token?.timestamp).toEqual(date.getTime())
        expect(token?.remaining).toEqual(9)
    })

    it('shouldn\'t take a token when the bucket has all tokens taken', async () => {
        const date = new Date(2025, 1, 18, 13)
        vi.setSystemTime(date)

        const interval = (10*second)
        const bucket = await TokenBucket.create({ capacity: 1, interval })

        const tokens: unknown[] = []
        while (tokens.length < 2) {
            tokens.push(await bucket.take())
        }

        await bucket.clearTokens()

        const emptyToken = tokens.pop()
        expect(emptyToken).toBeNull()
    })

    it('should block I/O for n milliseconds and retrieve a new token when calling delay method', async () => {
        const bucket = await TokenBucket.create({ capacity: 1, interval: (1*second) })

        const delaySpy = vi.spyOn(bucket, 'delay')

        const tokens: Token[] = []
        while (tokens.length < 2) {
            // simulate when hasn't tokens available
            tokens.push(await bucket.delay())
        }
        
        const lastTokenReceived = tokens.pop()

        await bucket.clearTokens()

        expect(delaySpy).toHaveBeenCalledTimes(3)
        expect(lastTokenReceived?.value).toMatch(tokenPattern)
        expect(lastTokenReceived?.timestamp).not.toEqual(0)
    })

    it('should use a different table name when using settings key', async () => {
        const bucket = await TokenBucket.create({
            capacity: 1,
            interval: (1*second),
            key: 'different-table-name'
        })

        const token: Token = await bucket.delay()

        await bucket.clearTokens()

        expect(token?.value).toMatch(tokenPattern)
    })

    it('should abort the operation when it receives an abort signal immediately', async () => {
        const bucket = await TokenBucket.create({ capacity: 1, interval: (1*second) })

        const controler = new AbortController()
        controler.abort()

        const promise = bucket.delay(controler.signal)

        await expect(promise).rejects.toThrow('Operation aborted')
    })

    it('should abort the operation when it receives an abort signal after a few milliseconds', async () => {
        const bucket = await TokenBucket.create({ capacity: 1, interval: (1*second) })

        bucket.getTotalTokens = vi.fn(async () => {
            await sleep(300)
            return 5
        })

        const controler = new AbortController()
        setTimeout(() => controler.abort(), 50)

        const promise = bucket.take(controler.signal)
        
        await expect(promise).rejects.toThrow('Operation aborted')
    })

    it('should close, disconnect and clear the timer when calling close method', async () => {
        const bucket = await TokenBucket.create({ capacity: 1, interval: (1*second) })

        await bucket.close()

        expect(bucket.isReady()).toBeFalsy()
    })
})