// はしGO 型定義（アプリ内はcamelCase、DBはsnake_case）

// 空席ステータス（店舗が手動更新する5状態）
export type SeatAvailability = "open" | "few" | "soon" | "full" | "closed";

// 雰囲気・目的・特徴タグ
export type Mood = "にぎやか" | "落ち着いた" | "おしゃれ" | "大衆酒場" | "和モダン";
export type Purpose =
  | "まだ飲みたい"
  | "安く飲み直したい"
  | "しっぽり話したい"
  | "終電まで軽く"
  | "深夜まで"
  | "締めごはん";

// 店舗
export type Store = {
  id: string;
  ownerUserId: string | null;
  name: string;
  description: string;
  address: string;
  nearestStation: string;
  lat: number;
  lng: number;
  phone: string;
  averageBudget: number; // 客単価目安（円/人）
  openTime: string; // "17:00"
  closeTime: string; // "26:00"（翌2時を26:00表記）
  isActive: boolean; // 掲載ON/OFF（管理者審査）
  isLateNight: boolean; // 深夜営業
  images: string[];
  moods: Mood[];
  purposes: Purpose[];
  features: string[]; // 例: "個室あり" "飲み放題"
  createdAt: string;
};

// 空席状況（店舗が手動更新）
export type SeatStatus = {
  storeId: string;
  availability: SeatAvailability;
  table2: { free: number; total: number }; // 2名席
  table4: { free: number; total: number }; // 4名席
  counter: { free: number; total: number }; // カウンター
  totalGroupCapacity: number; // 同時に受け入れ可能な最大人数
  updatedAt: string;
};

// 特典
export type Offer = {
  id: string;
  storeId: string;
  title: string; // 例: "1杯目無料"
  description: string;
  isActive: boolean;
};

// 来店ステータス
export type VisitStatus = "planned" | "checked_in" | "cancelled";

export type Visit = {
  id: string;
  userId: string;
  storeId: string;
  storeName: string;
  status: VisitStatus;
  plannedAt: string;
  checkedInAt: string | null;
  scoreAtSelection: number;
  qrToken: string;
  etaMin: number; // 選択時の徒歩予測（到着予測・遅延判定に使用）
};

// お気に入り
export type Favorite = {
  userId: string;
  storeId: string;
  createdAt: string;
};

// 検索条件
export type SearchParams = {
  lat: number;
  lng: number;
  peopleCount: number;
  budget: number; // 1人あたり上限（0=制限なし）
  moods: Mood[];
  purpose: Purpose | null;
};

// 並び替え
export type SortKey = "score" | "distance" | "budget" | "seats";

// スコア付きの検索結果（一覧・地図で共用）
export type ScoredStore = {
  store: Store;
  seat: SeatStatus;
  offers: Offer[];
  distanceM: number;
  walkMin: number;
  score: number;
  reasons: string[]; // スコア根拠タグ
};

// 店舗ダッシュボード集計
export type MerchantDashboard = {
  store: Store;
  seat: SeatStatus;
  todayVisits: number;
  plannedVisits: number;
  recentVisits: Visit[];
};

// 管理者: 分析集計
export type AdminAnalytics = {
  totalStores: number;
  activeStores: number;
  totalVisits: number;
  checkedInVisits: number;
  conversionRate: number; // 来店確定 / 来店予定
  byArea: { area: string; visits: number }[];
  byHour: { hour: number; visits: number }[];
  popularBudgets: { label: string; count: number }[];
  popularMoods: { mood: string; count: number }[];
  // エリア×時間帯ヒートマップ（hoursは長さ24の来店数配列）
  heatmap: { area: string; hours: number[] }[];
  // 店舗別送客ランキング
  byStore: { storeId: string; name: string; visits: number; checkedIn: number }[];
};

// ── グループ（合流・候補・投票・割り勘） ──
export type Group = {
  id: string; // 共有コード（短い英数字）
  name: string;
  createdAt: string;
};

export type GroupCandidate = {
  id: string;
  groupId: string;
  storeId: string;
  storeName: string;
  addedBy: string;
  votes: number; // 集計済みの票数
};

export type GroupVote = {
  groupId: string;
  storeId: string;
  userId: string;
};

// ── はしごバッジ／実績 ──
export type Badge = {
  key: string;
  emoji: string;
  title: string;
  description: string;
  achieved: boolean;
  progress?: string; // 例: "3 / 5軒"
};

export type UserStats = {
  totalVisits: number; // チェックイン済み来店数
  uniqueStores: number;
  areasVisited: number;
  badges: Badge[];
};

// ── レビュー＆評価 ──
export type Review = {
  id: string;
  storeId: string;
  userId: string;
  rating: number; // 1〜5
  comment: string;
  createdAt: string;
};

export type ReviewSummary = {
  avg: number; // 平均★（0=レビューなし）
  count: number;
  items: Review[];
};

// ── 店主のライブひとこと ──
export type StoreMessage = {
  storeId: string;
  message: string;
  updatedAt: string;
};
