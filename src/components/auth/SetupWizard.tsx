import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { useToast } from '../../hooks/useToast';

export const SetupWizard = ({ onSetupComplete }) => {
    const [step, setStep] = useState(1); // 1: Firebase, 2: Admin, 3: Security, 4: Done
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [config, setConfig] = useState('');
    const [admin, setAdmin] = useState({ name: '', email: '', password: '' });
    const addToast = useToast();

    const securityRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Apenas usuários autenticados podem ler/escrever nos seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Apenas usuários autenticados podem ler/escrever em outras coleções
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

    const testFirebaseConnection = async (firebaseConfig) => {
        setIsLoading(true);
        setError('');
        try {
            // Use a unique name for the temporary app to avoid conflicts
            const tempAppName = `test-app-${Date.now()}`;
            const tempApp = initializeApp(firebaseConfig, tempAppName);
            const tempDb = getFirestore(tempApp);
            // This is a lightweight check for connectivity and config validity.
            await getDocs(collection(tempDb, `__test_connection__`));
            setIsLoading(false);
            return true;
        } catch (e) {
            console.error("Firebase connection test failed:", e);
            if (e.code === 'permission-denied') {
              setError("Conexão bem-sucedida, mas as regras de segurança do Firestore estão bloqueando o acesso. Para a instalação, use o 'modo de teste'.");
            } else if (e.code === 'auth/invalid-api-key') {
              setError("Erro: A 'apiKey' na configuração parece ser inválida.");
            } else {
              setError(`Erro de conexão: ${e.message}. Verifique o objeto de configuração.`);
            }
            setIsLoading(false);
            return false;
        }
    };

    const handleFirebaseSubmit = async (e) => {
        e.preventDefault();
        try {
            const parsedConfig = JSON.parse(config);
            if (await testFirebaseConnection(parsedConfig)) {
                localStorage.setItem('firebaseConfig', config);
                addToast('Conexão com o Firebase bem-sucedida!', 'success');
                setStep(2);
            }
        } catch (err) {
            setError('O texto inserido não é um objeto JSON de configuração do Firebase válido.');
        }
    };

    const handleAdminSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const configString = localStorage.getItem('firebaseConfig');
            const firebaseConfig = JSON.parse(configString);
            const app = initializeApp(firebaseConfig, 'setup-app');
            const db = getFirestore(app);
            const auth = getAuth(app);

            const userCredential = await createUserWithEmailAndPassword(auth, admin.email, admin.password);
            const user = userCredential.user;

            const batch = writeBatch(db);
            // Seed data...
            const collections = {
                assets: [{ name: 'Servidor Web', type: 'Servidor', owner: 'TI', criticality: 'High' }],
                threats: [{ name: 'Ataque de Ransomware', description: '...', type: 'Malicious' }],
                controls: [{ name: 'Backup e Recuperação', description: '...', family: 'Recuperação', framework: 'NIST CSF' }]
            };
            Object.entries(collections).forEach(([name, data]) => {
                data.forEach(item => batch.set(doc(collection(db, name)), item));
            });

            // Create user profile
            const userRef = doc(collection(db, 'users'), user.uid); // Use UID as doc ID
            batch.set(userRef, { uid: user.uid, name: admin.name, email: admin.email, role: 'Admin' });

            await batch.commit();

            addToast('Administrador criado com sucesso!', 'success');
            setStep(3);
        } catch (err) {
            console.error(err);
            setError(`Erro ao criar administrador: ${err.message}. O email já pode estar em uso.`);
        }
        setIsLoading(false);
    };

    const handleSecuritySubmit = () => {
        localStorage.setItem('isSetupComplete', 'true');
        addToast('Instalação finalizada!', 'success');
        setStep(4);
    }

    const Stepper = () => {
        const steps = ['Firebase', 'Administrador', 'Segurança', 'Concluído'];
        return (
            <div className="flex items-center justify-center mb-8">
                {steps.map((name, index) => (
                    <React.Fragment key={name}>
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step > index ? 'bg-primary text-white' : 'bg-gray-600 text-gray-400'}`}>
                                {step > index + 1 ? '✓' : index + 1}
                            </div>
                            <span className={`ml-2 ${step > index ? 'text-primary' : 'text-text-secondary'}`}>{name}</span>
                        </div>
                        {index < steps.length - 1 && <div className={`h-0.5 w-8 mx-2 ${step > index + 1 ? 'bg-primary' : 'bg-gray-600'}`}></div>}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-2xl p-8 space-y-6 bg-surface rounded-lg shadow-lg border border-border-color">
                <h1 className="text-3xl font-bold text-center text-primary">Instalação - EXA GRC</h1>
                <Stepper />
                {step === 1 && (
                    <form onSubmit={handleFirebaseSubmit}>
                        <h2 className="text-xl font-semibold text-center text-text-primary mb-2">1. Conectar ao Firebase</h2>
                        <p className="text-center text-text-secondary mb-6">Cole o objeto de configuração do seu projeto Firebase. Assegure-se que o Firestore está no "modo de teste" para esta etapa.</p>
                        <textarea value={config} onChange={e => setConfig(e.target.value)} rows="8" placeholder='{ apiKey: "...", authDomain: "...", ... }' className="w-full p-2 text-gray-300 bg-background border border-border-color rounded-md font-mono text-sm"></textarea>
                        {error && <p className="text-sm text-center text-danger mt-4">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full mt-6 py-2 px-4 bg-primary text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex justify-center">
                            {isLoading ? <Spinner/> : 'Conectar e Continuar'}
                        </button>
                    </form>
                )}
                 {step === 2 && (
                    <form onSubmit={handleAdminSubmit}>
                        <h2 className="text-xl font-semibold text-center text-text-primary mb-4">2. Criar Conta de Administrador</h2>
                        <p className="text-center text-text-secondary mb-6">Crie o primeiro usuário, que terá permissões de administrador.</p>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome Completo" value={admin.name} onChange={e => setAdmin({...admin, name: e.target.value})} required className="w-full p-2 bg-background border border-border-color rounded-md" />
                            <input type="email" placeholder="Email" value={admin.email} onChange={e => setAdmin({...admin, email: e.target.value})} required className="w-full p-2 bg-background border border-border-color rounded-md" />
                            <input type="password" placeholder="Senha (mínimo 6 caracteres)" value={admin.password} onChange={e => setAdmin({...admin, password: e.target.value})} required className="w-full p-2 bg-background border border-border-color rounded-md" />
                        </div>
                         {error && <p className="text-sm text-center text-danger mt-4">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full mt-6 py-2 px-4 bg-primary text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex justify-center">
                           {isLoading ? <Spinner /> : 'Criar Administrador'}
                        </button>
                    </form>
                )}
                {step === 3 && (
                    <div>
                        <h2 className="text-xl font-semibold text-center text-text-primary mb-2">3. Proteger seu Banco de Dados</h2>
                        <p className="text-text-secondary mb-4 text-center">
                            Esta é a etapa mais importante. Para proteger seus dados, você <span className="font-bold text-danger">PRECISA</span> atualizar as regras de segurança do Firestore.
                        </p>
                        <div className="bg-background p-4 rounded-md border border-border-color mb-4">
                           <p className="text-sm text-text-secondary mb-2">1. Acesse o <a href={`https://console.firebase.google.com/project/${JSON.parse(config)?.projectId}/firestore/rules`} target="_blank" rel="noopener noreferrer" className="text-primary underline">Console do Firebase</a>.</p>
                           <p className="text-sm text-text-secondary mb-2">2. Vá para a seção <strong>Firestore Database &gt; Regras</strong>.</p>
                           <p className="text-sm text-text-secondary">3. Substitua as regras existentes pelo código abaixo e clique em <strong>Publicar</strong>.</p>
                        </div>
                        <div className="relative bg-background p-4 rounded-md font-mono text-sm border border-border-color">
                            <button onClick={() => { navigator.clipboard.writeText(securityRules); addToast('Regras copiadas!', 'success'); }} className="absolute top-2 right-2 p-1 text-text-secondary hover:text-primary">
                                <Icon name="Copy" size={18}/>
                            </button>
                            <pre><code>{securityRules}</code></pre>
                        </div>
                        <button onClick={handleSecuritySubmit} className="w-full mt-6 py-2 px-4 bg-secondary text-white rounded-md hover:bg-green-700">
                            Já atualizei as regras, finalizar instalação
                        </button>
                    </div>
                )}
                {step === 4 && (
                    <div className="text-center">
                        <CheckCircle className="mx-auto h-16 w-16 text-secondary mb-4" />
                        <h2 className="text-2xl font-bold text-text-primary mb-2">Instalação Concluída!</h2>
                        <p className="text-text-secondary mb-6">A plataforma EXA GRC foi configurada com sucesso e suas regras de segurança foram atualizadas.</p>
                        <button onClick={onSetupComplete} className="py-2 px-8 bg-primary text-white rounded-md hover:bg-blue-700">
                            Ir para o Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
