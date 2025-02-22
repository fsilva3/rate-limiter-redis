import { RateLimiterException } from './exception'
import { Token, TokenBucketSettings } from './types'
import Bucket from './bucket'
import { sleep } from './utils'

/*
* TokenBucket algorithm implemented using Redis as storage
* @class TokenBucket
* @extends Bucket
* @since 0.0.1
*/
export default class TokenBucket extends Bucket {
    private static readonly BUCKET_NAME: string = 'rate-limiter-tokens'
    private readonly maxDelayRetryCount: number = 5
    private capacity: number = 0
    private interval: number = 0
    private delayRetryCount: number = 0
    private timer: NodeJS.Timeout | null = null
    private startTime: number = 0
    
    constructor(settings: TokenBucketSettings) {
        super()
        this.capacity = settings.capacity
        this.interval = settings.interval
        this.startTime = Date.now()
        this.timer = setInterval(this.refill.bind(this), this.interval)
    }

    private generateToken(): string {
        return Math.random().toString(36).substring(2)
    }

    private getNextExecutionInMilliseconds() {
        const elapsedTime = Date.now() - this.startTime
        const nextExecution = this.interval - Math.ceil(elapsedTime % this.interval)
        
        return nextExecution
    }

    private abortHandler(this: AbortSignal) {
        if (this.aborted) {
            throw new Error('Operation aborted')
        }
    }

    /**
     * Static method to create a new TokenBucket instance to ensure the bucket is refilled
     * @param {TokenBucketSettings} settings - The constructor settings for the Bucket
     * @return {Promise<TokenBucket>} TokenBucket instance
     * @throws {RateLimiterException}
     */
    static async create(settings: TokenBucketSettings): Promise<TokenBucket> {
        try {
            const bucket = new TokenBucket(settings)
            await bucket.connect()
            await bucket.refill()
            return bucket
        } catch (error: unknown) {
            throw new RateLimiterException(`Error creating TokenBucket instance | ${error}`)
        }
    }

    /**
     * If there is tokens available, it takes the token right away, null otherwise
     * @return {Promise<Token | null>} returns a token or null token
     * 
     * @example
     *  const controller = new AbortController()
     *  const token = await bucket.delay(controller.signal)
     *  if (!token) {
     *      // re-queue the message
     *  }
     */
    public async take(context?: AbortSignal): Promise<Token | null> {
        try {
            if (context?.aborted) {
                throw new Error('Operation aborted')
            }
            context?.addEventListener('abort', this.abortHandler)

            const response = await this.client.RPOP(TokenBucket.BUCKET_NAME)
            if (!response) {
                return null
            }

            const token: Token = JSON.parse(response)
            token.remaining = await this.getTotalTokens()

            context?.removeEventListener('abort', this.abortHandler)
            return token
        } catch (error: unknown) {
            throw new RateLimiterException(`Error taking token from bucket | ${error}`)
        }
    }

    /**
     * Block the operation until receive a new token based on the delay time
     * @param {AbortSignal?} context - The context in case wants to abort the request
     * @return {Promise<Token>} The token object
     * 
     * @example
     *  const controller = new AbortController()
     *  const myFreshToken = await bucket.delay(controller.signal)
     *  ...
     *  // call the API
     */
    public async delay(context?: AbortSignal): Promise<Token> {
        if (this.delayRetryCount >= this.maxDelayRetryCount) {
            throw new RateLimiterException('Max delay retries reached out')
        }

        const token = await this.take(context)
        if (token?.value) {
            this.delayRetryCount = 0
            return token
        }

        const delayInMilliseconds = this.getNextExecutionInMilliseconds()
        await sleep(delayInMilliseconds + 10, context)
        this.delayRetryCount += 1

        return this.delay(context)
    }

    /**
     * Refill the token-bucket with new tokens, in case the bucket is not at the full capacity
     * @return {Promise<void>}
     * @throws {RateLimiterException}
     */
    public async refill(): Promise<void> {
        try {
            if (!this.client.isReady) {
                throw new RateLimiterException('Redis client is not ready')
            }

            const countTokens = await this.client.LLEN(TokenBucket.BUCKET_NAME)
            if (countTokens >= this.capacity) {
                return
            }

            const tokens = Array.from({
                length: this.capacity - countTokens
            }, () => {
                return JSON.stringify({
                    value: this.generateToken(),
                    timestamp: Date.now()
                })
            })

            await this.client.LPUSH(TokenBucket.BUCKET_NAME, tokens)
        } catch (error: unknown) {
            throw new RateLimiterException(`Error filling token bucket | ${error}`)
        }
    }

    /**
     * Close the TokenBucket instance, clear the time and disconnect from Redis
     * @return {Promise<void>}
     */
    public async close(): Promise<void> {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
        }

        await this.quit()
        console.log('Closed Token Bucket instance!')
    }

    /**
     * Get the current total of tokens in the bucket
     * @return {Promise<number>}
     */
    public async getTotalTokens(): Promise<number> {
        return this.client.LLEN(TokenBucket.BUCKET_NAME)
    }

    /**
     * Remove all tokens from the bucket
     * @return {Promise<void>}
     */
    public async clearTokens(): Promise<void> {
        await this.client.LTRIM(TokenBucket.BUCKET_NAME, 1, 0)
    }
}