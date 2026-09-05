/**
 * 次元城动画 drpy 源（cycani.org）
 * 后端：https://www.cycani.org/api（网关，APP 端走 mapi.cycback.org，接口同构）
 * 鉴权：列表/详情/搜索/排行/周表匿名可用，但必须带头 X-App-Name: cyc_web（缺则 400 app_name is required）
 *       播放 /v2/sections/{id}/play-url 必须 Bearer token（游客 401）
 *       → 把下方 rule.cyc_user / rule.cyc_pass 填成官网已注册账号，lazy 自动登录取播放地址
 * 注册：官网 https://www.cycani.org/register（邮箱白名单 qq/163/126/gmail/outlook/hotmail/icloud，需邮箱验证码）
 * 线路：全站单线路 cychub（CYC_Main），无多线路
 * 引擎注意：规则文件被包在 IIFE 里 eval，顶层 var 在函数体执行时不可见——
 *       函数体内用到的常量全部内联；账号密码挂 rule 对象字段（rule 是引擎全局，函数体可见）
 */
var rule = {
    // ==== 账号配置（播放需要登录，官网免费注册后填这里）====
    cyc_user: 'DerrickAllen27981',
    cyc_pass: '$$kpLzYG#Fw7!Nb',

    title: '次元城动画',
    host: 'https://www.cycani.org',
    url: '/api/videos?zone_id=1&page=fypage&page_size=24&order_by=update_time',
    searchUrl: '/api/videos/search?q=**&zone_id=1&page=fypage&page_size=24',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'X-App-Name': 'cyc_web',
        'X-App-Version': 'cycweb',
        'X-Time-Zone': 'Asia/Shanghai',
        'Accept': 'application/json'
    },
    timeout: 20000,
    // 仿官网：TV番组 / 剧场番组 / 排行榜 / 周表
    class_name: 'TV番组&剧场番组&排行榜&周表',
    class_url: 'tv&movie&rank&schedule',
    filter: {
        // TV番组(zone_id=1)：分类/年份/排序（官网分类页筛选）
        "tv": [
            { "key": "分类", "name": "分类", "value": [
                { "n": "全部", "v": "" },
                { "n": "原创", "v": "原创" }, { "n": "漫画改", "v": "漫画改" },
                { "n": "小说改", "v": "小说改" }, { "n": "游戏改", "v": "游戏改" },
                { "n": "异世界", "v": "异世界" }, { "n": "热血", "v": "热血" },
                { "n": "穿越", "v": "穿越" }, { "n": "奇幻", "v": "奇幻" },
                { "n": "战斗", "v": "战斗" }, { "n": "搞笑", "v": "搞笑" },
                { "n": "日常", "v": "日常" }, { "n": "科幻", "v": "科幻" },
                { "n": "治愈", "v": "治愈" }, { "n": "校园", "v": "校园" },
                { "n": "泡面", "v": "泡面" }, { "n": "恋爱", "v": "恋爱" },
                { "n": "后宫", "v": "后宫" }, { "n": "少女", "v": "少女" },
                { "n": "百合", "v": "百合" }, { "n": "魔法", "v": "魔法" },
                { "n": "冒险", "v": "冒险" }, { "n": "历史", "v": "历史" },
                { "n": "架空", "v": "架空" }, { "n": "机战", "v": "机战" },
                { "n": "运动", "v": "运动" }, { "n": "励志", "v": "励志" },
                { "n": "音乐", "v": "音乐" }, { "n": "推理", "v": "推理" },
                { "n": "社团", "v": "社团" }, { "n": "智斗", "v": "智斗" },
                { "n": "催泪", "v": "催泪" }, { "n": "美食", "v": "美食" },
                { "n": "偶像", "v": "偶像" }, { "n": "乙女", "v": "乙女" },
                { "n": "职场", "v": "职场" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" }, { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" },
                { "n": "2024", "v": "2024" }, { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" },
                { "n": "2021", "v": "2021" }, { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" },
                { "n": "2018", "v": "2018" }, { "n": "更早", "v": "older" }
            ]},
            { "key": "排序", "name": "排序", "value": [
                { "n": "更新时间", "v": "update_time" }, { "n": "热度", "v": "hits" },
                { "n": "评分", "v": "score" }
            ]}
        ],
        // 剧场番组(zone_id=2)：同 TV
        "movie": [
            { "key": "分类", "name": "分类", "value": [
                { "n": "全部", "v": "" },
                { "n": "原创", "v": "原创" }, { "n": "漫画改", "v": "漫画改" },
                { "n": "小说改", "v": "小说改" }, { "n": "游戏改", "v": "游戏改" },
                { "n": "异世界", "v": "异世界" }, { "n": "热血", "v": "热血" },
                { "n": "穿越", "v": "穿越" }, { "n": "奇幻", "v": "奇幻" },
                { "n": "战斗", "v": "战斗" }, { "n": "搞笑", "v": "搞笑" },
                { "n": "日常", "v": "日常" }, { "n": "科幻", "v": "科幻" },
                { "n": "治愈", "v": "治愈" }, { "n": "校园", "v": "校园" },
                { "n": "泡面", "v": "泡面" }, { "n": "恋爱", "v": "恋爱" },
                { "n": "后宫", "v": "后宫" }, { "n": "少女", "v": "少女" },
                { "n": "百合", "v": "百合" }, { "n": "魔法", "v": "魔法" },
                { "n": "冒险", "v": "冒险" }, { "n": "历史", "v": "历史" },
                { "n": "架空", "v": "架空" }, { "n": "机战", "v": "机战" },
                { "n": "战争", "v": "战争" }, { "n": "运动", "v": "运动" },
                { "n": "励志", "v": "励志" }, { "n": "音乐", "v": "音乐" },
                { "n": "推理", "v": "推理" }, { "n": "社团", "v": "社团" },
                { "n": "智斗", "v": "智斗" }, { "n": "催泪", "v": "催泪" },
                { "n": "美食", "v": "美食" }, { "n": "偶像", "v": "偶像" },
                { "n": "乙女", "v": "乙女" }, { "n": "职场", "v": "职场" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" }, { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" },
                { "n": "2024", "v": "2024" }, { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" },
                { "n": "2021", "v": "2021" }, { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" },
                { "n": "2018", "v": "2018" }, { "n": "更早", "v": "older" }
            ]},
            { "key": "排序", "name": "排序", "value": [
                { "n": "更新时间", "v": "update_time" }, { "n": "热度", "v": "hits" },
                { "n": "评分", "v": "score" }
            ]}
        ],
        // 排行榜：TV榜/剧场榜（后端 ranks 只有这两榜，各20条）
        "rank": [
            { "key": "榜单", "name": "榜单", "value": [
                { "n": "TV番组", "v": "1" }, { "n": "剧场番组", "v": "2" }
            ]}
        ],
        // 周表：周几（官网周一=1..周日=7）
        "schedule": [
            { "key": "周几", "name": "周几", "value": [
                { "n": "全部", "v": "" }, { "n": "周一", "v": "1" }, { "n": "周二", "v": "2" },
                { "n": "周三", "v": "3" }, { "n": "周四", "v": "4" }, { "n": "周五", "v": "5" },
                { "n": "周六", "v": "6" }, { "n": "周日", "v": "7" }
            ]}
        ]
    },
    filter_url: '',
    filter_def: '',
    play_parse: true,
    play_json: [],
    lazy: $js.toString(() => {
        // id 形如 http://cyc/ep/51384（伪URL前缀防纯数字 id 被 base64 误解码）
        var cycApi = 'https://www.cycani.org/api';
        var cycUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
        try {
            var m = String(input).match(/(\d+)\s*$/);
            var epId = m ? parseInt(m[1]) : null;

            if (!rule.cyc_user || !rule.cyc_pass) {
                input = { parse: 0, url: 'cyc:未配置账号——用编辑器打开规则文件，把 rule.cyc_user/rule.cyc_pass 填成你的次元城账号密码（官网 cycani.org 免费注册）', js: '' };
            } else {
                // 登录换 token（注意：返回的 token 自带 "Bearer " 前缀，请求时原样透传，勿再拼接）
                var loginRes = post(cycApi + '/auth/login', {
                    headers: {
                        'User-Agent': cycUa, 'X-App-Name': 'cyc_web', 'X-App-Version': 'cycweb',
                        'X-Time-Zone': 'Asia/Shanghai', 'Content-Type': 'application/json',
                        'Accept': 'application/json', 'Origin': 'https://www.cycani.org',
                        'Referer': 'https://www.cycani.org/login'
                    },
                    body: JSON.stringify({ username: rule.cyc_user, password: rule.cyc_pass }),
                    timeout: 20000
                });
                var loginData = null;
                try { loginData = typeof loginRes === 'string' ? JSON.parse(loginRes) : loginRes; } catch (e) { loginData = null; }
                var tk = (loginData && loginData.data && loginData.data.token) || null;
                if (!tk) {
                    input = { parse: 0, url: 'cyc:登录失败(' + ((loginData && loginData.msg) || '未知错误') + ')——检查规则 rule.cyc_user/rule.cyc_pass', js: '' };
                } else {
                    // play-url 是 GET（POST 会 404 路由不存在）
                    var playRes = fetch(cycApi + '/v2/sections/' + epId + '/play-url', {
                        headers: {
                            'User-Agent': cycUa, 'X-App-Name': 'cyc_web', 'X-App-Version': 'cycweb',
                            'X-Time-Zone': 'Asia/Shanghai', 'Authorization': tk,
                            'Accept': 'application/json', 'Origin': 'https://www.cycani.org',
                            'Referer': 'https://www.cycani.org/play/' + epId
                        },
                        timeout: 30000
                    });
                    var playData = null;
                    try { playData = typeof playRes === 'string' ? JSON.parse(playRes) : playRes; } catch (e) { playData = null; }
                    if (playData && playData.data && playData.data.url) {
                        input = { parse: 0, url: playData.data.url, js: '' };
                    } else if (playData && playData.msg) {
                        input = { parse: 0, url: 'cyc:' + playData.msg, js: '' };
                    } else {
                        input = { parse: 0, url: 'cyc:取播放地址失败(空响应)', js: '' };
                    }
                }
            }
        } catch (e) {
            input = { parse: 0, url: 'cyc:' + e.message, js: '' };
        }
    }),
    推荐: $js.toString(() => {
        // 官网首页推荐板块：TV番组 + 剧场版（/index/recommend）
        var cycApi = 'https://www.cycani.org/api';
        var cycHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'X-App-Name': 'cyc_web', 'X-App-Version': 'cycweb', 'X-Time-Zone': 'Asia/Shanghai',
            'Accept': 'application/json'
        };
        function cycRemarks(it) {
            var rk = it.remarks || '';
            var mm = String(rk).match(/^(\d+)\|/);
            if (mm) { return '更新至' + mm[1] + '集'; }
            return rk || ('总' + (it.total || '?') + '集');
        }
        var recRes = fetch(cycApi + '/index/recommend', { headers: cycHeaders, timeout: 20000 });
        var recData = null;
        try { recData = JSON.parse(recRes); } catch (e) { recData = null; }
        var vodList = [];
        if (recData && recData.code === 0 && recData.data && recData.data.list) {
            (recData.data.list || []).forEach(function(sec) {
                (sec.videos || []).forEach(function(it) {
                    vodList.push({
                        vod_id: String(it.video_id),
                        vod_name: it.title,
                        vod_pic: it.cover_url || '',
                        vod_remarks: cycRemarks(it),
                        vod_blurb: (it.description || '').substring(0, 100)
                    });
                });
            });
        }
        VODS = vodList;
    }),
    一级: $js.toString(() => {
        var cycApi = 'https://www.cycani.org/api';
        var cycHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'X-App-Name': 'cyc_web', 'X-App-Version': 'cycweb', 'X-Time-Zone': 'Asia/Shanghai',
            'Accept': 'application/json'
        };
        function cycRemarks(it) {
            var rk = it.remarks || '';
            var mm = String(rk).match(/^(\d+)\|/);
            if (mm) { return '更新至' + mm[1] + '集'; }
            return rk || ('总' + (it.total || '?') + '集');
        }
        var pg = MY_PAGE;
        var cate = MY_CATE;
        var FL = MY_FL || {};
        var vodList = [];

        if (cate === 'schedule') {
            // 周表：weekday=1..7，空=全周
            var wd = FL.周几;
            var wdRes = fetch(cycApi + '/index/weekday' + (wd ? '?weekday=' + wd : ''), { headers: cycHeaders, timeout: 20000 });
            var wdData = null;
            try { wdData = JSON.parse(wdRes); } catch (e) { wdData = null; }
            if (wdData && wdData.code === 0 && wdData.data && wdData.data.list) {
                (wdData.data.list || []).forEach(function(dayObj) {
                    var dayName = '周' + '一二三四五六日'.charAt(dayObj.weekday - 1);
                    (dayObj.videos || []).forEach(function(it) {
                        vodList.push({
                            vod_id: String(it.video_id),
                            vod_name: it.title,
                            vod_pic: it.cover_url || '',
                            vod_remarks: dayName + ' ' + cycRemarks(it),
                            vod_blurb: (it.description || '').substring(0, 100)
                        });
                    });
                });
            }
            VODS = vodList;
        } else if (cate === 'rank') {
            // 排行榜：rankId 1=TV 2=剧场，各 20 条无分页
            var rkId = FL.榜单 === '2' ? 2 : 1;
            var rkRes = fetch(cycApi + '/ranks/' + rkId + '/videos', { headers: cycHeaders, timeout: 20000 });
            var rkData = null;
            try { rkData = JSON.parse(rkRes); } catch (e) { rkData = null; }
            if (rkData && rkData.code === 0 && rkData.data && rkData.data.list) {
                var rIdx = 0;
                (rkData.data.list || []).forEach(function(it) {
                    rIdx += 1;
                    vodList.push({
                        vod_id: String(it.video_id),
                        vod_name: (rIdx <= 3 ? ('[' + rIdx + '] ') : '') + it.title,
                        vod_pic: it.cover_url || '',
                        vod_remarks: cycRemarks(it),
                        vod_blurb: (it.description || '').substring(0, 100)
                    });
                });
            }
            VODS = vodList;
        } else {
            // TV/剧场番组列表（zone_id 1/2）
            var zoneMap = { tv: 1, movie: 2 };
            var zoneId = zoneMap[cate] || 1;
            var parts = ['zone_id=' + zoneId, 'page=' + pg, 'page_size=24', 'order_by=' + (FL.排序 || 'update_time')];
            if (FL.分类) { parts.push('tag=' + encodeURIComponent(FL.分类)); }
            if (FL.年份 === 'older') { parts.push('year=lt.2000'); }
            else if (FL.年份) { parts.push('year=' + FL.年份); }
            var catRes = fetch(cycApi + '/videos?' + parts.join('&'), { headers: cycHeaders, timeout: 20000 });
            var catData = null;
            try { catData = JSON.parse(catRes); } catch (e) { catData = null; }
            if (catData && catData.code === 0 && catData.data && catData.data.list) {
                (catData.data.list || []).forEach(function(it) {
                    vodList.push({
                        vod_id: String(it.video_id),
                        vod_name: it.title,
                        vod_pic: it.cover_url || '',
                        vod_remarks: cycRemarks(it),
                        vod_blurb: (it.description || '').substring(0, 100)
                    });
                });
            }
            VODS = vodList;
        }
    }),
    二级: $js.toString(() => {
        var cycApi = 'https://www.cycani.org/api';
        var cycHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'X-App-Name': 'cyc_web', 'X-App-Version': 'cycweb', 'X-Time-Zone': 'Asia/Shanghai',
            'Accept': 'application/json'
        };
        var vid = String(orId || '').split('@@')[0].trim();
        // 详情
        var dRes = fetch(cycApi + '/videos/' + vid, { headers: cycHeaders, timeout: 20000 });
        var dData = null;
        try { dData = JSON.parse(dRes); } catch (e) { dData = null; }
        var vodObj = { vod_name: '未知', vod_pic: '', vod_play_from: '次元城', vod_play_url: '' };
        var playerCode = 'cychub';
        if (dData && dData.code === 0 && dData.data) {
            var info = dData.data;
            vodObj.vod_name = info.title;
            vodObj.vod_pic = info.cover_url;
            vodObj.vod_year = info.year ? String(info.year) : '';
            vodObj.vod_area = info.area || '日本';
            vodObj.vod_content = info.description || '';
            vodObj.vod_blurb = (info.description || '').substring(0, 100);
            vodObj.vod_director = (info.director || []).join(', ');
            vodObj.vod_actor = (info.actor || []).join(', ');
            vodObj.type_name = (info.tags || []).slice(0, 5).join('/');
            if (info.completed) {
                vodObj.vod_remarks = '完结 共' + (info.total || '?') + '集';
            } else {
                var mm = String(info.remarks || '').match(/^(\d+)\|/);
                vodObj.vod_remarks = mm ? ('更新至' + mm[1] + '集') : (info.remarks || '');
            }
            if (info.play_from && info.play_from.length > 0 && info.play_from[0].code) {
                playerCode = info.play_from[0].code;
            }
        }
        // 剧集列表（sections，page_size 上限 100，长番分两页拉）
        var sRes = fetch(cycApi + '/videos/' + vid + '/sections?player_code=' + playerCode + '&page=1&page_size=100', { headers: cycHeaders, timeout: 20000 });
        var sData = null;
        try { sData = JSON.parse(sRes); } catch (e) { sData = null; }
        var playUrls = [];
        if (sData && sData.code === 0 && sData.data) {
            var sList = sData.data.list || [];
            var hasMore = false;
            try {
                hasMore = !!(sData.data.pager && (sData.data.pager.page * sData.data.pager.page_size) < sData.data.pager.total);
            } catch (e) { hasMore = false; }
            if (hasMore) {
                var sRes2 = fetch(cycApi + '/videos/' + vid + '/sections?player_code=' + playerCode + '&page=2&page_size=100', { headers: cycHeaders, timeout: 20000 });
                var sData2 = null;
                try { sData2 = JSON.parse(sRes2); } catch (e) { sData2 = null; }
                if (sData2 && sData2.code === 0 && sData2.data && sData2.data.list) {
                    sList = sList.concat(sData2.data.list);
                }
            }
            sList.forEach(function(sec, si) {
                var nm = sec.title || ('第' + (si + 1) + '集');
                // 伪URL前缀：防纯数字 id 被引擎 base64 误解码
                playUrls.push(nm + '$http://cyc/ep/' + sec.id);
            });
        }
        vodObj.vod_play_url = playUrls.join('#');
        VOD = vodObj;
    }),
    搜索: $js.toString(() => {
        // 搜索必须带 zone_id（不带则空），TV+剧场双 zone 合并结果
        var cycApi = 'https://www.cycani.org/api';
        var cycHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'X-App-Name': 'cyc_web', 'X-App-Version': 'cycweb', 'X-Time-Zone': 'Asia/Shanghai',
            'Accept': 'application/json'
        };
        function cycRemarks(it) {
            var rk = it.remarks || '';
            var mm = String(rk).match(/^(\d+)\|/);
            if (mm) { return '更新至' + mm[1] + '集'; }
            return rk || ('总' + (it.total || '?') + '集');
        }
        var kw = KEY;
        var vodList = [];
        var zoneIds = [1, 2];
        zoneIds.forEach(function(zid) {
            var sRes = fetch(cycApi + '/videos/search?q=' + encodeURIComponent(kw) + '&zone_id=' + zid + '&page=1&page_size=24', { headers: cycHeaders, timeout: 20000 });
            var sData = null;
            try { sData = JSON.parse(sRes); } catch (e) { sData = null; }
            if (sData && sData.code === 0 && sData.data && sData.data.list) {
                (sData.data.list || []).forEach(function(it) {
                    vodList.push({
                        vod_id: String(it.video_id),
                        vod_name: (zid === 2 ? '[剧] ' : '') + it.title,
                        vod_pic: it.cover_url || '',
                        vod_remarks: cycRemarks(it),
                        vod_blurb: (it.description || '').substring(0, 100)
                    });
                });
            }
        });
        VODS = vodList;
    })
};
