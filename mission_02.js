export const getFilteredFeeds = (data, filters) => {
  if (!data || !data.length) return [];

  const {
    category,
    startDate,
    endDate,
    minLikes = 0,
    minValue = 0,
    keyword = '',
  } = filters;
  const searchKeyword = keyword.trim().toLowerCase();

  return data.filter((item) => {
    // 카테고리 (단일 선택: 필터가 없거나, 일치하거나)
    if (category && item.category !== category) return false;

    // 좋아요 수 (조건 값 이상인지 확인)
    if (minLikes > 0 && (item.likes ?? 0) < minLikes) return false;

    // 최솟값 (조건 값 이상인지 확인)
    const val = item.value ?? 0;
    if (minValue > 0 && (item.value ?? 0) < minValue) return false;

    // 날짜 범위 검사
    if (startDate && item.date < startDate) return false;
    if (endDate && item.date > endDate) return false;

    // 검색어
    if (searchKeyword) {
      const title = item.title?.toLowerCase() || '';
      const content = item.content?.toLowerCase() || '';
      if (!title.includes(searchKeyword) && !content.includes(searchKeyword)) {
        return false;
      }
    }

    return true;
  });
};
