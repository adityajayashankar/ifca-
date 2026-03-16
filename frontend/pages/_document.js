import { Html, Head, Main, NextScript } from 'next/document'
import React from 'react'
import data from "@/utils/data";

class MyDocument extends React.Component {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Maven+Pro:wght@400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />
          <meta
            name="description"
            content={`${data.companyName} | ${data.description}`}
          />
          <meta
            property="og:title"
            content={`${data.companyName} | ${data.title}`}
          />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="/Kumbh_logoifca.png" />
          <meta property="og:locale" content="en_US" />
          <meta property="og:site_name" content="IFCA" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            property="og:description"
            content={`${data.companyName} | ${data.description}`}
          />
          <meta property="og:url" content={data.url} />
          <link rel="icon" href="/favicon.ico" />
          <meta property="og:type" content="website" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/icon?family=Material+Icons"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
