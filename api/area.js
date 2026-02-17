// Vercel Serverless Function: 楽天トラベル GetAreaClass API プロキシ
// エリアコード一覧を取得して返す

export default async function handler(req, res) {
    // CORS ヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    // エリアデータはほとんど変わらないので1日キャッシュ
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { applicationId, accessKey } = req.query;

    if (!applicationId) {
        return res.status(400).json({ error: 'applicationId is required' });
    }

    try {
        const params = new URLSearchParams({
            applicationId: applicationId,
            formatVersion: '2',
            format: 'json',
        });

        // accessKeyがあればURLパラメータにも追加
        if (accessKey) {
            params.set('accessKey', accessKey);
        }

        // openapi ドメインを使用（KeywordHotelSearchと同じ）
        const apiUrl = `https://openapi.rakuten.co.jp/engine/api/Travel/GetAreaClass/20140210?${params.toString()}`;

        // ブラウザから送られてきたReferer/Originを取得して転送
        const browserReferer = req.headers.referer || req.headers.origin || 'https://rlist-seven.vercel.app/';

        const headers = {
            'Referer': browserReferer,
            'Origin': 'https://rlist-seven.vercel.app',
            'User-Agent': req.headers['user-agent'] || 'RLIST/1.0',
        };

        // accessKeyがあればBearerトークンとしても送信
        if (accessKey) {
            headers['Authorization'] = `Bearer ${accessKey}`;
        }

        const response = await fetch(apiUrl, { headers });
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
