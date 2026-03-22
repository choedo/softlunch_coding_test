const PostListPage = ({ userId, categoryId, onPostClick }) => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // SECTION - 원인1 (API 호출 구조)
  useEffect(() => {
    setLoading(true);

    Promise.all([fetchPosts(userId, categoryId), fetchUser(userId)]).then(
      ([postsData, userData]) => {
        setPosts(postsData);
        setUser(userData);
        setLoading(false);
      },
    );
  }, [userId, categoryId]);
  // !SECTION - 원인1

  // SECTION - 원인2 (정렬로직)
  const sortedPosts = useMemo(() => {
    return [...posts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [posts]);
  // !SECTION - 원인2

  // SECTION - 원인3 (함수 재생성)
  const handleClick = useCallback(
    (postId) => {
      onPostClick(postId);
    },
    [onPostClick],
  );

  const handleCategoryChange = useCallback((id) => {
    console.log(id);
  }, []);
  // !SECTION - 원인3

  return (
    <div>
      {' '}
      <UserProfile user={user} />{' '}
      <CategoryFilter selectedId={categoryId} onChange={handleCategoryChange} />{' '}
      {sortedPosts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          handleClick={handleClick}
          user={user}
          userId={userId}
          categoryId={categoryId}
        />
      ))}{' '}
    </div>
  );
};
