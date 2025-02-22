export type TokenBucketSettings = {
    capacity: number;
    interval: number;
}

export type Token = {
    value: string;
    timestamp: number;
    remaining?: number;
}