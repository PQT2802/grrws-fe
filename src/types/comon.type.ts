export interface SUGGEST_OBJECT_RESPONSE {
  id: string;
  name: string;
}
export interface SUGGEST_OBJECT_REQUEST {
  query: string;
  maxResults?: number;
}
