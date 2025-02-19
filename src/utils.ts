async function sleep(milliseconds: number, context?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
         if (context?.aborted) {
            return reject(new Error('Operation aborted'))
        }

        const timeoutId = setTimeout(resolve, milliseconds)

        const abortHandler = () => {
            clearTimeout(timeoutId)
            reject(new Error('Operation aborted'))
        }

        context?.addEventListener('abort', abortHandler)
        Promise.resolve().finally(() => {
            context?.removeEventListener('abort', abortHandler)
        })
    })

}

export { sleep }