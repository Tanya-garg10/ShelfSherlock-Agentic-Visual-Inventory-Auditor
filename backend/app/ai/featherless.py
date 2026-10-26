"""
Featherless AI client — OpenAI-compatible API wrapper for ShelfSherlock.
Uses httpx directly (no openai SDK dependency) for the chat completions endpoint.
Falls back gracefully if API key is missing or request fails.
"""
import os
import httpx
from typing import Optional

_FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY", "")
_FEATHERLESS_MODEL = os.getenv("FEATHERLESS_MODEL", "meta-llama/Llama-3.3-70B-Instruct")
_BASE_URL = "https://api.featherless.ai/v1/chat/completions"


def _chat(prompt: str, max_tokens: int = 80) -> Optional[str]:
    """Sends a single-turn chat request to Featherless AI. Returns response text or None."""
    if not _FEATHERLESS_API_KEY:
        return None
    try:
        resp = httpx.post(
            _BASE_URL,
            headers={
                "Authorization": f"Bearer {_FEATHERLESS_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": _FEATHERLESS_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": 0.3,
            },
            timeout=10.0,
        )
        resp.raise_for_status()
        text = resp.json()["choices"][0]["message"]["content"].strip()
        return text if text else None
    except Exception as e:
        print(f"[Featherless] request failed: {e}")
        return None


def enhance_region_notes(
    classification: str,
    area_percent: float,
    mean_intensity_delta: float,
    edge_ratio: float,
    bhattacharyya: float,
    solidity: float,
) -> Optional[str]:
    """
    Generates a concise, human-readable investigation note for a shelf change region.
    Returns None if AI is unavailable so caller can use the static fallback.
    """
    prompt = (
        f"You are a retail shelf audit AI. Write ONE concise sentence (max 20 words) "
        f"describing this shelf change for an operator report.\n"
        f"Classification: {classification}\n"
        f"Area affected: {area_percent:.1f}% of shelf\n"
        f"Intensity delta: {mean_intensity_delta:.1f}\n"
        f"Edge ratio vs reference: {edge_ratio:.2f}\n"
        f"Histogram divergence (Bhattacharyya): {bhattacharyya:.2f}\n"
        f"Contour solidity: {solidity:.2f}\n"
        f"Output only the sentence, no prefix."
    )
    return _chat(prompt, max_tokens=60)


def generate_audit_summary(
    n_changes: int,
    overall_change_pct: float,
    ssim: float,
    psnr: float,
    has_uncertain: bool,
    classifications: list,
) -> Optional[str]:
    """
    Generates a professional one-sentence audit summary.
    Returns None if AI is unavailable so caller can use the static fallback.
    """
    breakdown = (
        ", ".join(f"{classifications.count(c)}x {c}" for c in set(classifications))
        if classifications else "none"
    )
    prompt = (
        f"You are a retail shelf audit AI. Write ONE professional summary sentence (max 30 words) "
        f"for an operator audit report.\n"
        f"Total changes detected: {n_changes}\n"
        f"Change area: {overall_change_pct:.2f}% of shelf\n"
        f"SSIM score: {ssim:.4f}, PSNR: {psnr:.2f}dB\n"
        f"Region breakdown: {breakdown}\n"
        f"Requires human review: {has_uncertain}\n"
        f"Output only the sentence, no prefix."
    )
    return _chat(prompt, max_tokens=80)
