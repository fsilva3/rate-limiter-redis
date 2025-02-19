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
})