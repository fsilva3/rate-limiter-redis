import redis, { RedisClientType } from 'redis'
import { RateLimiterException } from './exception'
import { sleep } from './utils'
// import { sleep } from './utils'

export default class Bucket {
    private host: string = ''
    private port: number = 6379
    protected client: RedisClientType
    private maxConnectionRetries: number = 5
    private retryConnectionCount: number = 0

    constructor() {
        const {
            REDIS_HOST,
            REDIS_USER,
            REDIS_PASSWORD,
            REDIS_PORT,
        } = process.env

        if (!REDIS_HOST) {
            throw new RateLimiterException('REDIS_HOST environment is required')
        }

        if (!REDIS_USER) {
            throw new RateLimiterException('REDIS_USER environment is required')
        }

        if (!REDIS_PASSWORD) {
            throw new RateLimiterException('REDIS_PASSWORD environment is required')
        }

        this.host = REDIS_HOST!
        if (REDIS_PORT && parseInt(REDIS_PORT) !== 6379) {
            this.port = parseInt(REDIS_PORT)
        }
        
        const redisURL = `redis://${REDIS_USER}:${REDIS_PASSWORD}@${this.host}:${this.port}`
        this.client = redis.createClient({ url: redisURL, socket: { connectTimeout: 5000 } })

        this.client.on('error', this.onError)
        this.client.on('connect', this.onConnect)
    }

    protected async connect(): Promise<void> {
        if (this.retryConnectionCount >= this.maxConnectionRetries) {
            throw new Error('The max Redis connection retry reached out')
        }

        if (this.client.isOpen) {
            await sleep(200)
            this.retryConnectionCount += 1
            return this.connect()
        }

        if (this.client.isReady) {
            return
        }

        await this.client.connect()
    }

    protected async quit(): Promise<void> {
        if (!this.client.isOpen) {
            return
        }

        await this.client.disconnect()
    }

    private onConnect() {
        console.log('Connected to Redis')
    }

    private onError(err: Error) {
        throw new RateLimiterException(err.message)
    }
}