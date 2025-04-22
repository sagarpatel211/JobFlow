from flask import current_app
import json

def get_redis_client():
    """Return the Redis client instance from Flask app extensions."""
    return current_app.extensions["redis"]

def get_cache(key):
    """Retrieve a JSON-deserialized value from Redis by key, or None if missing or invalid."""
    client = get_redis_client()
    raw = client.get(key)
    if raw is None:
        current_app.logger.debug(f"Redis cache miss for key: {key}")
        return None
    try:
        current_app.logger.debug(f"Redis cache hit for key: {key}")
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        current_app.logger.warning(f"Redis cache invalid JSON for key: {key}")
        return None

def set_cache(key, value, ttl):
    """Serialize `value` to JSON and store it under `key` with a TTL in seconds."""
    client = get_redis_client()
    client.setex(key, ttl, json.dumps(value))
    current_app.logger.debug(f"Redis cache set for key: {key} ttl: {ttl}s")

def delete_cache(key):
    """Remove `key` from Redis."""
    client = get_redis_client()
    client.delete(key)
    current_app.logger.debug(f"Redis cache delete for key: {key}") 