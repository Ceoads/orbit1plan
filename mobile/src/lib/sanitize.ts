/**
 * Input sanitization utilities for client-side validation.
 * Strips dangerous characters and enforces length limits.
 */

// Strip HTML tags and dangerous characters
export function sanitizeText(input: string, maxLength = 500): string {
  return input
    .replace(/<[^>]*>/g, '')           // Remove HTML tags
    .replace(/[<>"'`]/g, '')           // Remove dangerous chars
    .replace(/javascript:/gi, '')      // Remove JS protocol
    .replace(/on\w+\s*=/gi, '')        // Remove event handlers
    .trim()
    .slice(0, maxLength);
}

// Sanitize for note content (allows more chars but still safe)
export function sanitizeNoteContent(input: string, maxLength = 10000): string {
  return input
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove style tags
    .replace(/on\w+\s*=/gi, '')                        // Remove event handlers
    .replace(/javascript:/gi, '')                      // Remove JS protocol
    .trim()
    .slice(0, maxLength);
}

// Sanitize URL input
export function sanitizeUrl(input: string, maxLength = 2048): string {
  const trimmed = input.trim().slice(0, maxLength);
  // Only allow http/https protocols
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    return '';
  }
  return trimmed;
}

// Input length limits for each field type
export const INPUT_LIMITS = {
  title: 200,
  name: 100,
  roomNumber: 50,
  teacherName: 100,
  noteContent: 10000,
  url: 2048,
  search: 200,
} as const;
