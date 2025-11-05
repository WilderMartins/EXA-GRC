import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Spinner } from '../ui/Spinner';
import { useDb } from '../../hooks/useDb';

export const Login = () => {
    const { auth, isDbReady } = useDb();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!isDbReady) {
          setError("A conexão com o banco de dados ainda não está pronta.");
          return;
        }
        setIsLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Email ou senha inválidos.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-lg shadow-lg border border-border-color">
                <h1 className="text-3xl font-bold text-center text-primary">EXA GRC</h1>
                <h2 className="text-xl font-semibold text-center text-text-primary">Login</h2>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="text-sm font-bold text-gray-400 block">Email</label>
                        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 mt-1 text-gray-300 bg-background border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-bold text-gray-400 block">Senha</label>
                        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 mt-1 text-gray-300 bg-background border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    {error && <p className="text-sm text-center text-danger">{error}</p>}
                    <button type="submit" disabled={isLoading || !isDbReady} className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 flex justify-center">
                        {isLoading ? <Spinner /> : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};
