export type TokenBucketSettings = {
    capacity: number;
    refillInterval: number;
}

export type Token = {
    value: string;
    timestamp: number;
    remaining?: number;
}