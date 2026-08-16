"use client";

import { useSession } from "../(utils)/auth";
import { Loader } from "./Loader";

const DashBoard = () => {
  const {
    data: session,
    isPending,
    error
  } = useSession();

  if (isPending) {
    return <Loader />
  }

  if (error) {
    return <div>Failed to load session</div>;
  }

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      <h1>Welcome to Dashboard</h1>

      <p>Name: {session.user.name}</p>
      <p>Email: {session.user.email}</p>
      <p>User ID: {session.user.id}</p>
    </div>
  );
};

export {DashBoard}