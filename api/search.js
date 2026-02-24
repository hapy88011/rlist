// Vercel Serverless Function: 楽天トラベルAPI プロキシ
// CORS制限を回避するためのプロキシサーバー

export default async function handler(req, res) {
    // CORS ヘッダー（全レスポンスに適用）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    // OPTIONSプリフライトリクエストの処理
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { keyword, hits, page, applicationId, accessKey, middleClassCode, smallClassName } = req.query;

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

        // キーワード構築: ユーザー入力キーワード + 小エリア名
        let effectiveKeyword = keyword || '';
        if (smallClassName) {
            effectiveKeyword = effectiveKeyword ? `${effectiveKeyword} ${smallClassName}` : smallClassName;
        }
        if (!effectiveKeyword && middleClassCode) {
            effectiveKeyword = 'ホテル';
        }
        if (effectiveKeyword) {
            params.set('keyword', effectiveKeyword);
        }

        // エリアコードがあれば追加
        if (middleClassCode) {
            params.set('middleClassCode', middleClassCode);
        }

        const apiUrl = `https://openapi.rakuten.co.jp/engine/api/Travel/KeywordHotelSearch/20170426?${params.toString()}`;

        console.log('API URL:', apiUrl);

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${accessKey}`,
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
