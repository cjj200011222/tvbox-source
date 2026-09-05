var rule = {
    title: '去看吧动漫',
    host: 'https://www.qkan8.com',
    // 苹果CMS(vfed模板) + Cloudflare，备用域名 k8dm.com / qkan9.com
    homeUrl: '/',
    url: '/index.php/vod/show/id/fyclass.html',
    searchUrl: '/index.php/vod/search/wd/**.html',
    searchable: 2,
    quickSearch: 1,
    filterable: 1,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    },
    timeout: 15000,
    // 官网导航原始分类
    class_name: '日漫&国语动漫&劇場&高清原碟&女频&日韩剧&美漫',
    class_url: '21&20&24&33&50&43&22',
    // 筛选页 /vod/show/ 实际存在的维度, 每分类按官网该分类自身挂载:
    // URL 模板 /index.php/vod/show/class/{C}/area/{A}/year/{Y}/by/{B}/id/{id}/page/{p}.html (维度可任意省略)
    filter: {
        "21": [
            {"key": "类型", "name": "类型", "value": [
                {"n": "全部", "v": ""}, {"n": "热血", "v": "热血"}, {"n": "恋爱", "v": "恋爱"},
                {"n": "搞笑", "v": "搞笑"}, {"n": "冒险", "v": "冒险"}, {"n": "战斗", "v": "战斗"},
                {"n": "奇幻", "v": "奇幻"}, {"n": "科幻", "v": "科幻"}, {"n": "校园", "v": "校园"},
                {"n": "治愈", "v": "治愈"}, {"n": "百合", "v": "百合"}, {"n": "后宫", "v": "后宫"},
                {"n": "机战", "v": "机战"}, {"n": "竞技", "v": "竞技"}, {"n": "运动", "v": "运动"},
                {"n": "魔法", "v": "魔法"}, {"n": "美少女", "v": "美少女"}, {"n": "萝莉", "v": "萝莉"},
                {"n": "亲子", "v": "亲子"}, {"n": "催泪", "v": "催泪"}, {"n": "励志", "v": "励志"},
                {"n": "历史", "v": "历史"}, {"n": "推理", "v": "推理"}, {"n": "猎奇", "v": "猎奇"},
                {"n": "伪娘", "v": "伪娘"}, {"n": "经典", "v": "经典"}, {"n": "青春", "v": "青春"}
            ]},
            {"key": "地区", "name": "地区", "value": [
                {"n": "全部", "v": ""}, {"n": "日本", "v": "日本"}, {"n": "大陆", "v": "大陆"},
                {"n": "美国", "v": "美国"}, {"n": "韩国", "v": "韩国"}, {"n": "法国", "v": "法国"},
                {"n": "英国", "v": "英国"}, {"n": "泰国", "v": "泰国"}, {"n": "西班牙", "v": "西班牙"},
                {"n": "俄罗斯", "v": "俄罗斯"}, {"n": "加拿大", "v": "加拿大"}, {"n": "印度", "v": "印度"},
                {"n": "新加坡", "v": "新加坡"}, {"n": "马来西亚", "v": "马来西亚"}, {"n": "其它", "v": "其它"}
            ]},
            {"key": "年份", "name": "年份", "value": [
                {"n": "全部", "v": ""}, {"n": "2026", "v": "2026"}, {"n": "2025", "v": "2025"},
                {"n": "2024", "v": "2024"}, {"n": "2023", "v": "2023"}, {"n": "2022", "v": "2022"},
                {"n": "2021", "v": "2021"}, {"n": "2020", "v": "2020"}, {"n": "2019", "v": "2019"},
                {"n": "2018", "v": "2018"}, {"n": "2017", "v": "2017"}, {"n": "2016", "v": "2016"},
                {"n": "2015", "v": "2015"}, {"n": "2014", "v": "2014"}, {"n": "2013", "v": "2013"},
                {"n": "2012", "v": "2012"}, {"n": "2011", "v": "2011"}, {"n": "2010", "v": "2010"},
                {"n": "00年代", "v": "2000"}, {"n": "更早", "v": "1998"}
            ]},
            {"key": "排序", "name": "排序", "value": [
                {"n": "默认", "v": ""}, {"n": "最近更新", "v": "time"},
                {"n": "最热", "v": "hits"}, {"n": "评分", "v": "score"}
            ]}
        ],
        "20": [
            {"key": "类型", "name": "类型", "value": [
                {"n": "全部", "v": ""}, {"n": "热血", "v": "热血"}, {"n": "搞笑", "v": "搞笑"},
                {"n": "冒险", "v": "冒险"}, {"n": "动作", "v": "动作"}, {"n": "机战", "v": "机战"},
                {"n": "少年", "v": "少年"}, {"n": "少女", "v": "少女"}, {"n": "情感", "v": "情感"},
                {"n": "科幻", "v": "科幻"}, {"n": "校园", "v": "校园"}, {"n": "推理", "v": "推理"},
                {"n": "益智", "v": "益智"}, {"n": "亲子", "v": "亲子"}, {"n": "萝莉", "v": "萝莉"},
                {"n": "运动", "v": "运动"}, {"n": "社会", "v": "社会"}, {"n": "战争", "v": "战争"},
                {"n": "原创", "v": "原创"}, {"n": "其他", "v": "其他"}
            ]},
            {"key": "地区", "name": "地区", "value": [
                {"n": "全部", "v": ""}, {"n": "中国大陆", "v": "中国大陆"}, {"n": "国产", "v": "国产"}
            ]},
            {"key": "年份", "name": "年份", "value": [
                {"n": "全部", "v": ""}, {"n": "2019", "v": "2019"}, {"n": "2018", "v": "2018"},
                {"n": "2017", "v": "2017"}, {"n": "2016", "v": "2016"}, {"n": "2015", "v": "2015"},
                {"n": "2014", "v": "2014"}, {"n": "2013", "v": "2013"}, {"n": "2012", "v": "2012"},
                {"n": "2011", "v": "2011"}, {"n": "2010", "v": "2010"},
                {"n": "00年代", "v": "2000"}, {"n": "更早", "v": "20"}
            ]},
            {"key": "排序", "name": "排序", "value": [
                {"n": "默认", "v": ""}, {"n": "最近更新", "v": "time"},
                {"n": "最热", "v": "hits"}, {"n": "评分", "v": "score"}
            ]}
        ],
        "24": [
            {"key": "类型", "name": "类型", "value": [
                {"n": "全部", "v": ""}, {"n": "热血", "v": "热血"}, {"n": "恋爱", "v": "恋爱"},
                {"n": "搞笑", "v": "搞笑"}, {"n": "冒险", "v": "冒险"}, {"n": "战斗", "v": "战斗"},
                {"n": "奇幻", "v": "奇幻"}, {"n": "科幻", "v": "科幻"}, {"n": "校园", "v": "校园"},
                {"n": "治愈", "v": "治愈"}, {"n": "百合", "v": "百合"}, {"n": "后宫", "v": "后宫"},
                {"n": "机战", "v": "机战"}, {"n": "竞技", "v": "竞技"}, {"n": "运动", "v": "运动"},
                {"n": "魔法", "v": "魔法"}, {"n": "美少女", "v": "美少女"}, {"n": "萝莉", "v": "萝莉"},
                {"n": "亲子", "v": "亲子"}, {"n": "催泪", "v": "催泪"}, {"n": "励志", "v": "励志"},
                {"n": "历史", "v": "历史"}, {"n": "推理", "v": "推理"}, {"n": "猎奇", "v": "猎奇"},
                {"n": "伪娘", "v": "伪娘"}, {"n": "经典", "v": "经典"}, {"n": "青春", "v": "青春"}
            ]},
            {"key": "地区", "name": "地区", "value": [
                {"n": "全部", "v": ""}, {"n": "日本", "v": "日本"}, {"n": "大陆", "v": "大陆"},
                {"n": "美国", "v": "美国"}, {"n": "韩国", "v": "韩国"}, {"n": "法国", "v": "法国"},
                {"n": "英国", "v": "英国"}, {"n": "泰国", "v": "泰国"}, {"n": "西班牙", "v": "西班牙"},
                {"n": "俄罗斯", "v": "俄罗斯"}, {"n": "加拿大", "v": "加拿大"}, {"n": "印度", "v": "印度"},
                {"n": "新加坡", "v": "新加坡"}, {"n": "马来西亚", "v": "马来西亚"}, {"n": "其它", "v": "其它"}
            ]},
            {"key": "年份", "name": "年份", "value": [
                {"n": "全部", "v": ""}, {"n": "2025", "v": "2025"}, {"n": "2024", "v": "2024"},
                {"n": "2023", "v": "2023"}, {"n": "2022", "v": "2022"}, {"n": "2021", "v": "2021"},
                {"n": "2020", "v": "2020"}, {"n": "2019", "v": "2019"}, {"n": "2018", "v": "2018"},
                {"n": "2017", "v": "2017"}, {"n": "2016", "v": "2016"}, {"n": "2015", "v": "2015"},
                {"n": "00年代", "v": "2000"}, {"n": "更早", "v": "1998"}
            ]},
            {"key": "排序", "name": "排序", "value": [
                {"n": "默认", "v": ""}, {"n": "最近更新", "v": "time"},
                {"n": "最热", "v": "hits"}, {"n": "评分", "v": "score"}
            ]}
        ],
        "33": [
            {"key": "类型", "name": "类型", "value": [
                {"n": "全部", "v": ""}, {"n": "热血", "v": "热血"}, {"n": "恋爱", "v": "恋爱"},
                {"n": "搞笑", "v": "搞笑"}, {"n": "冒险", "v": "冒险"}, {"n": "战斗", "v": "战斗"},
                {"n": "奇幻", "v": "奇幻"}, {"n": "科幻", "v": "科幻"}, {"n": "校园", "v": "校园"},
                {"n": "治愈", "v": "治愈"}, {"n": "百合", "v": "百合"}, {"n": "后宫", "v": "后宫"},
                {"n": "机战", "v": "机战"}, {"n": "竞技", "v": "竞技"}, {"n": "运动", "v": "运动"},
                {"n": "魔法", "v": "魔法"}, {"n": "美少女", "v": "美少女"}, {"n": "萝莉", "v": "萝莉"},
                {"n": "亲子", "v": "亲子"}, {"n": "催泪", "v": "催泪"}, {"n": "励志", "v": "励志"},
                {"n": "历史", "v": "历史"}, {"n": "推理", "v": "推理"}, {"n": "猎奇", "v": "猎奇"},
                {"n": "伪娘", "v": "伪娘"}, {"n": "经典", "v": "经典"}, {"n": "青春", "v": "青春"}
            ]},
            {"key": "年份", "name": "年份", "value": [
                {"n": "全部", "v": ""}, {"n": "2026", "v": "2026"}, {"n": "2025", "v": "2025"},
                {"n": "2024", "v": "2024"}, {"n": "2023", "v": "2023"}, {"n": "2022", "v": "2022"},
                {"n": "2021", "v": "2021"}, {"n": "2020", "v": "2020"}, {"n": "2019", "v": "2019"},
                {"n": "2018", "v": "2018"}, {"n": "2017", "v": "2017"}, {"n": "2016", "v": "2016"},
                {"n": "2015", "v": "2015"}, {"n": "00年代", "v": "2000"}, {"n": "更早", "v": "1998"}
            ]},
            {"key": "排序", "name": "排序", "value": [
                {"n": "默认", "v": ""}, {"n": "最近更新", "v": "time"},
                {"n": "最热", "v": "hits"}, {"n": "评分", "v": "score"}
            ]}
        ],
        "50": [
            {"key": "类型", "name": "类型", "value": [
                {"n": "全部", "v": ""}, {"n": "热血", "v": "热血"}, {"n": "恋爱", "v": "恋爱"},
                {"n": "搞笑", "v": "搞笑"}, {"n": "冒险", "v": "冒险"}, {"n": "战斗", "v": "战斗"},
                {"n": "奇幻", "v": "奇幻"}, {"n": "科幻", "v": "科幻"}, {"n": "校园", "v": "校园"},
                {"n": "治愈", "v": "治愈"}, {"n": "百合", "v": "百合"}, {"n": "后宫", "v": "后宫"},
                {"n": "机战", "v": "机战"}, {"n": "竞技", "v": "竞技"}, {"n": "运动", "v": "运动"},
                {"n": "魔法", "v": "魔法"}, {"n": "美少女", "v": "美少女"}, {"n": "萝莉", "v": "萝莉"},
                {"n": "亲子", "v": "亲子"}, {"n": "催泪", "v": "催泪"}, {"n": "励志", "v": "励志"},
                {"n": "历史", "v": "历史"}, {"n": "推理", "v": "推理"}, {"n": "猎奇", "v": "猎奇"},
                {"n": "伪娘", "v": "伪娘"}, {"n": "经典", "v": "经典"}, {"n": "青春", "v": "青春"}
            ]},
            {"key": "地区", "name": "地区", "value": [
                {"n": "全部", "v": ""}, {"n": "日本", "v": "日本"}, {"n": "大陆", "v": "大陆"},
                {"n": "美国", "v": "美国"}, {"n": "韩国", "v": "韩国"}, {"n": "法国", "v": "法国"},
                {"n": "英国", "v": "英国"}, {"n": "泰国", "v": "泰国"}, {"n": "西班牙", "v": "西班牙"},
                {"n": "俄罗斯", "v": "俄罗斯"}, {"n": "加拿大", "v": "加拿大"}, {"n": "印度", "v": "印度"},
                {"n": "新加坡", "v": "新加坡"}, {"n": "马来西亚", "v": "马来西亚"}, {"n": "其它", "v": "其它"}
            ]},
            {"key": "年份", "name": "年份", "value": [
                {"n": "全部", "v": ""}, {"n": "2023", "v": "2023"}, {"n": "2022", "v": "2022"},
                {"n": "2021", "v": "2021"}, {"n": "2020", "v": "2020"}, {"n": "2019", "v": "2019"},
                {"n": "2018", "v": "2018"}, {"n": "2017", "v": "2017"}, {"n": "2016", "v": "2016"},
                {"n": "2015", "v": "2015"}, {"n": "00年代", "v": "2000"}, {"n": "更早", "v": "1998"}
            ]},
            {"key": "排序", "name": "排序", "value": [
                {"n": "默认", "v": ""}, {"n": "最近更新", "v": "time"},
                {"n": "最热", "v": "hits"}, {"n": "评分", "v": "score"}
            ]}
        ],
        "43": [
            {"key": "类型", "name": "类型", "value": [
                {"n": "全部", "v": ""}, {"n": "热血", "v": "热血"}, {"n": "搞笑", "v": "搞笑"},
                {"n": "冒险", "v": "冒险"}, {"n": "动作", "v": "动作"}, {"n": "机战", "v": "机战"},
                {"n": "少年", "v": "少年"}, {"n": "少女", "v": "少女"}, {"n": "情感", "v": "情感"},
                {"n": "科幻", "v": "科幻"}, {"n": "校园", "v": "校园"}, {"n": "推理", "v": "推理"},
                {"n": "益智", "v": "益智"}, {"n": "亲子", "v": "亲子"}, {"n": "萝莉", "v": "萝莉"},
                {"n": "运动", "v": "运动"}, {"n": "社会", "v": "社会"}, {"n": "战争", "v": "战争"},
                {"n": "原创", "v": "原创"}, {"n": "其他", "v": "其他"}
            ]},
            {"key": "地区", "name": "地区", "value": [
                {"n": "全部", "v": ""}, {"n": "日本", "v": "日本"}, {"n": "大陆", "v": "大陆"},
                {"n": "美国", "v": "美国"}, {"n": "韩国", "v": "韩国"}, {"n": "法国", "v": "法国"},
                {"n": "英国", "v": "英国"}, {"n": "泰国", "v": "泰国"}, {"n": "西班牙", "v": "西班牙"},
                {"n": "俄罗斯", "v": "俄罗斯"}, {"n": "加拿大", "v": "加拿大"}, {"n": "印度", "v": "印度"},
                {"n": "新加坡", "v": "新加坡"}, {"n": "马来西亚", "v": "马来西亚"}, {"n": "其它", "v": "其它"}
            ]},
            {"key": "年份", "name": "年份", "value": [
                {"n": "全部", "v": ""}, {"n": "2020", "v": "2020"}, {"n": "2019", "v": "2019"},
                {"n": "2018", "v": "2018"}, {"n": "2017", "v": "2017"}, {"n": "2016", "v": "2016"},
                {"n": "2015", "v": "2015"}, {"n": "2014", "v": "2014"}, {"n": "2013", "v": "2013"},
                {"n": "2012", "v": "2012"}, {"n": "2011", "v": "2011"}, {"n": "2010", "v": "2010"},
                {"n": "00年代", "v": "2000"}, {"n": "更早", "v": "1998"}
            ]},
            {"key": "排序", "name": "排序", "value": [
                {"n": "默认", "v": ""}, {"n": "最近更新", "v": "time"},
                {"n": "最热", "v": "hits"}, {"n": "评分", "v": "score"}
            ]}
        ],
        "22": [
            {"key": "类型", "name": "类型", "value": [
                {"n": "全部", "v": ""}, {"n": "热血", "v": "热血"}, {"n": "恋爱", "v": "恋爱"},
                {"n": "搞笑", "v": "搞笑"}, {"n": "冒险", "v": "冒险"}, {"n": "战斗", "v": "战斗"},
                {"n": "奇幻", "v": "奇幻"}, {"n": "科幻", "v": "科幻"}, {"n": "校园", "v": "校园"},
                {"n": "治愈", "v": "治愈"}, {"n": "百合", "v": "百合"}, {"n": "后宫", "v": "后宫"},
                {"n": "机战", "v": "机战"}, {"n": "竞技", "v": "竞技"}, {"n": "运动", "v": "运动"},
                {"n": "魔法", "v": "魔法"}, {"n": "美少女", "v": "美少女"}, {"n": "萝莉", "v": "萝莉"},
                {"n": "亲子", "v": "亲子"}, {"n": "催泪", "v": "催泪"}, {"n": "励志", "v": "励志"},
                {"n": "历史", "v": "历史"}, {"n": "推理", "v": "推理"}, {"n": "猎奇", "v": "猎奇"},
                {"n": "伪娘", "v": "伪娘"}, {"n": "经典", "v": "经典"}, {"n": "青春", "v": "青春"}
            ]},
            {"key": "地区", "name": "地区", "value": [
                {"n": "全部", "v": ""}, {"n": "日本", "v": "日本"}, {"n": "欧美", "v": "欧美"}, {"n": "其他", "v": "其他"}
            ]},
            {"key": "年份", "name": "年份", "value": [
                {"n": "全部", "v": ""}, {"n": "2025", "v": "2025"}, {"n": "2024", "v": "2024"},
                {"n": "2023", "v": "2023"}, {"n": "2022", "v": "2022"}, {"n": "2021", "v": "2021"},
                {"n": "2020", "v": "2020"}, {"n": "2019", "v": "2019"}, {"n": "2018", "v": "2018"},
                {"n": "2017", "v": "2017"}, {"n": "2016", "v": "2016"}, {"n": "2015", "v": "2015"},
                {"n": "00年代", "v": "2000"}, {"n": "更早", "v": "1998"}
            ]},
            {"key": "排序", "name": "排序", "value": [
                {"n": "默认", "v": ""}, {"n": "最近更新", "v": "time"},
                {"n": "最热", "v": "hits"}, {"n": "评分", "v": "score"}
            ]}
        ]
    },
    filter_url: '',
    filter_def: {},
    play_parse: true,
    play_json: [],
    一级: $js.toString(() => {
        // 官网筛选页 /vod/show/ 维度可组合(实测): class/{C}/area/{A}/year/{Y}/by/{B}/id/{id}/page/{p}.html
        var cate = MY_CATE;
        var page = MY_PAGE;
        var FL = MY_FL || {};
        var segs = [];
        if (FL.类型) { segs.push('class/' + encodeURIComponent(FL.类型)); }
        if (FL.地区) { segs.push('area/' + encodeURIComponent(FL.地区)); }
        if (FL.年份) { segs.push('year/' + FL.年份); }
        if (FL.排序) { segs.push('by/' + FL.排序); }
        segs.push('id/' + cate);
        if (page > 1) { segs.push('page/' + page); }
        var reqUrl = 'https://www.qkan8.com/index.php/vod/show/' + segs.join('/') + '.html';
        var pageHtml = fetch(reqUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' } }) || '';
        var vodList = [];
        // vfed 卡片: <li class="fed-list-item ..."><a class="fed-list-pics..." href="/index.php/vod/detail/id/N.html" data-original="pic">
        //   <span class="fed-list-remarks...">更新至第X集</span></a><a class="fed-list-title...">标题</a><span class="fed-list-desc...">声优</span></li>
        var blocks = pageHtml.split('<li class="fed-list-item');
        blocks.shift();
        var seen = {};
        blocks.forEach(function(b) {
            b = b.split('</li>')[0];
            var idm = b.match(/href="\/index\.php\/vod\/detail\/id\/(\d+)\.html"/);
            if (!idm || seen[idm[1]]) { return; }
            seen[idm[1]] = true;
            var pm = b.match(/(?:data-original|src)="([^"]+)"/);
            var rm = b.match(/fed-list-remarks[^>]*>([^<]*)</);
            var ti = b.match(/fed-list-title[^>]*>([\s\S]*?)<\/a>/);
            var de = b.match(/fed-list-desc[^>]*>([^<]*)</);
            vodList.push({
                vod_id: idm[1],
                vod_name: ti ? ti[1].replace(/<[^>]+>/g, '').trim() : '',
                vod_pic: pm ? pm[1] : '',
                vod_remarks: rm ? rm[1].trim() : '',
                vod_blurb: de ? de[1].trim() : ''
            });
        });
        VODS = vodList;
    }),
    二级: $js.toString(() => {
        var vodId = String(orId || '').trim();
        var reqUrl = 'https://www.qkan8.com/index.php/vod/detail/id/' + vodId + '.html';
        var pageHtml = fetch(reqUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' } }) || '';
        var vodObj = {
            vod_id: vodId,
            vod_name: '',
            vod_pic: '',
            vod_play_from: '去看吧',
            vod_play_url: ''
        };
        // 标题/封面/备注 (详情头图块)
        var tm = pageHtml.match(/<h1 class="fed-part-eone[^>]*><a[^>]*>([\s\S]*?)<\/a><\/h1>/);
        if (tm) { vodObj.vod_name = tm[1].replace(/<[^>]+>/g, '').trim(); }
        var pm = pageHtml.match(/fed-deta-images[\s\S]*?(?:data-original|src)="([^"]+)"/);
        if (pm) { vodObj.vod_pic = pm[1]; }
        var rm = pageHtml.match(/fed-deta-images[\s\S]*?fed-list-remarks[^>]*>([^<]*)</);
        if (rm) { vodObj.vod_remarks = rm[1].trim(); }
        // 元信息块
        var am = pageHtml.match(/声优：<\/span>([\s\S]*?)<\/li>/);
        if (am) { vodObj.vod_actor = am[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim(); }
        var dm = pageHtml.match(/导演：<\/span>([\s\S]*?)<\/li>/);
        if (dm) { vodObj.vod_director = dm[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim(); }
        var cm = pageHtml.match(/分类：<\/span><a[^>]*>([^<]+)<\/a>/);
        if (cm) { vodObj.type_name = cm[1].trim(); }
        var am2 = pageHtml.match(/地区：<\/span>([\s\S]*?)<\/li>/);
        if (am2) { vodObj.vod_area = am2[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim(); }
        var ym = pageHtml.match(/年份：<\/span>(?:<a[^>]*>)?(\d{4})/);
        if (ym) { vodObj.vod_year = ym[1]; }
        // 简介(站方在详情页即截断, 官网也只有这些)
        var dsm = pageHtml.match(/fed-part-esan[^>]*>[\s\S]*?简介：<\/span>([\s\S]*?)<\/div>/);
        if (dsm) {
            var vDesc = dsm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            vodObj.vod_content = vDesc;
            vodObj.vod_blurb = vDesc.substring(0, 100);
        }
        // 线路名(fed-play-btns 顺序即 fed-play-item 块顺序): 重名线路加序号保证唯一
        var names = [];
        var nre = /fed-play-btns[^>]*>\s*<a[^>]*>([^<]+)<\/a>/g;
        var nm;
        while ((nm = nre.exec(pageHtml)) !== null) { names.push(nm[1].trim()); }
        // 剧集块: <div class="fed-play-item ..."> 内含该线路全部集数锚点
        var blocks = pageHtml.split('<div class="fed-play-item');
        blocks.shift();
        var fromArr = [];
        var urlArr = [];
        blocks.forEach(function(b, idx) {
            var lineName = (names[idx] || ('线路' + (idx + 1)));
            if (fromArr.indexOf(lineName) >= 0) { lineName = lineName + (idx + 1); }
            var eps = [];
            var ere = /href="\/index\.php\/vod\/play\/id\/(\d+)\/sid\/(\d+)\/nid\/(\d+)\.html"[^>]*>([^<]+)</g;
            var em;
            var seenNid = {};
            while ((em = ere.exec(b)) !== null) {
                var epName = em[4].trim();
                if (epName === '立即播放') { continue; }
                if (seenNid[em[3]]) { continue; }
                seenNid[em[3]] = true;
                // 完整播放页 URL 作 id (含 http, 引擎不会误 base64 解码)
                eps.push(epName + '$https://www.qkan8.com/index.php/vod/play/id/' + em[1] + '/sid/' + em[2] + '/nid/' + em[3] + '.html');
            }
            if (eps.length > 0) {
                fromArr.push(lineName);
                urlArr.push(eps.join('#'));
            }
        });
        vodObj.vod_play_from = fromArr.join('$$$');
        vodObj.vod_play_url = urlArr.join('$$$');
        VOD = vodObj;
    }),
    lazy: $js.toString(() => {
        // input = https://www.qkan8.com/index.php/vod/play/id/{vid}/sid/{s}/nid/{n}.html
        // 播放页 iframe data-play = 3字符前缀 + base64(m3u8直链), 5条线路同构, 免 referer
        try {
            var pm = String(input).match(/\/index\.php\/vod\/play\/id\/\d+\/sid\/\d+\/nid\/\d+\.html/);
            if (!pm) {
                input = { parse: 0, url: 'qkan:无效播放链接', js: '' };
            } else {
                var pageHtml = fetch('https://www.qkan8.com' + pm[0], { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' } }) || '';
                var dpm = pageHtml.match(/data-play="([^"]+)"/);
                var real = '';
                if (dpm && dpm[1].length > 8) {
                    // 自实现 base64 解码(纯 ASCII 输出), 不依赖引擎 base64Decode 的宽字符行为
                    var T = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
                    var s = dpm[1].substring(3).replace(/[^A-Za-z0-9+\/=]/g, '');
                    var out = '', bits = 0, acc = 0;
                    for (var i = 0; i < s.length; i++) {
                        var c = T.indexOf(s.charAt(i));
                        if (c < 0 || c === 64) { continue; }
                        acc = (acc << 6) | c;
                        bits += 6;
                        if (bits >= 8) { bits -= 8; out += String.fromCharCode((acc >> bits) & 0xff); }
                    }
                    real = out;
                }
                if (!/^https?:\/\//.test(real)) {
                    // 备用: iframe src 直带 url= 参数
                    var im = pageHtml.match(/<iframe[^>]*src="[^"]*(?:\?|&)url=([^"&]+)/);
                    if (im) { real = decodeURIComponent(im[1]); }
                }
                if (/^https?:\/\//.test(real)) {
                    input = { parse: 0, url: real, js: '' };
                } else {
                    input = { parse: 0, url: 'qkan:解析失败(资源未就绪?)', js: '' };
                }
            }
        } catch (e) {
            input = { parse: 0, url: 'qkan:' + e.message, js: '' };
        }
    }),
    搜索: $js.toString(() => {
        // 搜索页无验证码(不同于哔咪), 结果为 fed-deta-* 详情式卡片, 10条/页(取首页足够)
        var wd = encodeURIComponent(KEY || '');
        var reqUrl = 'https://www.qkan8.com/index.php/vod/search/wd/' + wd + '.html';
        var pageHtml = fetch(reqUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' } }) || '';
        var vodList = [];
        var blocks = pageHtml.split('fed-deta-images');
        blocks.shift();
        var seen = {};
        blocks.forEach(function(b) {
            var idm = b.match(/href="\/index\.php\/vod\/detail\/id\/(\d+)\.html"/);
            if (!idm || seen[idm[1]]) { return; }
            seen[idm[1]] = true;
            var pm = b.match(/(?:data-original|src)="([^"]+)"/);
            var rm = b.match(/fed-list-remarks[^>]*>([^<]*)</);
            // 标题在后续 fed-deta-content 的 h1 里(含关键词高亮 span, 剥标签)
            var ti = b.match(/<h1[^>]*><a[^>]*>([\s\S]*?)<\/a><\/h1>/);
            var ym = b.match(/年份：<\/span>(?:<a[^>]*>)?(\d{4})/);
            vodList.push({
                vod_id: idm[1],
                vod_name: ti ? ti[1].replace(/<[^>]+>/g, '').trim() : '',
                vod_pic: pm ? pm[1] : '',
                vod_remarks: (rm ? rm[1].trim() : '') + (ym ? ' · ' + ym[1] : ''),
                vod_blurb: ''
            });
        });
        VODS = vodList;
    }),
    推荐: $js.toString(() => {
        // 首页各板块卡片, 取前 30 去重
        var reqUrl = 'https://www.qkan8.com/';
        var pageHtml = fetch(reqUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' } }) || '';
        var vodList = [];
        var blocks = pageHtml.split('<li class="fed-list-item');
        blocks.shift();
        var seen = {};
        blocks.forEach(function(b) {
            if (vodList.length >= 30) { return; }
            b = b.split('</li>')[0];
            var idm = b.match(/href="\/index\.php\/vod\/detail\/id\/(\d+)\.html"/);
            if (!idm || seen[idm[1]]) { return; }
            seen[idm[1]] = true;
            var pm = b.match(/(?:data-original|src)="([^"]+)"/);
            var rm = b.match(/fed-list-remarks[^>]*>([^<]*)</);
            var ti = b.match(/fed-list-title[^>]*>([\s\S]*?)<\/a>/);
            vodList.push({
                vod_id: idm[1],
                vod_name: ti ? ti[1].replace(/<[^>]+>/g, '').trim() : '',
                vod_pic: pm ? pm[1] : '',
                vod_remarks: rm ? rm[1].trim() : '',
                vod_blurb: ''
            });
        });
        VODS = vodList;
    })
};
