# Rate Limiter Redis

Rate Limiter Redis is a JavaScript library that provides different algorithms to rate limit your requests using Redis as shared state between the distributed services. This library is useful for controlling the rate of requests from your application to a third-party service or API.

## Reference

- [Redis Blog](https://redis.io/glossary/rate-limiting/)
- [Token Bucket](https://en.wikipedia.org/wiki/Token_bucket)

## Benefits

- **Cost-Effective**: Instead calling HTTP APIs and handle execptions might throw from the Third-party API, you can block the request before it reaches the API, or retry the request later.
- **Distributed**: Rate Limiter Redis is designed to work in a distributed environment, where multiple instances of your application can share the same rate limit.

## Installation

To install the library, use npm:

```bash
npm install rate-limiter-redis
```

## Usage

Here is an example of how to use Token Bucket Redis:

```javascript
const { TokenBucket } = require('rate-limiter-redis');
const second = 1000

// 60 tokens (requests) per minute
const tbSettings: TokenBucketSettings = {
    capacity: 60,
    refillInterval: (60*second)
}

// Create a new token bucket
const bucket = await TokenBucket.create(tbSettings); 

// Takes the first token created in the bucket, if exists! Other will the token.value will return null
const token = await bucket.take();

const { 
    value, // value is a hash string if a token is available, null otherwise
    timestamp, // timestamp when the token was created
    remaning // remaining is the number of tokens
} = token;


```

## Configuration

The `TokenBucket` constructor accepts the following options:

- `redis`: Redis connection options.
- `bucketSize`: The maximum number of tokens in the bucket.
- `tokensPerInterval`: The number of tokens to add to the bucket per interval.
- `interval`: The interval at which tokens are added (e.g., 'second', 'minute').

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Acknowledgements

This library is inspired by the token bucket algorithm and uses Redis for storage.

## Contact

For any questions or issues, please open an issue on GitHub.
