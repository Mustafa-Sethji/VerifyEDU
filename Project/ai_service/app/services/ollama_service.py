"""
Service 5 - Ollama

Thin client around Ollama's local /api/generate endpoint. This is the ONLY
place in the codebase that talks to Ollama. Answer evaluation (Service 6)
must never import this module.
"""

import json
from typing import Optional

import requests

from app.config import OLLAMA_GENERATE_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT_SECONDS


class OllamaError(Exception):
    """Raised when Ollama is unreachable or returns an invalid response."""


def generate(
    prompt: str,
    model: Optional[str] = None,
    system: Optional[str] = None,
    temperature: float = 0.3,
    json_mode: bool = False,
) -> str:
    """
    Call Ollama's /api/generate with streaming disabled and return the
    full response text.
    """
    payload = {
        "model": model or OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": temperature,"num_predict": 1536,},
    }
    if system:
        payload["system"] = system
    if json_mode:
        payload["format"] = "json"

    try:
        response = requests.post(
            OLLAMA_GENERATE_URL,
            json=payload,
            timeout=OLLAMA_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise OllamaError(f"Failed to reach Ollama at {OLLAMA_GENERATE_URL}: {exc}") from exc

    try:
        data = response.json()
    except json.JSONDecodeError as exc:
        raise OllamaError(f"Ollama returned a non-JSON response: {exc}") from exc

    if "response" not in data:
        raise OllamaError(f"Unexpected Ollama response shape: {data}")

    return data["response"]


def is_reachable() -> bool:
    """
    Lightweight reachability check used by the /health endpoint.
    Does not invoke the model — just checks that Ollama's server is up.
    """
    base_url = OLLAMA_GENERATE_URL.rsplit("/api/generate", 1)[0]
    try:
        response = requests.get(f"{base_url}/api/tags", timeout=5)
        return response.status_code == 200
    except requests.RequestException:
        return False
