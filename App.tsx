import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseForm } from './components/ExpenseForm';
import { Expense, CategoryBudgets, ExpenseCategory } from './types';
import { generateInsights } from './services/geminiService';
import { Loader2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'gemini-expenses-data';
const THEME_STORAGE_KEY = 'spendmate-theme';
const BUDGET_STORAGE_KEY = 'spendmate-budget';
const CAT_BUDGET_STORAGE_KEY = 'spendmate-cat-budgets';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'list' | 'add'>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  
  // Budget State
  const [budget, setBudget] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(BUDGET_STORAGE_KEY);
      return saved ? parseFloat(saved) : 2000;
    }
    return 2000;
  });

  // Category Budget State
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudgets>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(CAT_BUDGET_STORAGE_KEY);
      try {
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Edit State
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(THEME_STORAGE_KEY)) {
      return localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Persist Budgets
  useEffect(() => {
    localStorage.setItem(BUDGET_STORAGE_KEY, budget.toString());
  }, [budget]);

  useEffect(() => {
    localStorage.setItem(CAT_BUDGET_STORAGE_KEY, JSON.stringify(categoryBudgets));
  }, [categoryBudgets]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Load Expenses
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setExpenses(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse expenses", e);
      }
    }
    setLoading(false);
  }, []);

  // Save Expenses
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expenses));
    }
  }, [expenses, loading]);

  const handleSaveExpense = (expense: Expense) => {
    if (editingExpense) {
      setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
      setEditingExpense(undefined);
    } else {
      setExpenses(prev => [expense, ...prev]);
    }
    setView('list');
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const bulkDeleteExpenses = (ids: string[]) => {
    setExpenses(prev => prev.filter(e => !ids.includes(e.id)));
  };

  const bulkUpdateCategory = (ids: string[], category: ExpenseCategory) => {
    setExpenses(prev => prev.map(e => ids.includes(e.id) ? { ...e, category } : e));
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setView('add');
  };

  const handleViewChange = (newView: 'dashboard' | 'list' | 'add') => {
    setView(newView);
    if (newView !== 'add') {
      setEditingExpense(undefined);
    }
  };

  const handleGetInsights = async () => {
    if (expenses.length === 0) return;
    setInsightLoading(true);
    try {
      const insight = await generateInsights(expenses);
      setAiInsight(insight);
    } catch (error) {
      console.error(error);
      setAiInsight("Failed to generate insights. Please check your API key and try again.");
    } finally {
      setInsightLoading(false);
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return (
          <Dashboard 
            expenses={expenses} 
            budget={budget}
            categoryBudgets={categoryBudgets}
            onUpdateBudget={setBudget}
            onUpdateCategoryBudget={(cat, amount) => setCategoryBudgets(prev => ({...prev, [cat]: amount}))}
            aiInsight={aiInsight}
            onGenerateInsights={handleGetInsights}
            insightLoading={insightLoading}
            onAddClick={() => setView('add')}
          />
        );
      case 'list':
        return (
          <ExpenseList 
            expenses={expenses} 
            onDelete={deleteExpense}
            onEdit={handleEditExpense}
            onBulkDelete={bulkDeleteExpenses}
            onBulkUpdateCategory={bulkUpdateCategory}
          />
        );
      case 'add':
        return (
          <ExpenseForm 
            initialData={editingExpense}
            onSave={handleSaveExpense} 
            onCancel={() => handleViewChange('dashboard')} 
          />
        );
      default:
        return <Dashboard 
          expenses={expenses} 
          budget={budget} 
          categoryBudgets={categoryBudgets}
          onUpdateBudget={setBudget} 
          onUpdateCategoryBudget={(cat, amount) => setCategoryBudgets(prev => ({...prev, [cat]: amount}))}
        />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <Layout 
      currentView={view} 
      onViewChange={handleViewChange}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      {renderContent()}
    </Layout>
  );
}