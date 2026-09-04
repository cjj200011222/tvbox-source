var rule = {
    title: '樱之空动漫',
    host: 'https://www.skr2.cc',
    url: '/vodshow/fyclass-----------',
    searchUrl: '/vodsearch/**-------------',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    headers: {
        'User-Agent': 'MOBILE_UA'
    },
    timeout: 15000,
    class_parse: '',
    // 仿官网首页板块：桜漫/日漫/国漫/美漫 + 影视板块
    class_name: '桜漫&日漫&国漫&美漫&电影&综艺&短剧&大陆剧&港台剧&海外剧',
    class_url: '1&46&47&85&84&91&92&81&82&83',
    filter: {
        "1": [
            { "key": "排序", "name": "排序", "value": [
                { "n": "按最新", "v": "time" }, { "n": "按最热", "v": "hits" },
                { "n": "按评分", "v": "score" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" }, { "n": "当季", "v": "@season=1" }, { "n": "上季", "v": "@season=2" },
                { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" }, { "n": "2024", "v": "2024" },
                { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" }, { "n": "2021", "v": "2021" },
                { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" }, { "n": "2018", "v": "2018" },
                { "n": "2017", "v": "2017" }, { "n": "2016", "v": "2016" }, { "n": "2015", "v": "2015" },
                { "n": "2014", "v": "2014" }, { "n": "2013", "v": "2013" }, { "n": "2012", "v": "2012" },
                { "n": "2011", "v": "2011" }, { "n": "2010", "v": "2010" }, { "n": "更早", "v": "@older" }
            ]},
            { "key": "季度", "name": "季度", "value": [
                { "n": "全部", "v": "" }, { "n": "冬季", "v": "11" }, { "n": "春季", "v": "12" },
                { "n": "夏季", "v": "13" }, { "n": "秋季", "v": "14" }
            ]},
            { "key": "风格", "name": "风格", "value": [
                { "n": "全部", "v": "" },
                { "n": "神作", "v": "神作" }, { "n": "校园", "v": "校园" }, { "n": "后宫", "v": "后宫" },
                { "n": "穿越", "v": "穿越" }, { "n": "异世", "v": "异世" }, { "n": "福利", "v": "福利" },
                { "n": "打斗", "v": "打斗" }, { "n": "智斗", "v": "智斗" }, { "n": "恋爱", "v": "恋爱" },
                { "n": "日常", "v": "日常" }, { "n": "运动", "v": "运动" }, { "n": "游戏", "v": "游戏" },
                { "n": "旅行", "v": "旅行" }, { "n": "美食", "v": "美食" }, { "n": "百合", "v": "百合" },
                { "n": "耽美", "v": "耽美" }, { "n": "萌系", "v": "萌系" }, { "n": "音乐", "v": "音乐" },
                { "n": "偶像", "v": "偶像" }, { "n": "热血", "v": "热血" }, { "n": "机甲", "v": "机甲" },
                { "n": "魔法", "v": "魔法" }, { "n": "异能", "v": "异能" }, { "n": "古典", "v": "古典" },
                { "n": "架空", "v": "架空" }, { "n": "奇幻", "v": "奇幻" }, { "n": "灾难", "v": "灾难" },
                { "n": "冒险", "v": "冒险" }, { "n": "推理", "v": "推理" }, { "n": "搞笑", "v": "搞笑" },
                { "n": "催泪", "v": "催泪" }, { "n": "治愈", "v": "治愈" }, { "n": "致郁", "v": "致郁" },
                { "n": "恐怖", "v": "恐怖" }, { "n": "泡面", "v": "泡面" }, { "n": "特摄", "v": "特摄" }
            ]},
            { "key": "字母", "name": "字母", "value": [
                { "n": "全部", "v": "" },
                { "n": "A", "v": "A" }, { "n": "B", "v": "B" }, { "n": "C", "v": "C" },
                { "n": "D", "v": "D" }, { "n": "E", "v": "E" }, { "n": "F", "v": "F" },
                { "n": "G", "v": "G" }, { "n": "H", "v": "H" }, { "n": "I", "v": "I" },
                { "n": "J", "v": "J" }, { "n": "K", "v": "K" }, { "n": "L", "v": "L" },
                { "n": "M", "v": "M" }, { "n": "N", "v": "N" }, { "n": "O", "v": "O" },
                { "n": "P", "v": "P" }, { "n": "Q", "v": "Q" }, { "n": "R", "v": "R" },
                { "n": "S", "v": "S" }, { "n": "T", "v": "T" }, { "n": "U", "v": "U" },
                { "n": "V", "v": "V" }, { "n": "W", "v": "W" }, { "n": "X", "v": "X" },
                { "n": "Y", "v": "Y" }, { "n": "Z", "v": "Z" }
            ]}
        ],
        "46": [
            { "key": "排序", "name": "排序", "value": [
                { "n": "按最新", "v": "time" }, { "n": "按最热", "v": "hits" },
                { "n": "按评分", "v": "score" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" }, { "n": "当季", "v": "@season=1" }, { "n": "上季", "v": "@season=2" },
                { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" }, { "n": "2024", "v": "2024" },
                { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" }, { "n": "2021", "v": "2021" },
                { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" }, { "n": "2018", "v": "2018" },
                { "n": "2017", "v": "2017" }, { "n": "2016", "v": "2016" }, { "n": "2015", "v": "2015" },
                { "n": "2014", "v": "2014" }, { "n": "2013", "v": "2013" }, { "n": "2012", "v": "2012" },
                { "n": "2011", "v": "2011" }, { "n": "2010", "v": "2010" }, { "n": "更早", "v": "@older" }
            ]},
            { "key": "季度", "name": "季度", "value": [
                { "n": "全部", "v": "" }, { "n": "冬季", "v": "11" }, { "n": "春季", "v": "12" },
                { "n": "夏季", "v": "13" }, { "n": "秋季", "v": "14" }
            ]},
            { "key": "风格", "name": "风格", "value": [
                { "n": "全部", "v": "" },
                { "n": "神作", "v": "神作" }, { "n": "校园", "v": "校园" }, { "n": "后宫", "v": "后宫" },
                { "n": "穿越", "v": "穿越" }, { "n": "异世", "v": "异世" }, { "n": "福利", "v": "福利" },
                { "n": "打斗", "v": "打斗" }, { "n": "智斗", "v": "智斗" }, { "n": "恋爱", "v": "恋爱" },
                { "n": "日常", "v": "日常" }, { "n": "运动", "v": "运动" }, { "n": "游戏", "v": "游戏" },
                { "n": "旅行", "v": "旅行" }, { "n": "美食", "v": "美食" }, { "n": "百合", "v": "百合" },
                { "n": "耽美", "v": "耽美" }, { "n": "萌系", "v": "萌系" }, { "n": "音乐", "v": "音乐" },
                { "n": "偶像", "v": "偶像" }, { "n": "热血", "v": "热血" }, { "n": "机甲", "v": "机甲" },
                { "n": "魔法", "v": "魔法" }, { "n": "异能", "v": "异能" }, { "n": "古典", "v": "古典" },
                { "n": "架空", "v": "架空" }, { "n": "奇幻", "v": "奇幻" }, { "n": "灾难", "v": "灾难" },
                { "n": "冒险", "v": "冒险" }, { "n": "推理", "v": "推理" }, { "n": "搞笑", "v": "搞笑" },
                { "n": "催泪", "v": "催泪" }, { "n": "治愈", "v": "治愈" }, { "n": "致郁", "v": "致郁" },
                { "n": "恐怖", "v": "恐怖" }, { "n": "泡面", "v": "泡面" }, { "n": "特摄", "v": "特摄" }
            ]},
            { "key": "字母", "name": "字母", "value": [
                { "n": "全部", "v": "" },
                { "n": "A", "v": "A" }, { "n": "B", "v": "B" }, { "n": "C", "v": "C" },
                { "n": "D", "v": "D" }, { "n": "E", "v": "E" }, { "n": "F", "v": "F" },
                { "n": "G", "v": "G" }, { "n": "H", "v": "H" }, { "n": "I", "v": "I" },
                { "n": "J", "v": "J" }, { "n": "K", "v": "K" }, { "n": "L", "v": "L" },
                { "n": "M", "v": "M" }, { "n": "N", "v": "N" }, { "n": "O", "v": "O" },
                { "n": "P", "v": "P" }, { "n": "Q", "v": "Q" }, { "n": "R", "v": "R" },
                { "n": "S", "v": "S" }, { "n": "T", "v": "T" }, { "n": "U", "v": "U" },
                { "n": "V", "v": "V" }, { "n": "W", "v": "W" }, { "n": "X", "v": "X" },
                { "n": "Y", "v": "Y" }, { "n": "Z", "v": "Z" }
            ]}
        ],
        "84": [
            { "key": "排序", "name": "排序", "value": [
                { "n": "按最新", "v": "time" }, { "n": "按最热", "v": "hits" },
                { "n": "按评分", "v": "score" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" },
                { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" }, { "n": "2024", "v": "2024" },
                { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" }, { "n": "2021", "v": "2021" },
                { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" }, { "n": "2018", "v": "2018" },
                { "n": "2017", "v": "2017" }, { "n": "2016", "v": "2016" }, { "n": "2015", "v": "2015" },
                { "n": "2014", "v": "2014" }, { "n": "2013", "v": "2013" }, { "n": "2012", "v": "2012" },
                { "n": "2011", "v": "2011" }, { "n": "2010", "v": "2010" }, { "n": "更早", "v": "@older" }
            ]},
            { "key": "风格", "name": "风格", "value": [
                { "n": "全部", "v": "" },
                { "n": "动作", "v": "动作" }, { "n": "喜剧", "v": "喜剧" }, { "n": "爱情", "v": "爱情" },
                { "n": "科幻", "v": "科幻" }, { "n": "恐怖", "v": "恐怖" }, { "n": "奇幻", "v": "奇幻" },
                { "n": "武侠", "v": "武侠" }, { "n": "冒险", "v": "冒险" }, { "n": "枪战", "v": "枪战" },
                { "n": "剧情", "v": "剧情" }, { "n": "战争", "v": "战争" }, { "n": "灾难", "v": "灾难" },
                { "n": "悬疑", "v": "悬疑" }, { "n": "犯罪", "v": "犯罪" }
            ]},
            { "key": "字母", "name": "字母", "value": [
                { "n": "全部", "v": "" },
                { "n": "A", "v": "A" }, { "n": "B", "v": "B" }, { "n": "C", "v": "C" },
                { "n": "D", "v": "D" }, { "n": "E", "v": "E" }, { "n": "F", "v": "F" },
                { "n": "G", "v": "G" }, { "n": "H", "v": "H" }, { "n": "I", "v": "I" },
                { "n": "J", "v": "J" }, { "n": "K", "v": "K" }, { "n": "L", "v": "L" },
                { "n": "M", "v": "M" }, { "n": "N", "v": "N" }, { "n": "O", "v": "O" },
                { "n": "P", "v": "P" }, { "n": "Q", "v": "Q" }, { "n": "R", "v": "R" },
                { "n": "S", "v": "S" }, { "n": "T", "v": "T" }, { "n": "U", "v": "U" },
                { "n": "V", "v": "V" }, { "n": "W", "v": "W" }, { "n": "X", "v": "X" },
                { "n": "Y", "v": "Y" }, { "n": "Z", "v": "Z" }
            ]}
        ],
        "91": [
            { "key": "排序", "name": "排序", "value": [
                { "n": "按最新", "v": "time" }, { "n": "按最热", "v": "hits" },
                { "n": "按评分", "v": "score" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" },
                { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" }, { "n": "2024", "v": "2024" },
                { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" }, { "n": "2021", "v": "2021" },
                { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" }, { "n": "2018", "v": "2018" },
                { "n": "2017", "v": "2017" }, { "n": "2016", "v": "2016" }, { "n": "2015", "v": "2015" },
                { "n": "2014", "v": "2014" }, { "n": "2013", "v": "2013" }, { "n": "2012", "v": "2012" },
                { "n": "2011", "v": "2011" }, { "n": "2010", "v": "2010" }
            ]},
            { "key": "风格", "name": "风格", "value": [
                { "n": "全部", "v": "" },
                { "n": "音乐", "v": "音乐" }, { "n": "综艺", "v": "综艺" },
                { "n": "真人秀", "v": "真人秀" }, { "n": "脱口秀", "v": "脱口秀" }
            ]},
            { "key": "字母", "name": "字母", "value": [
                { "n": "全部", "v": "" },
                { "n": "A", "v": "A" }, { "n": "B", "v": "B" }, { "n": "C", "v": "C" },
                { "n": "D", "v": "D" }, { "n": "E", "v": "E" }, { "n": "F", "v": "F" },
                { "n": "G", "v": "G" }, { "n": "H", "v": "H" }, { "n": "I", "v": "I" },
                { "n": "J", "v": "J" }, { "n": "K", "v": "K" }, { "n": "L", "v": "L" },
                { "n": "M", "v": "M" }, { "n": "N", "v": "N" }, { "n": "O", "v": "O" },
                { "n": "P", "v": "P" }, { "n": "Q", "v": "Q" }, { "n": "R", "v": "R" },
                { "n": "S", "v": "S" }, { "n": "T", "v": "T" }, { "n": "U", "v": "U" },
                { "n": "V", "v": "V" }, { "n": "W", "v": "W" }, { "n": "X", "v": "X" },
                { "n": "Y", "v": "Y" }, { "n": "Z", "v": "Z" }
            ]}
        ],
        "47": [
            { "key": "排序", "name": "排序", "value": [
                { "n": "按最新", "v": "time" }, { "n": "按最热", "v": "hits" },
                { "n": "按评分", "v": "score" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" },
                { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" }, { "n": "2024", "v": "2024" },
                { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" }, { "n": "2021", "v": "2021" },
                { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" }, { "n": "2018", "v": "2018" },
                { "n": "2017", "v": "2017" }, { "n": "2016", "v": "2016" }, { "n": "2015", "v": "2015" },
                { "n": "2014", "v": "2014" }, { "n": "2013", "v": "2013" }, { "n": "2012", "v": "2012" },
                { "n": "2011", "v": "2011" }, { "n": "2010", "v": "2010" }, { "n": "更早", "v": "@older" }
            ]},
            { "key": "字母", "name": "字母", "value": [
                { "n": "全部", "v": "" },
                { "n": "A", "v": "A" }, { "n": "B", "v": "B" }, { "n": "C", "v": "C" },
                { "n": "D", "v": "D" }, { "n": "E", "v": "E" }, { "n": "F", "v": "F" },
                { "n": "G", "v": "G" }, { "n": "H", "v": "H" }, { "n": "I", "v": "I" },
                { "n": "J", "v": "J" }, { "n": "K", "v": "K" }, { "n": "L", "v": "L" },
                { "n": "M", "v": "M" }, { "n": "N", "v": "N" }, { "n": "O", "v": "O" },
                { "n": "P", "v": "P" }, { "n": "Q", "v": "Q" }, { "n": "R", "v": "R" },
                { "n": "S", "v": "S" }, { "n": "T", "v": "T" }, { "n": "U", "v": "U" },
                { "n": "V", "v": "V" }, { "n": "W", "v": "W" }, { "n": "X", "v": "X" },
                { "n": "Y", "v": "Y" }, { "n": "Z", "v": "Z" }
            ]}
        ],
        "85": [
            { "key": "排序", "name": "排序", "value": [
                { "n": "按最新", "v": "time" }, { "n": "按最热", "v": "hits" },
                { "n": "按评分", "v": "score" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" },
                { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" }, { "n": "2024", "v": "2024" },
                { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" }, { "n": "2021", "v": "2021" },
                { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" }, { "n": "2018", "v": "2018" },
                { "n": "2017", "v": "2017" }, { "n": "2016", "v": "2016" }, { "n": "2015", "v": "2015" },
                { "n": "2014", "v": "2014" }, { "n": "2013", "v": "2013" }, { "n": "2012", "v": "2012" },
                { "n": "2011", "v": "2011" }, { "n": "2010", "v": "2010" }, { "n": "更早", "v": "@older" }
            ]},
            { "key": "字母", "name": "字母", "value": [
                { "n": "全部", "v": "" },
                { "n": "A", "v": "A" }, { "n": "B", "v": "B" }, { "n": "C", "v": "C" },
                { "n": "D", "v": "D" }, { "n": "E", "v": "E" }, { "n": "F", "v": "F" },
                { "n": "G", "v": "G" }, { "n": "H", "v": "H" }, { "n": "I", "v": "I" },
                { "n": "J", "v": "J" }, { "n": "K", "v": "K" }, { "n": "L", "v": "L" },
                { "n": "M", "v": "M" }, { "n": "N", "v": "N" }, { "n": "O", "v": "O" },
                { "n": "P", "v": "P" }, { "n": "Q", "v": "Q" }, { "n": "R", "v": "R" },
                { "n": "S", "v": "S" }, { "n": "T", "v": "T" }, { "n": "U", "v": "U" },
                { "n": "V", "v": "V" }, { "n": "W", "v": "W" }, { "n": "X", "v": "X" },
                { "n": "Y", "v": "Y" }, { "n": "Z", "v": "Z" }
            ]}
        ],
        "92": [
            { "key": "排序", "name": "排序", "value": [
                { "n": "按最新", "v": "time" }, { "n": "按最热", "v": "hits" },
                { "n": "按评分", "v": "score" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" },
                { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" }, { "n": "2024", "v": "2024" },
                { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" }, { "n": "2021", "v": "2021" },
                { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" }, { "n": "2018", "v": "2018" },
                { "n": "2017", "v": "2017" }, { "n": "2016", "v": "2016" }, { "n": "2015", "v": "2015" },
                { "n": "2014", "v": "2014" }, { "n": "2013", "v": "2013" }, { "n": "2012", "v": "2012" },
                { "n": "2011", "v": "2011" }, { "n": "2010", "v": "2010" }, { "n": "更早", "v": "@older" }
            ]}
        ],
        "81": [
            { "key": "排序", "name": "排序", "value": [
                { "n": "按最新", "v": "time" }, { "n": "按最热", "v": "hits" },
                { "n": "按评分", "v": "score" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" },
                { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" }, { "n": "2024", "v": "2024" },
                { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" }, { "n": "2021", "v": "2021" },
                { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" }, { "n": "2018", "v": "2018" },
                { "n": "2017", "v": "2017" }, { "n": "2016", "v": "2016" }, { "n": "2015", "v": "2015" },
                { "n": "2014", "v": "2014" }, { "n": "2013", "v": "2013" }, { "n": "2012", "v": "2012" },
                { "n": "2011", "v": "2011" }, { "n": "2010", "v": "2010" }, { "n": "更早", "v": "@older" }
            ]}
        ],
        "82": [
            { "key": "排序", "name": "排序", "value": [
                { "n": "按最新", "v": "time" }, { "n": "按最热", "v": "hits" },
                { "n": "按评分", "v": "score" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" },
                { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" }, { "n": "2024", "v": "2024" },
                { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" }, { "n": "2021", "v": "2021" },
                { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" }, { "n": "2018", "v": "2018" },
                { "n": "2017", "v": "2017" }, { "n": "2016", "v": "2016" }, { "n": "2015", "v": "2015" },
                { "n": "2014", "v": "2014" }, { "n": "2013", "v": "2013" }, { "n": "2012", "v": "2012" },
                { "n": "2011", "v": "2011" }, { "n": "2010", "v": "2010" }, { "n": "更早", "v": "@older" }
            ]}
        ],
        "83": [
            { "key": "排序", "name": "排序", "value": [
                { "n": "按最新", "v": "time" }, { "n": "按最热", "v": "hits" },
                { "n": "按评分", "v": "score" }
            ]},
            { "key": "年份", "name": "年份", "value": [
                { "n": "全部", "v": "" },
                { "n": "2026", "v": "2026" }, { "n": "2025", "v": "2025" }, { "n": "2024", "v": "2024" },
                { "n": "2023", "v": "2023" }, { "n": "2022", "v": "2022" }, { "n": "2021", "v": "2021" },
                { "n": "2020", "v": "2020" }, { "n": "2019", "v": "2019" }, { "n": "2018", "v": "2018" },
                { "n": "2017", "v": "2017" }, { "n": "2016", "v": "2016" }, { "n": "2015", "v": "2015" },
                { "n": "2014", "v": "2014" }, { "n": "2013", "v": "2013" }, { "n": "2012", "v": "2012" },
                { "n": "2011", "v": "2011" }, { "n": "2010", "v": "2010" }, { "n": "更早", "v": "@older" }
            ]}
        ]
    },
    filter_url: '',
    filter_def: {
    },
    play_parse: true,
    // 空数组避开引擎 !play_json 时强制 parse:1 覆盖 lazy 返回值的逻辑
    play_json: [],
    lazy: $js.toString(() => {
        // input: http://skr/play/{id}-{src}-{num}/ 伪前缀形式
        // 注意：lazy 代码串是 eval 执行（非函数），不能用 return，改用 if/else 瀑布
        try {
            var m = String(input).match(/(\d+)-(\d+)-(\d+)/);
            if (!m) {
                input = { parse: 0, url: 'skr:无效播放链接', js: '' };
            } else {
                var playUrl = 'https://www.skr2.cc/vodplay/' + m[1] + '-' + m[2] + '-' + m[3] + '/';
                var reqRes = request(playUrl, { headers: { 'User-Agent': 'MOBILE_UA' } });
                var mm = String(reqRes).match(/player_aaaa\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/);
                if (!mm) {
                    input = { parse: 0, url: 'skr:该线路暂无资源,请换线路', js: '' };
                } else {
                    var cfg = JSON.parse(mm[1]);
                    var u = cfg.url || '';
                    if (cfg.encrypt === 2) {
                        // encrypt 2 = base64 后跟 URL 编码（MacCMS 标准 player_aaaa）
                        u = base64Decode(u);
                        u = unescape(u);
                        u = decodeURIComponent(u);
                    } else if (cfg.encrypt === 1) {
                        u = base64Decode(u);
                    }
                    if (/^https?:\/\/.*m3u8/.test(u) || /^https?:\/\/.*\.mp4/.test(u)) {
                        input = { parse: 0, url: u, js: '' };
                    } else {
                        input = { parse: 0, url: 'skr:本集线路(' + (cfg.from || '?') + ')非直链,暂不支持', js: '' };
                    }
                }
            }
        } catch (e) {
            input = { parse: 0, url: 'skr:' + e.message, js: '' };
        }
    }),
    推荐: $js.toString(() => {
        // 首页桜漫板块（更新序）
        var reqRes = request('https://www.skr2.cc/vodtype/1/', { headers: { 'User-Agent': 'MOBILE_UA' } });
        var pageHtml = String(reqRes);
        var vodList = [];
        var re = /<a class="vodlist_thumb[^>]*href="\/voddetail\/(\d+)\/"[^>]*alt="([^"]*)"[^>]*data-original="([^"]*)"/g;
        var match;
        while ((match = re.exec(pageHtml)) !== null) {
            vodList.push({
                vod_id: match[1],
                vod_name: match[2],
                vod_pic: match[3],
                vod_remarks: '',
                vod_blurb: ''
            });
            if (vodList.length >= 24) break;
        }
        VODS = vodList;
    }),
    一级: $js.toString(() => {
        var page = MY_PAGE;
        var cate = MY_CATE;
        var FL = MY_FL || {};
        var year = FL.年份 || '';
        var urlExtra = '';
        if (year === '@season=1') { year = ''; urlExtra = '?season=1'; }
        else if (year === '@season=2') { year = ''; urlExtra = '?season=2'; }
        else if (year === '@older') { year = ''; }
        // 12 段: [id, letter, by, class, '', '', season, '', page, '', '', year]
        var seg = [cate, FL.字母 || '', FL.排序 || '', FL.风格 ? encodeURIComponent(FL.风格) : '', '', '', FL.季度 || '', '', page || 1, '', '', year];
        var listUrl = '/vodshow/' + seg.join('-') + '/' + urlExtra;
        var reqRes = request('https://www.skr2.cc' + listUrl, { headers: { 'User-Agent': 'MOBILE_UA' } });
        var pageHtml = String(reqRes);
        var vodList = [];
        var re = /<li class="vodlist_item[^"]*">([\s\S]*?)<\/li>/g;
        var match;
        while ((match = re.exec(pageHtml)) !== null) {
            var item = match[1];
            var idm = item.match(/href="\/voddetail\/(\d+)\//);
            if (!idm) { continue; }
            var namem = item.match(/alt="([^"]*)"/) || item.match(/title="([^"]*)"/) || item.match(/vodlist_title"[^>]*>\s*([^<]*)</);
            var picm = item.match(/data-original="([^"]*)"/);
            var remm = item.match(/pic_text[^>]*>\s*<p>([^<]*)<\/p>/) || item.match(/<p>([^<]*)<\/p>/);
            var scm = item.match(/text_dy">([\d.]+)</);
            var subm = item.match(/vodlist_sub">([\s\S]*?)<\/p>/);
            var vodNm = namem ? namem[1] : (idm[1] + '号');
            var remarks = '';
            if (remm) { remarks = remm[1].trim(); }
            if (scm) { remarks = (remarks ? remarks + ' ' : '') + '评分' + scm[1]; }
            var sub = subm ? String(subm[1]).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
            if (!remarks && sub) { remarks = sub.substring(0, 30); }
            vodList.push({
                vod_id: idm[1],
                vod_name: vodNm,
                vod_pic: picm ? picm[1] : '',
                vod_remarks: remarks,
                vod_blurb: sub.substring(0, 100)
            });
        }
        VODS = vodList;
    }),
    二级: $js.toString(() => {
        var id = orId;
        id = String(id || '').split('@@')[0].trim();
        var dUrl = 'https://www.skr2.cc/voddetail/' + id + '/';
        var reqRes = request(dUrl, { headers: { 'User-Agent': 'MOBILE_UA' } });
        var pageHtml = String(reqRes);
        var vodObj = { vod_name: '未知', vod_pic: '', vod_play_from: '', vod_play_url: '' };
        // 标题/海报
        var titm = pageHtml.match(/<h1 class="title">([^<]*)<\/h1>/);
        var picm = pageHtml.match(/content_thumb[^>]*>[\s\S]{0,300}?data-original="([^"]*)"/);
        if (titm) { vodObj.vod_name = titm[1]; }
        if (picm) { vodObj.vod_pic = picm[1]; }
        // 年份/地区/类型/状态
        var ym = pageHtml.match(/年份：<\/span><a href="[^"]*">(\d{4})<\/a>/);
        var am = pageHtml.match(/地区：<\/span><a href="[^"]*">([^<]*)<\/a>/);
        var stm = pageHtml.match(/状态：<span class="data_style">([^<]*)<\/span>/);
        var classNames = [];
        var cm = pageHtml.match(/类型：<\/span>(<a href="[^"]*">[^<]*<\/a>\s*)+/);
        if (cm) {
            var cre = /<a href="[^"]*">([^<]*)<\/a>/g;
            var cmatch;
            while ((cmatch = cre.exec(cm[0])) !== null) { classNames.push(cmatch[1]); }
        }
        // 主演/导演
        var acm = pageHtml.match(/主演：([\s\S]*?)<\/span>/);
        var dirm = pageHtml.match(/导演：([\s\S]*?)<\/span>/);
        if (acm) {
            var actors = [];
            var are = /<a href="[^"]*">([^<]*)<\/a>/g;
            var amatch;
            while ((amatch = are.exec(acm[1])) !== null) { actors.push(amatch[1]); }
            vodObj.vod_actor = actors.join(',');
        }
        if (dirm) {
            var directors = [];
            var dre = /<a href="[^"]*">([^<]*)<\/a>/g;
            var dmatch;
            while ((dmatch = dre.exec(dirm[1])) !== null) { directors.push(dmatch[1]); }
            vodObj.vod_director = directors.join(',');
        }
        // 简介（full_text 区块是完整版）
        var descm = pageHtml.match(/<div class="content_desc full_text[^>]*>[\s\S]*?<span>\s*<strong>([^<]*)<\/strong>([\s\S]*?)<\/span>/) ||
                    pageHtml.match(/<div class="content_desc context[^>]*>[\s\S]*?<span>\s*<strong>([^<]*)<\/strong>([\s\S]*?)<\/span>/);
        var vDesc = '';
        if (descm) {
            vDesc = (descm[1] || '') + ' ' + (descm[2] || '');
            vDesc = vDesc.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
        }
        vodObj.vod_year = ym ? ym[1] : '';
        vodObj.vod_area = am ? am[1] : '';
        vodObj.type_name = classNames.length ? classNames.join(',') : (cate1 || '动漫');
        vodObj.vod_content = vDesc || '暂无简介';
        vodObj.vod_blurb = vDesc.substring(0, 100);
        if (stm) { vodObj.vod_remarks = stm[1]; }
        // 播放线路：NumTab 里 <a alt="线路名">，play_list_box 按出现顺序对应
        var fromNames = [];
        var tabRe = /<a href="javascript:void\(0\);"[^>]*alt="([^"]*)"[^>]*>/g;
        var tabMatch;
        while ((tabMatch = tabRe.exec(pageHtml)) !== null) { fromNames.push(tabMatch[1]); }
        var vodPlayFrom = [];
        var vodPlayUrl = [];
        var parts = pageHtml.split('<div class="play_list_box');
        for (var pi = 1; pi < parts.length; pi++) {
            var seg = parts[pi];
            var lineName = fromNames[pi - 1] || ('线路' + pi);
            // playlist_full 是全量剧集（display:none），没有时用 notfull 区
            var fullSeg = seg.match(/<div class="playlist_full"[\s\S]{0,200000}?<\/ul>/);
            var target = fullSeg ? fullSeg[0] : seg;
            var eps = [];
            var epRe = /<li><a href="\/vodplay\/(\d+)-(\d+)-(\d+)\/">([^<]*)<\/a><\/li>/g;
            var match;
            while ((match = epRe.exec(target)) !== null) {
                // 伪 URL 前缀：防止引擎把纯数字 id 当 base64 解码成乱码
                eps.push(match[4] + '$http://skr/play/' + match[1] + '-' + match[2] + '-' + match[3] + '/');
            }
            if (eps.length > 0) {
                vodPlayFrom.push(lineName);
                vodPlayUrl.push(eps.join('#'));
            }
        }
        vodObj.vod_play_from = vodPlayFrom.join('$$$');
        vodObj.vod_play_url = vodPlayUrl.join('$$$');
        VOD = vodObj;
    }),
    搜索: $js.toString(() => {
        var wd = KEY;
        var UA = { 'User-Agent': 'MOBILE_UA' };
        var searchUrl = 'https://www.skr2.cc/vodsearch/' + encodeURIComponent(wd) + '-------------/';
        // 该站搜索有"迷子"人机验证：403 页 -> renji JS 挑战 -> 验证 URL(md5) -> 带双 cookie 访问
        // 流程：
        //   1) 直接访问搜索页；若 403，提取 <script src="/renji_{prefix}_{key}.js">
        //   2) 请求 renji JS 提取内部 key/value/php 路径/type 参数
        //   3) value_md5 = md5(每字符 charCode 十进制拼接) 请求验证 URL（响应 Set-Cookie 双 cookie）
        //   4) 带双 cookie 重新访问搜索页
        var pageHtml = String(request(searchUrl, { headers: UA }));
        if (/renji_|verifyBox|让迷子看看/.test(pageHtml)) {
            try {
                var renjiM = pageHtml.match(/\/(renji_[\w]+)\.js/);
                if (renjiM) {
                    var jsTxt = String(request('https://www.skr2.cc/' + renjiM[1] + '.js', { headers: UA }));
                    var keyM = jsTxt.match(/var key="([0-9a-f]+)"/);
                    var valM = jsTxt.match(/var key="[0-9a-f]+",value="([0-9a-f]+)"/) || jsTxt.match(/var value="([0-9a-f]+)"/);
                    var phpM = jsTxt.match(/get\("\/([a-z0-9_]+_yanzheng_ip\.php)\?type=([0-9a-f]+)&key="/);
                    if (keyM && valM && phpM) {
                        // stringtoHex: 每字符 charCode 十进制拼接
                        var s = '';
                        for (var ci = 0; ci < valM[1].length; ci++) { s += String(valM[1].charCodeAt(ci)); }
                        var md5Val = CryptoJS.MD5(s).toString();
                        var verifyUrl = 'https://www.skr2.cc/' + phpM[1] + '?type=' + phpM[2] + '&key=' + keyM[1] + '&value=' + md5Val;
                        // withHeaders 拿 Set-Cookie（返回 JSON: {headers..., body})
                        var vres = String(request(verifyUrl, { headers: UA, withHeaders: true }));
                        var vjson = {};
                        try { vjson = JSON.parse(vres) || {}; } catch (e) { vjson = {}; }
                        var ck = '';
                        try {
                            var hdrs = vjson.headers || vjson;
                            var setCk = '';
                            Object.keys(hdrs).forEach(function(hk) {
                                if (hk.toLowerCase() === 'set-cookie' && hdrs[hk]) { setCk = hdrs[hk]; }
                            });
                            // 引擎 set-cookie 可能是数组（多条）或字符串，统一转数组
                            if (!Array.isArray(setCk)) { setCk = [String(setCk)]; }
                            var cks = [];
                            setCk.forEach(function(one) {
                                var kv = String(one).split(';')[0].trim();
                                if (kv && kv.indexOf('=') > 0) { cks.push(kv); }
                            });
                            ck = cks.join('; ');
                        } catch (e) { ck = ''; }
                        if (ck) {
                            var reqRes2 = String(request(searchUrl, { headers: { 'User-Agent': 'MOBILE_UA', 'Cookie': ck } }));
                            pageHtml = reqRes2;
                        }
                    }
                }
            } catch (e) {
                // 验证失败则继续用原 403 html（结果为空）
            }
        }
        var vodList = [];
        // searchlist_item 结构（图文列表）
        var re = /<li class="searchlist_item">([\s\S]*?)<\/li>/g;
        var match;
        while ((match = re.exec(pageHtml)) !== null) {
            var item = match[1];
            var idm = item.match(/href="\/voddetail\/(\d+)\//);
            var picm = item.match(/data-original="([^"]*)"/);
            var namem = item.match(/vodlist_title"><a[^>]*>(?:<span[^>]*>[^<]*<\/span>)?([^<]*)<\/a>/);
            var subm = item.match(/主演：<\/span>([^<]*)/);
            var descm = item.match(/简介：<\/span>([\s\S]*?)<\/p>/);
            if (idm) {
                var vodNm = namem ? namem[1].trim() : (idm[1] + '号');
                vodList.push({
                    vod_id: idm[1],
                    vod_name: vodNm,
                    vod_pic: picm ? picm[1] : '',
                    vod_remarks: subm ? String(subm[1]).replace(/&nbsp;/g, ' ').trim().substring(0, 20) : '',
                    vod_blurb: descm ? String(descm[1]).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().substring(0, 100) : ''
                });
            }
        }
        VODS = vodList;
    })
};