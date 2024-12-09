import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useLocation } from 'react-router-dom';
const EXPENSE_PROJECT_KEY = 'expense_selected_project';

interface Project {
  id: string;
  title: string;
}

interface ProjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ value, onChange }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Проверяем, есть ли в state projectTitle
        const state = location.state as { projectTitle?: string };
        
        // Если есть projectTitle в state, сохраняем его
        if (state?.projectTitle === 'Общ Расх') {
          localStorage.setItem(EXPENSE_PROJECT_KEY, 'true');
        }

        // Проверяем наличие сохраненного projectTitle
        const hasStoredProject = localStorage.getItem(EXPENSE_PROJECT_KEY);
        if (state?.projectTitle === 'Общ Расх' || hasStoredProject) {
          // Если projectTitle === 'Общ Расх', загружаем только категорию "Общ Расх" из склада
          const q = query(
            collection(db, 'categories'),
            where('title', '==', 'Общ Расх'),
            where('row', '==', 4)
          );
          
          const snapshot = await getDocs(q);
          const projectsData = snapshot.docs
            .map(doc => ({
              id: doc.id,
              title: doc.data().title,
              isVisible: doc.data().isVisible
            }))
            .filter(project => project.isVisible !== false);
          
          setProjects(projectsData);
        } else {
          // Иначе загружаем все категории проектов
          const q = query(collection(db, 'categories'), where('row', '==', 3));
        
          const snapshot = await getDocs(q);
          const projectsData = snapshot.docs
            .map(doc => ({
              id: doc.id,
              title: doc.data().title,
              isVisible: doc.data().isVisible
            }))
            .filter(project => project.isVisible !== false)
            .sort((a, b) => a.title.localeCompare(b.title));
        
          setProjects(projectsData);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [location.state]);

  // Очищаем localStorage при успешной отправке
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Не очищаем localStorage при обновлении страницы
      if (!document.hidden) {
        localStorage.removeItem(EXPENSE_PROJECT_KEY);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
        loading ? 'bg-gray-50' : 'bg-white'
      }`}
      disabled={loading}
    >
      <option value="">{loading ? 'Загрузка проектов...' : 'Выберите проект'}</option>
      {projects.map(project => (
        <option key={project.id} value={project.id}>
          {project.title}
        </option>
      ))}
    </select>
  );
};