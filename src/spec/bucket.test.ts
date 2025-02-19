import {
    it,
    describe,
    expect
} from 'vitest'
import Bucket from '../bucket'

describe('Bucket Test', () => {
    it('should create an instance of Bucket class and connect', async () => {
        const bucket = new Bucket()
        
        expect(bucket).toBeInstanceOf(Bucket)
    })
})