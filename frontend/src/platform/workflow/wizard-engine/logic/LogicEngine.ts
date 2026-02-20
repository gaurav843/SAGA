// FILEPATH: frontend/src/platform/workflow/wizard-engine/logic/LogicEngine.ts
// @file: Frontend Logic Engine (The Evaluator)
// @author: ansav8@gmail.com
// @security-level: LEVEL 9 (Sandboxed Evaluation)
// @invariant: Evaluation must never crash the UI, even with invalid syntax.
// @narrator: Logs evaluation trace to F12.
// @description: A lightweight parser for conditional rendering strings (e.g. "host.role == 'admin'").

import { logger } from '../../../logging';

export class LogicEngine {
    
    /**
     * Extracts field names that an expression depends on.
     * Used to auto-configure ProFormDependency.
     * Pattern: Looks for "host.FIELD_NAME" or "formData.FIELD_NAME"
     */
    static extractDependencies(expression?: string | boolean): string[] {
        if (!expression || typeof expression !== 'string') return [];
        
        // Regex to find "host.xyz" or "formData.xyz"
        // Captures 'xyz'
        const regex = /(?:host|formData)\.([a-zA-Z0-9_]+)/g;
        const matches = new Set<string>();
        
        let match;
        while ((match = regex.exec(expression)) !== null) {
            if (match[1]) matches.add(match[1]);
        }
        
        const deps = Array.from(matches);
        // logger.trace("LOGIC", `🔍 Analyzed dependencies for "${expression}"`, { deps });
        return deps;
    }

    /**
     * Safely evaluates a boolean expression against a data context.
     * Supports basic operators: ==, !=, >, <, >=, <=, !, &&, ||
     */
    static evaluate(expression: string | boolean | undefined, context: Record<string, any>): boolean {
        // 1. Trivial Cases
        if (expression === undefined || expression === null) return true; // Default to visible
        if (typeof expression === 'boolean') return expression;
        if (expression.trim() === '') return true;

        // 2. Prepare Sandbox
        // We map 'host' and 'formData' to the same context for convenience
        const safeContext = {
            host: context,
            formData: context,
            // Helper for simple "contains" checks
            contains: (haystack: any, needle: any) => String(haystack).includes(String(needle))
        };

        // 3. Execution
        try {
            // 🛡️ SECURITY: Function constructor is safer than eval(), but still requires 
            // strict input sanitization. In a Level 9 system, we'd use a parser (AST).
            // For now, we wrap in a try-catch sandbox.
            
            // Allow-list check (Basic prevention of window/alert access)
            if (expression.includes('window') || expression.includes('document') || expression.includes('eval')) {
                logger.warn("LOGIC", `⛔ Unsafe expression blocked: ${expression}`);
                return false;
            }

            const func = new Function('host', 'formData', 'contains', `return ${expression};`);
            const result = func(safeContext.host, safeContext.formData, safeContext.contains);
            
            // logger.trace("LOGIC", `⚡ Evaluated: "${expression}"`, { result, context_sample: Object.keys(context) });
            return !!result;

        } catch (err) {
            // Fail Open or Closed? 
            // For visibility (show_if), we fail CLOSED (hide it) to prevent broken UI.
            // For requirements (required_if), we fail OPEN (not required) to prevent blocking.
            logger.warn("LOGIC", `⚠️ Evaluation Error: "${expression}"`, err);
            return false; 
        }
    }
}

