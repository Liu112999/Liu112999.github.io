/* 额外练习题库 · 课外精选词汇
   来源：老板提供的词库素材，经逐条人工筛选（日常高频/高考实用留下，冷僻词剔除），
   释义与用法提示为本站重写。共 375 条（单词 248 · 词组 127）。
   改数据走 tools/apply-envocab.js，别手改本文件。 */
const DATA_ENVOCAB = {
  "items": [
    {
      "w": "a good deal",
      "pos": "phr.",
      "cn": "划算的买卖",
      "tip": "另义\"大量\"：a good deal of time"
    },
    {
      "w": "abstract",
      "pos": "adj.",
      "cn": "抽象的",
      "tip": "反义 concrete 具体的；作名词指摘要"
    },
    {
      "w": "academic year",
      "pos": "phr.",
      "cn": "学年"
    },
    {
      "w": "accessible",
      "pos": "adj.",
      "cn": "可到达的，易获得的",
      "tip": "be accessible to sb. 对…开放/可用"
    },
    {
      "w": "accessory",
      "pos": "n.",
      "cn": "配件，饰品",
      "tip": "fashion accessories 时尚配饰"
    },
    {
      "w": "acknowledge",
      "pos": "v.",
      "cn": "承认，感谢",
      "tip": "写作常用句式：It is widely acknowledged that..."
    },
    {
      "w": "adhere to",
      "pos": "phr.",
      "cn": "遵守，坚持",
      "tip": "adhere to the rules/traditions，比 follow 更正式"
    },
    {
      "w": "adjacent",
      "pos": "adj.",
      "cn": "相邻的",
      "tip": "be adjacent to 与…相邻，比 next to 正式"
    },
    {
      "w": "adjust",
      "pos": "v.",
      "cn": "调整；适应",
      "tip": "adjust to 适应，= adapt to"
    },
    {
      "w": "administration",
      "pos": "n.",
      "cn": "管理，行政部门",
      "tip": "美国新闻中常指政府：the US administration"
    },
    {
      "w": "admit",
      "pos": "v.",
      "cn": "承认；准许进入",
      "tip": "be admitted to a university 被大学录取"
    },
    {
      "w": "affect",
      "pos": "v.",
      "cn": "影响",
      "tip": "动词；effect 是名词：have an effect on"
    },
    {
      "w": "algorithm",
      "pos": "n.",
      "cn": "算法",
      "tip": "科技类阅读高频：recommendation algorithm 推荐算法"
    },
    {
      "w": "analyze",
      "pos": "v.",
      "cn": "分析",
      "tip": "analysis n. 分析（复数 analyses）"
    },
    {
      "w": "antibiotic",
      "pos": "n.",
      "cn": "抗生素",
      "tip": "健康类文章常见，常用复数 antibiotics"
    },
    {
      "w": "appetizer",
      "pos": "n.",
      "cn": "开胃菜，头盘",
      "tip": "餐厅点餐顺序：appetizer → main course → dessert"
    },
    {
      "w": "appreciation",
      "pos": "n.",
      "cn": "感激；欣赏",
      "tip": "express one's appreciation 表达感谢（书信常用）"
    },
    {
      "w": "as opposed to",
      "pos": "phr.",
      "cn": "而不是，与…相对",
      "tip": "写作对比常用"
    },
    {
      "w": "aspiring",
      "pos": "adj.",
      "cn": "有抱负的，有志成为…的",
      "tip": "an aspiring writer 一心想当作家的人"
    },
    {
      "w": "at this rate",
      "pos": "phr.",
      "cn": "照这样下去",
      "tip": "口语常用，常带担忧语气"
    },
    {
      "w": "at will",
      "pos": "phr.",
      "cn": "随意，任意"
    },
    {
      "w": "auction",
      "pos": "n.",
      "cn": "拍卖"
    },
    {
      "w": "balance",
      "pos": "n.",
      "cn": "平衡；（账户）余额",
      "tip": "熟词生义：check the balance 查余额"
    },
    {
      "w": "bandage",
      "pos": "n.",
      "cn": "绷带",
      "tip": "apply a bandage 包扎"
    },
    {
      "w": "bankrupt",
      "pos": "adj.",
      "cn": "破产的",
      "tip": "go bankrupt 破产；bankruptcy n."
    },
    {
      "w": "be a natural",
      "pos": "phr.",
      "cn": "是天生的好手",
      "tip": "She's a natural at singing. 她唱歌很有天赋"
    },
    {
      "w": "be bound for",
      "pos": "phr.",
      "cn": "开往，前往",
      "tip": "the train bound for Beijing 开往北京的列车"
    },
    {
      "w": "be bound to",
      "pos": "phr.",
      "cn": "必定，一定会",
      "tip": "勿混 be bound for（开往）"
    },
    {
      "w": "be in the market for",
      "pos": "phr.",
      "cn": "有意购买",
      "tip": "I'm in the market for a used car. 我正想买辆二手车"
    },
    {
      "w": "be in the middle of",
      "pos": "phr.",
      "cn": "正忙于",
      "tip": "听力常用：I'm in the middle of something. 我正忙着呢"
    },
    {
      "w": "be in two minds about",
      "pos": "phr.",
      "cn": "拿不定主意，犹豫不决"
    },
    {
      "w": "be into",
      "pos": "phr.",
      "cn": "喜欢，对…着迷",
      "tip": "口语高频：I'm really into jazz. 我特别迷爵士乐"
    },
    {
      "w": "be low on",
      "pos": "phr.",
      "cn": "…所剩不多，缺乏",
      "tip": "be low on cash/fuel 缺钱/快没油了"
    },
    {
      "w": "be subjected to",
      "pos": "phr.",
      "cn": "遭受，受制于",
      "tip": "多接不好的事物：be subjected to pressure 承受压力"
    },
    {
      "w": "be tied up",
      "pos": "phr.",
      "cn": "忙得脱不开身",
      "tip": "I'm tied up all morning. 我一上午都腾不出空"
    },
    {
      "w": "be unaware of",
      "pos": "phr.",
      "cn": "没意识到",
      "tip": "反义 be aware of 意识到"
    },
    {
      "w": "be viewed as",
      "pos": "phr.",
      "cn": "被视为",
      "tip": "同义替换：be seen/regarded as"
    },
    {
      "w": "beat oneself up",
      "pos": "phr.",
      "cn": "过分自责",
      "tip": "口语：Don't beat yourself up. 别太自责"
    },
    {
      "w": "belonging",
      "pos": "n.",
      "cn": "归属；（复数）随身物品",
      "tip": "a sense of belonging 归属感（写作加分表达）"
    },
    {
      "w": "bewildered",
      "pos": "adj.",
      "cn": "困惑的，不知所措的",
      "tip": "比 confused 程度更深，完形常考人物情绪"
    },
    {
      "w": "blouse",
      "pos": "n.",
      "cn": "女式衬衫"
    },
    {
      "w": "boarding gate",
      "pos": "phr.",
      "cn": "登机口",
      "tip": "boarding pass 登机牌"
    },
    {
      "w": "bribe",
      "pos": "v.",
      "cn": "贿赂",
      "tip": "bribery n. 贿赂行为"
    },
    {
      "w": "broaden one's mind",
      "pos": "phr.",
      "cn": "开阔眼界",
      "tip": "谈读书/旅行益处常用；= broaden one's horizons"
    },
    {
      "w": "brutal",
      "pos": "adj.",
      "cn": "残酷的，残暴的",
      "tip": "brutal competition/winter 残酷的竞争/严冬"
    },
    {
      "w": "busy signal",
      "pos": "phr.",
      "cn": "（电话）忙音，占线音",
      "tip": "电话场景：get a busy signal 占线"
    },
    {
      "w": "canoe",
      "pos": "n.",
      "cn": "独木舟",
      "tip": "户外、游记类记叙文常见"
    },
    {
      "w": "carbon neutrality",
      "pos": "phr.",
      "cn": "碳中和",
      "tip": "环保热点话题词：achieve carbon neutrality 实现碳中和"
    },
    {
      "w": "carry",
      "pos": "v.",
      "cn": "（商店）有售，经营（货品）",
      "tip": "听力熟词生义：Do you carry…? 你们店里卖…吗"
    },
    {
      "w": "carry out",
      "pos": "phr.",
      "cn": "执行，开展",
      "tip": "carry out an experiment/a survey"
    },
    {
      "w": "check out",
      "pos": "phr.",
      "cn": "结账退房，借出（图书）",
      "tip": "check in 入住/办登机；口语 check it out 瞧瞧看"
    },
    {
      "w": "chemist",
      "pos": "n.",
      "cn": "药剂师，化学家",
      "tip": "英式 chemist's 指药店"
    },
    {
      "w": "cling to",
      "pos": "phr.",
      "cn": "紧紧抓住，固守",
      "tip": "cling to hope/tradition 抱有希望/固守传统"
    },
    {
      "w": "clock out",
      "pos": "phr.",
      "cn": "打卡下班",
      "tip": "clock in 打卡上班"
    },
    {
      "w": "coach",
      "pos": "n.",
      "cn": "教练，长途汽车",
      "tip": "英式英语中指长途大巴，交通出行类文章常见"
    },
    {
      "w": "colony",
      "pos": "n.",
      "cn": "殖民地，（动物）群体",
      "tip": "科普阅读常见 an ant colony 蚁群"
    },
    {
      "w": "combat",
      "pos": "v.",
      "cn": "对抗，与…作斗争",
      "tip": "combat climate change/crime 新闻高频搭配"
    },
    {
      "w": "come by",
      "pos": "phr.",
      "cn": "得到，获得",
      "tip": "hard to come by 很难得到；另有\"顺路来访\"之意"
    },
    {
      "w": "come to",
      "pos": "phr.",
      "cn": "总计达，苏醒",
      "tip": "The bill comes to $50. 账单共计50美元"
    },
    {
      "w": "come up",
      "pos": "phr.",
      "cn": "（问题、事情）出现",
      "tip": "Something came up. 临时有事（常见推脱理由）；勿混 come up with 想出"
    },
    {
      "w": "commemorate",
      "pos": "v.",
      "cn": "纪念",
      "tip": "commemorate the anniversary 纪念周年，节日历史类文章常见"
    },
    {
      "w": "compatible",
      "pos": "adj.",
      "cn": "兼容的，合得来的",
      "tip": "be compatible with 与…兼容/相处融洽"
    },
    {
      "w": "complain",
      "pos": "v.",
      "cn": "抱怨，投诉",
      "tip": "complain about；complaint n.，投诉信是应用文常考题型"
    },
    {
      "w": "concept",
      "pos": "n.",
      "cn": "概念"
    },
    {
      "w": "concise",
      "pos": "adj.",
      "cn": "简洁的",
      "tip": "写作要求常说 clear and concise 清晰简洁"
    },
    {
      "w": "conclude",
      "pos": "v.",
      "cn": "得出结论；结束",
      "tip": "推断题常问 What can we conclude from...?"
    },
    {
      "w": "concrete",
      "pos": "adj.",
      "cn": "具体的",
      "tip": "concrete examples 具体事例；作名词指混凝土"
    },
    {
      "w": "conduct",
      "pos": "v.",
      "cn": "进行，开展",
      "tip": "conduct an experiment/a survey 高频搭配"
    },
    {
      "w": "conductor",
      "pos": "n.",
      "cn": "列车员；（乐队）指挥"
    },
    {
      "w": "conference",
      "pos": "n.",
      "cn": "会议",
      "tip": "press conference 新闻发布会"
    },
    {
      "w": "confide in",
      "pos": "phr.",
      "cn": "向…吐露心事",
      "tip": "confide in a friend 向朋友倾诉"
    },
    {
      "w": "connection",
      "pos": "n.",
      "cn": "联系；（航班等的）中转衔接",
      "tip": "miss one's connection 误了转乘航班"
    },
    {
      "w": "conservative",
      "pos": "adj.",
      "cn": "保守的，传统的"
    },
    {
      "w": "constitution",
      "pos": "n.",
      "cn": "宪法",
      "tip": "the Constitution 常特指美国宪法"
    },
    {
      "w": "content",
      "pos": "adj.",
      "cn": "满足的",
      "tip": "be content with 满足于；作名词指内容"
    },
    {
      "w": "context",
      "pos": "n.",
      "cn": "语境，背景",
      "tip": "guess the meaning from the context 根据上下文猜词义"
    },
    {
      "w": "continual",
      "pos": "adj.",
      "cn": "不断的，频繁的",
      "tip": "易混：continuous 连续不间断的；continual 反复发生的"
    },
    {
      "w": "convince",
      "pos": "v.",
      "cn": "使相信，说服",
      "tip": "convince sb. to do / of sth.；convincing 有说服力的"
    },
    {
      "w": "cornerstone",
      "pos": "n.",
      "cn": "基石",
      "tip": "写作比喻：the cornerstone of success 成功的基石"
    },
    {
      "w": "count on",
      "pos": "phr.",
      "cn": "指望，依靠",
      "tip": "You can count on me. 包在我身上"
    },
    {
      "w": "coward",
      "pos": "n.",
      "cn": "胆小鬼，懦夫",
      "tip": "cowardly adj. 怯懦的"
    },
    {
      "w": "crack",
      "pos": "n.",
      "cn": "裂缝",
      "tip": "作动词指破裂；crack a problem 破解难题"
    },
    {
      "w": "crash",
      "pos": "n.",
      "cn": "撞车，坠毁",
      "tip": "a car crash 车祸；电脑死机也说 crash"
    },
    {
      "w": "criterion",
      "pos": "n.",
      "cn": "标准，准则",
      "tip": "复数 criteria 更常见：meet the criteria 符合标准"
    },
    {
      "w": "critical thinking",
      "pos": "phr.",
      "cn": "批判性思维",
      "tip": "教育类话题高频"
    },
    {
      "w": "cross off",
      "pos": "phr.",
      "cn": "划掉，删去",
      "tip": "cross it off the list 从清单上划掉"
    },
    {
      "w": "crucial",
      "pos": "adj.",
      "cn": "至关重要的",
      "tip": "写作替换 important：play a crucial role"
    },
    {
      "w": "curiosity",
      "pos": "n.",
      "cn": "好奇心",
      "tip": "out of curiosity 出于好奇"
    },
    {
      "w": "custom",
      "pos": "n.",
      "cn": "习俗",
      "tip": "易混：costume 服装；customs 海关"
    },
    {
      "w": "cut off",
      "pos": "phr.",
      "cn": "切断，中断",
      "tip": "be cut off （通话）被中断"
    },
    {
      "w": "cybersecurity",
      "pos": "n.",
      "cn": "网络安全",
      "tip": "科技类阅读话题词"
    },
    {
      "w": "date back to",
      "pos": "phr.",
      "cn": "追溯到",
      "tip": "介绍历史文化常用：The temple dates back to..."
    },
    {
      "w": "dead on time",
      "pos": "phr.",
      "cn": "分秒不差，正点",
      "tip": "dead 在口语里作\"正好，完全\"讲"
    },
    {
      "w": "decay",
      "pos": "v.",
      "cn": "腐烂，衰败",
      "tip": "tooth decay 蛀牙；也可指传统的衰落"
    },
    {
      "w": "deficit",
      "pos": "n.",
      "cn": "赤字，亏损",
      "tip": "budget deficit 预算赤字"
    },
    {
      "w": "departure",
      "pos": "n.",
      "cn": "出发，离开",
      "tip": "departure time 出发时间；反义 arrival 到达"
    },
    {
      "w": "deposit",
      "pos": "n.",
      "cn": "押金，存款",
      "tip": "pay a deposit 付定金"
    },
    {
      "w": "deteriorate",
      "pos": "v.",
      "cn": "恶化",
      "tip": "健康/关系/情况恶化都可用"
    },
    {
      "w": "determine",
      "pos": "v.",
      "cn": "决定，确定",
      "tip": "be determined to do 下决心做"
    },
    {
      "w": "diminish",
      "pos": "v.",
      "cn": "减少，减弱",
      "tip": "近 decrease，兴趣/影响减弱常用"
    },
    {
      "w": "distort",
      "pos": "v.",
      "cn": "歪曲，使变形",
      "tip": "distort the truth/facts 歪曲事实"
    },
    {
      "w": "doomed",
      "pos": "adj.",
      "cn": "注定失败的",
      "tip": "be doomed to fail 注定失败"
    },
    {
      "w": "down payment",
      "pos": "phr.",
      "cn": "首付，头期款"
    },
    {
      "w": "downsize",
      "pos": "v.",
      "cn": "裁员，缩减规模"
    },
    {
      "w": "dressing",
      "pos": "n.",
      "cn": "（沙拉）调味汁",
      "tip": "salad dressing 沙拉酱，注意不是\"穿衣\""
    },
    {
      "w": "drive sb. crazy",
      "pos": "phr.",
      "cn": "把某人逼疯，使人心烦"
    },
    {
      "w": "drop out",
      "pos": "phr.",
      "cn": "退学，中途退出",
      "tip": "dropout n. 辍学者"
    },
    {
      "w": "dry up",
      "pos": "phr.",
      "cn": "干涸，枯竭",
      "tip": "也可指资金、话题枯竭"
    },
    {
      "w": "dynamic",
      "pos": "adj.",
      "cn": "充满活力的，动态的"
    },
    {
      "w": "earplug",
      "pos": "n.",
      "cn": "耳塞"
    },
    {
      "w": "elite",
      "pos": "n.",
      "cn": "精英",
      "tip": "elite universities 名校"
    },
    {
      "w": "embody",
      "pos": "v.",
      "cn": "体现，代表",
      "tip": "文化类文章：embody the spirit of... 体现…精神"
    },
    {
      "w": "engage",
      "pos": "v.",
      "cn": "参与，从事",
      "tip": "engage in 从事；engaging adj. 引人入胜的"
    },
    {
      "w": "enhance",
      "pos": "v.",
      "cn": "提高，增强",
      "tip": "写作高级替换 improve：enhance one's ability"
    },
    {
      "w": "enlighten",
      "pos": "v.",
      "cn": "启发，开导",
      "tip": "写作目的题选项常见 enlightening 有启发性的"
    },
    {
      "w": "ensure",
      "pos": "v.",
      "cn": "确保",
      "tip": "易混：assure sb. 使某人放心"
    },
    {
      "w": "equivalent",
      "pos": "adj.",
      "cn": "相等的，等同的",
      "tip": "be equivalent to 相当于"
    },
    {
      "w": "essence",
      "pos": "n.",
      "cn": "本质，精髓",
      "tip": "in essence 本质上"
    },
    {
      "w": "establish",
      "pos": "v.",
      "cn": "建立，设立",
      "tip": "establish a company/reputation"
    },
    {
      "w": "exceed",
      "pos": "v.",
      "cn": "超过，超出",
      "tip": "exceed expectations 超出预期"
    },
    {
      "w": "exemplify the spirit of",
      "pos": "phr.",
      "cn": "体现…的精神",
      "tip": "写人物事迹可用：He exemplifies the spirit of teamwork."
    },
    {
      "w": "exhibition",
      "pos": "n.",
      "cn": "展览",
      "tip": "exhibit v. 展出，n. 展品"
    },
    {
      "w": "expand",
      "pos": "v.",
      "cn": "扩大，扩展",
      "tip": "expand one's horizons 开阔眼界；expansion n."
    },
    {
      "w": "expectation",
      "pos": "n.",
      "cn": "期望",
      "tip": "meet / live up to one's expectations 不辜负期望"
    },
    {
      "w": "expel",
      "pos": "v.",
      "cn": "开除，驱逐",
      "tip": "be expelled from school 被学校开除"
    },
    {
      "w": "expenditure",
      "pos": "n.",
      "cn": "支出，开销",
      "tip": "government expenditure 政府开支；反义 income"
    },
    {
      "w": "express",
      "pos": "adj.",
      "cn": "特快的，快递的",
      "tip": "express train/delivery 特快列车/快递"
    },
    {
      "w": "extend",
      "pos": "v.",
      "cn": "延长，扩展",
      "tip": "extend an invitation/thanks 发出邀请、致谢"
    },
    {
      "w": "face up to",
      "pos": "phr.",
      "cn": "勇敢面对，正视",
      "tip": "face up to difficulties 正视困难"
    },
    {
      "w": "factor",
      "pos": "n.",
      "cn": "因素",
      "tip": "a key factor in...；factor in 把…考虑在内"
    },
    {
      "w": "fall on sb.",
      "pos": "phr.",
      "cn": "（责任、任务）落到某人头上"
    },
    {
      "w": "fasten the seat belt",
      "pos": "phr.",
      "cn": "系好安全带",
      "tip": "= buckle up"
    },
    {
      "w": "ferry",
      "pos": "n.",
      "cn": "渡船",
      "tip": "take a ferry 乘渡船"
    },
    {
      "w": "fill in for",
      "pos": "phr.",
      "cn": "临时顶替（某人）",
      "tip": "区分 fill in a form 填表"
    },
    {
      "w": "fill up",
      "pos": "phr.",
      "cn": "装满，加满（油）",
      "tip": "Fill it up, please. 请加满油"
    },
    {
      "w": "finishing touches",
      "pos": "phr.",
      "cn": "最后的修饰，收尾工作",
      "tip": "put the finishing touches to… 给…做最后润色"
    },
    {
      "w": "fit",
      "pos": "v.",
      "cn": "容纳得下，装得进",
      "tip": "The car fits five people. 这车能坐五个人"
    },
    {
      "w": "fit in",
      "pos": "phr.",
      "cn": "融入，合群",
      "tip": "fit in with one's classmates 融入同学"
    },
    {
      "w": "flash drive",
      "pos": "phr.",
      "cn": "U盘，闪存盘",
      "tip": "也叫 USB drive"
    },
    {
      "w": "flaw",
      "pos": "n.",
      "cn": "缺陷，瑕疵",
      "tip": "a flaw in the design 设计缺陷；flawless 完美无瑕的"
    },
    {
      "w": "flock to",
      "pos": "phr.",
      "cn": "蜂拥而至",
      "tip": "游客涌向景点常用：tourists flock to..."
    },
    {
      "w": "folk",
      "pos": "adj.",
      "cn": "民间的，民俗的",
      "tip": "folk music/culture 民间音乐/文化"
    },
    {
      "w": "follow-up",
      "pos": "adj.",
      "cn": "后续的",
      "tip": "a follow-up question/visit 后续问题/回访"
    },
    {
      "w": "front page",
      "pos": "phr.",
      "cn": "（报纸）头版",
      "tip": "front-page news 头条新闻"
    },
    {
      "w": "furthermore",
      "pos": "adv.",
      "cn": "此外，再者",
      "tip": "写作衔接词，= moreover"
    },
    {
      "w": "fuss",
      "pos": "n.",
      "cn": "大惊小怪，忙乱",
      "tip": "make a fuss 大惊小怪；fussy adj. 挑剔的"
    },
    {
      "w": "get away",
      "pos": "phr.",
      "cn": "外出度假，脱身",
      "tip": "勿混 get away with 做坏事而不受罚"
    },
    {
      "w": "get hold of",
      "pos": "phr.",
      "cn": "联系上，弄到",
      "tip": "I couldn't get hold of you. 我一直联系不上你"
    },
    {
      "w": "gloomy",
      "pos": "adj.",
      "cn": "阴沉的，沮丧的",
      "tip": "天气阴沉、心情低落都可用"
    },
    {
      "w": "go Dutch",
      "pos": "phr.",
      "cn": "AA制，各付各的",
      "tip": "同义 go fifty-fifty 平摊"
    },
    {
      "w": "go for",
      "pos": "phr.",
      "cn": "选择，争取",
      "tip": "Go for it! 放手去干！"
    },
    {
      "w": "go hand in hand with",
      "pos": "phr.",
      "cn": "与…密切相关，相伴而行",
      "tip": "写作可用：Success goes hand in hand with hard work."
    },
    {
      "w": "go in for",
      "pos": "phr.",
      "cn": "参加（比赛、考试），爱好"
    },
    {
      "w": "go out of business",
      "pos": "phr.",
      "cn": "停业，倒闭"
    },
    {
      "w": "gorgeous",
      "pos": "adj.",
      "cn": "极漂亮的，华丽的",
      "tip": "口语常用，比 beautiful 语气更强"
    },
    {
      "w": "grateful",
      "pos": "adj.",
      "cn": "感激的",
      "tip": "书信高频：I would be grateful if you could..."
    },
    {
      "w": "grin",
      "pos": "v.",
      "cn": "露齿而笑",
      "tip": "grin at sb 冲某人咧嘴一笑，记叙文常见"
    },
    {
      "w": "grow into",
      "pos": "phr.",
      "cn": "长大后穿得下，逐渐成长为",
      "tip": "与 grow out of（长大后穿不下）对比记"
    },
    {
      "w": "grow out of",
      "pos": "phr.",
      "cn": "因长大而穿不下，戒掉",
      "tip": "grow out of a habit 长大后改掉习惯"
    },
    {
      "w": "gymnast",
      "pos": "n.",
      "cn": "体操运动员",
      "tip": "gymnastics 体操"
    },
    {
      "w": "halfway through",
      "pos": "phr.",
      "cn": "进行到一半，中途"
    },
    {
      "w": "hang around",
      "pos": "phr.",
      "cn": "闲逛，闲等"
    },
    {
      "w": "hard copy",
      "pos": "phr.",
      "cn": "打印件，纸质版",
      "tip": "相对电子版而言"
    },
    {
      "w": "hard up",
      "pos": "phr.",
      "cn": "缺钱的，手头紧的"
    },
    {
      "w": "head off to",
      "pos": "phr.",
      "cn": "动身前往",
      "tip": "head for/to 朝…去"
    },
    {
      "w": "heart attack",
      "pos": "phr.",
      "cn": "心脏病发作"
    },
    {
      "w": "high-end",
      "pos": "adj.",
      "cn": "高端的，高档的"
    },
    {
      "w": "hit",
      "pos": "v.",
      "cn": "遭遇，碰上（困难、堵车等）",
      "tip": "hit a problem / hit traffic 遇到麻烦/堵车"
    },
    {
      "w": "hold out",
      "pos": "phr.",
      "cn": "伸出；坚持",
      "tip": "hold out hope 抱有希望"
    },
    {
      "w": "hollow",
      "pos": "adj.",
      "cn": "空心的，凹陷的",
      "tip": "a hollow tree 空心树"
    },
    {
      "w": "honor",
      "pos": "n.",
      "cn": "荣誉",
      "tip": "in honor of 为纪念、向…致敬"
    },
    {
      "w": "household",
      "pos": "n.",
      "cn": "家庭，住户",
      "tip": "作形容词：household chores 家务活"
    },
    {
      "w": "hustle",
      "pos": "n.",
      "cn": "忙碌，喧嚣",
      "tip": "hustle and bustle 熙熙攘攘（写作描景可用）"
    },
    {
      "w": "I bet",
      "pos": "phr.",
      "cn": "我敢肯定",
      "tip": "口语高频，表示很有把握"
    },
    {
      "w": "identify",
      "pos": "v.",
      "cn": "识别，确认",
      "tip": "identify the problem 找出问题"
    },
    {
      "w": "immerse",
      "pos": "v.",
      "cn": "使沉浸",
      "tip": "be immersed in / immerse oneself in 沉浸于"
    },
    {
      "w": "imply",
      "pos": "v.",
      "cn": "暗示",
      "tip": "推断题题干高频：What does the author imply?"
    },
    {
      "w": "in addition to",
      "pos": "phr.",
      "cn": "除…之外（还有）",
      "tip": "表“额外还有”，区别于 except（排除在外）"
    },
    {
      "w": "in all respects",
      "pos": "phr.",
      "cn": "在各方面",
      "tip": "熟词生义：respect 作名词也指“方面”"
    },
    {
      "w": "in need of",
      "pos": "phr.",
      "cn": "需要…",
      "tip": "be in desperate/urgent need of 急需"
    },
    {
      "w": "in sight",
      "pos": "phr.",
      "cn": "看得见，即将到来",
      "tip": "no end in sight 遥遥无期"
    },
    {
      "w": "in stock",
      "pos": "phr.",
      "cn": "有货，有现货",
      "tip": "反义 out of stock 缺货"
    },
    {
      "w": "in terms of",
      "pos": "phr.",
      "cn": "就…而言，在…方面",
      "tip": "写作高频衔接语"
    },
    {
      "w": "in view of",
      "pos": "phr.",
      "cn": "鉴于，考虑到",
      "tip": "书面语，可代替 because of：In view of the bad weather..."
    },
    {
      "w": "indispensable",
      "pos": "adj.",
      "cn": "不可或缺的",
      "tip": "写作加分词：The Internet has become indispensable to daily life."
    },
    {
      "w": "infinite",
      "pos": "adj.",
      "cn": "无限的",
      "tip": "infinite possibilities 无限可能"
    },
    {
      "w": "infrastructure",
      "pos": "n.",
      "cn": "基础设施",
      "tip": "新闻高频：transport infrastructure 交通基础设施"
    },
    {
      "w": "ingenious",
      "pos": "adj.",
      "cn": "巧妙的，心灵手巧的",
      "tip": "an ingenious design/idea 巧妙的设计"
    },
    {
      "w": "inhabitant",
      "pos": "n.",
      "cn": "居民，栖息动物"
    },
    {
      "w": "inherent",
      "pos": "adj.",
      "cn": "固有的，内在的",
      "tip": "be inherent in 是…固有的"
    },
    {
      "w": "insight",
      "pos": "n.",
      "cn": "深刻见解，洞察力",
      "tip": "gain insight into 深入了解"
    },
    {
      "w": "inspire",
      "pos": "v.",
      "cn": "激励，启发",
      "tip": "inspiring 鼓舞人心的；inspiration n. 灵感"
    },
    {
      "w": "interact with",
      "pos": "phr.",
      "cn": "与…互动，交流",
      "tip": "interaction n. 互动；interactive adj. 互动的"
    },
    {
      "w": "intrigued",
      "pos": "adj.",
      "cn": "好奇的，被吸引的",
      "tip": "be intrigued by 对…深感好奇，阅读高频"
    },
    {
      "w": "intuitive",
      "pos": "adj.",
      "cn": "直觉的，易上手的",
      "tip": "科技文常见：an intuitive interface 好上手的界面"
    },
    {
      "w": "issue",
      "pos": "n.",
      "cn": "问题；（刊物的）一期",
      "tip": "熟词生义：the latest issue of the magazine 杂志最新一期"
    },
    {
      "w": "jet lag",
      "pos": "phr.",
      "cn": "时差反应",
      "tip": "suffer from jet lag 倒时差"
    },
    {
      "w": "judgmental",
      "pos": "adj.",
      "cn": "爱评判人的，苛责的",
      "tip": "态度题常见贬义词，形容人爱评头论足"
    },
    {
      "w": "justify",
      "pos": "v.",
      "cn": "证明…有理",
      "tip": "阅读选项常见：justify the claim 证明该说法成立"
    },
    {
      "w": "Keep the change.",
      "pos": "phr.",
      "cn": "不用找零了",
      "tip": "change 零钱"
    },
    {
      "w": "knock down",
      "pos": "phr.",
      "cn": "拆除，撞倒"
    },
    {
      "w": "land a job",
      "pos": "phr.",
      "cn": "谋得一份工作",
      "tip": "land 表\"成功获得\"：land a role/deal"
    },
    {
      "w": "landscape",
      "pos": "n.",
      "cn": "风景，景观",
      "tip": "游记、环保类文章常见"
    },
    {
      "w": "league",
      "pos": "n.",
      "cn": "联赛，联盟"
    },
    {
      "w": "leftovers",
      "pos": "n.",
      "cn": "剩饭菜"
    },
    {
      "w": "letdown",
      "pos": "n.",
      "cn": "令人失望的事",
      "tip": "动词短语 let sb. down 让某人失望"
    },
    {
      "w": "liberal",
      "pos": "adj.",
      "cn": "开明的，自由的",
      "tip": "liberal arts 文科"
    },
    {
      "w": "line of work",
      "pos": "phr.",
      "cn": "行业，工作性质",
      "tip": "What's your line of work? 你是做哪行的"
    },
    {
      "w": "line up",
      "pos": "phr.",
      "cn": "排队，排成一行"
    },
    {
      "w": "lines",
      "pos": "n.",
      "cn": "台词",
      "tip": "forget one's lines 忘词"
    },
    {
      "w": "literacy",
      "pos": "n.",
      "cn": "读写能力",
      "tip": "digital/media literacy 数字/媒介素养（新兴话题）"
    },
    {
      "w": "loan",
      "pos": "v.",
      "cn": "借出",
      "tip": "loan sth. to sb. 把某物借给某人；作名词指贷款"
    },
    {
      "w": "luggage allowance",
      "pos": "phr.",
      "cn": "行李限额",
      "tip": "机场场景听力词"
    },
    {
      "w": "maintain",
      "pos": "v.",
      "cn": "维持，保养",
      "tip": "熟词生义：maintain that... 坚持认为"
    },
    {
      "w": "make ends meet",
      "pos": "phr.",
      "cn": "收支相抵，勉强维持生计",
      "tip": "民生话题阅读高频"
    },
    {
      "w": "make it to",
      "pos": "phr.",
      "cn": "成功到达，晋级到",
      "tip": "make it to the finals 挺进决赛；make it 也表\"成功、赶上\""
    },
    {
      "w": "make use of",
      "pos": "phr.",
      "cn": "利用",
      "tip": "写作加分：make full/good use of 充分利用"
    },
    {
      "w": "make-up exam",
      "pos": "phr.",
      "cn": "补考",
      "tip": "make up 补上（落下的课、考试）"
    },
    {
      "w": "manually",
      "pos": "adv.",
      "cn": "手动地，人工地"
    },
    {
      "w": "mark down",
      "pos": "phr.",
      "cn": "减价，降价出售"
    },
    {
      "w": "master's",
      "pos": "n.",
      "cn": "硕士学位",
      "tip": "master's degree；bachelor's 学士学位"
    },
    {
      "w": "might as well",
      "pos": "phr.",
      "cn": "不妨，还是…为好",
      "tip": "口语高频：We might as well walk. 咱们不如走路去"
    },
    {
      "w": "milestone",
      "pos": "n.",
      "cn": "里程碑",
      "tip": "a milestone in one's life 人生的里程碑"
    },
    {
      "w": "miserable",
      "pos": "adj.",
      "cn": "痛苦的，悲惨的",
      "tip": "feel miserable 难受极了；misery n. 痛苦"
    },
    {
      "w": "mock",
      "pos": "v.",
      "cn": "嘲笑",
      "tip": "mock exam 模拟考试"
    },
    {
      "w": "MOOC",
      "pos": "n.",
      "cn": "慕课，大型开放式网络课程",
      "tip": "读作 /muːk/，在线教育类文章常见"
    },
    {
      "w": "moreover",
      "pos": "adv.",
      "cn": "此外，而且",
      "tip": "写作衔接词，= furthermore"
    },
    {
      "w": "native",
      "pos": "adj.",
      "cn": "本地的，原产的",
      "tip": "be native to 原产于；native speaker 母语者"
    },
    {
      "w": "necessity",
      "pos": "n.",
      "cn": "必需品；必要性",
      "tip": "daily necessities 生活必需品"
    },
    {
      "w": "newsletter",
      "pos": "n.",
      "cn": "简报，通讯",
      "tip": "应用文写作常见：school newsletter 校园简报"
    },
    {
      "w": "not know the first thing about",
      "pos": "phr.",
      "cn": "对…一窍不通"
    },
    {
      "w": "not one's thing",
      "pos": "phr.",
      "cn": "不合某人的兴趣",
      "tip": "口语：It's not really my thing. 我不太感冒"
    },
    {
      "w": "object",
      "pos": "v.",
      "cn": "反对",
      "tip": "object to doing sth.；作名词指物体、目标"
    },
    {
      "w": "obtain",
      "pos": "v.",
      "cn": "获得",
      "tip": "正式用词，写作替换 get"
    },
    {
      "w": "occasion",
      "pos": "n.",
      "cn": "场合，时机",
      "tip": "on special occasions 在特殊场合"
    },
    {
      "w": "on average",
      "pos": "phr.",
      "cn": "平均而言",
      "tip": "图表作文常用"
    },
    {
      "w": "on board",
      "pos": "phr.",
      "cn": "在飞机（船、车）上",
      "tip": "Welcome on board! 欢迎登机"
    },
    {
      "w": "optimistic",
      "pos": "adj.",
      "cn": "乐观的",
      "tip": "态度题高频；反义 pessimistic 悲观的"
    },
    {
      "w": "originate from",
      "pos": "phr.",
      "cn": "起源于",
      "tip": "介绍节日、习俗来源常用"
    },
    {
      "w": "otherwise",
      "pos": "adv.",
      "cn": "否则",
      "tip": "写作：Start now; otherwise it will be too late."
    },
    {
      "w": "outlet",
      "pos": "n.",
      "cn": "出口；宣泄途径",
      "tip": "an outlet for emotions 情绪宣泄口；也指专卖店"
    },
    {
      "w": "outline",
      "pos": "n.",
      "cn": "提纲，概要",
      "tip": "写作前列提纲；作动词指概述"
    },
    {
      "w": "outskirts",
      "pos": "n.",
      "cn": "郊区，市郊",
      "tip": "on the outskirts of the city 在市郊"
    },
    {
      "w": "overcast",
      "pos": "adj.",
      "cn": "阴天的，多云的",
      "tip": "天气场景，约等于 cloudy"
    },
    {
      "w": "overrated",
      "pos": "adj.",
      "cn": "被高估的",
      "tip": "反义 underrated 被低估的"
    },
    {
      "w": "overthrow",
      "pos": "v.",
      "cn": "推翻",
      "tip": "历史类文章常见：overthrow the rule 推翻统治"
    },
    {
      "w": "overweight",
      "pos": "adj.",
      "cn": "超重的",
      "tip": "行李、体重超标都用它"
    },
    {
      "w": "package tour",
      "pos": "phr.",
      "cn": "跟团游，包价旅游"
    },
    {
      "w": "pandemic",
      "pos": "n.",
      "cn": "大流行病",
      "tip": "the COVID-19 pandemic；范围比 epidemic 更大"
    },
    {
      "w": "paper jam",
      "pos": "phr.",
      "cn": "（打印机）卡纸",
      "tip": "办公场景听力词"
    },
    {
      "w": "paradox",
      "pos": "n.",
      "cn": "悖论，矛盾的事物"
    },
    {
      "w": "participant",
      "pos": "n.",
      "cn": "参与者",
      "tip": "实验研究类文章高频；participate in 参加"
    },
    {
      "w": "pass on",
      "pos": "phr.",
      "cn": "传递；（口语）不要，放弃",
      "tip": "I'll pass on dessert. 甜点我就不要了"
    },
    {
      "w": "pattern",
      "pos": "n.",
      "cn": "模式，图案",
      "tip": "sleep patterns 睡眠模式"
    },
    {
      "w": "pay by installments",
      "pos": "phr.",
      "cn": "分期付款"
    },
    {
      "w": "pension",
      "pos": "n.",
      "cn": "养老金，退休金"
    },
    {
      "w": "persistent",
      "pos": "adj.",
      "cn": "坚持不懈的，持续的",
      "tip": "写人物品质高频词；persist in doing 坚持做"
    },
    {
      "w": "personalized",
      "pos": "adj.",
      "cn": "个性化的",
      "tip": "科技类文章常见：personalized recommendations"
    },
    {
      "w": "philosophy",
      "pos": "n.",
      "cn": "哲学；人生观",
      "tip": "one's philosophy of life 处世哲学"
    },
    {
      "w": "pitch",
      "pos": "n.",
      "cn": "球场",
      "tip": "football pitch 足球场（英式）；sales pitch 推销话术"
    },
    {
      "w": "place",
      "pos": "n.",
      "cn": "（学校的）名额，录取资格",
      "tip": "熟词生义：win a place at university 拿到大学入学名额"
    },
    {
      "w": "point of view",
      "pos": "phr.",
      "cn": "观点，看法",
      "tip": "from my point of view 在我看来"
    },
    {
      "w": "popularity",
      "pos": "n.",
      "cn": "流行，受欢迎",
      "tip": "gain/enjoy great popularity 广受欢迎"
    },
    {
      "w": "postage",
      "pos": "n.",
      "cn": "邮资，邮费"
    },
    {
      "w": "predict",
      "pos": "v.",
      "cn": "预测",
      "tip": "prediction n.；推断题常见 What can be predicted...?"
    },
    {
      "w": "preference",
      "pos": "n.",
      "cn": "偏好",
      "tip": "have a preference for 偏爱；prefer v."
    },
    {
      "w": "prejudice",
      "pos": "n.",
      "cn": "偏见",
      "tip": "prejudice against 对…的偏见"
    },
    {
      "w": "preserve",
      "pos": "v.",
      "cn": "保护，保存",
      "tip": "preserve traditional culture 保护传统文化；preservation n."
    },
    {
      "w": "presumably",
      "pos": "adv.",
      "cn": "大概，据推测",
      "tip": "阅读推断题常见语气词；presume v. 推测"
    },
    {
      "w": "prevalent",
      "pos": "adj.",
      "cn": "普遍的，盛行的",
      "tip": "be prevalent among teenagers 在青少年中很普遍"
    },
    {
      "w": "priceless",
      "pos": "adj.",
      "cn": "无价的，极珍贵的",
      "tip": "易误解：-less 在此不表否定，= invaluable"
    },
    {
      "w": "privacy",
      "pos": "n.",
      "cn": "隐私",
      "tip": "protect personal privacy，科技类话题高频"
    },
    {
      "w": "procedure",
      "pos": "n.",
      "cn": "程序，步骤",
      "tip": "follow the procedure 按步骤操作"
    },
    {
      "w": "proceed",
      "pos": "v.",
      "cn": "继续进行",
      "tip": "易与 precede（先于）混淆"
    },
    {
      "w": "prolong",
      "pos": "v.",
      "cn": "延长",
      "tip": "prolong life 延长寿命"
    },
    {
      "w": "pull out",
      "pos": "phr.",
      "cn": "退出；（车）驶出",
      "tip": "pull out of the competition 退赛"
    },
    {
      "w": "pushy",
      "pos": "adj.",
      "cn": "咄咄逼人的，强行出头的",
      "tip": "态度题贬义词"
    },
    {
      "w": "put off",
      "pos": "phr.",
      "cn": "推迟，使失去兴趣",
      "tip": "put off the meeting 推迟会议；put sb. off 让某人倒胃口"
    },
    {
      "w": "put together",
      "pos": "phr.",
      "cn": "组装，整理汇总",
      "tip": "put together a plan 拟出方案"
    },
    {
      "w": "queue up",
      "pos": "phr.",
      "cn": "排队",
      "tip": "英式说法，美式常用 line up"
    },
    {
      "w": "radical",
      "pos": "adj.",
      "cn": "激进的，彻底的",
      "tip": "radical changes 彻底的变革"
    },
    {
      "w": "raise",
      "pos": "v.",
      "cn": "提高；筹集",
      "tip": "raise money 筹款；及物动词，区别于 rise"
    },
    {
      "w": "receipt",
      "pos": "n.",
      "cn": "收据，小票",
      "tip": "p 不发音 /rɪˈsiːt/"
    },
    {
      "w": "recognition",
      "pos": "n.",
      "cn": "认可；识别",
      "tip": "in recognition of 为表彰；facial recognition 人脸识别"
    },
    {
      "w": "recommendation",
      "pos": "n.",
      "cn": "推荐，建议",
      "tip": "a letter of recommendation 推荐信"
    },
    {
      "w": "red-eye flight",
      "pos": "phr.",
      "cn": "红眼航班，夜间航班"
    },
    {
      "w": "release",
      "pos": "v.",
      "cn": "释放；发布",
      "tip": "release a film/album 发行电影/专辑"
    },
    {
      "w": "relevance",
      "pos": "n.",
      "cn": "相关性，现实意义",
      "tip": "be relevant to 与…相关"
    },
    {
      "w": "reliable",
      "pos": "adj.",
      "cn": "可靠的",
      "tip": "a reliable source 可靠来源；rely on 依赖"
    },
    {
      "w": "renew",
      "pos": "v.",
      "cn": "续借，更新（合同、证件）",
      "tip": "renew a library book/passport"
    },
    {
      "w": "renewable energy",
      "pos": "phr.",
      "cn": "可再生能源",
      "tip": "环保类作文常用，太阳能风能均属此类"
    },
    {
      "w": "represent",
      "pos": "v.",
      "cn": "代表，象征",
      "tip": "represent one's school in the contest 代表学校参赛"
    },
    {
      "w": "reputation",
      "pos": "n.",
      "cn": "名声，声誉",
      "tip": "enjoy a high reputation 享有盛誉"
    },
    {
      "w": "resident",
      "pos": "n.",
      "cn": "居民",
      "tip": "local residents 当地居民；reside v. 居住"
    },
    {
      "w": "resourceful",
      "pos": "adj.",
      "cn": "足智多谋的",
      "tip": "描写人物品质常用词"
    },
    {
      "w": "restore",
      "pos": "v.",
      "cn": "修复，恢复",
      "tip": "restore an old building 修复古建筑；restoration n."
    },
    {
      "w": "retailer",
      "pos": "n.",
      "cn": "零售商",
      "tip": "retail 零售；online retailer 网络零售商"
    },
    {
      "w": "reveal",
      "pos": "v.",
      "cn": "揭示，透露",
      "tip": "研究发现常用：The study reveals that..."
    },
    {
      "w": "revise",
      "pos": "v.",
      "cn": "修改，复习",
      "tip": "revise a plan 修改计划；英式英语中也指复习备考"
    },
    {
      "w": "revolve",
      "pos": "v.",
      "cn": "旋转",
      "tip": "revolve around 围绕…展开、以…为中心"
    },
    {
      "w": "rigorous",
      "pos": "adj.",
      "cn": "严格的，严谨的",
      "tip": "rigorous training 严格的训练"
    },
    {
      "w": "rival",
      "pos": "n.",
      "cn": "对手，竞争者",
      "tip": "近 competitor；rivalry n. 竞争"
    },
    {
      "w": "roll out",
      "pos": "phr.",
      "cn": "推出（产品、政策）",
      "tip": "新闻高频：roll out a new policy"
    },
    {
      "w": "run into",
      "pos": "phr.",
      "cn": "偶然遇见，撞上",
      "tip": "run into trouble 陷入麻烦"
    },
    {
      "w": "save sb. doing sth.",
      "pos": "phr.",
      "cn": "使某人免于做某事，省得",
      "tip": "It saves me cooking. 这样我就不用做饭了"
    },
    {
      "w": "scheme",
      "pos": "n.",
      "cn": "计划，方案",
      "tip": "英式新闻常见：a pension scheme 养老金计划"
    },
    {
      "w": "scratch",
      "pos": "v.",
      "cn": "抓，挠",
      "tip": "start from scratch 从零开始；scratch the surface 浅尝辄止"
    },
    {
      "w": "sector",
      "pos": "n.",
      "cn": "行业，部门",
      "tip": "the public/private sector 公共/私营部门"
    },
    {
      "w": "self-conscious",
      "pos": "adj.",
      "cn": "难为情的，不自在的",
      "tip": "指在意别人眼光而拘束：be self-conscious about one's looks 为长相感到不自在"
    },
    {
      "w": "sensation",
      "pos": "n.",
      "cn": "感觉；轰动",
      "tip": "cause a sensation 引起轰动"
    },
    {
      "w": "serious",
      "pos": "adj.",
      "cn": "认真的，热衷的",
      "tip": "be serious about sth. 对…是认真的"
    },
    {
      "w": "set out",
      "pos": "phr.",
      "cn": "出发，动身",
      "tip": "set out on a journey 踏上旅途；set out to do 着手做"
    },
    {
      "w": "short-staffed",
      "pos": "adj.",
      "cn": "人手不足的"
    },
    {
      "w": "sibling",
      "pos": "n.",
      "cn": "兄弟姐妹",
      "tip": "统称，不分兄或妹"
    },
    {
      "w": "signature dish",
      "pos": "phr.",
      "cn": "招牌菜",
      "tip": "signature 作形容词表示“标志性的”"
    },
    {
      "w": "sit around",
      "pos": "phr.",
      "cn": "闲坐，无所事事"
    },
    {
      "w": "slack off",
      "pos": "phr.",
      "cn": "偷懒，松懈",
      "tip": "Don't slack off in your studies. 学习上别松懈"
    },
    {
      "w": "smash",
      "pos": "v.",
      "cn": "打碎，猛撞",
      "tip": "smash into 猛地撞上"
    },
    {
      "w": "sole",
      "pos": "adj.",
      "cn": "唯一的",
      "tip": "sole purpose 唯一目的；solely adv. 仅仅"
    },
    {
      "w": "solitude",
      "pos": "n.",
      "cn": "独处",
      "tip": "enjoy solitude 享受独处，中性词，区别于 loneliness 孤独感"
    },
    {
      "w": "sound the alarm",
      "pos": "phr.",
      "cn": "敲响警钟",
      "tip": "新闻和议论文表达担忧常用"
    },
    {
      "w": "souvenir",
      "pos": "n.",
      "cn": "纪念品",
      "tip": "旅游场景高频，注意拼写"
    },
    {
      "w": "species",
      "pos": "n.",
      "cn": "物种",
      "tip": "单复数同形：an endangered species 濒危物种"
    },
    {
      "w": "specific",
      "pos": "adj.",
      "cn": "具体的，特定的",
      "tip": "to be specific 具体来说"
    },
    {
      "w": "speculate",
      "pos": "v.",
      "cn": "推测，猜测",
      "tip": "新闻常见：Experts speculate that..."
    },
    {
      "w": "spell",
      "pos": "v.",
      "cn": "拼写；意味着",
      "tip": "熟词生义：spell trouble/disaster 意味着麻烦/灾难"
    },
    {
      "w": "spouse",
      "pos": "n.",
      "cn": "配偶",
      "tip": "正式用词，表格和新闻中常见"
    },
    {
      "w": "start off",
      "pos": "phr.",
      "cn": "开始，起步",
      "tip": "start off as… 以…起步"
    },
    {
      "w": "startled",
      "pos": "adj.",
      "cn": "受惊的，吃惊的",
      "tip": "be startled by 被…吓一跳，记叙文常见"
    },
    {
      "w": "state-of-the-art",
      "pos": "adj.",
      "cn": "最先进的",
      "tip": "作定语：state-of-the-art technology 尖端技术"
    },
    {
      "w": "step out",
      "pos": "phr.",
      "cn": "出去一会儿，暂时离开",
      "tip": "电话场景：He just stepped out. 他刚出去"
    },
    {
      "w": "stock up on",
      "pos": "phr.",
      "cn": "囤积，大量购买储备"
    },
    {
      "w": "stopover",
      "pos": "n.",
      "cn": "中途停留，经停",
      "tip": "a stopover in Dubai 在迪拜中转"
    },
    {
      "w": "straight",
      "pos": "adv.",
      "cn": "连续地；径直",
      "tip": "熟词生义：for three days straight 连续三天"
    },
    {
      "w": "strike",
      "pos": "v.",
      "cn": "使突然想到，给…留下印象",
      "tip": "It struck me that… 我突然意识到…"
    },
    {
      "w": "student council",
      "pos": "phr.",
      "cn": "学生会"
    },
    {
      "w": "subscribe",
      "pos": "v.",
      "cn": "订阅",
      "tip": "subscribe to a channel/magazine 订阅；名词 subscription"
    },
    {
      "w": "surroundings",
      "pos": "n.",
      "cn": "周围环境",
      "tip": "常用复数：adapt to new surroundings 适应新环境"
    },
    {
      "w": "suspend",
      "pos": "v.",
      "cn": "暂停，中止",
      "tip": "suspend classes 停课"
    },
    {
      "w": "sustain",
      "pos": "v.",
      "cn": "维持，支撑",
      "tip": "sustainable development 可持续发展"
    },
    {
      "w": "tackle",
      "pos": "v.",
      "cn": "解决，应对",
      "tip": "tackle a problem 高频搭配"
    },
    {
      "w": "tailor",
      "pos": "v.",
      "cn": "定制，使适合",
      "tip": "熟词生义：be tailored to 为…量身打造（本义裁缝）"
    },
    {
      "w": "take a rain check",
      "pos": "phr.",
      "cn": "改天再约，下次再说",
      "tip": "听力高频婉拒用语"
    },
    {
      "w": "there's no harm in doing sth.",
      "pos": "phr.",
      "cn": "做…也无妨，不妨一试"
    },
    {
      "w": "timely",
      "pos": "adj.",
      "cn": "及时的",
      "tip": "是形容词不是副词：in a timely manner 及时地"
    },
    {
      "w": "title",
      "pos": "n.",
      "cn": "冠军，锦标",
      "tip": "熟词生义：win the title 夺冠"
    },
    {
      "w": "to one's credit",
      "pos": "phr.",
      "cn": "值得称赞的是",
      "tip": "写作可用：To his credit, he admitted his mistake."
    },
    {
      "w": "today's special",
      "pos": "phr.",
      "cn": "今日特色菜，今日特价",
      "tip": "餐厅场景听力词"
    },
    {
      "w": "toss",
      "pos": "v.",
      "cn": "抛，扔",
      "tip": "toss a coin 抛硬币"
    },
    {
      "w": "track record",
      "pos": "n.",
      "cn": "过往业绩，履历",
      "tip": "a proven track record 良好的过往表现"
    },
    {
      "w": "trademark",
      "pos": "n.",
      "cn": "商标，标志性特征"
    },
    {
      "w": "transform",
      "pos": "v.",
      "cn": "使改变，改造",
      "tip": "transform A into B"
    },
    {
      "w": "trivial",
      "pos": "adj.",
      "cn": "琐碎的，微不足道的",
      "tip": "trivial matters 琐事"
    },
    {
      "w": "tune in",
      "pos": "phr.",
      "cn": "收听，收看",
      "tip": "广播节目常说 Thanks for tuning in."
    },
    {
      "w": "tutorial",
      "pos": "n.",
      "cn": "辅导课，教程",
      "tip": "网络语境常指入门教学视频"
    },
    {
      "w": "undergo",
      "pos": "v.",
      "cn": "经历，接受",
      "tip": "undergo changes/surgery 经历变化/接受手术；过去式 underwent"
    },
    {
      "w": "upright",
      "pos": "adj.",
      "cn": "正直的，直立的",
      "tip": "sit upright 坐直"
    },
    {
      "w": "upset",
      "pos": "v.",
      "cn": "打乱，搅乱（计划、安排）",
      "tip": "熟词生义：不止\"使难过\"，还可指打乱计划"
    },
    {
      "w": "vaccination",
      "pos": "n.",
      "cn": "疫苗接种",
      "tip": "get vaccinated 接种疫苗；vaccine n. 疫苗"
    },
    {
      "w": "valid",
      "pos": "adj.",
      "cn": "有效的，合理的",
      "tip": "a valid ticket/reason 有效车票/正当理由"
    },
    {
      "w": "vary from ... to ...",
      "pos": "phr.",
      "cn": "从…到…各不相同",
      "tip": "vary v. 变化；variety n. 种类"
    },
    {
      "w": "vicious",
      "pos": "adj.",
      "cn": "恶毒的，凶险的",
      "tip": "vicious circle 恶性循环"
    },
    {
      "w": "victim",
      "pos": "n.",
      "cn": "受害者",
      "tip": "fall victim to 成为…的受害者"
    },
    {
      "w": "vigilant",
      "pos": "adj.",
      "cn": "警惕的",
      "tip": "常见搭配 stay/remain vigilant 保持警惕"
    },
    {
      "w": "virtual",
      "pos": "adj.",
      "cn": "虚拟的",
      "tip": "virtual reality (VR) 虚拟现实"
    },
    {
      "w": "vital",
      "pos": "adj.",
      "cn": "至关重要的",
      "tip": "写作替换 important；vitality n. 活力"
    },
    {
      "w": "wait and see",
      "pos": "phr.",
      "cn": "等等看，观望"
    },
    {
      "w": "wallpaper",
      "pos": "n.",
      "cn": "壁纸，墙纸",
      "tip": "也指手机/电脑桌面壁纸"
    },
    {
      "w": "washing-up",
      "pos": "n.",
      "cn": "洗碗，洗餐具",
      "tip": "英式：do the washing-up 洗碗"
    },
    {
      "w": "weed",
      "pos": "n.",
      "cn": "杂草",
      "tip": "园艺类文章常见；作动词指除草"
    },
    {
      "w": "well-informed",
      "pos": "adj.",
      "cn": "见多识广的，消息灵通的"
    },
    {
      "w": "withdraw",
      "pos": "v.",
      "cn": "取（钱），退出",
      "tip": "withdraw cash 取现金；withdraw from the race 退赛"
    },
    {
      "w": "witty",
      "pos": "adj.",
      "cn": "风趣的，机智诙谐的"
    },
    {
      "w": "work placement",
      "pos": "phr.",
      "cn": "实习（岗位）",
      "tip": "英式说法，美式多用 internship"
    },
    {
      "w": "zip code",
      "pos": "phr.",
      "cn": "邮政编码",
      "tip": "美式；英式 postcode"
    }
  ]
};
