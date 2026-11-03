export async function copyMotionCode(code: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(code);
  } catch {
    throw new Error("复制失败：浏览器未允许访问剪贴板，请在“代码展示”中手动复制，或导出 HTML。");
  }
}
