import {
  UserSearch,
  History,
  Target,
  PenTool,
  BookOpen,
  Sparkles,
  FileSearch,
  CheckCircle,
} from "lucide-react";

export const ANALYSIS_TEMPLATES = [
  {
    icon: <History className="w-4 h-4 text-purple-500" />,
    label: "過去の振り返り",
    prompt:
      "過去の経験から「自分の価値観」を見つけたいです。小学生から現在までの「モチベーショングラフ」を作るつもりで、私の過去について質問してください。",
    description: "モチベーションの源泉",
  },
  {
    icon: <Target className="w-4 h-4 text-blue-500" />,
    label: "キャリアの軸",
    prompt:
      "「やりたいこと(Will)」「できること(Can)」「やるべきこと(Must)」のフレームワークを使って、私のキャリアの軸を整理したいです。まずはWillから聞いてください。",
    description: "Will-Can-Must",
  },
  {
    icon: <UserSearch className="w-4 h-4 text-orange-500" />,
    label: "強みの発掘",
    prompt:
      "自分の強みがわかりません。客観的な視点で私の長所を見つけたいので、私の性格や普段の行動についてインタビューしてください。",
    description: "客観的に強み",
  },
];

export const CREATE_TEMPLATES = [
  {
    icon: <PenTool className="w-4 h-4 text-green-500" />,
    label: "ゼロから作成",
    prompt:
      "履歴書をゼロから作成したいです。私の強みや経験を引き出すために、プロの視点で順に質問をしてください。",
    description: "対話形式で作成",
  },
  {
    icon: <BookOpen className="w-4 h-4 text-teal-500" />,
    label: "志望動機案",
    prompt:
      "志望動機がうまく書けません。私の「強み」と「志望企業の魅力」を伝えますので、それらを結びつけた志望動機案を作成してください。",
    description: "アイデア出し",
  },
  {
    icon: <Sparkles className="w-4 h-4 text-yellow-500" />,
    label: "自己PR作成",
    prompt:
      "エピソードはあるのですが、魅力的な自己PRになりません。私のエピソードを箇条書きにするので、履歴書用の文章にまとめてください。",
    description: "エピソード文章化",
  },
];

export const CRITIQUE_TEMPLATES = [
  {
    icon: <FileSearch className="w-4 h-4 text-red-500" />,
    label: "全体チェック",
    prompt:
      "作成した履歴書をアップロードします。誤字脱字のチェックだけでなく、採用担当者の視点で「もっとアピールできる点」や「懸念点」を指摘してください。",
    description: "ファイル診断",
  },
  {
    icon: <CheckCircle className="w-4 h-4 text-indigo-500" />,
    label: "表現改善",
    prompt:
      "この文章を、よりビジネスライクで、かつ熱意が伝わる表現に言い換えてください。\n\n【元の文章】\n",
    description: "言葉選び",
  },
  {
    icon: <Target className="w-4 h-4 text-pink-500" />,
    label: "一貫性確認",
    prompt:
      "「志望動機」と「自己PR」の内容に矛盾がないか、一貫性があるかを確認してください。",
    description: "論理チェック",
  },
];
