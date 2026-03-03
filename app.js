/* ============================================
   RLIST - 楽天トラベル ホテル検索ツール
   Application Logic
   ============================================ */

// ===== 定数 =====
const API_BASE_URL = 'https://openapi.rakuten.co.jp/engine/api/Travel/KeywordHotelSearch/20170426';
const STORAGE_KEY_APPID = 'rlist_app_id';
const STORAGE_KEY_ACCESS = 'rlist_access_key';

const RATE_LIMIT_MS = 1100; // API制限: 1秒に1回以下 → 1.1秒間隔を確保

// ===== 状態管理 =====
let currentResults = [];  // 現在の検索結果
let currentPage = 1;      // 現在のページ
let totalPages = 1;       // 合計ページ数
let currentKeyword = '';   // 現在の検索キーワード
let currentHits = 30;     // 現在の表示件数
let lastRequestTime = 0;   // 前回のAPIリクエスト時刻（レート制限用）
let areaData = null;       // エリアデータ（キャッシュ用）

// ===== DOM要素の取得 =====
const elements = {
    // API設定
    appId: document.getElementById('appId'),
    accessKey: document.getElementById('accessKey'),
    saveApiKey: document.getElementById('saveApiKey'),
    toggleKeyVisibility: document.getElementById('toggleKeyVisibility'),
    toggleApiBtn: document.getElementById('toggleApiBtn'),
    apiBody: document.getElementById('apiBody'),
    apiStatus: document.getElementById('apiStatus'),

    // 検索
    keyword: document.getElementById('keyword'),
    hits: document.getElementById('hits'),
    searchBtn: document.getElementById('searchBtn'),

    // エリア選択
    middleClass: document.getElementById('middleClass'),
    smallClass: document.getElementById('smallClass'),

    // 結果
    resultsSection: document.getElementById('resultsSection'),
    resultsBody: document.getElementById('resultsBody'),
    resultCount: document.getElementById('resultCount'),
    csvBtn: document.getElementById('csvBtn'),

    // ページネーション
    pagination: document.getElementById('pagination'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    pageInfo: document.getElementById('pageInfo'),

    // その他
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
};

// ===== ログイン認証 =====
const AUTH_KEY = 'rlist_auth';
const VALID_ID = btoa('rakuten');    // 軽い難読化
const VALID_PASS = btoa('2026');

function checkAuth() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
}

function setupLogin() {
    const overlay = document.getElementById('loginOverlay');
    const appContent = document.getElementById('appContent');
    const loginBtn = document.getElementById('loginBtn');
    const loginId = document.getElementById('loginId');
    const loginPass = document.getElementById('loginPass');
    const loginError = document.getElementById('loginError');

    // 既にログイン済みならスキップ
    if (checkAuth()) {
        overlay.style.display = 'none';
        appContent.style.display = 'block';
        return;
    }

    function attemptLogin() {
        const id = loginId.value.trim();
        const pass = loginPass.value.trim();

        if (btoa(id) === VALID_ID && btoa(pass) === VALID_PASS) {
            sessionStorage.setItem(AUTH_KEY, 'true');
            overlay.style.display = 'none';
            appContent.style.display = 'block';
        } else {
            loginError.style.display = 'block';
            loginPass.value = '';
            loginPass.focus();
        }
    }

    loginBtn.addEventListener('click', attemptLogin);

    // Enterキーでログイン
    loginPass.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });
    loginId.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loginPass.focus();
    });
}

// ===== 初期化 =====
function init() {
    // ログイン認証
    setupLogin();

    // 保存済みAPIキーの読み込み
    loadApiKey();

    // イベントリスナーの設定
    elements.saveApiKey.addEventListener('click', saveApiKey);
    elements.toggleKeyVisibility.addEventListener('click', toggleKeyVisibility);
    elements.toggleApiBtn.addEventListener('click', toggleApiSection);
    elements.searchBtn.addEventListener('click', () => searchHotels());
    elements.csvBtn.addEventListener('click', downloadCSV);
    elements.prevPage.addEventListener('click', () => searchHotels(currentPage - 1));
    elements.nextPage.addEventListener('click', () => searchHotels(currentPage + 1));

    // Enterキーで検索
    elements.keyword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchHotels();
    });

    // エリア選択の連動
    elements.middleClass.addEventListener('change', onMiddleClassChange);

    // エリアデータの読み込み
    loadAreaData();
}

// ===== APIキー管理 =====

/** 保存済みのAPIキーを読み込む */
function loadApiKey() {
    const savedAppId = localStorage.getItem(STORAGE_KEY_APPID);
    const savedAccess = localStorage.getItem(STORAGE_KEY_ACCESS);
    if (savedAppId) elements.appId.value = savedAppId;
    if (savedAccess) elements.accessKey.value = savedAccess;

    if (savedAppId && savedAccess) {
        showApiStatus('✅ API設定が保存されています', 'success');
        // API設定を折りたたむ
        elements.apiBody.classList.add('collapsed');
        elements.toggleApiBtn.textContent = '▼';
    }
}

/** APIキーを保存する */
async function saveApiKey() {
    const appId = elements.appId.value.trim();
    const accessKey = elements.accessKey.value.trim();
    if (!appId || !accessKey) {
        showApiStatus('❌ アプリケーションIDとアクセスキーの両方を入力してください', 'error');
        return;
    }
    localStorage.setItem(STORAGE_KEY_APPID, appId);
    localStorage.setItem(STORAGE_KEY_ACCESS, accessKey);
    showApiStatus('✅ 保存しました！エリアデータを更新中...', 'success');

    // APIキー保存後にエリアデータを動的に取得
    await loadAreaData();
    showApiStatus('✅ 保存しました！', 'success');

    // 少し遅れて折りたたむ
    setTimeout(() => {
        elements.apiBody.classList.add('collapsed');
        elements.toggleApiBtn.textContent = '▼';
    }, 1000);
}

/** アクセスキーの表示/非表示を切り替え */
function toggleKeyVisibility() {
    const input = elements.accessKey;
    if (input.type === 'password') {
        input.type = 'text';
        elements.toggleKeyVisibility.textContent = '🔒';
    } else {
        input.type = 'password';
        elements.toggleKeyVisibility.textContent = '👁';
    }
}

/** API設定セクションの折りたたみ */
function toggleApiSection() {
    const body = elements.apiBody;
    const btn = elements.toggleApiBtn;
    if (body.classList.contains('collapsed')) {
        body.classList.remove('collapsed');
        btn.textContent = '▲';
    } else {
        body.classList.add('collapsed');
        btn.textContent = '▼';
    }
}

/** APIステータスメッセージの表示 */
function showApiStatus(message, type) {
    elements.apiStatus.textContent = message;
    elements.apiStatus.className = `api-status ${type}`;
}

// ===== エリアデータ管理 =====

/** エリアデータを読み込む（静的データを使用） */
async function loadAreaData() {
    // API設定を取得
    const appId = localStorage.getItem(STORAGE_KEY_APPID);
    const accessKey = localStorage.getItem(STORAGE_KEY_ACCESS);

    // APIキーがある場合は動的に取得を試行
    if (appId && accessKey) {
        try {
            console.log('[RLIST] GetAreaClass APIからエリアデータを取得中...');
            const params = new URLSearchParams({ applicationId: appId, accessKey });
            const response = await fetch(`/api/areas?${params.toString()}`);
            const data = await response.json();

            console.log('[RLIST] GetAreaClass RAW response keys:', Object.keys(data));
            console.log('[RLIST] GetAreaClass RAW response (first 2000 chars):', JSON.stringify(data).slice(0, 2000));

            if (data.error) throw new Error(data.error_description || data.error);

            // APIレスポンスをパース
            const parsed = parseAreaClassResponse(data);
            console.log(`[RLIST] parseAreaClassResponse result: ${parsed.length}件`);
            if (parsed.length > 0) {
                // 静岡のデータを確認
                const shizuoka = parsed.find(m => m.code === 'shizuoka');
                if (shizuoka) {
                    console.log(`[RLIST] 静岡の小エリア: ${shizuoka.smallClasses.length}件`, shizuoka.smallClasses.map(s => s.name));
                }
                areaData = parsed;
                populateMiddleClassDropdown();
                return;
            }
        } catch (err) {
            console.warn('[RLIST] GetAreaClass API失敗、フォールバックを使用:', err.message);
        }
    }

    // フォールバック: 静的データを使用
    if (typeof AREA_DATA !== 'undefined' && AREA_DATA.length > 0) {
        areaData = AREA_DATA;
        console.log('[RLIST] 静的エリアデータを使用（area-data.js）');
        populateMiddleClassDropdown();
    } else {
        console.error('エリアデータを取得できませんでした。');
    }
}

/** GetAreaClass APIレスポンスをパースしてドロップダウン用データに変換 */
function parseAreaClassResponse(data) {
    const result = [];

    try {
        // APIレスポンス構造を動的に探索
        // formatVersion=2: { areaClasses: { largeClasses: [...] } }
        // formatVersion=1: { areaClasses: { largeClasses: [{ largeClass: [...] }] } }
        const largeClasses = data.areaClasses?.largeClasses || [];
        console.log(`[RLIST] largeClasses count: ${largeClasses.length}`);
        if (largeClasses.length > 0) {
            console.log('[RLIST] First largeClass keys:', Object.keys(largeClasses[0]));
            console.log('[RLIST] First largeClass (2000 chars):', JSON.stringify(largeClasses[0]).slice(0, 2000));
        }

        for (const large of largeClasses) {
            // largeClassの情報を取得（配列かオブジェクトか不明）
            const largeInfo = Array.isArray(large.largeClass) ? large.largeClass[0] : large.largeClass;
            console.log('[RLIST] largeClass info:', largeInfo);

            const middleClasses = large.middleClasses || [];
            console.log(`[RLIST] middleClasses count for this large: ${middleClasses.length}`);

            for (const middle of middleClasses) {
                // middleClassの情報を取得
                const middleRaw = middle.middleClass;
                let middleCode, middleName;

                if (Array.isArray(middleRaw)) {
                    middleCode = middleRaw[0]?.middleClassCode;
                    middleName = middleRaw[0]?.middleClassName;
                } else if (middleRaw) {
                    middleCode = middleRaw.middleClassCode;
                    middleName = middleRaw.middleClassName;
                }

                // middleClassが直接のプロパティかもしれない
                if (!middleCode) {
                    middleCode = middle.middleClassCode;
                    middleName = middle.middleClassName;
                }

                if (!middleCode || !middleName) continue;

                const smallClasses = [];
                const smalls = middle.smallClasses || [];

                for (const small of smalls) {
                    const smallRaw = small.smallClass;
                    let smallCode, smallName;

                    if (Array.isArray(smallRaw)) {
                        smallCode = smallRaw[0]?.smallClassCode;
                        smallName = smallRaw[0]?.smallClassName;
                    } else if (smallRaw) {
                        smallCode = smallRaw.smallClassCode;
                        smallName = smallRaw.smallClassName;
                    }

                    // 直接プロパティかもしれない
                    if (!smallCode) {
                        smallCode = small.smallClassCode;
                        smallName = small.smallClassName;
                    }

                    if (smallCode && smallName) {
                        smallClasses.push({ code: smallCode, name: smallName });
                    }
                }

                result.push({
                    code: middleCode,
                    name: middleName,
                    smallClasses,
                });
            }
        }
    } catch (err) {
        console.error('[RLIST] エリアデータのパースに失敗:', err);
    }

    return result;
}

/** 都道府県ドロップダウンを生成 */
function populateMiddleClassDropdown() {
    if (!areaData || areaData.length === 0) return;

    elements.middleClass.innerHTML = '<option value="">都道府県を選択</option>';
    for (const middle of areaData) {
        const option = document.createElement('option');
        option.value = middle.code;
        option.textContent = middle.name;
        elements.middleClass.appendChild(option);
    }
}

/** 都道府県が変更されたとき、小エリアを更新 */
function onMiddleClassChange() {
    const middleCode = elements.middleClass.value;
    elements.smallClass.innerHTML = '<option value="">小エリアを選択</option>';

    if (!middleCode) {
        elements.smallClass.disabled = true;
        return;
    }

    // 選択された都道府県の小エリアを取得
    const middle = areaData.find(m => m.code === middleCode);
    if (!middle || middle.smallClasses.length === 0) {
        elements.smallClass.disabled = true;
        return;
    }

    for (const small of middle.smallClasses) {
        const option = document.createElement('option');
        option.value = small.code;
        option.textContent = small.name;
        elements.smallClass.appendChild(option);
    }
    elements.smallClass.disabled = false;
}

// ===== ホテル検索 =====

/** 指定条件で複数ページのホテルデータを取得するヘルパー関数 */
async function fetchPages({ appId, accessKey, keyword, middleClassCode, smallClassCode, sort, maxResults, progressPrefix }) {
    const PER_PAGE = 30;
    const MAX_API_RESULTS = 3000; // API制限: 100ページ × 30件
    const limit = Math.min(maxResults, MAX_API_RESULTS);
    const pagesNeeded = Math.ceil(limit / PER_PAGE);
    let hotels = [];
    let totalAvailable = 0;

    console.log(`[fetchPages] 開始: limit=${limit}, pagesNeeded=${pagesNeeded}, keyword=${keyword || 'none'}, middleClassCode=${middleClassCode || 'none'}, smallClassCode=${smallClassCode || 'none'}, sort=${sort || 'none'}`);

    let retryCount = 0;
    for (let page = 1; page <= pagesNeeded; page++) {
        // レート制限
        const now = Date.now();
        const elapsed = now - lastRequestTime;
        if (elapsed < RATE_LIMIT_MS) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
        }
        lastRequestTime = Date.now();

        // 進捗表示
        const prefix = progressPrefix || '検索中';
        elements.loading.querySelector('p').textContent =
            `${prefix}... (${page}/${pagesNeeded}ページ, ${hotels.length}件取得済み)`;

        const params = new URLSearchParams({
            applicationId: appId,
            accessKey: accessKey,
            hits: PER_PAGE,
            page: page,
        });

        if (keyword) params.set('keyword', keyword);
        if (middleClassCode) params.set('middleClassCode', middleClassCode);
        if (smallClassCode) params.set('smallClassCode', smallClassCode);
        if (sort) params.set('sort', sort);

        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();

        // detailClassCodeフォールバック検出: 以降のページでsmallClassCodeを送らない
        if (data._fallbackUsed && page === 1) {
            console.log(`[fetchPages] detailClassCodeフォールバック検出: smallClassCode=${smallClassCode}を以降のリクエストから除外`);
            smallClassCode = null;
        }

        // デバッグ: レスポンス内容をログ
        console.log(`[fetchPages] page=${page}: `, {
            hasHotels: !!data.hotels,
            hotelsCount: data.hotels ? data.hotels.length : 0,
            pagingInfo: data.pagingInfo || null,
            error: data.error || null,
            statusCode: data.statusCode || null,
            fallbackUsed: data._fallbackUsed || false,
        });

        // レート制限チェック（statusCode:429 または error:'too_many_requests'）
        const isRateLimited = data.statusCode === 429
            || data.error === 'too_many_requests';
        if (isRateLimited) {
            retryCount = (retryCount || 0) + 1;
            if (retryCount <= 3) {
                const waitSec = Math.min(2 * retryCount, 6);
                console.log(`[fetchPages] page=${page}: レート制限 (${retryCount}/3), ${waitSec}秒後にリトライ...`);
                elements.loading.querySelector('p').textContent =
                    `レート制限...${waitSec}秒待機中 (${hotels.length}件取得済み)`;
                await new Promise(resolve => setTimeout(resolve, waitSec * 1000));
                page--; // 同じページをリトライ
                continue;
            }
            console.error(`[fetchPages] page=${page}: リトライ上限到達、終了`);
            break;
        }
        retryCount = 0; // 成功したらリセット

        // その他のエラーチェック
        if (data.error) {
            console.error(`[fetchPages] page=${page} APIエラー:`, data.error, data.error_description);
            if (page > 1) break;
            throw new Error(getErrorMessage(data));
        }
        if (data.errors) {
            console.error(`[fetchPages] page=${page} APIエラー:`, data.errors);
            if (page > 1) break;
            throw new Error(data.errors.errorMessage || JSON.stringify(data.errors));
        }

        // データがない場合
        if (!data.hotels || data.hotels.length === 0) {
            console.log(`[fetchPages] page=${page}: データなし、終了`);
            if (page === 1) return { hotels: [], totalAvailable: 0 };
            break;
        }

        // ページ情報を取得
        if (page === 1) {
            totalAvailable = data.pagingInfo ? data.pagingInfo.recordCount : data.hotels.length;
            console.log(`[fetchPages] totalAvailable=${totalAvailable}`);
        }

        const parsed = parseHotels(data.hotels);
        hotels = hotels.concat(parsed);

        // 必要数に達したら終了
        if (hotels.length >= limit) {
            hotels = hotels.slice(0, limit);
            console.log(`[fetchPages] limit到達: ${hotels.length}件`);
            break;
        }

        // これ以上ページがない場合は終了
        // recordCountから計算したページ数とAPIのpageCountの両方を確認
        const apiPageCount = data.pagingInfo ? data.pagingInfo.pageCount : 1;
        const calculatedPageCount = totalAvailable > 0 ? Math.ceil(totalAvailable / PER_PAGE) : apiPageCount;
        const maxPages = Math.max(apiPageCount, calculatedPageCount);
        console.log(`[fetchPages] page=${page}: apiPageCount=${apiPageCount}, calculatedPageCount=${calculatedPageCount}, maxPages=${maxPages}`);
        if (page >= maxPages) {
            console.log(`[fetchPages] maxPages到達、終了`);
            break;
        }
    }

    console.log(`[fetchPages] 完了: ${hotels.length}件取得, totalAvailable=${totalAvailable}`);
    return { hotels, totalAvailable };
}

/** 楽天トラベルAPIでホテルを検索 */
async function searchHotels() {
    const appId = elements.appId.value.trim() || localStorage.getItem(STORAGE_KEY_APPID);
    const accessKey = elements.accessKey.value.trim() || localStorage.getItem(STORAGE_KEY_ACCESS);
    const keyword = elements.keyword.value.trim();
    const middleClassCode = elements.middleClass.value;
    const smallClassCode = elements.smallClass.value;
    const hitsValue = elements.hits.value;
    let totalWanted = hitsValue === 'all' ? Infinity : parseInt(hitsValue);

    // バリデーション
    if (!appId || !accessKey) {
        showError('API設定が必要です。上の「API設定」セクションからアプリケーションIDとアクセスキーを入力してください。');
        return;
    }
    if (!keyword && !middleClassCode) {
        showError('キーワードまたはエリアを指定してください。');
        return;
    }
    if (keyword && keyword.length < 2) {
        showError('キーワードは2文字以上入力してください。');
        return;
    }

    // 状態を更新
    currentKeyword = keyword;
    currentHits = totalWanted;
    currentPage = 1;

    // UI更新: 検索中
    showLoading(true);
    hideError();
    elements.resultsSection.style.display = 'none';

    const fetchParams = { appId, accessKey, keyword, middleClassCode, smallClassCode };

    try {
        // === メイン検索 ===
        const pass1 = await fetchPages({
            ...fetchParams,
            sort: null,
            maxResults: Math.min(totalWanted, 3000),
            progressPrefix: '検索中',
        });

        if (pass1.hotels.length === 0) {
            showError('該当するホテルが見つかりませんでした。');
            showLoading(false);
            return;
        }

        const totalAvailable = pass1.totalAvailable;

        // 「全件」オプションのテキストを実際の件数に更新
        const allOption = elements.hits.querySelector('option[value="all"]');
        if (allOption) {
            allOption.textContent = `全件（${totalAvailable.toLocaleString()}件）`;
        }

        // 全件取得の場合、実際の件数に合わせる
        if (hitsValue === 'all') {
            totalWanted = totalAvailable;
            currentHits = totalWanted;
        }

        let allHotels = pass1.hotels;

        // === 追加パス: 3000件を超える場合、逆順ソートで残りを取得 ===
        if (totalAvailable > 3000 && totalWanted > 3000) {
            elements.loading.querySelector('p').textContent =
                `3000件以上検出（${totalAvailable.toLocaleString()}件）。追加取得を開始します...`;
            await new Promise(resolve => setTimeout(resolve, 500));

            const pass2 = await fetchPages({
                ...fetchParams,
                sort: '-roomCharge',
                maxResults: 3000,
                progressPrefix: '追加取得中（料金高い順）',
            });

            const existingIds = new Set(allHotels.map(h => h.hotelNo));
            const newHotels = pass2.hotels.filter(h => !existingIds.has(h.hotelNo));
            allHotels = allHotels.concat(newHotels);

            console.log(`追加パス完了: パス2=${pass2.hotels.length}件, 新規=${newHotels.length}件, 合計=${allHotels.length}件`);
        }

        // 要求数を超えた場合はトリム
        if (allHotels.length > totalWanted) {
            allHotels = allHotels.slice(0, totalWanted);
        }

        // 検索結果を保存して表示
        currentResults = allHotels;
        renderResults(currentResults, totalAvailable);
        showLoading(false);

    } catch (error) {
        showLoading(false);
        console.error('API Error:', error);
        showError(`検索中にエラーが発生しました: ${error.message}`);
    }
}

/** APIから取得したデータを見やすい形に変換 */
function parseHotels(hotels) {
    // デバッグ: 最初のホテルの構造を確認
    if (hotels.length > 0) {
        console.log('First hotel raw:', hotels[0]);
        console.log('First hotel type:', typeof hotels[0]);
        console.log('First hotel isArray:', Array.isArray(hotels[0]));
        console.log('First hotel keys:', Object.keys(hotels[0]));
        console.log('First hotel JSON:', JSON.stringify(hotels[0], null, 2));
    }

    return hotels.map((hotelData) => {
        let basic = {};
        let rating = {};

        // パターン1: formatVersion=2 — hotelData 自体が配列
        // 例: [{hotelBasicInfo: {...}}, {hotelRatingInfo: {...}}]
        if (Array.isArray(hotelData)) {
            const hotelBasic = hotelData.find(item => item.hotelBasicInfo);
            const hotelRating = hotelData.find(item => item.hotelRatingInfo);
            basic = hotelBasic ? hotelBasic.hotelBasicInfo : {};
            rating = hotelRating ? hotelRating.hotelRatingInfo : {};
        }
        // パターン2: formatVersion=1 — hotelData.hotel が配列
        // 例: {hotel: [{hotelBasicInfo: {...}}, {hotelRatingInfo: {...}}]}
        else if (hotelData.hotel && Array.isArray(hotelData.hotel)) {
            const hotelBasic = hotelData.hotel.find(item => item.hotelBasicInfo);
            const hotelRating = hotelData.hotel.find(item => item.hotelRatingInfo);
            basic = hotelBasic ? hotelBasic.hotelBasicInfo : {};
            rating = hotelRating ? hotelRating.hotelRatingInfo : {};
        }
        // パターン3: hotelData に直接 hotelBasicInfo がある
        else if (hotelData.hotelBasicInfo) {
            basic = hotelData.hotelBasicInfo;
            rating = hotelData.hotelRatingInfo || {};
        }
        // パターン4: 完全にフラット
        else if (hotelData.hotelName) {
            basic = hotelData;
        }

        return {
            hotelName: basic.hotelName || '',
            hotelSpecial: basic.hotelSpecial || '',
            hotelMinCharge: basic.hotelMinCharge || 0,
            address1: basic.address1 || '',
            address2: basic.address2 || '',
            telephoneNo: basic.telephoneNo || '',
            access: basic.access || '',
            nearestStation: basic.nearestStation || '',
            hotelInfoUrl: basic.hotelInformationUrl || '',
            reviewAverage: basic.reviewAverage || 0,
            reviewCount: basic.reviewCount || 0,
            areaName: basic.areaName || '',
            hotelNo: basic.hotelNo || '',
        };
    });
}

/** 検索結果をテーブルに表示 */
function renderResults(hotels, totalCount) {
    const offset = (currentPage - 1) * currentHits;

    elements.resultsBody.innerHTML = hotels.map((hotel, index) => {
        const num = offset + index + 1;
        const address = `${hotel.address1}${hotel.address2}`;
        const price = hotel.hotelMinCharge
            ? `¥${hotel.hotelMinCharge.toLocaleString()}`
            : '-';
        const ratingClass = hotel.reviewAverage >= 4.0 ? 'rating-high'
            : hotel.reviewAverage >= 3.0 ? 'rating-mid'
                : 'rating-low';
        const ratingDisplay = hotel.reviewAverage > 0
            ? `<span class="rating-badge ${ratingClass}">${hotel.reviewAverage.toFixed(1)}</span>`
            : '-';

        return `
            <tr>
                <td class="td-num">${num}</td>
                <td class="td-name">${escapeHtml(hotel.hotelName)}</td>
                <td class="td-area">${escapeHtml(hotel.areaName)}</td>
                <td class="td-address">${escapeHtml(address)}</td>
                <td class="td-tel">${escapeHtml(hotel.telephoneNo)}</td>
                <td class="td-access">${escapeHtml(hotel.access)}</td>
                <td class="td-price">${price}</td>
                <td class="td-rating">${ratingDisplay}</td>
                <td class="td-link">
                    ${hotel.hotelInfoUrl
                ? `<a href="${escapeHtml(hotel.hotelInfoUrl)}" target="_blank" rel="noopener" class="link-btn">開く ↗</a>`
                : '-'}
                </td>
            </tr>
        `;
    }).join('');

    // 結果件数の表示
    elements.resultCount.textContent = `（${totalCount.toLocaleString()}件中 ${offset + 1}〜${offset + hotels.length}件を表示）`;
    elements.resultsSection.style.display = 'block';

    // テーブルまでスクロール
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== ページネーション =====

/** ページネーションUIを更新 */
function updatePagination() {
    if (totalPages <= 1) {
        elements.pagination.style.display = 'none';
        return;
    }

    elements.pagination.style.display = 'flex';
    elements.pageInfo.textContent = `${currentPage} / ${totalPages}`;
    elements.prevPage.disabled = currentPage <= 1;
    elements.nextPage.disabled = currentPage >= totalPages;
}

// ===== CSV出力 =====

/** 検索結果をCSVファイルとしてダウンロード */
async function downloadCSV() {
    if (currentResults.length === 0) {
        showError('ダウンロードするデータがありません。先に検索を行ってください。');
        return;
    }

    // CSVヘッダー
    const headers = ['#', 'ホテル名', 'エリア', '住所', '電話番号', 'アクセス', '最低料金', '評価', 'レビュー数', 'URL'];

    // CSVデータ行
    const rows = currentResults.map((hotel, index) => [
        index + 1,
        hotel.hotelName,
        hotel.areaName,
        `${hotel.address1}${hotel.address2}`,
        hotel.telephoneNo,
        hotel.access,
        hotel.hotelMinCharge || '',
        hotel.reviewAverage || '',
        hotel.reviewCount || '',
        hotel.hotelInfoUrl,
    ]);

    // CSV文字列の作成
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    // BOM付きUTF-8（Excelで文字化けしないように）
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

    // ファイル名: RLIST_検索条件_日時.csv
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    // エリア検索の場合はエリア名を使用
    const searchLabel = currentKeyword
        || (elements.smallClass.options[elements.smallClass.selectedIndex]?.textContent)
        || (elements.middleClass.options[elements.middleClass.selectedIndex]?.textContent)
        || '検索結果';
    const filename = `RLIST_${searchLabel}_${dateStr}.csv`;

    // File System Access API（保存先選択ダイアログ）を試行
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'CSV ファイル',
                    accept: { 'text/csv': ['.csv'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (err) {
            // ユーザーがキャンセルした場合は何もしない
            if (err.name === 'AbortError') return;
            // その他のエラーはフォールバック
            console.warn('showSaveFilePicker failed, falling back:', err);
        }
    }

    // フォールバック: 従来のダウンロード方式
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ===== JSONPリクエスト（CORS回避） =====

/** JSONPでAPIを呼び出す（ローカルファイルからでも動作する） */
function callApiJsonp(params) {
    return new Promise((resolve, reject) => {
        // ユニークなコールバック名を生成
        const callbackName = `rlistCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        // タイムアウト設定（10秒）
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('リクエストがタイムアウトしました。ネットワーク接続を確認してください。'));
        }, 10000);

        // コールバック関数をグローバルに登録
        window[callbackName] = (data) => {
            clearTimeout(timeout);
            cleanup();
            resolve(data);
        };

        // クリーンアップ用の関数
        function cleanup() {
            delete window[callbackName];
            const script = document.getElementById(callbackName);
            if (script) script.remove();
        }

        // URLパラメータを組み立て
        params.callback = callbackName;
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}?${queryString}`;

        // scriptタグを作成してリクエスト
        const script = document.createElement('script');
        script.id = callbackName;
        script.src = url;
        script.onerror = () => {
            clearTimeout(timeout);
            cleanup();
            reject(new Error('APIへの接続に失敗しました。アクセスキーを確認してください。'));
        };
        document.head.appendChild(script);
    });
}

// ===== ユーティリティ =====

/** HTML特殊文字のエスケープ */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/** エラーメッセージを日本語に変換 */
function getErrorMessage(errorData) {
    const desc = errorData.error_description || errorData.error || '';
    const errorMap = {
        'specify valid applicationId': 'アクセスキーが正しくありません。設定を確認してください。',
        'keyword parameter is not valid': 'キーワードが不正です。2文字以上で入力してください。',
        'not found': '該当するホテルが見つかりませんでした。',
        'too_many_requests': 'リクエスト回数の上限に達しました。少し時間を置いてから再試行してください。',
        'system_error': 'システムエラーが発生しました。しばらくしてから再試行してください。',
    };

    for (const [key, value] of Object.entries(errorMap)) {
        if (desc.includes(key) || errorData.error === key) {
            return value;
        }
    }
    return desc || 'エラーが発生しました。';
}

/** ローディング表示 */
function showLoading(show) {
    elements.loading.style.display = show ? 'flex' : 'none';
    elements.searchBtn.disabled = show;
}

/** エラー表示 */
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.style.display = 'block';
}

/** エラーを非表示 */
function hideError() {
    elements.errorMessage.style.display = 'none';
}

// ===== アプリ起動 =====
document.addEventListener('DOMContentLoaded', init);
