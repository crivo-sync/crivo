import { Transform, type TransformFnParams } from 'class-transformer';

function stripHtml(value: string): string {
  return value
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

export function SanitizeText() {
  return Transform(({ value }: TransformFnParams) => {
    if (typeof value === 'string') return stripHtml(value);
    if (Array.isArray(value)) {
      return value.map((item) =>
        typeof item === 'string' ? stripHtml(item) : item,
      );
    }
    return value;
  });
}
