// Vercel Serverless Function: 楽天トラベルAPI プロキシ
// ブラウザのRefererヘッダーをそのまま転送してCORS制限を回避

export default async function handler(req, res) {
    // CORS ヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { keyword, hits, page, applicationId, accessKey, middleClassCode, smallClassCode } = req.query;

    if (!applicationId || !accessKey) {
        return res.status(400).json({ error: 'applicationId and accessKey are required' });
    }
    if (!keyword && !middleClassCode) {
        return res.status(400).json({ error: 'keyword or middleClassCode is required' });
    }

    try {
        const params = new URLSearchParams({
            applicationId: applicationId,
            accessKey: accessKey,
            hits: hits || '30',
            page: page || '1',
            formatVersion: '2',
            format: 'json',
        });

        // キーワードがない場合、エリア検索用にデフォルトキーワード「ホテル」を使用
        // （KeywordHotelSearch APIはキーワード必須のため）
        const effectiveKeyword = keyword || (middleClassCode ? 'ホテル' : '');
        if (effectiveKeyword) {
            params.set('keyword', effectiveKeyword);
        }

        // エリアコードがあれば追加
        if (middleClassCode) {
            params.set('largeClassCode', 'japan');
            params.set('middleClassCode', middleClassCode);
            if (smallClassCode) {
                params.set('smallClassCode', smallClassCode);
            }
        }

        const apiUrl = `https://openapi.rakuten.co.jp/engine/api/Travel/KeywordHotelSearch/20170426?${params.toString()}`;

        // ブラウザから送られてきたReferer/Originを取得して転送
        const browserReferer = req.headers.referer || req.headers.origin || 'https://rlist-seven.vercel.app/';

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${accessKey}`,
                'Referer': browserReferer,
                'Origin': 'https://rlist-seven.vercel.app',
                'User-Agent': req.headers['user-agent'] || 'RLIST/1.0',
            },
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('API Proxy Error:', error);
        return res.status(500).json({
            error: 'API request failed',
            error_description: error.message,
        });
    }
}
