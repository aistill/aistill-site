// AIStill.ai — Nutritional Intelligence Hub
// Tier 2: AI Results Interpretation
// v1.0 | Built for Cloudflare Pages + Workers
// Auth integration point: search "AUTH STUB" for drop-in hooks

(function initAIClient(global) {
  'use strict';

  const DEFAULT_TIMEOUT_MS = 30000;

  async function postInterpret(payload, options = {}) {
    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = global.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await global.fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({ error: 'invalid_response' }));
      if (!response.ok) {
        const message = data && data.error ? data.error : 'request_failed';
        throw new Error(message);
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('timeout');
      }
      throw error;
    } finally {
      global.clearTimeout(timeoutId);
    }
  }

  global.NIHAIClient = { postInterpret };
})(window);
