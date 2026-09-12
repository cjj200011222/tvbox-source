// 咕咕番（gugu3.com）drpy 规则源
// 站点：www.gugu3.com（MacCMS V10 + Streamlab 模板，咕咕番弹幕播放器）
// 结构要点（2026-09-12 实测）：
// - 列表：/index.php/vod/type/id/{6|21|23}.html SSR 固定 32 条（无翻页）；
//   空词搜索 /index.php/vod/search.html（全站 4869 部按更新倒序，/page/{p} 可翻页）；
//   筛选走 /index.php/vod/search/year/{Y}/class/{C}/page/{P}.html（多维可组合，22 条/页）
//   注意：官方 /index.php/api/vod ajax 接口（key=md5('DS'+time+'DCC147D11943AF75')）服务端对所有请求一律回"非法请求"
//   （真实浏览器自身请求也被拒，站方接口当前是坏的），故不采用
// - 详情：/index.php/vod/detail/id/{N}.html（anthology-list 线路 tab + 剧集列表，meta description 带简介）
// - 播放：剧集链接 /index.php/vod/play/id/{id}/sid/{s}/nid/{n}.html → player_aaaa.url（vwnet-{md5} token）
//   → POST https://player.gugu3.com/admin/mizhi_json.php (url={token}&time={s}&key=&vkey=任意16hex)
//   → 返回 json.url = byteimg.com 伪装 .image 的 MP4 直链（免 Referer，Range 206 OK，x-expires 一年）
// - 剧集序号 nid 是"列表内序号"（1..N），海贼王新线 nid=1 对应第1146集（最新32集正序）；A线 0001 起全集正序
// ⚠️ 引擎约定（zyfun 实测）：函数体内顶层 return 非法（Illegal return statement），
//   输出必须用赋值：列表 VODS= / 详情 VOD= / 播放 input={parse,url,js}；变量避开 url/d/html 等引擎已占名
var rule = {
    title: '咕咕番',
    host: 'https://www.gugu3.com',
    url: '/index.php/vod/search/page/fypage@/wd/.html',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Referer': 'https://www.gugu3.com/'
    },
    timeout: 20000,
    class_name: '全部·最新更新&番剧&剧场版&特摄&2025年7月新番表&2025年4月新番表',
    class_url: 'all&6&21&23&t47&t46',
    play_parse: true,
    lazy: $js.toString(() => {
        var mm = String(input).match(/play\/(\d+)\/(\d+)\/(\d+)/);
        if (!mm) {
            input = { parse: 0, url: 'gg:无效播放链接', js: '' };
        } else {
            var vid = mm[1], sid = mm[2], nid = mm[3];
            var playPage = fetch('https://www.gugu3.com/index.php/vod/play/id/' + vid + '/sid/' + sid + '/nid/' + nid + '.html', { headers: rule.headers, timeout: 20000 });
            var mU = playPage ? String(playPage).match(/player_aaaa\s*=\s*\{[\s\S]*?"url"\s*:\s*"([^"]+)"/) : null;
            if (!mU) {
                input = { parse: 0, url: 'gg:未找到播放token', js: '' };
            } else {
                var token = mU[1];
                // POST mizhi_json 换 MP4 直链（vkey 服务端不校验，time 也宽松）
                var bodyStr = 'url=' + encodeURIComponent(token) + '&time=' + Math.floor(Date.now() / 1000) + '&key=&vkey=0123456789abcdef';
                var resp = post('https://player.gugu3.com/admin/mizhi_json.php', {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Referer': 'https://player.gugu3.com/'
                    },
                    body: bodyStr,
                    timeout: 30000
                });
                var j = null;
                try { j = JSON.parse(resp); } catch (e) { j = null; }
                if (!j || !j.url) {
                    input = { parse: 0, url: 'gg:直链解析失败(站方线路维护?)', js: '' };
                } else {
                    input = { parse: 0, url: j.url, js: '' };
                }
            }
        }
    }),
    推荐: $js.toString(() => {
        var vodList = [];
        var pageHtml = fetch('https://www.gugu3.com/', { headers: rule.headers, timeout: 20000 });
        if (pageHtml) {
            var items = rule.parseCards(pageHtml) || [];
            items.forEach(function (it) {
                if (vodList.length < 40) vodList.push(it);
            });
        }
        VODS = vodList;
    }),
    一级: $js.toString(() => {
        var vodList = [];
        var cate = String(MY_CATE);
        var pgNo = MY_PAGE || 1;
        var reqUrl = '';
        var parts = [];
        var hasFilter = false;
        if (MY_FL && MY_FL.year && MY_FL.year !== '') { parts.push('year/' + MY_FL.year); hasFilter = true; }
        if (MY_FL && MY_FL.class && MY_FL.class !== '') { parts.push('class/' + encodeURIComponent(MY_FL.class)); hasFilter = true; }
        if (cate === 'all') {
            if (hasFilter) {
                reqUrl = 'https://www.gugu3.com/index.php/vod/search/' + parts.join('/') + '/page/' + pgNo + '.html';
            } else {
                reqUrl = 'https://www.gugu3.com/index.php/vod/search/page/' + pgNo + '/wd/.html';
            }
        } else if (cate === 't47' || cate === 't46') {
            reqUrl = 'https://www.gugu3.com/index.php/topic/detail/id/' + cate.substring(1) + '.html';
        } else {
            reqUrl = 'https://www.gugu3.com/index.php/vod/type/id/' + cate + '.html';
        }
        var pageHtml = fetch(reqUrl, { headers: rule.headers, timeout: 20000 });
        if (pageHtml) {
            vodList = rule.parseCards(pageHtml) || [];
        }
        VODS = vodList;
    }),
    二级: $js.toString(() => {
        var vodObj = {};
        var pageHtml = fetch('https://www.gugu3.com/index.php/vod/detail/id/' + orId + '.html', { headers: rule.headers, timeout: 20000 });
        if (pageHtml) {
            var H = String(pageHtml);
            var mT = H.match(/<h3 class="slide-info-title hide">([^<]+)<\/h3>/);
            if (!mT) mT = H.match(/<title>《([^》]+)》/);
            vodObj.vod_name = mT ? mT[1].trim() : '';
            var mP = H.match(/class="detail-pic"[\s\S]*?data-src="([^"]+)"/);
            vodObj.vod_pic = mP ? mP[1] : '';
            var mR = H.match(/<span class="slide-info-remarks">([^<]+)<\/span>/);
            vodObj.vod_remarks = mR ? mR[1].trim() : '';
            var mY = H.match(/slide-info-remarks"><a href="[^"]*\/search\/year\/(\d+)\.html"/);
            vodObj.vod_year = mY ? mY[1] : '';
            var mA = H.match(/slide-info-remarks"><a href="[^"]*\/search\/area\/([^"]+)\.html"[^>]*>([^<]+)</);
            vodObj.vod_area = mA ? mA[2] : '';
            var cats = [];
            var catRe = /\/index\.php\/vod\/search\/class\/([^"]+)\.html"[^>]*>([^<]+)</g;
            var cm;
            while ((cm = catRe.exec(H)) !== null) { if (cats.indexOf(cm[2]) < 0) cats.push(cm[2]); }
            vodObj.type_name = cats.slice(0, 4).join(' ');
            var mD = H.match(/<strong class="cor6 r6">导演[^<]*<\/strong>([\s\S]*?)<\/div>/);
            if (mD) vodObj.vod_director = (mD[1].replace(/<[^>]+>/g, '/').replace(/\/+/g, '/').replace(/^\//, '').trim());
            var mAc = H.match(/<strong class="cor6 r6">主演[^<]*<\/strong>([\s\S]*?)<\/div>/);
            if (mAc) vodObj.vod_actor = (mAc[1].replace(/<[^>]+>/g, '/').replace(/\/+/g, '/').replace(/^\//, '').trim());
            // 简介：meta description 比 height_limit 更长，双取并选长
            var mDesc = H.match(/<meta name="description" content="([^"]*)"/);
            var mTxt = H.match(/<div id="height_limit" class="text cor3">([\s\S]*?)<\/div>/);
            var desc1 = mDesc ? mDesc[1].replace(/^[^：]*剧情介绍[:：]/, '').trim() : '';
            var desc2 = mTxt ? mTxt[1].replace(/<[^>]+>/g, '').trim() : '';
            var descTxt = desc1.length > desc2.length ? desc1 : (desc2 || desc1);
            vodObj.vod_content = descTxt;
            vodObj.vod_blurb = descTxt.substring(0, 100);
            // 剧集：线路 tab + anthology-list-box
            var tabs = [];
            var tabRe = /<a class="swiper-slide">(?:<i[^>]*><\/i>)?\s*&nbsp;([^<]+)<span class="badge">(\d+)<\/span>/g;
            var tm;
            while ((tm = tabRe.exec(H)) !== null) tabs.push(tm[1]);
            var boxes = [];
            var boxRe = /<div class="anthology-list-box[^"]*">([\s\S]*?)<\/div>\s*<\/div>/g;
            var bm;
            while ((bm = boxRe.exec(H)) !== null) boxes.push(bm[1]);
            var froms = [];
            var urls = [];
            for (var i = 0; i < boxes.length; i++) {
                var nm = (tabs[i] !== undefined) ? tabs[i] : ('线路' + (i + 1));
                var eps = [];
                var eRe = /<a class="hide" href="\/index\.php\/vod\/play\/id\/(\d+)\/sid\/(\d+)\/nid\/(\d+)\.html">([^<]+)<\/a>/g;
                var em;
                while ((em = eRe.exec(boxes[i])) !== null) {
                    eps.push(em[4] + '$http://gg/play/' + em[1] + '/' + em[2] + '/' + em[3]);
                }
                if (eps.length > 0) {
                    froms.push(nm);
                    urls.push(eps.join('#'));
                }
            }
            if (froms.length === 0) {
                // 兜底：全页扫 sid/nid 链接
                var eRe2 = /\/index\.php\/vod\/play\/id\/(\d+)\/sid\/(\d+)\/nid\/(\d+)\.html">([^<]+)<\/a>/g;
                var em2;
                var eps2 = [];
                while ((em2 = eRe2.exec(H)) !== null) {
                    eps2.push(em2[4] + '$http://gg/play/' + em2[1] + '/' + em2[2] + '/' + em2[3]);
                }
                if (eps2.length > 0) { froms.push('咕咕番'); urls.push(eps2.join('#')); }
            }
            vodObj.vod_play_from = froms.join('$$$');
            vodObj.vod_play_url = urls.join('$$$');
        }
        VOD = vodObj;
    }),
    搜索: $js.toString(() => {
        var vodList = [];
        var kw = KEY || input || '';
        var wd = encodeURIComponent(kw);
        var pgNo = MY_PAGE || 1;
        var pageHtml = fetch('https://www.gugu3.com/index.php/vod/search/wd/' + wd + '/page/' + pgNo + '.html', { headers: rule.headers, timeout: 20000 });
        if (pageHtml) {
            vodList = rule.parseCards(pageHtml) || [];
        }
        VODS = vodList;
    }),
    filter: {
        "all": [
            {"key": "year", "name": "年份", "value": [
                {"n": "全部", "v": ""},
                {"n": "2026", "v": "2026"},
                {"n": "2025", "v": "2025"},
                {"n": "2024", "v": "2024"},
                {"n": "2023", "v": "2023"},
                {"n": "2022", "v": "2022"},
                {"n": "2021", "v": "2021"},
                {"n": "2020", "v": "2020"},
                {"n": "2015", "v": "2015"},
                {"n": "2010", "v": "2010"},
                {"n": "2000", "v": "2000"}
            ]},
            {"key": "class", "name": "类型", "value": [
                {"n": "全部", "v": ""},
                {"n": "热血", "v": "热血"},
                {"n": "奇幻", "v": "奇幻"},
                {"n": "战斗", "v": "战斗"},
                {"n": "搞笑", "v": "搞笑"},
                {"n": "冒险", "v": "冒险"},
                {"n": "恋爱", "v": "恋爱"},
                {"n": "校园", "v": "校园"},
                {"n": "后宫", "v": "后宫"},
                {"n": "穿越", "v": "穿越"},
                {"n": "异世界", "v": "异世界"},
                {"n": "治愈", "v": "治愈"},
                {"n": "催泪", "v": "催泪"},
                {"n": "青春", "v": "青春"},
                {"n": "科幻", "v": "科幻"},
                {"n": "日常", "v": "日常"},
                {"n": "漫画改", "v": "漫画改"},
                {"n": "轻改", "v": "轻改"},
                {"n": "小说改", "v": "小说改"},
                {"n": "原创", "v": "原创"},
                {"n": "音乐", "v": "音乐"},
                {"n": "剧场版", "v": "剧场版"},
                {"n": "剧场电影", "v": "剧场电影"},
                {"n": "动漫电影", "v": "动漫电影"},
                {"n": "特摄", "v": "特摄"},
                {"n": "假面骑士", "v": "假面骑士"},
                {"n": "日漫番剧", "v": "日漫番剧"}
            ]}
        ]
    }
};

// 卡片解析器（挂在 rule 上，引擎 IIFE 下顶层 var 不跨函数可见）
rule.parseCards = function (html) {
    var out = [];
    var H = String(html);
    var seen = {};
    // 通用卡片：a.public-list-exp（type/搜索/topic 页通用）
    var re = /<a target="_self" class="public-list-exp" href="\/index\.php\/vod\/detail\/id\/(\d+)\.html" title="([^"]*)">[\s\S]*?data-src="([^"]+)"[\s\S]*?<\/a>/g;
    var m;
    while ((m = re.exec(H)) !== null) {
        var id1 = m[1];
        if (seen[id1]) continue;
        seen[id1] = 1;
        var seg = m[0];
        var rm = seg.match(/public-list-prb hide[^>]*>([^<]+)</) || seg.match(/public-list-subtitle[^>]*>([^<]+)</);
        out.push({
            vod_id: id1,
            vod_name: m[2] || ('影片' + id1),
            vod_pic: m[3],
            vod_remarks: rm ? rm[1].trim() : '',
            vod_blurb: ''
        });
    }
    // 搜索页（卡片标题在 thumb-txt）
    if (out.length === 0) {
        var reT = /<div class="thumb-txt cor4 hide">([^<]+)<\/div>/g;
        var titles = [];
        while ((m = reT.exec(H)) !== null) titles.push(m[1]);
        var reI = /<a target="_self" class="public-list-exp" href="\/index\.php\/vod\/detail\/id\/(\d+)\.html">([\s\S]*?)<\/a>/g;
        var idx = 0;
        while ((m = reI.exec(H)) !== null) {
            var id2 = m[1];
            if (seen[id2]) continue;
            seen[id2] = 1;
            var seg2 = m[0];
            var pm = seg2.match(/data-src="([^"]+)"/);
            var rm2 = seg2.match(/public-list-prb hide[^>]*>([^<]+)</);
            out.push({
                vod_id: id2,
                vod_name: titles[idx] || ('影片' + id2),
                vod_pic: pm ? pm[1] : '',
                vod_remarks: rm2 ? rm2[1].trim() : '',
                vod_blurb: ''
            });
            idx++;
        }
    }
    return out;
};
