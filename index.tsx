// @ts-nocheck
import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig';
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';

import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  ChevronDown, X, Sidebar as SidebarIcon, Home, Shield, Database, AlertTriangle, ChevronsUpDown, Settings, Users, LogOut, PlusCircle, Edit, Trash2, Eye, Sun, Moon, CheckCircle, AlertCircle, Info, Copy

} from 'lucide-react';

// --- TYPES AND INTERFACES ---
interface User { id: string; name: string; email: string; role: 'Admin' | 'Analyst'; }
interface Asset { id: string; name: string; type: string; owner: string; criticality: 'Low' | 'Medium' | 'High' | 'Critical'; }
interface Threat { id: string; name: string; description: string; type: 'Malicious' | 'Accidental' | 'Environmental'; }
interface Control { id: string; name: string; description: string; family: string; framework: 'NIST CSF' | 'CIS Controls'; }
interface Risk {
  id: string;
  title: string;
  assetId: string;
  threatId: string;
  controlId: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'Accepted';
  likelihood: number; // 1-5
  impact: number;     // 1-5
  owner: string;
  createdAt: string;
}
interface FirebaseConfig { apiKey: string; authDomain: string; projectId: string; storageBucket: string; messagingSenderId: string; appId: string; }

// --- ICONS WRAPPER ---
const Icon = ({ name, ...props }) => {
  const LucideIcon = {
    ChevronDown, X, SidebarIcon, Home, Shield, Database, AlertTriangle, ChevronsUpDown, Settings, Users, LogOut, PlusCircle, Edit, Trash2, Eye, Sun, Moon, CheckCircle, AlertCircle, Info, Copy
  }[name];
  return LucideIcon ? <LucideIcon {...props} /> : null;
};

// --- DATABASE API CLIENT (FIREBASE) ---
const firebaseApiClient = (db) => ({
  getAll: (collectionName, callback) => {
    const q = query(collection(db, collectionName));
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    }, (error) => {
      console.error(`Error fetching ${collectionName}: `, error);
      callback([]);
    });
  },
  create: async (collectionName, data) => {
    const docRef = await addDoc(collection(db, collectionName), data);
    return { id: docRef.id, ...data };
  },
  update: async (collectionName, id, data) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
    return { id, ...data };
  },
  remove: async (collectionName, id) => {
    await deleteDoc(doc(db, collectionName, id));
  },
  getUserProfile: async (userId) => {
    const q = query(collection(db, 'users'), where('uid', '==', userId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  }
});

// --- CONTEXTS ---
const AuthContext = createContext(null);
const DbContext = createContext(null);
const ToastContext = createContext(null);
const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

// --- HOOKS ---
const useAuth = () => useContext(AuthContext);
const useDb = () => useContext(DbContext);
const useToast = () => useContext(ToastContext);
const useTheme = () => useContext(ThemeContext);

// --- UI COMPONENTS (UNCHANGED) ---
const Tooltip = ({ children, text }) => (
  <div className="relative group flex items-center">
    {children}
    <div className="absolute left-full ml-4 w-auto p-2 min-w-max rounded-md shadow-md text-white bg-gray-800 border border-gray-700 text-xs font-bold transition-all duration-100 scale-0 group-hover:scale-100 origin-left">
      {text}
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg p-6 border border-border-color" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <Icon name="X" size={24} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <p className="text-text-secondary mb-6">{message}</p>
    <div className="flex justify-end gap-4">
      <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-colors">Cancelar</button>
      <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-danger hover:bg-red-700 text-white transition-colors">Confirmar</button>
    </div>
  </Modal>
);

const Toast = ({ message, type, onDismiss }) => {
  const icons = { success: 'CheckCircle', error: 'AlertCircle', info: 'Info' };
  const colors = { success: 'bg-secondary', error: 'bg-danger', info: 'bg-primary' };
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  const handleDismiss = () => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
  }

  return (
    <div className={`fixed bottom-5 right-5 flex items-center gap-4 p-4 rounded-lg shadow-lg text-white ${colors[type]} ${isExiting ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
      <Icon name={icons[type]} size={24} />
      <span>{message}</span>
      <button onClick={handleDismiss} className="ml-4">
        <Icon name="X" size={20} />
      </button>
    </div>
  );
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = id => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const Spinner = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
);

const EmptyState = ({ title, message, action }) => (
  <div className="text-center py-16 px-6 bg-surface rounded-lg border border-dashed border-border-color">
    <AlertTriangle className="mx-auto h-12 w-12 text-text-secondary" />
    <h3 className="mt-2 text-lg font-semibold text-text-primary">{title}</h3>
    <p className="mt-1 text-sm text-text-secondary">{message}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);


// --- PROVIDERS (REFACTORED) ---
const AuthProvider = ({ children }) => {
  const { auth, api } = useDb();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth || !api) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await api.getUserProfile(firebaseUser.uid);
        setUser({ ...firebaseUser, ...userProfile });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, api]);

  const logout = () => signOut(auth);

  const value = { user, logout, isAuthenticated: !!user, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const DbProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [functions, setFunctions] = useState(null);
  const [api, setApi] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let config;
    const configString = localStorage.getItem('firebaseConfig');
    if (configString) {
      try {
        config = JSON.parse(configString);
      } catch (error) {
        console.error("Failed to parse firebaseConfig from localStorage:", error);
        localStorage.clear();
      }
    } else {
      config = firebaseConfig;
    }

    if (config) {
      try {
        const app = initializeApp(config);
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);
        const firebaseFunctions = getFunctions(app);
        setDb(firestore);
        setAuth(firebaseAuth);
        setFunctions(firebaseFunctions);
        setApi(firebaseApiClient(firestore));
      } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        localStorage.clear(); // Clear corrupted config
      }
    }
    setIsReady(true);
  }, []);

  return <DbContext.Provider value={{ db, auth, functions, api, isDbReady: isReady }}>{children}</DbContext.Provider>;
};

const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

// --- LAYOUT COMPONENTS (UNCHANGED) ---
const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
  const navItems = [
    { name: 'Dashboard', icon: 'Home', path: '#/' },
    { name: 'Riscos', icon: 'Shield', path: '#/risks' },
    { name: 'Ativos', icon: 'Database', path: '#/assets' },
    { name: 'Ameaças', icon: 'AlertTriangle', path: '#/threats' },
    { name: 'Controles', icon: 'ChevronsUpDown', path: '#/controls' },
    { name: 'Usuários', icon: 'Users', path: '#/users' },
    { name: 'Configurações', icon: 'Settings', path: '#/settings' },
  ];

  return (
    <aside className={`bg-surface border-r border-border-color flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className={`flex items-center border-b border-border-color p-4 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
        {isSidebarOpen && <h1 className="text-xl font-bold text-primary">EXA GRC</h1>}
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-700">
          <Icon name="SidebarIcon" size={24} />
        </button>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map(item => (
          <a key={item.name} href={item.path}>
             <Tooltip text={item.name}>
              <div className={`flex items-center p-3 rounded-md text-text-secondary hover:bg-primary hover:text-white ${isSidebarOpen ? '' : 'justify-center'}`}>
                <Icon name={item.icon} size={24} />
                {isSidebarOpen && <span className="ml-4 font-medium">{item.name}</span>}
              </div>
            </Tooltip>
          </a>
        ))}
      </nav>
    </aside>
  );
};

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-surface border-b border-border-color h-16 flex items-center justify-between px-6">
      <div>{/* Can add breadcrumbs or page title here */}</div>
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-700">
          <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={20} />
        </button>
        <div className="text-right">
          <div className="font-semibold text-text-primary">{user?.name}</div>
          <div className="text-sm text-text-secondary">{user?.role}</div>
        </div>
        <button onClick={logout} className="p-2 rounded-full text-text-secondary hover:text-danger hover:bg-gray-700">
          <Tooltip text="Sair">
             <Icon name="LogOut" size={20} />
          </Tooltip>
        </button>
      </div>
    </header>
  );
};

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="flex h-screen bg-background">
      <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// --- PAGES (UNCHANGED) ---
const Dashboard = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-primary mb-6">Dashboard de Gestão de Riscos</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-surface p-6 rounded-lg border border-border-color">
        <h2 className="text-lg font-semibold text-text-secondary">Riscos Abertos</h2>
        <p className="text-4xl font-bold text-primary mt-2">12</p>
      </div>
      <div className="bg-surface p-6 rounded-lg border border-border-color">
        <h2 className="text-lg font-semibold text-text-secondary">Risco Residual Médio</h2>
        <p className="text-4xl font-bold text-risk-high mt-2">15.8</p>
      </div>
       <div className="bg-surface p-6 rounded-lg border border-border-color">
        <h2 className="text-lg font-semibold text-text-secondary">Controles Efetivos</h2>
        <p className="text-4xl font-bold text-secondary mt-2">85%</p>
      </div>
       <div className="bg-surface p-6 rounded-lg border border-border-color">
        <h2 className="text-lg font-semibold text-text-secondary">Ameaças Ativas</h2>
        <p className="text-4xl font-bold text-risk-medium mt-2">4</p>
      </div>
    </div>
  </div>
);

const RisksPage = () => {
    const { api } = useDb();
    const addToast = useToast();
    const [risks, setRisks] = useState([]);
    const [assets, setAssets] = useState([]);
    const [threats, setThreats] = useState([]);
    const [controls, setControls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRisk, setEditingRisk] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        if (!api) return;
        const unsubRisks = api.getAll('risks', (data) => { setRisks(data); setIsLoading(false); });
        const unsubAssets = api.getAll('assets', setAssets);
        const unsubThreats = api.getAll('threats', setThreats);
        const unsubControls = api.getAll('controls', setControls);
        return () => { unsubRisks(); unsubAssets(); unsubThreats(); unsubControls(); };
    }, [api]);
    
    const getRiskScore = (likelihood, impact) => likelihood * impact;
    const getRiskLevel = (score) => {
        if (score <= 5) return { label: 'Baixo', color: 'risk-low' };
        if (score <= 12) return { label: 'Médio', color: 'risk-medium' };
        if (score <= 16) return { label: 'Alto', color: 'risk-high' };
        return { label: 'Crítico', color: 'risk-critical' };
    };

    const handleSaveRisk = async (formData) => {
        try {
            if (editingRisk) {
                await api.update('risks', editingRisk.id, formData);
                addToast('Risco atualizado com sucesso!', 'success');
            } else {
                await api.create('risks', { ...formData, createdAt: new Date().toISOString() });
                addToast('Risco criado com sucesso!', 'success');
            }
            setIsModalOpen(false);
            setEditingRisk(null);
        } catch (error) {
            console.error("Error saving risk:", error);
            addToast('Falha ao salvar o risco.', 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.remove('risks', id);
            addToast('Risco excluído com sucesso!', 'success');
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Error deleting risk:", error);
            addToast('Falha ao excluir o risco.', 'error');
        }
    };

    const RiskForm = ({ risk, onSave, onCancel }) => {
        const [formData, setFormData] = useState(risk || {
            title: '', assetId: '', threatId: '', controlId: '', status: 'Open', likelihood: 3, impact: 3, owner: ''
        });

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: name === 'likelihood' || name === 'impact' ? parseInt(value) : value }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Título do Risco" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <input type="text" name="owner" value={formData.owner} onChange={handleChange} placeholder="Responsável (ex: email@empresa.com)" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <div className="grid grid-cols-2 gap-4">
                    <select name="assetId" value={formData.assetId} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md"><option value="">Selecione o Ativo</option>{assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                    <select name="threatId" value={formData.threatId} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md"><option value="">Selecione a Ameaça</option>{threats.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                </div>
                 <select name="controlId" value={formData.controlId} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md"><option value="">Selecione o Controle</option>{controls.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                 <select name="status" value={formData.status} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md">
                    <option>Open</option><option>In Progress</option><option>Closed</option><option>Accepted</option>
                </select>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-text-secondary">Probabilidade ({formData.likelihood})</label>
                        <input type="range" name="likelihood" min="1" max="5" value={formData.likelihood} onChange={handleChange} className="w-full" />
                    </div>
                    <div>
                        <label className="text-sm text-text-secondary">Impacto ({formData.impact})</label>
                        <input type="range" name="impact" min="1" max="5" value={formData.impact} onChange={handleChange} className="w-full" />
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white">Salvar</button>
                </div>
            </form>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Gestão de Riscos</h1>
                <button onClick={() => { setEditingRisk(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                    <Icon name="PlusCircle" size={20} />
                    <span>Novo Risco</span>
                </button>
            </div>
            
            <div className="bg-surface rounded-lg border border-border-color overflow-hidden">
                {isLoading ? <div className="p-16 flex justify-center"><Spinner /></div> : 
                 risks.length === 0 ? <EmptyState title="Nenhum Risco Cadastrado" message="Comece adicionando um novo risco para monitorá-lo." action={<button onClick={() => { setEditingRisk(null); setIsModalOpen(true); }} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors"><Icon name="PlusCircle" size={20} /><span>Adicionar Risco</span></button>} /> :
                <table className="w-full text-left">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="p-4">Título</th><th>Ativo</th><th>Status</th><th>Score</th><th>Nível</th><th>Responsável</th><th className="w-28">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {risks.map(risk => {
                            const score = getRiskScore(risk.likelihood, risk.impact);
                            const level = getRiskLevel(score);
                            const asset = assets.find(a => a.id === risk.assetId);
                            return (
                                <tr key={risk.id} className="border-b border-border-color hover:bg-gray-800">
                                    <td className="p-4 font-medium">{risk.title}</td>
                                    <td>{asset?.name || 'N/A'}</td>
                                    <td><span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-700 text-gray-300">{risk.status}</span></td>
                                    <td><span className="font-bold">{score}</span></td>
                                    <td><span className={`px-2 py-1 text-xs font-bold rounded-full text-white bg-${level.color}`}>{level.label}</span></td>
                                    <td>{risk.owner}</td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => { setEditingRisk(risk); setIsModalOpen(true); }} className="p-2 text-text-secondary hover:text-primary"><Icon name="Edit" size={18} /></button>
                                        <button onClick={() => setConfirmDeleteId(risk.id)} className="p-2 text-text-secondary hover:text-danger"><Icon name="Trash2" size={18} /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRisk ? 'Editar Risco' : 'Novo Risco'}>
                <RiskForm risk={editingRisk} onSave={handleSaveRisk} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            
            <ConfirmModal 
                isOpen={!!confirmDeleteId} 
                onClose={() => setConfirmDeleteId(null)} 
                onConfirm={() => handleDelete(confirmDeleteId)} 
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir este risco? Esta ação não pode ser desfeita."
            />
        </div>
    );
};

const AssetsPage = () => {
    const { api } = useDb();
    const addToast = useToast();
    const [assets, setAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        if (!api) return;
        const unsubscribe = api.getAll('assets', (data) => {
            setAssets(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [api]);

    const handleSaveAsset = async (formData) => {
        try {
            if (editingAsset) {
                await api.update('assets', editingAsset.id, formData);
                addToast('Ativo atualizado com sucesso!', 'success');
            } else {
                await api.create('assets', formData);
                addToast('Ativo criado com sucesso!', 'success');
            }
            setIsModalOpen(false);
            setEditingAsset(null);
        } catch (error) {
            console.error("Error saving asset:", error);
            addToast('Falha ao salvar o ativo.', 'error');
        }
    };

    const handleDeleteAsset = async (id) => {
        try {
            await api.remove('assets', id);
            addToast('Ativo excluído com sucesso!', 'success');
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Error deleting asset:", error);
            addToast('Falha ao excluir o ativo.', 'error');
        }
    };

    const AssetForm = ({ asset, onSave, onCancel }) => {
        const [formData, setFormData] = useState(asset || {
            name: '', type: '', owner: '', criticality: 'Medium'
        });

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome do Ativo" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <input type="text" name="type" value={formData.type} onChange={handleChange} placeholder="Tipo (ex: Servidor, Banco de Dados)" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <input type="text" name="owner" value={formData.owner} onChange={handleChange} placeholder="Responsável (ex: TI, Negócios)" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <select name="criticality" value={formData.criticality} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md">
                    <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                </select>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white">Salvar</button>
                </div>
            </form>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Gestão de Ativos</h1>
                <button onClick={() => { setEditingAsset(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                    <Icon name="PlusCircle" size={20} />
                    <span>Novo Ativo</span>
                </button>
            </div>

            <div className="bg-surface rounded-lg border border-border-color overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex justify-center"><Spinner /></div>
                ) : assets.length === 0 ? (
                    <EmptyState
                        title="Nenhum Ativo Cadastrado"
                        message="Comece adicionando um novo ativo para poder vinculá-lo a riscos."
                        action={
                            <button onClick={() => { setEditingAsset(null); setIsModalOpen(true); }} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                                <Icon name="PlusCircle" size={20} />
                                <span>Adicionar Ativo</span>
                            </button>
                        }
                    />
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th>Tipo</th>
                                <th>Responsável</th>
                                <th>Criticidade</th>
                                <th className="w-28">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map(asset => (
                                <tr key={asset.id} className="border-b border-border-color hover:bg-gray-800">
                                    <td className="p-4 font-medium">{asset.name}</td>
                                    <td>{asset.type}</td>
                                    <td>{asset.owner}</td>
                                    <td><span className={`px-2 py-1 text-xs font-bold rounded-full text-white bg-risk-${asset.criticality?.toLowerCase()}`}>{asset.criticality}</span></td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => { setEditingAsset(asset); setIsModalOpen(true); }} className="p-2 text-text-secondary hover:text-primary"><Icon name="Edit" size={18} /></button>
                                        <button onClick={() => setConfirmDeleteId(asset.id)} className="p-2 text-text-secondary hover:text-danger"><Icon name="Trash2" size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAsset ? 'Editar Ativo' : 'Novo Ativo'}>
                <AssetForm asset={editingAsset} onSave={handleSaveAsset} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => handleDeleteAsset(confirmDeleteId)}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir este ativo? Esta ação não pode ser desfeita."
            />
        </div>
    );
};


const SettingsPage = () => {
    const addToast = useToast();
    const [apiKey, setApiKey] = useState(localStorage.getItem('geminiApiKey') || '');

    const handleSave = () => {
        localStorage.setItem('geminiApiKey', apiKey);
        addToast('Chave de API salva com sucesso!', 'success');
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary mb-6">Configurações</h1>
            <div className="bg-surface rounded-lg border border-border-color p-6 max-w-2xl">
                <h2 className="text-xl font-bold mb-4">Configuração da IA (Google Gemini)</h2>
                <p className="text-text-secondary mb-4">
                    Insira sua chave de API do Google Gemini para habilitar funcionalidades de IA na plataforma.
                    Sua chave é salva localmente no seu navegador e não é enviada para nossos servidores.
                </p>
                <div className="flex flex-col gap-2">
                    <label htmlFor="apiKey" className="font-semibold">Chave de API do Google Gemini</label>
                    <input 
                        id="apiKey"
                        type="password" 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Cole sua chave de API aqui"
                        className="w-full p-2 bg-background border border-border-color rounded-md"
                    />
                </div>
                 <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                        Salvar Chave
                    </button>
                </div>
            </div>
        </div>
    );
};

const ThreatsPage = () => {
    const { api } = useDb();
    const addToast = useToast();
    const [threats, setThreats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingThreat, setEditingThreat] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        if (!api) return;
        const unsubscribe = api.getAll('threats', (data) => {
            setThreats(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [api]);

    const handleSaveThreat = async (formData) => {
        try {
            if (editingThreat) {
                await api.update('threats', editingThreat.id, formData);
                addToast('Ameaça atualizada com sucesso!', 'success');
            } else {
                await api.create('threats', formData);
                addToast('Ameaça criada com sucesso!', 'success');
            }
            setIsModalOpen(false);
            setEditingThreat(null);
        } catch (error) {
            console.error("Error saving threat:", error);
            addToast('Falha ao salvar a ameaça.', 'error');
        }
    };

    const handleDeleteThreat = async (id) => {
        try {
            await api.remove('threats', id);
            addToast('Ameaça excluída com sucesso!', 'success');
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Error deleting threat:", error);
            addToast('Falha ao excluir a ameaça.', 'error');
        }
    };

    const ThreatForm = ({ threat, onSave, onCancel }) => {
        const [formData, setFormData] = useState(threat || {
            name: '', description: '', type: 'Malicious'
        });

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome da Ameaça" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição" required rows="4" className="w-full p-2 bg-background border border-border-color rounded-md" />
                <select name="type" value={formData.type} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md">
                    <option>Malicious</option><option>Accidental</option><option>Environmental</option>
                </select>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white">Salvar</button>
                </div>
            </form>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Gestão de Ameaças</h1>
                <button onClick={() => { setEditingThreat(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                    <Icon name="PlusCircle" size={20} />
                    <span>Nova Ameaça</span>
                </button>
            </div>

            <div className="bg-surface rounded-lg border border-border-color overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex justify-center"><Spinner /></div>
                ) : threats.length === 0 ? (
                    <EmptyState
                        title="Nenhuma Ameaça Cadastrada"
                        message="Comece adicionando uma nova ameaça para poder vinculá-la a riscos."
                        action={
                            <button onClick={() => { setEditingThreat(null); setIsModalOpen(true); }} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                                <Icon name="PlusCircle" size={20} />
                                <span>Adicionar Ameaça</span>
                            </button>
                        }
                    />
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th>Descrição</th>
                                <th>Tipo</th>
                                <th className="w-28">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {threats.map(threat => (
                                <tr key={threat.id} className="border-b border-border-color hover:bg-gray-800">
                                    <td className="p-4 font-medium">{threat.name}</td>
                                    <td className="text-sm text-text-secondary max-w-md truncate">{threat.description}</td>
                                    <td><span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-700 text-gray-300">{threat.type}</span></td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => { setEditingThreat(threat); setIsModalOpen(true); }} className="p-2 text-text-secondary hover:text-primary"><Icon name="Edit" size={18} /></button>
                                        <button onClick={() => setConfirmDeleteId(threat.id)} className="p-2 text-text-secondary hover:text-danger"><Icon name="Trash2" size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingThreat ? 'Editar Ameaça' : 'Nova Ameaça'}>
                <ThreatForm threat={editingThreat} onSave={handleSaveThreat} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => handleDeleteThreat(confirmDeleteId)}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir esta ameaça? Esta ação não pode ser desfeita."
            />
        </div>
    );
};

const ControlsPage = () => {
    const { api } = useDb();
    const addToast = useToast();
    const [controls, setControls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingControl, setEditingControl] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        if (!api) return;
        const unsubscribe = api.getAll('controls', (data) => {
            setControls(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [api]);

    const handleSaveControl = async (formData) => {
        try {
            if (editingControl) {
                await api.update('controls', editingControl.id, formData);
                addToast('Controle atualizado com sucesso!', 'success');
            } else {
                await api.create('controls', formData);
                addToast('Controle criado com sucesso!', 'success');
            }
            setIsModalOpen(false);
            setEditingControl(null);
        } catch (error) {
            console.error("Error saving control:", error);
            addToast('Falha ao salvar o controle.', 'error');
        }
    };

    const handleDeleteControl = async (id) => {
        try {
            await api.remove('controls', id);
            addToast('Controle excluído com sucesso!', 'success');
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Error deleting control:", error);
            addToast('Falha ao excluir o controle.', 'error');
        }
    };

    const ControlForm = ({ control, onSave, onCancel }) => {
        const [formData, setFormData] = useState(control || {
            name: '', description: '', family: '', framework: 'NIST CSF'
        });

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome do Controle" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição" required rows="4" className="w-full p-2 bg-background border border-border-color rounded-md" />
                <input type="text" name="family" value={formData.family} onChange={handleChange} placeholder="Família (ex: Acesso, Criptografia)" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <select name="framework" value={formData.framework} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md">
                    <option>NIST CSF</option><option>CIS Controls</option>
                </select>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white">Salvar</button>
                </div>
            </form>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Gestão de Controles</h1>
                <button onClick={() => { setEditingControl(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                    <Icon name="PlusCircle" size={20} />
                    <span>Novo Controle</span>
                </button>
            </div>

            <div className="bg-surface rounded-lg border border-border-color overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex justify-center"><Spinner /></div>
                ) : controls.length === 0 ? (
                    <EmptyState
                        title="Nenhum Controle Cadastrado"
                        message="Comece adicionando um novo controle para poder vinculá-lo a riscos."
                        action={
                            <button onClick={() => { setEditingControl(null); setIsModalOpen(true); }} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                                <Icon name="PlusCircle" size={20} />
                                <span>Adicionar Controle</span>
                            </button>
                        }
                    />
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th>Framework</th>
                                <th>Família</th>
                                <th className="w-28">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {controls.map(control => (
                                <tr key={control.id} className="border-b border-border-color hover:bg-gray-800">
                                    <td className="p-4 font-medium">{control.name}</td>
                                    <td>{control.framework}</td>
                                    <td>{control.family}</td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => { setEditingControl(control); setIsModalOpen(true); }} className="p-2 text-text-secondary hover:text-primary"><Icon name="Edit" size={18} /></button>
                                        <button onClick={() => setConfirmDeleteId(control.id)} className="p-2 text-text-secondary hover:text-danger"><Icon name="Trash2" size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingControl ? 'Editar Controle' : 'Novo Controle'}>
                <ControlForm control={editingControl} onSave={handleSaveControl} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => handleDeleteControl(confirmDeleteId)}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir este controle? Esta ação não pode ser desfeita."
            />
        </div>
    );
};

const UsersPage = () => {
    const { api, functions } = useDb();
    const addToast = useToast();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        if (!api) return;
        const unsubscribe = api.getAll('users', (data) => {
            setUsers(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [api]);

    const handleSaveUser = async (formData) => {
        try {
            if (editingUser) {
                // NOTE: A edição do usuário (ex: mudança de função) exigiria outra Cloud Function.
                // Por simplicidade, isso não foi implementado.
                addToast('A edição de usuários ainda não foi implementada.', 'info');
            } else {
                const createUser = httpsCallable(functions, 'createUser');
                await createUser(formData);
                addToast('Usuário criado com sucesso!', 'success');
            }
            setIsModalOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            addToast(`Falha ao salvar usuário: ${error.message}`, 'error');
        }
    };

    const handleDeleteUser = async (id) => {
        try {
            const deleteUser = httpsCallable(functions, 'deleteUser');
            await deleteUser({ uid: id });
            addToast('Usuário excluído com sucesso!', 'success');
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            addToast(`Falha ao excluir usuário: ${error.message}`, 'error');
        }
    };

    const UserForm = ({ user, onSave, onCancel }) => {
        const [formData, setFormData] = useState(user || {
            name: '', email: '', role: 'Analyst', password: ''
        });

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome Completo" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                {!user && <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Senha" required className="w-full p-2 bg-background border border-border-color rounded-md" />}
                <select name="role" value={formData.role} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md">
                    <option>Analyst</option><option>Admin</option>
                </select>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white">Salvar</button>
                </div>
            </form>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Gestão de Usuários</h1>
                <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                    <Icon name="PlusCircle" size={20} />
                    <span>Novo Usuário</span>
                </button>
            </div>

            <div className="bg-surface rounded-lg border border-border-color overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex justify-center"><Spinner /></div>
                ) : users.length === 0 ? (
                    <EmptyState
                        title="Nenhum Usuário Encontrado"
                        message="Comece adicionando um novo usuário."
                        action={
                            <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                                <Icon name="PlusCircle" size={20} />
                                <span>Adicionar Usuário</span>
                            </button>
                        }
                    />
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th>Email</th>
                                <th>Função</th>
                                <th className="w-28">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-border-color hover:bg-gray-800">
                                    <td className="p-4 font-medium">{user.name}</td>
                                    <td>{user.email}</td>
                                    <td><span className={`px-2 py-1 text-xs font-bold rounded-full ${user.role === 'Admin' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}>{user.role}</span></td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="p-2 text-text-secondary hover:text-primary"><Icon name="Edit" size={18} /></button>
                                        <button onClick={() => setConfirmDeleteId(user.id)} className="p-2 text-text-secondary hover:text-danger"><Icon name="Trash2" size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}>
                <UserForm user={editingUser} onSave={handleSaveUser} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => handleDeleteUser(confirmDeleteId)}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita e é irreversível."
            />
        </div>
    );
};

const PlaceholderPage = ({ title }) => (
  <div>
    <h1 className="text-3xl font-bold text-text-primary mb-6">{title}</h1>
    <div className="bg-surface rounded-lg border border-border-color p-16 text-center">
      <p className="text-text-secondary">Funcionalidade em desenvolvimento.</p>
    </div>
  </div>
);


// --- ROUTING (UNCHANGED) ---
const Router = () => {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const routes = {
    '#/': <Dashboard />,
    '#/risks': <RisksPage />,
    '#/assets': <AssetsPage />,
    '#/threats': <ThreatsPage />,
    '#/controls': <ControlsPage />,
    '#/users': <UsersPage />,
    '#/settings': <SettingsPage />,
  };
  
  return routes[hash] || routes['#/'];
};

// --- AUTH AND INITIALIZATION FLOW (REFACTORED) ---
const Login = () => {
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
                        <label className="text-sm font-bold text-gray-400 block">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 mt-1 text-gray-300 bg-background border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-400 block">Senha</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 mt-1 text-gray-300 bg-background border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
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

const SetupWizard = ({ onSetupComplete }) => {
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

const App = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(localStorage.getItem('isSetupComplete') === 'true');
  const { isAuthenticated, isLoading } = useAuth();
  const { isDbReady } = useDb();

  if (!isSetupComplete) {
      return <SetupWizard onSetupComplete={() => { setIsSetupComplete(true); window.location.reload(); }} />;
  }
  
  if (!isDbReady || isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-text-primary">
            <Spinner />
            <p className="mt-4">Carregando...</p>
        </div>
    );
  }

  return isAuthenticated ? <Layout><Router /></Layout> : <Login />;
};

// --- RENDER ---
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ToastProvider>
        <DbProvider>
            <ThemeProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </ThemeProvider>
        </DbProvider>
      </ToastProvider>
    </React.StrictMode>
  );
}
