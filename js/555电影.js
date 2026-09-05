var rule = {
    title: '555电影',
    host: 'https://www.555zxdy.cc',
    // 苹果CMS V10 (mxpro模板), 站群多域名(555zxdy.cc/555gy.cc同库)
    homeUrl: '/',
    url: '/vod/type/id/fyclass.html',
    // 站点 /vod/search/ 有强制图形验证码无法自动过, suggest 接口的数字id进不了详情页(404),
    // 故本源不支持搜索, 只做分类浏览
    searchable: 0,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    },
    timeout: 15000,
    // 分类=官网导航: /vod/type/id/{N}.html, 分页 /vod/type/id/{N}/page/{P}.html
    // 今日更新 /label/new.html 固定48条无分页
    class_name: '电影&剧集&动漫&综艺&短剧&体育&解说&今日更新',
    class_url: '1&2&3&4&45&39&40&new',
    play_parse: true,
    play_json: [],
    一级: $js.toString(() => {
        var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
        var vodList = [];
        // 站点分类页无分页参数(拼 page/筛选 均被兜底回第1页), 每类固定输出最新~96条
        if (MY_PAGE <= 1) {
            var reqUrl;
            if (MY_CATE === 'new') {
                reqUrl = 'https://www.555zxdy.cc/label/new.html';
            } else {
                reqUrl = 'https://www.555zxdy.cc/vod/type/id/' + MY_CATE + '.html';
            }
            var pageHtml = fetch(reqUrl, { headers: { 'User-Agent': UA } }) || '';
            // 卡片: <a href="/vod/detail/id/X.html" title="名" class="module-poster-item module-item">
            //   ...<div class="module-item-note">备注</div>...<img ... data-original="真图" ... src="占位gif">
            var re = /<a href="(\/vod\/detail\/id\/[^\/"]+\.html)" title="([^"]*)"[^>]*>[\s\S]{0,600}?<div class="module-item-note">([^<]*)<\/div>[\s\S]{0,600}?data-original="([^"]+)"/g;
            var mat;
            var seen = {};
            while ((mat = re.exec(pageHtml)) !== null) {
                if (!seen[mat[1]]) {
                    seen[mat[1]] = true;
                    var note = mat[3].trim();
                    vodList.push({
                        vod_id: 'https://www.555zxdy.cc' + mat[1],
                        vod_name: mat[2],
                        vod_pic: mat[4],
                        vod_remarks: note,
                        vod_blurb: note
                    });
                }
            }
        }
        VODS = vodList;
    }),
    二级: $js.toString(() => {
        var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
        var reqUrl = String(orId);
        if (!/^https?:\/\//.test(reqUrl)) { reqUrl = 'https://www.555zxdy.cc/vod/detail/id/' + reqUrl + '.html'; }
        var pageHtml = fetch(reqUrl, { headers: { 'User-Agent': UA } }) || '';
        var vodObj = {
            vod_id: reqUrl,
            vod_name: '',
            vod_pic: '',
            vod_play_from: '555电影',
            vod_play_url: ''
        };
        var m;
        m = pageHtml.match(/<h1[^>]*>([^<]+)<\/h1>/);
        if (m) { vodObj.vod_name = m[1].trim(); }
        m = pageHtml.match(/module-info-poster[\s\S]{0,500}?data-original="([^"]+)"/);
        if (m) { vodObj.vod_pic = m[1]; }
        // 元信息区: <span class="module-info-item-title">导演：</span><div ...>值</div>
        var infoRe = /<span[^>]*class="module-info-item-title"[^>]*>([^<]*)<\/span>([\s\S]{0,400}?)(?=<span[^>]*class="module-info-item-title"|<\/div>\s*<\/div>\s*<\/div>)/g;
        var im;
        while ((im = infoRe.exec(pageHtml)) !== null) {
            var k = im[1].replace('：', '').trim();
            var val = im[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (!val) { continue; }
            if (k === '导演') { vodObj.vod_director = val.replace(/\/$/, ''); }
            else if (k === '主演' || k === '声优') { vodObj.vod_actor = val.replace(/\/$/, ''); }
            else if (k === '年份') { vodObj.vod_year = val; }
            else if (k === '地区') { vodObj.vod_area = val; }
            else if (k === '类型' || k === '分类') { vodObj.type_name = val; }
            else if (k === '备注') { vodObj.vod_remarks = val; }
        }
        // 简介
        m = pageHtml.match(/module-info-introduction-content[^>]*>\s*<p>([\s\S]*?)<\/p>/);
        if (m) {
            var vDesc = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            vodObj.vod_content = vDesc;
            vodObj.vod_blurb = vDesc.substring(0, 100);
        }
        if (!vodObj.vod_content) {
            m = pageHtml.match(/<meta name="description" content="([\s\S]*?)">/);
            if (m) {
                var d2 = m[1].replace(/<[^>]+>/g, '').trim();
                var pi = d2.indexOf('剧情:');
                if (pi >= 0) { d2 = d2.substring(pi + 3).trim(); }
                vodObj.vod_content = d2;
                vodObj.vod_blurb = d2.substring(0, 100);
            }
        }
        // 线路tab: <div class="module-tab-item tab-item" data-dropdown-value="线路名">
        // 剧集panel: <a class="module-play-list-link" href="/vod/play/id/X/sid/S/nid/E.html" ...><span>集名</span>
        // 页面有重复渲染区, sid 按【首次出现序】去重后与 tab 顺序一一配对
        var tabs = [];
        var tre = /data-dropdown-value="([^"]+)"/g;
        var tm;
        while ((tm = tre.exec(pageHtml)) !== null) { tabs.push(tm[1].trim()); }
        var re = /href="(\/vod\/play\/id\/[^\/"]+\/sid\/(\d+)\/nid\/(\d+)\.html)"[^>]*>[\s\S]{0,200}?<span>([^<]*)<\/span>/g;
        var groups = [];   // [{sid, eps:[{name,url}]}] 按首次出现序
        var sidIdx = {};
        var em;
        while ((em = re.exec(pageHtml)) !== null) {
            var sid = em[2];
            if (sidIdx[sid] === undefined) {
                sidIdx[sid] = groups.length;
                groups.push({ sid: sid, eps: [] });
            }
            groups[sidIdx[sid]].eps.push({
                name: em[4].trim(),
                url: 'https://www.555zxdy.cc' + em[1]
            });
        }
        if (groups.length > 0) {
            var froms = [];
            var urls = [];
            groups.forEach(function (g, gi) {
                var lname = (tabs[gi] !== undefined) ? tabs[gi] : ('线路' + (gi + 1));
                froms.push(lname);
                var epArr = [];
                g.eps.forEach(function (ep) {
                    epArr.push(ep.name + '$' + ep.url);
                });
                urls.push(epArr.join('#'));
            });
            vodObj.vod_play_from = froms.join('$$$');
            vodObj.vod_play_url = urls.join('$$$');
        }
        VOD = vodObj;
    }),
    lazy: $js.toString(() => {
        // input = https://www.555zxdy.cc/vod/play/id/{短id}/sid/{S}/nid/{E}.html
        try {
            var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
            var playUrl = String(input);
            if (!/^https?:\/\//.test(playUrl)) { playUrl = 'https://www.555zxdy.cc/vod/play/id/' + playUrl + '.html'; }
            var pageHtml = fetch(playUrl, { headers: { 'User-Agent': UA } }) || '';
            // player_aaaa = {..., encrypt, url, from, ...}
            var um = pageHtml.match(/var player_aaaa\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/) || pageHtml.match(/player_aaaa\s*=\s*(\{[\s\S]*?\})\s*;/);
            if (!um) {
                input = { parse: 0, url: '555:未找到播放数据', js: '' };
            } else {
                var pd = {};
                try { pd = JSON.parse(um[1]); } catch (e) { pd = null; }
                if (!pd || !pd.url) {
                    input = { parse: 0, url: '555:播放数据为空', js: '' };
                } else {
                    var raw = pd.url;
                    var real = '';
                    var enc = parseInt(pd.encrypt || 0, 10);
                    if (enc === 2) {
                        // base64 -> urldecode
                        try {
                            var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                            var s1 = String(raw).replace(/[^A-Za-z0-9+\/=]/g, '');
                            var out = '';
                            for (var i = 0; i < s1.length; i += 4) {
                                var c1 = b64.indexOf(s1.charAt(i)), c2 = b64.indexOf(s1.charAt(i + 1));
                                var c3 = s1.charAt(i + 2) === '=' ? 0 : b64.indexOf(s1.charAt(i + 2));
                                var c4 = s1.charAt(i + 3) === '=' ? 0 : b64.indexOf(s1.charAt(i + 3));
                                var n = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;
                                out += String.fromCharCode((n >> 16) & 255);
                                if (s1.charAt(i + 2) !== '=') { out += String.fromCharCode((n >> 8) & 255); }
                                if (s1.charAt(i + 3) !== '=') { out += String.fromCharCode(n & 255); }
                            }
                            real = decodeURIComponent(out);
                        } catch (e2) { real = ''; }
                    } else if (enc === 1) {
                        try { real = base64Decode(raw); } catch (e3) { real = raw; }
                    } else {
                        real = raw;
                    }
                    if (/^https?:\/\//.test(real)) {
                        input = { parse: 0, url: real, js: '' };
                    } else if (/^https?:\/\//.test(raw)) {
                        input = { parse: 0, url: raw, js: '' };
                    } else {
                        input = { parse: 0, url: '555:解析失败(' + (pd.from || '未知线路') + ')', js: '' };
                    }
                }
            }
        } catch (e) {
            input = { parse: 0, url: '555:' + e.message, js: '' };
        }
    }),
    推荐: $js.toString(() => {
        // 首页各板块卡片(与分类页同构), 取前30条去重
        var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
        var pageHtml = fetch('https://www.555zxdy.cc/', { headers: { 'User-Agent': UA } }) || '';
        var vodList = [];
        var re = /<a href="(\/vod\/detail\/id\/[^\/"]+\.html)" title="([^"]*)"[^>]*>[\s\S]{0,600}?<div class="module-item-note">([^<]*)<\/div>[\s\S]{0,600}?data-original="([^"]+)"/g;
        var mat;
        var seen = {};
        while ((mat = re.exec(pageHtml)) !== null) {
            if (!seen[mat[1]] && vodList.length < 30) {
                seen[mat[1]] = true;
                var note = mat[3].trim();
                vodList.push({
                    vod_id: 'https://www.555zxdy.cc' + mat[1],
                    vod_name: mat[2],
                    vod_pic: mat[4],
                    vod_remarks: note,
                    vod_blurb: note
                });
            }
        }
        VODS = vodList;
    })
};
