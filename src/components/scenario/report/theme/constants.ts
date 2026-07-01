import type { ThemeTrlDef } from "@/types/theme-report"

// EU Horizon 2020 TRL definitions. Identical across every theme report;
// hardcoded so the model never regenerates them.
export const THEME_TRL_DEFS: readonly ThemeTrlDef[] = [
	{
		level: 1,
		title: "基本原理の観察",
		desc: "科学研究が応用研究へと移行し始める段階。基本的な物理・化学的原理が観察・報告される。",
	},
	{
		level: 2,
		title: "技術コンセプトの形成",
		desc: "基本原理から技術応用のコンセプトや用途が定式化される。実証はまだ行われない。",
	},
	{
		level: 3,
		title: "概念実証",
		desc: "個別要素について解析的・実験的な概念実証(Proof of Concept)が行われる。",
	},
	{
		level: 4,
		title: "研究室環境での技術検証",
		desc: "構成要素を統合し、研究室レベルで機能することを検証する。低忠実度のプロトタイプ。",
	},
	{
		level: 5,
		title: "関連環境での技術検証",
		desc: "研究室を超えた関連環境(模擬環境)で技術要素を統合・検証する。中忠実度のプロトタイプ。",
	},
	{
		level: 6,
		title: "関連環境での技術実証",
		desc: "関連環境で代表的なモデル/プロトタイプによる実証を行う。要素技術が一体として動作することを示す。",
	},
	{
		level: 7,
		title: "実運用環境でのプロトタイプ実証",
		desc: "実運用に近い環境でシステムプロトタイプを実証する。スケール・形状とも最終仕様に近い。",
	},
	{
		level: 8,
		title: "システム完成・適格性確認",
		desc: "実システムが完成し、試験・実証を通じて意図した条件で動作することが確認される。",
	},
	{
		level: 9,
		title: "実運用環境での実システム実証",
		desc: "実運用環境において実システムが運用され、商用化・実装フェーズに到達する。",
	},
] as const
