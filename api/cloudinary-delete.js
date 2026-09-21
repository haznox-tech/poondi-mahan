import crypto from 'crypto';

function extractCloudinaryPublicId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return '';
  if (!urlOrId.includes('res.cloudinary.com')) {
    return urlOrId.replace(/^\//, '');
  }
  try {
    const uploadIdx = urlOrId.indexOf('/upload/');
    if (uploadIdx === -1) return urlOrId;
    let pathPart = urlOrId.slice(uploadIdx + '/upload/'.length);
    const segments = pathPart.split('/');
    const cleanSegments = [];
    let pastTransformations = false;
    for (const seg of segments) {
      if (!pastTransformations) {
        if (/^v\d+$/.test(seg)) {
          pastTransformations = true;
          continue;
        }
        if (seg.includes(',') || /^[a-z]_[a-z0-9]/i.test(seg)) {
          continue;
        }
        pastTransformations = true;
      }
      cleanSegments.push(seg);
    }
    const fullPathWithExt = cleanSegments.join('/');
    const lastDot = fullPathWithExt.lastIndexOf('.');
    return lastDot !== -1 ? fullPathWithExt.slice(0, lastDot) : fullPathWithExt;
  } catch {
    return urlOrId;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const rawPublicId = (body.publicId || body.src || body.url || '').trim();
    const publicId = extractCloudinaryPublicId(rawPublicId);

    const cloudName = (
      body.cloudName ||
      process.env.VITE_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      ''
    ).trim();

    const apiKey = (
      body.apiKey ||
      process.env.VITE_CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_KEY ||
      ''
    ).trim();

    const apiSecret = (
      body.apiSecret ||
      process.env.CLOUDINARY_API_SECRET ||
      process.env.VITE_CLOUDINARY_API_SECRET ||
      ''
    ).trim();

    if (!publicId) {
      return res.status(400).json({ error: 'publicId is required' });
    }

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(400).json({
        error:
          'Cloudinary cloudName, apiKey, and apiSecret are required to permanently destroy assets from Cloudinary.',
      });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const cldData = await cldRes.json();

    if (!cldRes.ok || cldData.result !== 'ok') {
      return res.status(cldRes.status || 500).json({
        error: cldData.error?.message || cldData.result || 'Cloudinary destroy failed',
      });
    }

    return res.status(200).json({ ok: true, result: cldData.result });
  } catch (err) {
    console.error('[cloudinary-delete] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
