import React from 'react';
import {
  ChevronDown, X, Sidebar as SidebarIcon, Home, Shield, Database, AlertTriangle, ChevronsUpDown, Settings, Users, LogOut, PlusCircle, Edit, Trash2, Eye, Sun, Moon, CheckCircle, AlertCircle, Info, Copy
} from 'lucide-react';

// --- TYPES AND INTERFACES ---
interface IconProps {
  name: string;
  [key: string]: any;
}

// --- ICONS WRAPPER ---
export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const LucideIcon = {
    ChevronDown, X, SidebarIcon, Home, Shield, Database, AlertTriangle, ChevronsUpDown, Settings, Users, LogOut, PlusCircle, Edit, Trash2, Eye, Sun, Moon, CheckCircle, AlertCircle, Info, Copy
  }[name];
  return LucideIcon ? <LucideIcon {...props} /> : null;
};
