import { NextPageContext } from 'next';

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '50px', background: '#09090b', color: '#f4f4f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        {statusCode ? `An error ${statusCode} occurred on server` : 'An error occurred on client'}
      </h2>
      <a href="/" style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: '#fff', borderRadius: '0.5rem', textDecoration: 'none' }}>
        Return Home
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
