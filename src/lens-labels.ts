/** Clarify that the adjustable, possibly unfocused screen position is not the theoretical image distance. */
export function lensVisibleLabel(text: string): string {
  return text.replace(/^像距\s*=/u, '光屏距離 =')
    .replace(/^調整像距 s/u, '調整光屏距離 s')
    .replace(/^像距 s\s*\/\s*cm/u, '光屏距離 s / cm');
}
