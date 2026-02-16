import os
import json
from pathlib import Path
from typing import Optional, Dict

class OrgManager:
    def __init__(self, base_path: str = "data/org_configs"):
        self.base_path = Path(base_path)

    def get_org_config(self, org_id: str) -> Optional[Dict]:
        config_path = self.base_path / org_id / "config.json"
        if config_path.exists():
            with open(config_path, "r") as f:
                return json.load(f)
        return None

    def get_org_instructions(self, org_id: str) -> str:
        instructions_path = self.base_path / org_id / "instructions.md"
        if instructions_path.exists():
            with open(instructions_path, "r") as f:
                return f.read()
        return "You are a helpful clinical assistant. Follow standard SOAP protocols."

    def list_orgs(self):
        return [d.name for d in self.base_path.iterdir() if d.is_dir()]
