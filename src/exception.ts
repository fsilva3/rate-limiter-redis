// create a new execption type
class TBRedisException extends Error {
    constructor(msg: string) {
        super(msg)

        Object.setPrototypeOf(this, TBRedisException.prototype)
    }
}

export { TBRedisException }