// 楽天トラベル エリアコードデータ（静的ファイル）
// GetAreaClass API のレスポンスを元に作成
// エリアコードはほとんど変わらないため、静的ファイルとして保持

const AREA_DATA = [
    {
        code: "hokkaido",
        name: "北海道",
        smallClasses: [
            { code: "sapporo", name: "札幌" },
            { code: "jozankei", name: "定山渓" },
            { code: "wakkanai", name: "稚内・留萌" },
            { code: "abashiri", name: "網走・北見・知床" },
            { code: "kushiro", name: "釧路・阿寒・根室" },
            { code: "obihiro", name: "帯広・十勝" },
            { code: "hidaka", name: "日高・えりも" },
            { code: "furano", name: "富良野・美瑛・トマム" },
            { code: "asahikawa", name: "旭川・層雲峡" },
            { code: "chitose", name: "千歳・支笏・苫小牧" },
            { code: "otaru", name: "小樽・キロロ・積丹" },
            { code: "niseko", name: "ニセコ・ルスツ" },
            { code: "noboribetsu", name: "登別・室蘭" },
            { code: "toyako", name: "洞爺・北湯沢" },
            { code: "hakodate", name: "函館・大沼・松前" },
        ],
    },
    {
        code: "aomori",
        name: "青森県",
        smallClasses: [
            { code: "aomori", name: "青森・浅虫温泉" },
            { code: "hirosaki", name: "弘前・黒石" },
            { code: "hachinohe", name: "八戸" },
            { code: "towada", name: "十和田湖・奥入瀬" },
            { code: "shimokita", name: "下北・三沢" },
            { code: "shirakami", name: "白神・鰺ヶ沢" },
        ],
    },
    {
        code: "iwate",
        name: "岩手県",
        smallClasses: [
            { code: "morioka", name: "盛岡" },
            { code: "hanamaki", name: "花巻・北上・遠野" },
            { code: "ichinoseki", name: "一関・平泉" },
            { code: "appi", name: "安比・八幡平・二戸" },
            { code: "miyako", name: "三陸海岸" },
        ],
    },
    {
        code: "miyagi",
        name: "宮城県",
        smallClasses: [
            { code: "sendai", name: "仙台" },
            { code: "akiu", name: "秋保・作並" },
            { code: "matsushima", name: "松島・塩釜" },
            { code: "naruko", name: "鳴子・大崎" },
            { code: "shiroishi", name: "白石・蔵王" },
        ],
    },
    {
        code: "akita",
        name: "秋田県",
        smallClasses: [
            { code: "akita", name: "秋田" },
            { code: "tazawako", name: "田沢湖・角館" },
            { code: "yokote", name: "横手・湯沢" },
            { code: "oga", name: "男鹿・能代" },
            { code: "daisen", name: "大仙・大曲" },
        ],
    },
    {
        code: "yamagata",
        name: "山形県",
        smallClasses: [
            { code: "yamagata", name: "山形・蔵王・天童" },
            { code: "yonezawa", name: "米沢" },
            { code: "sakata", name: "酒田・鶴岡" },
            { code: "shinjo", name: "新庄・最上" },
        ],
    },
    {
        code: "fukushima",
        name: "福島県",
        smallClasses: [
            { code: "fukushima", name: "福島・飯坂温泉" },
            { code: "koriyama", name: "郡山" },
            { code: "iwaki", name: "いわき・双葉" },
            { code: "aizu", name: "会津若松・喜多方" },
            { code: "urabandai", name: "猪苗代・裏磐梯" },
        ],
    },
    {
        code: "ibaraki",
        name: "茨城県",
        smallClasses: [
            { code: "mito", name: "水戸・笠間" },
            { code: "tsukuba", name: "つくば・土浦" },
            { code: "oarai", name: "大洗・ひたちなか" },
            { code: "kitaibaraki", name: "北茨城・奥久慈" },
        ],
    },
    {
        code: "tochigi",
        name: "栃木県",
        smallClasses: [
            { code: "utsunomiya", name: "宇都宮" },
            { code: "nikko", name: "日光・鬼怒川" },
            { code: "nasu", name: "那須・塩原" },
            { code: "mashiko", name: "益子・真岡" },
        ],
    },
    {
        code: "gunma",
        name: "群馬県",
        smallClasses: [
            { code: "maebashi", name: "前橋・高崎" },
            { code: "kusatsu", name: "草津・万座・北軽井沢" },
            { code: "ikaho", name: "伊香保・渋川" },
            { code: "minakami", name: "水上・猿ヶ京" },
            { code: "ota", name: "太田・桐生" },
        ],
    },
    {
        code: "saitama",
        name: "埼玉県",
        smallClasses: [
            { code: "saitama", name: "さいたま" },
            { code: "kawagoe", name: "川越・所沢" },
            { code: "chichibu", name: "秩父・長瀞" },
            { code: "kumagaya", name: "熊谷・深谷" },
        ],
    },
    {
        code: "chiba",
        name: "千葉県",
        smallClasses: [
            { code: "chiba", name: "千葉・市原" },
            { code: "maihama", name: "舞浜・浦安・船橋・幕張" },
            { code: "narita", name: "成田" },
            { code: "tateyama", name: "館山・南房総" },
            { code: "kamogawa", name: "鴨川・勝浦" },
            { code: "kisarazu", name: "木更津・君津・富津" },
        ],
    },
    {
        code: "tokyo",
        name: "東京都",
        smallClasses: [
            { code: "tokyo", name: "東京23区内" },
            { code: "hachioji", name: "八王子・立川・町田" },
            { code: "okutama", name: "青梅・奥多摩" },
            { code: "oshima", name: "伊豆諸島" },
            { code: "ogasawara", name: "小笠原" },
        ],
    },
    {
        code: "kanagawa",
        name: "神奈川県",
        smallClasses: [
            { code: "yokohama", name: "横浜" },
            { code: "kawasaki", name: "川崎" },
            { code: "hakone", name: "箱根" },
            { code: "kamakura", name: "鎌倉・湘南" },
            { code: "odawara", name: "小田原" },
        ],
    },
    {
        code: "niigata",
        name: "新潟県",
        smallClasses: [
            { code: "niigata", name: "新潟・月岡・阿賀野川" },
            { code: "nagaoka", name: "長岡・三条・柏崎" },
            { code: "echigoyuzawa", name: "越後湯沢・苗場" },
            { code: "myoko", name: "妙高・赤倉" },
            { code: "sado", name: "佐渡" },
        ],
    },
    {
        code: "toyama",
        name: "富山県",
        smallClasses: [
            { code: "toyama", name: "富山" },
            { code: "takaoka", name: "高岡・氷見" },
            { code: "tateyama", name: "立山" },
            { code: "unazuki", name: "宇奈月・黒部" },
        ],
    },
    {
        code: "ishikawa",
        name: "石川県",
        smallClasses: [
            { code: "kanazawa", name: "金沢" },
            { code: "kaga", name: "加賀・小松" },
            { code: "noto", name: "能登" },
            { code: "wakura", name: "和倉" },
        ],
    },
    {
        code: "fukui",
        name: "福井県",
        smallClasses: [
            { code: "fukui", name: "福井・あわら" },
            { code: "echizen", name: "越前・鯖江" },
            { code: "tsuruga", name: "敦賀・若狭" },
        ],
    },
    {
        code: "yamanashi",
        name: "山梨県",
        smallClasses: [
            { code: "kofu", name: "甲府・昇仙峡" },
            { code: "kawaguchiko", name: "河口湖・富士吉田" },
            { code: "isawa", name: "石和・勝沼" },
            { code: "yamanashi", name: "大月・都留" },
        ],
    },
    {
        code: "nagano",
        name: "長野県",
        smallClasses: [
            { code: "nagano", name: "長野・戸隠・小布施" },
            { code: "matsumoto", name: "松本・上高地・美ヶ原" },
            { code: "karuizawa", name: "軽井沢・佐久" },
            { code: "hakuba", name: "白馬・安曇野" },
            { code: "suwa", name: "上諏訪・下諏訪・霧ヶ峰" },
            { code: "iida", name: "伊那・飯田・駒ヶ根" },
            { code: "nozawa", name: "野沢温泉・志賀高原" },
        ],
    },
    {
        code: "gifu",
        name: "岐阜県",
        smallClasses: [
            { code: "gifu", name: "岐阜・各務原" },
            { code: "takayama", name: "高山・飛騨" },
            { code: "gero", name: "下呂温泉" },
            { code: "gujo", name: "郡上・美濃" },
            { code: "okumino", name: "奥美濃" },
        ],
    },
    {
        code: "shizuoka",
        name: "静岡県",
        smallClasses: [
            { code: "shizuoka", name: "静岡・清水" },
            { code: "atami", name: "熱海" },
            { code: "ito", name: "伊東" },
            { code: "shimoda", name: "下田・白浜" },
            { code: "hamamatsu", name: "浜松・浜名湖" },
            { code: "shuzenji", name: "修善寺・天城" },
            { code: "gotemba", name: "御殿場・富士" },
        ],
    },
    {
        code: "aichi",
        name: "愛知県",
        smallClasses: [
            { code: "nagoya", name: "名古屋" },
            { code: "chita", name: "知多・セントレア" },
            { code: "mikawa", name: "三河・豊橋" },
            { code: "gamagoori", name: "蒲郡・西浦" },
            { code: "inuyama", name: "犬山・瀬戸" },
        ],
    },
    {
        code: "mie",
        name: "三重県",
        smallClasses: [
            { code: "tsu", name: "津・鈴鹿" },
            { code: "ise", name: "伊勢・二見" },
            { code: "toba", name: "鳥羽" },
            { code: "shima", name: "志摩" },
            { code: "nagashima", name: "長島・桑名" },
        ],
    },
    {
        code: "shiga",
        name: "滋賀県",
        smallClasses: [
            { code: "otsu", name: "大津" },
            { code: "ogoto", name: "雄琴・草津" },
            { code: "hikone", name: "彦根・長浜" },
            { code: "omi", name: "近江八幡・甲賀" },
        ],
    },
    {
        code: "kyoto",
        name: "京都府",
        smallClasses: [
            { code: "kyoto", name: "京都市内" },
            { code: "amanohashidate", name: "天橋立・宮津" },
            { code: "kameoka", name: "亀岡・丹波" },
            { code: "uji", name: "宇治・長岡京" },
        ],
    },
    {
        code: "osaka",
        name: "大阪府",
        smallClasses: [
            { code: "osaka", name: "大阪市内" },
            { code: "sakai", name: "堺・岸和田" },
            { code: "usj", name: "ユニバーサルシティ" },
            { code: "kansaikuko", name: "関西空港" },
        ],
    },
    {
        code: "hyogo",
        name: "兵庫県",
        smallClasses: [
            { code: "kobe", name: "神戸・有馬" },
            { code: "himeji", name: "姫路・赤穂・播磨" },
            { code: "kinosaki", name: "城崎" },
            { code: "awaji", name: "淡路島" },
            { code: "takarazuka", name: "宝塚・西宮" },
        ],
    },
    {
        code: "nara",
        name: "奈良県",
        smallClasses: [
            { code: "nara", name: "奈良市内" },
            { code: "yoshino", name: "吉野・十津川" },
            { code: "ikaruga", name: "斑鳩・天理" },
        ],
    },
    {
        code: "wakayama",
        name: "和歌山県",
        smallClasses: [
            { code: "wakayama", name: "和歌山・加太" },
            { code: "shirahama", name: "白浜・田辺" },
            { code: "katsuura", name: "勝浦・串本" },
            { code: "koyasan", name: "高野山" },
        ],
    },
    {
        code: "tottori",
        name: "鳥取県",
        smallClasses: [
            { code: "tottori", name: "鳥取・岩美" },
            { code: "kurayoshi", name: "倉吉・三朝" },
            { code: "yonago", name: "米子・皆生・境港" },
            { code: "daisen", name: "大山" },
        ],
    },
    {
        code: "shimane",
        name: "島根県",
        smallClasses: [
            { code: "matsue", name: "松江・玉造" },
            { code: "izumo", name: "出雲" },
            { code: "tsuwano", name: "津和野" },
        ],
    },
    {
        code: "okayama",
        name: "岡山県",
        smallClasses: [
            { code: "okayama", name: "岡山・倉敷" },
            { code: "tsuyama", name: "津山・湯郷" },
            { code: "kojima", name: "児島・鷲羽山" },
        ],
    },
    {
        code: "hiroshima",
        name: "広島県",
        smallClasses: [
            { code: "hiroshima", name: "広島" },
            { code: "miyajima", name: "宮島・廿日市" },
            { code: "onomichi", name: "尾道・福山" },
            { code: "kure", name: "呉・竹原" },
        ],
    },
    {
        code: "yamaguchi",
        name: "山口県",
        smallClasses: [
            { code: "shimonoseki", name: "下関・宇部" },
            { code: "hagi", name: "萩・長門" },
            { code: "iwakuni", name: "岩国・周南" },
            { code: "yamaguchi", name: "山口・湯田温泉" },
        ],
    },
    {
        code: "tokushima",
        name: "徳島県",
        smallClasses: [
            { code: "tokushima", name: "徳島・鳴門" },
            { code: "iya", name: "祖谷・大歩危" },
        ],
    },
    {
        code: "kagawa",
        name: "香川県",
        smallClasses: [
            { code: "takamatsu", name: "高松・さぬき" },
            { code: "kotohira", name: "琴平・丸亀" },
            { code: "shodoshima", name: "小豆島" },
        ],
    },
    {
        code: "ehime",
        name: "愛媛県",
        smallClasses: [
            { code: "matsuyama", name: "松山・道後" },
            { code: "imabari", name: "今治・しまなみ海道" },
            { code: "uwajima", name: "宇和島・大洲" },
        ],
    },
    {
        code: "kochi",
        name: "高知県",
        smallClasses: [
            { code: "kochi", name: "高知" },
            { code: "shimanto", name: "四万十・足摺岬" },
        ],
    },
    {
        code: "fukuoka",
        name: "福岡県",
        smallClasses: [
            { code: "fukuoka", name: "福岡・博多" },
            { code: "kitakyushu", name: "北九州" },
            { code: "kurume", name: "久留米・筑後" },
        ],
    },
    {
        code: "saga",
        name: "佐賀県",
        smallClasses: [
            { code: "saga", name: "佐賀・鳥栖" },
            { code: "ureshino", name: "嬉野・武雄" },
            { code: "karatsu", name: "唐津・呼子" },
        ],
    },
    {
        code: "nagasaki",
        name: "長崎県",
        smallClasses: [
            { code: "nagasaki", name: "長崎" },
            { code: "sasebo", name: "佐世保・ハウステンボス" },
            { code: "unzen", name: "雲仙・島原" },
            { code: "goto", name: "五島列島" },
            { code: "tsushima", name: "壱岐・対馬" },
        ],
    },
    {
        code: "kumamoto",
        name: "熊本県",
        smallClasses: [
            { code: "kumamoto", name: "熊本" },
            { code: "aso", name: "阿蘇" },
            { code: "kurokawa", name: "黒川温泉・杖立" },
            { code: "amakusa", name: "天草" },
            { code: "hitoyoshi", name: "人吉・球磨" },
        ],
    },
    {
        code: "oita",
        name: "大分県",
        smallClasses: [
            { code: "beppu", name: "別府" },
            { code: "yufuin", name: "由布院" },
            { code: "oita", name: "大分" },
            { code: "usuki", name: "臼杵・佐伯" },
        ],
    },
    {
        code: "miyazaki",
        name: "宮崎県",
        smallClasses: [
            { code: "miyazaki", name: "宮崎・青島・日南" },
            { code: "takachiho", name: "高千穂" },
            { code: "nobeoka", name: "延岡・都城" },
        ],
    },
    {
        code: "kagoshima",
        name: "鹿児島県",
        smallClasses: [
            { code: "kagoshima", name: "鹿児島・桜島" },
            { code: "ibusuki", name: "指宿・知覧" },
            { code: "kirishima", name: "霧島" },
            { code: "yakushima", name: "屋久島" },
            { code: "amami", name: "奄美大島" },
        ],
    },
    {
        code: "okinawa",
        name: "沖縄県",
        smallClasses: [
            { code: "naha", name: "那覇" },
            { code: "chatan", name: "北谷・読谷" },
            { code: "onnason", name: "恩納村・名護" },
            { code: "nago", name: "本部・今帰仁" },
            { code: "miyako", name: "宮古島" },
            { code: "ishigaki", name: "石垣島" },
            { code: "kerama", name: "慶良間諸島" },
        ],
    },
];
