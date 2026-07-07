/* =====================================================================
   苏考图谱 · 英语数据 (js/data-english.js)
   ---------------------------------------------------------------------
   框架已就绪，真实数据整理中。字段结构与数学完全一致：
   主专题 topic → 子专题 subTopic → 题型 type → 答题方法 method
   ⚠ 当前题目为「示例数据」，用于演示英语卷的拆解方式。
   ===================================================================== */

const DATA_ENGLISH = {
  id: "english", name: "英语", status: "beta",

  /* ---------- 主专题（按新高考英语卷结构） ---------- */
  topics: [
    { id: "yy-listening", name: "听力", priority: "中",
      subTopics: ["短对话理解", "长对话与独白"],
      sections: ["第1-20题 · 30分"],
      advice: "每天15分钟精听+泛听结合，重点抓数字、地点、态度类信息词。" },

    { id: "yy-reading", name: "阅读理解", priority: "高",
      subTopics: ["细节理解", "推理判断", "主旨大意", "词义猜测"],
      sections: ["第21-35题 · 37.5分"],
      advice: "占分最高的板块：练「题干定位→原文比对→同义替换识别」，D篇科普文是难度高点。" },

    { id: "yy-cloze7", name: "七选五", priority: "中",
      subTopics: ["上下文衔接", "段落主题匹配"],
      sections: ["第36-40题 · 12.5分"],
      advice: "重点看空前空后句，利用代词、复现词、逻辑连接词定位，错一个常连错两个。" },

    { id: "yy-cloze", name: "完形填空", priority: "中",
      subTopics: ["词汇复现", "逻辑推理", "情感线索"],
      sections: ["第41-55题 · 15分"],
      advice: "记叙文为主：抓情感主线和上下文复现，先通读再逐空，不确定的空最后回补。" },

    { id: "yy-grammar", name: "语法填空", priority: "高",
      subTopics: ["谓语动词", "非谓语动词", "词性转换", "连词与介词"],
      sections: ["第56-65题 · 15分"],
      advice: "有提示词先判断词性，无提示词优先考虑冠词/介词/连词，谓语与非谓语是核心考点。" },

    { id: "yy-applied", name: "应用文写作", priority: "高",
      subTopics: ["邀请信", "建议信", "通知与倡议"],
      sections: ["第66题 · 15分"],
      advice: "三段式结构+高级句型模板化训练，重点防时态与格式错误，15分钟内完成。" },

    { id: "yy-continuation", name: "读后续写", priority: "中",
      subTopics: ["情节构思", "情感与描写", "语言衔接"],
      sections: ["第67题 · 25分"],
      advice: "拉开差距的题：练「情节合理+情感升华+动作描写」三要素，积累描写类语料库。" }
  ],

  /* ---------- 试卷 ---------- */
  papers: [
    { id: "2025-YY1", year: 2025, name: "2025 新高考Ⅰ卷 英语", type: "真题", total: 67, status: "部分整理", structure: "听力+阅读+七选五+完形+语法填空+应用文+续写 · 150分" },
    { id: "2024-YY1", year: 2024, name: "2024 新高考Ⅰ卷 英语", type: "真题", total: 67, status: "整理中",   structure: "听力+阅读+七选五+完形+语法填空+应用文+续写 · 150分" }
  ],

  /* ---------- 题目（示例） ---------- */
  questions: [
    { id: "2025-YY1-23", paperId: "2025-YY1", number: 23, section: "阅读理解", score: 2.5, topic: "yy-reading",      subTopic: "细节理解",   type: "细节定位题(B篇)",     method: "题干关键词定位", difficulty: 2, priority: "高", tags: ["高频"], note: "", related: [] },
    { id: "2025-YY1-28", paperId: "2025-YY1", number: 28, section: "阅读理解", score: 2.5, topic: "yy-reading",      subTopic: "推理判断",   type: "推理判断题(C篇)",     method: "排除绝对化选项", difficulty: 3, priority: "高", tags: ["高频"], note: "", related: [] },
    { id: "2025-YY1-32", paperId: "2025-YY1", number: 32, section: "阅读理解", score: 2.5, topic: "yy-reading",      subTopic: "主旨大意",   type: "主旨标题题(D篇)",     method: "首尾段+高频词归纳", difficulty: 4, priority: "中", tags: ["易失分"], note: "D篇多为科普文，生词多但考点固定。", related: [] },
    { id: "2025-YY1-37", paperId: "2025-YY1", number: 37, section: "七选五",   score: 2.5, topic: "yy-cloze7",       subTopic: "上下文衔接", type: "段中衔接题",          method: "代词与复现定位", difficulty: 3, priority: "中", tags: [], note: "", related: [] },
    { id: "2025-YY1-45", paperId: "2025-YY1", number: 45, section: "完形填空", score: 1,   topic: "yy-cloze",        subTopic: "逻辑推理",   type: "上下文逻辑题",        method: "前后文线索呼应", difficulty: 3, priority: "中", tags: [], note: "", related: [] },
    { id: "2025-YY1-58", paperId: "2025-YY1", number: 58, section: "语法填空", score: 1.5, topic: "yy-grammar",      subTopic: "非谓语动词", type: "非谓语动词填空",      method: "判断逻辑主语关系", difficulty: 3, priority: "高", tags: ["高频"], note: "", related: [] },
    { id: "2025-YY1-66", paperId: "2025-YY1", number: 66, section: "应用文",   score: 15,  topic: "yy-applied",      subTopic: "邀请信",     type: "应用文写作(邀请信)",  method: "三段式结构模板", difficulty: 2, priority: "高", tags: ["必拿分"], note: "", related: [] },
    { id: "2025-YY1-67", paperId: "2025-YY1", number: 67, section: "读后续写", score: 25,  topic: "yy-continuation", subTopic: "情节构思",   type: "读后续写",            method: "情节双线+情感升华", difficulty: 4, priority: "中", tags: ["压轴", "拉分题"], note: "两段首句已给出，续写方向要贴合首句。", related: [] }
  ]
};
