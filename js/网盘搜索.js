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
                    }
                    // 剩下的（未直链化的）链接按网盘类型分线路，条目标签「第01集」样式
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
                        desc += '\n✅ 已登录夸克：「夸克直链」线路可直接播放（首次点击需转存，约 2~5 秒）。';
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
        // 三类输入：夸克直链（qk://）、退出登录操作（qqklogout）、普通分享链接
        try {
            var rawIn = String(input).trim();
            if (rawIn === 'qqklogout') {
                // 退出登录：清存储与内存；置 ignore 标记让配置中心共享也停用
                // （配置中心的 cookie 文件不动 —— 趣盘等 Java 源还要用，只是本源不再读它）
                try { setItem(rule.QUARK_CK_KEY, ''); } catch (e) { }
                rule._qkCk = '';
                rule._qkIgnoreCfg = true;
                rule._qkCfgCache = null;
                input = { parse: 0, url: '已退出登录，回列表重新扫码即可再次登录', js: '' };
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
    if (rule.wpQuarkLoginState()) {
        // 已登录：展示状态卡片（进入二级可看账号信息/退出登录）
        var src = rule.qkLoginSource();
        var srcName = src === 'cfg' ? '配置中心共享' : (src === 'own' ? '本源扫码' : '已登录');
        return [{
            vod_id: 'http://wp/login/status',
            vod_name: '夸克已登录 · 点击管理',
            vod_pic: '',
            vod_remarks: srcName,
            vod_blurb: '夸克已登录（' + srcName + '），夸克/UC 资源可点开即播（自动转存取直链）'
        }];
    }
    // 未登录：生成新二维码
    var qr = rule.qkQrNew();
    if (!qr) {
        return [{
            vod_id: 'http://wp/login/err',
            vod_name: '获取二维码失败，点此重试',
            vod_pic: '',
            vod_remarks: '点击刷新',
            vod_blurb: '连接夸克登录服务失败，点击重试'
        }];
    }
    // token 存内存（本会话有效）；二维码图片走公共 QR 生成服务（国内直连实测 1.2s）
    rule._qkToken = qr.token;
    var img = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(qr.qrUrl);
    return [{
        vod_id: 'http://wp/login/qr',
        vod_name: '用【夸克App】扫码登录',
        vod_pic: img,
        vod_remarks: '扫码后回来点这张卡',
        vod_blurb: '打开手机夸克 App → 首页右上角扫一扫 → 对准二维码 → 确认登录'
    }];
};

// 登录流程的二级
rule.wpLoginDetail = function (id) {
    if (id === 'http://wp/login/status') {
        // 管理页：确认 cookie 有效性 + 退出登录入口
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
        if (memberOk) {
            // 显示名优先级：自扫码/配置中心存过昵称 > member 接口 > 泛称
            var nick = '';
            try { nick = getItem(rule.QUARK_NICK_KEY, '') || ''; } catch (e) { nick = ''; }
            if (!nick) { nick = rule._qkNick || ''; }
            if (!nick) { nick = '已登录'; }
            var mt = (obj.data.member && obj.data.member.member_type) || obj.data.member_type || '';
            var vipTxt = mt === 'SUPER_VIP' ? '超级会员' : (/VIP/.test(String(mt)) ? '会员' : '普通用户');
            vod.vod_content = '当前登录：' + nick + '（' + vipTxt + '）'
                + '\n\n登录态来源：' + (src === 'cfg' ? '配置中心共享 —— 在「配置中心」源里也能看到这份登录' : (src === 'own' ? '本源扫码' : '未知'))
                + '\n\n点「退出登录」仅停用本源的夸克功能（不影响趣盘等其它源）；配置中心重新扫码后点「重新检测」即可恢复。';
            vod.vod_play_url = '退出登录$qqklogout';
            if (src === 'cfg' || !src) {
                vod.vod_play_url = '重新检测配置中心登录$qkredetect#退出登录$qqklogout';
            }
        } else {
            vod.vod_content = '登录态已失效（cookie 过期）。\n\n两个恢复办法：\n① 若你在「配置中心」源里登录过夸克，点「重新检测」直接共享它的登录态；\n② 回列表重新扫码。';
            vod.vod_play_url = '重新检测配置中心登录$qkredetect#清除失效登录$qqklogout';
        }
        vod.vod_blurb = vod.vod_content.substring(0, 100);
        return vod;
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
        return {
            vod_id: id,
            vod_name: '登录成功',
            vod_pic: '',
            type_name: '功能',
            vod_content: '✅ 夸克登录成功！\n\n现在搜索任意资源，夸克/UC 网盘的条目会多出「夸克直链」线路，点开即播（首次点击需转存，约 2~5 秒）。\n回列表搜个「庆余年」试试。',
            vod_blurb: '夸克登录成功',
            vod_play_from: '提示',
            vod_play_url: '返回开始使用$qhttp://wp/login/qr'
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
        } catch (e) { }

        // 2) 转存
        var saveRaw = request('https://drive-pc.quark.cn/1/clouddrive/share/sharepage/save?' + rule.qkParam(), {
            method: 'POST',
            headers: rule.qkHeaders(ck),
            body: JSON.stringify({
                fid_list: [pay.f],
                fid_token_list: [pay.t],
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
        // 同步完成：task_resp 里直接有 save_as；异步：轮询 task
        var savedFid = '';
        var sd = saveObj.data || {};
        if (sd.task_resp && sd.task_resp.data && sd.task_resp.data.save_as && sd.task_resp.data.save_as.save_as_top_fids) {
            savedFid = String(sd.task_resp.data.save_as.save_as_top_fids[0] || '');
        } else if (sd.task_id) {
            for (var t = 0; t < 3; t++) {
                var traw = request('https://drive-pc.quark.cn/1/clouddrive/task?' + rule.qkParam() + '&task_id=' + encodeURIComponent(sd.task_id) + '&retry_index=' + t, {
                    headers: rule.qkHeaders(ck),
                    timeout: 10000
                });
                var tobj = null;
                try { tobj = JSON.parse(traw); } catch (e) { tobj = null; }
                if (tobj && tobj.data && tobj.data.save_as && tobj.data.save_as.save_as_top_fids) {
                    savedFid = String(tobj.data.save_as.save_as_top_fids[0] || '');
                    break;
                }
            }
        }
        if (!savedFid) { return fail('转存完成但未拿到文件 id'); }

        // 3) 取直链
        var praw = request('https://drive-pc.quark.cn/1/clouddrive/file/v2/play?' + rule.qkParam() + '&fid=' + encodeURIComponent(savedFid) + '&format=1', {
            headers: rule.qkHeaders(ck),
            timeout: 15000
        });
        var pobj = null;
        try { pobj = JSON.parse(praw); } catch (e) { pobj = null; }
        if (!pobj || !pobj.data) { return fail('取播放直链失败'); }
        var vl = pobj.data.video_list || [];
        // video_list 按清晰度从高到低；取第一个（最高清晰度）
        var direct = '';
        for (var vi = 0; vi < vl.length; vi++) {
            var v = vl[vi] || {};
            var u = String(v.video_url || v.url || '');
            if (u) { direct = u; break; }
        }
        if (!direct) { return fail('无可用视频流（可能会员专属清晰度）'); }

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
