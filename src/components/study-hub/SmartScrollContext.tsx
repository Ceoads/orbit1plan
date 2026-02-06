import { createContext, useContext, useState, useCallback, ReactNode } from "react";

/**
 * Represents a section anchor with bounding box info
 */
export interface SectionAnchor {
  id: string;
  label: string;
  // Relative position in the document (0-1 range)
  relativeY: number;
  // Original text snippet for reference
  textSnippet?: string;
}

interface SmartScrollContextType {
  anchors: SectionAnchor[];
  setAnchors: (anchors: SectionAnchor[]) => void;
  activeAnchorId: string | null;
  scrollToAnchor: (anchorId: string) => void;
  highlightedAnchor: string | null;
  clearHighlight: () => void;
}

const SmartScrollContext = createContext<SmartScrollContextType | undefined>(undefined);

interface SmartScrollProviderProps {
  children: ReactNode;
}

export const SmartScrollProvider = ({ children }: SmartScrollProviderProps) => {
  const [anchors, setAnchors] = useState<SectionAnchor[]>([]);
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const [highlightedAnchor, setHighlightedAnchor] = useState<string | null>(null);

  const scrollToAnchor = useCallback((anchorId: string) => {
    setActiveAnchorId(anchorId);
    setHighlightedAnchor(anchorId);
    
    // Clear highlight after animation
    setTimeout(() => {
      setHighlightedAnchor(null);
    }, 2000);
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightedAnchor(null);
  }, []);

  return (
    <SmartScrollContext.Provider
      value={{
        anchors,
        setAnchors,
        activeAnchorId,
        scrollToAnchor,
        highlightedAnchor,
        clearHighlight,
      }}
    >
      {children}
    </SmartScrollContext.Provider>
  );
};

export const useSmartScroll = () => {
  const context = useContext(SmartScrollContext);
  if (!context) {
    throw new Error("useSmartScroll must be used within SmartScrollProvider");
  }
  return context;
};

/**
 * Parse AI summary to generate section anchors
 * The AI should provide structured output with positions
 */
export function generateAnchorsFromSummary(
  summary: string | null,
  extractedText: string | null
): SectionAnchor[] {
  if (!summary) return [];

  const lines = summary.split(/[\n\r]+/).filter(line => line.trim());
  const anchors: SectionAnchor[] = [];

  lines.forEach((line, index) => {
    const cleanLine = line.replace(/^[-•*\d.]+\s*/, '').trim();
    if (!cleanLine) return;

    // Try to find this text in the extracted content to estimate position
    let relativeY = (index + 1) / (lines.length + 1); // Default: evenly distribute

    if (extractedText) {
      // Look for keywords from the summary in the extracted text
      const keywords = cleanLine.split(/\s+/).filter(w => w.length > 4).slice(0, 3);
      
      for (const keyword of keywords) {
        const idx = extractedText.toLowerCase().indexOf(keyword.toLowerCase());
        if (idx !== -1) {
          relativeY = idx / extractedText.length;
          break;
        }
      }
    }

    anchors.push({
      id: `anchor-${index}`,
      label: cleanLine,
      relativeY: Math.min(Math.max(relativeY, 0.05), 0.95), // Clamp to 5-95%
      textSnippet: cleanLine.substring(0, 50),
    });
  });

  return anchors;
}
