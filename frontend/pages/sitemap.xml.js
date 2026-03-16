import React from 'react';
import data from '@/utils/data'
const Sitemap = () => {
    return null;
};

export const getServerSideProps = async ({ res }) => {
    // const BASE_URL = process.env.NODE_ENV==="production"?"https://seniorcentral.in":"http://localhost:3000";

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
                <loc>https://seniorcentral.in/</loc>
                <lastmod>2022-07-14T10:18:50+01:00</lastmod>
                    <priority>1.0</priority>
        </url>
        <url>
        <loc>${data.url}/session</loc>
        <lastmod>2022-07-14T10:18:50+01:00</lastmod>
        <priority>0.2</priority>x
        </url>

        <url>
        <loc>${data.url}/community</loc>
        <lastmod>2022-07-14T10:18:50+01:00</lastmod>
        <priority>0.2</priority>
        </url>

        <url>
        <loc>${data.url}/pricing</loc>
        <lastmod>2022-07-14T10:18:50+01:00</lastmod>
        <priority>0.2</priority>
        </url>

        <url>
        <loc>${data.url}/about</loc>
        <lastmod>2022-07-14T10:18:50+01:00</lastmod>
        <priority>0.2</priority>
        </url>

        <url>
        <loc>${data.url}/home</loc>
        <lastmod>2022-07-14T10:18:50+01:00</lastmod>
        <priority>0.2</priority>
        </url>
    
    </urlset>
  `;

    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();

    return {
        props: {},
    };
};

export default Sitemap;