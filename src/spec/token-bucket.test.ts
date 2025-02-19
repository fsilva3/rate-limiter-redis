import {
    it,
    describe,
    expect,
    beforeEach,
    vi,
    afterEach
} from 'vitest'
import TokenBucket from '../token-bucket'

const second = 1000

describe('TokenBucket Test', () => {

    beforeEach(async () => {})
    afterEach(async () => {})

    it('should create an instance of TokenBucket class and filling the tokens on Redis', async () => {
        const bucket = await TokenBucket.create({ capacity: 10, refillInterval: (10*second) })

        const count = await bucket.getTotalTokens()
        await bucket.clearTokens()
        
        expect(bucket).toBeInstanceOf(TokenBucket)
        expect(count).toBe(10)
    })

    it('should take a token from the bucket', async () => {
        const date = new Date(2025, 1, 18, 13)
        vi.setSystemTime(date)

        const refillInterval = (10*second)
        const bucket = await TokenBucket.create({ capacity: 10, refillInterval: refillInterval })
        const token = await bucket.take()

        await bucket.clearTokens()

        expect(token.value).not.toBeNull()
        expect(token.timestamp).toEqual(date.getTime())
        expect(token.delay).toEqual(refillInterval)
    })

    it('shouldn\'t take a token when the bucket has all tokens taken', async () => {
        const date = new Date(2025, 1, 18, 13)
        vi.setSystemTime(date)

        const refillInterval = (10*second)
        const bucket = await TokenBucket.create({ capacity: 1, refillInterval: refillInterval })

        const tokens = []
        while (tokens.length < 2) {
            tokens.push(await bucket.take())
        }

        await bucket.clearTokens()

        const emptyToken = tokens[tokens.length-1]
        expect(emptyToken.value).toBeNull()
        expect(emptyToken.message).toEqual('No tokens available')
        expect(emptyToken.timestamp).toEqual(0)
        expect(emptyToken.delay).toEqual(refillInterval)
    })

    it('should block I/O for n milliseconds and retrieve a new token when calling delay method', async () => {
        const bucket = await TokenBucket.create({ capacity: 1, refillInterval: (3*second) })

        const refillSpy = vi.spyOn(bucket, 'refill')
        bucket.refill()

        const tokens = []
        while (tokens.length < 2) {
            // simulate when hasn't tokens available
            const ohMyToken = await bucket.take()
            tokens.push(ohMyToken)
        }
        
        const emptyToken = tokens[tokens.length - 1]
        await bucket.delay(emptyToken)

        await bucket.clearTokens()

        expect(refillSpy).toHaveBeenCalledTimes(1)
        expect(emptyToken.value).not.toBeNull()
        expect(emptyToken.timestamp).not.toEqual(0)
    })
})