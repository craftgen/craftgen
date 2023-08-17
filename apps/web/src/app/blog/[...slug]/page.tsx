const BlogPage = ({ params }: { params: { slug: string[] } }) => {
  return (
    <div>
      <h1>Blog Page</h1>
      {JSON.stringify(params)}
    </div>
  );
};

export default BlogPage;
