declare module 'heic-decode' {
  const decode: (entree: { buffer: Uint8Array }) => Promise<{ width: number; height: number; data: Uint8ClampedArray }>;
  export default decode;
}
