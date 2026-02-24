import { useState } from "react";
import { startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimelineTasks, type TimelineTask } from "@/hooks/useTimelineTasks";
import { TimelineDayView } from "./TimelineDayView";
import { TimelineWeekView } from "./TimelineWeekView";
import { AddTimelineTaskModal } from "./AddTimelineTaskModal";
import { EditTimelineTaskModal } from "./EditTimelineTaskModal";

interface Props {
  open: boolean;
  onClose: () => void;
}

type ViewMode = 'day' | 'week';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'study', label: '📚' },
  { id: 'sport', label: '💪' },
  { id: 'personal', label: '🏦' },
];

export const TimelineFullScreen = ({ open, onClose }: Props) => {
  const { tasks, createTask, toggleComplete, updateTask, deleteTask } = useTimelineTasks();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { locale: fr, weekStartsOn: 1 }));
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDate, setAddModalDate] = useState<Date | undefined>();
  const [addModalHour, setAddModalHour] = useState<number | undefined>();
  const [editingTask, setEditingTask] = useState<TimelineTask | null>(null);

  const handleAddTask = (hour?: number, date?: Date) => {
    setAddModalDate(date || (viewMode === 'day' ? selectedDate : undefined));
    setAddModalHour(hour);
    setShowAddModal(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[999]"
            onClick={onClose}
          />

          {/* Full screen panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 top-0 bg-background z-[1000] flex flex-col rounded-t-3xl overflow-hidden"
            style={{ marginTop: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 flex-shrink-0">
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/50">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <h2 className="font-display font-bold text-foreground">Timeline</h2>
              <div className="flex items-center gap-1">
                {/* View toggle */}
                <div className="flex bg-muted/50 rounded-xl p-0.5">
                  <button
                    onClick={() => setViewMode('day')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      viewMode === 'day' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Jour
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      viewMode === 'week' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Sem
                  </button>
                </div>
                <button onClick={() => handleAddTask()} className="p-2 rounded-xl hover:bg-muted/50 ml-1">
                  <Plus className="w-5 h-5 text-primary" />
                </button>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 px-4 py-2 flex-shrink-0">
              {CATEGORY_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    categoryFilter === f.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {viewMode === 'day' ? (
                <TimelineDayView
                  tasks={tasks}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  onAddTask={handleAddTask}
                  onTaskClick={setEditingTask}
                  onToggleComplete={toggleComplete}
                  categoryFilter={categoryFilter}
                />
              ) : (
                <TimelineWeekView
                  tasks={tasks}
                  weekStart={weekStart}
                  onWeekChange={setWeekStart}
                  onTaskClick={setEditingTask}
                  onAddTask={handleAddTask}
                  categoryFilter={categoryFilter}
                />
              )}
            </div>
          </motion.div>

          {/* Modals */}
          <AddTimelineTaskModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={createTask}
            defaultDate={addModalDate}
            defaultHour={addModalHour}
          />

          <EditTimelineTaskModal
            open={!!editingTask}
            onClose={() => setEditingTask(null)}
            task={editingTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        </>
      )}
    </AnimatePresence>
  );
};
