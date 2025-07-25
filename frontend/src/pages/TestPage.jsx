import { useEffect, useState } from 'react';

const TestPage = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/testpage')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Test Page</h1>
      <p>{message}</p>
    </div>
  );
};

export default TestPage;
