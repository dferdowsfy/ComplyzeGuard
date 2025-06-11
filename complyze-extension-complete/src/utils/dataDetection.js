import { RISK_LEVELS } from './constants.js';

// Regex patterns for sensitive data detection
const PATTERNS = {
  // Personal Identifiers
  email: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    label: 'Email address',
    riskLevel: RISK_LEVELS.MEDIUM
  },
  ssn: {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    label: 'SSN',
    riskLevel: RISK_LEVELS.CRITICAL
  },
  phone: {
    pattern: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    label: 'Phone number',
    riskLevel: RISK_LEVELS.MEDIUM
  },
  creditCard: {
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
    label: 'Credit card',
    riskLevel: RISK_LEVELS.CRITICAL
  },
  
  // API Keys & Credentials
  openaiKey: {
    pattern: /\bsk-[a-zA-Z0-9]{48,64}\b/g,
    label: 'OpenAI API Key',
    riskLevel: RISK_LEVELS.CRITICAL
  },
  openrouterKey: {
    pattern: /\bsk-or-v1-[a-f0-9]{64}\b/g,
    label: 'OpenRouter API Key',
    riskLevel: RISK_LEVELS.CRITICAL
  },
  anthropicKey: {
    pattern: /\bsk-ant-[a-zA-Z0-9\-_]{95,105}\b/g,
    label: 'Anthropic API Key',
    riskLevel: RISK_LEVELS.CRITICAL
  },
  googleKey: {
    pattern: /\bAIza[a-zA-Z0-9\-_]{35}\b/g,
    label: 'Google API Key',
    riskLevel: RISK_LEVELS.CRITICAL
  },
  awsKey: {
    pattern: /\bAKIA[a-zA-Z0-9]{16}\b/g,
    label: 'AWS Access Key',
    riskLevel: RISK_LEVELS.CRITICAL
  },
  awsSecret: {
    pattern: /\b[a-zA-Z0-9/+=]{40}\b/g,
    label: 'AWS Secret Key',
    riskLevel: RISK_LEVELS.CRITICAL,
    contextRequired: true // Only flag if near "aws" or "secret"
  },
  
  // Healthcare Identifiers (HIPAA)
  medicareId: {
    pattern: /\b[A-Za-z0-9]{3}-[A-Za-z0-9]{2}-[A-Za-z0-9]{4}\b/g,
    label: 'Medicare ID',
    riskLevel: RISK_LEVELS.HIGH
  },
  dea: {
    pattern: /\b[A-Za-z]{2}[0-9]{7}\b/g,
    label: 'DEA Number',
    riskLevel: RISK_LEVELS.HIGH
  },
  
  // Financial Data
  bankAccount: {
    pattern: /\b\d{8,17}\b/g,
    label: 'Bank Account Number',
    riskLevel: RISK_LEVELS.HIGH,
    contextRequired: true // Only flag if near "account", "bank", etc.
  },
  routingNumber: {
    pattern: /\b0[0-9]{8}\b|\b1[0-2][0-9]{7}\b|\b2[0-9]{8}\b|\b3[0-2][0-9]{7}\b/g,
    label: 'Routing Number',
    riskLevel: RISK_LEVELS.HIGH
  },
  
  // Other Sensitive Data
  ipAddress: {
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    label: 'IP Address',
    riskLevel: RISK_LEVELS.MEDIUM
  },
  password: {
    pattern: /\b(?:password|passwd|pwd)\s*[:=]\s*["']?[^\s"']+["']?\b/gi,
    label: 'Password',
    riskLevel: RISK_LEVELS.CRITICAL
  }
};

// Context keywords for contextRequired patterns
const CONTEXT_KEYWORDS = {
  awsSecret: ['aws', 'secret', 'access', 'credentials'],
  bankAccount: ['account', 'bank', 'checking', 'savings', 'wire']
};

// Detect sensitive data in text
export function detectSensitiveData(text) {
  if (!text || typeof text !== 'string') {
    return { flagged: false, risks: [], riskLevel: RISK_LEVELS.LOW, detectedTypes: [] };
  }

  const risks = [];
  const detectedTypes = new Set();
  let highestRiskLevel = RISK_LEVELS.LOW;
  
  // Check each pattern
  for (const [key, config] of Object.entries(PATTERNS)) {
    let matches = text.match(config.pattern);
    
    if (matches && matches.length > 0) {
      // If context is required, check for context keywords
      if (config.contextRequired) {
        const textLower = text.toLowerCase();
        const hasContext = CONTEXT_KEYWORDS[key]?.some(keyword => 
          textLower.includes(keyword)
        );
        
        if (!hasContext) {
          continue;
        }
      }
      
      // Remove duplicates and format matches
      const uniqueMatches = [...new Set(matches)];
      
      uniqueMatches.forEach(match => {
        // Mask the sensitive data for logging
        const maskedMatch = maskSensitiveData(match, key);
        risks.push(`${config.label}: ${maskedMatch}`);
        detectedTypes.add(key);
      });
      
      // Update highest risk level
      highestRiskLevel = getHigherRiskLevel(highestRiskLevel, config.riskLevel);
    }
  }
  
  return {
    flagged: risks.length > 0,
    risks,
    riskLevel: highestRiskLevel,
    detectedTypes: Array.from(detectedTypes)
  };
}

// Mask sensitive data for display
function maskSensitiveData(data, type) {
  if (!data) return '';
  
  switch (type) {
    case 'email':
      const [localPart, domain] = data.split('@');
      return `${localPart.substring(0, 2)}***@${domain}`;
    
    case 'ssn':
      return `***-**-${data.slice(-4)}`;
    
    case 'phone':
      return `***-***-${data.slice(-4)}`;
    
    case 'creditCard':
      return `****-****-****-${data.slice(-4)}`;
    
    case 'openaiKey':
    case 'openrouterKey':
    case 'anthropicKey':
    case 'googleKey':
    case 'awsKey':
      return `${data.substring(0, 10)}...${data.slice(-4)}`;
    
    default:
      // Default masking: show first 3 and last 2 characters
      if (data.length > 5) {
        return `${data.substring(0, 3)}***${data.slice(-2)}`;
      }
      return '***';
  }
}

// Compare risk levels and return the higher one
function getHigherRiskLevel(level1, level2) {
  const riskOrder = {
    [RISK_LEVELS.LOW]: 0,
    [RISK_LEVELS.MEDIUM]: 1,
    [RISK_LEVELS.HIGH]: 2,
    [RISK_LEVELS.CRITICAL]: 3
  };
  
  return riskOrder[level1] > riskOrder[level2] ? level1 : level2;
}

// Analyze prompt and return comprehensive analysis
export function analyzePrompt(prompt, platform = 'unknown') {
  const detectionResult = detectSensitiveData(prompt);
  
  // Map detected types to compliance controls
  const mappedControls = [];
  if (detectionResult.detectedTypes.includes('ssn') || 
      detectionResult.detectedTypes.includes('medicareId') ||
      detectionResult.detectedTypes.includes('dea')) {
    mappedControls.push('HIPAA');
  }
  
  if (detectionResult.detectedTypes.includes('creditCard') ||
      detectionResult.detectedTypes.includes('bankAccount')) {
    mappedControls.push('PCI DSS');
  }
  
  if (detectionResult.detectedTypes.includes('email') ||
      detectionResult.detectedTypes.includes('phone')) {
    mappedControls.push('GDPR');
  }
  
  return {
    ...detectionResult,
    analysis_metadata: {
      detection_method: 'real_time_analysis',
      detected_pii: detectionResult.detectedTypes,
      risk_factors: getRiskFactors(detectionResult),
      mapped_controls: mappedControls,
      platform_detected: platform,
      auto_flagged: detectionResult.flagged,
      extension_version: '2.0.0',
      source: 'chrome_extension'
    }
  };
}

// Get human-readable risk factors
function getRiskFactors(detectionResult) {
  const factors = [];
  
  if (detectionResult.detectedTypes.length > 0) {
    factors.push('PII detected');
  }
  
  if (detectionResult.detectedTypes.some(type => 
    type.includes('Key') || type === 'password')) {
    factors.push('Credentials found');
  }
  
  if (detectionResult.riskLevel === RISK_LEVELS.CRITICAL) {
    factors.push('Critical sensitive data');
  }
  
  if (detectionResult.detectedTypes.includes('ssn') ||
      detectionResult.detectedTypes.includes('creditCard')) {
    factors.push('Regulated data');
  }
  
  return factors;
} 