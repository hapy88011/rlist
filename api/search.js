// Vercel Serverless Function: 楽天トラベルAPI プロキシ
// CORS制限を回避するためのプロキシサーバー
// apiType パラメータで使用するAPIを切り替え:
//   'keyword' → KeywordHotelSearch
//   'simple'  → SimpleHotelSearch（smallClassCode対応）
//   未指定時: keyword があれば KeywordHotelSearch、なければ SimpleHotelSearch

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

    const { keyword, hits, page, applicationId, accessKey, middleClassCode, smallClassCode, smallClassName, sort, apiType } = req.query;

    if (!applicationId || !accessKey) {
        return res.status(400).json({ error: 'applicationId and accessKey are required' });
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

        // ソート順があれば追加
        if (sort) {
            params.set('sort', sort);
        }

        let apiPath;

        // APIタイプ判定
        const useSimple = apiType === 'simple' || (!apiType && !keyword && middleClassCode);
        const useKeyword = apiType === 'keyword' || (!apiType && keyword);

        if (useSimple && middleClassCode) {
            // SimpleHotelSearch: エリアコードで正確な検索
            apiPath = 'Travel/SimpleHotelSearch/20170426';
            params.set('largeClassCode', 'japan');
            params.set('middleClassCode', middleClassCode);

            if (smallClassCode) {
                params.set('smallClassCode', smallClassCode);
            }
        } else if (useKeyword || keyword) {
            // KeywordHotelSearch: キーワードでテキスト検索
            apiPath = 'Travel/KeywordHotelSearch/20170426';

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

            if (middleClassCode) {
                params.set('middleClassCode', middleClassCode);
            }
        } else {
            return res.status(400).json({ error: 'keyword or middleClassCode is required' });
        }

        const apiUrl = `https://openapi.rakuten.co.jp/engine/api/${apiPath}?${params.toString()}`;

        console.log('API URL:', apiUrl);

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${accessKey}`,
                'Referer': 'https://rlist-seven.vercel.app/',
                'Origin': 'https://rlist-seven.vercel.app',
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
