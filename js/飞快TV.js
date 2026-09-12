/**
 * 飞快TV drpy 源（feikuai.in）
 * 站点：苹果CMS V10 魔改版（mxprocms 模板）+ 开放标准采集接口 /api.php/provide/vod/
 * 结论：全站走 JSON 接口，无需任何 HTML 解析，也无需登录 / 无 WAF（12 连发全 200）
 *
 * 接口速查（ac= 动作）：
 *   - 列表/一级：/api.php/provide/vod/?ac=detail&t={type_id}&pg={page}
 *       ⚠️ 必须用 ac=detail，不能用 ac=list —— 本站魔改后 ac=list 会剥掉所有图片字段
 *          （vod_pic / vod_pic_display_url 全空），只有 ac=detail 才带 vod_pic
 *   - 搜索：    /api.php/provide/vod/?ac=detail&wd={关键词}&pg={page}
 *   - 详情：    /api.php/provide/vod/?ac=detail&ids={vod_id}（返回单条完整数据）
 *   - 最近更新：/api.php/provide/vod/?ac=detail&h=24&pg={page}（h=最近 N 小时）
 *   - 无参：     /api.php/provide/vod/?ac=detail&pg=1（全站按 vod_time 倒序）
 *
 * 关键实测：
 *   - 父类型不聚合子类！t=1(电影) 只有 4 条，t=2(剧集) 9 条 —— 分类必须用「叶子 type_id」
 *   - order 参数无效（time/hits/score 结果相同），默认就是 vod_time 倒序
 *   - 多线路：vod_play_from 用 $$$ 分隔，vod_play_url 同构；本站线路全是 m3u8 直链
 *     （ffm3u8/bfzym3u8/dyttm3u8/1080zyk/rym3u8/mtm3u8/modum3u8/wsym3u8/zuidam3u8…）
 *   - 播放直链免 Referer 免头可直接播（curl 实测 HTTP 200 application/vnd.apple.mpegurl）
 *   - 图片 vod_pic 为站内相对路径 /upload/...，需拼 host；直连 200 正常
 *
 * 引擎注意：函数体内禁用 url/res/fl/name/html 等引擎变量名；顶层 return 非法须 if 包裹
 */
var rule = {
    title: '飞快TV',
    host: 'https://feikuai.in',
    // 说明性模板（实际请求在一级/搜索函数里手动拼参数）
    url: '/api.php/provide/vod/?ac=detail&t=fyclass&pg=fypage',
    searchUrl: '/api.php/provide/vod/?ac=detail&wd=**&pg=fypage',
    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    },
    timeout: 15000,
    // 分类=官网叶子类型（父类型无内容，见文件头说明）；"最近更新"走 h=24
    class_name: '最近更新&电影·喜剧&电影·动作&电影·科幻&电影·爱情&电影·战争&电影·恐怖&电影·剧情&剧集·内地&剧集·港台&剧集·日韩&剧集·欧美&剧集·短剧&综艺·大陆&综艺·港台&综艺·日韩&综艺·欧美&综艺·记录&动漫·国漫&动漫·港台&动漫·日韩&动漫·欧美',
    class_url: 'new&6&7&8&9&10&11&12&13&14&15&16&32&20&21&23&22&34&25&26&27&28',
    play_parse: true,
    play_json: [],
    推荐: $js.toString(() => {
        // 首页推荐：全站按 vod_time 倒序取前 30
        var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
        var reqUrl = 'https://feikuai.in/api.php/provide/vod/?ac=detail&pg=1';
        var list = [];
        try {
            var raw = fetch(reqUrl, { headers: { 'User-Agent': UA }, timeout: 20000 }) || '';
            var obj = JSON.parse(raw);
            list = (obj && obj.list) || [];
        } catch (e) { list = []; }
        var vodList = [];
        list.forEach(function (x) {
            if (vodList.length >= 30) { return; }
            var pic = rule.pickPic(x);
            var blurb = String(x.vod_blurb || x.vod_content || '').replace(/\s+/g, ' ').trim();
            vodList.push({
                vod_id: String(x.vod_id),
                vod_name: x.vod_name || '',
                vod_pic: pic,
                vod_remarks: x.vod_remarks || '',
                vod_year: x.vod_year || '',
                vod_blurb: blurb ? blurb.substring(0, 100) : (x.type_name || '')
            });
        });
        VODS = vodList;
    }),
    一级: $js.toString(() => {
        var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
        var cate = String(MY_CATE);
        var pg = MY_PAGE || 1;
        var reqUrl;
        if (cate === 'new') {
            reqUrl = 'https://feikuai.in/api.php/provide/vod/?ac=detail&h=24&pg=' + pg;
        } else {
            reqUrl = 'https://feikuai.in/api.php/provide/vod/?ac=detail&t=' + cate + '&pg=' + pg;
        }
        var list = [];
        try {
            var raw = fetch(reqUrl, { headers: { 'User-Agent': UA }, timeout: 20000 }) || '';
            var obj = JSON.parse(raw);
            list = (obj && obj.list) || [];
        } catch (e) { list = []; }
        var vodList = [];
        list.forEach(function (x) {
            var pic = rule.pickPic(x);
            var blurb = String(x.vod_blurb || x.vod_content || '').replace(/\s+/g, ' ').trim();
            vodList.push({
                vod_id: String(x.vod_id),
                vod_name: x.vod_name || '',
                vod_pic: pic,
                vod_remarks: x.vod_remarks || '',
                vod_year: x.vod_year || '',
                vod_blurb: blurb ? blurb.substring(0, 100) : (x.type_name || '')
            });
        });
        VODS = vodList;
    }),
    二级: $js.toString(() => {
        var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
        var vid = String(orId).replace(/[^0-9]/g, '');
        var reqUrl = 'https://feikuai.in/api.php/provide/vod/?ac=detail&ids=' + vid;
        var vodObj = {
            vod_id: vid,
            vod_name: '',
            vod_pic: '',
            vod_play_from: '',
            vod_play_url: ''
        };
        // 采集线路代码 → 中文名（未收录的原样显示）
        var nameMap = {
            'ffm3u8': '非凡资源',
            'bfzym3u8': '暴风资源',
            'dyttm3u8': '电影天堂',
            '1080zyk': '1080资源',
            'rym3u8': '如意资源',
            'mtm3u8': '茅台资源',
            'modum3u8': '魔都资源',
            'wsym3u8': '卧龙资源',
            'zuidam3u8': '最大资源',
            'wjm3u8': '无尽资源'
        };
        try {
            var raw = fetch(reqUrl, { headers: { 'User-Agent': UA }, timeout: 20000 }) || '';
            var obj = JSON.parse(raw);
            var it = (obj && obj.list && obj.list[0]) || null;
            if (it) {
                vodObj.vod_name = it.vod_name || '';
                var pic = rule.pickPic(it);
                vodObj.vod_pic = pic;
                vodObj.vod_year = it.vod_year || '';
                vodObj.vod_area = it.vod_area || '';
                vodObj.vod_lang = it.vod_lang || '';
                vodObj.vod_actor = it.vod_actor || '';
                vodObj.vod_director = it.vod_director || '';
                vodObj.vod_remarks = it.vod_remarks || '';
                vodObj.type_name = it.type_name || '';
                var desc = String(it.vod_content || it.vod_blurb || '').replace(/\s+/g, ' ').trim();
                vodObj.vod_content = desc;
                vodObj.vod_blurb = desc.substring(0, 100);
                // 线路名映射后原样透传（vod_play_url 本身就是 name$url#... 的 TVBox 格式）
                var froms = String(it.vod_play_from || '').split('$$$').map(function (f) {
                    return nameMap[f] || f;
                });
                vodObj.vod_play_from = froms.join('$$$');
                vodObj.vod_play_url = it.vod_play_url || '';
            }
        } catch (e) { }
        VOD = vodObj;
    }),
    搜索: $js.toString(() => {
        var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
        var kw = String(KEY || '').trim();
        var list = [];
        if (kw) {
            var reqUrl = 'https://feikuai.in/api.php/provide/vod/?ac=detail&wd=' + encodeURIComponent(kw) + '&pg=' + (MY_PAGE || 1);
            try {
                var raw = fetch(reqUrl, { headers: { 'User-Agent': UA }, timeout: 20000 }) || '';
                var obj = JSON.parse(raw);
                list = (obj && obj.list) || [];
            } catch (e) { list = []; }
        }
        var vodList = [];
        list.forEach(function (x) {
            var pic = rule.pickPic(x);
            var blurb = String(x.vod_blurb || x.vod_content || '').replace(/\s+/g, ' ').trim();
            vodList.push({
                vod_id: String(x.vod_id),
                vod_name: x.vod_name || '',
                vod_pic: pic,
                vod_remarks: x.vod_remarks || '',
                vod_year: x.vod_year || '',
                vod_blurb: blurb ? blurb.substring(0, 100) : (x.type_name || '')
            });
        });
        VODS = vodList;
    }),
    lazy: $js.toString(() => {
        // 本站 vod_play_url 直接给 m3u8 直链，无需二次解析
        try {
            var playUrl = String(input);
            // 电影天堂线(vip.dytt-tvs.com)在部分网络下 https TLS 握手失败，降级 http（http 实测同样 200）
            if (/dytt-tvs\.com/.test(playUrl)) { playUrl = playUrl.replace(/^https:/, 'http:'); }
            if (/^https?:\/\//.test(playUrl)) {
                input = {
                    parse: 0,
                    url: playUrl,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' }
                };
            } else {
                input = { parse: 0, url: '飞快TV:无效播放地址', js: '' };
            }
        } catch (e) {
            input = { parse: 0, url: '飞快TV:' + e.message, js: '' };
        }
    })
};

/**
 * 封面选取（挂 rule 全局，供各函数体调用 —— 引擎 IIFE 下顶层变量不跨函数可见）
 * 优先级：站内本地缓存(vod_pic_local_url，实测 100% 覆盖且 200) > 直链 vod_pic > display
 * 跳过站方 img.php 代理（已失效 404）与豆瓣直连（防盗链）
 */
rule.pickPic = function (x) {
    var cands = [x.vod_pic_local_url, x.vod_pic, x.vod_pic_display_url, x.vod_pic_remote_url];
    for (var i = 0; i < cands.length; i++) {
        var c = String(cands[i] || '').trim();
        if (!c) { continue; }
        if (c.indexOf('img.php') >= 0 || c.indexOf('doubanio') >= 0) { continue; }
        if (c.indexOf('http') !== 0) { c = 'https://feikuai.in' + c; }
        return c;
    }
    return '';
};
