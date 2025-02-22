# Rate Limiter Redis

Rate Limiter Redis is a JavaScript library that provides different algorithms to rate limit your requests using Redis as shared state between the distributed services.

This library is useful for controlling the rate of requests from your application to a third-party service or API.

## Reference

- [Redis Blog](https://redis.io/glossary/rate-limiting/)
- [Token Bucket](https://en.wikipedia.org/wiki/Token_bucket)

## Benefits

- **Cost-Effective**: Instead calling HTTP APIs and handling execptions might throw from the Third-party API, you can block the request before it reaches the API, or retry the request later.

- **Distributed**: Rate Limiter Redis is designed to work in a distributed environment, where multiple instances of your application can share the same rate limit.

## Installation

To install the library, use npm:

```bash
npm i -P @fsilva3/rate-limiter-redis
```

## Usage

Here is a few examples of how to use Rate Limiter Redis:

1. Token Bucket Instance
```javascript
import { TokenBucket, TokenBucketSettings } from ('@fsilva3/rate-limiter-redis')
const second = 1000

// 60 tokens (requests) per minute
const tbSettings: TokenBucketSettings = {
    capacity: 60,
    interval: (60*second)
}

// Create a new token bucket instance
const bucket = await TokenBucket.create(tbSettings); 
```

2. Take Method
```javascript
// Takes the first token created in the bucket, if exists! Otherwise the token.value will return null
const token = await bucket.take();

const { 
    value, // value is a hash string if a token is available, null otherwise
    timestamp, // timestamp when the token was created
    remaning // remaining is the number of tokens
} = token;

if (!value) {
    // re-queue the message, throw exception or return error
}

... 
// Call the Third-party API
```

3. Delay Method
```javascript
// Usually from HTTP frameworks to cancel requests
const controler = new AbortController()

// In case the bucket is empty, it will block the operation until receive a new token!
// This method accepts abort signal, which means you can cancel the operation at any time
const token = await bucket.delay(controler.signal);

const { 
    value,
    timestamp,
    remaning
} = token;

...
// Call the Third-party API
```

## Configuration

The `Redis` connection is made by using environment variables; make sure to have these keys available in your `.env` or any other environment setup:
```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USER=default
REDIS_PASSWORD=mysecretpassword
```

<br>

The `TokenBucket` constructor accepts the following options:

- `capacity`: The maximum number of tokens in the bucket.
- `interval`: The milliseconds interval at which tokens are added to the bucket

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Acknowledgements

This library is inspired by the token bucket algorithm and uses Redis for storage.

## Contact

For any questions or issues, please open an issue on GitHub.
