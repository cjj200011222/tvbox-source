var rule = {
    title: '稀饭动漫',
    host: 'https://rzmsnqblptbceicadbyd.supabase.co',
    url: '/rest/v1/animes?select=id,title,cover_url&order=view_count.desc&limit=20&offset=fypage',
    searchUrl: '/rest/v1/rpc/search_animes',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    headers: {
        'User-Agent': 'MOBILE_UA',
        'apikey': 'sb_publishable_aCb7uwyLN6H-sMjze4dRGA_2MDuROLF',
        'Authorization': 'Bearer sb_publishable_aCb7uwyLN6H-sMjze4dRGA_2MDuROLF',
        'Content-Type': 'application/json'
    },
    timeout: 15000,
    // 仿官网板块：全部番剧 / 最近更新 / 排行榜 / 周表
    class_name: '全部番剧&最近更新&排行榜&周表',
    class_url: 'all&recent&rank&schedule',
    // 每个分类只挂官网该板块实际存在的筛选维度
    filter: {
        // 全部番剧(browse)：形式/状态/年份/标签/排序，默认按标题
        "all": [
            { "key": "形式", "name": "形式", "value": [
                { "n": "全部", "v": "" }, { "n": "TV动画", "v": "tv" },
                { "n": "剧场版", "v": "movie" }, { "n": "OVA", "v": "ova" },
                { "n": "OAD", "v": "oad" }, { "n": "Web动画", "v": "web" }, { "n": "其他", "v": "other" }
            ]},
            { "key": "状态", "name": "状态", "value": [
                { "n": "全部", "v": "" }, { "n": "连载中", "v": "0" }, { "n": "完结", "v": "1" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" }, { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" },
                { "n": "2024", "v": "2024" }, { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" },
                { "n": "2021", "v": "2021" }, { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" },
                { "n": "2018", "v": "2018" }, { "n": "2017", "v": "2017" }, { "n": "2016", "v": "2016" },
                { "n": "2015", "v": "2015" }, { "n": "更早", "v": "older" }
            ]},
            { "key": "标签", "name": "标签", "value": [
                { "n": "全部", "v": "" }, { "n": "漫画改", "v": "漫画改" }, { "n": "小说改", "v": "小说改" },
                { "n": "原创", "v": "原创" }, { "n": "游戏改", "v": "游戏改" }, { "n": "奇幻", "v": "奇幻" },
                { "n": "战斗", "v": "战斗" }, { "n": "恋爱", "v": "恋爱" }, { "n": "校园", "v": "校园" },
                { "n": "日常", "v": "日常" }, { "n": "后宫", "v": "后宫" }, { "n": "百合", "v": "百合" },
                { "n": "科幻", "v": "科幻" }, { "n": "冒险", "v": "冒险" }, { "n": "悬疑", "v": "悬疑" },
                { "n": "运动", "v": "运动" }, { "n": "机战", "v": "机战" }, { "n": "音乐", "v": "音乐" },
                { "n": "穿越", "v": "穿越" }, { "n": "喜剧", "v": "喜剧" }, { "n": "推理", "v": "推理" },
                { "n": "少女向", "v": "少女向" }, { "n": "少年向", "v": "少年向" }, { "n": "职场", "v": "职场" },
                { "n": "美食", "v": "美食" }, { "n": "青年向", "v": "青年向" }
            ]},
            { "key": "排序", "name": "排序", "value": [
                { "n": "标题", "v": "" }, { "n": "热度", "v": "view_count" },
                { "n": "评分", "v": "bangumi_score" }, { "n": "最新", "v": "release_date" }
            ]}
        ],
        // 最近更新(recent)：只有时间范围，按最新一集时间(updated_at)排序
        "recent": [
            { "key": "时间范围", "name": "时间范围", "value": [
                { "n": "7天", "v": "7" }, { "n": "14天", "v": "14" }, { "n": "30天", "v": "30" }, { "n": "全部", "v": "" }
            ]}
        ],
        // 排行榜(rankings)：5种榜单 × 5种分类（近似实现，后端未暴露对应RPC）
        "rank": [
            { "key": "榜单", "name": "榜单", "value": [
                { "n": "热度", "v": "trending" }, { "n": "评分", "v": "rating" },
                { "n": "飙升", "v": "rising" }, { "n": "宝藏", "v": "gem" }, { "n": "弹幕", "v": "danmaku" }
            ]},
            { "key": "范围", "name": "范围", "value": [
                { "n": "总榜", "v": "" }, { "n": "新番", "v": "ongoing" },
                { "n": "完结", "v": "finished" }, { "n": "剧场版", "v": "movie" }, { "n": "美漫", "v": "western" }
            ]}
        ],
        // 周表(schedule)：周几筛选（官网周一=0）
        "schedule": [
            { "key": "周几", "name": "周几", "value": [
                { "n": "全部", "v": "" }, { "n": "周一", "v": "0" }, { "n": "周二", "v": "1" },
                { "n": "周三", "v": "2" }, { "n": "周四", "v": "3" }, { "n": "周五", "v": "4" },
                { "n": "周六", "v": "5" }, { "n": "周日", "v": "6" }
            ]}
        ]
    },
    filter_url: "",
    filter_def: "",
    play_parse: true,
    lazy: $js.toString(() => {
        // id 形如 http://xf/ep/37416（伪URL前缀防止引擎把纯数字当base64解码成乱码）
        var m = String(input).match(/(\d+)\s*$/);
        var epId = m ? parseInt(m[1]) : null;
        var playApi = 'https://rzmsnqblptbceicadbyd.supabase.co/functions/v1/issue-web-playback';
        var playHeaders = {
            'apikey': 'sb_publishable_aCb7uwyLN6H-sMjze4dRGA_2MDuROLF',
            'Authorization': 'Bearer sb_publishable_aCb7uwyLN6H-sMjze4dRGA_2MDuROLF',
            'Content-Type': 'application/json',
            'Origin': 'https://next.xifanacg.com',
            'Referer': 'https://next.xifanacg.com/'
        };
        var playBody = JSON.stringify({ action: 'hls', episode_id: epId });
        // 单独放宽超时：该接口冷启动可能要 5 秒以上（引擎默认 5 秒会超时）
        var res = post(playApi, { headers: playHeaders, body: playBody, timeout: 30000 });
        var data = null;
        try {
            data = JSON.parse(res);
        } catch (e) {
            data = null;
        }
        if (data && data.url) {
            input = {
                parse: 0,
                url: data.url,
                js: ''
            };
        } else {
            input = { parse: 0, url: '', js: '' };
        }
    }),
    推荐: $js.toString(() => {
        // 仿官网首页"热乎の新番"：连载中按更新时间降序
        var reqUrl = 'https://rzmsnqblptbceicadbyd.supabase.co/rest/v1/animes?select=id,title,cover_url,bangumi_score,description,is_finished&is_finished=eq.0&order=updated_at.desc&limit=20';
        var reqHeaders = {
            'apikey': 'sb_publishable_aCb7uwyLN6H-sMjze4dRGA_2MDuROLF',
            'Authorization': 'Bearer sb_publishable_aCb7uwyLN6H-sMjze4dRGA_2MDuROLF'
        };
        var res = fetch(reqUrl, { headers: reqHeaders });
        var list = [];
        try { list = JSON.parse(res) || []; } catch (e) { list = []; }
        var vodList = [];
        (list || []).forEach(function(it) {
            vodList.push({
                vod_id: String(it.id),
                vod_name: it.title,
                vod_pic: it.cover_url || '',
                vod_remarks: '评分:' + (it.bangumi_score || '暂无'),
                vod_blurb: (it.description || '').substring(0, 100)
            });
        });
        VODS = vodList;
    }),
    一级: $js.toString(() => {
        var page = (MY_PAGE - 1) * 20;
        var cate = MY_CATE;
        var fl = MY_FL || {};
        var reqHeaders = {
            'apikey': 'sb_publishable_aCb7uwyLN6H-sMjze4dRGA_2MDuROLF',
            'Authorization': 'Bearer sb_publishable_aCb7uwyLN6H-sMjze4dRGA_2MDuROLF'
        };
        var parts = ['select=id,title,cover_url,total_episodes,current_episodes,is_finished,description,view_count,bangumi_score'];

        if (cate === 'schedule') {
            // 周表：按周几筛选，只看连载中（官网周一=0）
            parts.push('order=updated_at.desc');
            parts.push('is_finished=eq.0');
            if (fl.周几 === '0' || fl.周几 === '1' || fl.周几 === '2' || fl.周几 === '3' ||
                fl.周几 === '4' || fl.周几 === '5' || fl.周几 === '6') {
                parts.push('update_weekday=eq.' + fl.周几);
            }
        } else if (cate === 'all') {
            // 全部番剧：形式/状态/年份/标签/排序，默认标题
            var sortMap = {
                '': 'title.asc',
                'view_count': 'view_count.desc',
                'bangumi_score': 'bangumi_score.desc.nullslast',
                'release_date': 'release_date.desc'
            };
            parts.push('order=' + (sortMap[fl.排序] || 'title.asc'));
            if (fl.形式) { parts.push('format=eq.' + fl.形式); }
            if (fl.状态 === '0' || fl.状态 === '1') { parts.push('is_finished=eq.' + fl.状态); }
            if (fl.年份 === 'older') {
                parts.push('release_year=lt.2007');
            } else if (fl.年份) {
                parts.push('release_year=eq.' + fl.年份);
            }
            if (fl.标签) {
                parts.push('meta_tags=cs.%7B%22' + encodeURIComponent(fl.标签) + '%22%7D');
            }
        } else if (cate === 'recent') {
            // 最近更新：时间范围，按 updated_at
            parts.push('order=updated_at.desc');
            if (fl.时间范围 === '7' || fl.时间范围 === '14' || fl.时间范围 === '30') {
                var days = parseInt(fl.时间范围);
                var cutoff = new Date(Date.now() - days * 86400000).toISOString();
                parts.push('updated_at=gte.' + cutoff);
            }
        } else if (cate === 'rank') {
            // 排行榜：5种榜单 × 5种范围（近似）
            var kind = fl.榜单 || 'trending';
            var orderMap = {
                'trending': 'view_count.desc',
                'rating': 'bangumi_score.desc.nullslast',
                'rising': 'updated_at.desc',
                'gem': 'bangumi_rating_total.asc',
                'danmaku': 'view_count.desc'
            };
            parts.push('order=' + (orderMap[kind] || 'view_count.desc'));
            // 宝藏榜额外限制高分（近似"高分冷门"）
            if (kind === 'gem') { parts.push('bangumi_score=gte.8'); }
            // 范围过滤
            var range = fl.范围;
            if (range === 'ongoing') { parts.push('is_finished=eq.0'); }
            else if (range === 'finished') { parts.push('is_finished=eq.1'); }
            else if (range === 'movie') { parts.push('format=eq.movie'); }
            else if (range === 'western') { parts.push('type_id=eq.4'); }
        }

        parts.push('limit=20');
        parts.push('offset=' + page);

        var reqUrl = 'https://rzmsnqblptbceicadbyd.supabase.co/rest/v1/animes?' + parts.join('&');
        var res = fetch(reqUrl, { headers: reqHeaders });
        var list = [];
        try { list = JSON.parse(res) || []; } catch (e) { list = []; }
        var vodList = [];
        (list || []).forEach(function(it) {
            var remarks;
            if (it.is_finished) {
                remarks = '全' + (it.total_episodes || '?') + '集';
            } else {
                remarks = '更新至' + (it.current_episodes || '?') + '集';
            }
            vodList.push({
                vod_id: String(it.id),
                vod_name: it.title,
                vod_pic: it.cover_url || '',
                vod_remarks: remarks,
                vod_blurb: (it.description || '').substring(0, 100)
            });
        });
        VODS = vodList;
    }),
    二级: $js.toString(() => {
        var id = orId;
        var reqHeaders = {
            'apikey': 'sb_publishable_aCb7uwyLN6H-sMjze4dRGA_2MDuROLF',
            'Authorization': 'Bearer sb_publishable_aCb7uwyLN6H-sMjze4dRGA_2MDuROLF'
        };
        id = String(id || '').split('@@')[0].trim();
        var detailUrl2 = 'https://rzmsnqblptbceicadbyd.supabase.co/rest/v1/animes?id=eq.' + id + '&select=*';
        var detailRes = fetch(detailUrl2, { headers: reqHeaders });
        var detailArr = [];
        try {
            var detailParsed = JSON.parse(detailRes);
            if (Array.isArray(detailParsed)) { detailArr = detailParsed; }
        } catch (e) { detailArr = []; }
        var vodObj = {
            vod_name: '未知',
            vod_pic: '',
            vod_play_from: '稀饭专线',
            vod_play_url: ''
        };
        if (detailArr && detailArr.length > 0) {
            var info = detailArr[0];
            vodObj.vod_name = info.title;
            vodObj.vod_pic = info.cover_url;
            vodObj.vod_year = info.release_year ? info.release_year.toString() : '';
            vodObj.vod_area = info.region || '日本';
            vodObj.vod_content = info.description || '';
            vodObj.vod_blurb = (info.description || '').substring(0, 100);
            vodObj.vod_director = info.director || '';
            vodObj.vod_actor = (info.actors || []).join(',');
            vodObj.type_name = info.meta_tags ? info.meta_tags.join(',') : '动漫';
        }
        var epUrl2 = 'https://rzmsnqblptbceicadbyd.supabase.co/rest/v1/episodes?anime_id=eq.' + id + '&select=id,title,episode_number,kind&order=episode_number.asc';
        var epRes = fetch(epUrl2, { headers: reqHeaders });
        var epList = [];
        try {
            var epParsed = JSON.parse(epRes);
            if (Array.isArray(epParsed)) { epList = epParsed; }
        } catch (e) { epList = []; }
        var playUrls = [];
        epList.forEach(function(ep) {
            var name = '第' + ep.episode_number + '集';
            if (ep.title) { name += ' ' + ep.title; }
            // 伪URL前缀：防止引擎把纯数字 id 当 base64 解码成乱码
            playUrls.push(name + '$http://xf/ep/' + ep.id);
        });
        vodObj.vod_play_url = playUrls.join('#');
        VOD = vodObj;
    }),
    搜索: $js.toString(() => {
        var wd = KEY;
        var searchUrl2 = 'https://rzmsnqblptbceicadbyd.supabase.co/rest/v1/rpc/search_animes';
        var reqHeaders = {
            'apikey': 'sb_publishable_aCb7uwyLN6H-sMjze4dRGA_2MDuROLF',
            'Authorization': 'Bearer sb_publishable_aCb7uwyLN6H-sMjze4dRGA_2MDuROLF',
            'Content-Type': 'application/json'
        };
        var body = JSON.stringify({ search_term: wd, page_number: 1, items_per_page: 20 });
        var res = post(searchUrl2, { headers: reqHeaders, body: body });
        var list = [];
        try { list = JSON.parse(res) || []; } catch (e) { list = []; }
        var vodList = [];
        (list || []).forEach(function(it) {
            vodList.push({
                vod_id: String(it.id),
                vod_name: it.title,
                vod_pic: it.cover_url || '',
                vod_remarks: '年份:' + (it.release_year || ''),
                vod_blurb: (it.description || '').substring(0, 100)
            });
        });
        VODS = vodList;
    })
};
