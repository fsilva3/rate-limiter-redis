import {
    it,
    describe,
    expect,
    vi,
    afterEach
} from 'vitest'
import Bucket from '../bucket'

describe('Bucket Test', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should create an instance of Bucket class and connect', async () => {
        const bucket = new Bucket()
        
        expect(bucket).toBeInstanceOf(Bucket)
    })

    it('should connect to redis server when calling the method connect', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log')

        class MyBucket extends Bucket {
            constructor() { super() }

            public async superConnect() {
                await this.connect()
            }
        }

        const myNewBucket = new MyBucket()
        await myNewBucket.superConnect()
        
        expect(consoleLogSpy).toHaveBeenCalledOnce()
        expect(consoleLogSpy).toHaveBeenCalledWith('Connected to Redis')
    })

    describe('validate environment variables', () => {
        afterEach(() => {
            vi.unstubAllEnvs()
        })

        it('should throw an error when REDIS_HOST is not set', () => {
            vi.stubEnv('REDIS_HOST', '')
            expect(() => new Bucket()).toThrowError('REDIS_HOST environment is required')
        })

        it('should throw an error when REDIS_USER is not set', async () => {
            vi.stubEnv('REDIS_USER', '')
            expect(() => new Bucket()).toThrowError('REDIS_USER environment is required')
        })

        it('should throw an error when REDIS_PASSWORD is not set', async () => {
            vi.stubEnv('REDIS_PASSWORD', '')
            expect(() => new Bucket()).toThrowError('REDIS_PASSWORD environment is required')
        })

        it('should throw an error when REDIS_PORT is not a number', async () => {
            vi.stubEnv('REDIS_PORT', 'not-a-number')
            expect(() => new Bucket()).toThrowError('REDIS_PORT wrongly set, please use a correct number')
        })

        it('should throw an error when REDIS_DATABASE is not a number', async () => {
            vi.stubEnv('REDIS_DATABASE', 'not-a-number')
            expect(() => new Bucket()).toThrowError('REDIS_DATABASE wrongly set, please use a correct number')
        })
    })
})