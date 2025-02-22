export class RateLimiterException extends Error {
    constructor(msg: string) {
        super(msg)

        Object.setPrototypeOf(this, RateLimiterException.prototype)
    }
}