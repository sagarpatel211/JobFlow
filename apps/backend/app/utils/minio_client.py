# app/utils/minio_client.py
from minio import Minio
import os

def get_minio_client():
    return Minio(
        os.getenv("MINIO_ENDPOINT", "minio:9000"),
        access_key=os.getenv("MINIO_ACCESS_KEY", "minioaccesskey"),
        secret_key=os.getenv("MINIO_SECRET_KEY", "miniosecretkey"),
        secure=False,
    )

def upload_file(bucket: str, file_path: str, object_name: str):
    client = get_minio_client()
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
    client.fput_object(bucket, object_name, file_path)
    return object_name
