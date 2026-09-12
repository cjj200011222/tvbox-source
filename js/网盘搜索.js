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
 *   - 搜索：GET {api}/api/search?kw={关键词}
 *       ⚠️ 不要加 res=all —— 那会返回 results 全量明细，实测 30s+ 超时不可用；
 *          默认（不带 res）只返回 merged_by_type，实测约 4.8s，端上可用
 *   - 可选参数：src=all|tg|plugin（来源筛选）、cloud_types=quark,baidu（网盘类型筛选）
 *   - 其它接口：GET /api/health（健康检查）、POST /api/check/links（链接有效性检测）
 *
 * merged_by_type 条目结构（实测）：
 *   { url, password, note, datetime, source, images? }
 *   例：{"url":"https://pan.quark.cn/s/b8b00d651ee9","password":"","note":"繁花",
 *        "source":"plugin:wanou","images":["https://img9.doubanio.com/...jpg"]}
 *
 * 关键实测结论：
 *   - **默认模式响应约 4.8s**（PanSou 服务端 ASYNC_RESPONSE_TIMEOUT 默认 4s，
 *     到点先返回已有的），已超引擎默认 5s，故所有 fetch 必须显式带 timeout
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
    timeout: 20000,
    // 一级 = 热门搜索词入口（PanSou 没有分类/榜单接口，只能靠预设词给出可点内容）
    class_name: '庆余年&繁花&狂飙&三体&甄嬛传&漫威&动漫&综艺&纪录片&4K&蓝光&合集',
    class_url: '1&2&3&4&5&6&7&8&9&10&11&12',
    play_parse: true,
    play_json: [],
    推荐: $js.toString(() => {
        // 首页推荐：用「全集」这类网盘搜索高频词打底，展示真实资源（单次请求约 5s）
        VODS = rule.wpSearch('全集', 24);
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

// PanSou 实例地址：自建后改这里（如 http://192.168.1.10:8888）
rule.wpApi = 'https://so.252035.xyz';

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
// 请求失败/空结果时的重试次数（PanSou 公共实例偶发限流、偶发 400）
rule.wpRetry = 2;
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

/**
 * 调 PanSou 搜索并按 note 合并 —— 返回 TVBox 列表项数组
 * 同一资源横跨多个网盘类型时合并为一条（多条网盘 → 二级里的多条线路）
 *
 * 容错：PanSou 返回的是「服务端 4 秒内已到达的部分结果」，同一关键词两次搜索
 *       条数会变（实测「全集」629 → 187）；公共实例并发突发时会限流/返回 400。
 *       故做重试 + 全量 try/catch 兜底，任一环节失败返回 []，绝不抛错。
 */
rule.wpSearch = function (kw, limit) {
    var api = rule.wpApi || rule.host;
    var reqUrl = api + '/api/search?kw=' + encodeURIComponent(String(kw));
    var obj = null;
    var tries = rule.wpRetry || 1;
    for (var attempt = 0; attempt < tries; attempt++) {
        var raw = '';
        try {
            // 必须显式 timeout：PanSou 实测约 5s，超引擎默认 5s
            raw = fetch(reqUrl, { headers: rule.headers, timeout: 15000 }) || '';
        } catch (e) { raw = ''; }
        obj = null;
        try { obj = JSON.parse(raw); } catch (e) { obj = null; }
        if (obj && obj.data) { break; }
    }
    if (!obj || !obj.data) { return []; }
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
    var out = [];
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
    return out;
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
