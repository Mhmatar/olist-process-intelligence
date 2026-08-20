/** @type {import('next').NextConfig} */
const nextConfig = {
  // The /api/cases route reads data/olist_cases_clean.csv (16 MB) at request
  // time. On a serverless host (Netlify/Vercel) only traced files ship with a
  // function, and a readFileSync path isn't traced — so force the data dir into
  // that function's bundle, or the deployed case-table 500s on a missing file.
  outputFileTracingIncludes: {
    '/api/cases': ['./data/**'],
  },
}

export default nextConfig
