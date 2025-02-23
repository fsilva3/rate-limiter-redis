/**
 * @typedef {Object} TokenBucketSettings - creates a new type named 'TokenBucketSettings'
 * @property {number} capacity - the total tokesn to be refilled in the bucket
 * @property {number} interval - the time interval when it should refill the tokens in milliseconds
 * @property {string?} key - an optional parameter to define a different bucket name key on redis list
 */
export type TokenBucketSettings = {
    capacity: number;
    interval: number;
    key?: string;
}

export type Token = {
    value: string;
    timestamp: number;
    remaining?: number;
}