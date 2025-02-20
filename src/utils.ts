type Reject = (reason?: unknown) => void;

const abortHandler = (reject: Reject, timeoutId?: NodeJS.Timeout) => {
    clearTimeout(timeoutId)
    reject(new Error('Operation aborted'))
}

async function sleep(milliseconds: number, context?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (context?.aborted) {
            return reject(new Error('Operation aborted'))
        }

        const timeoutId = setTimeout(() => {
            resolve()
        }, milliseconds)

        const fn = () => abortHandler(reject, timeoutId)
        context?.addEventListener('abort', fn)
    }).finally(() => {
        context?.removeEventListener('abort', () => abortHandler)
    })
}

export { sleep }