"use client";

import { useEffect, useState } from "react";
import { Loader } from "./(components)/Loader";

export default function Home() {
  const [fetchedData, setFetchedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function getData() {
    try {
      const req = await fetch(`${process.env.BACKEND_BASE_URL}/api/v1/hello`);

      if (!req.ok) {
        throw new Error(`HTTP ${req.status}`);
      }

      const data = await req.json();

      setFetchedData(data.message);
    } catch (error) {
      const msg = "Failed to fetch data at /api/v1/hello";
      console.error(error);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  return (
    <div>
      {error ? (
        <div>Error occurred: {error}</div>
      ) : (
        loading ? (<Loader />) : (<div>Data fetched: {fetchedData}</div>)
      )}
    </div>
  );
}