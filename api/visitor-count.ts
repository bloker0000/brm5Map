import { Redis } from '@upstash/redis';

const KEY = 'brm5_visitor_count';

// the bits of vercel's node request and response this uses
interface Request {
  method?: string;
}

interface Response {
  status(code: number): Response;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

let redis: Redis | undefined;

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // reads the KV_REST_API_* variables the old vercel kv store already has
    redis ??= Redis.fromEnv();
    const count = req.method === 'POST'
      ? await redis.incr(KEY)
      : (await redis.get<number>(KEY)) ?? 0;
    return res.status(200).json({ count });
  } catch {
    return res.status(503).json({ error: 'Service unavailable' });
  }
}
