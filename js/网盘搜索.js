/**
 * 网盘搜索 drpy 源（后端 = PanSou 盘搜聚合 API）
 * 站点：PanSou（开源项目 fish2018/pansou），本规则对接公共实例 https://so.252035.xyz
 *       —— 自建后只改 rule.wpApiList 即可（见配置区）
 *
 * 本源定位：把 PanSou 的「网盘资源聚合搜索」搬进 TVBox。
 *   搜索关键词 → 返回网盘资源卡片（夸克/百度/阿里/迅雷/UC/115/123/天翼/移动/磁力）
 *   点进详情 → 按网盘类型分线路，列出该资源的全部分享链接（含提取码）
 *
 * ✅ 夸克直链播放（2026-09-13 新增，链路逆向自 spider.jar 的 QuarkPan 类）：
 *   进「扫码登录」分类 → 用手机夸克 App 扫码（与趣盘等 Java 源同款交互）
 *   → 登录后夸克资源多出「夸克直链」线路：点开即播（自动转存到网盘临时目录
 *   → 调官方 API 取视频直链 → 播放后清理转存文件），与趣盘体验一致。
 *   cookie 通过引擎 setItem 持久化（手机端存本地；zyfun 端会话级，重启后需重扫）。
 *
 * ✅ 配置中心 Cookie 共享（2026-09-13 新增，手机端 TVBox 专用）：
 *   FongMi 系端上的本地服务把 /sdcard/ 映射为 http://127.0.0.1:9978/file/，
 *   配置中心（csp_Config，Java spider）扫码登录后把夸克 Cookie 明文写在
 *   /sdcard/TVBox/quark_cookie.txt（JSON：{nickname, member_type, cookie}）。
 *   我们的 drpy 规则与 Java spider 跑在同一个 App 里，直接读这个文件即可
 *   **复用配置中心的登录态——已扫码过的手机不用再扫第二次**。
 *   取值顺序：自有存储 → 内存 → 配置中心文件；zyfun 端无本地服务自动跳过。
 *
 * ⚠️ 未登录 / 非夸克资源的限制（务必知晓）：
 *   网盘分享链接是网页地址，**不能直接当视频流播放**。普通线路 lazy 默认 parse:1
 *   （交给播放器嗅探/解析接口），能否播放取决于你端上是否配了网盘解析服务。
 *   若没配，请把 rule.wpPlayMode 改成 0，此时链接会原样交给播放器（可长按复制）。
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
    // 一级 = 热门搜索词入口 + 扫码登录（PanSou 没有分类/榜单接口，只能靠预设词给出可点内容）
    // 「扫码登录」是功能入口：点开展示夸克扫码卡片，App 扫码确认后再点一次即登录
    class_name: '扫码登录&庆余年&繁花&狂飙&三体&甄嬛传&漫威&动漫&综艺&纪录片&4K&蓝光&合集',
    class_url: 'login&1&2&3&4&5&6&7&8&9&10&11&12',
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
            // 是"请求失败"而不是"真没数据" → 实例整体有问题，换词也没用，立刻停
            // （否则最坏会变成 3 个词 × 每词一轮请求 = 首页一次请求风暴）
            if (rule.wpLastOk === false) { break; }
        }
        VODS = out;
    }),
    一级: $js.toString(() => {
        // 功能入口：扫码登录夸克（登录后夸克/UC 资源可点开即播）
        if (String(MY_CATE) === 'login') {
            VODS = rule.wpLoginList(MY_PAGE);
            // 顶层 return 非法（引擎 eval 不包函数）—— 用 else 包住主逻辑
        } else {
            // MY_CATE 是 class_url 的下标（1 起），映射回热词
            var idx = parseInt(String(MY_CATE).replace(/[^0-9]/g, ''), 10);
            var hot = rule.wpHot || [];
            var kw = hot[idx - 1] || '合集';
            // 一次拿满缓存上限，再按页切片：翻页共用同一份缓存，不再重复请求网络；
            // 翻过头返回 [] → 端上自然停止翻页（防无限下拉请求）
            VODS = rule.wpPage(rule.wpSearch(kw, rule.wpCacheLimit || 250), MY_PAGE, rule.wpPageSize);
        }
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
            // 登录入口卡片 → 登录流程二级
            if (String(orId).indexOf('http://wp/login') === 0) {
                VOD = rule.wpLoginDetail(String(orId));
                // 顶层 return 非法——用 if/else 结构
            } else {
                var data = rule.wpDecode(orId);
                if (data) {
                    var note = String(data.n || '');
                    var links = data.l || [];
                    vodObj.vod_name = note;
                    vodObj.vod_pic = data.p || '';
                    vodObj.vod_remarks = links.length + ' 条链接';
                    // 已登录夸克 → 夸克/UC 分享直接列出真实文件（点开即播），
                    // 其它网盘保持「链接列表 + 嗅探/复制」模式
                    var froms = [];
                    var urls = [];
                    var played = false; // 夸克直链线路是否已生成
                    if (rule.wpQuarkLoginState()) {
                        var quarkLine = rule.wpQuarkDetailLine(links);
                        if (quarkLine) {
                            froms.push('夸克直链');
                            urls.push(quarkLine);
                            played = true;
                        }
                    }                    // 剩下的（未直链化的）链接按网盘类型分线路，条目标签「第01集」样式
                    var byType = {};
                    var typeOrder = [];
                    links.forEach(function (lk) {
                        var t = String(lk[0] || 'other');
                        var u = String(lk[1] || '');
                        var pw = String(lk[2] || '');
                        if (!u) { return; }
                        // 夸克直链已生成的就不再进普通线路（同一批夸克链接）
                        if (played && (t === 'quark' || t === 'uc')) { return; }
                        if (!byType[t]) { byType[t] = []; typeOrder.push(t); }
                        var no = byType[t].length + 1;
                        // 「第01集」与其它网盘源的展示一致；提取码用「@@」随链接传给 lazy
                        var nm = '第' + (no < 10 ? '0' + no : no) + '集';
                        byType[t].push(nm + '$' + u + (pw ? '@@' + pw : ''));
                    });
                    typeOrder.forEach(function (t) {
                        froms.push(rule.wpTypeName[t] || t);
                        urls.push(byType[t].join('#'));
                    });
                    vodObj.vod_play_from = froms.join('$$$');
                    vodObj.vod_play_url = urls.join('$$$');
                    var desc = note + '\n\n共 ' + links.length + ' 条网盘链接，覆盖：'
                        + froms.join('、') + '。';
                    if (played) {
                        desc += '\n✅ 已登录夸克：「夸克直链」线路可直接播放。';
                        // 手机端（9978 本地服务在）：本地代理 + 配置中心 cookie，点开即播，无需 TV 码
                        // zyfun / 无本地服务端：需要 TV 授权通道，给明确引导
                        if (!rule.qkProxyMode() && !rule.qtLoginState()) {
                            desc += '\n⚠️ 本端缺少播放通道：手机TVBox请在「配置中心」源扫码登录夸克（本源自动共用）；电脑zyfun请进「扫码登录」分类扫第二张TV码。';
                        }
                    } else {
                        desc += '\n提示：「第01集/第02集」是同一资源在不同网盘/不同账号的分享链接，并非剧集序号。'
                            + '\n点下方线路打开对应分享页（网盘链接需在网盘 App / 网页中打开并转存，不能直接播放）。'
                            + '\n想直接播放？进分类「扫码登录」用夸克 App 扫码，之后夸克/UC 资源即可点开即播。';
                    }
                    vodObj.vod_content = desc;
                    vodObj.vod_blurb = desc.substring(0, 100);
                }
            }
        } catch (e) { }
        VOD = vodObj;
    }),
    搜索: $js.toString(() => {
        var kw = String(KEY || '').trim();
        // 同一级：全量取一次进缓存，翻页只切片不再请求
        VODS = kw ? rule.wpPage(rule.wpSearch(kw, rule.wpCacheLimit || 250), MY_PAGE, rule.wpPageSize) : [];
    }),
    lazy: $js.toString(() => {
        // 四类输入：夸克直链（qk://）、退出登录操作（qqklogout / qtvlogout）、重新检测（qkredetect）、普通分享链接
        try {
            var rawIn = String(input).trim();
            if (rawIn === 'qqklogout') {
                // 退出登录：清存储与内存；置 ignore 标记让配置中心共享也停用
                // （配置中心的 cookie 文件不动 —— 趣盘等 Java 源还要用，只是本源不再读它）
                try { setItem(rule.QUARK_CK_KEY, ''); } catch (e) { }
                rule._qkCk = '';
                rule._qkIgnoreCfg = true;
                rule._qkCfgCache = null;
                input = { parse: 0, url: '已退出转存登录，回列表重新扫码即可再次登录', js: '' };
            } else if (rawIn === 'qtvlogout') {
                // 退出 TV 播放通道登录
                try {
                    setItem(rule.QT_REFRESH_KEY, '');
                    setItem(rule.QT_ACCESS_KEY, '');
                    setItem(rule.QT_QUERY_KEY, '');
                } catch (e) { }
                input = { parse: 0, url: '已退出TV播放通道，回列表重新扫码即可再次授权', js: '' };
            } else if (rawIn === 'qkredetect') {
                // 重新检测配置中心：清 ignore 标记并强刷一次（配置中心里重新扫码后用这个）
                rule._qkIgnoreCfg = false;
                rule._qkCfgCache = null;
                var nck = rule.qkCfgCenterCookie(true);
                if (nck) { rule._qkCk = nck; }
                input = nck
                    ? { parse: 0, url: '已检测到配置中心的夸克登录，现在可以直接播放了', js: '' }
                    : { parse: 0, url: '未检测到配置中心登录：请先在「配置中心」源里扫码登录夸克，再回来点这项', js: '' };
            } else if (rawIn.indexOf('qk://') === 0) {
                // 夸克直链剧集：转存 → 取直链 → 直接播放（不嗅探）
                input = rule.wpQuarkPlay(rawIn.slice(5));
            } else {
                // 普通网盘分享链接 / 磁力：不能直出视频流，默认交解析器嗅探
                // 集名后缀「@@提取码」：分享码不能丢，随链接传到这里，展示给用户同时不进 URL
                var parts = rawIn.split('@@');
                var u = parts[0];
                var pw = parts.length > 1 ? String(parts[1] || '') : '';
                var mode = rule.wpPlayMode;
                if (/^magnet:/i.test(u)) {
                    input = { parse: mode, url: u, js: '' };
                } else if (/^https?:\/\//i.test(u)) {
                    // 有提取码且 URL 里还没带上（PanSou 部分数据 URL 自带 ?pwd=xxx，别重复追加）
                    var finalUrl = (pw && u.indexOf(pw) < 0)
                        ? (u + (u.indexOf('?') >= 0 ? '&' : '?') + 'pwd=' + encodeURIComponent(pw))
                        : u;
                    input = { parse: mode, url: finalUrl, headers: rule.headers };
                } else {
                    input = { parse: 0, url: '网盘搜索:无效链接', js: '' };
                }
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
// ⚠️ 请求失败后的冷却时长（毫秒）：这段时间内同一关键词直接返回空，一个请求都不发
//    没有它的话，用户每刷新一次就会重新打满一轮请求（公共实例会 429 限流，越刷越糟）
rule.wpFailTtl = 25000;
// 单次搜索最多发几次 HTTP 请求（时间预算之外的第二道闸）
// 注意：失败冷却只是"防反复"，这一条是"防单次过猛"
rule.wpMaxReq = 3;
// 剩余预算低于这个值就不再发起新请求（PanSou 成功响应要 4.5~6s，发也白发）
rule.wpMinLeft = 2500;
// ⚠️ 实例健康度：一个实例挂掉后会"卡住不响应"（不是快速失败），会把整个预算吃光
//    导致备胎实例永远轮不上。所以失败后把它降级一段时间，期间直接跳过，
//    把预算全部留给还能用的实例。连续失败 wpSickAfter 次、或出现一次无响应即降级。
rule.wpSickTtl = 90000;
rule.wpSickAfter = 2;
// 缓存条目数上限，超出后丢掉最老的一半（防长时间使用内存无限增长）
rule.wpCacheMax = 200;
// 列表每页条数（一级/搜索共用，翻页只切片不重新请求）
rule.wpPageSize = 24;

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

/* ============================ 夸克网盘登录 + 转存直链（仿 QuarkPan） ============================
 * 链路（2026-09-13 从 spider.jar 的 QuarkPan/QuarkYun 类逆向 + 开源项目对照确认）：
 *   登录（无需账号密码，手机夸克 App 扫码）：
 *     ① POST uop.quark.cn/cas/ajax/getTokenForQrcodeLogin?client_id=532&v=1.2 → token
 *     ② 二维码内容 = https://su.quark.cn/4_eMHBJ?token={token}（用户用夸克 App 扫）
 *     ③ 轮询 GET uop.quark.cn/cas/ajax/getServiceTicketByQrcodeToken?...&token={token}
 *        status 50004001=未扫 / 50004002=已扫未确认 / 2000000=已确认(带 service_ticket)
 *     ④ GET pan.quark.cn/account/info?fr=pc&platform=pc&st={service_ticket}
 *        响应 Set-Cookie 里的 __pus / __puus 即登录态 cookie
 *   转存直链（播放时）：
 *     ① POST drive-pc.quark.cn/1/clouddrive/share/sharepage/token {pwd_id, passcode} → stoken（免登录）
 *     ② GET  share/sharepage/detail?pwd_id=&stoken=&pdir_fid=0&_page=1&_size=50 → 文件列表 fid + share_fid_token
 *     ③ POST share/sharepage/save {fid_list, fid_token_list, to_pdir_fid, pwd_id, stoken, pdir_fid:0, scene:'link'}
 *        → task_id（转存到自己网盘根目录的临时文件夹）
 *     ④ GET  task?task_id= 轮询 → 完成
 *     ⑤ GET  file/v2/play?fid= → video_list[].url 直链（mp4/m3u8）
 *     ⑥ file/delete 清理转存的临时文件（看完删，不占用户网盘空间）
 * cookie 用引擎 setItem/getItem 持久化（zyfun 端是会话级内存，手机端持久化到本地）
 */

// 夸克登录 cookie 的存储键
rule.QUARK_CK_KEY = 'wp_quark_cookie';
// 夸克昵称的存储键（显示用，可不存）
rule.QUARK_NICK_KEY = 'wp_quark_nick';
// 转存临时目录名（用户网盘里可见；每次播放前清理旧的）
rule.qkTmpDir = 'TVBox播放缓存';

/* ===== 手机端本地代理通道（2026-09-13 第二次改造，配置中心 cookie 的正确用法） =====
 * 真相（反编译 tvbox/spider.jar 的 merge/F/a + merge/b/w + Pan 类实证）：
 * 手机端「趣盘」等 Java 源能播夸克，靠的不是把直链交给播放器（那也会被 412 拦），
 * 而是把剧集 URL 生成为 **本地代理**：
 *     http://127.0.0.1:9978/proxy?do=pan&site=quark&shareId={pwd_id}&fileId={fid}&fileToken={share_fid_token}
 * 播放器请求这个 URL → FongMi 壳把请求转给 jar 的 Proxy/Pan.proxy() → jar 在 app 内部
 * （okhttp 网络栈）实时完成 stoken→转存→acquire_dl_token(伪装 Mac 客户端)→file/download→
 * 流式转发/302，用的是 /sdcard/TVBox/quark_cookie.txt（配置中心）那份 cookie。
 * 服务端拦的是"脚本直连 CDN 的请求模式"，app 内 okhttp 转发不受影响 —— 趣盘一直能播的原因。
 * drpy 规则侧只需拼出这个代理 URL（parse:0），无需 TV 扫码、无需自己转存。
 * 通道判定：探测 127.0.0.1:9978 是否存在（手机端 FongMi 系才有；zyfun 无此服务自动跳过）
 */
rule.qkProxyProbe = function () {
    try {
        var now = rule.wpNow();
        var c = rule._qkProxyCache;
        if (c && now - c.t < 300000) { return c.ok; }   // 5 分钟内不重探
        var raw = '';
        try {
            raw = request('http://127.0.0.1:9978/proxy?do=ck', { timeout: 2500, withHeaders: false });
        } catch (e) { raw = ''; }
        // jar 的 Proxy.adjustLocalPort 就是这么探的：do=ck 回 "ok" 即本地服务在
        // ⚠️ 引擎 request() 对错误响应可能抛异常也可能返回空串——两者都当作"服务不在"
        var txt = String(raw || '').replace(/^\s+|\s+$/g, '');
        var ok = txt === 'ok' || txt.toLowerCase() === 'ok';
        rule._qkProxyCache = { t: now, ok: ok };
        return ok;
    } catch (e) {
        rule._qkProxyCache = { t: rule.wpNow(), ok: false };
        return false;
    }
};
// 播放通道决策：true = 手机端本地代理可用（走 do=pan 代理，复用配置中心 cookie）
rule.qkProxyMode = function () {
    return rule.qkProxyProbe();
};
// 拼本地代理播放 URL（参数语义与 jar 的 Fa.a 完全一致）
rule.qkProxyUrl = function (pwdId, fid, fidToken) {
    return 'http://127.0.0.1:9978/proxy?do=pan&site=quark'
        + '&shareId=' + encodeURIComponent(pwdId)
        + '&fileId=' + encodeURIComponent(fid)
        + '&fileToken=' + encodeURIComponent(fidToken || '');
};

/* ===== QuarkTV 通道（2026-09-13 新增，播放直链的救星） =====
 * 背景：2026-02-12 起夸克 CDN 风控——PC cookie（__pus/__puus）通过 v2/play / file/download
 * 拿到的直链，播放器直连一律被 Tengine 拦截（412 Precondition Failed / 403），任何头组合都救不了
 * （SmartStrm#57 / OpenList#2115 全社区同病）。唯一出路是 TV 端令牌（OpenList QuarkTV 驱动同款链路）：
 *   ① GET open-api-drive.quark.cn/oauth/authorize?auth_type=code&client_id&scope=netdisk&qrcode=1 → qr_data(base64二维码) + query_token
 *   ② 手机夸克App扫码确认 → GET /oauth/code?client_id&query_token → code
 *   ③ POST api.extscreen.com/quarkdrive/token {code, device_id, ...} → refresh_token + access_token（extscreen 第三方签名服务，公共基础设施）
 *   ④ GET open-api-drive.quark.cn/file?method=streaming&fid= → video_info[].url（TV 令牌签发，302 直链可直连播放）
 * 签名：x-pan-token = sha256(method&pathname&timestamp&signKey)；req_id = md5(deviceId+timestamp)；头 x-pan-tm/x-pan-token/x-pan-client-id
 * 分工：转存仍走 PC cookie（save 接口无风控），播放直链优先走 TV 令牌
 */
rule.QT_REFRESH_KEY = 'wp_qtv_refresh';
rule.QT_ACCESS_KEY = 'wp_qtv_access';
rule.QT_DEVICE_KEY = 'wp_qtv_device';
rule.QT_QUERY_KEY = 'wp_qtv_query';
rule.QT_NICK_KEY = 'wp_qtv_nick';
rule.qtConf = {
    api: 'https://open-api-drive.quark.cn',
    clientID: 'd3194e61504e493eb6222857bccfed94',
    signKey: 'kw2dvtd7p4t3pjl2d9ed9yc8yej8kw2d',
    appVer: '1.8.2.2',
    channel: 'GENERAL',
    codeApi: 'http://api.extscreen.com/quarkdrive',
    ua: 'Mozilla/5.0 (Linux; U; Android 13; zh-cn; M2004J7AC Build/UKQ1.231108.001) AppleWebKit/533.1 (KHTML, like Gecko) Mobile Safari/533.1'
};
// TV 签名（引擎 CryptoJS 是裁剪版只有 MD5 无 SHA256，sha256 自实现；md5 优先引擎全局函数）
// 纯 JS SHA-256（hex 输出，UTF-8 输入）
rule.qtSha256 = function (msg) {
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    // UTF-8 编码
    var bytes = [];
    try {
        var enc = unescape(encodeURIComponent(String(msg)));
        for (var i = 0; i < enc.length; i++) { bytes.push(enc.charCodeAt(i) & 0xff); }
    } catch (e) {
        var s2 = String(msg);
        for (var i2 = 0; i2 < s2.length; i2++) { bytes.push(s2.charCodeAt(i2) & 0xff); }
    }
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) { bytes.push(0); }
    // 64 位长度拆高低位
    var hi = Math.floor(bitLen / 4294967296);
    bytes.push((hi >>> 24) & 0xff, (hi >>> 16) & 0xff, (hi >>> 8) & 0xff, hi & 0xff);
    bytes.push((bitLen >>> 24) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 8) & 0xff, bitLen & 0xff);
    var w = new Array(64);
    for (var b = 0; b < bytes.length; b += 64) {
        for (var t = 0; t < 16; t++) {
            w[t] = (bytes[b + t * 4] << 24) | (bytes[b + t * 4 + 1] << 16) | (bytes[b + t * 4 + 2] << 8) | bytes[b + t * 4 + 3];
        }
        for (var t2 = 16; t2 < 64; t2++) {
            var s0 = rotr(w[t2 - 15], 7) ^ rotr(w[t2 - 15], 18) ^ (w[t2 - 15] >>> 3);
            var s1 = rotr(w[t2 - 2], 17) ^ rotr(w[t2 - 2], 19) ^ (w[t2 - 2] >>> 10);
            w[t2] = (w[t2 - 16] + s0 + w[t2 - 7] + s1) | 0;
        }
        var a = H[0], c = H[1], d = H[2], e = H[3], f = H[4], g = H[5], h2 = H[6], hh = H[7];
        for (var t3 = 0; t3 < 64; t3++) {
            var S1 = rotr(f, 6) ^ rotr(f, 11) ^ rotr(f, 25);
            var ch = (f & g) ^ (~f & h2);
            var temp1 = (hh + S1 + ch + K[t3] + w[t3]) | 0;
            var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            var maj = (a & c) ^ (a & d) ^ (c & d);
            var temp2 = (S0 + maj) | 0;
            hh = h2; h2 = g; g = f; f = (e + temp1) | 0;
            e = d; d = c; c = a; a = (temp1 + temp2) | 0;
        }
        H[0] = (H[0] + a) | 0; H[1] = (H[1] + c) | 0; H[2] = (H[2] + d) | 0; H[3] = (H[3] + e) | 0;
        H[4] = (H[4] + f) | 0; H[5] = (H[5] + g) | 0; H[6] = (H[6] + h2) | 0; H[7] = (H[7] + hh) | 0;
    }
    var out = '';
    for (var o = 0; o < 8; o++) {
        var hex = (H[o] >>> 0).toString(16);
        while (hex.length < 8) { hex = '0' + hex; }
        out += hex;
    }
    return out;
};
// md5：直接用引擎全局 md5（drpy2 内置 CryptoJS.MD5，zyfun/手机端同源引擎都有）
rule.qtMd5 = function (s) {
    if (typeof md5 === 'function') { return md5(String(s)); }
    throw new Error('engine md5 unavailable');
};

// TV 签名三元组：{tm, token, reqID}（x-pan-token=sha256(method&path&tm&signKey)，req_id=md5(device+tm)）
rule.qtSign = function (method, pathname) {
    var tm = String(rule.wpNow());
    var device = rule.qtDeviceId();
    return {
        tm: tm,
        token: rule.qtSha256(method + '&' + pathname + '&' + tm + '&' + rule.qtConf.signKey),
        reqID: rule.qtMd5(device + tm)
    };
};

// TV 设备 id（首次生成后持久化）
rule.qtDeviceId = function () {
    var d = '';
    try { d = getItem(rule.QT_DEVICE_KEY, '') || ''; } catch (e) { d = ''; }
    if (!d) {
        d = rule.qtMd5(String(rule.wpNow()) + Math.random());
        try { setItem(rule.QT_DEVICE_KEY, d); } catch (e) { }
    }
    return d;
};

// TV 请求通用 query（OpenList 同款公参；{REQ} 占位替换 req_id）
rule.qtCommonQs = function (access) {
    return 'req_id={REQ}&access_token=' + encodeURIComponent(access || '')
        + '&app_ver=' + rule.qtConf.appVer + '&device_id=' + encodeURIComponent(rule.qtDeviceId())
        + '&device_brand=Xiaomi&platform=tv&device_name=M2004J7AC&device_model=M2004J7AC'
        + '&build_device=M2004J7AC&build_product=M2004J7AC&device_gpu=' + encodeURIComponent('Adreno (TM) 550')
        + '&activity_rect=' + encodeURIComponent('{}') + '&channel=' + rule.qtConf.channel;
};

// TV 登录态：refresh_token 存在即视为已登录
rule.qtLoginState = function () {
    try { return !!(getItem(rule.QT_REFRESH_KEY, '') || ''); } catch (e) { return false; }
};

// TV 换 token 的公参 body（OpenList getRefreshTokenByTV 同款）
rule.qtTokenBody = function () {
    var s = rule.qtSign('POST', '/token');
    return {
        req_id: s.reqID,
        app_ver: rule.qtConf.appVer,
        device_id: rule.qtDeviceId(),
        device_brand: 'Xiaomi',
        platform: 'tv',
        device_name: 'M2004J7AC',
        device_model: 'M2004J7AC',
        build_device: 'M2004J7AC',
        build_product: 'M2004J7AC',
        device_gpu: 'Adreno (TM) 550',
        activity_rect: '{}',
        channel: rule.qtConf.channel
    };
};

// TV 取 access_token：有就直接用，没有用 refresh_token 换（extscreen）
rule.qtAccessToken = function (forceRefresh) {
    var access = '';
    if (!forceRefresh) {
        try { access = getItem(rule.QT_ACCESS_KEY, '') || ''; } catch (e) { access = ''; }
        if (access) { return access; }
    }
    var refresh = '';
    try { refresh = getItem(rule.QT_REFRESH_KEY, '') || ''; } catch (e) { refresh = ''; }
    if (!refresh) { return ''; }
    var body = rule.qtTokenBody();
    body.refresh_token = refresh;
    var raw = request(rule.qtConf.codeApi + '/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': rule.qtConf.ua },
        body: JSON.stringify(body),
        timeout: 10000
    });
    var obj = null;
    try { obj = JSON.parse(raw); } catch (e) { obj = null; }
    if (!obj || obj.code !== 200 || !(obj.data && obj.data.access_token)) { return ''; }
    try { setItem(rule.QT_ACCESS_KEY, String(obj.data.access_token || '')); } catch (e) { }
    if (obj.data.refresh_token) {
        try { setItem(rule.QT_REFRESH_KEY, String(obj.data.refresh_token)); } catch (e) { }
    }
    return String(obj.data.access_token);
};

// TV API 请求（带签名 + token 失效自动刷新重试一次）
rule.qtRequest = function (pathname, method, extraQs, bodyObj, isRetry) {
    var access = rule.qtAccessToken();
    var s = rule.qtSign(method, pathname);
    var qs = rule.qtCommonQs(access).replace('{REQ}', s.reqID);
    if (extraQs) { qs += '&' + extraQs; }
    var opt = {
        method: method,
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': rule.qtConf.ua,
            'x-pan-tm': s.tm,
            'x-pan-token': s.token,
            'x-pan-client-id': rule.qtConf.clientID
        },
        timeout: 15000
    };
    if (bodyObj) {
        opt.headers['Content-Type'] = 'application/json';
        opt.body = JSON.stringify(bodyObj);
    }
    var raw = request(rule.qtConf.api + pathname + '?' + qs, opt);
    var obj = null;
    try { obj = JSON.parse(raw); } catch (e) { obj = null; }
    // token 失效（errno 10001/11001 或提示文案）→ 清 access 用 refresh 重换再试一轮
    var errInfo = String((obj && obj.error_info) || '').toLowerCase();
    if (obj && ((obj.status === -1 && (obj.errno === 10001 || obj.errno === 11001))
        || (errInfo && (errInfo.indexOf('access token') >= 0 || errInfo.indexOf('token无效') >= 0 || errInfo.indexOf('token 无效') >= 0)))) {
        if (!isRetry) {
            try { setItem(rule.QT_ACCESS_KEY, ''); } catch (e) { }
            return rule.qtRequest(pathname, method, extraQs, bodyObj, true);
        }
    }
    return obj;
};

// TV 登录第一步：拿二维码（qr_data base64 PNG + query_token）
rule.qtLoginQr = function () {
    var obj = rule.qtRequest('/oauth/authorize', 'GET',
        'auth_type=code&client_id=' + rule.qtConf.clientID + '&scope=netdisk&qrcode=1&qr_width=460&qr_height=460', null);
    if (!obj || !obj.qr_data) { return null; }
    try { setItem(rule.QT_QUERY_KEY, String(obj.query_token || '')); } catch (e) { }
    return obj;
};

// TV 登录第二步：轮询 code（用户扫码确认前会返回错误）
rule.qtLoginCode = function () {
    var q = '';
    try { q = getItem(rule.QT_QUERY_KEY, '') || ''; } catch (e) { q = ''; }
    if (!q) { return null; }
    return rule.qtRequest('/oauth/code', 'GET',
        'client_id=' + rule.qtConf.clientID + '&scope=netdisk&query_token=' + encodeURIComponent(q), null);
};

// TV 登录第三步：code 换 refresh_token + access_token（extscreen）
rule.qtLoginExchange = function (code) {
    var body = rule.qtTokenBody();
    body.code = code;
    var raw = request(rule.qtConf.codeApi + '/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': rule.qtConf.ua },
        body: JSON.stringify(body),
        timeout: 10000
    });
    var obj = null;
    try { obj = JSON.parse(raw); } catch (e) { obj = null; }
    if (!obj || obj.code !== 200 || !(obj.data && obj.data.refresh_token && obj.data.access_token)) { return false; }
    try {
        setItem(rule.QT_REFRESH_KEY, String(obj.data.refresh_token));
        setItem(rule.QT_ACCESS_KEY, String(obj.data.access_token));
        if (obj.data.nick_name) { setItem(rule.QT_NICK_KEY, String(obj.data.nick_name)); }
    } catch (e) { }
    return true;
};

// TV 播放直链：file?method=streaming → video_info[].url（TV 令牌签发，绕过 CDN 对 PC 直链的 412 风控）
rule.qtStreamingUrl = function (fid) {
    var obj = rule.qtRequest('/file', 'GET',
        'method=streaming&group_by=source&fid=' + encodeURIComponent(fid)
        + '&resolution=' + encodeURIComponent('low,normal,high,super,2k,4k')
        + '&support=' + encodeURIComponent('dolby_vision'), null);
    if (!obj || !obj.data || !obj.data.video_info) { return ''; }
    var vi = obj.data.video_info || [];
    for (var i = 0; i < vi.length; i++) {
        var u = String((vi[i] && vi[i].url) || '');
        if (u) { return u; }
    }
    return '';
};

// 夸克 API 通用参数（逆向 jar 与开源实现一致）
rule.qkParam = function () {
    return 'pr=ucpro&fr=pc&uc_param_str=&__dt=' + (rule.wpNow() % 1000) + '&__t=' + rule.wpNow();
};
// 夸克 API 请求头（必须带登录 cookie + Referer）
rule.qkHeaders = function (ck) {
    var h = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'Referer': 'https://pan.quark.cn/',
        'Origin': 'https://pan.quark.cn'
    };
    if (ck) { h['Cookie'] = ck; }
    return h;
};

// 登录态 cookie 的取值顺序：
//   ① 引擎存储（本源自己扫码存的） ② 内存 ③ 配置中心共享文件（仅手机端 TVBox 有）
// ④ 配置中心文件在会话内缓存（探端口别每次都做）；"退出登录"后置 ignore 标记跳过 ③
rule.qkCookie = function (forceFile) {
    var ck = '';
    try { ck = getItem(rule.QUARK_CK_KEY, '') || ''; } catch (e) { ck = ''; }
    if (!ck) { ck = rule._qkCk || ''; }
    if (!ck && !(rule._qkIgnoreCfg || false)) {
        ck = rule.qkCfgCenterCookie(forceFile);
    }
    return ck;
};
rule.qkSetCookie = function (ck) {
    rule._qkCk = ck;
    try { setItem(rule.QUARK_CK_KEY, ck); } catch (e) { }
};
// 已登录？（有 cookie 即视为已登录；失效会在播放时报错并自动清掉）
rule.wpQuarkLoginState = function () {
    return !!rule.qkCookie();
};
// 登录态来源（列表/管理页显示用）：'own'=本源扫码，'cfg'=配置中心共享，''=未登录
rule.qkLoginSource = function () {
    var ck = '';
    try { ck = getItem(rule.QUARK_CK_KEY, '') || ''; } catch (e) { ck = ''; }
    if (ck) { return 'own'; }
    if (rule._qkCk) { return 'own'; }
    if (!(rule._qkIgnoreCfg || false) && rule.qkCfgCenterCookie(false)) { return 'cfg'; }
    return '';
};

/* ---------- 配置中心 Cookie 共享（手机端 TVBox 专用） ----------
 * csp_Config（配置中心 Java spider）扫码登录后把 cookie 写到
 * /sdcard/TVBox/quark_cookie.txt；FongMi 系端上自带本地服务
 * http://127.0.0.1:9978/file/ 映射 /sdcard/，规则 request() 即可读（无需权限）。
 * zyfun / 无本地服务的端：请求快速失败，自动跳过，不影响任何原有行为。
 */
rule.qkCfgFile = 'http://127.0.0.1:9978/file/TVBox/quark_cookie.txt';
// 会话内探测缓存：{ t: 时间, ck: cookie } —— 成功 10 分钟 / 失败 60 秒内不再探
rule.qkCfgTtl = 600000;
rule.qkCfgFailTtl = 60000;
rule.qkCfgCenterCookie = function (force) {
    try {
        var now = rule.wpNow();
        var c = rule._qkCfgCache;
        if (!force && c) {
            var ttl = c.ck ? rule.qkCfgTtl : rule.qkCfgFailTtl;
            if (now - c.t < ttl) { return c.ck || ''; }
        }
        var raw = request(rule.qkCfgFile, { timeout: 3000, withHeaders: false });
        var ck = '';
        var obj = null;
        try { obj = JSON.parse(raw); } catch (e) { obj = null; }
        // 文件格式：{"nickname":"x","member_type":"SUPER_VIP","cookie":"__pus=...;"}
        if (obj && obj.cookie) {
            ck = String(obj.cookie).trim();
            // 只要 __pus/__puus（与自扫码保持同构，跟踪 cookie 不带）
            var keep = [];
            var m1 = ck.match(/__pus=[^;]+/);
            var m2 = ck.match(/__puus=[^;]+/);
            if (m1) { keep.push(m1[0]); }
            if (m2) { keep.push(m2[0]); }
            ck = keep.join('; ');
            // 配置中心文件自带昵称，顺手记下（管理页显示用）
            if (obj.nickname) {
                rule._qkNick = String(obj.nickname);
                try { setItem(rule.QUARK_NICK_KEY, rule._qkNick); } catch (e2) { }
            }
        }
        rule._qkCfgCache = { t: now, ck: ck };
        return ck;
    } catch (e) {
        rule._qkCfgCache = { t: rule.wpNow(), ck: '' };
        return '';
    }
};

/* ---------- 登录流程 ---------- */

// 生成新二维码：返回 {token, qrUrl}（qrUrl 是要编码进二维码的内容）
rule.qkQrNew = function () {
    var raw = request('https://uop.quark.cn/cas/ajax/getTokenForQrcodeLogin?client_id=532&v=1.2', {
        method: 'POST',
        headers: rule.qkHeaders(),
        withHeaders: false,
        timeout: 10000
    });
    var obj = null;
    try { obj = JSON.parse(raw); } catch (e) { obj = null; }
    if (!obj || obj.status !== 2000000 || !obj.data || !obj.data.members) { return null; }
    var token = String(obj.data.members.token || '');
    if (!token) { return null; }
    return { token: token, qrUrl: 'https://su.quark.cn/4_eMHBJ?token=' + token };
};

// 轮询扫码状态：未扫/已扫待确认返回 null，确认成功写 cookie 返回 true，失败/过期返回 'expired'
rule.qkQrPoll = function (token) {
    var raw = request('https://uop.quark.cn/cas/ajax/getServiceTicketByQrcodeToken?client_id=532&v=1.2&token=' + encodeURIComponent(token), {
        headers: rule.qkHeaders(),
        timeout: 8000
    });
    var obj = null;
    try { obj = JSON.parse(raw); } catch (e) { obj = null; }
    if (!obj) { return null; }
    if (obj.status === 50004001 || obj.status === 50004002) { return null; } // 未扫 / 已扫未确认
    if (obj.status === 2000000) {
        var st = obj.data && obj.data.members && obj.data.members.service_ticket;
        if (!st) { return null; }
        // st 换正式登录 cookie：account/info 的响应头里 Set-Cookie 就是登录态
        var hraw = request('https://pan.quark.cn/account/info?fr=pc&platform=pc&st=' + encodeURIComponent(st), {
            headers: rule.qkHeaders(),
            withHeaders: true,
            timeout: 10000
        });
        var hj = null;
        try { hj = JSON.parse(hraw); } catch (e) { hj = null; }
        if (hj) {
            var setCk = '';
            for (var k in hj) {
                if (Object.prototype.hasOwnProperty.call(hj, k) && k.toLowerCase() === 'set-cookie') {
                    var v = hj[k];
                    setCk = Array.isArray(v) ? v.join('#@@#') : String(v);
                }
            }
            // 取出 __pus / __puus 两条关键 cookie（登录态本体），别的跟踪 cookie 不要
            var ck = '';
            var m1 = setCk.match(/__pus=[^;#]+/);
            var m2 = setCk.match(/__puus=[^;#]+/);
            if (m1) { ck += m1[0]; }
            if (m2) { ck += (ck ? '; ' : '') + m2[0]; }
            if (ck) {
                rule.qkSetCookie(ck);
                // account/info 的 body 里有昵称，顺手存下来（管理页显示用）
                try {
                    var bobj = JSON.parse(hj.body);
                    if (bobj && bobj.data && bobj.data.nickname) {
                        rule._qkNick = String(bobj.data.nickname);
                        try { setItem(rule.QUARK_NICK_KEY, rule._qkNick); } catch (e2) { }
                    }
                } catch (e2) { }
                return true;
            }
        }
        return 'expired';
    }
    return 'expired'; // 50004003 二维码已失效等
};

// 一级「扫码登录」分类的列表
rule.wpLoginList = function (page) {
    if (String(page).replace(/[^0-9]/g, '') !== '1') { return []; }
    var list = [];
    var pcOk = rule.wpQuarkLoginState();
    var tvOk = rule.qtLoginState();
    var proxyOk = rule.qkProxyMode();   // 手机端本地代理在（9978）：播放走它 + 配置中心 cookie
    // 手机端：有本地代理时播放不需要 TV 码（只看转存登录）
    if (proxyOk && pcOk) {
        var srcP = rule.qkLoginSource();
        var srcNameP = srcP === 'cfg' ? '配置中心共享' : (srcP === 'own' ? '本源扫码' : '已登录');
        return [{
            vod_id: 'http://wp/login/status',
            vod_name: '夸克已就绪 · 点击管理',
            vod_pic: '',
            vod_remarks: '转存:' + srcNameP + ' | 播放:本地代理',
            vod_blurb: '转存登录（' + srcNameP + '）+ 播放通道（手机端本地代理）都已就绪，夸克资源点开即播'
        }];
    }
    // 两通道都就绪 → 只显示管理卡
    if (pcOk && tvOk) {
        var src = rule.qkLoginSource();
        var srcName = src === 'cfg' ? '配置中心共享' : (src === 'own' ? '本源扫码' : '已登录');
        return [{
            vod_id: 'http://wp/login/status',
            vod_name: '夸克已就绪 · 点击管理',
            vod_pic: '',
            vod_remarks: '转存:' + srcName + ' | 播放:TV直链',
            vod_blurb: '转存登录（' + srcName + '）+ 播放通道（TV直链）都已就绪，夸克资源点开即播'
        }];
    }
    // 转存登录（PC cookie）：未登录时显示二维码卡
    if (!pcOk) {
        var qr = rule.qkQrNew();
        if (!qr) {
            list.push({
                vod_id: 'http://wp/login/err',
                vod_name: '【1/2 转存登录】获取二维码失败，点此重试',
                vod_pic: '',
                vod_remarks: '点击刷新',
                vod_blurb: '连接夸克登录服务失败，点击重试'
            });
        } else {
            rule._qkToken = qr.token;
            list.push({
                vod_id: 'http://wp/login/qr',
                vod_name: '【1/2 转存登录】用【夸克App】扫码',
                vod_pic: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(qr.qrUrl),
                vod_remarks: '扫码后回来点这张卡',
                vod_blurb: '第一步（转存）：手机夸克 App → 首页右上角扫一扫 → 对准二维码 → 确认登录'
            });
        }
    }
    // 播放登录（TV 令牌）：手机端有本地代理就不需要（上面已提前返回）；
    // zyfun 等无本地代理的端，2026-02 起夸克风控 PC 直链，播放走 TV 通道
    if (!tvOk) {
        // TV 二维码：open-api 直接返回 base64 PNG，没法直接当 vod_pic 用 URL 展示 —— 存会话内，二级里用 dataURI
        var tvQr = rule.qtLoginQr();
        if (!tvQr || !tvQr.qr_data) {
            list.push({
                vod_id: 'http://wp/login/tvfail',
                vod_name: '【2/2 播放通道】获取二维码失败，点此重试',
                vod_pic: '',
                vod_remarks: '点击刷新',
                vod_blurb: '连接夸克TV授权服务失败（open-api-drive.quark.cn），点击重试'
            });
        } else {
            rule._qtQrImg = 'data:image/jpeg;base64,' + tvQr.qr_data;
            list.push({
                vod_id: 'http://wp/login/tvqr',
                vod_name: '【2/2 播放通道】用【夸克App】再扫一次',
                vod_pic: rule._qtQrImg,
                vod_remarks: '不扫这个播不了！',
                vod_blurb: '第二步（播放）：2026-02 起夸克封了普通直链，播放必须 TV 通道授权。手机夸克 App 扫码 → 确认'
            });
        }
    }
    // 至少有一个通道未就绪时附带管理卡（看状态/重新扫码入口）
    if (pcOk && !tvOk) {
        list.unshift({
            vod_id: 'http://wp/login/status',
            vod_name: '转存登录已完成 · 播放通道待扫码',
            vod_pic: '',
            vod_remarks: '看下面第二张卡',
            vod_blurb: '转存 OK，但播放通道还没授权——2026-02 起夸克封了 PC 直链，必须扫下方 TV 码才能真正播放'
        });
    }
    if (!pcOk && tvOk) {
        list.unshift({
            vod_id: 'http://wp/login/status',
            vod_name: '播放通道已就绪 · 转存登录待扫码',
            vod_pic: '',
            vod_remarks: '看下面第一张卡',
            vod_blurb: 'TV 播放通道 OK，但转存登录还没完成——没它无法把网盘分享转进你的盘'
        });
    }
    return list;
};

// 登录流程的二级
rule.wpLoginDetail = function (id) {
    if (id === 'http://wp/login/status') {
        // 管理页：确认 cookie 有效性 + TV 通道状态 + 退出登录入口
        var vod = {
            vod_id: id,
            vod_name: '夸克登录管理',
            vod_pic: '',
            type_name: '功能',
            vod_content: '',
            vod_play_from: '操作',
            vod_play_url: ''
        };
        // 用 member 接口验证 cookie 是否还有效
        var ck = rule.qkCookie();
        var src = rule.qkLoginSource();
        var raw = request('https://drive-pc.quark.cn/1/clouddrive/member?pr=ucpro&fr=pc&uc_param_str=&fetch_subscribe=true&_ch=home&fetch_identity=true', {
            headers: rule.qkHeaders(ck),
            timeout: 10000
        });
        var obj = null;
        try { obj = JSON.parse(raw); } catch (e) { obj = null; }
        // member 接口 data 结构（实测 2026-09-13）：cookie 有效 → data 直接含 member_type 等
        // （无 member 子对象；无效 → 无 data 或 status 非 200）
        var memberOk = !!(obj && rule.qkOk(obj) && obj.data && (obj.data.member || obj.data.member_type));
        var tvOk = rule.qtLoginState();
        var lines = [];
        if (memberOk) {
            // 显示名优先级：自扫码/配置中心存过昵称 > member 接口 > 泛称
            var nick = '';
            try { nick = getItem(rule.QUARK_NICK_KEY, '') || ''; } catch (e) { nick = ''; }
            if (!nick) { nick = rule._qkNick || ''; }
            if (!nick) { nick = '已登录'; }
            var mt = (obj.data.member && obj.data.member.member_type) || obj.data.member_type || '';
            var vipTxt = mt === 'SUPER_VIP' ? '超级会员' : (/VIP/.test(String(mt)) ? '会员' : '普通用户');
            lines.push('✅ 转存登录：' + nick + '（' + vipTxt + '）'
                + '\n   来源：' + (src === 'cfg' ? '配置中心共享（在「配置中心」源里也能看到这份登录）' : (src === 'own' ? '本源扫码' : '未知')));
            vod.vod_play_url = '退出登录$qqklogout';
            if (src === 'cfg' || !src) {
                vod.vod_play_url = '重新检测配置中心登录$qkredetect#退出登录$qqklogout';
            }
        } else {
            lines.push('❌ 转存登录：已失效（cookie 过期）'
                + '\n   ① 在「配置中心」源里登录过夸克的话，点「重新检测」直接共享它的登录态；\n   ② 或回列表重新扫码');
            vod.vod_play_url = '重新检测配置中心登录$qkredetect#清除失效登录$qqklogout';
        }
        lines.push('');
        var proxyOk2 = rule.qkProxyMode();
        if (proxyOk2) {
            lines.push('✅ 播放通道：手机端本地代理（127.0.0.1:9978）已就绪\n   播放由端上 spider 完成（转存+取直链+流式转发一体），共用上面的转存登录，无需额外授权');
        } else if (tvOk) {
            lines.push('✅ 播放通道：TV 直链已授权（2026-02 起夸克封禁普通直链，播放走此通道）');
            vod.vod_play_url += '#退出TV登录$qtvlogout';
        } else {
            lines.push('❌ 播放通道：未授权 —— 本端无 9978 本地服务，2026-02 起夸克封禁普通直链（412）\n   手机TVBox：在「配置中心」源扫码登录夸克即可（自动共用）；电脑zyfun：回列表扫第二张TV码');
        }
        lines.push('\n说明：「退出登录」仅停用本源（不影响趣盘等其它源）；配置中心重新扫码后点「重新检测」即可恢复。');
        vod.vod_content = lines.join('\n');
        vod.vod_blurb = vod.vod_content.substring(0, 100);
        return vod;
    }
    // TV 扫码卡片：轮询 code
    if (id === 'http://wp/login/tvqr') {
        var codeObj = rule.qtLoginCode();
        if (codeObj && codeObj.code) {
            var ok = rule.qtLoginExchange(codeObj.code);
            if (ok) {
                return {
                    vod_id: id,
                    vod_name: 'TV播放通道授权成功',
                    vod_pic: '',
                    type_name: '功能',
                    vod_content: '✅ 播放通道已就绪！\n\n现在点夸克资源可以直接播放了（TV 直链不受 2026-02 风控影响）。',
                    vod_blurb: 'TV 播放通道授权成功',
                    vod_play_from: '提示',
                    vod_play_url: '返回开始使用$qhttp://wp/login/tvqr'
                };
            }
            return {
                vod_id: id,
                vod_name: '授权失败',
                vod_pic: '',
                type_name: '功能',
                vod_content: '换 token 失败（extscreen 签名服务异常）。\n按返回键回到列表重新扫码重试。',
                vod_blurb: 'TV 授权换token失败',
                vod_play_from: '提示',
                vod_play_url: '返回重试$qhttp://wp/login/tvqr'
            };
        }
        // 未确认：看错误文案判断是否过期
        var einfo = String((codeObj && codeObj.error_info) || '');
        if (codeObj && (codeObj.status === -1) && /过期|expire/i.test(einfo)) {
            return {
                vod_id: id,
                vod_name: 'TV二维码已过期',
                vod_pic: '',
                type_name: '功能',
                vod_content: 'TV 授权二维码超时（有效期很短，需扫后快速确认）。\n按返回键回到列表重新进入，会生成新码。',
                vod_blurb: 'TV 二维码超时',
                vod_play_from: '提示',
                vod_play_url: '返回重新生成$qhttp://wp/login/tvqr'
            };
        }
        return {
            vod_id: id,
            vod_name: '等待TV扫码确认中',
            vod_pic: rule._qtQrImg || '',
            type_name: '功能',
            vod_content: '未检测到 TV 授权扫码。\n\n操作：打开手机夸克 App → 首页右上角「+」→ 扫一扫 → 对准列表页第二张二维码 → 确认。\n\n手机确认后，回到这里重新点这张卡片即可完成授权。',
            vod_blurb: '等待手机确认 TV 授权',
            vod_play_from: '提示',
            vod_play_url: '点我重新检测$qhttp://wp/login/tvqr'
        };
    }
    if (id === 'http://wp/login/tvfail') {
        return {
            vod_id: id,
            vod_name: 'TV授权服务连接失败',
            vod_pic: '',
            type_name: '功能',
            vod_content: '连接 open-api-drive.quark.cn 失败。\n按返回键回到列表刷新，会自动重试。',
            vod_blurb: 'TV 授权服务连接失败',
            vod_play_from: '提示',
            vod_play_url: '返回刷新$qhttp://wp/login/tvfail'
        };
    }
    if (id === 'http://wp/login/err') {
        // 获取失败 → 引导回一级列表重新拉二维码（一级列表本身就会重试）
        return {
            vod_id: id,
            vod_name: '获取二维码失败',
            vod_pic: '',
            type_name: '功能',
            vod_content: '连接夸克登录服务失败。\n按返回键回到列表刷新，会自动重新生成二维码。',
            vod_blurb: '连接夸克登录服务失败',
            vod_play_from: '提示',
            vod_play_url: '返回刷新$qhttp://wp/login/err'
        };
    }
    // 二维码卡片：轮询扫码状态
    if (!rule._qkToken) {
        return {
            vod_id: id,
            vod_name: '二维码已过期',
            vod_pic: '',
            type_name: '功能',
            vod_content: '二维码已过期或本会话未生成。\n按返回键回到列表，重新进入「扫码登录」分类即可重新生成。',
            vod_blurb: '二维码已过期',
            vod_play_from: '提示',
            vod_play_url: '返回重新生成$qhttp://wp/login/qr'
        };
    }
    var st = rule.qkQrPoll(rule._qkToken);
    if (st === true) {
        var tvTip = rule.qtLoginState()
            ? '\n播放通道（TV授权）也已就绪，点开即播。'
            : '\n\n⚠️ 还差最后一步：回列表扫【第二张二维码】完成播放通道授权（2026-02 起夸克封禁普通直链，没这步播不了）。';
        return {
            vod_id: id,
            vod_name: '转存登录成功',
            vod_pic: '',
            type_name: '功能',
            vod_content: '✅ 转存登录成功！' + tvTip,
            vod_blurb: '转存登录成功',
            vod_play_from: '提示',
            vod_play_url: '返回继续$qhttp://wp/login/qr'
        };
    }
    if (st === 'expired') {
        rule._qkToken = '';
        return {
            vod_id: id,
            vod_name: '二维码已失效',
            vod_pic: '',
            type_name: '功能',
            vod_content: '二维码超时未确认。\n按返回键回到列表重新进入，会生成新二维码。',
            vod_blurb: '二维码超时',
            vod_play_from: '提示',
            vod_play_url: '返回重新生成$qhttp://wp/login/qr'
        };
    }
    // 还没扫/没确认：明确提示继续等
    return {
        vod_id: id,
        vod_name: '等待扫码确认中',
        vod_pic: '',
        type_name: '功能',
        vod_content: '未检测到扫码。\n\n操作：打开手机夸克 App → 首页右上角「+」→ 扫一扫 → 对准列表页那张二维码 → 手机上点「确认登录」。\n\n手机确认后，回到这里重新点这张卡片即可完成登录。',
        vod_blurb: '等待手机确认',
        vod_play_from: '提示',
        vod_play_url: '点我重新检测$qhttp://wp/login/qr'
    };
};

/* ---------- 转存直链（播放） ---------- */

// 分享链接 → {pwd_id, passcode}
rule.qkParseShare = function (u) {
    var m = String(u).match(/pan\.quark\.cn\/s\/([a-zA-Z0-9]+)(?:\?pwd=([a-zA-Z0-9]+))?/);
    if (!m) { return null; }
    return { pwd_id: m[1], passcode: m[2] || '' };
};

// 夸克 API 状态码判定：drive-pc 域实际返回 200（实测 2026-09-13），
// 开源项目里写的 2000000 是 uop 登录域格式——两种都认，稳妥
rule.qkOk = function (obj) {
    return !!(obj && (obj.status === 200 || obj.status === 2000000 || obj.status === 0));
};

// 分享 stoken（免登录接口）
rule.qkStoken = function (share) {
    var raw = request('https://drive-pc.quark.cn/1/clouddrive/share/sharepage/token?' + rule.qkParam(), {
        method: 'POST',
        headers: rule.qkHeaders(),
        body: JSON.stringify({ pwd_id: share.pwd_id, passcode: share.passcode }),
        timeout: 10000
    });
    var obj = null;
    try { obj = JSON.parse(raw); } catch (e) { obj = null; }
    if (rule.qkOk(obj) && obj.data && obj.data.stoken) { return obj.data.stoken; }
    return '';
};

// 分享文件列表（page 1 最多 50；分享根若是一个大文件夹则自动钻一层）
rule.qkShareDetail = function (share, stoken) {
    var base = 'https://drive-pc.quark.cn/1/clouddrive/share/sharepage/detail?';
    var qs = 'pr=ucpro&fr=pc&pwd_id=' + encodeURIComponent(share.pwd_id)
        + '&stoken=' + encodeURIComponent(stoken)
        + '&pdir_fid=0&_page=1&_size=50&_fetch_total=1&_fetch_banner=0&_fetch_share=1&_fetch_sub_dirs=0'
        + '&_sort=file_type:asc,file_name:asc';
    var raw = request(base + qs, { headers: rule.qkHeaders(), timeout: 12000 });
    var obj = null;
    try { obj = JSON.parse(raw); } catch (e) { obj = null; }
    var list = (rule.qkOk(obj) && obj.data && obj.data.list) ? obj.data.list : [];
    // 分享根就是一个文件夹（list 只有 1 项且是 dir）→ 钻进去拿真实文件
    if (list.length === 1 && list[0].dir) {
        var qs2 = 'pr=ucpro&fr=pc&pwd_id=' + encodeURIComponent(share.pwd_id)
            + '&stoken=' + encodeURIComponent(stoken)
            + '&pdir_fid=' + encodeURIComponent(list[0].fid) + '&_page=1&_size=100&_fetch_total=1&_fetch_banner=0&_fetch_share=1&_fetch_sub_dirs=0'
            + '&_sort=file_type:asc,file_name:asc';
        var raw2 = request(base + qs2, { headers: rule.qkHeaders(), timeout: 12000 });
        var obj2 = null;
        try { obj2 = JSON.parse(raw2); } catch (e) { obj2 = null; }
        var list2 = (rule.qkOk(obj2) && obj2.data && obj2.data.list) ? obj2.data.list : [];
        if (list2.length) { return list2; }
    }
    return list;
};

// 二级：把夸克/UC 分享变成「真实文件列表」线路
// 返回 '文件名$qk://{json}' 用 # 连接的串；失败/无文件返回 null（回退普通线路）
rule.wpQuarkDetailLine = function (links) {
    try {
        var ck = rule.qkCookie();
        if (!ck) { return null; }
        // 找第一个夸克分享（UC 链接 host 不同不能走夸克 API，只有 pan.quark.cn 的能直链化）
        var share = null;
        var shareUrl = '';
        for (var i = 0; i < links.length; i++) {
            var lk = links[i] || [];
            if (String(lk[0]) === 'quark' && /pan\.quark\.cn\/s\//.test(String(lk[1] || ''))) {
                share = rule.qkParseShare(lk[1]);
                if (share) { shareUrl = lk[1]; break; }
            }
        }
        if (!share) { return null; }
        var stoken = rule.qkStoken(share);
        if (!stoken) { return null; }
        var files = rule.qkShareDetail(share, stoken);
        if (!files.length) { return null; }
        // 只要视频文件（file_type 1=文件；视频按后缀过滤），跳过文件夹和海报图
        var eps = [];
        files.forEach(function (f) {
            var nm = String(f.file_name || '');
            var fid = String(f.fid || '');
            var ftok = String(f.share_fid_token || '');
            if (!fid || !ftok) { return; }
            if (!/\.(mp4|mkv|ts|avi|mov|flv|rmvb|wmv|iso|mpg|webm|m3u8)$/i.test(nm)) { return; }
            // 临时标记：pwd_id/stoken/fid/fid_token 全部带上，lazy 直接取用不重复请求
            var payload = { p: share.pwd_id, s: stoken, f: fid, t: ftok };
            eps.push(nm + '$qk://' + rule.b64e(JSON.stringify(payload)));
        });
        if (!eps.length) { return null; }
        return eps.join('#');
    } catch (e) { return null; }
};

// 清理转存临时目录（播放完删，不占用户网盘空间）
rule.qkCleanup = function (ck) {
    try {
        // 根目录里找 TVBox播放缓存 目录
        var raw = request('https://drive-pc.quark.cn/1/clouddrive/file/sort?' + rule.qkParam()
            + '&pdir_fid=0&_page=1&_size=50&_fetch_total=1&_fetch_sub_dirs=0&_sort=file_type:asc,updated_at:desc', {
            headers: rule.qkHeaders(ck),
            timeout: 10000
        });
        var obj = null;
        try { obj = JSON.parse(raw); } catch (e) { obj = null; }
        var list = (obj && obj.data && obj.data.list) || [];
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].file_name) === rule.qkTmpDir && list[i].dir) {
                request('https://drive-pc.quark.cn/1/clouddrive/file/delete?' + rule.qkParam(), {
                    method: 'POST',
                    headers: rule.qkHeaders(ck),
                    body: JSON.stringify({ action_type: 2, filelist: [list[i].fid], exclude_fids: [] }),
                    timeout: 10000
                });
            }
        }
    } catch (e) { }
};

// 播放：stoken → 找/建临时目录 → save → task 等完成 → v2/play 直链
// 完整流程失败时返回错误提示对象（不嗅探、不挂起）
// 登录失效时自动强刷配置中心 cookie 重试一轮（配置中心那边可能刚重新扫过码）
rule.wpQuarkPlay = function (b64payload) {
    // ★ 手机端本地代理通道（2026-09-13）：9978 在 → 全部播放逻辑由端上 jar 完成，
    // 规则侧只要拼代理 URL（连 stoken 都不用自己拿——jar 实时处理，无会话绑定问题）
    // cookie 校验仍做（配置中心 cookie 是 jar 转存的凭证；没有时引导先去配置中心扫码）
    if (rule.qkProxyMode()) {
        var ckp = '';
        try { ckp = rule.qkCookie(true) || ''; } catch (e) { ckp = ''; }
        if (!ckp) {
            return { parse: 0, url: '网盘搜索·夸克:未登录，请先在「配置中心」源扫码登录夸克（本源自动共用其登录）', js: '' };
        }
        try {
            var payp = JSON.parse(rule.b64d(String(b64payload)));
            if (!payp || !payp.f) { return { parse: 0, url: '网盘搜索·夸克:无效的播放参数', js: '' }; }
            return { parse: 0, url: rule.qkProxyUrl(payp.p, payp.f, payp.t || ''), js: '' };
        } catch (e) {
            return { parse: 0, url: '网盘搜索·夸克:播放参数解析失败', js: '' };
        }
    }
    // force=true：跳过会话缓存直接读配置中心文件（播放是低频操作，值得强刷一次）
    var ck = rule.qkCookie(true);
    if (!ck) { return { parse: 0, url: '网盘搜索·夸克:未登录，请进「扫码登录」分类重新扫码', js: '' }; }
    return rule.wpQuarkPlayInner(b64payload, ck, false);
};
rule.wpQuarkPlayInner = function (b64payload, ck, isRetry) {
    var fail = function (msg, needRelogin) {
        if (needRelogin) {
            try { setItem(rule.QUARK_CK_KEY, ''); } catch (e) { }
            rule._qkCk = '';
            // 配置中心缓存一并失效（cookie 可能被配置中心刷新过，下次强刷重读）
            rule._qkCfgCache = null;
        }
        return { parse: 0, url: '网盘搜索·夸克:' + msg, js: '' };
    };
    try {
        var pay = null;
        try { pay = JSON.parse(rule.b64d(String(b64payload))); } catch (e) { pay = null; }
        if (!pay || !pay.f) { return fail('无效的播放参数'); }
        var stoken = pay.s || rule.qkStoken({ pwd_id: pay.p, passcode: '' });
        if (!stoken) { return fail('分享已失效（stoken 获取失败）'); }

        // ⚠️ share_fid_token 跟 stoken 会话绑定（2026-09-13 实测）：
        // 二级页面当时取的 token，到 lazy 时配新 stoken 转存会报「转存文件token校验异常 41020」
        // —— 必须用【当前这次 stoken】重新 detail 拿新鲜 token；payload 里的 t 只是匹配不到时的兜底
        var saveToken = pay.t || '';
        var fidToken = '';
        try {
            var dqs = 'pr=ucpro&fr=pc&pwd_id=' + encodeURIComponent(pay.p)
                + '&stoken=' + encodeURIComponent(stoken)
                + '&pdir_fid=0&_page=1&_size=50&_fetch_total=1&_fetch_banner=0&_fetch_share=1&_fetch_sub_dirs=0'
                + '&_sort=file_type:asc,file_name:asc';
            var draw = request('https://drive-pc.quark.cn/1/clouddrive/share/sharepage/detail?' + dqs, {
                headers: rule.qkHeaders(),
                timeout: 12000
            });
            var dobj = null;
            try { dobj = JSON.parse(draw); } catch (e) { dobj = null; }
            var dlist = (rule.qkOk(dobj) && dobj.data && dobj.data.list) || [];
            // 分享根是大文件夹 → 钻一层（同 qkShareDetail 逻辑）
            if (dlist.length === 1 && dlist[0].dir) {
                var dqs2 = 'pr=ucpro&fr=pc&pwd_id=' + encodeURIComponent(pay.p)
                    + '&stoken=' + encodeURIComponent(stoken)
                    + '&pdir_fid=' + encodeURIComponent(dlist[0].fid) + '&_page=1&_size=100&_fetch_total=1&_fetch_banner=0&_fetch_share=1&_fetch_sub_dirs=0'
                    + '&_sort=file_type:asc,file_name:asc';
                var draw2 = request('https://drive-pc.quark.cn/1/clouddrive/share/sharepage/detail?' + dqs2, {
                    headers: rule.qkHeaders(),
                    timeout: 12000
                });
                var dobj2 = null;
                try { dobj2 = JSON.parse(draw2); } catch (e) { dobj2 = null; }
                var dlist2 = (rule.qkOk(dobj2) && dobj2.data && dobj2.data.list) || [];
                if (dlist2.length) { dlist = dlist2; }
            }
            for (var di = 0; di < dlist.length; di++) {
                if (String(dlist[di].fid) === String(pay.f)) { fidToken = String(dlist[di].share_fid_token || ''); break; }
            }
        } catch (e) { }
        if (fidToken) { saveToken = fidToken; }

        // ★ 手机端本地代理通道（2026-09-13）：9978 服务在（FongMi 系手机端）→ 直接把
        // do=pan 代理 URL 交给播放器，转存/直链全部由端上 jar 用配置中心 cookie 完成，
        // 不需要这边转存（省一轮 save/task 请求），也天然绕过 CDN 对脚本直连的风控
        if (rule.qkProxyMode()) {
            return {
                parse: 0,
                url: rule.qkProxyUrl(pay.p, pay.f, fidToken || saveToken),
                js: ''
            };
        }

        // 1) 找根目录下已有的临时目录 fid（没有就转存到根目录，播放完统一清理）
        var dirFid = '0';
        try {
            var sraw = request('https://drive-pc.quark.cn/1/clouddrive/file/sort?' + rule.qkParam()
                + '&pdir_fid=0&_page=1&_size=50&_fetch_total=1&_fetch_sub_dirs=0&_sort=file_type:asc,updated_at:desc', {
                headers: rule.qkHeaders(ck),
                timeout: 10000
            });
            var sobj = null;
            try { sobj = JSON.parse(sraw); } catch (e) { sobj = null; }
            if (sobj && !rule.qkOk(sobj) && (sobj.status === 401 || /login|auth/i.test(String(sobj.message || '')))) {
                // 登录失效 → 先强刷配置中心拿新 cookie 重试一轮，还不行才报重新扫码
                if (!isRetry && !(rule._qkIgnoreCfg || false)) {
                    // 旧 cookie 已被证明失效：清掉自有存储，让后续取值自然落到配置中心
                    try { setItem(rule.QUARK_CK_KEY, ''); } catch (e) { }
                    rule._qkCk = '';
                    var ck2 = rule.qkCfgCenterCookie(true);
                    if (ck2) { return rule.wpQuarkPlayInner(b64payload, ck2, true); }
                }
                return fail('登录已失效，请重新扫码（或在配置中心重新登录后，进「扫码登录」分类重新检测）', true);
            }
            var slist = (sobj && sobj.data && sobj.data.list) || [];
            for (var i = 0; i < slist.length; i++) {
                if (String(slist[i].file_name) === rule.qkTmpDir && slist[i].dir) { dirFid = String(slist[i].fid); break; }
            }
            // 目录不存在 → 创建（转存永远进「TVBox播放缓存」目录，失败遗留也能被 qkCleanup 整目录清掉）
            if (dirFid === '0') {
                try {
                    var mraw = request('https://drive-pc.quark.cn/1/clouddrive/file?' + rule.qkParam()
                        + '&namespace=0&pdir_fid=0&fetch_total=1', {
                        method: 'POST',
                        headers: rule.qkHeaders(ck),
                        body: JSON.stringify({ pdir_fid: '0', file_name: rule.qkTmpDir, dir_path: '', dir_init_lock: false }),
                        timeout: 10000
                    });
                    var mobj = null;
                    try { mobj = JSON.parse(mraw); } catch (e) { mobj = null; }
                    if (mobj && mobj.data && mobj.data.fid) { dirFid = String(mobj.data.fid); }
                } catch (e) { }
            }
        } catch (e) { }

        // 2) 转存
        var saveRaw = request('https://drive-pc.quark.cn/1/clouddrive/share/sharepage/save?' + rule.qkParam(), {
            method: 'POST',
            headers: rule.qkHeaders(ck),
            body: JSON.stringify({
                fid_list: [pay.f],
                fid_token_list: [saveToken],
                to_pdir_fid: dirFid,
                pwd_id: pay.p,
                stoken: stoken,
                pdir_fid: '0',
                scene: 'link'
            }),
            timeout: 15000
        });
        var saveObj = null;
        try { saveObj = JSON.parse(saveRaw); } catch (e) { saveObj = null; }
        if (!saveObj) { return fail('转存请求失败（网络）'); }
        if (!rule.qkOk(saveObj)) {
            // 常见错误：share expired / 文件已被转存（already）等
            return fail(String(saveObj.message || '转存失败'));
        }
        // 同步完成：task_resp 里直接有 save_as；异步：只回 task_id，要轮询 task 到 status=2 才有 fid
        // 实测（2026-09-13 真机复现）：save 只回 {task_id}，task 第 1 轮是 status:0 + save_as_top_fids:[]（空数组！）
        // —— 空数组是 truthy，必须同时校验 status===2 或数组非空，否则误判"已拿到"提前 break
        var savedFid = '';
        var sd = saveObj.data || {};
        if (sd.task_resp && sd.task_resp.data && sd.task_resp.data.save_as && sd.task_resp.data.save_as.save_as_top_fids
            && sd.task_resp.data.save_as.save_as_top_fids.length) {
            savedFid = String(sd.task_resp.data.save_as.save_as_top_fids[0] || '');
        } else if (sd.task_id) {
            // ⚠️ 实测（2026-09-13）：save 后转存登记约需 600ms~2s（tq_gap=500，服务端官方建议间隔）
            // 引擎无 sleep，单次 task 轮询往返仅 ~60ms——纯连打 8 轮全落在完成窗口内全 status:0
            // 对策：每轮轮询夹一次 file/sort（顺带提前找临时目录，本来后面要用）垫开节奏，轮数给足 12 轮
            for (var t = 0; t < 12; t++) {
                var traw = request('https://drive-pc.quark.cn/1/clouddrive/task?' + rule.qkParam() + '&task_id=' + encodeURIComponent(sd.task_id) + '&retry_index=' + t, {
                    headers: rule.qkHeaders(ck),
                    timeout: 10000
                });
                var tobj = null;
                try { tobj = JSON.parse(traw); } catch (e) { tobj = null; }
                if (!tobj || !tobj.data) { continue; }
                var tfids = (tobj.data.save_as && tobj.data.save_as.save_as_top_fids) || [];
                if (tfids.length) {
                    savedFid = String(tfids[0] || '');
                    break;
                }
                if (tobj.data.status === 2) { break; }  // 完成但没有 fid → 真失败
                if (tobj.data.status !== 0) { break; }   // 未知状态别死等
                // 垫时延 + 有用功：再瞄一眼临时目录（更新 dirFid，同时拉开下一轮轮询的时间间隔）
                try {
                    if (dirFid === '0') {
                        var praw2 = request('https://drive-pc.quark.cn/1/clouddrive/file/sort?' + rule.qkParam()
                            + '&pdir_fid=0&_page=1&_size=50&_fetch_total=1&_fetch_sub_dirs=0&_sort=file_type:asc,updated_at:desc', {
                            headers: rule.qkHeaders(ck),
                            timeout: 8000
                        });
                        var pobj2 = null;
                        try { pobj2 = JSON.parse(praw2); } catch (e) { pobj2 = null; }
                        var plist2 = (pobj2 && pobj2.data && pobj2.data.list) || [];
                        for (var pi = 0; pi < plist2.length; pi++) {
                            if (String(plist2[pi].file_name) === rule.qkTmpDir && plist2[pi].dir) { dirFid = String(plist2[pi].fid); break; }
                        }
                    }
                } catch (e) { }
            }
        }
        if (!savedFid) { return fail('转存完成但未拿到文件 id（task 未完成或响应结构变化）'); }

        // 3) 取直链 —— 无本地代理时走 TV 令牌通道（open-api-drive streaming 302 直链可直连）
        var direct = '';
        if (rule.qtLoginState()) {
            try {
                direct = rule.qtStreamingUrl(savedFid);
            } catch (e) { direct = ''; }
            if (!direct) { return fail('TV直链获取失败（授权可能已过期，回「扫码登录」重新扫TV码）'); }
        } else {
            // TV 未登录且无本地代理：PC 直链反正播不了（412 风控），直接引导
            return fail('本端不支持直接播放：手机TVBox请在「配置中心」源扫码登录夸克（本源自动共用其登录）；zyfun请进「扫码登录」扫第二张TV码');
        }

        // 4) 后台清理旧缓存（不等结果，下一次播放前也会清理）
        rule.qkCleanup(ck);

        return {
            parse: 0,
            url: direct,
            js: ''
        };
    } catch (e) {
        return fail('播放异常:' + (e.message || e));
    }
};

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

/* 进程内结果缓存：rule 常驻引擎，同一会话里重复进同一分类/关键词直接命中，秒开
 *
 * 条目结构 { t: 写入时间, v: 结果数组, ok: 是否请求成功 }
 *   ok=true  —— 请求成功（v 可能为空数组 = 确实没这个资源），按 wpCacheTtl 缓存
 *   ok=false —— 请求失败（实例挂了/超时），按 wpFailTtl 冷却
 * **把"失败"也缓存起来是关键**：否则用户反复刷新、反复进同一分类、
 * 或 TVBox 翻页时，每一次都会重新打满一轮请求，既慢又会被公共实例限流。
 */
rule.wpCache = {};

rule.wpCacheEntry = function (kw) {
    try {
        var c = rule.wpCache[kw];
        if (!c) { return null; }
        var ttl = c.ok ? rule.wpCacheTtl : rule.wpFailTtl;
        if (rule.wpNow() - c.t > ttl) {
            delete rule.wpCache[kw];
            return null;
        }
        return c;
    } catch (e) { return null; }
};

rule.wpCachePut = function (kw, v, ok) {
    try {
        rule.wpCache[kw] = { t: rule.wpNow(), v: v, ok: ok !== false };
        // 容量上限：超出后丢掉最老的一半，防长时间使用内存无限增长
        var keys = [];
        for (var k in rule.wpCache) {
            if (Object.prototype.hasOwnProperty.call(rule.wpCache, k)) { keys.push(k); }
        }
        if (keys.length > rule.wpCacheMax) {
            keys.sort(function (a, b) { return rule.wpCache[a].t - rule.wpCache[b].t; });
            var drop = keys.length - Math.floor(rule.wpCacheMax / 2);
            for (var d = 0; d < drop; d++) { delete rule.wpCache[keys[d]]; }
        }
    } catch (e) { }
};

// 上一次 wpSearch 是否是"请求成功"（供首页判断是否还要换词）
rule.wpLastOk = true;

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
 * 统计一次响应里共有多少条原始结果（用来判断"有没有数据"）
 */
rule.wpCount = function (obj) {
    try {
        var mbt = (obj && obj.data && obj.data.merged_by_type) || {};
        var n = 0;
        for (var k in mbt) {
            if (Object.prototype.hasOwnProperty.call(mbt, k)) { n += (mbt[k] || []).length; }
        }
        return n;
    } catch (e) { return 0; }
};

/**
 * 带回退的搜索请求：
 *   主实例(精选频道) → 主实例(全量源) → 备实例(精选频道) → 备实例(全量源)
 *
 * ⚠️ 空结果不算成功：精选频道对冷门词可能一条都没有（覆盖不到），
 *    若把它当成功就会缓存一个空列表 10 分钟，用户看到的一直是"无数据"。
 *    所以拿到 0 条时先存着，继续换策略，全都空了才认这个空结果。
 * 关键：公共实例的失败大多是 0.3~0.5s 的快速失败，所以在总预算内能跑完好几轮；
 *       而总耗时被 budget 硬性约束，绝不会像「单次 15s 长等 + 再重试一次」那样
 *       把端上（zyfun/TVBox 约 10s）直接拖超时 —— 这就是之前一直转圈失败的原因。
 */
/* 实例健康度：{ 实例地址: {fails: 连续失败次数, until: 降级到期时间戳} } */
rule.wpHealth = {};

rule.wpMarkOk = function (base) {
    try { rule.wpHealth[base] = { fails: 0, until: 0 }; } catch (e) { }
};

// slow=true 表示"卡住不响应"（几乎用满超时），比快速失败严重，直接降级
rule.wpMarkFail = function (base, slow) {
    try {
        var h = rule.wpHealth[base] || { fails: 0, until: 0 };
        h.fails += 1;
        if (slow || h.fails >= rule.wpSickAfter) {
            h.until = rule.wpNow() + rule.wpSickTtl;
        }
        rule.wpHealth[base] = h;
    } catch (e) { }
};

rule.wpSick = function (base) {
    try {
        var h = rule.wpHealth[base];
        return !!(h && h.until > rule.wpNow());
    } catch (e) { return false; }
};

rule.wpFetch = function (kw, budget) {
    var apis = rule.wpApiList || [rule.wpApi];
    var total = budget || rule.wpBudget;
    var maxReq = rule.wpMaxReq || 3;
    var minLeft = rule.wpMinLeft || 2500;
    var t0 = rule.wpNow();
    // 健康的排前面；全都降级了就都试一遍（给恢复的机会，否则会永久锁死）
    var order = [];
    var sick = [];
    for (var i = 0; i < apis.length; i++) {
        if (rule.wpSick(apis[i])) { sick.push(apis[i]); } else { order.push(apis[i]); }
    }
    if (!order.length) { order = sick; }
    var sent = 0;
    var fallback = null;   // "成功但 0 条"的结果先存着，后面遇到有数据的就覆盖它
    var errored = false;   // 是否有过真正的请求失败（区别于"返回了空"）
    for (var a = 0; a < order.length; a++) {
        var base = order[a];
        // 每个实例两种策略：先精选频道（快），不行再全量源
        var modes = rule.wpChannels ? [true, false] : [false];
        for (var m = 0; m < modes.length; m++) {
            if (sent >= maxReq) { break; }
            var left = total - (rule.wpNow() - t0);
            if (left < minLeft) { break; }   // 预算不够一次像样的请求，别白发
            var ms = left > rule.wpTimeout ? rule.wpTimeout : left;
            var t1 = rule.wpNow();
            sent++;
            var obj = rule.wpFetchOne(base, kw, modes[m], ms);
            if (obj && obj.data) {
                rule.wpMarkOk(base);
                if (rule.wpCount(obj) > 0) { return obj; }
                if (!fallback) { fallback = obj; }
                // 0 条：继续换策略碰碰运气（精选频道覆盖不到的冷门词很常见）
                continue;
            }
            errored = true;
            // 用掉 85% 以上的超时才算"无响应" → 别再试它别的策略了，立刻换实例
            // （用相对比例而不是固定余量，否则超时值调小时会把快速失败误判成卡死）
            var slow = (rule.wpNow() - t1) >= (ms * 0.85);
            rule.wpMarkFail(base, slow);
            if (slow) { break; }
        }
    }
    // 只要中途有过请求失败，就不把"空结果"当真数据返回 —— 否则会把一个
    // 由故障造成的空列表缓存 10 分钟，用户看到的一直是"无数据"。
    // 返回 null 走失败冷却（25s 后可重试），好过错误地长期缓存空结果。
    return errored ? null : fallback;
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
 * 先查缓存（命中即秒开，且**命中失败冷却时一个请求都不发**），
 * 未命中才走「多策略回退 + 总预算约束」的请求，结果一律写入缓存（含失败）
 * 任一环节失败都返回 []，绝不抛错 —— 端上最多显示空分类，不会报错也不会卡死
 *
 * 副作用：会把本次是否请求成功写进 rule.wpLastOk，供首页决定要不要继续换词
 */
rule.wpSearch = function (kw, limit, budget) {
    var k = String(kw || '').trim();
    if (!k) { rule.wpLastOk = true; return []; }
    var lim = limit || 24;
    var e = rule.wpCacheEntry(k);
    if (e) {
        rule.wpLastOk = e.ok;
        if (!e.ok) { return []; }
        return e.v.length > lim ? e.v.slice(0, lim) : e.v;
    }
    var obj = null;
    try { obj = rule.wpFetch(k, budget); } catch (err) { obj = null; }
    if (!obj || !obj.data) {
        // 请求失败：写一段短冷却，冷却期内不再发请求（防刷新风暴）
        rule.wpCachePut(k, [], false);
        rule.wpLastOk = false;
        return [];
    }
    var out = rule.wpBuild(obj, rule.wpCacheLimit || 250);
    rule.wpCachePut(k, out, true);
    rule.wpLastOk = true;
    return out.length > lim ? out.slice(0, lim) : out;
};

/**
 * 按页切片：翻页共用同一份缓存结果，翻过头返回 [] 让端上自然停止
 * 这同时解决了两个问题：
 *   ① 翻页不再重复请求同一个关键词（否则用户一直下拉就是一直请求）
 *   ② 以前每页都返回同样的内容，现在是真正的分页
 */
rule.wpPage = function (all, page, size) {
    var arr = all || [];
    var sz = parseInt(String(size), 10) || 24;
    var p = parseInt(String(page).replace(/[^0-9]/g, ''), 10);
    if (!p || p < 1) { p = 1; }
    var start = (p - 1) * sz;
    if (start >= arr.length) { return []; }
    return arr.slice(start, start + sz);
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
