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

/** 会期で絞り込むセレクトの選択肢に必要な最小限の会期情報 */
export type DietSessionFilterSource = Pick<
  DietSession,
  "id" | "name" | "is_active"
>;

export type CreateDietSessionInput = {
  name: string;
  slug: string | null;
  shugiin_url: string | null;
  start_date: string;
  end_date: string;
};

export type UpdateDietSessionInput = {
  id: string;
  name: string;
  slug: string | null;
  shugiin_url: string | null;
  start_date: string;
  end_date: string;
};

export type DeleteDietSessionInput = {
  id: string;
};
