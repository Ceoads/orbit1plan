import { useEffect, useRef, memo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LatexRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders text with embedded LaTeX expressions
 * Supports both inline ($...$) and display ($$...$$) math
 */
export const LatexRenderer = memo(({ content, className = "" }: LatexRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // Parse and render LaTeX expressions
    const rendered = parseAndRenderLatex(content);
    containerRef.current.innerHTML = rendered;
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className={`latex-content ${className}`}
    />
  );
});

LatexRenderer.displayName = "LatexRenderer";

/**
 * Parse text and render LaTeX expressions
 * Handles both inline ($...$) and block ($$...$$) expressions
 */
function parseAndRenderLatex(text: string): string {
  if (!text) return "";

  let result = text;

  // First, handle display math ($$...$$)
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
    try {
      return `<div class="latex-display my-4">${katex.renderToString(latex.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false,
      })}</div>`;
    } catch {
      return `<div class="latex-error text-destructive">${latex}</div>`;
    }
  });

  // Then, handle inline math ($...$)
  // Avoid matching already processed display math
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, latex) => {
    try {
      return katex.renderToString(latex.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return `<span class="latex-error text-destructive">${latex}</span>`;
    }
  });

  // Handle escaped LaTeX commands like \alpha, \beta directly in text
  const mathCommands = [
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'mu', 
    'pi', 'sigma', 'omega', 'phi', 'psi', 'rho', 'tau', 'nu', 'xi',
    'Delta', 'Sigma', 'Omega', 'Pi', 'Phi', 'Psi', 'Lambda',
    'infty', 'partial', 'nabla', 'sum', 'prod', 'int', 'sqrt',
    'leq', 'geq', 'neq', 'approx', 'equiv', 'pm', 'times', 'div',
    'cdot', 'rightarrow', 'leftarrow', 'Rightarrow', 'Leftarrow'
  ];

  const commandPattern = new RegExp(`\\\\(${mathCommands.join('|')})(?![a-zA-Z])`, 'g');
  result = result.replace(commandPattern, (match, cmd) => {
    try {
      return katex.renderToString(`\\${cmd}`, {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return match;
    }
  });

  return result;
}

/**
 * Check if text contains LaTeX expressions
 */
export function containsLatex(text: string | null): boolean {
  if (!text) return false;
  return /\$[\s\S]+?\$|\\[a-zA-Z]+/.test(text);
}
