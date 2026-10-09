/**
 * Utility to generate botanical specimen illustrations from written field descriptions.
 * Uses open, keyless generative image inference with vintage scientific prompt tuning,
 * converting results to local Base64 for permanent offline IndexedDB storage.
 */

export async function generateBotanicalSketch(
  description: string,
  title?: string,
  environment?: string
): Promise<string> {
  if (!description || description.trim().length === 0) {
    throw new Error('Please provide an observation description to illustrate.');
  }

  // Clean description of key prefixes and excessive whitespace
  const cleanText = description
    .replace(/[A-Z][A-Za-z0-9\s()/-]{2,25}:/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);

  const subjectTerms = [
    title ? title : '',
    environment ? `${environment} habitat` : '',
    cleanText,
  ]
    .filter(Boolean)
    .join(', ');

  const prompt = `botanical specimen field sketch, watercolor study of ${subjectTerms}, vintage scientific naturalist illustration, antique parchment texture background, elegant flora morphology, detailed biological study, no text watermark`;

  const seed = Math.floor(Math.random() * 899999) + 100000;
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=576&nologo=true&seed=${seed}`;

  try {
    // Attempt to convert to base64 for permanent local IndexedDB storage
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { Accept: 'image/*' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      // Fallback: return direct image URL if direct conversion is rejected
      return imageUrl;
    }

    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve((reader.result as string) || imageUrl);
      };
      reader.onerror = () => {
        resolve(imageUrl);
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Direct image conversion to Base64 failed, falling back to direct URL:', err);
    return imageUrl;
  }
}
