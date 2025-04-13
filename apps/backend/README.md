# JobFlow Backend

JobFlow is a job tracking application for managing your job search process.

## Logging Configuration

The application uses a configurable logging system that adjusts log verbosity based on the environment:

### Configuration Options

Set these environment variables in `.env` or through your deployment environment:

- `LOG_LEVEL`: Set to `DEBUG`, `INFO`, `WARNING`, `ERROR`, or `CRITICAL` (default is `INFO`)
- `FLASK_DEBUG`: Set to `1` to enable debug mode, `0` to disable (default is `0`)

### Log Behavior

- In debug mode (`FLASK_DEBUG=1`):
  - Detailed logs including request information
  - All log messages including DEBUG level are output
  - Logs are sent to the console only

- In production mode (`FLASK_DEBUG=0`):
  - More concise log messages
  - Only logs at or above the configured `LOG_LEVEL` are output
  - WARNING and above logs are also written to rotating log files in the `logs/` directory
  - SQLAlchemy logs are suppressed to reduce noise

### Using Loggers in Code

Import and use the logger in your code files:

```python
from logger_config import get_logger

logger = get_logger(__name__)

# Log at appropriate levels
logger.debug("Detailed information for debugging")
logger.info("General information about operation")
logger.warning("Warning that might require attention")
logger.error("Error that impacted operation")
logger.critical("Critical error that needs immediate attention")
```

Use appropriate log levels to ensure that logs are only generated when needed in production. 