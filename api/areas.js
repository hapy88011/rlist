// Vercel Serverless Function: 楽天トラベル地区コードAPI プロキシ
// GetAreaClass API を呼び出してエリア階層データを取得

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // エリアデータは頻繁に変わらないのでキャッシュ可能
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { applicationId, accessKey } = req.query;

    if (!applicationId || !accessKey) {
        return res.status(400).json({ error: 'applicationId and accessKey are required' });
    }

    try {
        const params = new URLSearchParams({
            applicationId,
            accessKey,
            formatVersion: '2',
            format: 'json',
        });

        const apiUrl = `https://openapi.rakuten.co.jp/engine/api/Travel/GetAreaClass/20140210?${params.toString()}`;
        console.log('[RLIST] GetAreaClass request');

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${accessKey}`,
                'Referer': 'https://rlist-seven.vercel.app/',
                'Origin': 'https://rlist-seven.vercel.app',
            },
        });

        const data = await response.json();

        if (data.error) {
            console.error('[RLIST] GetAreaClass error:', data.error);
            return res.status(400).json(data);
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('[RLIST] GetAreaClass Proxy Error:', error);
        return res.status(500).json({ error: 'API request failed', error_description: error.message });
    }
}
