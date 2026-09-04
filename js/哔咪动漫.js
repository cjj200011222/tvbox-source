var rule = {
    title: '哔咪动漫',
    host: 'https://www.bimiacg14.net',
    // 分类: 新番放送/大陆动漫/番组计划/剧场动画/番组2 (官网导航原始分类)
    homeUrl: '/',
    url: '/type/fyclass-fypage',
    searchUrl: '/index.php/ajax/suggest?mid=1&wd=**',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    },
    timeout: 15000,
    class_name: '新番放送&大陆动漫&番组计划&剧场动画&番组2',
    class_url: 'riman&guoman&fanzu&juchang&fanzu2',
    // 每个分类挂该分类筛选页(vodshow)实际存在的维度:
    // 格式 /vodshow/{id}-[排序]-[类型]-[字母]-[页码]-[周几]---[年代]/
    // 实测分页 URL: /vodshow/riman--------2---/ (页码在倒数第3格), 年代在末格
    filter: {
        "riman|guoman|fanzu|juchang|fanzu2": [
            { "key": "排序", "name": "排序", "value": [
                { "n": "默认", "v": "" }, { "n": "最热", "v": "hits" },
                { "n": "最近更新", "v": "time" }, { "n": "评分", "v": "score" }
            ]},
            { "key": "字母", "name": "字母", "value": [
                { "n": "全部", "v": "" }, { "n": "A", "v": "A" }, { "n": "B", "v": "B" },
                { "n": "C", "v": "C" }, { "n": "D", "v": "D" }, { "n": "E", "v": "E" },
                { "n": "F", "v": "F" }, { "n": "G", "v": "G" }, { "n": "H", "v": "H" },
                { "n": "I", "v": "I" }, { "n": "J", "v": "J" }, { "n": "K", "v": "K" },
                { "n": "L", "v": "L" }, { "n": "M", "v": "M" }, { "n": "N", "v": "N" },
                { "n": "O", "v": "O" }, { "n": "P", "v": "P" }, { "n": "Q", "v": "Q" },
                { "n": "R", "v": "R" }, { "n": "S", "v": "S" }, { "n": "T", "v": "T" },
                { "n": "U", "v": "U" }, { "n": "V", "v": "V" }, { "n": "W", "v": "W" },
                { "n": "X", "v": "X" }, { "n": "Y", "v": "Y" }, { "n": "Z", "v": "Z" }
            ]}
        ]
    },
    filter_url: '',
    filter_def: {},
    play_parse: true,
    play_json: [],
    // vodshow URL 12格: id-排序-类型-字母-页码-周几---年代
    // 注意排序/类型/周几有值时需 URL 编码(中文)
    一级: $js.toString(() => {
        // /type/ 路径无 WAF (vodshow 路径有 GoEdge WAF, 密集请求会触发滑块)
        // 格式: /type/{id}-{page}/ 分页, /type/{id}/by/{order}/ 排序, /type/{id}/letter/{L} 字母
        var cate = MY_CATE;
        var page = MY_PAGE;
        var FL = MY_FL || {};
        var by = FL.排序 || '';
        var letter = FL.字母 || '';
        var reqUrl = 'https://www.bimiacg14.net/type/' + cate + '/';
        if (by && page > 1) { reqUrl = 'https://www.bimiacg14.net/type/' + cate + '-' + page + '/by/' + by + '/'; }
        else if (by) { reqUrl = 'https://www.bimiacg14.net/type/' + cate + '/by/' + by + '/'; }
        else if (letter) { reqUrl = 'https://www.bimiacg14.net/type/' + cate + '/letter/' + letter + '/'; }
        else if (page > 1) { reqUrl = 'https://www.bimiacg14.net/type/' + cate + '-' + page + '/'; }
        var pageHtml = fetch(reqUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' } }) || '';
        var vodList = [];
        // 列表结构: <li class="item"><a href="/bangumi/bi/38755/" title="xx" class="img"><img ... data-original>
        //   <span class="mask"><p>导演：xx</p></span></a><div class="info"><a>title</a><p title="更新至09话"><span class="fl">xx</span></p>
        var re = /<a href="\/bangumi\/bi\/(\d+)\/"[^>]*title="([^"]*)"[^>]*class="img"><img[^>]*?(?:data-original|src)="([^"]+)"[^>]*\/><span class="mask"><p>([^<]*)<\/p>[\s\S]*?<p title="([^"]*)"><span class="fl">([^<]*)<\/span><\/p>/g;
        var mat;
        while ((mat = re.exec(pageHtml)) !== null) {
            vodList.push({
                vod_id: mat[1],
                vod_name: mat[2],
                vod_pic: mat[3],
                vod_remarks: mat[6] || mat[5] || '',
                vod_blurb: ''
            });
        }
        VODS = vodList;
    }),
    二级: $js.toString(() => {
        var vodId = orId;
        vodId = String(vodId || '').split('@@')[0].trim();
        var reqUrl = 'https://www.bimiacg14.net/bangumi/bi/' + vodId + '/';
        var pageHtml = fetch(reqUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' } }) || '';
        var vodObj = {
            vod_id: vodId,
            vod_name: '',
            vod_pic: '',
            vod_play_from: '哔咪线路',
            vod_play_url: ''
        };
        // 标题
        var tm = pageHtml.match(/<h1>([^<]+)<\/h1>/);
        if (tm) { vodObj.vod_name = tm[1].trim(); }
        // 封面
        var pm = pageHtml.match(/class="v_pic"><img[^>]*(?:data-original|src)="([^"]+)"/);
        if (pm) { vodObj.vod_pic = pm[1]; }
        // 元信息: 开播/年份/地区/语言/导演
        var ym = pageHtml.match(/开播：<\/em>(\d{4})-\d{2}-\d{2}/);
        if (ym) { vodObj.vod_year = ym[1]; }
        var am = pageHtml.match(/地区：<\/em><a[^>]*>([^<]+)<\/a>/);
        if (am) { vodObj.vod_area = am[1].trim(); }
        var dm = pageHtml.match(/导演：<\/em>(?:<[^>]+>)?<a[^>]*>([^<]+)<\/a>/);
        if (dm) { vodObj.vod_director = dm[1].trim(); }
        else {
            var dm2 = pageHtml.match(/导演：<\/em>([^<]+)</);
            if (dm2) { vodObj.vod_director = dm2[1].trim(); }
        }
        var vm = pageHtml.match(/声优：<\/em>([^<]+)</);
        if (vm) { vodObj.vod_actor = vm[1].trim(); }
        // 状态
        var sm = pageHtml.match(/<em class="em_num">([^<]+)<\/em>/);
        // 类型标签
        var tags = [];
        var tre = /em_tit">类型：<\/em>([\s\S]*?)<\/li>/;
        var tagm = pageHtml.match(tre);
        if (tagm) {
            var tagList = tagm[1].match(/>([^<>]+)</g) || [];
            tagList.forEach(function(t) {
                var t2 = t.replace(/[<>]/g, '').trim();
                if (t2 && t2 !== '类型：') { tags.push(t2); }
            });
        }
        if (tags.length > 0) { vodObj.type_name = tags.join(','); }
        // 简介
        var cm = pageHtml.match(/id="synopsis_txt">([\s\S]*?)<\/p><\/li>/);
        if (cm) {
            var vDesc = cm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            vodObj.vod_content = vDesc;
            vodObj.vod_blurb = vDesc.substring(0, 100);
        }
        // 剧集: <li><a href="/bangumi/38755/play/1/1/">第01话</a></li>
        var playUrls = [];
        // 只取第一个 play_box(show=主线路,aliplay 可播); 第二组是"客户端专用"(rrys)站方播放器404废线
        var boxMatch = pageHtml.match(/<div class="play_box show">[\s\S]*?(?=<div class="play_box|<div class="tuiguang)/);
        var playSeg = boxMatch ? boxMatch[0] : pageHtml;
        var ere = /href="\/bangumi\/(\d+)\/play\/(\d+)\/(\d+)\/"[^>]*>([^<]+)</g;
        var emat;
        var seen = {};
        while ((emat = ere.exec(playSeg)) !== null) {
            var playKey = emat[2] + '-' + emat[3];
            if (!seen[playKey]) {
                seen[playKey] = true;
                // 伪 URL 前缀防引擎 base64 误解码
                playUrls.push(emat[4].trim() + '$https://www.bimiacg14.net/bangumi/' + emat[1] + '/play/' + emat[2] + '/' + emat[3] + '/');
            }
        }
        vodObj.vod_play_url = playUrls.join('#');
        VOD = vodObj;
    }),
    lazy: $js.toString(() => {
        // input = https://www.bimiacg14.net/bangumi/{id}/play/{sid}/{nid}/
        try {
            var pm = String(input).match(/\/bangumi\/(\d+)\/play\/(\d+)\/(\d+)\//);
            if (!pm) {
                input = { parse: 0, url: 'bimi:无效播放链接', js: '' };
            } else {
                var playUrl = 'https://www.bimiacg14.net' + pm[0];
                var pageHtml = fetch(playUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' } }) || '';
                // player_aaaa 里 url 字段是 token, from 是线路
                var um = pageHtml.match(/var player_aaaa=\{[^}]*"url":"([^"]+)"/);
                var fm = pageHtml.match(/var player_aaaa=\{[^}]*"from":"([^"]+)"/);
                if (!um) {
                    input = { parse: 0, url: 'bimi:未找到播放数据', js: '' };
                } else {
                    var token = um[1];
                    // token 经 play.php 换取真实 m3u8
                    var phpUrl = 'https://www.bimiacg14.net/static/danmu/play.php?url=' + token;
                    var phpHtml = fetch(phpUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' } }) || '';
                    var mm = phpHtml.match(/var\s+url\s*=\s*'([^']+)'/);
                    if (mm && /^https?:\/\//.test(mm[1])) {
                        input = { parse: 0, url: mm[1], js: '' };
                    } else {
                        // 备用: source 标签里也可能有
                        var sm2 = phpHtml.match(/<source\s+src="([^"]+)"/);
                        if (sm2 && /^https?:\/\//.test(sm2[1])) {
                            input = { parse: 0, url: sm2[1], js: '' };
                        } else {
                            input = { parse: 0, url: 'bimi:解析失败(线路未就绪?)', js: '' };
                        }
                    }
                }
            }
        } catch (e) {
            input = { parse: 0, url: 'bimi:' + e.message, js: '' };
        }
    }),
    搜索: $js.toString(() => {
        // suggest 接口免验证码, /vod/search/ 有验证码不可用
        var wd = KEY;
        var reqUrl = 'https://www.bimiacg14.net/index.php/ajax/suggest?mid=1&wd=' + encodeURIComponent(wd);
        var resText = fetch(reqUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' } }) || '';
        var data = null;
        try { data = JSON.parse(resText); } catch (e) { data = null; }
        var vodList = [];
        if (data && data.code === 1 && Array.isArray(data.list)) {
            data.list.forEach(function(it) {
                vodList.push({
                    vod_id: String(it.id),
                    vod_name: it.name || '',
                    vod_pic: it.pic || '',
                    vod_remarks: '',
                    vod_blurb: ''
                });
            });
        }
        VODS = vodList;
    }),
    推荐: $js.toString(() => {
        // 首页今日热播板块
        var reqUrl = 'https://www.bimiacg14.net/';
        var pageHtml = fetch(reqUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' } }) || '';
        var vodList = [];
        // 首页卡片: <a href="/bangumi/bi/38719/" title="xx" class="item-cover"><div class="lazy-img"><img ... data-original="url"
        var re = /<a href="\/bangumi\/bi\/(\d+)\/"[^>]*title="([^"]*)"[^>]*class="item-cover"><div class="lazy-img"><img[^>]*?(?:data-original|src)="([^"]+)"/g;
        var mat;
        var seen = {};
        while ((mat = re.exec(pageHtml)) !== null) {
            if (!seen[mat[1]] && vodList.length < 20) {
                seen[mat[1]] = true;
                vodList.push({
                    vod_id: mat[1],
                    vod_name: mat[2],
                    vod_pic: mat[3],
                    vod_remarks: '',
                    vod_blurb: ''
                });
            }
        }
        VODS = vodList;
    })
};
