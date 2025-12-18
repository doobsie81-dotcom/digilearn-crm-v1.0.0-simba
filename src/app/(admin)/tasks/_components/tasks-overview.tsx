'use client';
import React, { useState } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,

  X,
} from 'lucide-react';
import TaskView from '~/components/tasks-view';
import { trpc } from '~/trpc/client';


// Main component
const TaskListComponent = () => {
  // In real implementation, replace with: const { data = [] } = trpc.task.getTasks.useQuery({});
  //const utils = trpc.useUtils();
  const [tasks] = trpc.tasks.getTasks.useSuspenseQuery({
    limit: 50,
    offset: 1
  })
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);


  const toggleFilter = (filterType: 'status' | 'type', value: string) => {
    if (filterType === 'status') {
      setStatusFilter((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    } else {
      setTypeFilter((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    }
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setTypeFilter([]);
    setGlobalFilter('');
  };

  const activeFilterCount = statusFilter.length + typeFilter.length + (globalFilter ? 1 : 0);

  return (
    <div className="w-full h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tasks</h1>
          <p className="text-gray-600">Manage and track your tasks across leads and deals</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
          <div className="p-4 flex items-center gap-3 border-b border-gray-200">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Filter Panel (Notion style) */}
          {showFilters && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="space-y-2">
                    {['todo', 'in-progress', 'done', 'backlog'].map((status) => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={statusFilter.includes(status)}
                          onChange={() => toggleFilter('status', status)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">
                          {status === 'in-progress' ? 'In Progress' : status}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference Type</label>
                  <div className="space-y-2">
                    {['lead', 'deal'].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={typeFilter.includes(type)}
                          onChange={() => toggleFilter('type', type)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(statusFilter.length > 0 || typeFilter.length > 0) && (
            <div className="px-4 py-3 flex flex-wrap gap-2">
              {statusFilter.map((status) => (
                <span
                  key={status}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-medium"
                >
                  Status: {status === 'in-progress' ? 'In Progress' : status}
                  <button
                    onClick={() => toggleFilter('status', status)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              {typeFilter.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md text-sm font-medium"
                >
                  Type: {type}
                  <button
                    onClick={() => toggleFilter('type', type)}
                    className="hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <TaskView tasks={tasks || []}/>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default TaskListComponent;