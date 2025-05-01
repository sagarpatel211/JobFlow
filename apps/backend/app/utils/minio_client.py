# app/utils/minio_client.py
from minio import Minio
import os


def get_minio_client():
    endpoint = os.getenv("MINIO_DOMAIN", "minio:9000")
    access_key = os.getenv("MINIO_ROOT_USER") or os.getenv("MINIO_ROOT_USER")
    secret_key = os.getenv("MINIO_ROOT_PASSWORD") or os.getenv("MINIO_ROOT_PASSWORD")
    client = Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=False)
    bucket = os.getenv("MINIO_BUCKET", "job-attachments")
    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
    except Exception:
        pass
    return client


def upload_file(bucket: str, file_path: str, object_name: str):
    client = get_minio_client()
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
    client.fput_object(bucket, object_name, file_path)
    return object_name


def upload_fileobj(
    bucket: str, object_name: str, file_obj, length: int, content_type: str
):
    client = get_minio_client()
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
    client.put_object(bucket, object_name, file_obj, length, content_type=content_type)
    return object_name
