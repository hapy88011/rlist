// Vercel Serverless Function: 楽天トラベルAPI プロキシ
// キーワード検索 → KeywordHotelSearch
// エリアコード検索 → SimpleHotelSearch（smallClassCode/detailClassCode対応）

export default async function handler(req, res) {
    // CORS ヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { keyword, hits, page, applicationId, accessKey, middleClassCode, smallClassCode, detailClassCode, sort } = req.query;

    if (!applicationId || !accessKey) {
        return res.status(400).json({ error: 'applicationId and accessKey are required' });
    }

    try {
        const params = new URLSearchParams({
            applicationId,
            accessKey,
            hits: hits || '30',
            page: page || '1',
            formatVersion: '2',
            format: 'json',
        });

        if (sort) params.set('sort', sort);

        let apiPath;

        if (keyword) {
            // キーワード検索 → KeywordHotelSearch
            apiPath = 'Travel/KeywordHotelSearch/20170426';
            params.set('keyword', keyword);
            if (middleClassCode) params.set('middleClassCode', middleClassCode);
        } else if (middleClassCode) {
            // エリアコード検索 → SimpleHotelSearch
            apiPath = 'Travel/SimpleHotelSearch/20170426';
            params.set('largeClassCode', 'japan');
            params.set('middleClassCode', middleClassCode);
            if (smallClassCode) params.set('smallClassCode', smallClassCode);
            if (detailClassCode) params.set('detailClassCode', detailClassCode);
        } else {
            return res.status(400).json({ error: 'keyword or middleClassCode is required' });
        }

        const apiUrl = `https://openapi.rakuten.co.jp/engine/api/${apiPath}?${params.toString()}`;
        console.log(`[RLIST] API=${apiPath} page=${page} hits=${hits} detail=${detailClassCode || 'none'}`);

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${accessKey}`,
                'Referer': 'https://rlist-seven.vercel.app/',
                'Origin': 'https://rlist-seven.vercel.app',
            },
        });

        const data = await response.json();

        // デバッグ: ページング情報をログ
        if (data.pagingInfo) {
            console.log(`[RLIST] pagingInfo: recordCount=${data.pagingInfo.recordCount}, pageCount=${data.pagingInfo.pageCount}, page=${data.pagingInfo.page}, first=${data.pagingInfo.first}, last=${data.pagingInfo.last}`);
        }
        if (data.hotels) {
            console.log(`[RLIST] hotels.length=${data.hotels.length}`);
        }
        if (data.error) {
            console.log(`[RLIST] ERROR: ${data.error} - ${data.error_description}`);
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('[RLIST] Proxy Error:', error);
        return res.status(500).json({ error: 'API request failed', error_description: error.message });
    }
}
