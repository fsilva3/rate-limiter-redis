import { TBRedisException } from './exception'
import { Token, TokenBucketSettings } from './types'
import Bucket from './bucket'
import { sleep } from './utils'

/*
* TokcenBucket class
*
* @class TokenBucket
* @extends Bucket
* @constructor
* @param {TokenBucketSettings} settings - The settings for the token bucket
*/
export default class TokenBucket extends Bucket {
    private static readonly BUCKET_NAME: string = 'rate-limiter-tokens'
    private readonly maxDelayRetryCount: number = 5
    private capacity: number = 0
    private refillInterval: number = 0
    private delayRetryCount: number = 0
    private timer: NodeJS.Timeout | null = null
    private startTime: number = 0
    
    constructor(settings: TokenBucketSettings) {
        super()
        this.capacity = settings.capacity
        this.refillInterval = settings.refillInterval
        this.startTime = Date.now()
        this.timer = setInterval(this.refill.bind(this), this.refillInterval)
    }

    private generateToken(): string {
        return Math.random().toString(36).substring(2)
    }

    private getNextExecutionInMilliseconds() {
        const elapsedTime = Date.now() - this.startTime
        const nextExecution = this.refillInterval - Math.ceil(elapsedTime % this.refillInterval)
        
        return nextExecution
    }

    private abortHandler(this: AbortSignal) {
        if (this.aborted) {
            throw new Error('Operation aborted')
        }
    }

    /**
     * @function create - Static method to create a new TokenBucket instance to ensure the bucket is refilled
     * @param settings 
     * @returns 
     */
    static async create(settings: TokenBucketSettings): Promise<TokenBucket> {
        try {
            const bucket = new TokenBucket(settings)
            await bucket.connect()
            await bucket.refill()
            return bucket
        } catch (error: unknown) {
            throw new TBRedisException(`Error creating TokenBucket instance | ${error}`)
        }
    }

    /**
     * @description take - It takes the token right away, if there is no tokens available, the token.value will be null
     * @returns Promise<Token>
     */
    public async take(context?: AbortSignal): Promise<Token> {
        try {
            if (context?.aborted) {
                throw new Error('Operation aborted')
            }
            context?.addEventListener('abort', this.abortHandler)

            const response = await this.client.RPOP(TokenBucket.BUCKET_NAME)
            const delay = this.getNextExecutionInMilliseconds()
            if (!response) {
                return {
                    value: null,
                    timestamp: 0,
                    message: 'No tokens available',
                    delay,
                }
            }

            const token: Token = JSON.parse(response)
            token.delay = delay
            token.remaining = await this.getTotalTokens()

            context?.removeEventListener('abort', this.abortHandler)
            return token
        } catch (error: unknown) {
            throw new TBRedisException(`Error taking token from bucket | ${error}`)
        }
    }

    /**
     * Block the operation until receive a new token based on the delay time
     * @param {AbortSignal?} context - The context in case wants to abort the request
     * @return {Promise<Token>} The token object
     * 
     * @example 
     */
    public async delay(context?: AbortSignal): Promise<Token> {
        if (this.delayRetryCount >= this.maxDelayRetryCount) {
            throw new TBRedisException('Max delay retries reached out')
        }

        const token = await this.take(context)
        if (token.value) {
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
     */
    public async refill(): Promise<void> {
        try {
            if (!this.client.isReady) {
                throw new TBRedisException('Redis client is not ready')
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
            throw new TBRedisException(`Error filling token bucket | ${error}`)
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
     * @returns {Promise<number>}
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