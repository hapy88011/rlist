// Vercel Serverless Function: 楽天トラベルAPI プロキシ
// ブラウザからのCORS制限を回避するため、サーバー経由でAPIを呼び出す

export default async function handler(req, res) {
    // CORS ヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    // GETのみ許可
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { keyword, hits, page, applicationId } = req.query;

    // バリデーション
    if (!applicationId) {
        return res.status(400).json({ error: 'applicationId is required' });
    }
    if (!keyword) {
        return res.status(400).json({ error: 'keyword is required' });
    }

    try {
        // 楽天APIにリクエスト
        const params = new URLSearchParams({
            applicationId: applicationId,
            keyword: keyword,
            hits: hits || '30',
            page: page || '1',
            formatVersion: '2',
            format: 'json',
        });

        const apiUrl = `https://app.rakuten.co.jp/services/api/Travel/KeywordHotelSearch/20170426?${params.toString()}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        // エラーレスポンスもそのまま返す
        return res.status(response.status).json(data);

    } catch (error) {
        console.error('API Proxy Error:', error);
        return res.status(500).json({
            error: 'API request failed',
            error_description: error.message,
        });
    }
}
