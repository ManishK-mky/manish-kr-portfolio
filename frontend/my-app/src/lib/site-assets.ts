import type { ImageRef } from '@/types/api';

/**
 * Local fallback portrait (public/Professional Office Headshot.png), shown
 * until a profile picture is uploaded in /admin/profile.
 */
export const FALLBACK_HEADSHOT: ImageRef = {
  mediaId: '',
  publicId: '',
  url: encodeURI('/Professional Office Headshot.png'),
  width: 1086,
  height: 1448,
  alt: 'Portrait of Manish Kumar',
};
