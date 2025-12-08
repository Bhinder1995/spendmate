import React, { useState } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { Trash2, Search, Filter, Pencil, RefreshCw, Square, CheckSquare, Calendar, ChevronDown, Tag } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkUpdateCategory: (ids: string[], category: ExpenseCategory) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete, onEdit, onBulkDelete, onBulkUpdateCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  
  // Selection State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Filter Logic
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.merchant.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || e.category === filterCategory;
    const matchesStart = !dateRange.start || e.date >= dateRange.start;
    const matchesEnd = !dateRange.end || e.date <= dateRange.end;
    
    return matchesSearch && matchesCategory && matchesStart && matchesEnd;
  }).sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortOrder === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortOrder === 'highest') return b.amount - a.amount;
    if (sortOrder === 'lowest') return a.amount - b.amount;
    return 0;
  });

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredExpenses.length && filteredExpenses.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredExpenses.map(e => e.id)));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedItems.size} expenses?`)) {
      onBulkDelete(Array.from(selectedItems));
      setSelectedItems(new Set());
    }
  };

  const handleBulkCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value as ExpenseCategory;
    if (cat) {
      onBulkUpdateCategory(Array.from(selectedItems), cat);
      setSelectedItems(new Set());
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search merchants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
             <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <input 
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full sm:w-32 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-full sm:w-32 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
             </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4 w-full">
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full sm:w-40 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="All">All Categories</option>
                {Object.values(ExpenseCategory).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <span className="text-sm text-slate-500 dark:text-slate-400">Sort:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full sm:w-32 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bulk Action Bar - Sticky when items selected */}
      {selectedItems.size > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 p-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-sm text-indigo-900 dark:text-indigo-200 font-medium px-2">
            <CheckSquare className="w-4 h-4" />
            {selectedItems.size} selected
          </div>
          <div className="flex items-center gap-2">
             <div className="relative">
                <select 
                  onChange={handleBulkCategoryChange}
                  value="" 
                  className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
                >
                  <option value="" disabled>Move to...</option>
                   {Object.values(ExpenseCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Tag className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
             </div>
             
             <button 
               onClick={handleBulkDelete}
               className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
             >
               <Trash2 className="w-4 h-4" />
               Delete
             </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="flex items-center justify-center text-slate-400 hover:text-indigo-600">
                    {selectedItems.size === filteredExpenses.length && filteredExpenses.length > 0 ? 
                      <CheckSquare className="w-5 h-5" /> : 
                      <Square className="w-5 h-5" />
                    }
                  </button>
                </th>
                <th className="px-6 py-3 w-32">Date</th>
                <th className="px-6 py-3">Merchant</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedItems.has(expense.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelection(expense.id)} className={`flex items-center justify-center ${selectedItems.has(expense.id) ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'}`}>
                        {selectedItems.has(expense.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{expense.date}</td>
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                         {expense.merchant}
                         {expense.isRecurring && (
                           <span title="Recurring Expense">
                             <RefreshCw className="w-3 h-3 text-indigo-500" />
                           </span>
                         )}
                      </div>
                      {expense.notes && <p className="text-xs text-slate-400 dark:text-slate-500 font-normal truncate max-w-[150px]">{expense.notes}</p>}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${expense.category === 'Food' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 
                          expense.category === 'Transport' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                          expense.category === 'Travel' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' :
                          expense.category === 'Utilities' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                          expense.category === 'Entertainment' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                          expense.category === 'Health' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                          expense.category === 'Shopping' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-slate-100">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(expense)}
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1"
                          title="Edit expense"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    No expenses found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};