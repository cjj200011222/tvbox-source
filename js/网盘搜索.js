/**
 * 网盘搜索 drpy 源（后端 = PanSou 盘搜聚合 API）
 * 站点：PanSou（开源项目 fish2018/pansou），本规则对接公共实例 https://so.252035.xyz
 *       —— 自建后只改 rule.wpApi 一处即可（见文件末尾配置区）
 *
 * 本源定位：把 PanSou 的「网盘资源聚合搜索」搬进 TVBox。
 *   搜索关键词 → 返回网盘资源卡片（夸克/百度/阿里/迅雷/UC/115/123/天翼/移动/磁力）
 *   点进详情 → 按网盘类型分线路，列出该资源的全部分享链接（含提取码）
 *
 * ⚠️ 重要限制（务必知晓）：
 *   网盘分享链接是网页地址，**不能直接当视频流播放**。本源 lazy 默认 parse:1
 *   （交给播放器嗅探/解析接口），能否播放取决于你端上是否配了网盘解析服务。
 *   若没配，请把 rule.wpPlayMode 改成 0，此时链接会原样交给播放器（可长按复制）。
 *   想要「点开即播」必须做网盘转存+直链解析（需要你自己的网盘账号 token），
 *   那是另一个量级的工程，不在本源范围内。
 *
 * 接口速查（PanSou）：
 *   - 搜索：GET {api}/api/search?kw={关键词}[&channels=频道1,频道2]
 *       ⚠️ 不要加 res=all —— 那会返回 results 全量明细，实测 30s+ 超时不可用
 *   - 其它可选参数：src=all|tg|plugin（来源筛选）、cloud_types=quark,baidu、conc（并发数）
 *   - 健康检查：GET /api/health（返回该实例启用的 plugins 与 channels 列表）
 *
 * ⚠️ 公共实例的可靠性（2026-09-12 实测 —— 这是本源"一直转圈然后失败"的根源）：
 *   - 成功率只有 6~7 成：随机返回 400/403/429/502，或直接挂起 25s+ 不响应
 *   - 失败大多是 0.3~0.5s 的**快速失败**，所以「多次快速重试」远优于「一次长等」
 *   - 全量源平均 4.5~6s（PanSou 服务端 ASYNC_RESPONSE_TIMEOUT 默认 4s，到点先返回已有的）
 *   - 用 channels 限定 TG 频道可大幅提速：15 个精选频道 0.9s/37 条，
 *     比全量源的 4.5s/14 条又快又多（并发上限 conc 默认 10，60 个频道排队，
 *     4s 窗口里只搜得完一小部分）
 *   - 故本源策略固定为：短超时 + 总时间预算 + 多实例/多策略回退 + 结果缓存
 *
 * merged_by_type 条目结构（实测）：
 *   { url, password, note, datetime, source, images? }
 *   例：{"url":"https://pan.quark.cn/s/b8b00d651ee9","password":"","note":"繁花",
 *        "source":"plugin:wanou","images":["https://img9.doubanio.com/...jpg"]}
 *
 * 关键实测结论：
 *   - **默认模式响应约 4.5~6s**（PanSou 服务端 ASYNC_RESPONSE_TIMEOUT 默认 4s，
 *     到点先返回已有的），已超引擎默认 5s（drpy2: rule.timeout || 5e3），
 *     故所有 fetch 必须显式带 timeout
 *   - **条目自带封面** images[]（豆瓣/腾讯/TG CDN），豆瓣图**直连即 200**（免 referer），
 *     无需代理；wsrv.nl 反而 404 不可用
 *   - **同一资源会横跨多个网盘类型**（同一插件的 note 完全相同）→ 本源按 note 精确合并，
 *     一张卡片 = 一个资源，多条网盘 = 多条线路
 *   - 夸克资源量最大（实测 191 条 vs 百度 44 / UC 13 / 阿里 7），故类型顺序夸克优先
 *
 * 引擎注意：函数体内禁用 url/res/fl/name/html 等引擎变量名；顶层 return 非法须 if 包裹；
 *          跨函数共享配置/工具一律挂 rule 对象（引擎 IIFE 下顶层 var 不跨函数可见）
 */
var rule = {
    title: '网盘搜索',
    host: 'https://so.252035.xyz',
    // 说明性模板（实际请求在函数里手动拼，PanSou 不是 CMS 路径式接口）
    url: '/api/search?kw=fyclass&pg=fypage',
    searchUrl: '/api/search?kw=**',
    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    },
    timeout: 10000,
    // 一级 = 热门搜索词入口（PanSou 没有分类/榜单接口，只能靠预设词给出可点内容）
    class_name: '庆余年&繁花&狂飙&三体&甄嬛传&漫威&动漫&综艺&纪录片&4K&蓝光&合集',
    class_url: '1&2&3&4&5&6&7&8&9&10&11&12',
    play_parse: true,
    play_json: [],
    推荐: $js.toString(() => {
        // 首页：命中量大的热词打底；失败或空就在总预算内换词，绝不长时间挂起
        var kws = rule.wpHomeKw || ['全集', '合集', '动漫'];
        var t0 = rule.wpNow();
        var out = [];
        for (var i = 0; i < kws.length; i++) {
            var left = rule.wpHomeBudget - (rule.wpNow() - t0);
            if (left < 1200) { break; }
            out = rule.wpSearch(kws[i], 24, left);
            if (out && out.length) { break; }
        }
        VODS = out;
    }),
    一级: $js.toString(() => {
        // MY_CATE 是 class_url 的下标（1 起），映射回热词
        var idx = parseInt(String(MY_CATE).replace(/[^0-9]/g, ''), 10);
        var hot = rule.wpHot || [];
        var kw = hot[idx - 1] || '合集';
        VODS = rule.wpSearch(kw, 80);
    }),
    二级: $js.toString(() => {
        // vodObj 先给全字段默认值：坏 id / 解码失败时也不会返回 undefined
        var vodObj = {
            vod_id: String(orId),
            vod_name: '',
            vod_pic: '',
            vod_year: '',
            vod_area: '',
            vod_director: '',
            vod_actor: '',
            type_name: '网盘资源',
            vod_remarks: '',
            vod_content: '',
            vod_blurb: '',
            vod_play_from: '',
            vod_play_url: ''
        };
        try {
            var data = rule.wpDecode(orId);
            if (data) {
                var note = String(data.n || '');
                var links = data.l || [];
                vodObj.vod_name = note;
                vodObj.vod_pic = data.p || '';
                vodObj.vod_remarks = links.length + ' 条链接';
                // 按网盘类型分线路：同类型下的多条分享作为「多集」
                var byType = {};
                var typeOrder = [];
                links.forEach(function (lk) {
                    var t = String(lk[0] || 'other');
                    var u = String(lk[1] || '');
                    var pw = String(lk[2] || '');
                    if (!u) { return; }
                    if (!byType[t]) { byType[t] = []; typeOrder.push(t); }
                    var no = byType[t].length + 1;
                    var label = pw ? ('链接' + no + '·提取码' + pw) : ('链接' + no);
                    byType[t].push(label + '$' + u);
                });
                var froms = [];
                var urls = [];
                typeOrder.forEach(function (t) {
                    froms.push(rule.wpTypeName[t] || t);
                    urls.push(byType[t].join('#'));
                });
                vodObj.vod_play_from = froms.join('$$$');
                vodObj.vod_play_url = urls.join('$$$');
                var desc = note + '\n\n共 ' + links.length + ' 条网盘链接，覆盖：'
                    + froms.join('、') + '。'
                    + '\n点下方线路打开对应分享页（网盘链接需在网盘 App / 网页中打开并转存，不能直接播放）。';
                vodObj.vod_content = desc;
                vodObj.vod_blurb = desc.substring(0, 100);
            }
        } catch (e) { }
        VOD = vodObj;
    }),
    搜索: $js.toString(() => {
        var kw = String(KEY || '').trim();
        VODS = kw ? rule.wpSearch(kw, 80) : [];
    }),
    lazy: $js.toString(() => {
        // 网盘分享链接 / 磁力链接都不能直出视频流，默认交解析器嗅探（见文件头限制说明）
        try {
            var u = String(input).trim();
            var mode = rule.wpPlayMode;
            if (/^magnet:/i.test(u)) {
                input = { parse: mode, url: u, js: '' };
            } else if (/^https?:\/\//i.test(u)) {
                input = { parse: mode, url: u, headers: rule.headers };
            } else {
                input = { parse: 0, url: '网盘搜索:无效链接', js: '' };
            }
        } catch (e) {
            input = { parse: 0, url: '网盘搜索:' + e.message, js: '' };
        }
    })
};

/* ============================ 配置区（挂 rule，函数体内可见） ============================ */

/* ---- 实例与容错（改动这里就够了）---- */

// PanSou 实例地址列表，按顺序回退。自建后把自建地址放第一个（如 http://192.168.1.10:8888）
// 公共实例实测成功率仅 6~7 成，多备一两个实例是性价比最高的优化
rule.wpApiList = ['https://so.252035.xyz', 'https://pansou.app'];
// 兼容旧写法：单实例地址（= 列表首个）
rule.wpApi = rule.wpApiList[0];

// 精选 TG 频道（逗号分隔）。原理：PanSou 并发上限 conc 默认 10，60 个频道要排队，
// 服务端 4s 一到就先返回已有结果 —— 限定频道反而能在窗口内搜完，又快又多
// （实测 15 个精选频道 0.9s/37 条，全量源 4.5s/14 条）
// 填空字符串即关闭此优化（走全量源）。频道名随实例而变，可用 /api/health 查看
rule.wpChannels = 'tgsearchers4,Aliyun_4K_Movies,yunpanx,PanjClub,MCPH01,MCPH02,MCPH03,shareAliyun,alyp_1,Quark_Movies,ucquark,tyypzhpd,yydf_hzl,leoziyuan,Q_dongman';

// 单次 HTTP 请求超时（毫秒）。5.5s 略高于 PanSou 的 4s 收集窗口（成功响应实测 4.5~6s），
// 超时立刻换策略重试；失败多为 0.3~0.5s 的快速失败，所以总预算内通常能跑两三轮
rule.wpTimeout = 5500;
// 一次搜索的总时间预算（毫秒）——端上（zyfun 10s、TVBox 约 10s）等不起长等待
rule.wpBudget = 7000;
// 首页（推荐）的总时间预算（毫秒）
rule.wpHomeBudget = 8000;
// 首页热词，失败依次降级
rule.wpHomeKw = ['全集', '合集', '动漫'];
// 结果缓存时长（毫秒）：同一会话里重复进同一分类/关键词秒开
rule.wpCacheTtl = 600000;
// 缓存保留的最大条目数（列表按需截取）
rule.wpCacheLimit = 250;

// lazy 播放模式：1=交给播放器解析/嗅探（需端上配解析接口）；0=当直链原样交给播放器
rule.wpPlayMode = 1;

// 网盘类型遍历顺序（夸克资源量最大放最前）
rule.wpTypes = ['quark', 'uc', 'aliyun', 'baidu', 'xunlei', '115', '123', 'tianyi', 'mobile', 'magnet'];

// 网盘类型中文名
rule.wpTypeName = {
    'quark': '夸克网盘',
    'uc': 'UC网盘',
    'aliyun': '阿里云盘',
    'baidu': '百度网盘',
    'xunlei': '迅雷云盘',
    '115': '115网盘',
    '123': '123网盘',
    'tianyi': '天翼云盘',
    'mobile': '移动云盘',
    'magnet': '磁力链接'
};

// 一级热词（与 class_name/class_url 下标一一对应，1 起）
rule.wpHot = ['庆余年', '繁花', '狂飙', '三体', '甄嬛传', '漫威', '动漫', '综艺', '纪录片', '4K', '蓝光', '合集'];

// 每个网盘类型最多取多少条（防夸克一家独大刷满列表）
rule.wpPerType = 25;
// 单条资源最多保留多少条分享链接（控制 vod_id 长度）
rule.wpMaxLinks = 6;
// 单条资源标题最大长度（同时用于列表显示和 vod_id 内嵌，中文 1 字 = 3 字节 = 4 base64 字符）
rule.wpNameMax = 80;
// 注：重试次数不再单独配置 —— 改为「在总时间预算内尽可能多轮换策略」，见 rule.wpFetch
// 噪音过滤：TG 频道每日「更新目录」类帖子，命中即丢弃（不是具体资源）
// 存字符串而非 RegExp —— rule 对象可能被引擎序列化传给 worker，RegExp 会退化成 {} 导致 .test 抛错
rule.wpSkipRe = '更新目录|资源目录|目录汇总|今日更新|每日更新|更新汇总|^#+\\s*$';

/* ============================ 工具函数 ============================ */

/**
 * 清洗 TG 频道帖子的脏标题
 * 实测原始 note 形如：
 *   「#动漫🗄 斗罗大陆Ⅱ：绝世唐门 年番(2025) 4K臻彩 更新至170集📜介绍：...」
 *   「#动漫国漫：死灵法师！我即是天灾 (2026) 更新至17集 Ai动画剧情：...」
 *   「#动漫名称：BanG Dream! YUME∞MITA BanG Dream! ゆめ∞みた (2026)」
 * 处理顺序：剥 `📜介绍：` 之后的剧情简介 → 剥「#标签冒号」式前缀 → 剥「#标签空格」式前缀 → 去装饰字符
 * 原则：宁可留脏，不可误伤 —— 标签词长上限 8/12 字，靠长度限制避免把片名一起吃掉
 */
rule.wpCleanNote = function (note) {
    var s = String(note || '').replace(/\s+/g, ' ').trim();
    if (!s) { return ''; }
    // 1) 剧情简介另起一段，标题只取前半
    var cut = s.split(/📜\s*介绍\s*[:：]?/);
    if (cut.length > 1) { s = cut[0].trim(); }
    // 2) 「#动漫名称：BanG Dream!」→ 剥「#动漫名称：」
    s = s.replace(/^#[^\s#]{1,8}[:：]\s*/, '').trim();
    // 3) 「#动漫🗄 斗罗大陆」→ 剥「#动漫🗄 」（标签后必须跟空白）
    s = s.replace(/^(#[^\s#]{1,12}\s+)+/, '').trim();
    // 4) 去装饰字符
    s = s.replace(/[🗄📁📂📌🔗]/g, '').replace(/\s+/g, ' ').trim();
    return s;
};

/* ------------------------ 网络层（缓存 / 回退 / 预算） ------------------------ */

rule.wpNow = function () {
    return new Date().getTime();
};

/* 进程内结果缓存：rule 常驻引擎，同一会话里重复进同一分类/关键词直接命中，秒开 */
rule.wpCache = {};

rule.wpCacheGet = function (kw) {
    try {
        var c = rule.wpCache[kw];
        if (!c) { return null; }
        if (rule.wpNow() - c.t > rule.wpCacheTtl) {
            delete rule.wpCache[kw];
            return null;
        }
        return c.v;
    } catch (e) { return null; }
};

rule.wpCachePut = function (kw, v) {
    try { rule.wpCache[kw] = { t: rule.wpNow(), v: v }; } catch (e) { }
};

/**
 * 单次请求 PanSou
 * @param base 实例地址
 * @param kw 关键词
 * @param useChannels 是否带 channels 限定（精选频道模式）
 * @param ms 本次请求超时（毫秒）——必须显式传，引擎默认只有 5s
 */
rule.wpFetchOne = function (base, kw, useChannels, ms) {
    var qs = 'kw=' + encodeURIComponent(String(kw));
    if (useChannels && rule.wpChannels) {
        qs += '&channels=' + encodeURIComponent(rule.wpChannels);
    }
    var url = String(base).replace(/\/+$/, '') + '/api/search?' + qs;
    var raw = '';
    try {
        raw = fetch(url, { headers: rule.headers, timeout: ms }) || '';
    } catch (e) { raw = ''; }
    var obj = null;
    try { obj = JSON.parse(raw); } catch (e) { obj = null; }
    return obj;
};

/**
 * 带回退的搜索请求：
 *   主实例(精选频道) → 主实例(全量源) → 备实例(精选频道) → 备实例(全量源)
 * 关键：公共实例的失败大多是 0.3~0.5s 的快速失败，所以在总预算内能跑完好几轮；
 *       而总耗时被 budget 硬性约束，绝不会像「单次 15s 长等 + 再重试一次」那样
 *       把端上（zyfun/TVBox 约 10s）直接拖超时 —— 这就是之前一直转圈失败的原因。
 */
rule.wpFetch = function (kw, budget) {
    var apis = rule.wpApiList || [rule.wpApi];
    var total = budget || rule.wpBudget;
    var t0 = rule.wpNow();
    var plan = [];
    for (var a = 0; a < apis.length; a++) {
        plan.push([apis[a], true]);
        plan.push([apis[a], false]);
    }
    for (var i = 0; i < plan.length; i++) {
        var left = total - (rule.wpNow() - t0);
        if (left < 1200) { break; }
        var ms = left > rule.wpTimeout ? rule.wpTimeout : left;
        var obj = rule.wpFetchOne(plan[i][0], kw, plan[i][1], ms);
        if (obj && obj.data) { return obj; }
    }
    return null;
};

/**
 * 把 PanSou 响应组装成 TVBox 列表项（按 note 精确合并同一资源）
 */
rule.wpBuild = function (obj, limit) {
    var out = [];
    try {
    var mbt = obj.data.merged_by_type || {};
    var types = rule.wpTypes || [];
    var map = {};
    var order = [];
    // 在函数内构造 RegExp（见 wpSkipRe 说明：不把 RegExp 挂在 rule 上）
    var skipRe = null;
    try { skipRe = new RegExp(rule.wpSkipRe); } catch (e) { skipRe = null; }
    for (var ti = 0; ti < types.length; ti++) {
        var t = types[ti];
        var arr = mbt[t] || [];
        var used = 0;
        for (var ai = 0; ai < arr.length && used < rule.wpPerType; ai++) {
            var it = arr[ai] || {};
            var note = rule.wpCleanNote(it.note);
            var linkUrl = String(it.url || '').trim();
            if (!note || !linkUrl) { continue; }
            if (skipRe && skipRe.test(note)) { continue; }
            used++;
            var key = note.length > rule.wpNameMax ? note.substring(0, rule.wpNameMax) : note;
            var rec = map[key];
            if (!rec) {
                rec = { n: key, p: '', l: [] };
                map[key] = rec;
                order.push(key);
            }
            if (!rec.p && it.images && it.images.length) {
                rec.p = String(it.images[0] || '');
            }
            if (rec.l.length < rule.wpMaxLinks) {
                rec.l.push([t, linkUrl, String(it.password || '')]);
            }
        }
    }
    for (var oi = 0; oi < order.length && out.length < limit; oi++) {
        var r = map[order[oi]];
        if (!r || !r.l.length) { continue; }
        var tags = [];
        r.l.forEach(function (lk) {
            var nm = rule.wpTypeName[lk[0]] || lk[0];
            if (tags.indexOf(nm) < 0) { tags.push(nm); }
        });
        out.push({
            vod_id: rule.wpEncode(r),
            vod_name: r.n,
            vod_pic: r.p,
            vod_remarks: tags.join('/') + ' · ' + r.l.length + '链',
            vod_blurb: r.n
        });
    }
    } catch (e) { return out; }
    return out;
};

/**
 * 对外入口：搜索并按 note 合并 —— 返回 TVBox 列表项数组
 * 先查缓存（命中即秒开），未命中则走「多策略回退 + 总预算约束」的请求，结果写入缓存
 * 任一环节失败都返回 []，绝不抛错 —— 端上最多显示空分类，不会报错也不会卡死
 */
rule.wpSearch = function (kw, limit, budget) {
    var k = String(kw || '').trim();
    if (!k) { return []; }
    var lim = limit || 24;
    var cached = rule.wpCacheGet(k);
    if (cached) {
        return cached.length > lim ? cached.slice(0, lim) : cached;
    }
    var obj = null;
    try { obj = rule.wpFetch(k, budget); } catch (e) { obj = null; }
    if (!obj || !obj.data) { return []; }
    var out = rule.wpBuild(obj, rule.wpCacheLimit || 250);
    rule.wpCachePut(k, out);
    return out.length > lim ? out.slice(0, lim) : out;
};

// 资源对象 → vod_id（带 http://wp/ 伪前缀，避免引擎对不含 http 的 id 做 base64 解码）
rule.wpEncode = function (rec) {
    try {
        return 'http://wp/' + rule.b64e(JSON.stringify(rec));
    } catch (e) {
        return 'http://wp/';
    }
};

// vod_id → 资源对象
rule.wpDecode = function (id) {
    try {
        var parts = String(id).split('http://wp/');
        var s = parts.length > 1 ? parts[parts.length - 1] : parts[0];
        s = String(s).replace(/[^A-Za-z0-9\-_]/g, '');
        if (!s) { return null; }
        return JSON.parse(rule.b64d(s));
    } catch (e) {
        return null;
    }
};

/**
 * 自实现 base64url 编解码（UTF-8 安全）
 * 不依赖引擎 base64Decode —— CryptoJS 宽松解码行为不可控（本项目多次踩坑）
 */
rule.b64e = function (str) {
    var CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    var s = String(str);
    var bytes = [];
    for (var i = 0; i < s.length; i++) {
        var c = s.charCodeAt(i);
        if (c < 0x80) {
            bytes.push(c);
        } else if (c < 0x800) {
            bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63));
        } else {
            bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
        }
    }
    var out = '';
    var n = bytes.length;
    for (var j = 0; j < n; j += 3) {
        var b0 = bytes[j];
        var b1 = j + 1 < n ? bytes[j + 1] : -1;
        var b2 = j + 2 < n ? bytes[j + 2] : -1;
        out += CH.charAt(b0 >> 2);
        out += CH.charAt(((b0 & 3) << 4) | (b1 < 0 ? 0 : b1 >> 4));
        if (b1 < 0) { break; }
        out += CH.charAt(((b1 & 15) << 2) | (b2 < 0 ? 0 : b2 >> 6));
        if (b2 < 0) { break; }
        out += CH.charAt(b2 & 63);
    }
    return out;
};

rule.b64d = function (str) {
    var CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    var s = String(str).replace(/[^A-Za-z0-9\-_]/g, '');
    var bytes = [];
    for (var i = 0; i < s.length; i += 4) {
        var n0 = CH.indexOf(s.charAt(i));
        var n1 = i + 1 < s.length ? CH.indexOf(s.charAt(i + 1)) : -1;
        var n2 = i + 2 < s.length ? CH.indexOf(s.charAt(i + 2)) : -1;
        var n3 = i + 3 < s.length ? CH.indexOf(s.charAt(i + 3)) : -1;
        if (n0 < 0) { break; }
        bytes.push((n0 << 2) | (n1 < 0 ? 0 : n1 >> 4));
        if (n1 < 0) { break; }
        if (n2 < 0) { break; }
        bytes.push(((n1 & 15) << 4) | (n2 >> 2));
        if (n3 < 0) { break; }
        bytes.push(((n2 & 3) << 6) | n3);
    }
    var out = '';
    var k = 0;
    while (k < bytes.length) {
        var b = bytes[k];
        if (b < 0x80) {
            out += String.fromCharCode(b);
            k += 1;
        } else if (b >= 0xe0 && k + 2 < bytes.length) {
            out += String.fromCharCode(((b & 15) << 12) | ((bytes[k + 1] & 63) << 6) | (bytes[k + 2] & 63));
            k += 3;
        } else if (k + 1 < bytes.length) {
            out += String.fromCharCode(((b & 31) << 6) | (bytes[k + 1] & 63));
            k += 2;
        } else {
            break;
        }
    }
    return out;
};
