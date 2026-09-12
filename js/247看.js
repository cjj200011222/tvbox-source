/**
 * 247看 drpy 源（247kan.com）
 * 站点：苹果CMS采集站 + React SPA + 自建 /api/* JSON 网关（无需登录，游客全可用）
 * 数据/播放直链全部来自最大资源网（天堂/非非/暴风/量子/电影天堂/OK 等）
 * 鉴权：所有 /api/* 请求必须带 x-api-key: ETMy41jT5qtCFc61Le8rUpTk2MzWGyIP（前端 bundle 硬编码，非敏感）
 * 图片：部分图床直连被防盗链(豆瓣418)/挂(502)，统一走站方代理 /api/proxy/image?url=（免凭证）
 * 线路：episodes 数组按 route 分组多线路；m3u8 线直出可播，网页线(jp=soowle/youku/qq)透传 parse:1 嗅探
 * 坑：①vip.dytt-tvs.com 的 https TLS 握手失败需降级 http；②密集请求可能触发 JS 挑战(403+Set-Cookie)，
 *     引擎 fetch 拿不到响应头无法种 cookie，做"非JSON重试一次"容错即可（常态无挑战）
 * 引擎注意：函数体内禁用 url/res/fl/name/html 等引擎变量名；顶层 return 非法须 if 包裹
 */
var rule = {
    title: '247看',
    host: 'https://247kan.com',
    // 说明性模板（实际请求在一级函数里手动拼参数）
    url: '/api/videos?type_id=fyclass&page=fypage&limit=30&sort=-vod_time',
    searchUrl: '/api/search/videos?q=**&page=fypage&limit=20',
    searchable: 1,
    quickSearch: 1,
    filterable: 1,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'x-api-key': 'ETMy41jT5qtCFc61Le8rUpTk2MzWGyIP',
        'Accept': 'application/json'
    },
    timeout: 15000,
    // 仿官网导航：6 大类（type_id 1~6），子分类做"类型"筛选
    class_name: '电影&连续剧&综艺&动漫&短剧&纪录片',
    class_url: '1&2&3&4&5&6',
    filter: {
        // 电影(type_id=1)：类型(子类id 7~13)/地区/年份/排序
        "1": [
            { "key": "类型", "name": "类型", "value": [
                { "n": "全部", "v": "" }, { "n": "动作片", "v": "7" }, { "n": "喜剧片", "v": "8" },
                { "n": "爱情片", "v": "9" }, { "n": "科幻片", "v": "10" }, { "n": "恐怖片", "v": "11" },
                { "n": "剧情片", "v": "12" }, { "n": "战争片", "v": "13" }
            ]},
            { "key": "地区", "name": "地区", "value": [
                { "n": "全部", "v": "" }, { "n": "中国大陆", "v": "中国大陆" }, { "n": "中国香港", "v": "中国香港" },
                { "n": "中国台湾", "v": "中国台湾" }, { "n": "美国", "v": "美国" }, { "n": "韩国", "v": "韩国" },
                { "n": "日本", "v": "日本" }, { "n": "英国", "v": "英国" }, { "n": "法国", "v": "法国" },
                { "n": "泰国", "v": "泰国" }, { "n": "印度", "v": "印度" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" }, { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" },
                { "n": "2024", "v": "2024" }, { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" },
                { "n": "2021", "v": "2021" }, { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" },
                { "n": "2018", "v": "2018" }, { "n": "更早", "v": "older" }
            ]},
            { "key": "排序", "name": "排序", "value": [
                { "n": "最新", "v": "-vod_time" }, { "n": "高分", "v": "-vod_douban_score" },
                { "n": "热播", "v": "-vod_hits" }, { "n": "热门", "v": "-vod_level" }
            ]}
        ],
        // 连续剧(type_id=2)：类型(子类id 14~21)
        "2": [
            { "key": "类型", "name": "类型", "value": [
                { "n": "全部", "v": "" }, { "n": "国产剧", "v": "14" }, { "n": "香港剧", "v": "15" },
                { "n": "韩国剧", "v": "16" }, { "n": "欧美剧", "v": "17" }, { "n": "台湾剧", "v": "18" },
                { "n": "日本剧", "v": "19" }, { "n": "海外剧", "v": "20" }, { "n": "泰国剧", "v": "21" }
            ]},
            { "key": "地区", "name": "地区", "value": [
                { "n": "全部", "v": "" }, { "n": "中国大陆", "v": "中国大陆" }, { "n": "中国香港", "v": "中国香港" },
                { "n": "中国台湾", "v": "中国台湾" }, { "n": "美国", "v": "美国" }, { "n": "韩国", "v": "韩国" },
                { "n": "日本", "v": "日本" }, { "n": "英国", "v": "英国" }, { "n": "泰国", "v": "泰国" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" }, { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" },
                { "n": "2024", "v": "2024" }, { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" },
                { "n": "2021", "v": "2021" }, { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" },
                { "n": "2018", "v": "2018" }, { "n": "更早", "v": "older" }
            ]},
            { "key": "排序", "name": "排序", "value": [
                { "n": "最新", "v": "-vod_time" }, { "n": "高分", "v": "-vod_douban_score" },
                { "n": "热播", "v": "-vod_hits" }, { "n": "热门", "v": "-vod_level" }
            ]}
        ],
        // 综艺(type_id=3)：类型(子类id 22~25)
        "3": [
            { "key": "类型", "name": "类型", "value": [
                { "n": "全部", "v": "" }, { "n": "大陆综艺", "v": "22" }, { "n": "港台综艺", "v": "23" },
                { "n": "日韩综艺", "v": "24" }, { "n": "欧美综艺", "v": "25" }
            ]},
            { "key": "地区", "name": "地区", "value": [
                { "n": "全部", "v": "" }, { "n": "中国大陆", "v": "中国大陆" }, { "n": "中国香港", "v": "中国香港" },
                { "n": "中国台湾", "v": "中国台湾" }, { "n": "日本", "v": "日本" }, { "n": "韩国", "v": "韩国" },
                { "n": "美国", "v": "美国" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" }, { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" },
                { "n": "2024", "v": "2024" }, { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" },
                { "n": "2021", "v": "2021" }, { "n": "2020", "v": "2020" }, { "n": "更早", "v": "older" }
            ]},
            { "key": "排序", "name": "排序", "value": [
                { "n": "最新", "v": "-vod_time" }, { "n": "高分", "v": "-vod_douban_score" },
                { "n": "热播", "v": "-vod_hits" }, { "n": "热门", "v": "-vod_level" }
            ]}
        ],
        // 动漫(type_id=4)：类型(子类id 26~30)
        "4": [
            { "key": "类型", "name": "类型", "value": [
                { "n": "全部", "v": "" }, { "n": "国产动漫", "v": "26" }, { "n": "日韩动漫", "v": "27" },
                { "n": "欧美动漫", "v": "28" }, { "n": "港台动漫", "v": "29" }, { "n": "海外动漫", "v": "30" }
            ]},
            { "key": "地区", "name": "地区", "value": [
                { "n": "全部", "v": "" }, { "n": "日本", "v": "日本" }, { "n": "中国大陆", "v": "中国大陆" },
                { "n": "欧美", "v": "欧美" }, { "n": "中国台湾", "v": "中国台湾" }, { "n": "中国香港", "v": "中国香港" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" }, { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" },
                { "n": "2024", "v": "2024" }, { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" },
                { "n": "2021", "v": "2021" }, { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" },
                { "n": "2018", "v": "2018" }, { "n": "更早", "v": "older" }
            ]},
            { "key": "排序", "name": "排序", "value": [
                { "n": "最新", "v": "-vod_time" }, { "n": "高分", "v": "-vod_douban_score" },
                { "n": "热播", "v": "-vod_hits" }, { "n": "热门", "v": "-vod_level" }
            ]}
        ],
        // 短剧(type_id=5)：无子分类
        "5": [
            { "key": "地区", "name": "地区", "value": [
                { "n": "全部", "v": "" }, { "n": "中国大陆", "v": "中国大陆" }, { "n": "中国台湾", "v": "中国台湾" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" }, { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" },
                { "n": "2024", "v": "2024" }, { "n": "更早", "v": "older" }
            ]},
            { "key": "排序", "name": "排序", "value": [
                { "n": "最新", "v": "-vod_time" }, { "n": "热播", "v": "-vod_hits" }
            ]}
        ],
        // 纪录片(type_id=6)：无子分类
        "6": [
            { "key": "地区", "name": "地区", "value": [
                { "n": "全部", "v": "" }, { "n": "中国大陆", "v": "中国大陆" }, { "n": "日本", "v": "日本" },
                { "n": "美国", "v": "美国" }, { "n": "英国", "v": "英国" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" }, { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" },
                { "n": "2024", "v": "2024" }, { "n": "更早", "v": "older" }
            ]},
            { "key": "排序", "name": "排序", "value": [
                { "n": "最新", "v": "-vod_time" }, { "n": "高分", "v": "-vod_douban_score" },
                { "n": "热播", "v": "-vod_hits" }
            ]}
        ]
    },
    filter_url: '',
    filter_def: '',
    play_parse: true,
    play_json: [],
    lazy: $js.toString(() => {
        // input = 完整播放 URL（含 http，引擎不会 base64 误解码）
        // m3u8 线路直出；网页线路(jp/youku/qq等) parse:1 交给播放器嗅探
        try {
            var pu = String(input);
            if (/\.m3u8(\?|$)/i.test(pu) || /\/api\/proxy\/stream\//i.test(pu)) {
                // vip.dytt-tvs.com 的 https TLS 握手失败，降级 http
                if (pu.indexOf('https://vip.dytt-tvs.com') === 0) {
                    pu = 'http://vip.dytt-tvs.com' + pu.substring('https://vip.dytt-tvs.com'.length);
                }
                input = { parse: 0, url: pu, js: '' };
            } else if (/^https?:\/\//.test(pu)) {
                // 网页播放页（soowle/优酷/腾讯等），交给播放器解析/嗅探
                input = { parse: 1, url: pu, js: '' };
            } else {
                input = { parse: 0, url: '247:无效播放地址', js: '' };
            }
        } catch (e) {
            input = { parse: 0, url: '247:' + e.message, js: '' };
        }
    }),
    推荐: $js.toString(() => {
        // 官网首页推荐位 = 日榜前 24
        var kApi = 'https://247kan.com/api';
        var kHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'x-api-key': 'ETMy41jT5qtCFc61Le8rUpTk2MzWGyIP',
            'Accept': 'application/json'
        };
        // 图片统一走站方代理（豆瓣图直连 418 防盗链、部分图床 502）
        function kPic(p) {
            p = String(p || '').trim();
            if (!p || p === 'null' || p === 'undefined') { return ''; }
            if (p.indexOf('/api/proxy/image') === 0) { return 'https://247kan.com' + p; }
            if (/^https?:\/\//.test(p)) { return 'https://247kan.com/api/proxy/image?url=' + encodeURIComponent(p); }
            return p;
        }
        function kReq(reqUrl) {
            var txt = String(fetch(reqUrl, { headers: kHeaders, timeout: 15000 }) || '');
            if (txt.charAt(0) !== '{') {
                // JS挑战页/空响应容错：重试一次
                txt = String(fetch(reqUrl, { headers: kHeaders, timeout: 15000 }) || '');
            }
            try { return JSON.parse(txt); } catch (e) { return null; }
        }
        var vodList = [];
        var rk = kReq(kApi + '/rankings/daily?page=1&limit=24');
        if (rk && rk.status === 'success' && rk.data && rk.data.videos) {
            (rk.data.videos || []).forEach(function (it) {
                vodList.push({
                    vod_id: String(it.vod_id),
                    vod_name: it.vod_name || '',
                    vod_pic: kPic(it.vod_pic),
                    vod_remarks: (it.vod_remarks || '').trim(),
                    vod_blurb: ((it.vod_area || '') + ' ' + (it.vod_year || '') + ' ' + (it.vod_class || '')).trim()
                });
            });
        }
        VODS = vodList;
    }),
    一级: $js.toString(() => {
        var kApi = 'https://247kan.com/api';
        var kHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'x-api-key': 'ETMy41jT5qtCFc61Le8rUpTk2MzWGyIP',
            'Accept': 'application/json'
        };
        function kPic(p) {
            p = String(p || '').trim();
            if (!p || p === 'null' || p === 'undefined') { return ''; }
            if (p.indexOf('/api/proxy/image') === 0) { return 'https://247kan.com' + p; }
            if (/^https?:\/\//.test(p)) { return 'https://247kan.com/api/proxy/image?url=' + encodeURIComponent(p); }
            return p;
        }
        function kReq(reqUrl) {
            var txt = String(fetch(reqUrl, { headers: kHeaders, timeout: 15000 }) || '');
            if (txt.charAt(0) !== '{') {
                txt = String(fetch(reqUrl, { headers: kHeaders, timeout: 15000 }) || '');
            }
            try { return JSON.parse(txt); } catch (e) { return null; }
        }
        var vodList = [];
        if (true) {
            var cate = String(MY_CATE || '1');
            var flObj = MY_FL || {};
            // 子分类类型直接替换 type_id（电影动作片=7 等与顶层 /api/videos 兼容）
            var typeId = flObj['类型'] || cate;
            var parts = [
                'type_id=' + typeId,
                'page=' + MY_PAGE,
                'limit=30',
                'sort=' + (flObj['排序'] || '-vod_time')
            ];
            if (flObj['地区']) { parts.push('area=' + encodeURIComponent(flObj['地区'])); }
            if (flObj['年份'] === 'older') { parts.push('yearEnd=2009'); }
            else if (flObj['年份']) { parts.push('yearStart=' + flObj['年份'], 'yearEnd=' + flObj['年份']); }
            var catData = kReq(kApi + '/videos?' + parts.join('&'));
            if (catData && catData.status === 'success' && catData.data && catData.data.videos) {
                (catData.data.videos || []).forEach(function (it) {
                    var sc = parseFloat(it.vod_douban_score || 0);
                    vodList.push({
                        vod_id: String(it.vod_id),
                        vod_name: it.vod_name || '',
                        vod_pic: kPic(it.vod_pic),
                        vod_remarks: (it.vod_remarks || '').trim(),
                        vod_blurb: (((it.vod_area || '') + ' ' + (it.vod_year || '') + ' ' + (it.vod_class || '')).trim() + (sc > 0 ? ' | 豆瓣' + sc : '')).trim()
                    });
                });
            }
        }
        VODS = vodList;
    }),
    二级: $js.toString(() => {
        var kApi = 'https://247kan.com/api';
        var kHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'x-api-key': 'ETMy41jT5qtCFc61Le8rUpTk2MzWGyIP',
            'Accept': 'application/json'
        };
        function kPic(p) {
            p = String(p || '').trim();
            if (!p || p === 'null' || p === 'undefined') { return ''; }
            if (p.indexOf('/api/proxy/image') === 0) { return 'https://247kan.com' + p; }
            if (/^https?:\/\//.test(p)) { return 'https://247kan.com/api/proxy/image?url=' + encodeURIComponent(p); }
            return p;
        }
        function kReq(reqUrl) {
            var txt = String(fetch(reqUrl, { headers: kHeaders, timeout: 15000 }) || '');
            if (txt.charAt(0) !== '{') {
                txt = String(fetch(reqUrl, { headers: kHeaders, timeout: 15000 }) || '');
            }
            try { return JSON.parse(txt); } catch (e) { return null; }
        }
        // 采集站线路代号 → 友好名（m3u8 线路排前面，网页线标注）
        function kRouteName(rt) {
            var map = {
                'ffm3u8': '非凡', 'tym3u8': '天堂', 'dyttm3u8': '电影天堂', 'dytttvs': '电影天堂',
                '1080zyk': '量子', 'bfzym3u8': '暴风', 'okm3u8': 'OK资源', 'mym3u8': 'M资源', 'ikm3u8': 'IK资源',
                'jp': '247专线(网页)', 'cz': '247专线C(网页)', 'lv': '247专线L(网页)',
                'youku': '优酷(网页)', 'qq': '腾讯(网页)', 'bzm3u8': '量子B'
            };
            var key = String(rt || '').toLowerCase();
            return map[key] || (String(rt || '') + '(网页)');
        }
        var vid = String(orId || '').split('@@')[0].trim();
        var vodObj = { vod_name: '未知', vod_pic: '', vod_play_from: '', vod_play_url: '' };
        var dData = kReq(kApi + '/videos/' + vid);
        if (dData && dData.status === 'success' && dData.data) {
            var info = dData.data;
            vodObj.vod_id = String(info.vod_id || vid);
            vodObj.vod_name = info.vod_name || '未知';
            vodObj.vod_pic = kPic(info.vod_pic);
            vodObj.vod_year = info.vod_year || '';
            vodObj.vod_area = info.vod_area || '';
            vodObj.vod_remarks = (info.vod_remarks || '').trim();
            vodObj.vod_director = (info.vod_director || '').replace(/\/$/, '').trim();
            vodObj.vod_actor = (info.vod_actor || '').replace(/\/$/, '').trim();
            vodObj.type_name = (info.vod_class || info.type_name || '').split(',')[0];
            var content = String(info.vod_content || info.vod_blurb || '');
            content = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
            vodObj.vod_content = content;
            vodObj.vod_blurb = content.substring(0, 100);
            var sc = parseFloat(info.vod_douban_score || 0);
            if (sc > 0) { vodObj.vod_name = vodObj.vod_name + '【' + sc + '】'; }

            // 剧集：episodes 按 route 分组 → 多线路（$$$ 分隔）
            var eps = (Array.isArray(info.episodes) && info.episodes.length > 0) ? info.episodes : null;
            if (eps) {
                var routeOrder = [];
                var routeMap = {};
                eps.forEach(function (e) {
                    var rt = e.route || 'default';
                    if (!routeMap[rt]) { routeMap[rt] = []; routeOrder.push(rt); }
                    routeMap[rt].push(e);
                });
                // m3u8 线路优先，网页线路殿后
                routeOrder.sort(function (a, b) {
                    var ea = routeMap[a][0] || {};
                    var eb = routeMap[b][0] || {};
                    var ua = /\.m3u8/i.test(String(ea.url || '')) ? 0 : 1;
                    var ub = /\.m3u8/i.test(String(eb.url || '')) ? 0 : 1;
                    return ua - ub;
                });
                var froms = [];
                var urls = [];
                routeOrder.forEach(function (rt) {
                    var list = routeMap[rt];
                    var epArr = [];
                    list.forEach(function (e) {
                        var nm = String(e.name || ('第' + (e.episode || epArr.length + 1) + '集')).trim();
                        epArr.push(nm + '$' + String(e.url || ''));
                    });
                    if (epArr.length > 0) {
                        froms.push(kRouteName(rt) + '(' + list.length + '集)');
                        urls.push(epArr.join('#'));
                    }
                });
                if (froms.length > 0) {
                    vodObj.vod_play_from = froms.join('$$$');
                    vodObj.vod_play_url = urls.join('$$$');
                }
            }
            // 兜底：无 episodes 时直接解析 vod_play_from/vod_play_url（老数据格式）
            if (!vodObj.vod_play_url && info.vod_play_from && info.vod_play_url) {
                var fromArr = String(info.vod_play_from).split('$$$');
                var urlArr = String(info.vod_play_url).split('$$$');
                var froms2 = [];
                var urls2 = [];
                fromArr.forEach(function (fr, fi) {
                    var segs = String(urlArr[fi] || '').split('#').filter(function (s) { return s.indexOf('$') > 0; });
                    if (segs.length > 0) {
                        froms2.push(kRouteName(fr) + '(' + segs.length + '集)');
                        urls2.push(segs.join('#'));
                    }
                });
                if (froms2.length > 0) {
                    vodObj.vod_play_from = froms2.join('$$$');
                    vodObj.vod_play_url = urls2.join('$$$');
                }
            }
        }
        VOD = vodObj;
    }),
    搜索: $js.toString(() => {
        var kApi = 'https://247kan.com/api';
        var kHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'x-api-key': 'ETMy41jT5qtCFc61Le8rUpTk2MzWGyIP',
            'Accept': 'application/json'
        };
        function kPic(p) {
            p = String(p || '').trim();
            if (!p || p === 'null' || p === 'undefined') { return ''; }
            if (p.indexOf('/api/proxy/image') === 0) { return 'https://247kan.com' + p; }
            if (/^https?:\/\//.test(p)) { return 'https://247kan.com/api/proxy/image?url=' + encodeURIComponent(p); }
            return p;
        }
        function kReq(reqUrl) {
            var txt = String(fetch(reqUrl, { headers: kHeaders, timeout: 15000 }) || '');
            if (txt.charAt(0) !== '{') {
                txt = String(fetch(reqUrl, { headers: kHeaders, timeout: 15000 }) || '');
            }
            try { return JSON.parse(txt); } catch (e) { return null; }
        }
        var vodList = [];
        var kw = String(KEY || '').trim();
        if (kw) {
            var sUrl = kApi + '/search/videos?q=' + encodeURIComponent(kw) + '&page=' + (MY_PAGE || 1) + '&limit=20';
            var sData = kReq(sUrl);
            if (sData && sData.status === 'success' && sData.data && sData.data.videos) {
                (sData.data.videos || []).forEach(function (it) {
                    var sc = parseFloat(it.vod_douban_score || 0);
                    var desc = String(it.vod_content || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
                    vodList.push({
                        vod_id: String(it.vod_id),
                        vod_name: it.vod_name || '',
                        vod_pic: kPic(it.vod_pic),
                        vod_remarks: (it.vod_remarks || '').trim(),
                        vod_blurb: (desc || ((it.vod_area || '') + ' ' + (it.vod_year || '') + ' ' + (it.vod_class || '')).trim()).substring(0, 100)
                    });
                });
            }
        }
        VODS = vodList;
    })
};
