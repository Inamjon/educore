from .base import *  # noqa: F401,F403

DEBUG = False
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

DATABASES["default"]["NAME"] = env("TEST_DB_NAME", default="educore_test")  # noqa: F405
