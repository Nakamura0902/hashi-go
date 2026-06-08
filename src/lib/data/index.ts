"use client";

// データ層の入口。Supabaseが設定されていれば実DB、無ければモック(localStorage)。
import { hasSupabase } from "../config";
import { mockApi } from "./mock";
import { supabaseApi } from "./supabase";

// 両実装が同じ形であることを型で保証する
export type DataApi = typeof mockApi;
const _check: DataApi = supabaseApi; // 形が一致しなければコンパイルエラー
void _check;

export const dataApi: DataApi = hasSupabase ? supabaseApi : mockApi;
