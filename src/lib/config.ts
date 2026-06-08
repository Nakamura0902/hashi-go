// 環境変数の有無で「実接続」か「モック」かを切り替える（go-snow踏襲）

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// 地図トークンがあれば本物のMapbox、無ければモック地図
export const hasMapbox = MAPBOX_TOKEN.length > 0;

// Supabaseの設定があれば実DB、無ければlocalStorageのモックデータ
export const hasSupabase =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

// 初期表示の中心（千歳駅周辺＝利用者の現在地エリア）。[lng, lat]
export const DEFAULT_CENTER: [number, number] = [141.6527, 42.8206];
export const DEFAULT_ZOOM = 15;

// MVPの簡易ログイン用の固定ユーザーID（Supabaseのuuid型カラムと整合するUUID）
export const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";
