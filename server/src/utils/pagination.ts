export function pageParams(page: number, limit: number) {
  return { page, limit, offset: (page - 1) * limit };
}
