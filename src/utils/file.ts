import type { IconBaseFileType } from "@/types/iconBase";

const MAX_ICON_BASE_SIZE = 2 * 1024 * 1024;
const ALLOWED_EXTENSIONS: IconBaseFileType[] = ["png", "svg", "webp"];

export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function getIconBaseFileType(file: File): IconBaseFileType {
  const extension = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(extension as IconBaseFileType)) {
    throw new Error("只允许上传 PNG / SVG / WebP 格式的图标底座素材");
  }

  return extension as IconBaseFileType;
}

export function validateIconBaseFile(file: File): IconBaseFileType {
  const fileType = getIconBaseFileType(file);

  if (file.size > MAX_ICON_BASE_SIZE) {
    throw new Error("单个素材不能超过 2MB");
  }

  return fileType;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("素材读取失败，请重试"));
    reader.readAsDataURL(file);
  });
}

export function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "");
}
