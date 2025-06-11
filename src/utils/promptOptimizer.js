// OpenRouter API Configuration
const OPENROUTER_CONFIG = {
  API_KEY: 'sk-or-v1-a40a8b7c4a68decedb3dce0d9e9aa358d2f203d9f',
  BASE_URL: 'https://openrouter.ai/api/v1',
  MODEL: 'google/gemini-2.5-flash-preview'
};

// Comprehensive redaction patterns
const REDACTION_PATTERNS = {
  // 1. Personally Identifiable Information (PII)
  pii: {
    fullName: {
      pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g,
      replacement: '[NAME_REDACTED]',
      category: 'PII'
    },
    email: {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[EMAIL_REDACTED]',
      category: 'PII'
    },
    phone: {
      pattern: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      replacement: '[PHONE_REDACTED]',
      category: 'PII'
    },
    ssn: {
      pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
      replacement: '[SSN_REDACTED]',
      category: 'PII'
    },
    address: {
      pattern: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi,
      replacement: '[ADDRESS_REDACTED]',
      category: 'PII'
    },
    zipCode: {
      pattern: /\b\d{5}(?:-\d{4})?\b/g,
      replacement: '[ZIP_REDACTED]',
      category: 'PII'
    },
    dateOfBirth: {
      pattern: /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g,
      replacement: '[DOB_REDACTED]',
      category: 'PII'
    },
    ipAddress: {
      pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
      replacement: '[IP_REDACTED]',
      category: 'PII'
    }
  },

  // 2. Protected Health Information (PHI)
  phi: {
    medicalConditions: {
      pattern: /\b(?:diagnosed with|suffering from|has|condition of)\s+([A-Za-z\s]+(?:diabetes|cancer|depression|anxiety|ADHD|bipolar|schizophrenia|HIV|AIDS))/gi,
      replacement: '[MEDICAL_CONDITION_REDACTED]',
      category: 'PHI'
    },
    medications: {
      pattern: /\b(?:prescribed|taking|medication|drug)\s+([A-Za-z]+(?:mg|mcg)?)/gi,
      replacement: '[MEDICATION_REDACTED]',
      category: 'PHI'
    },
    medicalRecordNumber: {
      pattern: /\b(?:MRN|medical record|patient ID)\s*:?\s*([A-Za-z0-9]+)/gi,
      replacement: '[MRN_REDACTED]',
      category: 'PHI'
    },
    labResults: {
      pattern: /\b(?:blood glucose|cholesterol|blood pressure|heart rate)\s*:?\s*([0-9\/]+)/gi,
      replacement: '[LAB_RESULT_REDACTED]',
      category: 'PHI'
    }
  },

  // 3. Financial Information
  financial: {
    creditCard: {
      pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
      replacement: '[CREDIT_CARD_REDACTED]',
      category: 'Financial'
    },
    bankAccount: {
      pattern: /\b(?:account|routing)\s*(?:number|#)?\s*:?\s*([0-9]{8,17})\b/gi,
      replacement: '[BANK_ACCOUNT_REDACTED]',
      category: 'Financial'
    },
    taxId: {
      pattern: /\b(?:EIN|tax ID)\s*:?\s*([0-9]{2}-[0-9]{7})\b/gi,
      replacement: '[TAX_ID_REDACTED]',
      category: 'Financial'
    }
  },

  // 4. Authentication & Secrets
  secrets: {
    openaiKey: {
      pattern: /\bsk-[a-zA-Z0-9]{48,64}\b/g,
      replacement: '[OPENAI_KEY_REDACTED]',
      category: 'Secrets'
    },
    openrouterKey: {
      pattern: /\bsk-or-v1-[a-f0-9]{64}\b/g,
      replacement: '[OPENROUTER_KEY_REDACTED]',
      category: 'Secrets'
    },
    anthropicKey: {
      pattern: /\bsk-ant-[a-zA-Z0-9\-_]{95,105}\b/g,
      replacement: '[ANTHROPIC_KEY_REDACTED]',
      category: 'Secrets'
    },
    googleKey: {
      pattern: /\bAIza[a-zA-Z0-9\-_]{35}\b/g,
      replacement: '[GOOGLE_KEY_REDACTED]',
      category: 'Secrets'
    },
    awsKey: {
      pattern: /\bAKIA[a-zA-Z0-9]{16}\b/g,
      replacement: '[AWS_KEY_REDACTED]',
      category: 'Secrets'
    },
    bearerToken: {
      pattern: /\b(?:Bearer|token)\s+([a-zA-Z0-9\-_\.]+)/gi,
      replacement: '[TOKEN_REDACTED]',
      category: 'Secrets'
    },
    password: {
      pattern: /\b(?:password|passwd|pwd)\s*[:=]\s*["']?([^\s"']+)["']?\b/gi,
      replacement: '[PASSWORD_REDACTED]',
      category: 'Secrets'
    },
    sshKey: {
      pattern: /-----BEGIN [A-Z\s]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z\s]+ PRIVATE KEY-----/g,
      replacement: '[SSH_KEY_REDACTED]',
      category: 'Secrets'
    }
  },

  // 5. Corporate Confidential
  corporate: {
    projectNames: {
      pattern: /\b(?:Project|Operation|Initiative)\s+([A-Z][a-z]+)\b/g,
      replacement: '[PROJECT_NAME_REDACTED]',
      category: 'Corporate'
    },
    internalPricing: {
      pattern: /\$[0-9,]+(?:\.[0-9]{2})?(?:\s*(?:per|\/)\s*(?:month|year|user))?/g,
      replacement: '[PRICING_REDACTED]',
      category: 'Corporate'
    }
  }
};

// Master system prompt for optimization
const OPTIMIZATION_SYSTEM_PROMPT = `You are an AI prompt optimization specialist. Your task is to:

1. REDACT all sensitive information that has been marked with [REDACTED] tags
2. OPTIMIZE the prompt for clarity, efficiency, and effectiveness
3. MAINTAIN the original intent and context while removing sensitive data
4. ENSURE the optimized prompt is safe for AI processing

Guidelines:
- Keep the core request intact
- Remove or replace sensitive information with generic placeholders
- Improve clarity and structure
- Make the prompt more efficient while preserving meaning
- Ensure compliance with data protection regulations

Return ONLY the optimized prompt without explanations or metadata.`;

// Redact sensitive information from text
export function redactSensitiveData(text) {
  let redactedText = text;
  const redactedItems = [];

  // Apply all redaction patterns
  Object.entries(REDACTION_PATTERNS).forEach(([categoryKey, category]) => {
    Object.entries(category).forEach(([patternKey, config]) => {
      const matches = redactedText.match(config.pattern);
      if (matches) {
        matches.forEach(match => {
          redactedItems.push({
            type: patternKey,
            category: config.category,
            original: match,
            replacement: config.replacement
          });
        });
        redactedText = redactedText.replace(config.pattern, config.replacement);
      }
    });
  });

  return {
    redactedText,
    redactedItems,
    hasRedactions: redactedItems.length > 0
  };
}

// Optimize prompt using OpenRouter API
export async function optimizePrompt(originalPrompt) {
  try {
    // First, redact sensitive information
    const redactionResult = redactSensitiveData(originalPrompt);
    
    if (!redactionResult.hasRedactions) {
      // If no sensitive data, just return original
      return {
        success: true,
        optimizedPrompt: originalPrompt,
        redactedItems: [],
        wasOptimized: false
      };
    }

    // Call OpenRouter API for optimization
    const response = await fetch(`${OPENROUTER_CONFIG.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze Prompt Optimizer'
      },
      body: JSON.stringify({
        model: OPENROUTER_CONFIG.MODEL,
        messages: [
          {
            role: 'system',
            content: OPTIMIZATION_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Please optimize this prompt while maintaining its intent:\n\n${redactionResult.redactedText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const optimizedPrompt = data.choices[0]?.message?.content?.trim();

    if (!optimizedPrompt) {
      throw new Error('No optimized prompt returned from API');
    }

    return {
      success: true,
      optimizedPrompt,
      redactedItems: redactionResult.redactedItems,
      wasOptimized: true,
      originalPrompt,
      redactedPrompt: redactionResult.redactedText
    };

  } catch (error) {
    console.error('Prompt optimization failed:', error);
    
    // Fallback: return redacted version without AI optimization
    const redactionResult = redactSensitiveData(originalPrompt);
    
    return {
      success: false,
      error: error.message,
      optimizedPrompt: redactionResult.redactedText,
      redactedItems: redactionResult.redactedItems,
      wasOptimized: false,
      fallbackUsed: true
    };
  }
}

// Get redaction summary for display
export function getRedactionSummary(redactedItems) {
  const summary = {};
  
  redactedItems.forEach(item => {
    if (!summary[item.category]) {
      summary[item.category] = [];
    }
    summary[item.category].push(item.type);
  });

  return summary;
} 