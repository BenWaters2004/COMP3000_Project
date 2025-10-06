import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [ping, setPing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/ping')
      .then(r => {
        setPing(r.data);
      })
      .catch(e => {
        setPing({ error: e.message });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading…</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Backend ping</h1>
      <pre>{JSON.stringify(ping, null, 2)}</pre>
      <p>Frontend running on Vite. Backend: Laravel.</p>
    </div>
  );
}

export default App;