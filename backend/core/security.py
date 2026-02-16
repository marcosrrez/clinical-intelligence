from cryptography.fernet import Fernet
import os
from pathlib import Path

class CryptoManager:
    def __init__(self, key_path: str = "data/keys"):
        self.key_path = Path(key_path)
        self.key_path.mkdir(parents=True, exist_ok=True)
        self.key_file = self.key_path / "secret.key"
        self.cipher_suite = self._load_key()

    def _load_key(self) -> Fernet:
        if not self.key_file.exists():
            key = Fernet.generate_key()
            with open(self.key_file, "wb") as key_file:
                key_file.write(key)
        else:
            with open(self.key_file, "rb") as key_file:
                key = key_file.read()
        return Fernet(key)

    def encrypt(self, data: str) -> str:
        return self.cipher_suite.encrypt(data.encode()).decode()

    def decrypt(self, token: str) -> str:
        return self.cipher_suite.decrypt(token.encode()).decode()
