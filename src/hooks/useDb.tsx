import { useContext } from 'react';
import { DbContext } from '../contexts/DbContext';

export const useDb = () => useContext(DbContext);
