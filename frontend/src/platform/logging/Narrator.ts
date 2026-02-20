// FILEPATH: frontend/src/platform/logging/Narrator.ts
// @file: Universal Narrative Engine 3.5 (Diagnostic Edition)
// @author: The Engineer
// @description: The "Storyteller" Observability System.
// FEATURES:
// ⚡ REAL-TIME TYPING: Captures 'input' events globally.
// ⚡ FOCUS TRACKING: Captures 'focusout' (Blur) events globally.
// ⚡ X-RAY VISION: Auto-resolves File Path and Line Number for every log.
// ⚡ WARN CHANNEL: Added missing public API for warnings.
// ⚡ GROUPING: Added support for console groups.
// 🔊 OMNISCIENT SENTINEL: Logs ALL clicks for debugging.


import { IS_DEV } from '../../config';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'TRACE';
type LogChannel = 'USER' | 'NETWORK' | 'UI' | 'STORE' | 'LOGIC' | 'SYSTEM' | 'STORY' | 'INPUT' | 'VALIDATOR' | 'WIZARD' | 'API' | 'MOCK' | 'CACHE' | 'RENDERER' | 'SENTINEL' | 'KERNEL' | 'BOOT' | 'ROUTER' | 'SHELL' | 'REGISTRY';

export class UniversalNarrator {
  private version = '3.5.0-DIAGNOSTIC';
  private isEnabled: boolean;
  private lastLogTime: number = Date.now();
  
  // ⚡ CONFIGURATION: Maximum Verbosity
  private MAX_LOG_LENGTH = 1000000; // 1 Million Characters (Effectively Unlimited)

  private styles: Record<LogChannel, string> = {
    USER:      'color: #e91e63; font-weight: bold; background: #ffe0eb; padding: 2px 4px; border-radius: 3px;',
    NETWORK:   'color: #2196f3; font-weight: bold;',
    UI:        'color: #9c27b0; font-weight: bold;',
    STORE:     'color: #4caf50; font-weight: bold;',
    LOGIC:     'color: #ff9800; font-weight: bold;',
    SYSTEM:    'color: #607d8b; font-style: italic;',
    STORY:     'color: #000; background: #00e676; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
    INPUT:     'color: #00bcd4; font-family: monospace;',
    VALIDATOR: 'color: #ff5722; font-weight: bold;',
    WIZARD:    'color: #795548; font-weight: bold;',
    API:       'color: #3f51b5; font-weight: bold;',
    MOCK:      'color: #9e9e9e; font-style: italic;',
    CACHE:     'color: #009688; font-weight: bold;',
    RENDERER:  'color: #673ab7; font-weight: bold;',
    SENTINEL:  'color: #e91e63; font-weight: bold;',
    KERNEL:    'color: #ff5722; font-weight: bold; background: #fff0f6; padding: 2px 4px;',
    BOOT:      'color: #fff; background: #000; padding: 2px 4px; font-weight: bold;',
    ROUTER:    'color: #722ed1; font-weight: bold;',
    SHELL:     'color: #13c2c2; font-weight: bold;',
    REGISTRY:  'color: #eb2f96; font-weight: bold;'
  };

  constructor() {
    // We try to detect environment, but default to true if we can't tell, to ensure logging works.
    let isDev = true; 
    let isDebug = false;

    try {
        // @ts-ignore
        isDev = import.meta.env.DEV;
        // @ts-ignore
        isDebug = import.meta.env.VITE_DEBUG_MODE === 'true';
    } catch { isDev = true; }
    
    this.isEnabled = isDev || isDebug;

    if (this.isEnabled) {
      console.log(`%c 👁️ NARRATOR v${this.version} %c [DIAGNOSTIC MODE] `, 'color: #00e676; background: #000; padding: 4px;', 'color: white; background: red; padding: 4px;');
      this._initNetworkInterceptor();
      this._initDOMSentinel();
      this._initDragSentinel();
      this._initKeyboardSentinel();
      this._initPresenceSentinel();
      this._initInputSentinel();
    }
  }

  // --- PUBLIC API ---

  public tell(channel: LogChannel, message: string, data: any = null): void {
    this._broadcast('INFO', channel, message, data);
  }

  public whisper(channel: LogChannel, message: string, data: any = null): void {
    this._broadcast('DEBUG', channel, message, data);
  }

  public warn(channel: LogChannel, message: string, data: any = null): void {
    this._broadcast('WARN', channel, message, data);
  }

  public scream(channel: LogChannel, message: string, error: any = null): void {
    this._broadcast('ERROR', channel, message, error);
  }

  public trace(component: string, action: string, state: any): void {
    this._broadcast('TRACE', 'UI', `🎥 <${component}> ${action}`, state);
  }

  public story(headline: string, detail?: string): void {
    this._broadcast('INFO', 'STORY', headline, detail);
  }

  // ⚡ NEW: Grouping Support
  public group(label: string): void {
    if (this.isEnabled) console.groupCollapsed(`%c 📂 ${label}`, 'font-weight: bold; color: #666;');
  }

  public groupEnd(): void {
    if (this.isEnabled) console.groupEnd();
  }

  // --- INTERNAL ---

  private _resolveCaller(): string {
    try {
        const err = new Error();
        const stack = err.stack;
        if (!stack) return '';

        const lines = stack.split('\n');
        // Line 0: Error
        // Line 1: _resolveCaller
        // Line 2: _broadcast
        // Line 3: tell/scream/whisper
        // Line 4: The actual caller <--- Target
        
        // Find the first line that is NOT inside Narrator.ts
        // This regex looks for file paths that include /src/
        for (let i = 3; i < lines.length; i++) {
            const line = lines[i];
            if (!line.includes('Narrator.ts')) {
                // Extract file path: "    at Context (http://localhost:3000/src/file.ts:10:20)"
                const match = line.match(/\((.*src\/.*)\)/) || line.match(/at\s+(.*src\/.*)/);
                if (match && match[1]) {
                    const fullUrl = match[1];
                    // Clean up: Remove http://localhost:port/
                    const parts = fullUrl.split('/src/');
                    if (parts.length > 1) {
                        return `src/${parts[1]}`; 
                    }
                    return fullUrl;
                }
            }
        }
        return '';
    } catch {
        return '';
    }
  }

  private _broadcast(level: LogLevel, channel: LogChannel, message: string, payload: any): void {
    if (!this.isEnabled) return;

    // Time Delta Calculation
    const now = Date.now();
    const delta = now - this.lastLogTime;
    this.lastLogTime = now;
    
    // Format Delta: [+450ms] or [+1.2s] or [-----] if idle > 5s
    let deltaStr = '';
    if (delta > 5000) deltaStr = `[-----]`;
    else if (delta > 1000) deltaStr = `[+${(delta/1000).toFixed(1)}s]`;
    else deltaStr = `[+${delta}ms]`;

    const style = this.styles[channel] || 'color: #ccc';
    
    // ⚡ X-RAY: Inject Caller Context
    const caller = this._resolveCaller();
    const callerTag = caller ? ` %c[${caller}]` : '';
    const callerStyle = 'color: #888; font-weight: normal; font-size: 0.8em;';

    const prefix = `%c${deltaStr} [${channel}]`;

    // ⚡ IMPROVED OUTPUT
    if (payload !== null && payload !== undefined) {
      if (level === 'ERROR') {
          console.group(prefix + callerTag, style, callerStyle, message); 
      } else {
          console.groupCollapsed(prefix + callerTag, style, callerStyle, message);
      }
      
      // 1. Live Object (Chrome DevTools lets you expand this)
      console.log(payload);
      
      // 2. Serialized Backup (For Copy/Paste) - ⚡ LOUD MODE: Limit increased significantly
      try {
           if (payload instanceof Error) {
               console.log(`%c[STACK]`, 'color:red', payload.stack);
           } else {
               const str = JSON.stringify(payload, null, 2);
               if (str.length < this.MAX_LOG_LENGTH) console.log(`[JSON]`, str);
               else console.log(`[JSON] (Truncated ${str.length} chars)`, str.substring(0, this.MAX_LOG_LENGTH) + '... [TRUNCATED]');
           }
      } catch (e) {
          console.warn(`[JSON] Circular Structure`);
      }
      
      console.groupEnd();
    } else {
      console.log(prefix + callerTag, style, callerStyle, message);
    }
  }

  // --- SENTINELS ---

  private _initPresenceSentinel(): void {
      if (typeof window === 'undefined') return;

      document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
              this.tell('USER', '⏸️ User switched tab (Background)');
          } else {
              this.tell('USER', '▶️ User returned to tab (Foreground)');
          }
  
    });

      window.addEventListener('blur', () => this.tell('USER', '😶 Window lost focus (Alt-Tab)'));
      window.addEventListener('focus', () => this.tell('USER', '👀 Window active'));
  }

  private _initDOMSentinel(): void {
    if (typeof window === 'undefined') return;
    
    // ⚡ DIAGNOSTIC: Confirm Sentinel Attachment
    this.tell('SENTINEL', '👁️ DOM Watcher Active (Logging ALL interactions)');

    // 1. OMNISCIENT CLICK LISTENER (UNFILTERED)
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Gather Identity
      const tag = target.tagName;
      const id = target.id ? `#${target.id}` : '';
      const classes = target.className && typeof target.className === 'string' ? `.${target.className.split(' ').join('.')}` : '';
      const text = target.innerText?.slice(0, 20).replace(/\n/g, ' ') || '';
      
      this.tell('USER', `👆 Clicked <${tag}${id}${classes}> "${text}"`, {
          x: e.clientX,
          y: e.clientY,
          path: e.composedPath().map((el: any) => el.tagName || 'WINDOW').join(' > ')
      });

    }, true); // Capture phase to see it before React stops it

    // 2. GLOBAL BLUR LISTENER
    document.addEventListener('focusout', (e: FocusEvent) => {
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA'].includes(target.tagName)) {
            const label = target.getAttribute('name') || target.id || 'Unknown Input';
            // @ts-ignore
            const val = target.value; 
     
       this.tell('USER', `💨 Blured [${label}] Value: "${val}"`);
        }
    }, true);
  }

  private _initDragSentinel(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('dragstart', (e: DragEvent) => {
       const target = e.target as HTMLElement;
       const label = target.innerText || target.getAttribute('title') || 'Object';
       this.tell('USER', `✋ Started Dragging "${label}"`);
    });

    document.addEventListener('drop', (e: DragEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('react-flow__pane')) {
            this.tell('USER', `📍 Dropped Item onto Workflow Canvas`);
        }
    });
  }

  private _initKeyboardSentinel(): void {
      if (typeof window === 'undefined') return;

      document.addEventListener('keydown', (e: KeyboardEvent) => {
          const target = e.target as HTMLElement;
          const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName);
          
          if (!isInput || e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab') {
             this.tell('USER', `⌨️  Key: [${e.key}]`);
          }
      });
  }

  private _initInputSentinel(): void {
      if (typeof window === 'undefined') return;

      document.addEventListener('input', (e: Event) => {
          const target = e.target as HTMLInputElement;
          this.whisper('INPUT', `Typing in [${target.name || target.id}]: "${target.value}"`);
      }, true);
  }

  private _initNetworkInterceptor(): void {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (...args: [RequestInfo | URL, RequestInit?]) {
      const [resource, config] = args;
      const url = typeof resource === 'string' ? resource : (resource as Request).url;
      const method = config?.method || 'GET';

      if (url.includes('node_modules') || url.includes('@vite')) return originalFetch.apply(window, args);

      const start = performance.now();
      try {
        const response = await originalFetch.apply(window, args);
        const duration = (performance.now() - start).toFixed(0);
        const status = response.status;
        
        if (status >= 400) {
            self.scream('NETWORK', `🔥 ${method} ${url} (${status}) - ${duration}ms`);
        } else {
            self.whisper('NETWORK', `✅ ${method} ${url} (${status}) - ${duration}ms`);
        }
        return response;
      } catch (err) {
        self.scream('NETWORK', `❌ ${method} ${url} FAILED`, err);
        throw err;
      }
    };
  }
}

export const logger = new UniversalNarrator();

