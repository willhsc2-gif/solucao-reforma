export const sanitizeFileName = (fileName: string | null | undefined): string => {
  // Garante que fileName seja uma string antes de chamar .normalize()
  const safeFileName = fileName ? String(fileName) : "";
  let sanitized = safeFileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  sanitized = sanitized.replace(/\s+/g, "-");
  sanitized = sanitized.replace(/[^a-zA-Z0-9-._]/g, "");
  sanitized = sanitized.replace(/--+/g, "-");
  sanitized = sanitized.replace(/^-+|-+$/g, "");
  return sanitized;
};