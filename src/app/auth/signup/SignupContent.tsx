'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    setIsVerifying(false);
  }, []);

  if (isVerifying) {
    return <div>Verifying subscription...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('Please subscribe before creating an account');
      router.push('/');
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          stripe_session_id: sessionId
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
      </div>
      {error && <div className="text-red-500">{error}</div>}
      <button type="submit">Sign Up</button>
    </form>
  );
} 