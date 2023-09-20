const UserPage = ({ params }: { params: { username: string } }) => {
  return <div>User Page {params.username}</div>;
};

export default UserPage;
