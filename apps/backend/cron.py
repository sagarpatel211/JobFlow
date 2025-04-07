import schedule
import time

def run_scheduled_tasks():
    pass

def main():
    schedule.every(10).minutes.do(run_scheduled_tasks)
    while True:
        schedule.run_pending()
        time.sleep(1)
if __name__ == "__main__":
    main()
