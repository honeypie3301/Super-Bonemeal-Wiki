export interface ManifestItem {
  slug: string;
  filename: string;
  title: string;
  category: string;
  order: number;
}

export type WikiArticle = ManifestItem;

export interface Article extends ManifestItem {
  content: string;
}
