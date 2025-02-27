import redis, { RedisClientType } from 'redis'
import { RateLimiterException } from './exception'
import { sleep } from './utils'

export default class Bucket {
    private host: string = ''
    private port: number = 6379
    private database: number = 0
    protected client: RedisClientType
    private maxConnectionRetries: number = 5
    private retryConnectionCount: number = 0

    constructor() {
        this.validateEnvVariables()

        const {
            REDIS_HOST,
            REDIS_USER,
            REDIS_PASSWORD
        } = process.env

        this.host = REDIS_HOST!
        
        const redisURL = `redis://${REDIS_USER}:${REDIS_PASSWORD}@${this.host}:${this.port}/${this.database}`

        this.client = redis.createClient({ url: redisURL, socket: { connectTimeout: 5000 } })

        this.client.on('error', this.onError)
        this.client.on('connect', this.onConnect)
    }

    private validateEnvVariables(): void {
        const {
            REDIS_HOST,
            REDIS_USER,
            REDIS_PASSWORD,
            REDIS_PORT,
            REDIS_DATABASE
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

        if (REDIS_PORT && parseInt(REDIS_PORT) !== 6379) {
            const port = parseInt(REDIS_PORT)
            if (Number.isNaN(port)) {
                throw new RateLimiterException('REDIS_PORT wrongly set, please use a correct number')
            }

            this.port = parseInt(REDIS_PORT)
        }

        if (REDIS_DATABASE && parseInt(REDIS_DATABASE) !== 0) {
            const database = parseInt(REDIS_DATABASE)
            if (Number.isNaN(database)) {
                throw new RateLimiterException('REDIS_DATABASE wrongly set, please use a correct number')
            }

            this.database = parseInt(REDIS_DATABASE)
        }
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