// Vercel Serverless Function: 楽天トラベル GetAreaClass API プロキシ
// エリアコードを取得するためのプロキシ

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { applicationId, accessKey } = req.query;

    if (!applicationId || !accessKey) {
        return res.status(400).json({ error: 'applicationId and accessKey are required' });
    }

    try {
        const apiUrl = `https://openapi.rakuten.co.jp/engine/api/Travel/GetAreaClass/20131024?applicationId=${applicationId}&format=json&formatVersion=2`;

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${accessKey}`,
                'Referer': 'https://rlist-seven.vercel.app',
                'Origin': 'https://rlist-seven.vercel.app',
                'User-Agent': req.headers['user-agent'] || 'RLIST/1.0',
            },
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('GetAreaClass API Error:', error);
        return res.status(500).json({
            error: 'API request failed',
            error_description: error.message,
        });
    }
}
