// Vercel Serverless Function: 楽天トラベルAPI プロキシ
// サーバー経由でAPIを呼び出すことでCORS制限を回避

export default async function handler(req, res) {
    // CORS ヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    // GETのみ許可
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { keyword, hits, page, applicationId, accessKey } = req.query;

    // バリデーション
    if (!applicationId || !accessKey) {
        return res.status(400).json({ error: 'applicationId and accessKey are required' });
    }
    if (!keyword) {
        return res.status(400).json({ error: 'keyword is required' });
    }

    try {
        // 楽天APIにリクエスト
        // applicationId → URLパラメータ
        // accessKey → Bearer認証ヘッダー
        const params = new URLSearchParams({
            applicationId: applicationId,
            keyword: keyword,
            hits: hits || '30',
            page: page || '1',
            formatVersion: '2',
            format: 'json',
        });

        const apiUrl = `https://openapi.rakuten.co.jp/engine/api/Travel/KeywordHotelSearch/20170426?${params.toString()}`;

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${accessKey}`,
            },
        });

        const data = await response.json();

        // デバッグ情報を付加して返す
        return res.status(200).json({
            _debug: {
                status: response.status,
                hasHotels: !!(data && data.hotels),
                keys: data ? Object.keys(data) : [],
            },
            ...data,
        });

    } catch (error) {
        console.error('API Proxy Error:', error);
        return res.status(500).json({
            error: 'API request failed',
            error_description: error.message,
        });
    }
}
