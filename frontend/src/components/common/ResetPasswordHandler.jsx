import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPasswordHandler({ onOpenReset }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      onOpenReset(token);
      navigate('/', { replace: true });
    }
  }, [token, onOpenReset, navigate]);

  return null;
}
