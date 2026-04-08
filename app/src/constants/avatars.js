/** Matches server default when provider has no image */
export const DEFAULT_PROVIDER_AVATAR =
  'https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3383.jpg?semt=ais_hybrid&w=740&q=80';

export function providerImageUri(provider) {
  const u = provider && typeof provider.image === 'string' ? provider.image.trim() : '';
  return u || DEFAULT_PROVIDER_AVATAR;
}
