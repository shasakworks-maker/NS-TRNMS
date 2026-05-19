import { useState, useEffect } from 'react';

export function useFirebaseData() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setVersion(v => v + 1);
    };

    window.addEventListener('ns-data-updated', handleUpdate);
    return () => window.removeEventListener('ns-data-updated', handleUpdate);
  }, []);

  return version;
}
