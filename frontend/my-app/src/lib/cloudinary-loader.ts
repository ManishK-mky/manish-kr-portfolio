/**
 * next/image loader that asks Cloudinary for the exact width requested, in the
 * best format the browser supports (f_auto) at automatic quality (q_auto).
 * Non-Cloudinary sources are returned unchanged.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const marker = '/upload/';
  const idx = src.indexOf(marker);
  if (!src.startsWith('https://res.cloudinary.com/') || idx === -1) return src;
  const transform = ['f_auto', `q_${quality ?? 'auto'}`, `w_${width}`, 'c_limit'].join(',');
  return `${src.slice(0, idx + marker.length)}${transform}/${src.slice(idx + marker.length)}`;
}
