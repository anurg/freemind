import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { setupScheduledJobs } from '../utils/scheduledJobs';

function MyApp({ Component, pageProps }: AppProps) {
  // Set up scheduled jobs when the app starts on the client side
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      // Only set up scheduled jobs if the user is logged in
      const token = localStorage.getItem('token');
      if (token) {
        setupScheduledJobs();
      }
    }
  }, []);

  return (
    <>
      <Head>
        <title>FreeMind Task Tracker</title>
        <meta name="description" content="A comprehensive task management application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
