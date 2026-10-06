export interface StoredActaAttachment {
  name: string;
  type: string;
  dataUrl: string;
  size: number;
}

export function serializeActaAttachment(attachment: StoredActaAttachment): string {
  return JSON.stringify(attachment);
}

export function normalizeActaAttachments(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((attachment): attachment is string => typeof attachment === "string");
  }
  if (typeof value !== "string") return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((attachment): attachment is string => typeof attachment === "string");
    }
  } catch {
    return [value];
  }

  return [value];
}

export function parseActaAttachment(value: string): StoredActaAttachment | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      parsed
      && typeof parsed === "object"
      && "name" in parsed
      && typeof parsed.name === "string"
      && "type" in parsed
      && typeof parsed.type === "string"
      && "dataUrl" in parsed
      && typeof parsed.dataUrl === "string"
      && (!("size" in parsed) || typeof parsed.size === "number")
    ) {
      return {
        name: parsed.name,
        type: parsed.type,
        dataUrl: parsed.dataUrl,
        size: typeof parsed.size === "number" ? parsed.size : 0,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error(`No se pudo leer el archivo ${file.name}.`));
      }
    };
    reader.onerror = () => reject(reader.error || new Error(`No se pudo leer el archivo ${file.name}.`));
    reader.readAsDataURL(file);
  });
}
