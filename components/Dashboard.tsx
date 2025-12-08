import React, { useMemo, useState } from 'react';
import { Expense, CategoryBudgets, ExpenseCategory } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Sparkles, Download, Plus, Target, Edit2, Check, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react';

interface DashboardProps {
  expenses: Expense[];
  budget: number;
  categoryBudgets: CategoryBudgets;
  onUpdateBudget: (amount: number) => void;
  onUpdateCategoryBudget: (category: ExpenseCategory, amount: number) => void;
  aiInsight?: string | null;
  onGenerateInsights?: () => void;
  insightLoading?: boolean;
  onAddClick?: () => void;
}

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#64748b', '#06b6d4'];

export const Dashboard: React.FC<DashboardProps> = ({ 
  expenses, 
  budget,
  categoryBudgets,
  onUpdateBudget,
  onUpdateCategoryBudget,
  aiInsight, 
  onGenerateInsights, 
  insightLoading = false,
  onAddClick 
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget.toString());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempCatBudget, setTempCatBudget] = useState('');
  
  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = expenses.length;
    const avg = count > 0 ? total / count : 0;
    
    // Group by category
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const categoryData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Group by Month (Last 6 months)
    const monthTotals: Record<string, number> = {};
    expenses.forEach(e => {
      const month = new Date(e.date).toLocaleString('default', { month: 'short' });
      monthTotals[month] = (monthTotals[month] || 0) + e.amount;
    });
    
    // Sort months roughly for display - simple approach
    const monthData = Object.entries(monthTotals).map(([name, value]) => ({ name, value }));

    return { total, count, avg, categoryData, monthData, categoryTotals };
  }, [expenses]);

  const handlePrint = () => {
    setShowExportMenu(false);
    window.print();
  };

  const handleExportCSV = () => {
    setShowExportMenu(false);
    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Recurring', 'Notes'];
    const rows = expenses.map(e => [
      e.date, 
      `"${e.merchant.replace(/"/g, '""')}"`, 
      e.category, 
      e.amount.toFixed(2), 
      e.isRecurring ? 'Yes' : 'No',
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `spendmate_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveBudget = () => {
    const val = parseFloat(tempBudget);
    if (!isNaN(val) && val > 0) {
      onUpdateBudget(val);
    }
    setIsEditingBudget(false);
  };

  const saveCategoryBudget = (category: string) => {
    const val = parseFloat(tempCatBudget);
    if (!isNaN(val)) {
      onUpdateCategoryBudget(category as ExpenseCategory, val);
    } else {
        // If cleared/invalid, maybe remove the limit? For now just keep previous or 0
    }
    setEditingCategory(null);
  }

  const budgetPercentage = Math.min((stats.total / budget) * 100, 100);
  const isOverBudget = stats.total > budget;

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <TrendingUp className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Welcome to SpendMate</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">Start tracking your expenses effortlessly. Use OCR to scan receipts or enter them manually.</p>
        <button 
          onClick={onAddClick}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add First Expense
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print relative">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Financial Overview</h2>
        <div className="flex gap-2 w-full sm:w-auto">
           {onGenerateInsights && (
            <button
              onClick={onGenerateInsights}
              disabled={insightLoading}
              className="flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium shadow-sm hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all flex"
            >
              {insightLoading ? (
                 <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              AI Insights
            </button>
          )}
          
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
                <button 
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-lg flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Export to CSV
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-0"></div>
                <button 
                  onClick={handlePrint}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-b-lg flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  Export to PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spent */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Spent</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">${stats.total.toFixed(2)}</p>
        </div>
        
        {/* Monthly Budget */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Budget</span>
            </div>
            <button 
              onClick={() => setIsEditingBudget(!isEditingBudget)}
              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {isEditingBudget ? <Check className="w-4 h-4" onClick={saveBudget} /> : <Edit2 className="w-4 h-4" />}
            </button>
          </div>
          {isEditingBudget ? (
            <input 
              type="number" 
              value={tempBudget}
              onChange={(e) => setTempBudget(e.target.value)}
              className="w-full text-2xl font-bold bg-transparent border-b border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
              autoFocus
              onBlur={saveBudget}
              onKeyDown={(e) => e.key === 'Enter' && saveBudget()}
            />
          ) : (
             <div className="space-y-2">
               <div className="flex justify-between items-baseline">
                 <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                   ${budget.toLocaleString()}
                 </p>
                 <span className="text-xs text-slate-500">{(budgetPercentage).toFixed(0)}% used</span>
               </div>
               <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                 <div 
                   className={`h-2 rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : budgetPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                   style={{ width: `${budgetPercentage}%` }}
                 ></div>
               </div>
             </div>
          )}
        </div>

        {/* Transactions */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Transactions</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.count}</p>
        </div>

        {/* Average */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Average / Txn</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">${stats.avg.toFixed(2)}</p>
        </div>
      </div>

      {/* AI Insights Section */}
      {aiInsight && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm card transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Gemini AI Analysis</h3>
          </div>
          <p className="text-indigo-800 dark:text-indigo-200 leading-relaxed text-sm md:text-base">{aiInsight}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 break-inside-avoid">
        {/* Category Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center card transition-colors">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 self-start">Spending by Category</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', borderColor: 'var(--tooltip-border, #e2e8f0)', borderRadius: '8px', color: 'var(--tooltip-text, #1e293b)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Budget Progress */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card transition-colors overflow-y-auto max-h-[350px]">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Category Budgets</h3>
          <div className="space-y-4">
            {Object.values(ExpenseCategory).map((cat) => {
              const spent = stats.categoryTotals[cat] || 0;
              const limit = categoryBudgets[cat] || 0;
              const hasBudget = limit > 0;
              const percent = hasBudget ? Math.min((spent / limit) * 100, 100) : 0;
              const isOver = spent > limit;

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        ${spent.toFixed(0)} / 
                      </span>
                      {editingCategory === cat ? (
                         <div className="flex items-center gap-1">
                           <input 
                             type="number" 
                             className="w-16 p-1 text-right text-xs border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                             value={tempCatBudget}
                             onChange={(e) => setTempCatBudget(e.target.value)}
                             autoFocus
                             onBlur={() => saveCategoryBudget(cat)}
                             onKeyDown={(e) => e.key === 'Enter' && saveCategoryBudget(cat)}
                           />
                         </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setEditingCategory(cat);
                            setTempCatBudget(categoryBudgets[cat]?.toString() || '');
                          }}
                          className={`text-xs hover:underline ${hasBudget ? 'text-slate-700 dark:text-slate-300' : 'text-indigo-500 italic'}`}
                        >
                          {hasBudget ? `$${limit}` : 'Set Limit'}
                        </button>
                      )}
                    </div>
                  </div>
                  {hasBudget && (
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${isOver ? 'bg-red-500' : percent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Print Only Summary Table */}
      <div className="print-only mt-8">
        <h3 className="text-xl font-bold mb-4">Expense Report</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="py-2">Date</th>
              <th className="py-2">Merchant</th>
              <th className="py-2">Category</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(exp => (
              <tr key={exp.id} className="border-b border-slate-100">
                <td className="py-2">{exp.date}</td>
                <td className="py-2">{exp.merchant}</td>
                <td className="py-2">{exp.category}</td>
                <td className="py-2 text-right">${exp.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};