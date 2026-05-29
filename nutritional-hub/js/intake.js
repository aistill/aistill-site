// AIStill.ai — Nutritional Intelligence Hub
// Tier 2: AI Results Interpretation
// v1.0 | Built for Cloudflare Pages + Workers
// Auth integration point: search "AUTH STUB" for drop-in hooks

(function initIntake(global, document) {
  'use strict';

  const MAX_PDF_BYTES = 10 * 1024 * 1024;
  const PDF_MIME_TYPES = new Set(['application/pdf', 'application/x-pdf']);

  const form = document.getElementById('intake-form');
  const pastePanel = document.getElementById('paste-panel');
  const pdfPanel = document.getElementById('pdf-panel');
  const rawResults = document.getElementById('raw-results');
  const pdfFile = document.getElementById('pdf-file');
  const errorBox = document.getElementById('form-error');
  const submitButton = document.getElementById('submit-button');
  const loadingState = document.getElementById('loading-state');
  const methodInputs = Array.from(document.querySelectorAll('input[name="inputMethod"]'));

  function sanitizeText(value) {
    return String(value || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+\n/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  function getInputMethod() {
    const checked = methodInputs.find((input) => input.checked);
    return checked ? checked.value : 'paste';
  }

  function syncMethodPanels() {
    const method = getInputMethod();
    pastePanel.hidden = method !== 'paste';
    pdfPanel.hidden = method !== 'pdf';
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function clearError() {
    errorBox.textContent = '';
    errorBox.hidden = true;
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.setAttribute('aria-busy', String(isLoading));
    loadingState.hidden = !isLoading;
  }

  function pdfStringDecode(value) {
    return value
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\');
  }

  function extractPdfText(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index]);
    }

    const chunks = [];
    const literalStringPattern = /\((?:\\.|[^\\)])*\)/g;
    let match;
    while ((match = literalStringPattern.exec(binary)) !== null) {
      const text = pdfStringDecode(match[0].slice(1, -1));
      if (/[A-Za-z0-9%]/.test(text)) chunks.push(text);
    }

    if (chunks.length > 6) {
      return sanitizeText(chunks.join(' '));
    }

    const fallback = binary.replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, ' ');
    return sanitizeText(fallback);
  }

  async function getRawContent(method) {
    if (method === 'paste') {
      return sanitizeText(rawResults.value);
    }

    const file = pdfFile.files && pdfFile.files[0];
    if (!file) return '';

    const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
    const hasPdfMime = PDF_MIME_TYPES.has(file.type);
    if (!hasPdfExtension || (file.type && !hasPdfMime)) {
      throw new Error('Please upload a PDF file.');
    }

    if (file.size > MAX_PDF_BYTES) {
      throw new Error('PDF upload must be 10MB or smaller.');
    }

    return extractPdfText(await file.arrayBuffer());
  }

  function supplementingToBoolean(value) {
    if (value === 'yes') return true;
    if (value === 'no') return false;
    return null;
  }

  function getContext() {
    const supplementing = document.getElementById('supplementing').value;
    return {
      activityLevel: sanitizeText(document.getElementById('activity-level').value),
      ageRange: sanitizeText(document.getElementById('age-range').value),
      clinicianQuestions: sanitizeText(document.getElementById('clinician-questions').value),
      currentlySupplementing: supplementingToBoolean(supplementing),
      medications: sanitizeText(document.getElementById('medications').value),
      nutritionPattern: sanitizeText(document.getElementById('nutrition-pattern').value),
      primaryConcern: sanitizeText(document.getElementById('primary-concern').value),
      sleepRecovery: sanitizeText(document.getElementById('sleep-recovery').value),
      stressLoad: sanitizeText(document.getElementById('stress-load').value),
      currentlySupplemening: supplementingToBoolean(supplementing)
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearError();
    setLoading(true);

    try {
      const inputType = getInputMethod();
      const rawContent = await getRawContent(inputType);

      if (!rawContent) {
        throw new Error('Paste your SpectraCell results or upload a PDF before submitting.');
      }

      const session = global.NIHSession.writeSession({
        inputType,
        rawContent,
        context: getContext(),
        reportData: null
      });

      const reportData = await global.NIHAIClient.postInterpret({
        sessionId: session.sessionId,
        rawContent: session.rawContent,
        context: session.context
      });

      if (reportData.error === 'unrecognized_format') {
        throw new Error('The uploaded content does not look like a SpectraCell Micronutrient Test result. Please check the input and try again.');
      }

      global.NIHSession.updateReport(reportData);
      global.location.assign('report.html');
    } catch (error) {
      const messages = {
        timeout: 'The analysis is taking longer than expected. Please retry in a moment.',
        parse_failure: 'The AI response could not be parsed. Please retry.',
        rate_limited: 'Too many requests from this connection. Please try again later.',
        config_missing: 'The interpretation service is not configured yet.'
      };
      showError(messages[error.message] || error.message || 'Unable to analyze this panel. Please retry.');
    } finally {
      setLoading(false);
    }
  }

  methodInputs.forEach((input) => input.addEventListener('change', syncMethodPanels));
  form.addEventListener('submit', handleSubmit);
  syncMethodPanels();
})(window, document);
