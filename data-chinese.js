/* =====================================================================
   苏考图谱 · 语文数据 (js/data-chinese.js)
   ---------------------------------------------------------------------
   框架已就绪，真实数据整理中。字段结构与数学完全一致：
   主专题 topic → 子专题 subTopic → 题型 type → 答题方法 method
   ⚠ 当前题目为「示例数据」，用于演示语文卷的拆解方式。
   ===================================================================== */

const DATA_CHINESE = {
  id: "chinese", name: "语文", status: "beta",

  /* ---------- 主专题（按新高考语文卷结构） ---------- */
  topics: [
    { id: "yw-info", name: "现代文阅读Ⅰ（信息类）", priority: "高",
      subTopics: ["信息筛选与整合", "论证分析", "观点评价与探究"],
      sections: ["第1-5题 · 约19分"],
      advice: "选择题重比对原文，主观题重「文本依据+分层作答」；常见非连续文本组合（图表+新闻+科普），近年常联系现实情境设问。" },

    { id: "yw-lit", name: "现代文阅读Ⅱ（文学类）", priority: "中",
      subTopics: ["小说阅读", "散文阅读", "艺术手法赏析", "标题与主旨"],
      sections: ["第6-9题 · 约16分"],
      advice: "主观题失分重灾区：练「手法+内容+效果」三段式答题结构，注意新教材篇目风格。" },

    { id: "yw-classical", name: "文言文阅读", priority: "高",
      subTopics: ["实词虚词", "文言断句", "文言翻译", "内容概括与观点"],
      sections: ["第10-14题 · 约20分"],
      advice: "翻译是核心得分点：直译为主、字字落实，重点积累120个实词与18个虚词。" },

    { id: "yw-poetry", name: "古代诗歌鉴赏", priority: "中",
      subTopics: ["形象与意境", "表达技巧", "情感与主旨"],
      sections: ["第15-16题 · 约9分"],
      advice: "先读懂再答题：抓标题、作者、注释三个信息源，答题套用「术语+诗句+分析」。" },

    { id: "yw-dictation", name: "名篇名句默写", priority: "高",
      subTopics: ["情境默写"],
      sections: ["第17题 · 6分"],
      advice: "纯积累送分题——第一优先级：按考纲篇目滚动默写，6分必须全拿，重点防错别字。" },

    { id: "yw-language", name: "语言文字运用", priority: "中",
      subTopics: ["词语与病句", "修辞与句式", "语段压缩与衔接"],
      sections: ["第18-22题 · 约20分"],
      advice: "近年题型最灵活的板块，成语、病句、修辞轮换出现，建议按题型专项训练。" },

    { id: "yw-writing", name: "写作", priority: "高",
      subTopics: ["材料作文审题", "议论文写作", "记叙文写作"],
      sections: ["第23题 · 60分"],
      advice: "占全卷40%分值：每周一次审题训练+素材积累，重点打磨议论文结构与开头结尾。" }
  ],

  /* ---------- 试卷 ---------- */
  papers: [
    { id: "2025-YW1", year: 2025, name: "2025 新高考Ⅰ卷 语文", type: "真题", total: 23, status: "部分整理", structure: "现代文Ⅰ+现代文Ⅱ+文言文+诗歌+默写+语用+作文 · 150分" },
    { id: "2024-YW1", year: 2024, name: "2024 新高考Ⅰ卷 语文", type: "真题", total: 23, status: "整理中",   structure: "现代文Ⅰ+现代文Ⅱ+文言文+诗歌+默写+语用+作文 · 150分" }
  ],

  /* ---------- 题目（示例） ---------- */
  questions: [
    { id: "2025-YW1-03", paperId: "2025-YW1", number: 3,  section: "现代文Ⅰ", score: 3,  topic: "yw-info",      subTopic: "论证分析",       type: "论证方法与思路辨析", method: "定位原文+逐项比对", difficulty: 3, priority: "高", tags: ["高频"], note: "", related: [] },
    { id: "2025-YW1-05", paperId: "2025-YW1", number: 5,  section: "现代文Ⅰ", score: 6,  topic: "yw-info",      subTopic: "观点评价与探究", type: "结合材料谈看法",     method: "文本依据+现实举例", difficulty: 4, priority: "高", tags: ["主观题"], note: "分点作答，每点先亮观点再给依据。", related: [] },
    { id: "2025-YW1-08", paperId: "2025-YW1", number: 8,  section: "现代文Ⅱ", score: 4,  topic: "yw-lit",       subTopic: "艺术手法赏析",   type: "划线句表达效果",     method: "手法+内容+效果三段式", difficulty: 4, priority: "中", tags: ["主观题", "易失分"], note: "", related: [] },
    { id: "2025-YW1-10", paperId: "2025-YW1", number: 10, section: "文言文",   score: 3,  topic: "yw-classical", subTopic: "文言断句",       type: "文言断句选择",       method: "抓虚词与句式标志", difficulty: 3, priority: "高", tags: ["高频"], note: "", related: [] },
    { id: "2025-YW1-13", paperId: "2025-YW1", number: 13, section: "文言文",   score: 8,  topic: "yw-classical", subTopic: "文言翻译",       type: "文言语句翻译",       method: "直译为主·字字落实", difficulty: 3, priority: "高", tags: ["高频", "必拿分"], note: "得分点通常是2个实词+1个句式。", related: [] },
    { id: "2025-YW1-16", paperId: "2025-YW1", number: 16, section: "古诗鉴赏", score: 6,  topic: "yw-poetry",    subTopic: "情感与主旨",     type: "诗歌情感分析",       method: "术语+诗句+分析", difficulty: 4, priority: "中", tags: ["主观题"], note: "", related: [] },
    { id: "2025-YW1-17", paperId: "2025-YW1", number: 17, section: "默写",     score: 6,  topic: "yw-dictation", subTopic: "情境默写",       type: "理解性情境默写",     method: "关键词定位篇目", difficulty: 2, priority: "高", tags: ["必拿分"], note: "", related: [] },
    { id: "2025-YW1-19", paperId: "2025-YW1", number: 19, section: "语用",     score: 4,  topic: "yw-language",  subTopic: "修辞与句式",     type: "修辞手法及效果",     method: "辨析修辞+说明效果", difficulty: 3, priority: "中", tags: [], note: "", related: [] },
    { id: "2025-YW1-23", paperId: "2025-YW1", number: 23, section: "作文",     score: 60, topic: "yw-writing",   subTopic: "材料作文审题",   type: "思辨类材料作文",     method: "审题立意三步法", difficulty: 4, priority: "高", tags: ["压轴", "占分最高"], note: "近年偏向思辨型二元/三元关系题。", related: [] }
  ]
};
