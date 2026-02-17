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
    elements.searchBtn.addEventListener('click', () => searchHotels(1));
    elements.csvBtn.addEventListener('click', downloadCSV);
    elements.prevPage.addEventListener('click', () => searchHotels(currentPage - 1));
    elements.nextPage.addEventListener('click', () => searchHotels(currentPage + 1));

    // Enterキーで検索
    elements.keyword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchHotels(1);
    });
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
function saveApiKey() {
    const appId = elements.appId.value.trim();
    const accessKey = elements.accessKey.value.trim();
    if (!appId || !accessKey) {
        showApiStatus('❌ アプリケーションIDとアクセスキーの両方を入力してください', 'error');
        return;
    }
    localStorage.setItem(STORAGE_KEY_APPID, appId);
    localStorage.setItem(STORAGE_KEY_ACCESS, accessKey);
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

// ===== ホテル検索 =====

/** 楽天トラベルAPIでホテルを検索 */
async function searchHotels(page = 1) {
    const appId = elements.appId.value.trim() || localStorage.getItem(STORAGE_KEY_APPID);
    const accessKey = elements.accessKey.value.trim() || localStorage.getItem(STORAGE_KEY_ACCESS);
    const keyword = elements.keyword.value.trim();
    const hits = elements.hits.value;

    // バリデーション
    if (!appId || !accessKey) {
        showError('API設定が必要です。上の「API設定」セクションからアプリケーションIDとアクセスキーを入力してください。');
        return;
    }
    if (!keyword) {
        showError('検索キーワードを入力してください。（例: 東京 渋谷）');
        return;
    }
    if (keyword.length < 2) {
        showError('キーワードは2文字以上入力してください。');
        return;
    }

    // 状態を更新
    currentKeyword = keyword;
    currentHits = parseInt(hits);
    currentPage = page;

    // UI更新: 検索中
    showLoading(true);
    hideError();
    elements.resultsSection.style.display = 'none';

    // レート制限: 前回リクエストから1.1秒未満なら待機
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < RATE_LIMIT_MS) {
        const waitTime = RATE_LIMIT_MS - elapsed;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();

    try {
        // サーバープロキシ経由でAPIリクエスト（Refererヘッダーを転送）
        const params = new URLSearchParams({
            applicationId: appId,
            accessKey: accessKey,
            keyword: keyword,
            hits: hits,
            page: page,
        });

        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();

        // デバッグ: レスポンス内容をコンソールに出力
        console.log('API Response:', JSON.stringify(data, null, 2));

        // エラーチェック (error: 旧形式, errors: 新形式)
        if (data.error) {
            throw new Error(getErrorMessage(data));
        }
        if (data.errors) {
            throw new Error(data.errors.errorMessage || JSON.stringify(data.errors));
        }

        // 結果の解析
        if (!data.hotels || data.hotels.length === 0) {
            // デバッグ情報も表示
            const debugInfo = data._debug ? ` (ステータス: ${data._debug.status}, キー: ${data._debug.keys.join(', ')})` : '';
            showError(`該当するホテルが見つかりませんでした。${debugInfo}`);
            showLoading(false);
            return;
        }

        // ページ情報の計算
        const totalCount = data.pagingInfo ? data.pagingInfo.recordCount : data.hotels.length;
        totalPages = data.pagingInfo ? data.pagingInfo.pageCount : 1;
        currentPage = data.pagingInfo ? data.pagingInfo.page : 1;

        // 検索結果を解析して保存
        currentResults = parseHotels(data.hotels);

        // 画面に表示
        renderResults(currentResults, totalCount);
        updatePagination();

        showLoading(false);

    } catch (error) {
        showLoading(false);
        console.error('API Error:', error);
        showError(`検索中にエラーが発生しました: ${error.message}`);
    }
}

/** APIから取得したデータを見やすい形に変換 */
function parseHotels(hotels) {
    return hotels.map((hotelData) => {
        // hotel配列の中から各情報を取得
        const hotelBasic = hotelData.hotel.find(item => item.hotelBasicInfo);
        const hotelRating = hotelData.hotel.find(item => item.hotelRatingInfo);

        const basic = hotelBasic ? hotelBasic.hotelBasicInfo : {};
        const rating = hotelRating ? hotelRating.hotelRatingInfo : {};

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
function downloadCSV() {
    if (currentResults.length === 0) {
        showError('ダウンロードするデータがありません。先に検索を行ってください。');
        return;
    }

    // CSVヘッダー
    const headers = ['#', 'ホテル名', 'エリア', '住所', '電話番号', 'アクセス', '最低料金', '評価', 'レビュー数', 'URL'];

    // CSVデータ行
    const offset = (currentPage - 1) * currentHits;
    const rows = currentResults.map((hotel, index) => [
        offset + index + 1,
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

    // BOM付きUTF-8でダウンロード（Excelで文字化けしないように）
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // ファイル名: RLIST_キーワード_日時.csv
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `RLIST_${currentKeyword}_${dateStr}.csv`;

    // ダウンロードリンクを作成してクリック
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
