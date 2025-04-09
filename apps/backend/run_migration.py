#!/usr/bin/env python

import sys
import logging
from database.schema_migrator import run_migration

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    try:
        logger.info("Starting database migration")
        success = run_migration()
        
        if success:
            logger.info("Migration completed successfully!")
            return 0
        else:
            logger.error("Migration failed")
            return 1
    except Exception as e:
        logger.error(f"Error during migration: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
