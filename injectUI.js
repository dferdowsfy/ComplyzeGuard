/**
 * Complyze AI Guard - Injectable UI Components
 * Web accessible resource for enhanced user interface interactions
 */

(function() {
  'use strict';
  
  // Only run if not already injected
  if (window.complyzeInjected) return;
  window.complyzeInjected = true;
  
  // Enhanced Modal Components
  class ComplyzeEnhancedModal {
    static createSecurityBadge(platform) {
      const badge = document.createElement('div');
      badge.id = 'complyze-security-badge';
      badge.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 999998;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        " onclick="this.style.transform = this.style.transform ? '' : 'scale(0.95)'">
          🛡️ <span>Complyze Protected</span>
        </div>
      `;
      
      document.body.appendChild(badge);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (badge.parentNode) {
          badge.style.opacity = '0';
          badge.style.transform = 'translateX(100%)';
          setTimeout(() => badge.remove(), 300);
        }
      }, 5000);
      
      return badge;
    }
    
    static createAdvancedWarning(detectedPII, platform, inputElement) {
      const riskLevel = this.getHighestRiskLevel(detectedPII);
      const modal = document.createElement('div');
      modal.id = 'complyze-advanced-warning';
      
      const riskColors = {
        'low': { primary: '#f59e0b', secondary: '#d97706' },
        'medium': { primary: '#f97316', secondary: '#ea580c' },
        'high': { primary: '#dc2626', secondary: '#b91c1c' }
      };
      
      const colors = riskColors[riskLevel];
      
      modal.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        ">
          <div style="
            background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
            color: white;
            padding: 30px;
            border-radius: 16px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 25px 50px rgba(0,0,0,0.5);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            animation: slideIn 0.3s ease;
          ">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <div style="
                width: 48px;
                height: 48px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 16px;
                font-size: 24px;
              ">⚠️</div>
              <div>
                <h2 style="margin: 0; font-size: 20px; font-weight: 600;">
                  Security Alert
                </h2>
                <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">
                  Sensitive data detected in ${platform} prompt
                </p>
              </div>
            </div>
            
            <div style="margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500;">
                Detected Sensitive Information:
              </h3>
              <div style="
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 16px;
              ">
                ${this.createPIIList(detectedPII)}
              </div>
              
              <div style="
                background: rgba(0,0,0,0.2);
                border-radius: 8px;
                padding: 12px;
                font-size: 13px;
                line-height: 1.4;
              ">
                <strong>🔒 Why this matters:</strong> Sharing sensitive data with AI systems may violate privacy policies, 
                compliance requirements, or put your organization at risk. Consider using redacted or synthetic data instead.
              </div>
            </div>
            
            <div style="display: flex; gap: 12px;">
              <button id="complyze-get-safe-version" style="
                flex: 1;
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 14px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
              ">
                🔒 Get Safe Version
              </button>
              
              <button id="complyze-proceed-anyway" style="
                flex: 1;
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 14px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
              ">
                ⚡ Proceed Anyway
              </button>
            </div>
            
            <button id="complyze-close-advanced" style="
              position: absolute;
              top: 12px;
              right: 12px;
              background: none;
              border: none;
              color: white;
              cursor: pointer;
              font-size: 24px;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              opacity: 0.7;
              transition: all 0.2s ease;
            ">×</button>
          </div>
        </div>
        
        <style>
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { transform: translateY(-20px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          
          #complyze-get-safe-version:hover {
            background: rgba(255,255,255,0.3) !important;
            transform: translateY(-1px);
          }
          
          #complyze-proceed-anyway:hover {
            background: rgba(0,0,0,0.4) !important;
            transform: translateY(-1px);
          }
          
          #complyze-close-advanced:hover {
            opacity: 1 !important;
            background: rgba(255,255,255,0.2) !important;
          }
        </style>
      `;
      
      document.body.appendChild(modal);
      return modal;
    }
    
    static createPIIList(detectedPII) {
      return detectedPII.map(pii => {
        const riskEmoji = {
          'high': '🔴',
          'medium': '🟡',
          'low': '🟢'
        }[pii.riskLevel] || '🔍';
        
        return `
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 6px;
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>${riskEmoji}</span>
              <span style="font-weight: 500;">${pii.description}</span>
            </div>
            <span style="
              background: rgba(255,255,255,0.2);
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
            ">${pii.count} found</span>
          </div>
        `;
      }).join('');
    }
    
    static getHighestRiskLevel(detectedPII) {
      const riskLevels = ['low', 'medium', 'high'];
      let highest = 'low';
      
      detectedPII.forEach(pii => {
        if (riskLevels.indexOf(pii.riskLevel) > riskLevels.indexOf(highest)) {
          highest = pii.riskLevel;
        }
      });
      
      return highest;
    }
    
    static createNotificationToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = 'complyze-toast';
      
      const colors = {
        'success': { bg: '#10b981', border: '#059669' },
        'warning': { bg: '#f59e0b', border: '#d97706' },
        'error': { bg: '#dc2626', border: '#b91c1c' },
        'info': { bg: '#3b82f6', border: '#2563eb' }
      };
      
      const color = colors[type] || colors.info;
      
      toast.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 999997;
          background: ${color.bg};
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
          border: 1px solid ${color.border};
          animation: toastSlideIn 0.3s ease;
          max-width: 400px;
          text-align: center;
        ">
          ${message}
        </div>
        
        <style>
          @keyframes toastSlideIn {
            from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
          }
          
          @keyframes toastSlideOut {
            from { transform: translateX(-50%) translateY(0); opacity: 1; }
            to { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          }
        </style>
      `;
      
      document.body.appendChild(toast);
      
      // Auto-remove after 4 seconds
      setTimeout(() => {
        if (toast.parentNode) {
          toast.firstElementChild.style.animation = 'toastSlideOut 0.3s ease';
          setTimeout(() => toast.remove(), 300);
        }
      }, 4000);
      
      return toast;
    }
  }
  
  // Enhanced Input Monitoring
  class ComplyzeInputEnhancer {
    static addSecurityIndicator(inputElement) {
      if (inputElement.dataset.complyzeEnhanced) return;
      
      const indicator = document.createElement('div');
      indicator.className = 'complyze-security-indicator';
      indicator.innerHTML = `
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 2px solid white;
          z-index: 1000;
          cursor: pointer;
          transition: all 0.2s ease;
        " title="Protected by Complyze AI Guard">
          🛡️
        </div>
      `;
      
      // Position relative to input
      const rect = inputElement.getBoundingClientRect();
      indicator.style.position = 'fixed';
      indicator.style.top = `${rect.top}px`;
      indicator.style.left = `${rect.right - 16}px`;
      indicator.style.zIndex = '1000';
      
      document.body.appendChild(indicator);
      inputElement.dataset.complyzeEnhanced = 'true';
      
      // Update position on scroll/resize
      const updatePosition = () => {
        const newRect = inputElement.getBoundingClientRect();
        indicator.style.top = `${newRect.top}px`;
        indicator.style.left = `${newRect.right - 16}px`;
      };
      
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return indicator;
    }
    
    static createTypingIndicator() {
      const indicator = document.createElement('div');
      indicator.className = 'complyze-typing-indicator';
      indicator.innerHTML = `
        <div style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 999996;
          animation: pulse 2s infinite;
        ">
          <div style="
            width: 6px;
            height: 6px;
            background: #10b981;
            border-radius: 50%;
            animation: dot1 1.4s infinite;
          "></div>
          <div style="
            width: 6px;
            height: 6px;
            background: #10b981;
            border-radius: 50%;
            animation: dot2 1.4s infinite;
          "></div>
          <div style="
            width: 6px;
            height: 6px;
            background: #10b981;
            border-radius: 50%;
            animation: dot3 1.4s infinite;
          "></div>
          <span>Scanning for sensitive data...</span>
        </div>
        
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
          
          @keyframes dot1 {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
          }
          
          @keyframes dot2 {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
          }
          
          @keyframes dot3 {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            60% { transform: scale(1); opacity: 1; }
          }
        </style>
      `;
      
      document.body.appendChild(indicator);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.remove();
        }
      }, 3000);
      
      return indicator;
    }
  }
  
  // Export to window for access from content script
  window.ComplyzeEnhanced = {
    Modal: ComplyzeEnhancedModal,
    InputEnhancer: ComplyzeInputEnhancer
  };
  
  console.log('Complyze Enhanced UI components loaded');
  
})(); 