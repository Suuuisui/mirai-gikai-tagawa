export type DietSession = {
  id: string;
  name: string;
  slug: string | null;
  shugiin_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * 会期一覧の前後ナビゲーション用の軽量な型。
 * 全会期を一括取得する際、不要なカラムまで取得しないために使用する。
 */
export type DietSessionNavItem = Pick<
  DietSession,
  "id" | "name" | "start_date"
>;
