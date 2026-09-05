export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const kv = await import('@vercel/kv').then(m => m.kv);

    if (req.method === 'POST') {
      const count = await kv.incr('brm5_visitor_count');
      return res.status(200).json({ count });
    }

    const count = await kv.get('brm5_visitor_count') || 0;
    return res.status(200).json({ count });
  } catch (error) {
    return res.status(500).json({ count: 0, error: 'Service unavailable' });
  }
}
