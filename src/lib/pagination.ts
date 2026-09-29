export type PagedResult<T> = {
  rows: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export function paginate<T>(
  all: T[],
  page: number,
  pageSize: number,
): PagedResult<T> {
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    rows: all.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
  };
}
