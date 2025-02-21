// create a new execption type
class RateLimiterException extends Error {
    constructor(msg: string) {
        super(msg)

        Object.setPrototypeOf(this, RateLimiterException.prototype)
    }
}

export { RateLimiterException }