export const sanitizeFileName = (fileName: string) => {
  let sanitized = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  sanitized = sanitized.replace(/\s+/g, "-");
  sanitized = sanitized.replace(/[^a-zA-Z0-9-._]/g, "");
  sanitized = sanitized.replace(/--+/g, "-");
  sanitized = sanitized.replace(/^-+|-+$/g, "");
  return sanitized;
};